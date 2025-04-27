import { Request, Response } from 'express';
import annotationService from '../services/annotationService';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * @desc Get an annotation for a specific lyric line
 * @route GET /api/annotations/track/:trackId
 * @access Public
 */
export const getAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;
    const { line } = req.query;
    
    if (!line || typeof line !== 'string') {
      res.status(400).json({ 
        success: false, 
        message: 'Необходимо указать строку текста песни (параметр line)' 
      });
      return;
    }

    // Всегда запрашиваем новую аннотацию от Gemini API
    const annotation = await annotationService.getAnnotation(trackId, line);
    
    res.json({
      success: true,
      annotation
    });
  } catch (error: any) {
    logger.error(`Error getting annotation: ${error.message}`);
    
    res.status(error.message === 'Track not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Произошла ошибка при получении аннотации'
    });
  }
};

/**
 * @desc Explain a specific lyric line in the context of the full lyrics
 * @route POST /api/annotations/explain
 * @access Public
 */
export const explainLyric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lyricLine, fullLyrics, artist, trackTitle } = req.body;
    
    // Проверяем наличие всех обязательных полей
    if (!lyricLine || !artist || !trackTitle) {
      res.status(400).json({
        success: false,
        message: 'Необходимо указать строку текста (lyricLine), исполнителя (artist) и название песни (trackTitle)'
      });
      return;
    }

    // Используем сервис для получения объяснения от Gemini API
    const explanationText = await annotationService.explainLyric(
      lyricLine,
      trackTitle,
      artist,
      fullLyrics || ''
    );
    
    res.json({
      success: true,
      annotation: {
        text: explanationText,
        generated: true
      }
    });
  } catch (error: any) {
    logger.error(`Error explaining lyric: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Произошла ошибка при генерации объяснения'
    });
  }
};

/**
 * @desc Vote on an annotation (upvote or downvote)
 * @route POST /api/annotations/:annotationId/vote
 * @access Public
 */
export const voteOnAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { annotationId } = req.params;
    const { vote } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(annotationId)) {
      res.status(400).json({
        success: false,
        message: 'Неверный формат ID аннотации'
      });
      return;
    }
    
    if (vote !== 'upvote' && vote !== 'downvote') {
      res.status(400).json({
        success: false,
        message: 'Параметр vote должен быть "upvote" или "downvote"'
      });
      return;
    }
    
    const updatedAnnotation = await annotationService.voteOnAnnotation(
      annotationId, 
      vote as 'upvote' | 'downvote'
    );
    
    res.json({
      success: true,
      annotation: updatedAnnotation
    });
  } catch (error: any) {
    logger.error(`Error voting on annotation: ${error.message}`);
    
    res.status(error.message === 'Annotation not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Произошла ошибка при голосовании'
    });
  }
}; 