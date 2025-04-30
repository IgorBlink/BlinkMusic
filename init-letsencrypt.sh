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

echo "### Создание временной конфигурации Nginx для получения сертификатов ..."

# Создаем временную конфигурацию для получения сертификатов Let's Encrypt
cat > ./nginx/conf/default.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name blinkmusic.space www.blinkmusic.space;
    server_tokens off;

    # Точка для проверки домена Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Временная конфигурация для HTTP - используется только для получения сертификатов
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    server_tokens off;

    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Запуск контейнеров
echo "### Запуск контейнеров или перезапуск, если они уже работают..."
docker-compose up -d

# Ожидаем запуск Nginx
echo "### Ожидаем запуск Nginx..."
sleep 5

echo "### Запрос сертификатов Let's Encrypt ..."

# Выбор параметров в зависимости от staging или production
if [ $staging != "0" ]; then
  staging_arg="--staging"
fi

# Запрос сертификатов
docker-compose run --rm --entrypoint "\
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
  # Создаем конфигурацию с HTTPS
  cat > ./nginx/conf/default.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name blinkmusic.space www.blinkmusic.space;
    server_tokens off;

    # Точка для проверки домена Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Редирект на HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name blinkmusic.space www.blinkmusic.space;
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/blinkmusic.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blinkmusic.space/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/blinkmusic.space/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Проксирование API запросов
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Проксирование всех остальных запросов на фронтенд
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Сервер для входа по IP-адресу (без привязки к домену)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    server_tokens off;

    # Проксирование API запросов на бэкенд
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Проксирование всех остальных запросов на фронтенд
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

else
  echo "### Ошибка! Сертификаты не получены."
  echo "### Убедитесь, что ваш домен правильно настроен и доступен из Интернета."
  echo "### Проверьте, что порт 80 открыт и доступен для Let's Encrypt."
fi

# Перезапуск Nginx для применения новой конфигурации
echo "### Перезапуск Nginx для применения новой конфигурации ..."
docker-compose restart nginx

echo "### Готово! Проверьте доступность вашего сайта по HTTPS: https://${domains[0]}" 