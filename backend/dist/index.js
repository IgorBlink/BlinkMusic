"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения в самом начале
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const logger_1 = require("./utils/logger");
// Проверяем наличие ключевых переменных окружения
if (!process.env.MONGODB_URI) {
    logger_1.logger.warn('MONGODB_URI is not set in environment variables. Using default connection string.');
}
if (!process.env.JWT_SECRET) {
    logger_1.logger.warn('JWT_SECRET is not set in environment variables. Using default value.');
}
// Проверяем наличие API ключей
if (!process.env.LASTFM_API_KEY) {
    logger_1.logger.warn('LASTFM_API_KEY is not set. Last.fm integration will use mock data.');
}
if (!process.env.AUDIODB_API_KEY) {
    logger_1.logger.warn('AUDIODB_API_KEY is not set. Using free tier (API key "2").');
}
// Устанавливаем порт для сервера
const PORT = process.env.PORT || 5000;
// Функция запуска сервера
const startServer = async () => {
    try {
        // Подключаемся к базе данных
        await (0, database_1.default)();
        // Запускаем сервер
        app_1.default.listen(PORT, () => {
            logger_1.logger.info(`Сервер запущен в режиме ${process.env.NODE_ENV} на порту ${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Ошибка при запуске сервера:', error);
        process.exit(1);
    }
};
// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Необработанное исключение:', error);
    process.exit(1);
});
// Обработка необработанных отклонений промисов
process.on('unhandledRejection', (error) => {
    logger_1.logger.error('Необработанное отклонение промиса:', error);
    process.exit(1);
});
// Запускаем сервер
startServer();
