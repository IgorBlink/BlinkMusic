import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from './logger';

// Собственная версия опций, которая принимает строки для expiresIn
interface CustomSignOptions {
  expiresIn?: string | number;
  audience?: string | string[];
  issuer?: string;
  jwtid?: string;
  subject?: string;
  noTimestamp?: boolean;
  header?: object;
  keyid?: string;
}

/**
 * Utility функции для работы с JWT, чтобы избежать проблем с типизацией
 */
export const JwtUtils = {
  /**
   * Подписывает токен и возвращает JWT строку
   */
  sign(payload: any, secret: string, options?: CustomSignOptions): string {
    try {
      return jwt.sign(payload, secret, options as SignOptions);
    } catch (error) {
      logger.error('Ошибка создания JWT токена:', error);
      throw error;
    }
  },

  /**
   * Верифицирует токен и возвращает декодированные данные
   */
  verify(token: string, secret: string): any {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      logger.error('Ошибка верификации JWT токена:', error);
      throw error;
    }
  },
}; 