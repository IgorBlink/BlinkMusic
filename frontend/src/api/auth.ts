import api, { authApi } from './axios';

// Типы для данных авторизации
export interface AuthResponse {
  user: User;
  accessToken: string;
  message: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

// Сервис для работы с авторизацией
const AuthService = {
  // Регистрация нового пользователя
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/auth/register', payload);
    
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Авторизация пользователя
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await authApi.post<AuthResponse>('/auth/login', payload);
    
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Выход из системы
  async logout(): Promise<{ message: string }> {
    const response = await authApi.post<{ message: string }>('/auth/logout');
    
    // Удаляем данные из localStorage при выходе
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    
    return response.data;
  },

  // Получение данных текущего пользователя
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  // Обновление токена доступа
  async refreshToken(): Promise<{ accessToken: string; message: string }> {
    const response = await authApi.post<{ accessToken: string; message: string }>('/auth/refresh');
    
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    return response.data;
  },

  // Проверка авторизации пользователя
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  },

  // Получение данных пользователя из localStorage
  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default AuthService; 