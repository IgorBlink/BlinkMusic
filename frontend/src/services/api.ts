import axios from 'axios';
import { Track, Album, Lyrics, Annotation, Playlist } from '../types/music';
import { getAccessToken, setAccessToken, clearAuthData } from '../utils/auth';

// Базовый URL API - используем window.env для получения переменных окружения в браузере
// или устанавливаем значение по умолчанию
const API_URL = 'http://150.241.95.14/api';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 (Unauthorized) и запрос не на обновление токена
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const response = await axios.post(`${API_URL}/auth/refresh`);
        const { accessToken } = response.data;
        
        // Сохраняем новый токен
        setAccessToken(accessToken);
        
        // Обновляем заголовок и повторяем запрос
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить токен, перенаправляем на страницу входа
        clearAuthData();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API для работы с треками
export const tracksApi = {
  // Получение списка всех треков с пагинацией
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get<{ tracks: Track[], total: number }>(`/tracks?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // Получение трека по ID
  getById: async (id: string) => {
    const response = await api.get<Track>(`/tracks/${id}`);
    return response.data;
  },
  
  // Получение потокового URL для воспроизведения
  getStreamUrl: (id: string) => `${API_URL}/tracks/${id}/stream`,
  
  // Поиск треков
  search: async (query: string, page = 1, limit = 20) => {
    const response = await api.get<{ tracks: Track[], total: number }>(`/tracks/search?q=${query}&page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // Получение рекомендованных треков
  getRecommended: async (limit = 10) => {
    const response = await api.get<{ success: boolean, count: number, data: Track[] }>(`/tracks/recommended?limit=${limit}`);
    return response.data.data;
  },
  
  // Получение трендовых треков
  getTrending: async (limit = 10) => {
    const response = await api.get<Track[]>(`/tracks/trending?limit=${limit}`);
    return response.data;
  },
  
  // Получение текста песни
  getLyrics: async (id: string) => {
    const response = await api.get<Lyrics>(`/tracks/${id}/lyrics`);
    return response.data;
  },
  
  // Получение аннотации для строки текста
  getAnnotation: async (trackId: string, lineId: string) => {
    const response = await api.get<Annotation>(`/tracks/${trackId}/lyrics/line/${lineId}/annotation`);
    return response.data;
  },
  
  // Создание аннотации для строки текста (требуется авторизация)
  createAnnotation: async (trackId: string, lineId: string, content: string) => {
    const response = await api.post<Annotation>(`/tracks/${trackId}/lyrics/line/${lineId}/annotation`, { content });
    return response.data;
  }
};

// API для работы с альбомами
export const albumsApi = {
  // Получение списка альбомов с пагинацией
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get<{ albums: Album[], total: number }>(`/albums?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // Получение альбома по ID
  getById: async (id: string) => {
    const response = await api.get<Album>(`/albums/${id}`);
    return response.data;
  },
  
  // Получение треков альбома
  getTracks: async (id: string) => {
    const response = await api.get<Track[]>(`/albums/${id}/tracks`);
    return response.data;
  },
  
  // Поиск альбомов
  search: async (query: string, page = 1, limit = 20) => {
    const response = await api.get<{ albums: Album[], total: number }>(`/albums/search?q=${query}&page=${page}&limit=${limit}`);
    return response.data;
  }
};

// API для работы с плейлистами
export const playlistsApi = {
  // Получение всех публичных плейлистов
  getPublic: async (page = 1, limit = 20) => {
    const response = await api.get<{ playlists: Playlist[], total: number }>(`/playlists?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // Получение плейлиста по ID
  getById: async (id: string) => {
    const response = await api.get<Playlist>(`/playlists/${id}`);
    return response.data;
  },
  
  // Получение треков плейлиста
  getTracks: async (id: string) => {
    const response = await api.get<Track[]>(`/playlists/${id}/tracks`);
    return response.data;
  },
  
  // Создание нового плейлиста
  create: async (playlist: Omit<Playlist, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Playlist>('/playlists', playlist);
    return response.data;
  },
  
  // Обновление плейлиста
  update: async (id: string, playlist: Partial<Playlist>) => {
    const response = await api.put<Playlist>(`/playlists/${id}`, playlist);
    return response.data;
  },
  
  // Удаление плейлиста
  delete: async (id: string) => {
    await api.delete(`/playlists/${id}`);
  },
  
  // Добавление трека в плейлист
  addTrack: async (playlistId: string, trackId: string) => {
    const response = await api.post<{ success: boolean }>(`/playlists/${playlistId}/tracks`, { trackId });
    return response.data;
  },
  
  // Удаление трека из плейлиста
  removeTrack: async (playlistId: string, trackId: string) => {
    await api.delete(`/playlists/${playlistId}/tracks/${trackId}`);
  }
};

// API для работы с избранным
export const favoritesApi = {
  // Получение избранных треков
  getTracks: async () => {
    const response = await api.get<Track[]>('/favorites');
    return response.data;
  },
  
  // Добавление трека в избранное
  addTrack: async (trackId: string) => {
    const response = await api.post<{ success: boolean }>(`/favorites/${trackId}`);
    return response.data;
  },
  
  // Удаление трека из избранного
  removeTrack: async (trackId: string) => {
    await api.delete(`/favorites/${trackId}`);
  },
  
  // Проверка, находится ли трек в избранном
  isTrackFavorite: async (trackId: string) => {
    try {
      const response = await api.get<{ isFavorite: boolean }>(`/favorites/check/${trackId}`);
      return response.data.isFavorite;
    } catch (error) {
      return false;
    }
  }
};

export default api; 