"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const jwt_1 = __importDefault(require("../config/jwt"));
const logger_1 = require("../utils/logger");
const jwt_2 = require("../utils/jwt");
class AuthService {
    /**
     * Регистрация нового пользователя
     */
    async register(userData) {
        try {
            // Проверяем, существует ли пользователь с таким email или username
            const existingUser = await User_1.default.findOne({
                $or: [{ email: userData.email }, { username: userData.username }],
            });
            if (existingUser) {
                throw new Error(existingUser.email === userData.email
                    ? 'Email уже используется'
                    : 'Имя пользователя уже занято');
            }
            // Создаем нового пользователя
            const user = new User_1.default(userData);
            await user.save();
            // Генерируем токены
            const tokens = await this.generateTokens(user);
            // Не возвращаем пароль в ответе
            const userResponse = user.toObject();
            // Безопасно удаляем пароль из объекта
            const { password: _, ...userWithoutPassword } = userResponse;
            return { user: userWithoutPassword, tokens };
        }
        catch (error) {
            logger_1.logger.error('Error in register service:', error);
            throw error;
        }
    }
    /**
     * Авторизация пользователя
     */
    async login(emailOrUsername, password) {
        try {
            // Ищем пользователя по email или username
            const user = await User_1.default.findOne({
                $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
            });
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            // Проверяем пароль
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                throw new Error('Неверный пароль');
            }
            // Генерируем токены
            const tokens = await this.generateTokens(user);
            // Не возвращаем пароль в ответе
            const userResponse = user.toObject();
            // Безопасно удаляем пароль из объекта
            const { password: _, ...userWithoutPassword } = userResponse;
            return { user: userWithoutPassword, tokens };
        }
        catch (error) {
            logger_1.logger.error('Error in login service:', error);
            throw error;
        }
    }
    /**
     * Выход из системы (отзыв токена)
     */
    async logout(refreshToken) {
        try {
            if (!refreshToken) {
                throw new Error('Refresh token отсутствует');
            }
            // Находим и отзываем токен в БД
            await RefreshToken_1.default.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
        }
        catch (error) {
            logger_1.logger.error('Error in logout service:', error);
            throw error;
        }
    }
    /**
     * Обновление токенов
     */
    async refreshTokens(refreshToken) {
        try {
            if (!refreshToken) {
                throw new Error('Refresh token отсутствует');
            }
            // Проверяем существование и действительность токена
            const tokenDoc = await RefreshToken_1.default.findOne({
                token: refreshToken,
                isRevoked: false,
            });
            if (!tokenDoc) {
                throw new Error('Токен недействителен или отозван');
            }
            // Проверяем срок действия
            if (tokenDoc.expiresAt < new Date()) {
                await RefreshToken_1.default.updateOne({ _id: tokenDoc._id }, { isRevoked: true });
                throw new Error('Токен истек');
            }
            // Проверяем и декодируем токен
            let payload;
            try {
                payload = jwt_2.JwtUtils.verify(refreshToken, jwt_1.default.secret);
            }
            catch (error) {
                await RefreshToken_1.default.updateOne({ _id: tokenDoc._id }, { isRevoked: true });
                throw new Error('Недействительный токен');
            }
            // Находим пользователя
            const user = await User_1.default.findById(payload.id);
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            // Отзываем старый токен
            await RefreshToken_1.default.updateOne({ _id: tokenDoc._id }, { isRevoked: true });
            // Генерируем новые токены
            return this.generateTokens(user);
        }
        catch (error) {
            logger_1.logger.error('Error in refresh tokens service:', error);
            throw error;
        }
    }
    /**
     * Генерация пары токенов (access и refresh)
     */
    async generateTokens(user) {
        try {
            const payload = {
                id: user._id.toString(),
                username: user.username,
                isAdmin: user.isAdmin,
            };
            // Опции для токенов
            const accessOptions = {
                expiresIn: jwt_1.default.accessExpiration,
            };
            const refreshOptions = {
                expiresIn: jwt_1.default.refreshExpiration,
            };
            // Генерируем access token используя утилиту
            const accessToken = jwt_2.JwtUtils.sign(payload, jwt_1.default.secret, accessOptions);
            // Генерируем refresh token используя утилиту
            const refreshToken = jwt_2.JwtUtils.sign(payload, jwt_1.default.secret, refreshOptions);
            // Рассчитываем дату истечения refresh токена
            const refreshExpiration = new Date();
            const expirationMs = this.parseDuration(jwt_1.default.refreshExpiration);
            refreshExpiration.setMilliseconds(refreshExpiration.getMilliseconds() + expirationMs);
            // Сохраняем refresh token в БД
            await RefreshToken_1.default.create({
                userId: user._id,
                token: refreshToken,
                expiresAt: refreshExpiration,
            });
            return { accessToken, refreshToken };
        }
        catch (error) {
            logger_1.logger.error('Error generating tokens:', error);
            throw error;
        }
    }
    /**
     * Парсит строку с длительностью (например, '7d') в миллисекунды
     */
    parseDuration(duration) {
        const unit = duration.slice(-1);
        const value = parseInt(duration.slice(0, -1));
        switch (unit) {
            case 's':
                return value * 1000;
            case 'm':
                return value * 60 * 1000;
            case 'h':
                return value * 60 * 60 * 1000;
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            default:
                return value;
        }
    }
}
exports.AuthService = AuthService;
