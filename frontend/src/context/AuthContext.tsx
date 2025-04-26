import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/authApi';
import { isAuthenticated, getUserData, clearAuthData } from '../utils/auth';

// Определяем тип пользователя
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
}

// Определяем типы для данных авторизации и регистрации
export interface LoginData {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Определяем контекст авторизации
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  // Проверка авторизации при загрузке приложения
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        if (isAuthenticated()) {
          // Пытаемся получить данные пользователя из локального хранилища
          const userData = getUserData();
          if (userData) {
            setUser(userData);
            setIsAuth(true);
          } else {
            // Если данных нет, пытаемся получить их с сервера
            try {
              const user = await authApi.getCurrentUser();
              setUser(user);
              setIsAuth(true);
            } catch (err) {
              // Если не удалось получить данные с сервера, сбрасываем авторизацию
              clearAuthData();
              setIsAuth(false);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Ошибка инициализации аутентификации:', err);
        setError('Не удалось проверить авторизацию');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Авторизация пользователя
  const login = async (credentials: LoginData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      setIsAuth(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Регистрация пользователя
  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      setIsAuth(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Выход из системы
  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setIsAuth(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка выхода');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: isAuth,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Хук для использования контекста авторизации
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 