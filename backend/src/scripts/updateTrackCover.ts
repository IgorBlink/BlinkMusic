import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import Track from '../models/Track';
import { trackService } from '../services/trackService';

// Инициализируем переменные окружения
dotenv.config();

/**
 * Функция обновления обложки для трека "Feel Good Inc." by "Gorillaz"
 */
async function updateTrackCover() {
  try {
    logger.info('Starting cover update script');
    
    // Подключаемся к базе данных
    await mongoose.connect(process.env.MONGODB_URI || '');
    
    logger.info('Connected to MongoDB');
    
    // Ищем трек "Feel Good Inc." by "Gorillaz"
    const tracks = await Track.find({
      title: { $regex: 'Feel Good Inc', $options: 'i' },
      artist: { $regex: 'Gorillaz', $options: 'i' }
    });
    
    if (tracks.length === 0) {
      logger.info('Track not found');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Выводим найденный трек
    logger.info(`Found ${tracks.length} tracks`);
    logger.info(`Current track data:`);
    logger.info(`- Title: ${tracks[0].title}`);
    logger.info(`- Artist: ${tracks[0].artist}`);
    logger.info(`- Current cover: ${tracks[0].coverUrl}`);
    
    // Принудительно обновляем обложку
    logger.info('Updating cover...');
    const updatedTrack = await trackService.forceUpdateTrackCover(tracks[0]);
    
    // Выводим результат
    logger.info('Cover update process completed');
    logger.info(`- New cover: ${updatedTrack.coverUrl}`);
    logger.info(`- Cover was ${updatedTrack.coverUrl !== tracks[0].coverUrl ? 'updated' : 'not changed'}`);
    
    // Отключаемся от базы данных
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    logger.error(`Error: ${error}`);
    try {
      await mongoose.disconnect();
    } catch (e) {
      logger.error(`Error disconnecting from MongoDB: ${e}`);
    }
    process.exit(1);
  }
}

// Запускаем функцию
updateTrackCover(); 