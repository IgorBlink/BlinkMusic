import mongoose, { Document, Schema } from 'mongoose';

export interface ISyncedLyricsLine {
  startTime: number; // время начала строки в миллисекундах
  endTime: number;   // время окончания строки
  text: string;      // текст строки
}

export interface ISyncedLyrics extends Document {
  trackId: mongoose.Types.ObjectId;
  videoId?: string;         // ID видео на YouTube
  language?: string;        // язык текста
  source: string;           // источник (youtube, user, lrc и т.д.)
  lines: ISyncedLyricsLine[];
  createdAt: Date;
  updatedAt: Date;
}

const SyncedLyricsSchema: Schema = new Schema(
  {
    trackId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Track', 
      required: true,
      index: true
    },
    videoId: { 
      type: String 
    },
    language: { 
      type: String, 
      default: 'en' 
    },
    source: { 
      type: String, 
      required: true, 
      enum: ['youtube', 'user', 'lrc', 'other'] 
    },
    lines: [{
      startTime: { type: Number, required: true },
      endTime: { type: Number, required: true },
      text: { type: String, required: true }
    }]
  },
  {
    timestamps: true,
  }
);

// Индекс для быстрого поиска
SyncedLyricsSchema.index({ trackId: 1 }, { unique: true });
SyncedLyricsSchema.index({ videoId: 1 });

export default mongoose.model<ISyncedLyrics>('SyncedLyrics', SyncedLyricsSchema); 