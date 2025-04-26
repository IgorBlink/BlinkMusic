import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
} from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Регистрация нового пользователя
 * @access Public
 */
router.post('/register', registerUser);

/**
 * @route POST /api/auth/login
 * @desc Авторизация пользователя
 * @access Public
 */
router.post('/login', loginUser);

/**
 * @route POST /api/auth/refresh
 * @desc Обновление токена доступа
 * @access Public
 */
router.post('/refresh', refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Выход из системы
 * @access Public
 */
router.post('/logout', logoutUser);

/**
 * @route GET /api/auth/me
 * @desc Получение данных текущего пользователя
 * @access Private
 */
router.get('/me', authenticate, getCurrentUser);

export default router; 