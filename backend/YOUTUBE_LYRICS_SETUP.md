# Настройка YouTube API для получения синхронизированных текстов песен

Это руководство поможет вам правильно настроить YouTube API для получения субтитров из YouTube и использования их как синхронизированных текстов песен.

## 1. Создание проекта Google Cloud Platform

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. В меню выберите "APIs & Services" > "Dashboard"
4. Нажмите "ENABLE APIS AND SERVICES"
5. Найдите и включите следующие API:
   - YouTube Data API v3

## 2. Создание API ключа

1. В меню выберите "APIs & Services" > "Credentials"
2. Нажмите "CREATE CREDENTIALS" > "API key"
3. Скопируйте созданный API ключ
4. Нажмите "RESTRICT KEY" и установите следующие ограничения:
   - Application restrictions: HTTP referrers (websites)
   - API restrictions: YouTube Data API v3

## 3. Добавление API ключа в проект

1. Откройте файл `.env` в корне проекта
2. Добавьте или обновите строку с API ключом:
   ```
   YOUTUBE_API_KEY=ваш_api_ключ
   ```

## 4. Ограничения и квоты YouTube API

Важно помнить о следующих ограничениях YouTube API:

- У YouTube Data API v3 есть квота в 10,000 единиц в день для бесплатного использования
- Каждый запрос к API расходует определенное количество единиц:
  - search.list: 100 единиц за запрос
  - captions.list: 50 единиц за запрос
  - videos.list: 1-5 единиц за запрос

Поэтому рекомендуется:
- Кэшировать полученные данные в базе данных
- Ограничивать частоту запросов
- Реализовать резервные методы получения лирики

## 5. Проверка настройки

После настройки API вы можете проверить работу системы получения лирики с помощью команды:

```bash
npm run test:lyrics
```

## 6. Примечания по субтитрам

- Не все видео на YouTube имеют субтитры
- Качество автоматически сгенерированных субтитров может быть низким
- Субтитры могут быть несинхронизированы с музыкой или содержать ошибки
- Наилучшие результаты дают официальные музыкальные видео с ручным добавлением субтитров

## 7. Юридические аспекты

- Использование субтитров должно соответствовать [Условиям использования YouTube](https://www.youtube.com/t/terms)
- Рекомендуется указывать источник данных (YouTube) при отображении лирики
- Для коммерческого использования могут требоваться дополнительные разрешения 