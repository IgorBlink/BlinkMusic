"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
// Импорт маршрутов
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const trackRoutes_1 = __importDefault(require("./routes/trackRoutes"));
const lyricsRoutes_1 = __importDefault(require("./routes/lyricsRoutes"));
const annotationRoutes_1 = __importDefault(require("./routes/annotationRoutes"));
// Загружаем переменные окружения из .env файла
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Настройка CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Маршруты API
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tracks', trackRoutes_1.default);
app.use('/api/lyrics', lyricsRoutes_1.default);
app.use('/api/annotations', annotationRoutes_1.default);
// Обработка 404
app.use((req, res) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});
// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});
exports.default = app;
