"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLyricsByYoutubeUrl = exports.getLyricsByTrackId = exports.deleteSyncedLyrics = exports.updateSyncedLyrics = exports.getSyncedLyrics = void 0;
const logger_1 = require("../utils/logger");
const Track_1 = __importDefault(require("../models/Track"));
const youtubeLyricsService_1 = require("../services/youtubeLyricsService");
const SyncedLyrics_1 = __importDefault(require("../models/SyncedLyrics"));
const mongoose_1 = __importDefault(require("mongoose"));
const youtubeSubtitlesService_1 = require("../services/youtubeSubtitlesService");
/**
 * Получение синхронизированного текста песни по ID трека
 */
const getSyncedLyrics = async (req, res) => {
    try {
        const { trackId } = req.params;
        // Проверяем валидность ID трека
        if (!mongoose_1.default.Types.ObjectId.isValid(trackId)) {
            res.status(400).json({
                success: false,
                message: 'Неверный формат ID трека'
            });
            return;
        }
        // Ищем трек в базе данных
        const track = await Track_1.default.findById(trackId);
        if (!track) {
            res.status(404).json({
                success: false,
                message: 'Трек не найден'
            });
            return;
        }
        // Пытаемся получить синхронизированный текст
        const lyrics = await youtubeLyricsService_1.youtubeLyricsService.getSyncedLyricsForTrack(trackId, track.artist, track.title);
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
    }
    catch (error) {
        logger_1.logger.error(`Error getting synced lyrics: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при получении синхронизированного текста'
        });
    }
};
exports.getSyncedLyrics = getSyncedLyrics;
/**
 * Обновление синхронизированного текста песни
 * Только для админов
 */
const updateSyncedLyrics = async (req, res) => {
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
        if (!mongoose_1.default.Types.ObjectId.isValid(trackId)) {
            res.status(400).json({
                success: false,
                message: 'Неверный формат ID трека'
            });
            return;
        }
        // Ищем трек в базе данных
        const track = await Track_1.default.findById(trackId);
        if (!track) {
            res.status(404).json({
                success: false,
                message: 'Трек не найден'
            });
            return;
        }
        // Обновляем или создаем синхронизированный текст
        const updatedLyrics = await SyncedLyrics_1.default.findOneAndUpdate({ trackId: new mongoose_1.default.Types.ObjectId(trackId) }, {
            trackId: new mongoose_1.default.Types.ObjectId(trackId),
            language,
            source,
            lines
        }, { upsert: true, new: true });
        res.status(200).json({
            success: true,
            message: 'Синхронизированный текст успешно обновлен',
            data: updatedLyrics
        });
    }
    catch (error) {
        logger_1.logger.error(`Error updating synced lyrics: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при обновлении синхронизированного текста'
        });
    }
};
exports.updateSyncedLyrics = updateSyncedLyrics;
/**
 * Удаление синхронизированного текста песни
 * Только для админов
 */
const deleteSyncedLyrics = async (req, res) => {
    try {
        const { trackId } = req.params;
        // Проверяем валидность ID трека
        if (!mongoose_1.default.Types.ObjectId.isValid(trackId)) {
            res.status(400).json({
                success: false,
                message: 'Неверный формат ID трека'
            });
            return;
        }
        // Удаляем синхронизированный текст
        const result = await SyncedLyrics_1.default.deleteOne({
            trackId: new mongoose_1.default.Types.ObjectId(trackId)
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
    }
    catch (error) {
        logger_1.logger.error(`Error deleting synced lyrics: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при удалении синхронизированного текста'
        });
    }
};
exports.deleteSyncedLyrics = deleteSyncedLyrics;
/**
 * Получает текст песни по ID трека
 */
const getLyricsByTrackId = async (req, res) => {
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
        const track = await Track_1.default.findById(id);
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
            const lyricsWithTimestamps = await youtubeSubtitlesService_1.youtubeSubtitlesService.getLyricsWithTimestamps(track.audioUrl);
            const cleanedLyrics = youtubeSubtitlesService_1.youtubeSubtitlesService.cleanLyrics(lyricsWithTimestamps);
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
        }
        else {
            // Получаем простой текст песни
            const lyricsText = await youtubeSubtitlesService_1.youtubeSubtitlesService.getLyricsText(track.audioUrl);
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
    }
    catch (error) {
        logger_1.logger.error(`Error getting lyrics: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении текста песни'
        });
    }
};
exports.getLyricsByTrackId = getLyricsByTrackId;
/**
 * Получает текст песни по URL YouTube
 */
const getLyricsByYoutubeUrl = async (req, res) => {
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
            const lyricsWithTimestamps = await youtubeSubtitlesService_1.youtubeSubtitlesService.getLyricsWithTimestamps(url);
            const cleanedLyrics = youtubeSubtitlesService_1.youtubeSubtitlesService.cleanLyrics(lyricsWithTimestamps);
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
        }
        else {
            // Получаем простой текст песни
            const lyricsText = await youtubeSubtitlesService_1.youtubeSubtitlesService.getLyricsText(url);
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
    }
    catch (error) {
        logger_1.logger.error(`Error getting lyrics by YouTube URL: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении текста песни'
        });
    }
};
exports.getLyricsByYoutubeUrl = getLyricsByYoutubeUrl;
