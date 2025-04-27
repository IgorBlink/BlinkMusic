"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOwnerOrAdmin = exports.isAdmin = exports.authenticate = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = __importDefault(require("../config/jwt"));
const logger_1 = require("../utils/logger");
const jwt_2 = require("../utils/jwt");
const authenticate = async (req, res, next) => {
    try {
        // Получаем токен из заголовка Authorization
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Требуется авторизация' });
            return;
        }
        try {
            // Верифицируем JWT токен с помощью утилиты
            const decoded = jwt_2.JwtUtils.verify(token, jwt_1.default.secret);
            // Находим пользователя по ID из токена
            const user = await User_1.default.findById(decoded.id).select('-password');
            if (!user) {
                res.status(401).json({ message: 'Пользователь не найден' });
                return;
            }
            // Добавляем пользователя в объект запроса
            req.user = user;
            next();
        }
        catch (error) {
            logger_1.logger.error('JWT verification error:', error);
            res.status(401).json({ message: 'Недействительный токен' });
        }
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};
exports.authenticate = authenticate;
// Middleware для проверки роли администратора
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    }
    else {
        res.status(403).json({
            message: 'Доступ запрещен. Требуются права администратора',
        });
    }
};
exports.isAdmin = isAdmin;
// Middleware для проверки владельца ресурса
const isOwnerOrAdmin = (resourceField) => {
    return (req, res, next) => {
        var _a, _b;
        const resourceId = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString();
        const resourceUserId = ((_b = req.body[resourceField]) === null || _b === void 0 ? void 0 : _b.toString()) || '';
        if ((req.user && req.user.isAdmin) ||
            userId === resourceId ||
            userId === resourceUserId) {
            next();
        }
        else {
            res.status(403).json({
                message: 'Доступ запрещен. Вы не являетесь владельцем ресурса',
            });
        }
    };
};
exports.isOwnerOrAdmin = isOwnerOrAdmin;
