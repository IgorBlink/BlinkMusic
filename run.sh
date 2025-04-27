#!/bin/bash

# Цвета для вывода в терминал
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода информации
info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

# Функция для вывода предупреждений
warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# Функция для вывода ошибок
error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия Docker и Docker Compose
if ! command -v docker &> /dev/null; then
  error "Docker не установлен. Пожалуйста, установите Docker перед использованием этого скрипта."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  error "Docker Compose не установлен. Пожалуйста, установите Docker Compose перед использованием этого скрипта."
  exit 1
fi

# Функция для остановки контейнеров при нажатии Ctrl+C
cleanup() {
  info "Остановка контейнеров..."
  docker-compose down
  info "Контейнеры остановлены."
  exit 0
}

# Добавляем обработчик сигнала прерывания
trap cleanup SIGINT SIGTERM

# Функция для справки
show_help() {
  echo "Использование: ./run.sh [ОПЦИЯ]"
  echo "Опции:"
  echo "  build     Собрать контейнеры перед запуском"
  echo "  up        Запустить контейнеры (по умолчанию)"
  echo "  down      Остановить контейнеры"
  echo "  logs      Показать логи контейнеров"
  echo "  help      Показать эту справку"
  echo ""
  echo "Примеры:"
  echo "  ./run.sh build    # Собрать и запустить контейнеры"
  echo "  ./run.sh          # Запустить контейнеры"
  echo "  ./run.sh down     # Остановить контейнеры"
}

# Обработка аргументов командной строки
case "$1" in
  "build")
    info "Сборка контейнеров..."
    docker-compose build
    info "Запуск контейнеров..."
    docker-compose up -d
    info "Контейнеры запущены! Открой http://localhost:3000 в браузере"
    docker-compose logs -f
    ;;
  "up" | "")
    info "Запуск контейнеров..."
    docker-compose up -d
    info "Контейнеры запущены! Открой http://localhost:3000 в браузере"
    docker-compose logs -f
    ;;
  "down")
    info "Остановка контейнеров..."
    docker-compose down
    info "Контейнеры остановлены."
    ;;
  "logs")
    info "Вывод логов контейнеров..."
    docker-compose logs -f
    ;;
  "help" | "-h" | "--help")
    show_help
    ;;
  *)
    error "Неизвестная опция: $1"
    show_help
    exit 1
    ;;
esac

exit 0 