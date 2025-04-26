# Тестовые запросы BlinkMusic API

## Регистрация пользователя

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Ожидаемый ответ:**
```json
{
  "message": "Пользователь успешно зарегистрирован",
  "user": {
    "id": "6123456789abcdef01234567",
    "username": "testuser",
    "email": "test@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Авторизация пользователя

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "password123"
  }'
```

**Ожидаемый ответ:**
```json
{
  "message": "Успешная авторизация",
  "user": {
    "id": "6123456789abcdef01234567",
    "username": "testuser",
    "email": "test@example.com",
    "isAdmin": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Получение данных текущего пользователя

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ожидаемый ответ:**
```json
{
  "user": {
    "id": "6123456789abcdef01234567",
    "username": "testuser",
    "email": "test@example.com",
    "isAdmin": false
  }
}
```

## Обновление токена

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  --cookie "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ожидаемый ответ:**
```json
{
  "message": "Токены успешно обновлены",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Выход из системы

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  --cookie "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ожидаемый ответ:**
```json
{
  "message": "Выход выполнен успешно"
}
``` 