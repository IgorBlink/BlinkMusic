import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import Track from '../models/Track';
import { youtubeLyricsService } from '../services/youtubeLyricsService';
import SyncedLyrics from '../models/SyncedLyrics';
import mongoose from 'mongoose';
import { youtubeSubtitlesService } from '../services/youtubeSubtitlesService';

/**
 * Получение синхронизированного текста песни по ID трека
 */
export const getSyncedLyrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;

    // Проверяем валидность ID трека
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
      res.status(400).json({
        success: false,
        message: 'Неверный формат ID трека'
      });
      return;
    }

    // Ищем трек в базе данных
    const track = await Track.findById(trackId);
    
    if (!track) {
      res.status(404).json({
        success: false,
        message: 'Трек не найден'
      });
      return;
    }

    // Пытаемся получить синхронизированный текст
    const lyrics = await youtubeLyricsService.getSyncedLyricsForTrack(
      trackId, 
      track.artist, 
      track.title
    );

    if (!lyrics || lyrics.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Синхронизированный текст для этого трека не найден'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        trackId,
        artist: track.artist,
        title: track.title,
        lyrics
      }
    });
  } catch (error) {
    logger.error(`Error getting synced lyrics: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при получении синхронизированного текста'
    });
  }
};

/**
 * Обновление синхронизированного текста песни
 * Только для админов
 */
export const updateSyncedLyrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;
    const { lines, language, source = 'user' } = req.body;

    // Проверяем наличие необходимых данных
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Неверный формат данных. Необходим массив строк с таймстемпами'
      });
      return;
    }

    // Проверяем валидность ID трека
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
      res.status(400).json({
        success: false,
        message: 'Неверный формат ID трека'
      });
      return;
    }

    // Ищем трек в базе данных
    const track = await Track.findById(trackId);
    
    if (!track) {
      res.status(404).json({
        success: false,
        message: 'Трек не найден'
      });
      return;
    }

    // Обновляем или создаем синхронизированный текст
    const updatedLyrics = await SyncedLyrics.findOneAndUpdate(
      { trackId: new mongoose.Types.ObjectId(trackId) },
      {
        trackId: new mongoose.Types.ObjectId(trackId),
        language,
        source,
        lines
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Синхронизированный текст успешно обновлен',
      data: updatedLyrics
    });
  } catch (error) {
    logger.error(`Error updating synced lyrics: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при обновлении синхронизированного текста'
    });
  }
};

/**
 * Удаление синхронизированного текста песни
 * Только для админов
 */
export const deleteSyncedLyrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;

    // Проверяем валидность ID трека
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
      res.status(400).json({
        success: false,
        message: 'Неверный формат ID трека'
      });
      return;
    }

    // Удаляем синхронизированный текст
    const result = await SyncedLyrics.deleteOne({ 
      trackId: new mongoose.Types.ObjectId(trackId) 
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Синхронизированный текст не найден'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Синхронизированный текст успешно удален'
    });
  } catch (error) {
    logger.error(`Error deleting synced lyrics: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при удалении синхронизированного текста'
    });
  }
};

/**
 * Получает текст песни по ID трека
 */
export const getLyricsByTrackId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const timestamped = req.query.timestamped === 'true';

    // Валидация ID
    if (!id || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Неверный ID трека'
      });
      return;
    }

    // Находим трек в базе данных
    const track = await Track.findById(id);
    
    if (!track) {
      res.status(404).json({
        success: false,
        message: 'Трек не найден'
      });
      return;
    }

    // Проверяем, есть ли сохраненный текст песни в базе данных
    if (track.lyrics && !req.query.force) {
      res.json({
        success: true,
        trackId: track._id,
        title: track.title,
        artist: track.artist,
        lyrics: track.lyrics
      });
      return;
    }

    // Проверяем, есть ли у трека ссылка на YouTube
    if (!track.audioUrl || !track.audioUrl.includes('youtube.com')) {
      res.status(404).json({
        success: false,
        message: 'Для данного трека нет ссылки на YouTube'
      });
      return;
    }

    // Получаем текст песни с YouTube
    if (timestamped) {
      // Получаем текст с таймкодами
      const lyricsWithTimestamps = await youtubeSubtitlesService.getLyricsWithTimestamps(track.audioUrl);
      const cleanedLyrics = youtubeSubtitlesService.cleanLyrics(lyricsWithTimestamps);
      
      if (cleanedLyrics.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Текст песни не найден'
        });
        return;
      }

      // Сохраняем обычный текст в базу данных для будущих запросов
      const lyricsText = cleanedLyrics.map(line => line.text).join('\n');
      track.lyrics = lyricsText;
      await track.save();

      res.json({
        success: true,
        trackId: track._id,
        title: track.title,
        artist: track.artist,
        timestamped: true,
        lyrics: cleanedLyrics
      });
    } else {
      // Получаем простой текст песни
      const lyricsText = await youtubeSubtitlesService.getLyricsText(track.audioUrl);
      
      if (!lyricsText) {
        res.status(404).json({
          success: false,
          message: 'Текст песни не найден'
        });
        return;
      }

      // Сохраняем текст в базу данных для будущих запросов
      track.lyrics = lyricsText;
      await track.save();

      res.json({
        success: true,
        trackId: track._id,
        title: track.title,
        artist: track.artist,
        timestamped: false,
        lyrics: lyricsText
      });
    }
  } catch (error) {
    logger.error(`Error getting lyrics: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении текста песни'
    });
  }
};

/**
 * Получает текст песни по URL YouTube
 */
export const getLyricsByYoutubeUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.query;
    const timestamped = req.query.timestamped === 'true';

    // Валидация URL
    if (!url || typeof url !== 'string' || !url.includes('youtube.com')) {
      res.status(400).json({
        success: false,
        message: 'Неверный URL YouTube'
      });
      return;
    }

    if (timestamped) {
      // Получаем текст с таймкодами
      const lyricsWithTimestamps = await youtubeSubtitlesService.getLyricsWithTimestamps(url);
      const cleanedLyrics = youtubeSubtitlesService.cleanLyrics(lyricsWithTimestamps);
      
      if (cleanedLyrics.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Текст песни не найден'
        });
        return;
      }

      res.json({
        success: true,
        url,
        timestamped: true,
        lyrics: cleanedLyrics
      });
    } else {
      // Получаем простой текст песни
      const lyricsText = await youtubeSubtitlesService.getLyricsText(url);
      
      if (!lyricsText) {
        res.status(404).json({
          success: false,
          message: 'Текст песни не найден'
        });
        return;
      }

      res.json({
        success: true,
        url,
        timestamped: false,
        lyrics: lyricsText
      });
    }
  } catch (error) {
    logger.error(`Error getting lyrics by YouTube URL: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении текста песни'
    });
  }
}; 