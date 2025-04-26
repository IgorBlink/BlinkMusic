# BlinkMusic API - Тестовые запросы

В этом документе представлены примеры тестовых запросов для API BlinkMusic. Используйте их для проверки функциональности и поведения API.

## Требования для запуска API

Для полноценной работы API необходимо настроить `.env` файл со следующими переменными:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cors Configuration
CORS_ORIGIN=http://localhost:5173

# External APIs
JAMENDO_CLIENT_ID=your_jamendo_client_id
GENIUS_ACCESS_TOKEN=your_genius_access_token
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Яндекс Музыка API (неофициальное)
YANDEX_MUSIC_TOKEN=your_yandex_music_token_here
```

Для получения API ключей зарегистрируйтесь на:
- Jamendo API: https://devportal.jamendo.com/
- Genius API: https://genius.com/api-clients
- Spotify API: https://developer.spotify.com/dashboard/

## Запуск тестов

Вы можете использовать инструменты, такие как cURL, Postman, Insomnia или REST Client для VS Code, чтобы выполнить эти запросы. Примеры представлены в формате cURL.

## Основная информация

- Базовый URL: `http://localhost:5000`
- Формат данных: JSON
- Аутентификация: JWT (Bearer Token)

## Авторизация

### Регистрация нового пользователя

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "Тест",
    "lastName": "Пользователь"
  }'
```

Пример ответа:

```json
{
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": "60c72b2f9b1d8a2d8c9e1234",
    "username": "testuser",
    "email": "test@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Авторизация пользователя

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "Password123"
  }'
```

Пример ответа:

```json
{
  "message": "Успешная авторизация",
  "user": {
    "id": "60c72b2f9b1d8a2d8c9e1234",
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Тест",
    "lastName": "Пользователь",
    "isAdmin": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Обновление токена доступа

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

Пример ответа:

```json
{
  "message": "Токены успешно обновлены",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Выход из системы

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

Пример ответа:

```json
{
  "message": "Выход выполнен успешно"
}
```

### Получение данных текущего пользователя

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Пример ответа:

```json
{
  "user": {
    "id": "60c72b2f9b1d8a2d8c9e1234",
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Тест",
    "lastName": "Пользователь",
    "avatar": "",
    "isAdmin": false
  }
}
```

## Треки

### Получение всех треков

```bash
curl -X GET http://localhost:5000/api/tracks?page=1&limit=10
```

Пример ответа:

```json
{
  "success": true,
  "count": 10,
  "total": 120,
  "totalPages": 12,
  "currentPage": 1,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4321",
      "title": "Awesome Track",
      "artist": "Amazing Artist",
      "album": "Great Album",
      "duration": 240,
      "coverUrl": "https://example.com/covers/track1.jpg",
      "audioUrl": "https://example.com/tracks/track1.mp3",
      "source": "jamendo",
      "sourceId": "12345",
      "license": "CC BY-SA 3.0",
      "genre": ["Rock", "Indie"],
      "tags": ["energetic", "upbeat"],
      "playCount": 350,
      "likeCount": 42,
      "isPublic": true
    },
    // ... остальные треки
  ]
}
```

### Поиск треков

```bash
curl -X GET http://localhost:5000/api/tracks/search?query=rock
```

Пример ответа:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4322",
      "title": "Rock Anthem",
      "artist": "Rock Star",
      "album": "Rock Collection",
      "duration": 195,
      "coverUrl": "https://example.com/covers/rock1.jpg",
      "audioUrl": "https://example.com/tracks/rock1.mp3",
      "source": "jamendo",
      "sourceId": "12346",
      "license": "CC BY-SA 3.0",
      "genre": ["Rock", "Alternative"],
      "tags": ["rock", "guitar"],
      "playCount": 220,
      "likeCount": 35,
      "isPublic": true
    },
    // ... остальные треки
  ]
}
```

### Получение треков по жанру

```bash
curl -X GET http://localhost:5000/api/tracks/genre/rock?page=1&limit=10
```

Пример ответа:

```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "totalPages": 5,
  "currentPage": 1,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4322",
      "title": "Rock Anthem",
      "artist": "Rock Star",
      "album": "Rock Collection",
      "duration": 195,
      "coverUrl": "https://example.com/covers/rock1.jpg",
      "audioUrl": "https://example.com/tracks/rock1.mp3",
      "source": "jamendo",
      "sourceId": "12346",
      "license": "CC BY-SA 3.0",
      "genre": ["Rock", "Alternative"],
      "tags": ["rock", "guitar"],
      "playCount": 220,
      "likeCount": 35,
      "isPublic": true
    },
    // ... остальные треки
  ]
}
```

### Получение трека по ID

```bash
curl -X GET http://localhost:5000/api/tracks/60c72b2f9b1d8a2d8c9e4321
```

Пример ответа:

```json
{
  "success": true,
  "data": {
    "_id": "60c72b2f9b1d8a2d8c9e4321",
    "title": "Awesome Track",
    "artist": "Amazing Artist",
    "album": "Great Album",
    "duration": 240,
    "coverUrl": "https://example.com/covers/track1.jpg",
    "audioUrl": "https://example.com/tracks/track1.mp3",
    "source": "jamendo",
    "sourceId": "12345",
    "license": "CC BY-SA 3.0",
    "genre": ["Rock", "Indie"],
    "tags": ["energetic", "upbeat"],
    "playCount": 350,
    "likeCount": 42,
    "isPublic": true
  }
}
```

### Получение избранных треков пользователя

```bash
curl -X GET http://localhost:5000/api/tracks/favorites?page=1&limit=10 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Пример ответа:

```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "totalPages": 1,
  "currentPage": 1,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4321",
      "title": "Awesome Track",
      "artist": "Amazing Artist",
      "album": "Great Album",
      "duration": 240,
      "coverUrl": "https://example.com/covers/track1.jpg",
      "audioUrl": "https://example.com/tracks/track1.mp3",
      "source": "jamendo",
      "sourceId": "12345",
      "license": "CC BY-SA 3.0",
      "genre": ["Rock", "Indie"],
      "tags": ["energetic", "upbeat"],
      "playCount": 350,
      "likeCount": 42,
      "isPublic": true
    },
    // ... остальные избранные треки
  ]
}
```

### Добавление трека в избранное

```bash
curl -X POST http://localhost:5000/api/tracks/60c72b2f9b1d8a2d8c9e4321/favorite \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Пример ответа:

```json
{
  "success": true,
  "message": "Трек добавлен в избранное",
  "data": {
    "_id": "60c72b2f9b1d8a2d8c9e4321",
    "title": "Awesome Track",
    "artist": "Amazing Artist",
    "album": "Great Album",
    "duration": 240,
    "coverUrl": "https://example.com/covers/track1.jpg",
    "audioUrl": "https://example.com/tracks/track1.mp3",
    "source": "jamendo",
    "sourceId": "12345",
    "license": "CC BY-SA 3.0",
    "genre": ["Rock", "Indie"],
    "tags": ["energetic", "upbeat"],
    "playCount": 350,
    "likeCount": 42,
    "isPublic": true
  }
}
```

### Удаление трека из избранного

```bash
curl -X DELETE http://localhost:5000/api/tracks/60c72b2f9b1d8a2d8c9e4321/favorite \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Пример ответа:

```json
{
  "success": true,
  "message": "Трек удален из избранного",
  "data": {
    "_id": "60c72b2f9b1d8a2d8c9e4321",
    "title": "Awesome Track",
    "artist": "Amazing Artist",
    "album": "Great Album",
    "duration": 240,
    "coverUrl": "https://example.com/covers/track1.jpg",
    "audioUrl": "https://example.com/tracks/track1.mp3",
    "source": "jamendo",
    "sourceId": "12345",
    "license": "CC BY-SA 3.0",
    "genre": ["Rock", "Indie"],
    "tags": ["energetic", "upbeat"],
    "playCount": 350,
    "likeCount": 42,
    "isPublic": true
  }
}
```

## Дополнительные тесты для музыкальных сервисов

### Получение треков с Jamendo

```bash
curl -X GET http://localhost:5000/api/tracks/discover/jamendo?limit=5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Получение текста песни

```bash
curl -X GET http://localhost:5000/api/tracks/60c72b2f9b1d8a2d8c9e4321/lyrics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Пример ответа:

```json
{
  "success": true,
  "data": {
    "trackId": "60c72b2f9b1d8a2d8c9e4321",
    "title": "Awesome Track",
    "artist": "Amazing Artist",
    "lyrics": "Here are the lyrics to the amazing song...\nSecond line of the song...\n..."
  }
}
```

### Потоковая передача аудио

```bash
curl -X GET http://localhost:5000/api/tracks/60c72b2f9b1d8a2d8c9e4321/stream \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Range: bytes=0-"
```

### Получение популярных треков

```bash
curl -X GET http://localhost:5000/api/tracks/trending?limit=10
```

Пример ответа:

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4321",
      "title": "Popular Track",
      "artist": "Famous Artist",
      "playCount": 1250,
      "...": "..."
    },
    // ... остальные популярные треки
  ]
}
```

## Примеры с использованием Postman

Для более удобного тестирования API вы можете импортировать следующую коллекцию в Postman:

1. В Postman выберите "Import"
2. Скопируйте и вставьте следующий JSON:

```json
{
  "info": {
    "name": "BlinkMusic API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/auth/register",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"Password123\",\n  \"firstName\": \"Тест\",\n  \"lastName\": \"Пользователь\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/auth/login",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"emailOrUsername\": \"testuser\",\n  \"password\": \"Password123\"\n}"
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/auth/me",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Tracks",
      "item": [
        {
          "name": "Get All Tracks",
          "request": {
            "method": "GET",
            "url": {
              "raw": "http://localhost:5000/api/tracks?page=1&limit=10",
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            }
          }
        },
        {
          "name": "Search Tracks",
          "request": {
            "method": "GET",
            "url": {
              "raw": "http://localhost:5000/api/tracks/search?query=rock",
              "query": [
                {
                  "key": "query",
                  "value": "rock"
                }
              ]
            }
          }
        },
        {
          "name": "Get Favorites",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/tracks/favorites",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Рекомендации по тестированию

1. Перед началом тестирования убедитесь, что сервер запущен.
2. Создайте тестового пользователя через запрос регистрации.
3. Получите токен авторизации через запрос входа.
4. Используйте полученный токен для тестирования защищенных маршрутов.
5. При необходимости обновите токен доступа с помощью refresh token.
6. После завершения тестирования выполните запрос выхода для отзыва токена.

## Коды ошибок и их значения

- 400 Bad Request - неверные параметры запроса
- 401 Unauthorized - требуется авторизация или истек токен
- 403 Forbidden - доступ запрещен (нет прав)
- 404 Not Found - ресурс не найден
- 409 Conflict - конфликт (например, пользователь уже существует)
- 500 Internal Server Error - внутренняя ошибка сервера

## Яндекс Музыка API (неофициальное)

### Настройка

Для использования неофициального API Яндекс Музыки необходимо добавить токен в `.env` файл:

```
YANDEX_MUSIC_TOKEN=your_yandex_music_token_here
```

Токен можно получить после авторизации в Яндекс Музыке, но обратите внимание, что использование неофициального API может нарушать условия использования сервиса.

### Поиск треков в Яндекс Музыке

```bash
curl -X GET http://localhost:5000/api/yandex/search?query=rammstein&limit=5
```

Пример ответа:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4325",
      "title": "Du Hast",
      "artist": "Rammstein",
      "album": "Sehnsucht",
      "duration": 234,
      "coverUrl": "https://avatars.yandex.net/get-music-content/123456/cover-400x400",
      "source": "yandexMusic",
      "sourceId": "12345678",
      "license": "All Rights Reserved",
      "genre": ["Industrial Metal"],
      "tags": ["metal", "german"],
      "playCount": 0,
      "likeCount": 0,
      "isPublic": true
    },
    // ... другие треки
  ]
}
```

### Получение популярных треков из Яндекс Музыки

```bash
curl -X GET http://localhost:5000/api/yandex/trending?limit=5
```

Пример ответа:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4326",
      "title": "Popular Song",
      "artist": "Famous Artist",
      "album": "New Album",
      "duration": 210,
      "coverUrl": "https://avatars.yandex.net/get-music-content/123456/cover-400x400",
      "source": "yandexMusic",
      "sourceId": "87654321",
      "license": "All Rights Reserved",
      "genre": ["Pop"],
      "tags": ["hit", "trending"],
      "playCount": 0,
      "likeCount": 0,
      "isPublic": true
    },
    // ... другие треки
  ]
}
```

### Получение треков по жанру из Яндекс Музыки

```bash
curl -X GET http://localhost:5000/api/yandex/genre/hip-hop?limit=5
```

Пример ответа:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60c72b2f9b1d8a2d8c9e4327",
      "title": "Hip Hop Track",
      "artist": "Rap Artist",
      "album": "Rap Album",
      "duration": 180,
      "coverUrl": "https://avatars.yandex.net/get-music-content/123456/cover-400x400",
      "source": "yandexMusic",
      "sourceId": "45678901",
      "license": "All Rights Reserved",
      "genre": ["Hip-Hop"],
      "tags": ["rap", "hip-hop"],
      "playCount": 0,
      "likeCount": 0,
      "isPublic": true
    },
    // ... другие треки
  ]
}
``` 