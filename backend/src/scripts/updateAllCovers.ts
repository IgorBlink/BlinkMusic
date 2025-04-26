import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { trackService } from '../services/trackService';

// Инициализируем переменные окружения
dotenv.config();

/**
 * Скрипт для обновления обложек всех треков в базе данных через iTunes API
 * Это необходимо при переходе на новую логику без сохранения в БД
 */
async function updateAllCovers() {
  try {
    logger.info('Запуск скрипта обновления всех обложек');
    
    // Подключаемся к базе данных
    await mongoose.connect(process.env.MONGODB_URI || '');
    logger.info('Подключено к MongoDB');
    
    // Запускаем обновление обложек
    await trackService.forceUseITunesCoverForAllTracks(200);
    
    // Отключаемся от базы данных
    await mongoose.disconnect();
    logger.info('Отключено от MongoDB');
    
    process.exit(0);
  } catch (error) {
    logger.error(`Ошибка при обновлении обложек: ${error}`);
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      logger.error(`Ошибка при отключении от MongoDB: ${e}`);
    }
    
    process.exit(1);
  }
}

// Запускаем скрипт
updateAllCovers(); 