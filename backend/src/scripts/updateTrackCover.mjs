// Скрипт для принудительного обновления обложки трека
// Запуск: node src/scripts/updateTrackCover.mjs

// Используем динамический импорт для работы с ESM модулями
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Инициализируем переменные окружения
dotenv.config();

async function updateTrackCover() {
  try {
    // Подключаемся к базе данных
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Динамически импортируем модули (это решает проблему с разными форматами)
    const { default: Track } = await import('../models/Track.js');
    const { trackService } = await import('../services/trackService.js');
    
    // Ищем трек "Feel Good Inc." by "Gorillaz"
    const tracks = await Track.find({
      title: { $regex: 'Feel Good Inc', $options: 'i' },
      artist: { $regex: 'Gorillaz', $options: 'i' }
    });
    
    if (tracks.length === 0) {
      console.log('Track not found');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Выводим найденный трек
    console.log(`Found ${tracks.length} tracks`);
    console.log(`Current track data:`);
    console.log(`- Title: ${tracks[0].title}`);
    console.log(`- Artist: ${tracks[0].artist}`);
    console.log(`- Current cover: ${tracks[0].coverUrl}`);
    
    // Принудительно обновляем обложку
    console.log('Updating cover...');
    const updatedTrack = await trackService.forceUpdateTrackCover(tracks[0]);
    
    // Выводим результат
    console.log('Cover update process completed');
    console.log(`- New cover: ${updatedTrack.coverUrl}`);
    console.log(`- Cover was ${updatedTrack.coverUrl !== tracks[0].coverUrl ? 'updated' : 'not changed'}`);
    
    // Отключаемся от базы данных
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error('Error disconnecting from MongoDB:', e);
    }
    process.exit(1);
  }
}

// Запускаем функцию
updateTrackCover(); 