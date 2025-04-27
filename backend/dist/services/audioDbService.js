"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioDbService = exports.AudioDbService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения
dotenv_1.default.config();
// API ключ AudioDB - используем бесплатный доступ с ключом 2
const AUDIODB_API_KEY = process.env.AUDIODB_API_KEY || '2';
const AUDIODB_API_URL = 'https://theaudiodb.com/api/v1/json';
class AudioDbService {
    /**
     * Получает полную информацию о треке из AudioDB API
     * @param artist Имя исполнителя
     * @param title Название трека
     * @returns Объект с информацией о треке или null, если трек не найден
     */
    async getTrackInfo(artist, title) {
        try {
            logger_1.logger.info(`Getting track info for "${title}" by "${artist}" from AudioDB`);
            // Сначала пытаемся получить детали трека
            const trackDetails = await this.getTrackDetails(artist, title);
            if (trackDetails) {
                logger_1.logger.info(`Found track details for "${title}" by "${artist}" in AudioDB`);
                return {
                    genre: trackDetails.strGenre ? [trackDetails.strGenre] : undefined,
                    year: trackDetails.intYearReleased,
                    mood: trackDetails.strMood,
                    style: trackDetails.strStyle,
                    description: trackDetails.strDescriptionEN,
                    country: trackDetails.strCountry,
                    albumCover: trackDetails.strAlbumThumb,
                    album: trackDetails.strAlbum
                };
            }
            // Если трек не найден, пытаемся получить хотя бы информацию об исполнителе
            const artistInfo = await this.getArtistInfo(artist);
            if (artistInfo) {
                logger_1.logger.info(`Found artist info for "${artist}" in AudioDB`);
                return {
                    genre: artistInfo.strGenre ? [artistInfo.strGenre] : undefined,
                    year: artistInfo.intFormedYear,
                    mood: artistInfo.strMood,
                    style: artistInfo.strStyle,
                    description: artistInfo.strBiographyEN,
                    country: artistInfo.strCountry,
                    albumCover: artistInfo.strArtistThumb
                };
            }
            logger_1.logger.info(`No information found for "${title}" by "${artist}" in AudioDB`);
            return null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting track info from AudioDB: ${error.message}`);
            return null;
        }
    }
    /**
     * Обогащение метаданных трека из AudioDB
     * Эта функция принимает базовую информацию о треке и дополняет ее метаданными из AudioDB
     */
    async enrichTrackMetadata(track) {
        try {
            logger_1.logger.info(`Enriching metadata for "${track.title}" by "${track.artist}"`);
            // Получаем детали трека
            const trackDetails = await this.getTrackDetails(track.artist, track.title);
            // Улучшаем обложку, если нужно
            let enhancedCoverUrl = track.coverUrl;
            // Если трек найден и содержит ссылку на обложку альбома через AudioDB
            if (trackDetails && trackDetails.strAlbumThumb) {
                enhancedCoverUrl = trackDetails.strAlbumThumb;
                logger_1.logger.info(`Found album cover from AudioDB for "${track.title}" by "${track.artist}"`);
            }
            // Если у нас есть URL iTunes или Deezer API, получаем настоящую обложку
            else if (track.coverUrl && (track.coverUrl.includes('itunes.apple.com') || track.coverUrl.includes('api.deezer.com'))) {
                try {
                    let coverUrl = track.coverUrl;
                    // Обрабатываем iTunes API response
                    if (coverUrl.includes('itunes.apple.com')) {
                        const response = await axios_1.default.get(coverUrl);
                        if (response.data && response.data.results && response.data.results.length > 0) {
                            // Извлекаем URL обложки, заменяя размер на больший
                            const artworkUrl = response.data.results[0].artworkUrl100;
                            if (artworkUrl) {
                                enhancedCoverUrl = artworkUrl.replace('100x100', '600x600');
                                logger_1.logger.info(`Found enhanced cover from iTunes for "${track.title}" by "${track.artist}"`);
                            }
                        }
                    }
                    // Обрабатываем Deezer API response
                    if (coverUrl.includes('api.deezer.com')) {
                        const response = await axios_1.default.get(coverUrl);
                        if (response.data && response.data.data && response.data.data.length > 0) {
                            // Извлекаем URL обложки альбома
                            const album = response.data.data[0].album;
                            if (album && album.cover_big) {
                                enhancedCoverUrl = album.cover_big;
                                logger_1.logger.info(`Found enhanced cover from Deezer for "${track.title}" by "${track.artist}"`);
                            }
                        }
                    }
                }
                catch (apiError) {
                    logger_1.logger.error(`Error fetching cover from API: ${apiError}`);
                }
            }
            // Если нет информации о треке, пытаемся получить информацию об исполнителе
            if (!trackDetails) {
                const artistInfo = await this.getArtistInfo(track.artist);
                if (artistInfo) {
                    // Если есть обложка исполнителя и нет лучшей обложки
                    if (artistInfo.strArtistThumb && (!enhancedCoverUrl || enhancedCoverUrl.includes('picsum.photos'))) {
                        enhancedCoverUrl = artistInfo.strArtistThumb;
                        logger_1.logger.info(`Using artist image from AudioDB for "${track.title}" by "${track.artist}"`);
                    }
                    return {
                        genre: artistInfo.strGenre,
                        biography: artistInfo.strBiographyEN,
                        thumb: artistInfo.strArtistThumb,
                        coverUrl: enhancedCoverUrl
                    };
                }
                // Если нет данных от AudioDB, но есть обложка
                if (enhancedCoverUrl) {
                    return { coverUrl: enhancedCoverUrl };
                }
                logger_1.logger.info(`No additional info found for "${track.title}" by "${track.artist}"`);
                return null;
            }
            // Возвращаем метаданные трека с улучшенной обложкой
            return {
                trackId: trackDetails.idTrack,
                albumId: trackDetails.idAlbum,
                genre: trackDetails.strGenre,
                duration: trackDetails.intDuration,
                musicVideo: trackDetails.strMusicVid,
                description: trackDetails.strDescriptionEN,
                mood: trackDetails.strMood,
                theme: trackDetails.strTheme,
                coverUrl: enhancedCoverUrl
            };
        }
        catch (error) {
            logger_1.logger.error(`Error enriching metadata: ${error.message}`);
            return null;
        }
    }
    /**
     * Получить информацию о треке
     */
    async getTrackDetails(artistName, trackName) {
        var _a;
        try {
            logger_1.logger.info(`Fetching track details for "${trackName}" by "${artistName}" from AudioDB`);
            const response = await axios_1.default.get(`${AUDIODB_API_URL}/${AUDIODB_API_KEY}/searchtrack.php`, {
                params: {
                    s: artistName,
                    t: trackName
                }
            });
            const tracks = (_a = response.data) === null || _a === void 0 ? void 0 : _a.track;
            if (!tracks || tracks.length === 0) {
                logger_1.logger.info(`No track details found for "${trackName}" by "${artistName}" in AudioDB`);
                return null;
            }
            // Берем первый трек из результатов
            const track = tracks[0];
            logger_1.logger.info(`Found track details for "${trackName}" by "${artistName}" in AudioDB`);
            return track;
        }
        catch (error) {
            logger_1.logger.error(`Error getting track details for "${trackName}" by "${artistName}" from AudioDB: ${error.message}`);
            return null;
        }
    }
    /**
     * Получить информацию об исполнителе
     */
    async getArtistInfo(artistName) {
        var _a;
        try {
            logger_1.logger.info(`Fetching artist info for "${artistName}" from AudioDB`);
            const response = await axios_1.default.get(`${AUDIODB_API_URL}/${AUDIODB_API_KEY}/search.php`, {
                params: {
                    s: artistName
                }
            });
            const artists = (_a = response.data) === null || _a === void 0 ? void 0 : _a.artists;
            if (!artists || artists.length === 0) {
                logger_1.logger.info(`No artist info found for "${artistName}" in AudioDB`);
                return null;
            }
            // Берем первого исполнителя из результатов
            const artist = artists[0];
            logger_1.logger.info(`Found artist info for "${artistName}" in AudioDB`);
            return artist;
        }
        catch (error) {
            logger_1.logger.error(`Error getting artist info for "${artistName}" from AudioDB: ${error.message}`);
            return null;
        }
    }
}
exports.AudioDbService = AudioDbService;
// Экспортируем экземпляр сервиса для использования в других модулях
exports.audioDbService = new AudioDbService();
