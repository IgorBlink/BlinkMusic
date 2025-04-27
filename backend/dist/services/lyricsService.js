"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lyricsService = exports.LyricsService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const logger_1 = require("../utils/logger");
// Настройки для Genius API
const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN || 'YOUR_GENIUS_ACCESS_TOKEN';
const GENIUS_API_URL = 'https://api.genius.com';
class LyricsService {
    /**
     * Поиск текста песни по исполнителю и названию
     */
    async findLyrics(artist, title) {
        try {
            // Поиск песни в Genius
            const songUrl = await this.findSongUrl(artist, title);
            if (!songUrl) {
                logger_1.logger.info(`No lyrics found for ${artist} - ${title}`);
                return null;
            }
            // Парсинг страницы с текстом
            const lyrics = await this.scrapeLyrics(songUrl);
            return lyrics;
        }
        catch (error) {
            logger_1.logger.error(`Error finding lyrics for ${artist} - ${title}:`, error);
            return null;
        }
    }
    /**
     * Поиск URL песни в Genius
     */
    async findSongUrl(artist, title) {
        try {
            const response = await axios_1.default.get(`${GENIUS_API_URL}/search`, {
                headers: {
                    'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
                },
                params: {
                    q: `${artist} ${title}`
                }
            });
            const hits = response.data.response.hits;
            if (hits.length === 0) {
                return null;
            }
            // Находим наиболее релевантное совпадение
            for (const hit of hits) {
                const hitArtist = hit.result.primary_artist.name.toLowerCase();
                const hitTitle = hit.result.title.toLowerCase();
                // Проверяем, содержит ли результат имя исполнителя и название трека
                const artistMatches = hitArtist.includes(artist.toLowerCase()) ||
                    artist.toLowerCase().includes(hitArtist);
                const titleMatches = hitTitle.includes(title.toLowerCase()) ||
                    title.toLowerCase().includes(hitTitle);
                if (artistMatches && titleMatches) {
                    return hit.result.url;
                }
            }
            // Если нет точного совпадения, возвращаем первый результат
            return hits[0].result.url;
        }
        catch (error) {
            logger_1.logger.error(`Error searching song in Genius for ${artist} - ${title}:`, error);
            return null;
        }
    }
    /**
     * Извлечение текста песни со страницы Genius
     */
    async scrapeLyrics(url) {
        try {
            const response = await axios_1.default.get(url);
            const $ = cheerio_1.default.load(response.data);
            // Находим контейнер с текстом песни
            const lyricsContainer = $('[data-lyrics-container="true"]');
            if (lyricsContainer.length === 0) {
                return null;
            }
            // Извлекаем текст и форматируем его
            let lyrics = '';
            lyricsContainer.each((_, elem) => {
                var _a;
                lyrics += (_a = $(elem).html()) === null || _a === void 0 ? void 0 : _a.replace(/<br>/g, '\n').replace(/<(?:.|\n)*?>/gm, '');
            });
            return lyrics;
        }
        catch (error) {
            logger_1.logger.error(`Error scraping lyrics from ${url}:`, error);
            return null;
        }
    }
}
exports.LyricsService = LyricsService;
// Экспортируем экземпляр сервиса для использования в других модулях
exports.lyricsService = new LyricsService();
