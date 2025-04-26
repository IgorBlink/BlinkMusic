import dotenv from 'dotenv';
// Загружаем переменные окружения в самом начале
dotenv.config();

import app from './app';
import connectDB from './config/database';
import { logger } from './utils/logger';

// Проверяем наличие ключевых переменных окружения
if (!process.env.MONGODB_URI) {
  logger.warn('MONGODB_URI is not set in environment variables. Using default connection string.');
}

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET is not set in environment variables. Using default value.');
}

// Проверяем наличие API ключей
if (!process.env.LASTFM_API_KEY) {
  logger.warn('LASTFM_API_KEY is not set. Last.fm integration will use mock data.');
}

if (!process.env.AUDIODB_API_KEY) {
  logger.warn('AUDIODB_API_KEY is not set. Using free tier (API key "2").');
}

// Устанавливаем порт для сервера
const PORT = process.env.PORT || 5000;

// Функция запуска сервера
const startServer = async () => {
  try {
    // Подключаемся к базе данных
    await connectDB();

    // Запускаем сервер
    app.listen(PORT, () => {
      logger.info(`Сервер запущен в режиме ${process.env.NODE_ENV} на порту ${PORT}`);
    });
  } catch (error) {
    logger.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

// Обработка необработанных исключений
process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение:', error);
  process.exit(1);
});

// Обработка необработанных отклонений промисов
process.on('unhandledRejection', (error) => {
  logger.error('Необработанное отклонение промиса:', error);
  process.exit(1);
});

// Запускаем сервер
startServer(); 