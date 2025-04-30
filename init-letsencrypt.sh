#!/bin/bash

if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

# Домены, для которых запрашиваем сертификаты
domains=(blinkmusic.space www.blinkmusic.space)
rsa_key_size=4096
data_path="./certbot"
email="admin@blinkmusic.space" # Замените на свой реальный email!
staging=0 # Установите 1 для тестирования (без лимитов Let's Encrypt)

if [ -d "$data_path" ]; then
  read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -d "$data_path/conf/live/$domains" ]; then
  echo "### Создание директорий для сертификатов ..."
  mkdir -p "$data_path/conf/live/$domains"
  mkdir -p "$data_path/www"
fi

echo "### Создание резервной копии текущей конфигурации Nginx ..."
cp ./nginx/conf/init-letsencrypt.conf ./nginx/conf/init-letsencrypt.conf.bak

echo "### Подготовка временного файла конфигурации Nginx ..."
cp ./nginx/conf/init-letsencrypt.conf ./nginx/conf/default.conf

# Запуск nginx для проверки домена Let's Encrypt
echo "### Перезапуск Nginx с временной конфигурацией ..."
docker compose restart nginx

# Ожидаем запуск Nginx
sleep 5

echo "### Запрос сертификатов Let's Encrypt ..."

# Выбор параметров в зависимости от staging или production
if [ $staging != "0" ]; then
  staging_arg="--staging"
fi

# Запрос сертификатов
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --no-eff-email \
    -d ${domains[0]} -d ${domains[1]}" certbot

echo "### Проверка сертификатов ..."
if [ -d "$data_path/conf/live/${domains[0]}" ]; then
  echo "### Сертификаты успешно получены!"
  
  echo "### Создание финальной конфигурации Nginx с поддержкой SSL ..."
  # Не требуется раскомментирование, т.к. файл уже содержит раскомментированные блоки
  # Просто копируем основной файл конфигурации обратно
  cp ./nginx/conf/init-letsencrypt.conf ./nginx/conf/default.conf
else
  echo "### Ошибка! Сертификаты не получены. Возвращаем предыдущую конфигурацию Nginx ..."
  cp ./nginx/conf/init-letsencrypt.conf.bak ./nginx/conf/default.conf
fi

# Перезапуск Nginx для применения новой конфигурации
echo "### Перезапуск Nginx для применения новой конфигурации ..."
docker compose restart nginx

echo "### Готово! Проверьте доступность вашего сайта по HTTPS: https://${domains[0]}" 