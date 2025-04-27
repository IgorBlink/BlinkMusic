"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("./logger");
/**
 * Utility функции для работы с JWT, чтобы избежать проблем с типизацией
 */
exports.JwtUtils = {
    /**
     * Подписывает токен и возвращает JWT строку
     */
    sign(payload, secret, options) {
        try {
            return jsonwebtoken_1.default.sign(payload, secret, options);
        }
        catch (error) {
            logger_1.logger.error('Ошибка создания JWT токена:', error);
            throw error;
        }
    },
    /**
     * Верифицирует токен и возвращает декодированные данные
     */
    verify(token, secret) {
        try {
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            logger_1.logger.error('Ошибка верификации JWT токена:', error);
            throw error;
        }
    },
};
