"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TrackSchema = new mongoose_1.Schema({
    title: { type: String, required: true, index: true },
    artist: { type: String, required: true, index: true },
    album: { type: String },
    albumName: { type: String }, // Альтернативное название альбома
    duration: { type: Number }, // длительность в секундах
    coverUrl: { type: String },
    audioUrl: { type: String, required: true }, // URL для полного трека
    previewUrl: { type: String }, // URL для превью
    lyrics: { type: String },
    source: {
        type: String,
        enum: ['jamendo', 'freeMusicArchive', 'soundcloud', 'ncs', 'lastfm', 'audiodb', 'other'],
        required: true
    },
    sourceId: { type: String, required: true },
    license: { type: String, required: true },
    genre: [{ type: String }],
    tags: [{ type: String }],
    playCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    enriched: {
        genre: [{ type: String }],
        year: { type: String },
        mood: { type: String },
        style: { type: String },
        description: { type: String },
        country: { type: String },
        coverUrl: { type: String }
    }
}, {
    timestamps: true,
});
// Индексы для быстрого поиска
TrackSchema.index({ source: 1, sourceId: 1 }, { unique: true });
TrackSchema.index({ artist: 1, title: 1 });
TrackSchema.index({ genre: 1 });
TrackSchema.index({ playCount: -1 });
TrackSchema.index({ likeCount: -1 });
exports.default = mongoose_1.default.model('Track', TrackSchema);
