"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jamendoService = exports.JamendoService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const Track_1 = __importDefault(require("../models/Track"));
// Настройки для Jamendo API
const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || 'YOUR_JAMENDO_CLIENT_ID';
const JAMENDO_API_URL = 'https://api.jamendo.com/v3.0';
class JamendoService {
    /**
     * Поиск треков в Jamendo по запросу
     */
    async searchTracks(query, limit = 10) {
        try {
            const response = await axios_1.default.get(`${JAMENDO_API_URL}/tracks/`, {
                params: {
                    client_id: JAMENDO_CLIENT_ID,
                    format: 'json',
                    limit,
                    search: query,
                    include: 'musicinfo',
                    audioformat: 'mp32',
                    boost: 'popularity'
                }
            });
            if (!response.data.results || response.data.results.length === 0) {
                return [];
            }
            const tracks = await this.convertAndSaveTracks(response.data.results);
            return tracks;
        }
        catch (error) {
            logger_1.logger.error('Error searching tracks in Jamendo:', error);
            return [];
        }
    }
    /**
     * Получение случайного трека из Jamendo
     */
    async getRandomTrack() {
        try {
            // Сначала проверяем, есть ли уже треки в БД
            const count = await Track_1.default.countDocuments({ source: 'jamendo' });
            if (count > 0) {
                // Если есть треки, выбираем случайный из БД
                const random = Math.floor(Math.random() * count);
                const track = await Track_1.default.findOne({ source: 'jamendo' }).skip(random);
                return track;
            }
            else {
                // Если треков нет, получаем новые из API
                const response = await axios_1.default.get(`${JAMENDO_API_URL}/tracks/`, {
                    params: {
                        client_id: JAMENDO_CLIENT_ID,
                        format: 'json',
                        limit: 20,
                        include: 'musicinfo',
                        audioformat: 'mp32',
                        boost: 'popularity',
                        order: 'randomized'
                    }
                });
                if (!response.data.results || response.data.results.length === 0) {
                    return null;
                }
                const tracks = await this.convertAndSaveTracks(response.data.results);
                return tracks.length > 0 ? tracks[0] : null;
            }
        }
        catch (error) {
            logger_1.logger.error('Error getting random track from Jamendo:', error);
            return null;
        }
    }
    /**
     * Получение популярных треков из Jamendo
     */
    async getPopularTracks(limit = 10) {
        try {
            const response = await axios_1.default.get(`${JAMENDO_API_URL}/tracks/`, {
                params: {
                    client_id: JAMENDO_CLIENT_ID,
                    format: 'json',
                    limit,
                    include: 'musicinfo',
                    audioformat: 'mp32',
                    boost: 'popularity',
                    order: 'popularity_total'
                }
            });
            if (!response.data.results || response.data.results.length === 0) {
                return [];
            }
            const tracks = await this.convertAndSaveTracks(response.data.results);
            return tracks;
        }
        catch (error) {
            logger_1.logger.error('Error getting popular tracks from Jamendo:', error);
            return [];
        }
    }
    /**
     * Получение треков по жанру из Jamendo
     */
    async getTracksByGenre(genre, limit = 10) {
        try {
            const response = await axios_1.default.get(`${JAMENDO_API_URL}/tracks/`, {
                params: {
                    client_id: JAMENDO_CLIENT_ID,
                    format: 'json',
                    limit,
                    include: 'musicinfo',
                    audioformat: 'mp32',
                    tags: genre
                }
            });
            if (!response.data.results || response.data.results.length === 0) {
                return [];
            }
            const tracks = await this.convertAndSaveTracks(response.data.results);
            return tracks;
        }
        catch (error) {
            logger_1.logger.error(`Error getting ${genre} tracks from Jamendo:`, error);
            return [];
        }
    }
    /**
     * Преобразование и сохранение треков из Jamendo в БД
     */
    async convertAndSaveTracks(jamendoTracks) {
        var _a, _b, _c, _d;
        const tracks = [];
        for (const jamTrack of jamendoTracks) {
            // Проверяем, существует ли трек уже в БД
            let track = await Track_1.default.findOne({
                source: 'jamendo',
                sourceId: jamTrack.id
            });
            if (!track) {
                // Если трек не существует, создаем новый
                const genres = ((_b = (_a = jamTrack.musicinfo) === null || _a === void 0 ? void 0 : _a.genres) === null || _b === void 0 ? void 0 : _b.map(g => g.name)) || [];
                const tags = ((_d = (_c = jamTrack.musicinfo) === null || _c === void 0 ? void 0 : _c.tags) === null || _d === void 0 ? void 0 : _d.map(t => t.name)) || [];
                track = new Track_1.default({
                    title: jamTrack.name,
                    artist: jamTrack.artist_name,
                    album: jamTrack.album_name,
                    duration: Math.round(jamTrack.duration),
                    coverUrl: jamTrack.album_image,
                    audioUrl: jamTrack.audio,
                    previewUrl: jamTrack.audio, // У Jamendo полный трек доступен сразу
                    source: 'jamendo',
                    sourceId: jamTrack.id,
                    license: jamTrack.license_ccurl,
                    genre: genres,
                    tags: tags,
                    playCount: 0,
                    likeCount: 0,
                    isPublic: true
                });
                await track.save();
            }
            tracks.push(track);
        }
        return tracks;
    }
}
exports.JamendoService = JamendoService;
// Экспортируем экземпляр сервиса для использования в других модулях
exports.jamendoService = new JamendoService();
