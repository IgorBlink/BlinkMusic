import axios from 'axios';

// Базовый URL API
export const API_URL = 'http://localhost:5000/api';

// Основной экземпляр axios для обычных запросов
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Для автоматической отправки куки (важно для refreshToken)
});

// Экземпляр для авторизации и обновления токенов
export const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Перехватчик запросов - добавляет токен авторизации ко всем запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ответов - обрабатывает ошибки авторизации и обновляет токен
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 (Unauthorized) и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Пытаемся обновить токен
        const response = await authApi.post('/auth/refresh');
        const { accessToken } = response.data;

        // Сохраняем новый токен
        localStorage.setItem('accessToken', accessToken);

        // Обновляем заголовок для текущего запроса
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Повторяем исходный запрос с обновленным токеном
        return api(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить токен, выход из системы
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Перенаправление на страницу входа
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 