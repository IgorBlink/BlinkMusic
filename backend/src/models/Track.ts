import mongoose, { Document, Schema } from 'mongoose';

export interface ITrackMetadata {
  genre?: string[];
  year?: string;
  mood?: string;
  style?: string;
  description?: string;
  country?: string;
  coverUrl?: string;
}

export interface ITrack extends Document {
  title: string;
  artist: string;
  album?: string;
  albumName?: string;
  duration: number;
  coverUrl?: string;
  audioUrl: string;
  previewUrl?: string;
  lyrics?: string;
  source: 'jamendo' | 'freeMusicArchive' | 'soundcloud' | 'ncs' | 'lastfm' | 'audiodb' | 'other';
  sourceId: string;
  license: string;
  genre?: string[];
  tags?: string[];
  playCount: number;
  likeCount: number;
  isPublic: boolean;
  enriched?: ITrackMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema: Schema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Индексы для быстрого поиска
TrackSchema.index({ source: 1, sourceId: 1 }, { unique: true });
TrackSchema.index({ artist: 1, title: 1 });
TrackSchema.index({ genre: 1 });
TrackSchema.index({ playCount: -1 });
TrackSchema.index({ likeCount: -1 });

export default mongoose.model<ITrack>('Track', TrackSchema); 