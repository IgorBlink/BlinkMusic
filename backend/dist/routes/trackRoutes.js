"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trackController_1 = require("../controllers/trackController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/tracks
 * @desc Получение всех треков с пагинацией
 * @access Public
 */
router.get('/', trackController_1.getAllTracks);
/**
 * @route GET /api/tracks/search
 * @desc Поиск треков
 * @access Public
 */
router.get('/search', trackController_1.searchTracks);
/**
 * @route GET /api/tracks/recommended
 * @desc Получение рекомендованных треков
 * @access Public
 */
router.get('/recommended', trackController_1.getRecommendedTracks);
/**
 * @route GET /api/tracks/genre/:genre
 * @desc Получение треков по жанру
 * @access Public
 */
router.get('/genre/:genre', trackController_1.getTracksByGenre);
/**
 * @route GET /api/tracks/favorites
 * @desc Получение избранных треков пользователя
 * @access Private
 */
router.get('/favorites', auth_1.authenticate, trackController_1.getFavoriteTracks);
/**
 * @route GET /api/tracks/:id
 * @desc Получение трека по ID
 * @access Public
 */
router.get('/:id', trackController_1.getTrackById);
/**
 * @route POST /api/tracks/:id/favorite
 * @desc Добавление трека в избранное
 * @access Private
 */
router.post('/:id/favorite', auth_1.authenticate, trackController_1.addToFavorites);
/**
 * @route DELETE /api/tracks/:id/favorite
 * @desc Удаление трека из избранного
 * @access Private
 */
router.delete('/:id/favorite', auth_1.authenticate, trackController_1.removeFromFavorites);
exports.default = router;
