import axios from 'axios';
import { logger } from '../utils/logger';
import Track, { ITrack } from '../models/Track';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { google } from 'googleapis';

// Загружаем переменные окружения
dotenv.config();

// API ключи из переменных окружения
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || '';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// Инициализация YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_API_KEY
});

// Интерфейсы для типизации ответов от Last.fm API
interface LastFmTrack {
  name: string;
  artist: {
    name: string;
    mbid?: string;
  } | string;
  mbid?: string;
  url: string;
  duration?: string;
  album?: {
    title?: string;
    image?: Array<{
      size: string;
      '#text': string;
    }>;
  };
  image?: Array<{
    size: string;
    '#text': string;
  }>;
}

interface LastFmResponse {
  results?: {
    trackmatches?: {
      track?: LastFmTrack[];
    };
  };
  tracks?: {
    track?: LastFmTrack[];
  };
}

export class LastFmService {
  /**
   * Поиск треков через Last.fm API
   */
  async searchTracks(query: string, limit: number = 10): Promise<ITrack[]> {
    try {
      if (!query.trim()) {
        logger.warn('Empty search query provided to Last.fm search');
        return [];
      }

      logger.info(`Searching Last.fm tracks with query: "${query}", limit: ${limit}`);
      
      const response = await axios.get(LASTFM_API_URL, {
        params: {
          method: 'track.search',
          track: query,
          api_key: LASTFM_API_KEY,
          format: 'json',
          limit
        }
      });

      const tracks = response.data?.results?.trackmatches?.track;
      
      if (!tracks || tracks.length === 0) {
        logger.info(`No tracks found for query "${query}" in Last.fm`);
        return [];
      }

      logger.info(`Found ${tracks.length} tracks in Last.fm for query: "${query}"`);
      
      // Преобразуем данные из ответа API в наш формат треков
      return await this.mapLastFmTracksToModel(tracks);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      logger.error(`Error searching Last.fm tracks with query "${query}": ${errorMessage}`);
      return [];
    }
  }

  /**
   * Получение треков по жанру/тегу
   */
  async getTracksByGenre(genre: string, limit: number = 10): Promise<ITrack[]> {
    try {
      if (!genre.trim()) {
        logger.warn('Empty genre provided to Last.fm getTracksByGenre');
        return [];
      }
      
      logger.info(`Fetching ${limit} tracks for genre "${genre}" from Last.fm`);
      
      const response = await axios.get(LASTFM_API_URL, {
        params: {
          method: 'tag.gettoptracks',
          tag: genre,
          api_key: LASTFM_API_KEY,
          format: 'json',
          limit
        }
      });

      const tracks = response.data?.tracks?.track;
      
      if (!tracks || tracks.length === 0) {
        logger.info(`No tracks found for genre "${genre}" in Last.fm`);
        return [];
      }

      logger.info(`Found ${tracks.length} tracks for genre "${genre}" in Last.fm`);
      
      // Преобразуем данные из ответа API в наш формат треков
      return await this.mapLastFmTracksToModel(tracks);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      logger.error(`Error getting ${genre} tracks from Last.fm: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Получение самых популярных треков 
   */
  async getTopTracks(limit: number = 10): Promise<ITrack[]> {
    try {      
      logger.info(`Fetching ${limit} top tracks from Last.fm`);
      
      const response = await axios.get(LASTFM_API_URL, {
        params: {
          method: 'chart.gettoptracks',
          api_key: LASTFM_API_KEY,
          format: 'json',
          limit
        }
      });

      const tracks = response.data?.tracks?.track;
      
      if (!tracks || tracks.length === 0) {
        logger.info(`No top tracks found in Last.fm`);
        return [];
      }

      logger.info(`Found ${tracks.length} top tracks in Last.fm`);
      
      // Преобразуем данные из ответа API в наш формат треков
      return await this.mapLastFmTracksToModel(tracks);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      logger.error(`Error getting top tracks from Last.fm: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Получает YouTube-ссылку со страницы трека на Last.fm
   * Использует селектор header-new-playlink для извлечения ссылки на YouTube видео со страницы Last.fm
   */
  async getYoutubeUrlFromLastFmPage(lastfmUrl: string): Promise<string | null> {
    try {
      logger.info(`Parsing YouTube URL from Last.fm page: ${lastfmUrl}`);
      
      // Получаем HTML страницы трека на Last.fm
      const response = await axios.get(lastfmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        }
      });
      
      if (!response.data || typeof response.data !== 'string') {
        logger.warn(`No HTML data received from Last.fm page: ${lastfmUrl}`);
        return null;
      }
      
      const html = response.data;
      
      try {
        // Загружаем HTML в cheerio для удобного парсинга
        const $ = cheerio.load(html);
        
        // 1. Ищем кнопку 'Play track' с классом 'header-new-playlink'
        const playLink = $('.header-new-playlink');
        if (playLink.length > 0) {
          const youtubeUrl = playLink.attr('href');
          if (youtubeUrl && youtubeUrl.includes('youtube.com/watch')) {
            logger.info(`Found YouTube URL via header-new-playlink: ${youtubeUrl}`);
            return youtubeUrl;
          }
        }
      } catch (cheerioError) {
        logger.error(`Error parsing HTML with cheerio: ${cheerioError}`);
        // Продолжаем с регулярными выражениями, если возникла ошибка с cheerio
      }
      
      // Запасные методы с использованием регулярных выражений
      
      // 2. Ищем ссылки с href="https://www.youtube.com/watch?v=...
      const youtubeHrefRegex = /href=['"]?(https?:\/\/(www\.)?youtube\.com\/watch\?v=[^'"&]+)['"]?/gi;
      const youtubeMatches = html.match(youtubeHrefRegex);
      
      if (youtubeMatches && youtubeMatches.length > 0) {
        // Извлекаем URL из первого совпадения
        const match = youtubeMatches[0].match(/href=['"]?(https?:\/\/(www\.)?youtube\.com\/watch\?v=[^'"&]+)['"]?/i);
        if (match && match[1]) {
          const youtubeUrl = match[1];
          logger.info(`Found YouTube URL via href regex: ${youtubeUrl}`);
          return youtubeUrl;
        }
      }
      
      // 3. Ищем ссылки с классом header-new-playlink с помощью регулярного выражения
      const playLinkRegex = /<a\s+class="header-new-playlink"[^>]*href="(https?:\/\/(www\.)?youtube\.com\/watch\?v=[^"]+)"[^>]*>/i;
      const playLinkMatch = html.match(playLinkRegex);
      
      if (playLinkMatch && playLinkMatch[1]) {
        const youtubeUrl = playLinkMatch[1];
        logger.info(`Found YouTube URL via header-new-playlink regex: ${youtubeUrl}`);
        return youtubeUrl;
      }
      
      // 4. Ищем data-youtube-id="..."
      const youtubeIdRegex = /data-youtube-id=['"]?([^'"]+)['"]?/gi;
      const youtubeIdMatches = html.match(youtubeIdRegex);
      
      if (youtubeIdMatches && youtubeIdMatches.length > 0) {
        // Извлекаем ID из первого совпадения
        const match = youtubeIdMatches[0].match(/data-youtube-id=['"]?([^'"]+)['"]?/i);
        if (match && match[1]) {
          const youtubeId = match[1];
          const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
          logger.info(`Found YouTube URL via data-youtube-id: ${youtubeUrl}`);
          return youtubeUrl;
        }
      }
      
      logger.warn(`YouTube URL not found on Last.fm page: ${lastfmUrl}`);
      return null;
    } catch (error) {
      logger.error(`Error parsing Last.fm page for YouTube URL: ${error}`);
      return null;
    }
  }

  /**
   * Получает длительность YouTube видео по его URL или ID
   * @param youtubeUrl URL или ID видео на YouTube
   * @returns Длительность видео в миллисекундах или 0 в случае ошибки
   */
  async getYoutubeVideoDuration(youtubeUrl: string): Promise<number> {
    try {
      if (!YOUTUBE_API_KEY) {
        logger.warn('YouTube API key is not set. Cannot get video duration.');
        return 0;
      }

      // Извлекаем videoId из URL
      let videoId = youtubeUrl;
      
      if (youtubeUrl.includes('youtube.com/watch')) {
        const url = new URL(youtubeUrl);
        videoId = url.searchParams.get('v') || '';
      } else if (youtubeUrl.includes('youtu.be/')) {
        videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
      }
      
      if (!videoId) {
        logger.error(`Failed to extract video ID from YouTube URL: ${youtubeUrl}`);
        return 0;
      }
      
      // Запрашиваем информацию о видео через API YouTube
      const response = await youtube.videos.list({
        part: ['contentDetails'],
        id: [videoId]
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const durationString = response.data.items[0].contentDetails?.duration || '';
        
        // Конвертируем ISO 8601 формат (PT1H2M3S) в миллисекунды
        if (durationString) {
          // Регулярные выражения для извлечения часов, минут и секунд
          const hours = durationString.match(/(\d+)H/);
          const minutes = durationString.match(/(\d+)M/);
          const seconds = durationString.match(/(\d+)S/);
          
          let totalMs = 0;
          if (hours) totalMs += parseInt(hours[1]) * 3600000;
          if (minutes) totalMs += parseInt(minutes[1]) * 60000;
          if (seconds) totalMs += parseInt(seconds[1]) * 1000;
          
          logger.info(`Retrieved YouTube video duration for ${videoId}: ${totalMs}ms`);
          return totalMs;
        }
      }
      
      logger.warn(`Could not retrieve duration for YouTube video: ${videoId}`);
      return 0;
    } catch (error) {
      logger.error(`Error getting YouTube video duration: ${error}`);
      return 0;
    }
  }

  /**
   * Преобразование треков из формата Last.fm в модель нашего приложения
   * Без сохранения в БД
   */
  private async mapLastFmTracksToModel(items: LastFmTrack[]): Promise<ITrack[]> {
    const tracks: ITrack[] = [];
    
    for (const item of items) {
      try {
        // Проверяем корректность данных и обрабатываем разные форматы ответа
        const trackName = item.name;
        let artistName: string;
        
        if (typeof item.artist === 'string') {
          artistName = item.artist;
        } else if (item.artist && item.artist.name) {
          artistName = item.artist.name;
        } else {
          logger.warn(`Скипаем трек без исполнителя: ${JSON.stringify(item)}`);
          continue;
        }
        
        if (!trackName) {
          logger.warn(`Скипаем трек без названия: ${JSON.stringify(item)}`);
          continue;
        }
        
        // Определяем название альбома, если оно есть
        const albumNameFinal = item.album?.title || '';
        
        // Получаем обложку с максимальным качеством
        let coverUrl = '';
        
        // Функция для получения лучшей обложки из массива изображений Last.fm
        const getBestImage = (images?: Array<{size: string; '#text': string}>) => {
          if (!images || images.length === 0) return '';
          
          // Приоритет размеров обложки
          const sizePriority = ['extralarge', 'large', 'medium', 'small'];
          
          // Ищем лучшее изображение по приоритету размера
          for (const size of sizePriority) {
            const image = images.find(img => img.size === size && img['#text']);
            if (image && image['#text'] && !image['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) {
              return image['#text'];
            }
          }
          
          // Если не нашли по приоритету, берем последний элемент (обычно самый большой)
          const lastImage = images[images.length - 1];
          if (lastImage && lastImage['#text'] && !lastImage['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) {
            return lastImage['#text'];
          }
          
          return '';
        };
        
        // Пытаемся получить обложку сначала из альбома, потом из трека
        let albumCover = '';
        if (item.album?.image) {
          albumCover = getBestImage(item.album.image);
          if (albumCover) {
            coverUrl = albumCover;
            logger.info(`Используем обложку альбома для "${trackName}" by "${artistName}"`);
          }
        }
        
        // Если у альбома нет обложки, проверяем обложку трека
        if (!coverUrl && item.image) {
          const trackCover = getBestImage(item.image);
          if (trackCover) {
            coverUrl = trackCover;
            logger.info(`Используем обложку трека для "${trackName}" by "${artistName}"`);
          }
        }
        
        // Если обложки нет, пытаемся получить из iTunes API
        if (!coverUrl) {
          try {
            logger.info(`Запрашиваем обложку из iTunes API для "${trackName}" by "${artistName}"`);
            const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}+${encodeURIComponent(trackName)}&entity=song&limit=1`;
            const itunesResponse = await axios.get(itunesUrl);
            
            if (itunesResponse.data?.results && itunesResponse.data.results.length > 0) {
              const artworkUrl = itunesResponse.data.results[0].artworkUrl100;
              if (artworkUrl) {
                // Заменяем размер на больший (600x600 вместо 100x100)
                coverUrl = artworkUrl.replace('100x100', '600x600');
                logger.info(`Получена обложка из iTunes API для "${trackName}" by "${artistName}"`);
              }
            }
          } catch (error) {
            logger.error(`Ошибка при получении обложки из iTunes API: ${error}`);
            
            // Если iTunes не сработал, пробуем AudioDB через сервис
            try {
              logger.info(`Запрашиваем обложку из AudioDB для "${trackName}" by "${artistName}"`);
              const audioDbUrl = `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(artistName)}`;
              const audioDbResponse = await axios.get(audioDbUrl);
              
              if (audioDbResponse.data?.artists && audioDbResponse.data.artists.length > 0) {
                const artist = audioDbResponse.data.artists[0];
                if (artist.strArtistThumb) {
                  coverUrl = artist.strArtistThumb;
                  logger.info(`Получена обложка исполнителя из AudioDB для "${trackName}" by "${artistName}"`);
                }
              }
            } catch (audioDbError) {
              logger.error(`Ошибка при получении обложки из AudioDB: ${audioDbError}`);
            }
          }
        }
        
        // Если все способы не сработали, оставляем дефолтную обложку Last.fm
        if (!coverUrl) {
          coverUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";
          logger.info(`Используем дефолтную обложку Last.fm для "${trackName}" by "${artistName}"`);
        }
        
        // Получаем ссылку на YouTube видео для трека
        let audioUrl = '';
        let trackDuration = item.duration ? parseInt(item.duration) * 1000 : 0;
        
        try {
          const youtubeUrl = await this.getYoutubeUrlFromLastFmPage(item.url);
          if (youtubeUrl) {
            audioUrl = youtubeUrl;
            logger.info(`Используем YouTube URL для трека "${trackName}" by "${artistName}": ${audioUrl}`);
            
            // Получаем длительность YouTube видео, если ещё нет точных данных о длительности из Last.fm
            if (!trackDuration || trackDuration === 0) {
              try {
                const videoDuration = await this.getYoutubeVideoDuration(youtubeUrl);
                if (videoDuration > 0) {
                  trackDuration = videoDuration;
                  logger.info(`Получена длительность видео для трека "${trackName}": ${trackDuration}ms`);
                }
              } catch (durationError) {
                logger.error(`Ошибка при получении длительности видео: ${durationError}`);
              }
            }
          } else {
            // Если не смогли найти YouTube-ссылку, используем ссылку на Last.fm
            audioUrl = item.url;
            logger.info(`Используем Last.fm URL для трека "${trackName}" by "${artistName}": ${audioUrl}`);
          }
        } catch (urlError) {
          logger.error(`Ошибка при получении YouTube URL: ${urlError}`);
          audioUrl = item.url; // Используем ссылку на Last.fm в случае ошибки
        }
        
        // Преобразуем в объект трека (без сохранения в БД)
        const trackModel = {
          _id: undefined, // ID будет присвоен MongoDB при сохранении
          title: trackName,
          artist: artistName,
          album: albumNameFinal,
          duration: trackDuration, // Используем длительность из YouTube или Last.fm
          coverUrl,
          audioUrl, // Теперь это YouTube URL или Last.fm URL
          source: 'lastfm',
          sourceId: item.mbid || `lastfm-${trackName}-${artistName}`,
          license: 'All Rights Reserved',
          genre: [] as string[],
          tags: [] as string[],
          playCount: 0,
          likeCount: 0,
          isPublic: true
        } as unknown as ITrack;
        
        tracks.push(trackModel);
      } catch (itemError: any) {
        logger.error(`Ошибка при обработке трека: ${itemError.message}`);
        continue;
      }
    }
    
    return tracks;
  }
}

// Экспортируем экземпляр сервиса для использования в других модулях
export const lastFmService = new LastFmService(); 