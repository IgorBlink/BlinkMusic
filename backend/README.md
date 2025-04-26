# BlinkMusic Backend API

Backend-сервер для музыкального приложения BlinkMusic на основе Express.js и MongoDB.

## Возможности

- Аутентификация пользователей (регистрация, вход, выход)
- JWT авторизация с refresh-токенами
- Поиск и прослушивание музыки через Яндекс Музыку
- Хранение пользовательских данных в MongoDB
- Защищенные маршруты API

## Используемые технологии

- Node.js
- TypeScript
- Express.js
- MongoDB (mongoose)
- JWT для аутентификации
- Интеграция с Last.fm API и AudioDB API
- bcrypt для хеширования паролей
- Winston для логирования

## Требования

- Node.js (v14+)
- MongoDB

## Установка

1. Клонировать репозиторий:
```bash
git clone https://github.com/yourusername/blinkmusic-backend.git
cd blinkmusic-backend
```

2. Установить зависимости:
```bash
npm install
```

3. Создать файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Настроить переменные окружения в файле `.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/blinkmusic
JWT_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
LASTFM_API_KEY=your_lastfm_api_key_here
AUDIODB_API_KEY=your_audiodb_api_key_here
```

## Запуск приложения

### Режим разработки
```bash
npm run dev
```

### Сборка и запуск для production
```bash
npm run build
npm start
```

### Тестирование музыкального API
```bash
npm run test:music
```

## API Endpoints

### Авторизация

- `POST /api/auth/register` - Регистрация нового пользователя
  - Тело запроса: `{ username, email, password, firstName, lastName }`

- `POST /api/auth/login` - Авторизация пользователя
  - Тело запроса: `{ emailOrUsername, password }`

- `POST /api/auth/refresh` - Обновление токена доступа
  - Тело запроса: `{ refreshToken }` (также может быть передан через cookie)

- `POST /api/auth/logout` - Выход из системы
  - Тело запроса: `{ refreshToken }` (также может быть передан через cookie)

- `GET /api/auth/me` - Получение данных текущего пользователя
  - Требуется: Bearer Token в заголовке Authorization

### Треки

- `GET /api/tracks` - Получение всех треков
- `GET /api/tracks/:id` - Получение информации о треке
- `GET /api/tracks/search` - Поиск треков
- `GET /api/tracks/genre/:genre` - Получение треков по жанру
- `GET /api/tracks/favorites` - Получение избранных треков (требуется авторизация)
- `POST /api/tracks/:id/favorite` - Добавление трека в избранное (требуется авторизация)
- `DELETE /api/tracks/:id/favorite` - Удаление трека из избранного (требуется авторизация)

## Структура проекта

```
.
├── src/
│   ├── config/         # Конфигурационные файлы
│   ├── controllers/    # Контроллеры запросов
│   ├── middlewares/    # Middleware функции
│   ├── models/         # Mongoose модели
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   │   ├── lastFmService.ts  # Сервис интеграции с Last.fm
│   │   └── audioDbService.ts # Сервис интеграции с AudioDB
│   ├── scripts/        # Вспомогательные скрипты
│   ├── utils/          # Вспомогательные функции
│   ├── app.ts          # Настройка Express
│   └── index.ts        # Точка входа
├── .env.example        # Пример файла с переменными окружения
├── package.json        # Зависимости и скрипты
├── tsconfig.json       # Настройки TypeScript
└── README.md           # Документация проекта
```

## Лицензия

MIT 