"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteOnAnnotation = exports.explainLyric = exports.getAnnotation = void 0;
const annotationService_1 = __importDefault(require("../services/annotationService"));
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * @desc Get an annotation for a specific lyric line
 * @route GET /api/annotations/track/:trackId
 * @access Public
 */
const getAnnotation = async (req, res) => {
    try {
        const { trackId } = req.params;
        const { line } = req.query;
        if (!line || typeof line !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Необходимо указать строку текста песни (параметр line)'
            });
            return;
        }
        // Всегда запрашиваем новую аннотацию от Gemini API
        const annotation = await annotationService_1.default.getAnnotation(trackId, line);
        res.json({
            success: true,
            annotation
        });
    }
    catch (error) {
        logger_1.logger.error(`Error getting annotation: ${error.message}`);
        res.status(error.message === 'Track not found' ? 404 : 500).json({
            success: false,
            message: error.message || 'Произошла ошибка при получении аннотации'
        });
    }
};
exports.getAnnotation = getAnnotation;
/**
 * @desc Explain a specific lyric line in the context of the full lyrics
 * @route POST /api/annotations/explain
 * @access Public
 */
const explainLyric = async (req, res) => {
    try {
        const { lyricLine, fullLyrics, artist, trackTitle } = req.body;
        // Проверяем наличие всех обязательных полей
        if (!lyricLine || !artist || !trackTitle) {
            res.status(400).json({
                success: false,
                message: 'Необходимо указать строку текста (lyricLine), исполнителя (artist) и название песни (trackTitle)'
            });
            return;
        }
        // Используем сервис для получения объяснения от Gemini API
        const explanationText = await annotationService_1.default.explainLyric(lyricLine, trackTitle, artist, fullLyrics || '');
        res.json({
            success: true,
            annotation: {
                text: explanationText,
                generated: true
            }
        });
    }
    catch (error) {
        logger_1.logger.error(`Error explaining lyric: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Произошла ошибка при генерации объяснения'
        });
    }
};
exports.explainLyric = explainLyric;
/**
 * @desc Vote on an annotation (upvote or downvote)
 * @route POST /api/annotations/:annotationId/vote
 * @access Public
 */
const voteOnAnnotation = async (req, res) => {
    try {
        const { annotationId } = req.params;
        const { vote } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(annotationId)) {
            res.status(400).json({
                success: false,
                message: 'Неверный формат ID аннотации'
            });
            return;
        }
        if (vote !== 'upvote' && vote !== 'downvote') {
            res.status(400).json({
                success: false,
                message: 'Параметр vote должен быть "upvote" или "downvote"'
            });
            return;
        }
        const updatedAnnotation = await annotationService_1.default.voteOnAnnotation(annotationId, vote);
        res.json({
            success: true,
            annotation: updatedAnnotation
        });
    }
    catch (error) {
        logger_1.logger.error(`Error voting on annotation: ${error.message}`);
        res.status(error.message === 'Annotation not found' ? 404 : 500).json({
            success: false,
            message: error.message || 'Произошла ошибка при голосовании'
        });
    }
};
exports.voteOnAnnotation = voteOnAnnotation;
