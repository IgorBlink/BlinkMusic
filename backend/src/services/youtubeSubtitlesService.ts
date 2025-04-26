import axios from 'axios';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';
import { google } from 'googleapis';

// Получаем ключ API из переменных окружения
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_API_KEY
});

export interface LyricsLine {
  text: string;
  startTime: number; // в миллисекундах
  endTime: number;   // в миллисекундах
}

export class YouTubeSubtitlesService {
  /**
   * Получает ID видео из YouTube URL
   */
  extractVideoId(youtubeUrl: string): string | null {
    try {
      const url = new URL(youtubeUrl);
      let videoId = null;
      
      if (url.hostname.includes('youtube.com')) {
        videoId = url.searchParams.get('v');
      } else if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.substring(1);
      }
      
      return videoId;
    } catch (error) {
      logger.error(`Error extracting YouTube video ID: ${error}`);
      return null;
    }
  }

  /**
   * Получает список доступных субтитров для видео
   */
  async getAvailableCaptions(videoId: string): Promise<any[]> {
    try {
      const response = await youtube.captions.list({
        part: ['snippet'],
        videoId: videoId
      });
      
      return response.data.items || [];
    } catch (error) {
      logger.error(`Error getting captions list for video ${videoId}: ${error}`);
      return [];
    }
  }

  /**
   * Получает субтитры из видео с помощью YouTube API
   * Возвращает массив строк с таймкодами
   */
  async getLyricsWithTimestamps(youtubeUrl: string): Promise<LyricsLine[]> {
    try {
      const videoId = this.extractVideoId(youtubeUrl);
      
      if (!videoId) {
        logger.error(`Invalid YouTube URL: ${youtubeUrl}`);
        return [];
      }
      
      logger.info(`Getting lyrics from YouTube video: ${videoId}`);
      
      // Вариант 1: Через официальный API (требует OAuth и дополнительных прав)
      // Этот метод сложнее, так как требует дополнительной авторизации
      
      // Вариант 2: Парсинг через открытый API timedtext
      // Это проще и часто работает для видео с автоматическими субтитрами
      try {
        const response = await axios.get(`https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`);
        
        if (response.data && response.data.events) {
          return response.data.events
            .filter((event: any) => event.segs && event.segs.length > 0)
            .map((event: any) => ({
              text: event.segs.map((seg: any) => seg.utf8).join(' ').trim(),
              startTime: event.tStartMs,
              endTime: event.tStartMs + event.dDurationMs
            }))
            .filter((line: LyricsLine) => line.text && line.text.length > 0);
        }
      } catch (timedTextError) {
        logger.warn(`Error getting timedtext for video ${videoId}: ${timedTextError}`);
        // Продолжаем со следующим методом, если этот не сработал
      }
      
      // Вариант 3: Парсинг через страницу видео (запасной вариант)
      try {
        // Получаем HTML страницы видео
        const videoPageResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        // Ищем данные субтитров в HTML
        const html = videoPageResponse.data;
        const captionsRegex = /"captionTracks":\[(.*?)\]/;
        const match = html.match(captionsRegex);
        
        if (match && match[1]) {
          const captionsData = JSON.parse(`[${match[1]}]`);
          const englishCaptions = captionsData.find((track: any) => 
            track.languageCode === 'en' || track.name?.simpleText?.toLowerCase().includes('english')
          );
          
          if (englishCaptions && englishCaptions.baseUrl) {
            const captionsUrl = englishCaptions.baseUrl;
            const captionsResponse = await axios.get(captionsUrl);
            const $ = cheerio.load(captionsResponse.data, { xmlMode: true });
            
            // Парсим XML субтитров
            const lyrics: LyricsLine[] = [];
            $('text').each((_, element) => {
              const $element = $(element);
              const start = parseFloat($element.attr('start') || '0') * 1000;
              const duration = parseFloat($element.attr('dur') || '0') * 1000;
              const text = $element.text().trim();
              
              if (text) {
                lyrics.push({
                  text,
                  startTime: start,
                  endTime: start + duration
                });
              }
            });
            
            return lyrics;
          }
        }
      } catch (parseError) {
        logger.error(`Error parsing video page for captions: ${parseError}`);
      }
      
      // Если все методы не сработали, возвращаем пустой массив
      logger.warn(`No lyrics found for YouTube video: ${videoId}`);
      return [];
    } catch (error) {
      logger.error(`Error getting lyrics from YouTube: ${error}`);
      return [];
    }
  }

  /**
   * Получает только текст песни без таймкодов
   */
  async getLyricsText(youtubeUrl: string): Promise<string> {
    try {
      const lyricsWithTimestamps = await this.getLyricsWithTimestamps(youtubeUrl);
      
      return lyricsWithTimestamps
        .map(line => line.text)
        .join('\n');
    } catch (error) {
      logger.error(`Error getting lyrics text: ${error}`);
      return '';
    }
  }

  /**
   * Очищает субтитры, удаляя ненужные тэги, лишние пробелы и т.д.
   */
  cleanLyrics(lyrics: LyricsLine[]): LyricsLine[] {
    return lyrics.map(line => ({
      ...line,
      text: line.text
        .replace(/\[.*?\]/g, '') // Удаляем [Music], [Applause] и т.д.
        .replace(/♪/g, '') // Удаляем музыкальные ноты
        .replace(/\s+/g, ' ') // Заменяем множественные пробелы одним
        .trim()
    }))
    .filter(line => line.text.length > 0); // Удаляем пустые строки
  }
}

// Экспортируем экземпляр сервиса для использования в других модулях
export const youtubeSubtitlesService = new YouTubeSubtitlesService(); 