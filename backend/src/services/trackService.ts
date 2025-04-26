import { logger } from '../utils/logger';
import Track, { ITrack } from '../models/Track';
import { lastFmService } from './lastFmService';
import { audioDbService } from './audioDbService';
import mongoose from 'mongoose';
import axios from 'axios';
import { AudioDbService } from './audioDbService';
import { LastFmService } from './lastFmService';

export class TrackService {
  private readonly audioDbService: AudioDbService;
  private readonly lastFmService: LastFmService;

  constructor() {
    this.audioDbService = new AudioDbService();
    this.lastFmService = lastFmService;
  }

  /**
   * Получить все треки с пагинацией (фактически возвращает популярные треки из Last.fm)
   */
  async getAllTracks(page: number = 1, limit: number = 10, sort: string = '-createdAt'): Promise<{
    tracks: ITrack[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    try {
      logger.info(`Getting all tracks with pagination: page=${page}, limit=${limit}, sort=${sort}`);
      
      // В новой реализации мы просто получаем популярные треки из Last.fm
      // Сортировка не применяется, так как мы не сохраняем треки в БД
      const lastFmTracks = await this.lastFmService.getTopTracks(limit);
      
      // Обогащаем каждый трек обложкой из iTunes
      const enrichedTracks = await Promise.all(
        lastFmTracks.map(async (track) => {
          // Получаем обложку из iTunes
          const itunesCover = await this.getITunesCover(track.artist, track.title);
          
          if (itunesCover) {
            track.coverUrl = itunesCover;
          }
          
          return track;
        })
      );
      
      // В данной реализации пагинация не имеет смысла, так как мы всегда получаем треки напрямую из API
      return {
        tracks: enrichedTracks,
        totalPages: 1,
        currentPage: 1,
        total: enrichedTracks.length
      };
    } catch (error: any) {
      logger.error(`Error getting all tracks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получить трек по ID (если не найден, попытаться найти через Last.fm)
   */
  async getTrackById(id: string): Promise<{
    track: ITrack | any;
    enrichedData?: any;
  }> {
    try {
      // Если передан некорректный ID, возможно это не ObjectId, а другой идентификатор
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Некорректный ID трека: ${id}, пробуем искать через Last.fm`);
        
        // Пытаемся интерпретировать id как "artist-title"
        if (id.includes('-')) {
          const [artist, title] = id.split('-').map(part => part.trim());
          
          if (artist && title) {
            logger.info(`Искаем трек через Last.fm: ${artist} - ${title}`);
            
            const lastFmTracks = await this.lastFmService.searchTracks(`${artist} ${title}`, 1);
            
            if (lastFmTracks.length > 0) {
              const track = lastFmTracks[0];
              
              // Добавляем обложку из iTunes
              const itunesCover = await this.getITunesCover(track.artist, track.title);
              if (itunesCover) {
                track.coverUrl = itunesCover;
              }
              
              return { track };
            }
          }
        }
        
        throw new Error('Неверный формат ID трека');
      }

      logger.info(`Getting track by ID: ${id}`);
      const track = await Track.findById(id);

      if (!track) {
        throw new Error('Трек не найден');
      }

      // Проверяем, нужно ли обновить обложку через iTunes
      if (!track.coverUrl || track.coverUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
        logger.info(`Обновляем обложку для трека ${track.title}`);
        const updatedTrack = await this.forceUpdateTrackCover(track);
        if (updatedTrack) {
          return { track: updatedTrack };
        }
      }
      
      return { track };
    } catch (error: any) {
      logger.error(`Error getting track by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Поиск треков по запросу без сохранения в БД
   * @param query Поисковый запрос
   * @param limit Лимит результатов
   */
  async searchTracks(query: string, limit: number = 10): Promise<ITrack[]> {
    try {
      logger.info(`Searching tracks with query: "${query}", limit: ${limit}`);
      
      // Получаем треки из Last.fm
      logger.info(`Searching for "${query}" in Last.fm`);
      const lastFmTracks = await this.lastFmService.searchTracks(query, limit);
      
      // Обогащаем каждый трек обложкой из iTunes
      const enrichedTracks = await Promise.all(
        lastFmTracks.map(async (track) => {
          // Получаем обложку из iTunes
          const itunesCover = await this.getITunesCover(track.artist, track.title);
          
          if (itunesCover) {
            track.coverUrl = itunesCover;
          }
          
          return track;
        })
      );
      
      return enrichedTracks;
    } catch (error: any) {
      logger.error(`Error searching tracks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получить треки по жанру без сохранения в БД
   * @param genre Жанр
   * @param limit Лимит результатов
   */
  async getTracksByGenre(genre: string, limit: number = 10): Promise<ITrack[]> {
    try {
      logger.info(`Getting tracks by genre: "${genre}", limit: ${limit}`);
      
      // Получаем треки из Last.fm
      const lastFmTracks = await this.lastFmService.getTracksByGenre(genre, limit);
      logger.info(`Found ${lastFmTracks.length} tracks of genre "${genre}" from Last.fm`);
      
      // Обогащаем каждый трек обложкой из iTunes
      const enrichedTracks = await Promise.all(
        lastFmTracks.map(async (track) => {
          // Получаем обложку из iTunes
          const itunesCover = await this.getITunesCover(track.artist, track.title);
          
          if (itunesCover) {
            track.coverUrl = itunesCover;
          }
          
          return track;
        })
      );
      
      return enrichedTracks;
    } catch (error: any) {
      logger.error(`Error getting tracks by genre: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получить рекомендованные треки без сохранения в БД
   */
  async getRecommendedTracks(limit: number = 10): Promise<ITrack[]> {
    try {
      logger.info(`Getting recommended tracks, limit: ${limit}`);
      
      // Получаем популярные треки из Last.fm
      const lastFmTracks = await this.lastFmService.getTopTracks(limit);
      logger.info(`Found ${lastFmTracks.length} popular tracks from Last.fm`);
      
      // Обогащаем каждый трек обложкой из iTunes
      const enrichedTracks = await Promise.all(
        lastFmTracks.map(async (track) => {
          // Получаем обложку из iTunes
          const itunesCover = await this.getITunesCover(track.artist, track.title);
          
          if (itunesCover) {
            track.coverUrl = itunesCover;
          }
          
          return track;
        })
      );
      
      return enrichedTracks;
    } catch (error: any) {
      logger.error(`Error getting recommended tracks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Добавление трека в избранное
   */
  async addToFavorites(userId: string, trackId: string): Promise<ITrack> {
    try {
      const track = await Track.findById(trackId);
      
      if (!track) {
        throw new Error('Трек не найден');
      }
      
      // Обновление выполняется через контроллер с использованием User модели
      
      // Увеличиваем счетчик лайков трека
      track.likeCount += 1;
      await track.save();
      
      return track;
    } catch (error: any) {
      logger.error(`Error adding track to favorites: ${error.message}`);
      throw error;
    }
  }

  /**
   * Удаление трека из избранного
   */
  async removeFromFavorites(userId: string, trackId: string): Promise<ITrack> {
    try {
      const track = await Track.findById(trackId);
      
      if (!track) {
        throw new Error('Трек не найден');
      }
      
      // Обновление выполняется через контроллер с использованием User модели
      
      // Уменьшаем счетчик лайков трека
      if (track.likeCount > 0) {
        track.likeCount -= 1;
        await track.save();
      }
      
      return track;
    } catch (error: any) {
      logger.error(`Error removing track from favorites: ${error.message}`);
      throw error;
    }
  }

  /**
   * Обогащает трек метаданными из AudioDB API
   * @param track Трек для обогащения метаданными
   * @returns Обогащенный трек с дополнительными метаданными
   */
  async enrichTrackWithMetadata(track: ITrack): Promise<ITrack> {
    try {
      logger.info(`Обогащаем метаданными трек "${track.title}" от "${track.artist}"`);
      
      // Проверяем наличие обложки и оптимизируем ее
      await this.enhanceTrackCover(track);
      
      // Проверяем, нужно ли обновить ссылку на аудио (получить YouTube URL)
      if (!track.audioUrl.includes('youtube.com')) {
        logger.info(`Получаем YouTube-ссылку для трека "${track.title}" от "${track.artist}"`);
        
        // Используем Last.fm URL трека для получения YouTube-ссылки
        try {
          const lastfmUrl = track.audioUrl;
          const youtubeUrl = await this.lastFmService.getYoutubeUrlFromLastFmPage(lastfmUrl);
          
          if (youtubeUrl) {
            logger.info(`Обновляем аудио-ссылку на YouTube URL для "${track.title}"`);
            track.audioUrl = youtubeUrl;
            // Сохраняем изменения в базу данных
            await Track.findByIdAndUpdate(track._id, { audioUrl: youtubeUrl });
          }
        } catch (error) {
          logger.error(`Ошибка при получении YouTube-ссылки: ${error}`);
        }
      }
      
      // Если трек уже был обогащен полностью, просто возвращаем его
      if (track.enriched && Object.keys(track.enriched).length > 0 && 
          track.enriched.description && track.enriched.genre && track.enriched.genre.length > 0) {
        logger.info(`Трек "${track.title}" уже обогащен метаданными`);
        return track;
      }

      // Получаем метаданные из AudioDB API
      const audioDbData = await this.audioDbService.getTrackInfo(track.artist, track.title);
      
      // Если метаданные найдены, обогащаем трек
      if (audioDbData) {
        logger.info(`Получены метаданные AudioDB для "${track.title}" от "${track.artist}"`);
        
        // Инициализируем объект enriched, если его еще нет
        if (!track.enriched) {
          track.enriched = {
            genre: []
          };
        }

        // Добавляем метаданные
        if (audioDbData.genre) {
          track.enriched.genre = Array.isArray(audioDbData.genre) 
            ? audioDbData.genre 
            : [audioDbData.genre];
        }
        
        track.enriched.year = audioDbData.year || undefined;
        track.enriched.mood = audioDbData.mood || undefined;
        track.enriched.style = audioDbData.style || undefined;
        track.enriched.description = audioDbData.description || undefined;
        track.enriched.country = audioDbData.country || undefined;
        
        // Сохраняем название альбома, если оно предоставлено AudioDB
        if (audioDbData.album) {
          track.albumName = audioDbData.album;
        }

        // Проверяем и обновляем обложку, если AudioDB предоставил качественную обложку
        if (audioDbData.albumCover && 
            audioDbData.albumCover !== 'none' && 
            !audioDbData.albumCover.includes('lastfm') &&
            !audioDbData.albumCover.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
          
          // Сохраняем обложку в enriched метаданные
          track.enriched.coverUrl = audioDbData.albumCover;
          
          // Проверяем, есть ли у трека обложка или это дефолтная обложка Last.fm
          const isDefaultLastFmCover = track.coverUrl?.includes('2a96cbd8b46e442fc41c2b86b821562f');
          
          if (!track.coverUrl || isDefaultLastFmCover) {
            logger.info(`Обновляем обложку для "${track.title}" на обложку из AudioDB`);
            track.coverUrl = audioDbData.albumCover;
          }
        }

        // Применяем изменения к базе данных
        const updatedTrack = await Track.findByIdAndUpdate(
          track._id,
          {
            enriched: track.enriched,
            albumName: track.albumName,
            coverUrl: track.coverUrl,
            audioUrl: track.audioUrl
          },
          { new: true }
        );

        logger.info(`Успешно обогащен трек "${track.title}" метаданными и сохранен в БД`);
        
        // Возвращаем обновленный трек
        return updatedTrack ? updatedTrack : track;
      } else {
        logger.info(`Не найдено дополнительных метаданных для "${track.title}" от "${track.artist}"`);
      }

      return track;
    } catch (error) {
      logger.error(`Ошибка при обогащении трека метаданными: ${error}`);
      return track; // Возвращаем оригинальный трек в случае ошибки
    }
  }
  
  /**
   * Улучшает обложку трека, получая реальное изображение вместо URL-ссылок на API
   * @param track Трек для улучшения обложки
   */
  private async enhanceTrackCover(track: ITrack): Promise<void> {
    try {
      // Проверяем, требуется ли обновление обложки
      if (!track.coverUrl) {
        logger.info(`Трек "${track.title}" не имеет обложки, пропускаем улучшение`);
        return;
      }
      
      // Проверяем, является ли обложка дефолтной от Last.fm
      const isDefaultLastFmCover = track.coverUrl.includes('2a96cbd8b46e442fc41c2b86b821562f');
      
      if (isDefaultLastFmCover) {
        logger.info(`У трека "${track.title}" дефолтная обложка Last.fm, пытаемся найти лучше`);
      } else if (!track.coverUrl.includes('itunes.apple.com') && !track.coverUrl.includes('api.deezer.com')) {
        // Если у трека уже есть непосредственная ссылка на обложку и это не API запрос
        return;
      }
      
      // Обрабатываем запрос к iTunes API
      if (track.coverUrl.includes('itunes.apple.com')) {
        try {
          logger.info(`Получаем обложку из iTunes для "${track.title}"`);
          const response = await axios.get(track.coverUrl);
          
          if (response.data?.results && response.data.results.length > 0) {
            const artworkUrl = response.data.results[0].artworkUrl100;
            
            if (artworkUrl) {
              // Заменяем размер на более крупный
              const highResArtwork = artworkUrl.replace('100x100', '600x600');
              logger.info(`Обновляем обложку для "${track.title}" из iTunes`);
              track.coverUrl = highResArtwork;
              await track.save();
            }
          } else {
            logger.info(`iTunes не вернул обложку для "${track.title}"`);
          }
        } catch (error) {
          logger.error(`Ошибка при получении обложки из iTunes: ${error}`);
        }
      }
      
      // Обрабатываем запрос к Deezer API
      else if (track.coverUrl.includes('api.deezer.com')) {
        try {
          logger.info(`Получаем обложку из Deezer для "${track.title}"`);
          const response = await axios.get(track.coverUrl);
          
          if (response.data?.data && response.data.data.length > 0) {
            const album = response.data.data[0].album;
            
            if (album && album.cover_big) {
              logger.info(`Обновляем обложку для "${track.title}" из Deezer`);
              track.coverUrl = album.cover_big;
              await track.save();
            }
          } else {
            logger.info(`Deezer не вернул обложку для "${track.title}"`);
          }
        } catch (error) {
          logger.error(`Ошибка при получении обложки из Deezer: ${error}`);
        }
      }
      
      // Если все еще нет нормальной обложки, пробуем AudioDB
      if (isDefaultLastFmCover || !track.coverUrl) {
        try {
          // Запрашиваем обложку у AudioDB
          const audioDbData = await audioDbService.getTrackInfo(track.artist, track.title);
          
          if (audioDbData?.albumCover && 
              audioDbData.albumCover !== 'none' && 
              !audioDbData.albumCover.includes('lastfm') &&
              !audioDbData.albumCover.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
            
            logger.info(`Обновляем обложку для "${track.title}" из AudioDB`);
            track.coverUrl = audioDbData.albumCover;
            await track.save();
          }
        } catch (error) {
          logger.error(`Ошибка при получении обложки из AudioDB: ${error}`);
        }
      }
    } catch (error) {
      logger.error(`Ошибка при улучшении обложки трека: ${error}`);
    }
  }

  /**
   * Принудительно обновляет обложку трека из iTunes
   * Возвращает обновленный трек с новой обложкой или исходный трек, если обновление не требуется
   */
  async forceUpdateTrackCover(track: any): Promise<any> {
    try {
      logger.info(`Trying iTunes API for "${track.title}" by "${track.artist}"`);
      
      // Сразу пробуем iTunes API
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(track.artist)}+${encodeURIComponent(track.title)}&entity=song&limit=1`;
      const itunesResponse = await axios.get(itunesUrl);
      
      if (itunesResponse.data?.results && itunesResponse.data.results.length > 0) {
        const artworkUrl = itunesResponse.data.results[0].artworkUrl100;
        if (artworkUrl) {
          // Заменяем размер на больший (600x600 вместо 100x100)
          const betterCover = artworkUrl.replace('100x100', '600x600');
          
          // Если это объект трека из БД, обновляем его
          if (track._id) {
            logger.info(`Found better cover for "${track.title}" by "${track.artist}" from iTunes`);
            
            // Обновляем обложку трека в базе данных
            await Track.findByIdAndUpdate(track._id, { 
              coverUrl: betterCover 
            });
          }
          
          // Возвращаем обновленный трек
          return { 
            ...track, 
            coverUrl: betterCover 
          };
        }
      }
      
      logger.info(`No cover found in iTunes for "${track.title}" by "${track.artist}"`);
      return track;
    } catch (error) {
      logger.error(`Error updating track cover: ${error}`);
      // В случае ошибки возвращаем исходный трек без изменений
      return track;
    }
  }

  /**
   * Получает обложку трека из iTunes без сохранения в БД
   * Возвращает URL обложки или null, если обложка не найдена
   */
  async getITunesCover(artist: string, title: string): Promise<string | null> {
    try {
      logger.info(`Getting iTunes cover for "${title}" by "${artist}"`);
      
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}+${encodeURIComponent(title)}&entity=song&limit=1`;
      const itunesResponse = await axios.get(itunesUrl);
      
      if (itunesResponse.data?.results && itunesResponse.data.results.length > 0) {
        const artworkUrl = itunesResponse.data.results[0].artworkUrl100;
        if (artworkUrl) {
          // Заменяем размер на больший (600x600 вместо 100x100)
          const betterCover = artworkUrl.replace('100x100', '600x600');
          return betterCover;
        }
      }
      
      logger.info(`No cover found in iTunes for "${title}" by "${artist}"`);
      return null;
    } catch (error) {
      logger.error(`Error getting iTunes cover: ${error}`);
      return null;
    }
  }

  /**
   * Принудительное обновление обложек для существующих треков
   */
  async updateExistingTracks(): Promise<void> {
    try {
      logger.info('Запуск принудительного обновления обложек для существующих треков');
      
      // Найти все треки с дефолтными обложками Last.fm
      const tracksWithDefaultCovers = await Track.find({
        coverUrl: { $regex: '2a96cbd8b46e442fc41c2b86b821562f' }
      }).limit(20); // Ограничиваем количество треков для одновременного обновления
      
      logger.info(`Найдено ${tracksWithDefaultCovers.length} треков с дефолтными обложками`);
      
      // Обновляем обложки для каждого найденного трека
      for (const track of tracksWithDefaultCovers) {
        await this.forceUpdateTrackCover(track);
      }
      
      logger.info('Завершено обновление обложек');
    } catch (error) {
      logger.error(`Ошибка при массовом обновлении обложек: ${error}`);
    }
  }

  /**
   * Создает новый трек на основе данных из Last.fm
   * @param lastFmTrack - трек из Last.fm API
   * @returns созданный объект трека
   */
  async createTrackFromLastFm(lastFmTrack: any): Promise<ITrack> {
    logger.info(`Creating new track from Last.fm: ${lastFmTrack.artist} - ${lastFmTrack.title}`);
    
    // Создаем базовый объект трека с данными из Last.fm
    const newTrack = new Track({
      title: lastFmTrack.title,
      artist: lastFmTrack.artist,
      album: lastFmTrack.album || '',
      coverUrl: lastFmTrack.coverUrl || '',
      source: 'lastfm',
      sourceId: lastFmTrack.mbid || `${lastFmTrack.artist}-${lastFmTrack.title}`,
      playCount: lastFmTrack.playCount || 0,
      isPublic: true,
      tags: lastFmTrack.tags || []
    });
    
    // Сохраняем трек в базу данных
    await newTrack.save();
    
    return newTrack.toObject();
  }

  /**
   * Принудительно обновляет обложки для всех треков в базе данных, используя iTunes API
   * Этот метод можно запустить один раз при переходе на новую логику без сохранения в БД
   */
  async forceUseITunesCoverForAllTracks(limit: number = 100): Promise<void> {
    try {
      logger.info('Запуск принудительного обновления обложек из iTunes для всех треков');
      
      // Получаем треки с дефолтными обложками Last.fm или без обложек
      const tracksToUpdate = await Track.find({
        $or: [
          { coverUrl: { $regex: '2a96cbd8b46e442fc41c2b86b821562f' } },
          { coverUrl: { $exists: false } },
          { coverUrl: null },
          { coverUrl: '' }
        ]
      }).limit(limit);
      
      logger.info(`Найдено ${tracksToUpdate.length} треков для обновления обложек`);
      
      // Обновляем обложки для каждого найденного трека
      let updatedCount = 0;
      
      for (const track of tracksToUpdate) {
        const updatedTrack = await this.forceUpdateTrackCover(track);
        
        if (updatedTrack.coverUrl !== track.coverUrl) {
          updatedCount++;
        }
      }
      
      logger.info(`Обновлено обложек: ${updatedCount} из ${tracksToUpdate.length}`);
    } catch (error) {
      logger.error(`Ошибка при массовом обновлении обложек: ${error}`);
    }
  }
}

// Экспортируем экземпляр сервиса для использования в других модулях
export const trackService = new TrackService(); 