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

echo "### Создание резервной копии текущей конфигурации Nginx ..."
cp ./nginx/conf/default.conf ./nginx/conf/default.conf.bak

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
  # Раскомментируем HTTPS серверный блок в конфигурации Nginx
  sed -i 's/# server {/server {/' ./nginx/conf/default.conf
  sed -i 's/# listen 443 ssl;/listen 443 ssl;/' ./nginx/conf/default.conf
  sed -i 's/# http2 on;/http2 on;/' ./nginx/conf/default.conf
  sed -i 's/# listen \[::\]:443 ssl;/listen [::]:443 ssl;/' ./nginx/conf/default.conf
  sed -i 's/# server_name/server_name/' ./nginx/conf/default.conf
  sed -i 's/# server_tokens/server_tokens/' ./nginx/conf/default.conf
  sed -i 's/# ssl_certificate/ssl_certificate/' ./nginx/conf/default.conf
  sed -i 's/# ssl_certificate_key/ssl_certificate_key/' ./nginx/conf/default.conf
  sed -i 's/# ssl_trusted_certificate/ssl_trusted_certificate/' ./nginx/conf/default.conf
  sed -i 's/# ssl_protocols/ssl_protocols/' ./nginx/conf/default.conf
  sed -i 's/# ssl_prefer_server_ciphers/ssl_prefer_server_ciphers/' ./nginx/conf/default.conf
  sed -i 's/# ssl_ciphers/ssl_ciphers/' ./nginx/conf/default.conf
  sed -i 's/# ssl_session_cache/ssl_session_cache/' ./nginx/conf/default.conf
  sed -i 's/# ssl_session_timeout/ssl_session_timeout/' ./nginx/conf/default.conf
  sed -i 's/# ssl_session_tickets/ssl_session_tickets/' ./nginx/conf/default.conf
  sed -i 's/# ssl_stapling/ssl_stapling/' ./nginx/conf/default.conf
  sed -i 's/# ssl_stapling_verify/ssl_stapling_verify/' ./nginx/conf/default.conf
  sed -i 's/# resolver/resolver/' ./nginx/conf/default.conf
  sed -i 's/# resolver_timeout/resolver_timeout/' ./nginx/conf/default.conf
  sed -i 's/# add_header/add_header/' ./nginx/conf/default.conf
  sed -i 's/# location \/api\//location \/api\//' ./nginx/conf/default.conf
  sed -i 's/# proxy_pass/proxy_pass/' ./nginx/conf/default.conf
  sed -i 's/# proxy_http_version/proxy_http_version/' ./nginx/conf/default.conf
  sed -i 's/# proxy_set_header/proxy_set_header/' ./nginx/conf/default.conf
  sed -i 's/# proxy_cache_bypass/proxy_cache_bypass/' ./nginx/conf/default.conf
  sed -i 's/# location \/ {/location \/ {/' ./nginx/conf/default.conf
  sed -i 's/# }/}/' ./nginx/conf/default.conf
  
  # Раскомментируем перенаправление с HTTP на HTTPS
  sed -i 's/# location \/ {/location \/ {/' ./nginx/conf/default.conf.tmp
  sed -i 's/#     return 301 https:\/\/$host$request_uri;/    return 301 https:\/\/$host$request_uri;/' ./nginx/conf/default.conf
  
  # Закомментируем временные HTTP-проксирования в первом блоке
  sed -i '/Временная конфигурация для HTTP/,/proxy_cache_bypass/s/^/#/' ./nginx/conf/default.conf
else
  echo "### Ошибка! Сертификаты не получены. Возвращаем предыдущую конфигурацию Nginx ..."
  cp ./nginx/conf/default.conf.bak ./nginx/conf/default.conf
fi

# Перезапуск Nginx для применения новой конфигурации
echo "### Перезапуск Nginx для применения новой конфигурации ..."
docker compose restart nginx

echo "### Готово! Проверьте доступность вашего сайта по HTTPS: https://${domains[0]}" 