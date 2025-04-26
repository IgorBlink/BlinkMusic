import dotenv from 'dotenv';
// Загружаем переменные окружения в самом начале
dotenv.config();

import { logger } from '../utils/logger';
import { trackService } from '../services/trackService';
import connectToDB from '../config/database';
import mongoose from 'mongoose';

/**
 * Тестовый скрипт для проверки работы интеграции с Last.fm и AudioDB
 * через упрощенный trackService
 */
async function testMusicIntegration() {
  try {
    // Подключаемся к базе данных
    await connectToDB();
    
    console.log("\n=== Тестирование интеграции музыкальных сервисов ===\n");
    
    // Тест 1: Поиск треков
    console.log("Тест 1: Поиск треков через trackService");
    const searchQuery = "Queen";
    console.log(`Поиск треков по запросу "${searchQuery}"...`);
    const tracks = await trackService.searchTracks(searchQuery, 3);
    console.log(`Найдено ${tracks.length} треков:`);
    tracks.forEach((track, index) => {
      console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
      console.log(`   Альбом: ${track.album || 'Неизвестно'}`);
      console.log(`   Длительность: ${track.duration ? Math.floor(track.duration / 1000) + ' сек' : 'Неизвестно'}`);
      console.log(`   Обложка: ${track.coverUrl ? 'Есть' : 'Нет'}`);
      console.log(`   Жанры: ${track.genre?.join(', ') || 'Нет'}`);
    });
    
    // Тест 2: Поиск треков по жанру
    console.log("\nТест 2: Поиск треков по жанру");
    const genre = "rock";
    console.log(`Поиск треков по жанру "${genre}"...`);
    const genreTracks = await trackService.getTracksByGenre(genre, 3);
    console.log(`Найдено ${genreTracks.length} треков жанра "${genre}":`);
    genreTracks.forEach((track, index) => {
      console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
      console.log(`   Жанры: ${track.genre?.join(', ') || 'Нет'}`);
      console.log(`   Теги: ${track.tags?.join(', ') || 'Нет'}`);
    });
    
    // Тест 3: Получение трека по ID с обогащенными метаданными
    console.log("\nТест 3: Получение трека по ID с обогащенными метаданными");
    if (tracks.length > 0) {
      // Безопасное преобразование _id в строку
      const trackId = String(tracks[0]._id);
      
      console.log(`Получение детальной информации для трека с ID ${trackId}...`);
      try {
        const trackDetails = await trackService.getTrackById(trackId);
        console.log(`Получены данные трека: "${trackDetails.track.title}" by ${trackDetails.track.artist}`);
        
        if (trackDetails.enrichedData) {
          console.log("Обогащенные метаданные из AudioDB:");
          console.log(JSON.stringify(trackDetails.enrichedData, null, 2));
        } else {
          console.log("Обогащенные метаданные не найдены");
        }
      } catch (error: any) {
        console.error(`Ошибка при получении данных трека: ${error.message}`);
      }
    }
    
    console.log("\n=== Тестирование завершено ===\n");
    process.exit(0);
  } catch (error: any) {
    logger.error("Ошибка при тестировании музыкальных сервисов:", error);
    process.exit(1);
  }
}

// Запускаем тестирование
testMusicIntegration(); 