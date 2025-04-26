import { Router } from 'express';
import {
  getAllTracks,
  getTrackById,
  searchTracks,
  getTracksByGenre,
  getFavoriteTracks,
  addToFavorites,
  removeFromFavorites,
  getRecommendedTracks
} from '../controllers/trackController';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @route GET /api/tracks
 * @desc Получение всех треков с пагинацией
 * @access Public
 */
router.get('/', getAllTracks);

/**
 * @route GET /api/tracks/search
 * @desc Поиск треков
 * @access Public
 */
router.get('/search', searchTracks);

/**
 * @route GET /api/tracks/recommended
 * @desc Получение рекомендованных треков
 * @access Public
 */
router.get('/recommended', getRecommendedTracks);

/**
 * @route GET /api/tracks/genre/:genre
 * @desc Получение треков по жанру
 * @access Public
 */
router.get('/genre/:genre', getTracksByGenre);

/**
 * @route GET /api/tracks/favorites
 * @desc Получение избранных треков пользователя
 * @access Private
 */
router.get('/favorites', authenticate, getFavoriteTracks);

/**
 * @route GET /api/tracks/:id
 * @desc Получение трека по ID
 * @access Public
 */
router.get('/:id', getTrackById);

/**
 * @route POST /api/tracks/:id/favorite
 * @desc Добавление трека в избранное
 * @access Private
 */
router.post('/:id/favorite', authenticate, addToFavorites);

/**
 * @route DELETE /api/tracks/:id/favorite
 * @desc Удаление трека из избранного
 * @access Private
 */
router.delete('/:id/favorite', authenticate, removeFromFavorites);

export default router; 