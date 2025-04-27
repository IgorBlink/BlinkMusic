"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения в самом начале
dotenv_1.default.config();
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
const youtubeLyricsService_1 = require("../services/youtubeLyricsService");
/**
 * Тестовый скрипт для проверки работы сервиса получения лирики из YouTube
 */
async function testYoutubeLyrics() {
    try {
        // Подключаемся к базе данных
        await (0, database_1.default)();
        console.log("\n=== Тестирование получения лирики из YouTube ===\n");
        // Тестовые песни
        const testTracks = [
            { artist: "Queen", title: "Bohemian Rhapsody" },
            { artist: "Michael Jackson", title: "Billie Jean" },
            { artist: "Adele", title: "Hello" },
            { artist: "Coldplay", title: "Viva La Vida" }
        ];
        for (const track of testTracks) {
            console.log(`\nПоиск видео для "${track.title}" by ${track.artist}...`);
            // Поиск видео на YouTube
            const videoId = await youtubeLyricsService_1.youtubeLyricsService.findVideoIdForTrack(track.artist, track.title);
            if (!videoId) {
                console.log(`Видео не найдено для "${track.title}" by ${track.artist}`);
                continue;
            }
            console.log(`Найдено видео ID: ${videoId}`);
            console.log(`Ссылка на видео: https://www.youtube.com/watch?v=${videoId}`);
            // Получение субтитров
            console.log(`Получение субтитров для видео ${videoId}...`);
            const subtitles = await youtubeLyricsService_1.youtubeLyricsService.getSubtitlesForVideo(videoId);
            if (!subtitles || subtitles.length === 0) {
                console.log(`Субтитры не найдены для видео ${videoId}`);
                continue;
            }
            console.log(`Найдено ${subtitles.length} строк с субтитрами:`);
            // Выводим первые 5 строк субтитров
            subtitles.slice(0, 5).forEach((line, index) => {
                const startTime = (line.startTime / 1000).toFixed(2);
                const endTime = (line.endTime / 1000).toFixed(2);
                console.log(`${index + 1}. [${startTime}s - ${endTime}s]: ${line.text}`);
            });
            if (subtitles.length > 5) {
                console.log(`... и еще ${subtitles.length - 5} строк`);
            }
        }
        console.log("\n=== Тестирование завершено ===\n");
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error("Ошибка при тестировании получения лирики:", error);
        process.exit(1);
    }
}
// Запускаем тестирование
testYoutubeLyrics();
