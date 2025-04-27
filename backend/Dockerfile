FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование файлов package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода приложения
COPY . .

# Создание папки для логов, если она используется
RUN mkdir -p logs

# Установка прав на папки
RUN chmod -R 777 /app/logs

# Экспорт порта для API
EXPOSE 5000

# Запуск приложения
CMD ["npm", "run", "start"] 