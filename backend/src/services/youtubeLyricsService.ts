import axios from 'axios';
import { google } from 'googleapis';
import { logger } from '../utils/logger';
import SyncedLyrics, { ISyncedLyricsLine } from '../models/SyncedLyrics';
import mongoose from 'mongoose';

// Ключ API Google должен быть указан в .env
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

export class YouTubeLyricsService {
  private youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY
  });

  /**
   * Ищет видео на YouTube по исполнителю и названию трека
   */
  async findVideoIdForTrack(artist: string, title: string): Promise<string | null> {
    try {
      logger.info(`Searching YouTube video for "${title}" by "${artist}"`);
      
      // Формируем поисковый запрос
      const query = `${artist} ${title} lyrics`;
      
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults: 5,
        type: ['video'],
        videoCaption: 'closedCaption', // Ищем только видео с субтитрами
        relevanceLanguage: 'en' // Предпочитаем английский язык
      });
      
      if (response.data.items && response.data.items.length > 0) {
        // Берем первое найденное видео
        const videoId = response.data.items[0].id?.videoId || null;
        logger.info(`Found YouTube video ID: ${videoId}`);
        return videoId;
      }
      
      logger.info(`No YouTube video found for "${title}" by "${artist}"`);
      return null;
    } catch (error) {
      logger.error(`Error finding YouTube video: ${error}`);
      return null;
    }
  }

  /**
   * Получает список доступных субтитров для видео
   */
  async getCaptionsForVideo(videoId: string): Promise<any[]> {
    try {
      const response = await this.youtube.captions.list({
        part: ['snippet'],
        videoId: videoId
      });
      
      return response.data.items || [];
    } catch (error) {
      logger.error(`Error getting captions: ${error}`);
      return [];
    }
  }

  /**
   * Скачивает и парсит субтитры для видео
   * Примечание: скачивание субтитров через официальный API требует OAuth,
   * поэтому используем альтернативный метод
   */
  async getSubtitlesForVideo(videoId: string, lang = 'en'): Promise<ISyncedLyricsLine[] | null> {
    try {
      // Используем публичное API для получения субтитров в формате SRT/WebVTT
      // Обратите внимание, что это неофициальный API и может быть нестабильным
      const captionUrl = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=srv3`;
      
      const response = await axios.get(captionUrl);
      const subtitles = this.parseSubtitles(response.data);
      
      if (subtitles && subtitles.length > 0) {
        logger.info(`Successfully retrieved subtitles for video ${videoId}`);
        return subtitles;
      }
      
      logger.info(`No subtitles found for video ${videoId}`);
      return null;
    } catch (error) {
      logger.error(`Error getting subtitles: ${error}`);
      return null;
    }
  }

  /**
   * Парсит субтитры из формата WebVTT/SRT/XML
   */
  private parseSubtitles(subtitleContent: string): ISyncedLyricsLine[] {
    try {
      // Простой парсер для XML субтитров YouTube
      const lines: ISyncedLyricsLine[] = [];
      
      // Регулярное выражение для извлечения времени и текста из XML
      const regex = /<text start="([\d.]+)" dur="([\d.]+)">(.*?)<\/text>/g;
      let match;
      
      while ((match = regex.exec(subtitleContent)) !== null) {
        const startTime = parseFloat(match[1]) * 1000; // Конвертируем в миллисекунды
        const duration = parseFloat(match[2]) * 1000;
        const endTime = startTime + duration;
        const text = this.decodeHtmlEntities(match[3]).trim();
        
        // Пропускаем пустые строки
        if (text) {
          lines.push({
            startTime,
            endTime,
            text
          });
        }
      }
      
      return lines;
    } catch (error) {
      logger.error(`Error parsing subtitles: ${error}`);
      return [];
    }
  }

  /**
   * Декодирует HTML-сущности в тексте субтитров
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, ''); // Удаляем HTML-теги
  }

  /**
   * Получает или создает синхронизированный текст для трека
   */
  async getSyncedLyricsForTrack(trackId: string, artist: string, title: string): Promise<ISyncedLyricsLine[] | null> {
    try {
      // Проверяем, есть ли уже сохраненный текст
      const existingLyrics = await SyncedLyrics.findOne({ trackId: new mongoose.Types.ObjectId(trackId) });
      
      if (existingLyrics) {
        logger.info(`Found existing synced lyrics for track ${trackId}`);
        return existingLyrics.lines;
      }
      
      // Ищем видео на YouTube
      const videoId = await this.findVideoIdForTrack(artist, title);
      
      if (!videoId) {
        logger.info(`No video found for "${title}" by "${artist}"`);
        return null;
      }
      
      // Получаем субтитры
      const subtitles = await this.getSubtitlesForVideo(videoId);
      
      if (!subtitles || subtitles.length === 0) {
        logger.info(`No subtitles found for video ${videoId}`);
        return null;
      }
      
      // Сохраняем синхронизированный текст в базу данных
      const newLyrics = new SyncedLyrics({
        trackId: new mongoose.Types.ObjectId(trackId),
        videoId,
        source: 'youtube',
        lines: subtitles
      });
      
      await newLyrics.save();
      logger.info(`Saved synced lyrics for track ${trackId}`);
      
      return subtitles;
    } catch (error) {
      logger.error(`Error getting synced lyrics: ${error}`);
      return null;
    }
  }
}

// Экспортируем экземпляр сервиса
export const youtubeLyricsService = new YouTubeLyricsService(); 