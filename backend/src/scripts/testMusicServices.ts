import dotenv from 'dotenv';
// Загружаем переменные окружения в самом начале
dotenv.config();

import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { lastFmService } from '../services/lastFmService';
import { audioDbService } from '../services/audioDbService';
import connectToDB from '../config/database';

/**
 * Тестовый скрипт для проверки работы сервисов Last.fm и AudioDB
 */
async function testMusicServices() {
  try {
    // Подключаемся к базе данных
    await connectToDB();
    
    console.log("\n=== Тестирование интеграции с Last.fm и AudioDB ===\n");
    
    // Тест 1: Поиск треков через Last.fm
    console.log("Тест 1: Поиск треков через Last.fm");
    const searchQuery = "Led Zeppelin";
    console.log(`Поиск треков по запросу "${searchQuery}"...`);
    const tracks = await lastFmService.searchTracks(searchQuery, 3);
    console.log(`Найдено ${tracks.length} треков:`);
    tracks.forEach((track, index) => {
      console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
      console.log(`   Альбом: ${track.album || 'Неизвестно'}`);
      console.log(`   Длительность: ${track.duration ? Math.floor(track.duration / 1000) + ' сек' : 'Неизвестно'}`);
      console.log(`   Обложка: ${track.coverUrl ? 'Есть' : 'Нет'}`);
    });
    
    // Тест 2: Получение популярных треков
    console.log("\nТест 2: Получение популярных треков");
    const popularTracks = await lastFmService.getTracksByGenre("pop", 3);
    console.log(`Найдено ${popularTracks.length} популярных треков:`);
    popularTracks.forEach((track, index) => {
      console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
    });
    
    // Тест 3: Поиск треков по жанру
    console.log("\nТест 3: Поиск треков по жанру");
    const genre = "rock";
    console.log(`Поиск треков по жанру "${genre}"...`);
    const genreTracks = await lastFmService.getTracksByGenre(genre, 3);
    console.log(`Найдено ${genreTracks.length} треков жанра "${genre}":`);
    genreTracks.forEach((track, index) => {
      console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
    });
    
    // Тест 4: Обогащение метаданных через AudioDB
    console.log("\nТест 4: Обогащение метаданных через AudioDB");
    if (tracks.length > 0) {
      const track = tracks[0];
      console.log(`Получение дополнительных метаданных для "${track.title}" by ${track.artist}...`);
      const enrichedData = await audioDbService.enrichTrackMetadata({
        title: track.title,
        artist: track.artist
      });
      
      if (enrichedData) {
        console.log("Получены дополнительные метаданные:");
        console.log(`Жанр: ${enrichedData.genre || 'Неизвестно'}`);
        console.log(`Настроение: ${enrichedData.mood || 'Неизвестно'}`);
        console.log(`Описание: ${enrichedData.description ? 'Есть' : 'Нет'}`);
      } else {
        console.log("Дополнительные метаданные не найдены");
      }
    }
    
    console.log("\n=== Тестирование завершено ===\n");
    process.exit(0);
  } catch (error) {
    logger.error("Ошибка при тестировании музыкальных сервисов:", error);
    process.exit(1);
  }
}

// Запускаем тестирование
testMusicServices(); 