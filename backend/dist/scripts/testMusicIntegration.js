"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения в самом начале
dotenv_1.default.config();
const logger_1 = require("../utils/logger");
const trackService_1 = require("../services/trackService");
const database_1 = __importDefault(require("../config/database"));
/**
 * Тестовый скрипт для проверки работы интеграции с Last.fm и AudioDB
 * через упрощенный trackService
 */
async function testMusicIntegration() {
    try {
        // Подключаемся к базе данных
        await (0, database_1.default)();
        console.log("\n=== Тестирование интеграции музыкальных сервисов ===\n");
        // Тест 1: Поиск треков
        console.log("Тест 1: Поиск треков через trackService");
        const searchQuery = "Queen";
        console.log(`Поиск треков по запросу "${searchQuery}"...`);
        const tracks = await trackService_1.trackService.searchTracks(searchQuery, 3);
        console.log(`Найдено ${tracks.length} треков:`);
        tracks.forEach((track, index) => {
            var _a;
            console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
            console.log(`   Альбом: ${track.album || 'Неизвестно'}`);
            console.log(`   Длительность: ${track.duration ? Math.floor(track.duration / 1000) + ' сек' : 'Неизвестно'}`);
            console.log(`   Обложка: ${track.coverUrl ? 'Есть' : 'Нет'}`);
            console.log(`   Жанры: ${((_a = track.genre) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Нет'}`);
        });
        // Тест 2: Поиск треков по жанру
        console.log("\nТест 2: Поиск треков по жанру");
        const genre = "rock";
        console.log(`Поиск треков по жанру "${genre}"...`);
        const genreTracks = await trackService_1.trackService.getTracksByGenre(genre, 3);
        console.log(`Найдено ${genreTracks.length} треков жанра "${genre}":`);
        genreTracks.forEach((track, index) => {
            var _a, _b;
            console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
            console.log(`   Жанры: ${((_a = track.genre) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Нет'}`);
            console.log(`   Теги: ${((_b = track.tags) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'Нет'}`);
        });
        // Тест 3: Получение трека по ID с обогащенными метаданными
        console.log("\nТест 3: Получение трека по ID с обогащенными метаданными");
        if (tracks.length > 0) {
            // Безопасное преобразование _id в строку
            const trackId = String(tracks[0]._id);
            console.log(`Получение детальной информации для трека с ID ${trackId}...`);
            try {
                const trackDetails = await trackService_1.trackService.getTrackById(trackId);
                console.log(`Получены данные трека: "${trackDetails.track.title}" by ${trackDetails.track.artist}`);
                if (trackDetails.enrichedData) {
                    console.log("Обогащенные метаданные из AudioDB:");
                    console.log(JSON.stringify(trackDetails.enrichedData, null, 2));
                }
                else {
                    console.log("Обогащенные метаданные не найдены");
                }
            }
            catch (error) {
                console.error(`Ошибка при получении данных трека: ${error.message}`);
            }
        }
        console.log("\n=== Тестирование завершено ===\n");
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error("Ошибка при тестировании музыкальных сервисов:", error);
        process.exit(1);
    }
}
// Запускаем тестирование
testMusicIntegration();
