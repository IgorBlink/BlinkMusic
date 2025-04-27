# 🎵 BlinkMusic

<p align="center">
  <img src="public/logo.svg" alt="BlinkMusic Logo" width="150" height="150" />
</p>

<div align="center">
  <strong>Музыкальное приложение с космической атмосферой | Music app with cosmic vibes</strong>
</div>

<div align="center">
  <sub>Созвездие музыки и технологий | The constellation of music and technology</sub>
</div>

<br />

<div align="center">
  <a href="#-features">Features</a> •
  <a href="#-frontend">Frontend</a> •
  <a href="#-backend">Backend</a> •
  <a href="#-stack">Stack</a> •
  <a href="#-docker">Docker</a> •
  <a href="#-ssl">SSL & Domain</a> •
  <a href="#-russian">По-русски</a>
</div>

<br />

## ✨ Features

- **Cosmic UI** — Immerse yourself in a deep blue space-themed interface
- **Synchronized Lyrics** — Lyrics scroll automatically as the music plays
- **AI Annotations** — Get instant explanations for any line with a single click
- **Smart Navigation** — Click any lyric to jump directly to that part of the song
- **Audio Visualization** — See your music come alive with reactive visualizations

## 🚀 Quickstart

```bash
# Clone the cosmic voyage
git clone https://github.com/IgorBlink/BlinkMusic.git

# Navigate to the mothership
cd BlinkMusic/frontend

# Install star dust
npm install

# Launch into orbit
npm run dev
```

Visit `http://localhost:5173` to experience the cosmos.

## 🎨 Frontend

The frontend of BlinkMusic is built with React and Vite, offering a responsive and fast cosmic music experience:

- Built with **React + TypeScript** for robust component architecture
- Uses **Vite** for lightning-fast development and hot module replacement
- Includes audio visualization features using **Web Audio API**
- Implements **React Router** for seamless navigation
- Uses **Context API** for cosmic state management across the application
- Features a space-themed UI with reactive components

## 🔌 Backend

The backend of BlinkMusic is a stellar Node.js API that powers the music universe:

- **Node.js** server providing REST API endpoints
- **MongoDB** database for storing cosmic music data
- **JWT Authentication** for secure access to the musical galaxy
- **External API Integrations** with:
  - **LastFM API** for music metadata
  - **YouTube API** for streaming celestial sounds
  - **Gemini API** for AI-powered lyric annotations
- **Express.js** for routing through the sonic cosmos
- **Real-time features** for synchronized lyric display

### Environment Variables

The backend starship is controlled via these cosmic coordinates:

```
PORT=5000
NODE_ENV=development/production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:3000
LASTFM_API_KEY=your_lastfm_api_key
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## 🛠️ Stack

- **React + TypeScript** — For stellar UI components
- **Vite** — Lightning-fast cosmic development
- **Web Audio API** — For interstellar sound visualization
- **React Router** — Navigation through the musical universe
- **Context API** — State management across the dimensions
- **Node.js + Express** — Powerful backend API server
- **MongoDB** — NoSQL database for flexible data storage
- **JWT** — Secure authentication and authorization
- **External APIs** — Integration with music service providers
- **Nginx** — High-performance web server for proxying and static file serving
- **Certbot** — Automated SSL certificate management

## 🐳 Docker

### Requirements
- Docker
- Docker Compose

### Project Structure
- `./frontend` - React application (Vite)
- `./backend` - Node.js API server
- `compose.yaml` - Docker Compose configuration
- `run.sh` - Convenient startup script
- `./nginx` - Nginx configuration for proxying and HTTPS
- `./certbot` - SSL certificates and validation files

### Quick Deployment with Docker

#### Using run.sh Script

1. Clone the repository:
```bash
git clone https://github.com/yourusername/BlinkMusic.git
cd BlinkMusic
```

2. Make the startup script executable:
```bash
chmod +x run.sh
```

3. Launch the project:
```bash
./run.sh build
```

4. Open the application in browser:
```
http://localhost:3000
```

#### Manual Deployment

1. Clone the repository:
```bash
git clone https://github.com/yourusername/BlinkMusic.git
cd BlinkMusic
```

2. Build and launch containers:
```bash
docker compose build
docker compose up -d
```

3. Check container status:
```bash
docker compose ps
```

4. View logs:
```bash
docker compose logs -f
```

5. Open the application in browser:
```
http://localhost:3000
```

### Stopping the Project

```bash
./run.sh down
```

or

```bash
docker compose down
```

## 🔒 SSL & Domain

BlinkMusic supports secure HTTPS connections and custom domain setup using Nginx and Let's Encrypt.

### Setting up SSL Certificates

1. Edit the `init-letsencrypt.sh` script and set your email address:
```bash
email="your-email@example.com" # Replace with your email
```

2. Make the script executable:
```bash
chmod +x init-letsencrypt.sh
```

3. Run the certificate initialization script:
```bash
./init-letsencrypt.sh
```

4. The script will:
   - Configure Nginx for Let's Encrypt domain validation
   - Obtain SSL certificates from Let's Encrypt
   - Configure HTTPS with your new certificates
   - Set up automatic certificate renewal

### Domain Configuration

The default configuration is set up for the domain `blinkmusic.space`. To use your own domain:

1. Replace all instances of `blinkmusic.space` in nginx configuration files:
```bash
find ./nginx -type f -exec sed -i 's/blinkmusic.space/yourdomain.com/g' {} \;
```

2. Update the domains in the initialization script:
```bash
# Edit init-letsencrypt.sh
domains=(yourdomain.com www.yourdomain.com)
```

3. Run the initialization script to get certificates for your domain.

### Access Methods

- **Domain Access**: https://blinkmusic.space (or your custom domain)
- **IP Access**: http://your-server-ip - Automatically routes API requests to backend
- **API Endpoint**: All requests to `/api/` are automatically routed to the backend

<h2 id="-russian">🌌 По-русски</h2>

## ✨ Возможности

- **Космический интерфейс** — Погрузитесь в глубокий синий космический интерфейс
- **Синхронизированные тексты** — Тексты автоматически прокручиваются во время воспроизведения
- **ИИ-аннотации** — Мгновенные объяснения любой строки текста одним нажатием
- **Умная навигация** — Нажмите на любую строку, чтобы перейти к этой части песни
- **Аудиовизуализация** — Наблюдайте, как музыка оживает с реактивной визуализацией

## 🚀 Быстрый старт

```bash
# Клонируем космическое путешествие
git clone https://github.com/IgorBlink/BlinkMusic.git

# Переходим на базовый корабль
cd BlinkMusic/frontend

# Устанавливаем звездную пыль
npm install

# Запускаемся на орбиту
npm run dev
```

Откройте `http://localhost:5173`, чтобы испытать космос.

## 🎨 Фронтенд

Фронтенд BlinkMusic построен с использованием React и Vite, предлагая отзывчивый и быстрый космический музыкальный опыт:

- Создан с использованием **React + TypeScript** для надежной архитектуры компонентов
- Использует **Vite** для молниеносной разработки и горячей замены модулей
- Включает функции визуализации звука с использованием **Web Audio API**
- Реализует **React Router** для бесшовной навигации
- Использует **Context API** для космического управления состоянием в приложении
- Содержит космический UI с реактивными компонентами

## 🔌 Бэкенд

Бэкенд BlinkMusic — это звездный API на Node.js, который питает музыкальную вселенную:

- **Node.js** сервер, предоставляющий конечные точки REST API
- **MongoDB** база данных для хранения космических музыкальных данных
- **JWT Аутентификация** для безопасного доступа к музыкальной галактике
- **Интеграции с внешними API**:
  - **LastFM API** для музыкальных метаданных
  - **YouTube API** для стриминга небесных звуков
  - **Gemini API** для аннотаций текстов песен с помощью ИИ
- **Express.js** для маршрутизации через звуковой космос
- **Функции реального времени** для синхронизированного отображения текстов

### Переменные окружения

Бэкенд-корабль управляется через эти космические координаты:

```
PORT=5000
NODE_ENV=development/production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:3000
LASTFM_API_KEY=your_lastfm_api_key
YOUTUBE_API_KEY=your_youtube_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## 🛠️ Технологии

- **React + TypeScript** — Для звездных UI-компонентов
- **Vite** — Молниеносная космическая разработка
- **Web Audio API** — Для межзвездной визуализации звука
- **React Router** — Навигация по музыкальной вселенной
- **Context API** — Управление состоянием между измерениями
- **Node.js + Express** — Мощный бэкенд API-сервер
- **MongoDB** — NoSQL база данных для гибкого хранения данных
- **JWT** — Безопасная аутентификация и авторизация
- **Внешние API** — Интеграция с провайдерами музыкальных сервисов
- **Nginx** — Высокопроизводительный веб-сервер для проксирования и раздачи статических файлов
- **Certbot** — Автоматизированное управление SSL-сертификатами

## 🐳 Docker

### Требования
- Docker
- Docker Compose

### Структура проекта
- `./frontend` - React приложение (Vite)
- `./backend` - Node.js API-сервер
- `compose.yaml` - Конфигурация Docker Compose
- `run.sh` - Удобный скрипт запуска
- `./nginx` - Конфигурация Nginx для проксирования и HTTPS
- `./certbot` - SSL-сертификаты и файлы валидации

### Быстрое развертывание с Docker

#### Использование скрипта run.sh

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/BlinkMusic.git
cd BlinkMusic
```

2. Сделайте скрипт запуска исполняемым:
```bash
chmod +x run.sh
```

3. Запустите проект:
```bash
./run.sh build
```

4. Откройте приложение в браузере:
```
http://localhost:3000
```

#### Ручной запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/BlinkMusic.git
cd BlinkMusic
```

2. Соберите и запустите контейнеры:
```bash
docker compose build
docker compose up -d
```

3. Проверьте статус контейнеров:
```bash
docker compose ps
```

4. Просмотр логов:
```bash
docker compose logs -f
```

5. Откройте приложение в браузере:
```
http://localhost:3000
```

### Остановка проекта

```bash
./run.sh down
```

или 

```bash
docker compose down
```

## 🔒 SSL и Домен

BlinkMusic поддерживает безопасные HTTPS-соединения и настройку пользовательского домена с помощью Nginx и Let's Encrypt.

### Настройка SSL-сертификатов

1. Отредактируйте скрипт `init-letsencrypt.sh` и укажите ваш email:
```bash
email="your-email@example.com" # Замените на ваш email
```

2. Сделайте скрипт исполняемым:
```bash
chmod +x init-letsencrypt.sh
```

3. Запустите скрипт инициализации сертификатов:
```bash
./init-letsencrypt.sh
```

4. Скрипт выполнит:
   - Настройку Nginx для валидации домена Let's Encrypt
   - Получение SSL-сертификатов от Let's Encrypt
   - Настройку HTTPS с вашими новыми сертификатами
   - Настройку автоматического обновления сертификатов

### Конфигурация домена

Базовая конфигурация настроена для домена `blinkmusic.space`. Чтобы использовать свой домен:

1. Замените все вхождения `blinkmusic.space` в конфигурационных файлах nginx:
```bash
find ./nginx -type f -exec sed -i 's/blinkmusic.space/вашдомен.com/g' {} \;
```

2. Обновите домены в скрипте инициализации:
```bash
# Отредактируйте init-letsencrypt.sh
domains=(вашдомен.com www.вашдомен.com)
```

3. Запустите скрипт инициализации для получения сертификатов для вашего домена.

### Методы доступа

- **Доступ по домену**: https://blinkmusic.space (или ваш кастомный домен)
- **Доступ по IP**: http://ip-вашего-сервера - Автоматически направляет API-запросы на бэкенд
- **API-эндпойнт**: Все запросы к `/api/` автоматически направляются на бэкенд

---

<div align="center">
  <sub>Made with 💙 and cosmic energy</sub>
</div>