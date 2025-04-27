"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = exports.GeminiService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
/**
 * Сервис для работы с Google Gemini API для генерации аннотаций к текстам песен
 */
class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
        if (!this.apiKey) {
            logger_1.logger.warn('GEMINI_API_KEY не указан в .env файле. Аннотации не будут работать.');
        }
    }
    /**
     * Генерирует аннотацию для строки из песни
     * @param songLine Строка из песни для аннотации
     * @param songText Полный текст песни для контекста
     * @param artist Исполнитель песни
     * @param songTitle Название песни
     * @returns Аннотация к строке
     */
    async generateAnnotation(songLine, songText, artist, songTitle) {
        try {
            if (!this.apiKey) {
                return 'Для получения аннотаций требуется API ключ Gemini.';
            }
            // Формируем промпт для модели
            const prompt = this.buildPrompt(songLine, songText, artist, songTitle);
            // URL для Gemini API
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
            // Отправляем запрос к API
            const response = await axios_1.default.post(url, {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            });
            // Извлекаем и возвращаем ответ
            if (response.data.candidates &&
                response.data.candidates[0] &&
                response.data.candidates[0].content &&
                response.data.candidates[0].content.parts &&
                response.data.candidates[0].content.parts[0] &&
                response.data.candidates[0].content.parts[0].text) {
                return response.data.candidates[0].content.parts[0].text;
            }
            else {
                logger_1.logger.error('Некорректный ответ от Gemini API:', response.data);
                return 'Не удалось получить аннотацию.';
            }
        }
        catch (error) {
            logger_1.logger.error('Ошибка при получении аннотации от Gemini API:', error.message);
            return 'Произошла ошибка при получении аннотации.';
        }
    }
    /**
     * Создает промпт для модели
     */
    buildPrompt(songLine, songText, artist, songTitle) {
        return `Проанализируй следующую строку из песни "${songTitle}" исполнителя ${artist}:
    
"${songLine}"

Вот полный текст песни для контекста:
"""
${songText}
"""

Создай глубокую и содержательную аннотацию к этой строке. Объясни:
1. О чем говорится в этой строке
2. Какой смысл пытается передать автор
3. Возможные метафоры, сравнения или отсылки
4. Контекст строки в песне
5. Если это возможно, связь с биографией исполнителя или историей создания песни

Пиши ответ на русском языке в формате связного текста без нумерованных пунктов.`;
    }
}
exports.GeminiService = GeminiService;
exports.geminiService = new GeminiService();
