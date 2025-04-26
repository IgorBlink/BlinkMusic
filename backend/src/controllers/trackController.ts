import { Request, Response } from 'express';
import Track from '../models/Track';
import User from '../models/User';
import { logger } from '../utils/logger';
import { trackService } from '../services/trackService';
import mongoose, { Types } from 'mongoose';

/**
 * @desc    Получение всех треков с пагинацией
 * @route   GET /api/tracks
 * @access  Public
 */
export const getAllTracks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort as string || '-createdAt';

    const result = await trackService.getAllTracks(page, limit, sort);
    
    res.status(200).json({
      success: true,
      count: result.tracks.length,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      data: result.tracks,
    });
  } catch (error: any) {
    logger.error(`Error in getAllTracks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить список треков',
      error: error.message,
    });
  }
};

/**
 * @desc    Получение трека по ID или информации о треке по artist-title
 * @route   GET /api/tracks/:id
 * @access  Public
 */
export const getTrackById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await trackService.getTrackById(id);
    
    // Если это объект MongoDB, нужно вызвать toObject
    const trackData = result.track.toObject ? result.track.toObject() : result.track;
    
    res.status(200).json({
      success: true,
      data: trackData,
    });
  } catch (error: any) {
    logger.error(`Error in getTrackById: ${error.message}`);
    
    // Разные статус-коды в зависимости от типа ошибки
    if (error.message.includes('Неверный формат ID')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    } else if (error.message.includes('не найден')) {
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

/**
 * @desc    Поиск треков
 * @route   GET /api/tracks/search
 * @access  Public
 */
export const searchTracks = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Поисковый запрос обязателен',
      });
    }

    const tracks = await trackService.searchTracks(query as string, limit);
    
    res.status(200).json({
      success: true,
      count: tracks.length,
      data: tracks,
    });
  } catch (error: any) {
    logger.error(`Error in searchTracks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Не удалось выполнить поиск треков',
      error: error.message,
    });
  }
};

/**
 * @desc    Получение треков по жанру
 * @route   GET /api/tracks/genre/:genre
 * @access  Public
 */
export const getTracksByGenre = async (req: Request, res: Response) => {
  try {
    const { genre } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!genre || genre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать жанр',
      });
    }

    const tracks = await trackService.getTracksByGenre(genre, limit);
    
    res.status(200).json({
      success: true,
      count: tracks.length,
      data: tracks,
    });
  } catch (error: any) {
    logger.error(`Error in getTracksByGenre: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить треки по жанру',
      error: error.message,
    });
  }
};

/**
 * @desc    Получение избранных треков пользователя
 * @route   GET /api/tracks/favorites
 * @access  Private
 */
export const getFavoriteTracks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Необходима аутентификация',
      });
    }

    logger.info(`Getting favorites for user ${req.user._id}`);
    
    // Находим пользователя и подгружаем его избранные треки
    const user = await User.findById(req.user._id).populate('favorites');
    
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
  } catch (error: any) {
    logger.error(`Error in getFavoriteTracks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить избранные треки',
      error: error.message,
    });
  }
};

/**
 * @desc    Добавление трека в избранное
 * @route   POST /api/tracks/:id/favorite
 * @access  Private
 */
export const addToFavorites = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Необходима аутентификация',
      });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат ID трека',
      });
    }

    // Проверяем, есть ли уже этот трек в избранном
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }
    
    // Проверяем, есть ли трек уже в избранном
    const trackObjectId = new Types.ObjectId(id);
    const isAlreadyFavorite = user.favorites.some(
      (favoriteId) => favoriteId.equals(trackObjectId)
    );
    
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
    const track = await trackService.addToFavorites(req.user._id.toString(), id);
    
    res.status(200).json({
      success: true,
      message: 'Трек добавлен в избранное',
      data: track,
    });
  } catch (error: any) {
    logger.error(`Error in addToFavorites: ${error.message}`);
    
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

/**
 * @desc    Удаление трека из избранного
 * @route   DELETE /api/tracks/:id/favorite
 * @access  Private
 */
export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Необходима аутентификация',
      });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат ID трека',
      });
    }

    // Проверяем, есть ли трек в избранном
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }
    
    // Проверяем, есть ли трек в избранном
    const trackObjectId = new Types.ObjectId(id);
    const trackIndex = user.favorites.findIndex(
      (favoriteId) => favoriteId.equals(trackObjectId)
    );
    
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
    const track = await trackService.removeFromFavorites(req.user._id.toString(), id);
    
    res.status(200).json({
      success: true,
      message: 'Трек удален из избранного',
      data: track,
    });
  } catch (error: any) {
    logger.error(`Error in removeFromFavorites: ${error.message}`);
    
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

/**
 * @desc    Получение рекомендованных треков
 * @route   GET /api/tracks/recommended
 * @access  Public
 */
export const getRecommendedTracks = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Получаем рекомендованные треки через сервис
    const tracks = await trackService.getRecommendedTracks(limit);
    
    res.status(200).json({
      success: true,
      count: tracks.length,
      data: tracks,
    });
  } catch (error: any) {
    logger.error(`Error in getRecommendedTracks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить рекомендованные треки',
      error: error.message,
    });
  }
}; 