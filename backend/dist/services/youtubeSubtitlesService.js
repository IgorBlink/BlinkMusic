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
exports.youtubeSubtitlesService = exports.YouTubeSubtitlesService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const cheerio = __importStar(require("cheerio"));
const googleapis_1 = require("googleapis");
// Получаем ключ API из переменных окружения
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const youtube = googleapis_1.google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY
});
class YouTubeSubtitlesService {
    /**
     * Получает ID видео из YouTube URL
     */
    extractVideoId(youtubeUrl) {
        try {
            const url = new URL(youtubeUrl);
            let videoId = null;
            if (url.hostname.includes('youtube.com')) {
                videoId = url.searchParams.get('v');
            }
            else if (url.hostname.includes('youtu.be')) {
                videoId = url.pathname.substring(1);
            }
            return videoId;
        }
        catch (error) {
            logger_1.logger.error(`Error extracting YouTube video ID: ${error}`);
            return null;
        }
    }
    /**
     * Получает список доступных субтитров для видео
     */
    async getAvailableCaptions(videoId) {
        try {
            const response = await youtube.captions.list({
                part: ['snippet'],
                videoId: videoId
            });
            return response.data.items || [];
        }
        catch (error) {
            logger_1.logger.error(`Error getting captions list for video ${videoId}: ${error}`);
            return [];
        }
    }
    /**
     * Получает субтитры из видео с помощью YouTube API
     * Возвращает массив строк с таймкодами
     */
    async getLyricsWithTimestamps(youtubeUrl) {
        try {
            const videoId = this.extractVideoId(youtubeUrl);
            if (!videoId) {
                logger_1.logger.error(`Invalid YouTube URL: ${youtubeUrl}`);
                return [];
            }
            logger_1.logger.info(`Getting lyrics from YouTube video: ${videoId}`);
            // Вариант 1: Через официальный API (требует OAuth и дополнительных прав)
            // Этот метод сложнее, так как требует дополнительной авторизации
            // Вариант 2: Парсинг через открытый API timedtext
            // Это проще и часто работает для видео с автоматическими субтитрами
            try {
                const response = await axios_1.default.get(`https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`);
                if (response.data && response.data.events) {
                    return response.data.events
                        .filter((event) => event.segs && event.segs.length > 0)
                        .map((event) => ({
                        text: event.segs.map((seg) => seg.utf8).join(' ').trim(),
                        startTime: event.tStartMs,
                        endTime: event.tStartMs + event.dDurationMs
                    }))
                        .filter((line) => line.text && line.text.length > 0);
                }
            }
            catch (timedTextError) {
                logger_1.logger.warn(`Error getting timedtext for video ${videoId}: ${timedTextError}`);
                // Продолжаем со следующим методом, если этот не сработал
            }
            // Вариант 3: Парсинг через страницу видео (запасной вариант)
            try {
                // Получаем HTML страницы видео
                const videoPageResponse = await axios_1.default.get(`https://www.youtube.com/watch?v=${videoId}`, {
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
                    const englishCaptions = captionsData.find((track) => { var _a, _b; return track.languageCode === 'en' || ((_b = (_a = track.name) === null || _a === void 0 ? void 0 : _a.simpleText) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes('english')); });
                    if (englishCaptions && englishCaptions.baseUrl) {
                        const captionsUrl = englishCaptions.baseUrl;
                        const captionsResponse = await axios_1.default.get(captionsUrl);
                        const $ = cheerio.load(captionsResponse.data, { xmlMode: true });
                        // Парсим XML субтитров
                        const lyrics = [];
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
            }
            catch (parseError) {
                logger_1.logger.error(`Error parsing video page for captions: ${parseError}`);
            }
            // Если все методы не сработали, возвращаем пустой массив
            logger_1.logger.warn(`No lyrics found for YouTube video: ${videoId}`);
            return [];
        }
        catch (error) {
            logger_1.logger.error(`Error getting lyrics from YouTube: ${error}`);
            return [];
        }
    }
    /**
     * Получает только текст песни без таймкодов
     */
    async getLyricsText(youtubeUrl) {
        try {
            const lyricsWithTimestamps = await this.getLyricsWithTimestamps(youtubeUrl);
            return lyricsWithTimestamps
                .map(line => line.text)
                .join('\n');
        }
        catch (error) {
            logger_1.logger.error(`Error getting lyrics text: ${error}`);
            return '';
        }
    }
    /**
     * Очищает субтитры, удаляя ненужные тэги, лишние пробелы и т.д.
     */
    cleanLyrics(lyrics) {
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
exports.YouTubeSubtitlesService = YouTubeSubtitlesService;
// Экспортируем экземпляр сервиса для использования в других модулях
exports.youtubeSubtitlesService = new YouTubeSubtitlesService();
