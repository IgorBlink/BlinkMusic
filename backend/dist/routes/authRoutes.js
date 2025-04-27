"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
/**
 * @route POST /api/auth/register
 * @desc Регистрация нового пользователя
 * @access Public
 */
router.post('/register', authController_1.registerUser);
/**
 * @route POST /api/auth/login
 * @desc Авторизация пользователя
 * @access Public
 */
router.post('/login', authController_1.loginUser);
/**
 * @route POST /api/auth/refresh
 * @desc Обновление токена доступа
 * @access Public
 */
router.post('/refresh', authController_1.refreshToken);
/**
 * @route POST /api/auth/logout
 * @desc Выход из системы
 * @access Public
 */
router.post('/logout', authController_1.logoutUser);
/**
 * @route GET /api/auth/me
 * @desc Получение данных текущего пользователя
 * @access Private
 */
router.get('/me', auth_1.authenticate, authController_1.getCurrentUser);
exports.default = router;
