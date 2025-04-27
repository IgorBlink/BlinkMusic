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
exports.getRecommendedTracks = exports.removeFromFavorites = exports.addToFavorites = exports.getFavoriteTracks = exports.getTracksByGenre = exports.searchTracks = exports.getTrackById = exports.getAllTracks = void 0;
const User_1 = __importDefault(require("../models/User"));
const logger_1 = require("../utils/logger");
const trackService_1 = require("../services/trackService");
const mongoose_1 = __importStar(require("mongoose"));
/**
 * @desc    Получение всех треков с пагинацией
 * @route   GET /api/tracks
 * @access  Public
 */
const getAllTracks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || '-createdAt';
        const result = await trackService_1.trackService.getAllTracks(page, limit, sort);
        res.status(200).json({
            success: true,
            count: result.tracks.length,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            data: result.tracks,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in getAllTracks: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить список треков',
            error: error.message,
        });
    }
};
exports.getAllTracks = getAllTracks;
/**
 * @desc    Получение трека по ID или информации о треке по artist-title
 * @route   GET /api/tracks/:id
 * @access  Public
 */
const getTrackById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await trackService_1.trackService.getTrackById(id);
        // Если это объект MongoDB, нужно вызвать toObject
        const trackData = result.track.toObject ? result.track.toObject() : result.track;
        res.status(200).json({
            success: true,
            data: trackData,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in getTrackById: ${error.message}`);
        // Разные статус-коды в зависимости от типа ошибки
        if (error.message.includes('Неверный формат ID')) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        else if (error.message.includes('не найден')) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Не удалось получить информацию о треке',
            error: error.message,
        });
    }
};
exports.getTrackById = getTrackById;
/**
 * @desc    Поиск треков
 * @route   GET /api/tracks/search
 * @access  Public
 */
const searchTracks = async (req, res) => {
    try {
        const { query } = req.query;
        const limit = parseInt(req.query.limit) || 10;
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Поисковый запрос обязателен',
            });
        }
        const tracks = await trackService_1.trackService.searchTracks(query, limit);
        res.status(200).json({
            success: true,
            count: tracks.length,
            data: tracks,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in searchTracks: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Не удалось выполнить поиск треков',
            error: error.message,
        });
    }
};
exports.searchTracks = searchTracks;
/**
 * @desc    Получение треков по жанру
 * @route   GET /api/tracks/genre/:genre
 * @access  Public
 */
const getTracksByGenre = async (req, res) => {
    try {
        const { genre } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        if (!genre || genre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать жанр',
            });
        }
        const tracks = await trackService_1.trackService.getTracksByGenre(genre, limit);
        res.status(200).json({
            success: true,
            count: tracks.length,
            data: tracks,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in getTracksByGenre: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить треки по жанру',
            error: error.message,
        });
    }
};
exports.getTracksByGenre = getTracksByGenre;
/**
 * @desc    Получение избранных треков пользователя
 * @route   GET /api/tracks/favorites
 * @access  Private
 */
const getFavoriteTracks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Необходима аутентификация',
            });
        }
        logger_1.logger.info(`Getting favorites for user ${req.user._id}`);
        // Находим пользователя и подгружаем его избранные треки
        const user = await User_1.default.findById(req.user._id).populate('favorites');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден',
            });
        }
        res.status(200).json({
            success: true,
            count: user.favorites.length,
            data: user.favorites,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in getFavoriteTracks: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить избранные треки',
            error: error.message,
        });
    }
};
exports.getFavoriteTracks = getFavoriteTracks;
/**
 * @desc    Добавление трека в избранное
 * @route   POST /api/tracks/:id/favorite
 * @access  Private
 */
const addToFavorites = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Необходима аутентификация',
            });
        }
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Неверный формат ID трека',
            });
        }
        // Проверяем, есть ли уже этот трек в избранном
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден',
            });
        }
        // Проверяем, есть ли трек уже в избранном
        const trackObjectId = new mongoose_1.Types.ObjectId(id);
        const isAlreadyFavorite = user.favorites.some((favoriteId) => favoriteId.equals(trackObjectId));
        if (isAlreadyFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Трек уже добавлен в избранное',
            });
        }
        // Добавляем трек в избранное
        user.favorites.push(trackObjectId);
        await user.save();
        // Обновляем счетчик лайков трека
        const track = await trackService_1.trackService.addToFavorites(req.user._id.toString(), id);
        res.status(200).json({
            success: true,
            message: 'Трек добавлен в избранное',
            data: track,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in addToFavorites: ${error.message}`);
        if (error.message.includes('не найден')) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Не удалось добавить трек в избранное',
            error: error.message,
        });
    }
};
exports.addToFavorites = addToFavorites;
/**
 * @desc    Удаление трека из избранного
 * @route   DELETE /api/tracks/:id/favorite
 * @access  Private
 */
const removeFromFavorites = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Необходима аутентификация',
            });
        }
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Неверный формат ID трека',
            });
        }
        // Проверяем, есть ли трек в избранном
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден',
            });
        }
        // Проверяем, есть ли трек в избранном
        const trackObjectId = new mongoose_1.Types.ObjectId(id);
        const trackIndex = user.favorites.findIndex((favoriteId) => favoriteId.equals(trackObjectId));
        if (trackIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Трек не найден в избранном',
            });
        }
        // Удаляем трек из избранного
        user.favorites.splice(trackIndex, 1);
        await user.save();
        // Обновляем счетчик лайков трека
        const track = await trackService_1.trackService.removeFromFavorites(req.user._id.toString(), id);
        res.status(200).json({
            success: true,
            message: 'Трек удален из избранного',
            data: track,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in removeFromFavorites: ${error.message}`);
        if (error.message.includes('не найден')) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Не удалось удалить трек из избранного',
            error: error.message,
        });
    }
};
exports.removeFromFavorites = removeFromFavorites;
/**
 * @desc    Получение рекомендованных треков
 * @route   GET /api/tracks/recommended
 * @access  Public
 */
const getRecommendedTracks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        // Получаем рекомендованные треки через сервис
        const tracks = await trackService_1.trackService.getRecommendedTracks(limit);
        res.status(200).json({
            success: true,
            count: tracks.length,
            data: tracks,
        });
    }
    catch (error) {
        logger_1.logger.error(`Error in getRecommendedTracks: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить рекомендованные треки',
            error: error.message,
        });
    }
};
exports.getRecommendedTracks = getRecommendedTracks;
