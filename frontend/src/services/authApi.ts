import api from './api';
import { setAccessToken, clearAuthData, setUserData } from '../utils/auth';

interface AuthResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    isAdmin?: boolean;
  };
  accessToken: string;
}

interface LoginData {
  emailOrUsername: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Регистрация нового пользователя
   */
  register: async (data: RegisterData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      
      // Сохраняем токены и данные пользователя
      setAccessToken(response.data.accessToken);
      setUserData(response.data.user);
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      throw error;
    }
  },
  
  /**
   * Авторизация пользователя
   */
  login: async (data: LoginData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      
      // Сохраняем токены и данные пользователя
      setAccessToken(response.data.accessToken);
      setUserData(response.data.user);
      
      return response.data;
    } catch (error) {
      console.error('Ошибка при входе:', error);
      throw error;
    }
  },
  
  /**
   * Обновление токена
   */
  refreshToken: async () => {
    try {
      const response = await api.post<{ accessToken: string }>('/auth/refresh');
      setAccessToken(response.data.accessToken);
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении токена:', error);
      clearAuthData();
      throw error;
    }
  },
  
  /**
   * Выход из системы
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
      clearAuthData();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      clearAuthData(); // Очищаем данные даже при ошибке
      throw error;
    }
  },
  
  /**
   * Получение данных текущего пользователя
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get<{ user: any }>('/auth/me');
      setUserData(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      throw error;
    }
  }
};

export default authApi; 