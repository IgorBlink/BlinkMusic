import { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import jwtConfig from '../config/jwt';
import { logger } from '../utils/logger';
import { JwtUtils } from '../utils/jwt';

interface UserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  id: string;
  username: string;
  isAdmin: boolean;
}

// Интерфейс для объекта пользователя без пароля
interface UserWithoutPassword {
  _id: Types.ObjectId;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  refreshToken?: string;
}

export class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async register(userData: UserData): Promise<{ user: UserWithoutPassword; tokens: TokenPair }> {
    try {
      // Проверяем, существует ли пользователь с таким email или username
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }],
      });

      if (existingUser) {
        throw new Error(
          existingUser.email === userData.email
            ? 'Email уже используется'
            : 'Имя пользователя уже занято'
        );
      }

      // Создаем нового пользователя
      const user = new User(userData);
      await user.save();

      // Генерируем токены
      const tokens = await this.generateTokens(user);

      // Не возвращаем пароль в ответе
      const userResponse = user.toObject();
      // Безопасно удаляем пароль из объекта
      const { password: _, ...userWithoutPassword } = userResponse;

      return { user: userWithoutPassword as unknown as UserWithoutPassword, tokens };
    } catch (error) {
      logger.error('Error in register service:', error);
      throw error;
    }
  }

  /**
   * Авторизация пользователя
   */
  async login(
    emailOrUsername: string,
    password: string
  ): Promise<{ user: UserWithoutPassword; tokens: TokenPair }> {
    try {
      // Ищем пользователя по email или username
      const user = await User.findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Проверяем пароль
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Неверный пароль');
      }

      // Генерируем токены
      const tokens = await this.generateTokens(user);

      // Не возвращаем пароль в ответе
      const userResponse = user.toObject();
      // Безопасно удаляем пароль из объекта
      const { password: _, ...userWithoutPassword } = userResponse;

      return { user: userWithoutPassword as unknown as UserWithoutPassword, tokens };
    } catch (error) {
      logger.error('Error in login service:', error);
      throw error;
    }
  }

  /**
   * Выход из системы (отзыв токена)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token отсутствует');
      }

      // Находим и отзываем токен в БД
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    } catch (error) {
      logger.error('Error in logout service:', error);
      throw error;
    }
  }

  /**
   * Обновление токенов
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token отсутствует');
      }

      // Проверяем существование и действительность токена
      const tokenDoc = await RefreshToken.findOne({
        token: refreshToken,
        isRevoked: false,
      });

      if (!tokenDoc) {
        throw new Error('Токен недействителен или отозван');
      }

      // Проверяем срок действия
      if (tokenDoc.expiresAt < new Date()) {
        await RefreshToken.updateOne(
          { _id: tokenDoc._id },
          { isRevoked: true }
        );
        throw new Error('Токен истек');
      }

      // Проверяем и декодируем токен
      let payload: any;
      try {
        payload = JwtUtils.verify(refreshToken, jwtConfig.secret);
      } catch (error) {
        await RefreshToken.updateOne(
          { _id: tokenDoc._id },
          { isRevoked: true }
        );
        throw new Error('Недействительный токен');
      }

      // Находим пользователя
      const user = await User.findById(payload.id);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Отзываем старый токен
      await RefreshToken.updateOne({ _id: tokenDoc._id }, { isRevoked: true });

      // Генерируем новые токены
      return this.generateTokens(user);
    } catch (error) {
      logger.error('Error in refresh tokens service:', error);
      throw error;
    }
  }

  /**
   * Генерация пары токенов (access и refresh)
   */
  private async generateTokens(user: IUser): Promise<TokenPair> {
    try {
      const payload: JwtPayload = {
        id: user._id.toString(),
        username: user.username,
        isAdmin: user.isAdmin,
      };

      // Опции для токенов
      const accessOptions = {
        expiresIn: jwtConfig.accessExpiration,
      };

      const refreshOptions = {
        expiresIn: jwtConfig.refreshExpiration,
      };

      // Генерируем access token используя утилиту
      const accessToken = JwtUtils.sign(
        payload, 
        jwtConfig.secret, 
        accessOptions
      );

      // Генерируем refresh token используя утилиту
      const refreshToken = JwtUtils.sign(
        payload, 
        jwtConfig.secret, 
        refreshOptions
      );

      // Рассчитываем дату истечения refresh токена
      const refreshExpiration = new Date();
      const expirationMs = this.parseDuration(jwtConfig.refreshExpiration);
      refreshExpiration.setMilliseconds(
        refreshExpiration.getMilliseconds() + expirationMs
      );

      // Сохраняем refresh token в БД
      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt: refreshExpiration,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw error;
    }
  }

  /**
   * Парсит строку с длительностью (например, '7d') в миллисекунды
   */
  private parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }
} 