import { Router } from 'express';
import {
  getSyncedLyrics,
  updateSyncedLyrics,
  deleteSyncedLyrics,
  getLyricsByTrackId,
  getLyricsByYoutubeUrl
} from '../controllers/lyricsController';
import { authenticate, isAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @route GET /api/lyrics/youtube
 * @desc Получение текста песни из YouTube субтитров по URL
 * @access Public
 */
router.get('/youtube', getLyricsByYoutubeUrl);

/**
 * @route GET /api/lyrics/track/:id
 * @desc Получение текста песни из YouTube субтитров по ID трека
 * @access Public
 */
router.get('/track/:id', getLyricsByTrackId);

/**
 * @route GET /api/lyrics/:trackId
 * @desc Получение синхронизированного текста песни
 * @access Public
 */
router.get('/:trackId', getSyncedLyrics);

/**
 * @route PUT /api/lyrics/:trackId
 * @desc Обновление синхронизированного текста песни
 * @access Private (Admin)
 */
router.put('/:trackId', authenticate, isAdmin, updateSyncedLyrics);

/**
 * @route DELETE /api/lyrics/:trackId
 * @desc Удаление синхронизированного текста песни
 * @access Private (Admin)
 */
router.delete('/:trackId', authenticate, isAdmin, deleteSyncedLyrics);

export default router; 