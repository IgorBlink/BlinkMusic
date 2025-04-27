"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastFmService = exports.LastFmService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
const cheerio = __importStar(require("cheerio"));
const googleapis_1 = require("googleapis");
// Загружаем переменные окружения
dotenv_1.default.config();
// API ключи из переменных окружения
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || '';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
// Инициализация YouTube API
const youtube = googleapis_1.google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY
});
class LastFmService {
    /**
     * Поиск треков через Last.fm API
     */
    async searchTracks(query, limit = 10) {
        var _a, _b, _c, _d, _e;
        try {
            if (!query.trim()) {
                logger_1.logger.warn('Empty search query provided to Last.fm search');
                return [];
            }
            logger_1.logger.info(`Searching Last.fm tracks with query: "${query}", limit: ${limit}`);
            const response = await axios_1.default.get(LASTFM_API_URL, {
                params: {
                    method: 'track.search',
                    track: query,
                    api_key: LASTFM_API_KEY,
                    format: 'json',
                    limit
                }
            });
            const tracks = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.results) === null || _b === void 0 ? void 0 : _b.trackmatches) === null || _c === void 0 ? void 0 : _c.track;
            if (!tracks || tracks.length === 0) {
                logger_1.logger.info(`No tracks found for query "${query}" in Last.fm`);
                return [];
            }
            logger_1.logger.info(`Found ${tracks.length} tracks in Last.fm for query: "${query}"`);
            // Преобразуем данные из ответа API в наш формат треков
            return await this.mapLastFmTracksToModel(tracks);
        }
        catch (error) {
            const errorMessage = ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error.message || 'Unknown error';
            logger_1.logger.error(`Error searching Last.fm tracks with query "${query}": ${errorMessage}`);
            return [];
        }
    }
    /**
     * Получение треков по жанру/тегу
     */
    async getTracksByGenre(genre, limit = 10) {
        var _a, _b, _c, _d;
        try {
            if (!genre.trim()) {
                logger_1.logger.warn('Empty genre provided to Last.fm getTracksByGenre');
                return [];
            }
            logger_1.logger.info(`Fetching ${limit} tracks for genre "${genre}" from Last.fm`);
            const response = await axios_1.default.get(LASTFM_API_URL, {
                params: {
                    method: 'tag.gettoptracks',
                    tag: genre,
                    api_key: LASTFM_API_KEY,
                    format: 'json',
                    limit
                }
            });
            const tracks = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.tracks) === null || _b === void 0 ? void 0 : _b.track;
            if (!tracks || tracks.length === 0) {
                logger_1.logger.info(`No tracks found for genre "${genre}" in Last.fm`);
                return [];
            }
            logger_1.logger.info(`Found ${tracks.length} tracks for genre "${genre}" in Last.fm`);
            // Преобразуем данные из ответа API в наш формат треков
            return await this.mapLastFmTracksToModel(tracks);
        }
        catch (error) {
            const errorMessage = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message || 'Unknown error';
            logger_1.logger.error(`Error getting ${genre} tracks from Last.fm: ${errorMessage}`);
            return [];
        }
    }
    /**
     * Получение самых популярных треков
     */
    async getTopTracks(limit = 10) {
        var _a, _b, _c, _d;
        try {
            logger_1.logger.info(`Fetching ${limit} top tracks from Last.fm`);
            const response = await axios_1.default.get(LASTFM_API_URL, {
                params: {
                    method: 'chart.gettoptracks',
                    api_key: LASTFM_API_KEY,
                    format: 'json',
                    limit
                }
            });
            const tracks = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.tracks) === null || _b === void 0 ? void 0 : _b.track;
            if (!tracks || tracks.length === 0) {
                logger_1.logger.info(`No top tracks found in Last.fm`);
                return [];
            }
            logger_1.logger.info(`Found ${tracks.length} top tracks in Last.fm`);
            // Преобразуем данные из ответа API в наш формат треков
            return await this.mapLastFmTracksToModel(tracks);
        }
        catch (error) {
            const errorMessage = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message || 'Unknown error';
            logger_1.logger.error(`Error getting top tracks from Last.fm: ${errorMessage}`);
            return [];
        }
    }
    /**
     * Получает YouTube-ссылку со страницы трека на Last.fm
     * Использует селектор header-new-playlink для извлечения ссылки на YouTube видео со страницы Last.fm
     */
    async getYoutubeUrlFromLastFmPage(lastfmUrl) {
        try {
            logger_1.logger.info(`Parsing YouTube URL from Last.fm page: ${lastfmUrl}`);
            // Получаем HTML страницы трека на Last.fm
            const response = await axios_1.default.get(lastfmUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
                }
            });
            if (!response.data || typeof response.data !== 'string') {
                logger_1.logger.warn(`No HTML data received from Last.fm page: ${lastfmUrl}`);
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
                        logger_1.logger.info(`Found YouTube URL via header-new-playlink: ${youtubeUrl}`);
                        return youtubeUrl;
                    }
                }
            }
            catch (cheerioError) {
                logger_1.logger.error(`Error parsing HTML with cheerio: ${cheerioError}`);
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
                    logger_1.logger.info(`Found YouTube URL via href regex: ${youtubeUrl}`);
                    return youtubeUrl;
                }
            }
            // 3. Ищем ссылки с классом header-new-playlink с помощью регулярного выражения
            const playLinkRegex = /<a\s+class="header-new-playlink"[^>]*href="(https?:\/\/(www\.)?youtube\.com\/watch\?v=[^"]+)"[^>]*>/i;
            const playLinkMatch = html.match(playLinkRegex);
            if (playLinkMatch && playLinkMatch[1]) {
                const youtubeUrl = playLinkMatch[1];
                logger_1.logger.info(`Found YouTube URL via header-new-playlink regex: ${youtubeUrl}`);
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
                    logger_1.logger.info(`Found YouTube URL via data-youtube-id: ${youtubeUrl}`);
                    return youtubeUrl;
                }
            }
            logger_1.logger.warn(`YouTube URL not found on Last.fm page: ${lastfmUrl}`);
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error parsing Last.fm page for YouTube URL: ${error}`);
            return null;
        }
    }
    /**
     * Получает длительность YouTube видео по его URL или ID
     * @param youtubeUrl URL или ID видео на YouTube
     * @returns Длительность видео в миллисекундах или 0 в случае ошибки
     */
    async getYoutubeVideoDuration(youtubeUrl) {
        var _a;
        try {
            if (!YOUTUBE_API_KEY) {
                logger_1.logger.warn('YouTube API key is not set. Cannot get video duration.');
                return 0;
            }
            // Извлекаем videoId из URL
            let videoId = youtubeUrl;
            if (youtubeUrl.includes('youtube.com/watch')) {
                const url = new URL(youtubeUrl);
                videoId = url.searchParams.get('v') || '';
            }
            else if (youtubeUrl.includes('youtu.be/')) {
                videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
            }
            if (!videoId) {
                logger_1.logger.error(`Failed to extract video ID from YouTube URL: ${youtubeUrl}`);
                return 0;
            }
            // Запрашиваем информацию о видео через API YouTube
            const response = await youtube.videos.list({
                part: ['contentDetails'],
                id: [videoId]
            });
            if (response.data.items && response.data.items.length > 0) {
                const durationString = ((_a = response.data.items[0].contentDetails) === null || _a === void 0 ? void 0 : _a.duration) || '';
                // Конвертируем ISO 8601 формат (PT1H2M3S) в миллисекунды
                if (durationString) {
                    // Регулярные выражения для извлечения часов, минут и секунд
                    const hours = durationString.match(/(\d+)H/);
                    const minutes = durationString.match(/(\d+)M/);
                    const seconds = durationString.match(/(\d+)S/);
                    let totalMs = 0;
                    if (hours)
                        totalMs += parseInt(hours[1]) * 3600000;
                    if (minutes)
                        totalMs += parseInt(minutes[1]) * 60000;
                    if (seconds)
                        totalMs += parseInt(seconds[1]) * 1000;
                    logger_1.logger.info(`Retrieved YouTube video duration for ${videoId}: ${totalMs}ms`);
                    return totalMs;
                }
            }
            logger_1.logger.warn(`Could not retrieve duration for YouTube video: ${videoId}`);
            return 0;
        }
        catch (error) {
            logger_1.logger.error(`Error getting YouTube video duration: ${error}`);
            return 0;
        }
    }
    /**
     * Преобразование треков из формата Last.fm в модель нашего приложения
     * Без сохранения в БД
     */
    async mapLastFmTracksToModel(items) {
        var _a, _b, _c, _d;
        const tracks = [];
        for (const item of items) {
            try {
                // Проверяем корректность данных и обрабатываем разные форматы ответа
                const trackName = item.name;
                let artistName;
                if (typeof item.artist === 'string') {
                    artistName = item.artist;
                }
                else if (item.artist && item.artist.name) {
                    artistName = item.artist.name;
                }
                else {
                    logger_1.logger.warn(`Скипаем трек без исполнителя: ${JSON.stringify(item)}`);
                    continue;
                }
                if (!trackName) {
                    logger_1.logger.warn(`Скипаем трек без названия: ${JSON.stringify(item)}`);
                    continue;
                }
                // Определяем название альбома, если оно есть
                const albumNameFinal = ((_a = item.album) === null || _a === void 0 ? void 0 : _a.title) || '';
                // Получаем обложку с максимальным качеством
                let coverUrl = '';
                // Функция для получения лучшей обложки из массива изображений Last.fm
                const getBestImage = (images) => {
                    if (!images || images.length === 0)
                        return '';
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
                if ((_b = item.album) === null || _b === void 0 ? void 0 : _b.image) {
                    albumCover = getBestImage(item.album.image);
                    if (albumCover) {
                        coverUrl = albumCover;
                        logger_1.logger.info(`Используем обложку альбома для "${trackName}" by "${artistName}"`);
                    }
                }
                // Если у альбома нет обложки, проверяем обложку трека
                if (!coverUrl && item.image) {
                    const trackCover = getBestImage(item.image);
                    if (trackCover) {
                        coverUrl = trackCover;
                        logger_1.logger.info(`Используем обложку трека для "${trackName}" by "${artistName}"`);
                    }
                }
                // Если обложки нет, пытаемся получить из iTunes API
                if (!coverUrl) {
                    try {
                        logger_1.logger.info(`Запрашиваем обложку из iTunes API для "${trackName}" by "${artistName}"`);
                        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}+${encodeURIComponent(trackName)}&entity=song&limit=1`;
                        const itunesResponse = await axios_1.default.get(itunesUrl);
                        if (((_c = itunesResponse.data) === null || _c === void 0 ? void 0 : _c.results) && itunesResponse.data.results.length > 0) {
                            const artworkUrl = itunesResponse.data.results[0].artworkUrl100;
                            if (artworkUrl) {
                                // Заменяем размер на больший (600x600 вместо 100x100)
                                coverUrl = artworkUrl.replace('100x100', '600x600');
                                logger_1.logger.info(`Получена обложка из iTunes API для "${trackName}" by "${artistName}"`);
                            }
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`Ошибка при получении обложки из iTunes API: ${error}`);
                        // Если iTunes не сработал, пробуем AudioDB через сервис
                        try {
                            logger_1.logger.info(`Запрашиваем обложку из AudioDB для "${trackName}" by "${artistName}"`);
                            const audioDbUrl = `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(artistName)}`;
                            const audioDbResponse = await axios_1.default.get(audioDbUrl);
                            if (((_d = audioDbResponse.data) === null || _d === void 0 ? void 0 : _d.artists) && audioDbResponse.data.artists.length > 0) {
                                const artist = audioDbResponse.data.artists[0];
                                if (artist.strArtistThumb) {
                                    coverUrl = artist.strArtistThumb;
                                    logger_1.logger.info(`Получена обложка исполнителя из AudioDB для "${trackName}" by "${artistName}"`);
                                }
                            }
                        }
                        catch (audioDbError) {
                            logger_1.logger.error(`Ошибка при получении обложки из AudioDB: ${audioDbError}`);
                        }
                    }
                }
                // Если все способы не сработали, оставляем дефолтную обложку Last.fm
                if (!coverUrl) {
                    coverUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";
                    logger_1.logger.info(`Используем дефолтную обложку Last.fm для "${trackName}" by "${artistName}"`);
                }
                // Получаем ссылку на YouTube видео для трека
                let audioUrl = '';
                let trackDuration = item.duration ? parseInt(item.duration) * 1000 : 0;
                try {
                    const youtubeUrl = await this.getYoutubeUrlFromLastFmPage(item.url);
                    if (youtubeUrl) {
                        audioUrl = youtubeUrl;
                        logger_1.logger.info(`Используем YouTube URL для трека "${trackName}" by "${artistName}": ${audioUrl}`);
                        // Получаем длительность YouTube видео, если ещё нет точных данных о длительности из Last.fm
                        if (!trackDuration || trackDuration === 0) {
                            try {
                                const videoDuration = await this.getYoutubeVideoDuration(youtubeUrl);
                                if (videoDuration > 0) {
                                    trackDuration = videoDuration;
                                    logger_1.logger.info(`Получена длительность видео для трека "${trackName}": ${trackDuration}ms`);
                                }
                            }
                            catch (durationError) {
                                logger_1.logger.error(`Ошибка при получении длительности видео: ${durationError}`);
                            }
                        }
                    }
                    else {
                        // Если не смогли найти YouTube-ссылку, используем ссылку на Last.fm
                        audioUrl = item.url;
                        logger_1.logger.info(`Используем Last.fm URL для трека "${trackName}" by "${artistName}": ${audioUrl}`);
                    }
                }
                catch (urlError) {
                    logger_1.logger.error(`Ошибка при получении YouTube URL: ${urlError}`);
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
                    genre: [],
                    tags: [],
                    playCount: 0,
                    likeCount: 0,
                    isPublic: true
                };
                tracks.push(trackModel);
            }
            catch (itemError) {
                logger_1.logger.error(`Ошибка при обработке трека: ${itemError.message}`);
                continue;
            }
        }
        return tracks;
    }
}
exports.LastFmService = LastFmService;
// Экспортируем экземпляр сервиса для использования в других модулях
exports.lastFmService = new LastFmService();
