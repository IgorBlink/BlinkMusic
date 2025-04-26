import api from './axios';

// Типы для ответов API
export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  duration: number;
  album: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  cover: string;
  tracks: Track[];
}

export interface Lyrics {
  trackId: string;
  lines: LyricLine[];
  language: string;
}

export interface LyricLine {
  text: string;
  startTime: number;
  endTime: number;
  annotation?: string;
}

export interface Playlist {
  id: string;
  title: string;
  owner: string;
  isPublic: boolean;
  tracks: Track[];
  cover?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Сервисы для работы с API

// Сервис для работы с треками
export const TrackService = {
  // Получить список треков
  async getTracks(page = 1, limit = 20): Promise<PaginatedResponse<Track>> {
    const response = await api.get<PaginatedResponse<Track>>('/tracks', {
      params: { page, limit }
    });
    return response.data;
  },

  // Получить трек по ID
  async getTrackById(id: string): Promise<Track> {
    const response = await api.get<Track>(`/tracks/${id}`);
    return response.data;
  },

  // Поиск треков
  async searchTracks(query: string, page = 1, limit = 20): Promise<PaginatedResponse<Track>> {
    const response = await api.get<PaginatedResponse<Track>>('/tracks/search', {
      params: { query, page, limit }
    });
    return response.data;
  },

  // Получить рекомендованные треки
  async getRecommendedTracks(limit = 10): Promise<Track[]> {
    const response = await api.get<Track[]>('/tracks/recommended', {
      params: { limit }
    });
    return response.data;
  },

  // Получить трендовые треки
  async getTrendingTracks(limit = 10): Promise<Track[]> {
    const response = await api.get<Track[]>('/tracks/trending', {
      params: { limit }
    });
    return response.data;
  },

  // Получить текст песни
  async getLyrics(trackId: string): Promise<Lyrics> {
    const response = await api.get<Lyrics>(`/tracks/${trackId}/lyrics`);
    return response.data;
  }
};

// Сервис для работы с альбомами
export const AlbumService = {
  // Получить список альбомов
  async getAlbums(page = 1, limit = 20): Promise<PaginatedResponse<Album>> {
    const response = await api.get<PaginatedResponse<Album>>('/albums', {
      params: { page, limit }
    });
    return response.data;
  },

  // Получить альбом по ID
  async getAlbumById(id: string): Promise<Album> {
    const response = await api.get<Album>(`/albums/${id}`);
    return response.data;
  },

  // Получить треки альбома
  async getAlbumTracks(albumId: string): Promise<Track[]> {
    const response = await api.get<Track[]>(`/albums/${albumId}/tracks`);
    return response.data;
  }
};

// Сервис для работы с плейлистами
export const PlaylistService = {
  // Получить плейлисты пользователя
  async getUserPlaylists(): Promise<Playlist[]> {
    const response = await api.get<Playlist[]>('/playlists');
    return response.data;
  },

  // Получить плейлист по ID
  async getPlaylistById(id: string): Promise<Playlist> {
    const response = await api.get<Playlist>(`/playlists/${id}`);
    return response.data;
  },

  // Создать новый плейлист
  async createPlaylist(data: {
    title: string;
    isPublic: boolean;
  }): Promise<Playlist> {
    const response = await api.post<Playlist>('/playlists', data);
    return response.data;
  },

  // Добавить трек в плейлист
  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(`/playlists/${playlistId}/tracks`, {
      trackId
    });
    return response.data;
  },

  // Удалить трек из плейлиста
  async removeTrackFromPlaylist(
    playlistId: string,
    trackId: string
  ): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(
      `/playlists/${playlistId}/tracks/${trackId}`
    );
    return response.data;
  }
};

// Сервис для работы с избранным
export const FavoritesService = {
  // Получить избранные треки
  async getFavorites(): Promise<Track[]> {
    const response = await api.get<Track[]>('/favorites');
    return response.data;
  },

  // Добавить трек в избранное
  async addToFavorites(trackId: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(`/favorites/${trackId}`);
    return response.data;
  },

  // Удалить трек из избранного
  async removeFromFavorites(trackId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/favorites/${trackId}`);
    return response.data;
  }
};

// Сервис для работы с настройками визуализации (волной)
export const WaveSettingsService = {
  // Получить настройки волны
  async getWaveSettings(): Promise<Record<string, any>> {
    const response = await api.get<Record<string, any>>('/wave-settings');
    return response.data;
  },

  // Обновить настройки волны
  async updateWaveSettings(settings: Record<string, any>): Promise<{ success: boolean }> {
    const response = await api.put<{ success: boolean }>('/wave-settings', settings);
    return response.data;
  }
}; 