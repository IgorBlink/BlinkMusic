"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
const Track_1 = __importDefault(require("../models/Track"));
const trackService_1 = require("../services/trackService");
// Инициализируем переменные окружения
dotenv_1.default.config();
/**
 * Функция обновления обложки для трека "Feel Good Inc." by "Gorillaz"
 */
async function updateTrackCover() {
    try {
        logger_1.logger.info('Starting cover update script');
        // Подключаемся к базе данных
        await mongoose_1.default.connect(process.env.MONGODB_URI || '');
        logger_1.logger.info('Connected to MongoDB');
        // Ищем трек "Feel Good Inc." by "Gorillaz"
        const tracks = await Track_1.default.find({
            title: { $regex: 'Feel Good Inc', $options: 'i' },
            artist: { $regex: 'Gorillaz', $options: 'i' }
        });
        if (tracks.length === 0) {
            logger_1.logger.info('Track not found');
            await mongoose_1.default.disconnect();
            process.exit(0);
        }
        // Выводим найденный трек
        logger_1.logger.info(`Found ${tracks.length} tracks`);
        logger_1.logger.info(`Current track data:`);
        logger_1.logger.info(`- Title: ${tracks[0].title}`);
        logger_1.logger.info(`- Artist: ${tracks[0].artist}`);
        logger_1.logger.info(`- Current cover: ${tracks[0].coverUrl}`);
        // Принудительно обновляем обложку
        logger_1.logger.info('Updating cover...');
        const updatedTrack = await trackService_1.trackService.forceUpdateTrackCover(tracks[0]);
        // Выводим результат
        logger_1.logger.info('Cover update process completed');
        logger_1.logger.info(`- New cover: ${updatedTrack.coverUrl}`);
        logger_1.logger.info(`- Cover was ${updatedTrack.coverUrl !== tracks[0].coverUrl ? 'updated' : 'not changed'}`);
        // Отключаемся от базы данных
        await mongoose_1.default.disconnect();
        logger_1.logger.info('Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error(`Error: ${error}`);
        try {
            await mongoose_1.default.disconnect();
        }
        catch (e) {
            logger_1.logger.error(`Error disconnecting from MongoDB: ${e}`);
        }
        process.exit(1);
    }
}
// Запускаем функцию
updateTrackCover();
