"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
const trackService_1 = require("../services/trackService");
// Инициализируем переменные окружения
dotenv_1.default.config();
/**
 * Скрипт для обновления обложек всех треков в базе данных через iTunes API
 * Это необходимо при переходе на новую логику без сохранения в БД
 */
async function updateAllCovers() {
    try {
        logger_1.logger.info('Запуск скрипта обновления всех обложек');
        // Подключаемся к базе данных
        await mongoose_1.default.connect(process.env.MONGODB_URI || '');
        logger_1.logger.info('Подключено к MongoDB');
        // Запускаем обновление обложек
        await trackService_1.trackService.forceUseITunesCoverForAllTracks(200);
        // Отключаемся от базы данных
        await mongoose_1.default.disconnect();
        logger_1.logger.info('Отключено от MongoDB');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error(`Ошибка при обновлении обложек: ${error}`);
        try {
            await mongoose_1.default.disconnect();
        }
        catch (e) {
            logger_1.logger.error(`Ошибка при отключении от MongoDB: ${e}`);
        }
        process.exit(1);
    }
}
// Запускаем скрипт
updateAllCovers();
