import axios from 'axios';
import mongoose from 'mongoose';
import { Annotation, IAnnotation } from '../models/Annotation';
import Track from '../models/Track';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import { youtubeSubtitlesService } from './youtubeSubtitlesService';

dotenv.config();

/**
 * Service for managing annotations for song lyrics
 */
class AnnotationService {
  private geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private apiKey = process.env.GEMINI_API_KEY;

  /**
   * Get an annotation for a specific lyric line of a track
   * @param trackId - The ID of the track
   * @param lyricLine - The specific line of lyrics to annotate
   * @returns The annotation for the lyric line
   */
  async getAnnotation(trackId: string, lyricLine: string): Promise<IAnnotation | null> {
    try {
      // Check if the track exists
      const trackExists = await Track.exists({ _id: new mongoose.Types.ObjectId(trackId) });
      if (!trackExists) {
        throw new Error('Track not found');
      }

      // Get track details for context
      const track = await Track.findById(trackId).select('title artist album audioUrl').lean();
      
      if (!track) {
        throw new Error('Track not found');
      }

      // Try to get lyrics from track's YouTube URL if available
      let contextLyrics = '';
      if (track.audioUrl && track.audioUrl.includes('youtube.com')) {
        // Extract YouTube video ID from the URL
        const videoId = this.extractVideoId(track.audioUrl);
        if (videoId) {
          // Get lyrics from YouTube captions
          contextLyrics = await youtubeSubtitlesService.getLyricsText(track.audioUrl);
        }
      }

      // Generate annotation using Gemini API
      const generatedText = await this.generateAnnotationWithGemini(
        lyricLine, 
        track.title || '', 
        track.artist || '',
        contextLyrics
      );

      // Create and save the new annotation
      const annotation = new Annotation({
        trackId: new mongoose.Types.ObjectId(trackId),
        lyricLine,
        annotation: generatedText,
        generated: true
      });

      await annotation.save();
      logger.info(`Created new annotation for track ${trackId}`);
      
      return annotation;
    } catch (error: any) {
      logger.error(`Error getting annotation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Explain a specific lyric line in the context of full lyrics
   * @param lyricLine - The specific line to explain
   * @param trackTitle - The title of the song
   * @param artist - The artist/performer name
   * @param fullLyrics - The complete lyrics of the song for context
   * @returns Explanation of the lyric line in Russian
   */
  async explainLyric(
    lyricLine: string,
    trackTitle: string,
    artist: string,
    fullLyrics: string
  ): Promise<string> {
    try {
      logger.info(`Generating explanation for line "${lyricLine}" from "${trackTitle}" by ${artist}`);
      
      // Используем метод generateAnnotationWithGemini для создания объяснения строки
      const explanation = await this.generateAnnotationWithGemini(
        lyricLine,
        trackTitle,
        artist,
        fullLyrics
      );
      
      return explanation;
    } catch (error: any) {
      logger.error(`Error explaining lyric: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add a vote to an annotation
   * @param annotationId - The ID of the annotation
   * @param voteType - 'upvote' or 'downvote'
   * @returns The updated annotation
   */
  async voteOnAnnotation(annotationId: string, voteType: 'upvote' | 'downvote'): Promise<IAnnotation | null> {
    try {
      const update = voteType === 'upvote' 
        ? { $inc: { upvotes: 1 } } 
        : { $inc: { downvotes: 1 } };

      const annotation = await Annotation.findByIdAndUpdate(
        annotationId,
        update,
        { new: true }
      );

      if (!annotation) {
        throw new Error('Annotation not found');
      }

      logger.info(`Added ${voteType} to annotation ${annotationId}`);
      return annotation;
    } catch (error: any) {
      logger.error(`Error voting on annotation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate annotation using Google Gemini API
   * @param lyricLine - The lyric line to annotate
   * @param trackTitle - The title of the track
   * @param artist - The artist of the track
   * @param contextLyrics - Optional fuller lyrics context
   * @returns The generated annotation text
   */
  private async generateAnnotationWithGemini(
    lyricLine: string, 
    trackTitle: string, 
    artist: string,
    contextLyrics: string = ''
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in the environment variables');
      }

      const prompt = this.createAnnotationPrompt(lyricLine, trackTitle, artist, contextLyrics);
      
      logger.info(`Sending request to Gemini API for annotation of "${lyricLine}"`);
      
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the generated text from the response
      const generatedText = response.data.candidates[0]?.content?.parts[0]?.text;
      
      if (!generatedText) {
        logger.error(`Gemini API response without text: ${JSON.stringify(response.data)}`);
        throw new Error('Failed to generate annotation');
      }

      logger.info(`Successfully received annotation from Gemini API`);
      return generatedText;
    } catch (error: any) {
      if (error.response) {
        // Логируем детали ответа API
        logger.error(`Gemini API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      logger.error(`Error generating annotation with Gemini: ${error.message}`);
      
      throw new Error('Не удалось сгенерировать аннотацию. Пожалуйста, попробуйте позже.');
    }
  }

  /**
   * Create a prompt for the Gemini API to generate an annotation
   * @param lyricLine - The lyric line to annotate
   * @param trackTitle - The title of the track
   * @param artist - The artist of the track
   * @param contextLyrics - Optional fuller lyrics context
   * @returns The formatted prompt
   */
  private createAnnotationPrompt(
    lyricLine: string, 
    trackTitle: string, 
    artist: string,
    contextLyrics: string = ''
  ): string {
    let prompt = `
Ты — эксперт по музыкальным текстам. Дай подробное и проницательное объяснение следующей строки из песни.

Песня: "${trackTitle}" исполнителя ${artist}
Строка из песни: "${lyricLine}"

Твоё объяснение должно:
1. Раскрыть смысл и контекст этой строки
2. Определить метафоры, сравнения или другие литературные приёмы, если они есть
3. Включить релевантные культурные, исторические или личные отсылки, связанные с исполнителем, которые могут быть связаны с этой строкой
4. По возможности, упомянуть, как эта строка связана с общей темой песни

Объяснение должно быть кратким (максимум 4-5 предложений), информативным и интересным для поклонников музыки.
Пиши ответ ТОЛЬКО на русском языке.
Максимум 100 символов!
`;

    // Add context lyrics if available
    if (contextLyrics) {
      prompt += `\n\nВот полный текст песни для контекста:\n${contextLyrics}\n`;
    }

    return prompt;
  }

  /**
   * Extract the YouTube video ID from a URL
   * @param url - The YouTube URL
   * @returns The video ID or null if not found
   */
  private extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}

export default new AnnotationService(); 