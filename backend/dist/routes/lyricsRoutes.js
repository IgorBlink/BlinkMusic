"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lyricsController_1 = require("../controllers/lyricsController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/lyrics/youtube
 * @desc Получение текста песни из YouTube субтитров по URL
 * @access Public
 */
router.get('/youtube', lyricsController_1.getLyricsByYoutubeUrl);
/**
 * @route GET /api/lyrics/track/:id
 * @desc Получение текста песни из YouTube субтитров по ID трека
 * @access Public
 */
router.get('/track/:id', lyricsController_1.getLyricsByTrackId);
/**
 * @route GET /api/lyrics/:trackId
 * @desc Получение синхронизированного текста песни
 * @access Public
 */
router.get('/:trackId', lyricsController_1.getSyncedLyrics);
/**
 * @route PUT /api/lyrics/:trackId
 * @desc Обновление синхронизированного текста песни
 * @access Private (Admin)
 */
router.put('/:trackId', auth_1.authenticate, auth_1.isAdmin, lyricsController_1.updateSyncedLyrics);
/**
 * @route DELETE /api/lyrics/:trackId
 * @desc Удаление синхронизированного текста песни
 * @access Private (Admin)
 */
router.delete('/:trackId', auth_1.authenticate, auth_1.isAdmin, lyricsController_1.deleteSyncedLyrics);
exports.default = router;
