# BlinkMusic Backend 🎵

Высокопроизводительное API для музыкального стриминг-сервиса, созданное с использованием современных технологий и лучших практик разработки. Позволяет находить музыку, получать тексты песен с синхронизацией по времени и профессиональные пояснения к текстам песен с использованием искусственного интеллекта.

## 🚀 Технологии

- **Node.js + TypeScript** — современная и типобезопасная среда выполнения
- **Express** — легковесный и гибкий фреймворк для создания RESTful API
- **MongoDB + Mongoose** — масштабируемая NoSQL база данных с элегантной ORM
- **JWT** — безопасная аутентификация пользователей через JSON Web Tokens
- **Интеграции с внешними API**:
  - **Last.fm API** — для получения метаданных о треках и рекомендаций
  - **YouTube API** — для обработки музыкальных видео и извлечения субтитров
  - **Google Gemini Pro** — для генерации аннотаций к песням с использованием AI
- **Cheerio** — для элегантного парсинга HTML и извлечения данных
- **Axios** — производительный HTTP-клиент для браузера и Node.js
- **Winston** — продвинутое логирование на всех уровнях приложения

## 📋 API Эндпоинты

### 🎧 Трек API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/tracks/search?query=<запрос>&limit=<число>` | Поиск треков по запросу |
| GET | `/api/tracks/recommended?limit=<число>` | Получение рекомендованных треков |
| GET | `/api/tracks/genre/:genre?limit=<число>` | Получение треков определенного жанра |
| GET | `/api/tracks/favorites` | Получение треков из избранного пользователя (требует аутентификации) |
| GET | `/api/tracks/:id` | Получение информации о конкретном треке |
| POST | `/api/tracks/:id/favorite` | Добавление трека в избранное (требует аутентификации) |
| DELETE | `/api/tracks/:id/favorite` | Удаление трека из избранного (требует аутентификации) |

### 🔐 Аутентификация API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация нового пользователя |
| POST | `/api/auth/login` | Аутентификация пользователя |
| POST | `/api/auth/refresh` | Обновление токена доступа |
| POST | `/api/auth/logout` | Выход из системы |
| GET | `/api/auth/me` | Получение данных текущего пользователя (требует аутентификации) |

### 📝 Текст песен API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/lyrics/track/:id?timestamped=<boolean>` | Получение текста песни по ID трека |
| GET | `/api/lyrics/youtube?url=<youtube_url>&timestamped=<boolean>` | Получение текста песни по YouTube URL с дополнительной опцией получения тайминга для каждой строки |

### 💡 Аннотации API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/annotations/track/:trackId?line=<текст>` | Получение аннотации для конкретной строки песни |
| POST | `/api/annotations/explain` | Генерация объяснения строки из песни с использованием AI |
| POST | `/api/annotations/:annotationId/vote` | Голосование за аннотацию (upvote/downvote) |

## 🌟 Особенности

- **Прямая интеграция с Last.fm** для обогащения данных о треках
- **Уникальная система извлечения текстов** из YouTube субтитров с синхронизацией тайминга
- **Интеллектуальные аннотации** с помощью Google Gemini Pro для глубокого анализа текстов песен
- **Кэширование данных** для увеличения производительности
- **Безопасная аутентификация** с использованием JWT и refresh токенов
- **Детальное логирование** на всех уровнях приложения

## 🔧 Установка и запуск

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/yourusername/BlinkMusic-backend.git
   cd BlinkMusic-backend
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения**
   ```bash
   cp .env.example .env
   # Отредактируйте .env файл с вашими API ключами и конфигурацией
   ```

4. **Запустите сервер в режиме разработки**
   ```bash
   npm run dev
   ```

5. **Для продакшн-сборки**
   ```bash
   npm run build
   npm start
   ```

## 📖 Требуемые API ключи

Для полноценной работы сервиса вам потребуются:
- **LASTFM_API_KEY** — получите на [Last.fm API](https://www.last.fm/api/account/create)
- **YOUTUBE_API_KEY** — получите в [Google Cloud Console](https://console.cloud.google.com/)
- **GEMINI_API_KEY** — получите в [Google AI Studio](https://ai.google.dev/)

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие BlinkMusic! Для добавления функций, исправления ошибок или улучшений:

1. Форкните репозиторий
2. Создайте ветку для вашей функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте ветку в ваш форк (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📜 Лицензия

Этот проект лицензирован под MIT License - подробности в файле LICENSE.

---

**BlinkMusic** — Ваша музыка, ваши правила. © 2025 