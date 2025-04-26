import dotenv from 'dotenv';
// Загружаем переменные окружения в самом начале
dotenv.config();

import { logger } from '../utils/logger';
import { lastFmService } from '../services/lastFmService';
import connectToDB from '../config/database';

/**
 * Тестовый скрипт для проверки парсинга YouTube-ссылок из страниц Last.fm
 */
async function testYoutubeUrlParsing() {
  try {
    // Подключаемся к базе данных
    await connectToDB();
    
    console.log("\n=== Тестирование парсинга YouTube-ссылок из Last.fm ===\n");
    
    // Сначала ищем треки для тестирования
    console.log("Ищем треки для тестирования...");
    const searchQueries = ["Queen", "Michael Jackson", "Adele", "Coldplay"];
    
    for (const query of searchQueries) {
      console.log(`\nПоиск треков по запросу "${query}"...`);
      const tracks = await lastFmService.searchTracks(query, 2);
      
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
        } else {
          // Если нет, пытаемся парсить страницу Last.fm для получения YouTube-ссылки
          console.log(`Парсим страницу Last.fm для получения YouTube-ссылки...`);
          const youtubeUrl = await lastFmService.getYoutubeUrlFromLastFmPage(track.audioUrl);
          
          if (youtubeUrl) {
            console.log(`✅ Успешно получена YouTube-ссылка: ${youtubeUrl}`);
          } else {
            console.log(`❌ Не удалось получить YouTube-ссылку для этого трека`);
          }
        }
      }
    }
    
    console.log("\n=== Тестирование завершено ===\n");
    process.exit(0);
  } catch (error) {
    logger.error("Ошибка при тестировании парсинга YouTube-ссылок:", error);
    process.exit(1);
  }
}

// Запускаем тестирование
testYoutubeUrlParsing(); 