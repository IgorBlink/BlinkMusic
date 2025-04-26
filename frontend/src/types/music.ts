export interface Track {
  id: string;
  _id?: string;  // MongoDB ID from API
  title: string;
  artist: string;
  album: string;
  albumId?: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  previewUrl?: string;        // URL для предварительного прослушивания
  releaseDate?: string;
  genre?: string[];           // Теперь это массив строк
  tags?: string[];            // Tags array from API
  source?: string;            // Source information from API
  sourceId?: string;          // ID трека в источнике
  license?: string;           // Лицензия трека
  playCount?: number;         // Количество прослушиваний
  likeCount?: number;         // Количество лайков
  isPublic?: boolean;         // Публичный трек или нет
  enrichedData?: {
    trackId?: string;         // ID трека в AudioDB
    albumId?: string;         // ID альбома в AudioDB
    genre?: string;           // Жанр
    duration?: string;        // Длительность
    musicVideo?: string;      // URL музыкального видео
    description?: string;     // Описание трека
    mood?: string;            // Настроение трека
    theme?: string;           // Тема трека
    biography?: string;       // Биография исполнителя
    thumb?: string;           // URL изображения исполнителя
  };
}

export interface Lyrics {
  id: string;
  trackId: string;
  lines: LyricLine[];
}

export interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  annotationId?: string;
  annotation?: string;
}

export interface Annotation {
  id: string;
  lineId: string;
  content: string;
  author?: string;
  createdAt: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  albums?: Album[];
  trackIds?: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  userId: string;
  trackIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MusicSearchResult {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
} 