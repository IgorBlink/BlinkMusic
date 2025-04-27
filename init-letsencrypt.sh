#!/bin/bash

if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

# Домены, для которых запрашиваем сертификаты
domains=(blinkmusic.space www.blinkmusic.space)
rsa_key_size=4096
data_path="./certbot"
email="your-email@example.com" # Замените на свой email!
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

echo "### Подготовка временного файла конфигурации Nginx ..."
cp ./nginx/conf/init-letsencrypt.conf ./nginx/conf/default.conf

# Запуск nginx для проверки домена Let's Encrypt
echo "### Запуск Nginx ..."
docker compose up --force-recreate -d nginx

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

# Восстановление основной конфигурации Nginx
echo "### Восстановление основной конфигурации Nginx ..."
cp ./nginx/conf/default.conf.bak ./nginx/conf/default.conf 2>/dev/null || cp ./nginx/conf/default.conf ./nginx/conf/default.conf

# Перезапуск Nginx для применения новой конфигурации с SSL
echo "### Перезапуск Nginx ..."
docker compose exec nginx nginx -s reload

echo "### Готово! HTTPS настроен для ${domains[*]}" 