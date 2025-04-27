"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения в самом начале
dotenv_1.default.config();
const logger_1 = require("../utils/logger");
const lastFmService_1 = require("../services/lastFmService");
const database_1 = __importDefault(require("../config/database"));
/**
 * Тестовый скрипт для проверки парсинга YouTube-ссылок из страниц Last.fm
 */
async function testYoutubeUrlParsing() {
    try {
        // Подключаемся к базе данных
        await (0, database_1.default)();
        console.log("\n=== Тестирование парсинга YouTube-ссылок из Last.fm ===\n");
        // Сначала ищем треки для тестирования
        console.log("Ищем треки для тестирования...");
        const searchQueries = ["Queen", "Michael Jackson", "Adele", "Coldplay"];
        for (const query of searchQueries) {
            console.log(`\nПоиск треков по запросу "${query}"...`);
            const tracks = await lastFmService_1.lastFmService.searchTracks(query, 2);
            if (tracks.length === 0) {
                console.log(`Треки не найдены для запроса "${query}"`);
                continue;
            }
            console.log(`Найдено ${tracks.length} треков по запросу "${query}"`);
            // Тестируем парсинг YouTube-ссылок для каждого трека
            for (const track of tracks) {
                console.log(`\nТрек: "${track.title}" by ${track.artist}`);
                console.log(`Last.fm URL: ${track.audioUrl}`);
                // Проверяем, содержит ли URL уже YouTube-ссылку
                if (track.audioUrl.includes('youtube.com')) {
                    console.log(`✅ URL уже содержит YouTube-ссылку: ${track.audioUrl}`);
                }
                else {
                    // Если нет, пытаемся парсить страницу Last.fm для получения YouTube-ссылки
                    console.log(`Парсим страницу Last.fm для получения YouTube-ссылки...`);
                    const youtubeUrl = await lastFmService_1.lastFmService.getYoutubeUrlFromLastFmPage(track.audioUrl);
                    if (youtubeUrl) {
                        console.log(`✅ Успешно получена YouTube-ссылка: ${youtubeUrl}`);
                    }
                    else {
                        console.log(`❌ Не удалось получить YouTube-ссылку для этого трека`);
                    }
                }
            }
        }
        console.log("\n=== Тестирование завершено ===\n");
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error("Ошибка при тестировании парсинга YouTube-ссылок:", error);
        process.exit(1);
    }
}
// Запускаем тестирование
testYoutubeUrlParsing();
