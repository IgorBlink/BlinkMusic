"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coverArtService = exports.CoverArtService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
// Настройки для Spotify API
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'YOUR_SPOTIFY_CLIENT_SECRET';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
class CoverArtService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = 0;
    }
    /**
     * Поиск обложки альбома по исполнителю и названию трека/альбома
     */
    async findCoverArt(artist, trackOrAlbum) {
        try {
            await this.ensureValidToken();
            // Поиск трека в Spotify
            const response = await axios_1.default.get(`${SPOTIFY_API_URL}/search`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: {
                    q: `artist:${artist} track:${trackOrAlbum}`,
                    type: 'track',
                    limit: 5
                }
            });
            const tracks = response.data.tracks.items;
            if (tracks.length === 0) {
                // Если трек не найден, пробуем искать по альбому
                return await this.findAlbumCover(artist, trackOrAlbum);
            }
            // Получаем URL обложки из первого найденного трека
            const images = tracks[0].album.images;
            if (images && images.length > 0) {
                // Предпочитаем изображение среднего размера
                const mediumImage = images.find((img) => img.width === 300) || images[0];
                return mediumImage.url;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error finding cover art for ${artist} - ${trackOrAlbum}:`, error);
            return null;
        }
    }
    /**
     * Поиск обложки по названию альбома
     */
    async findAlbumCover(artist, album) {
        try {
            await this.ensureValidToken();
            const response = await axios_1.default.get(`${SPOTIFY_API_URL}/search`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                params: {
                    q: `artist:${artist} album:${album}`,
                    type: 'album',
                    limit: 5
                }
            });
            const albums = response.data.albums.items;
            if (albums.length === 0) {
                return null;
            }
            // Получаем URL обложки из первого найденного альбома
            const images = albums[0].images;
            if (images && images.length > 0) {
                const mediumImage = images.find((img) => img.width === 300) || images[0];
                return mediumImage.url;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error finding album cover for ${artist} - ${album}:`, error);
            return null;
        }
    }
    /**
     * Получение и обновление токена доступа для Spotify API
     */
    async ensureValidToken() {
        const currentTime = Date.now();
        // Проверяем, истек ли текущий токен
        if (!this.accessToken || currentTime >= this.tokenExpiry) {
            await this.refreshToken();
        }
    }
    /**
     * Обновление токена доступа
     */
    async refreshToken() {
        try {
            // Получаем новый токен через client credentials flow
            const response = await axios_1.default.post(SPOTIFY_TOKEN_URL, new URLSearchParams({
                grant_type: 'client_credentials'
            }).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                }
            });
            this.accessToken = response.data.access_token;
            // Устанавливаем время истечения токена (обычно 1 час)
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            logger_1.logger.info('Spotify access token refreshed');
        }
        catch (error) {
            logger_1.logger.error('Error refreshing Spotify access token:', error);
            this.accessToken = null;
            throw error;
        }
    }
}
exports.CoverArtService = CoverArtService;
// Экспортируем экземпляр сервиса для использования в других модулях
exports.coverArtService = new CoverArtService();
