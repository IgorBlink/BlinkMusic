/**
 * Утилиты для работы с авторизацией и токенами
 */

// Ключи для хранения токенов
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

/**
 * Сохранение токена доступа
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Получение токена доступа
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Сохранение токена обновления
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

/**
 * Получение токена обновления
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Сохранение данных пользователя
 */
export const setUserData = (user: any): void => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

/**
 * Получение данных пользователя
 */
export const getUserData = (): any | null => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Очистка всех данных авторизации
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

/**
 * Проверка, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * Проверка, является ли пользователь админом
 */
export const isAdmin = (): boolean => {
  const userData = getUserData();
  return userData ? userData.isAdmin === true : false;
};

/**
 * Получение ID текущего пользователя
 */
export const getCurrentUserId = (): string | null => {
  const userData = getUserData();
  return userData ? userData.id : null;
};

export default {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  setUserData,
  getUserData,
  clearAuthData,
  isAuthenticated,
  isAdmin,
  getCurrentUserId
}; 