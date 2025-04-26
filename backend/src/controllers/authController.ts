import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

const authService = new AuthService();

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Валидация данных пользователя
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Все обязательные поля должны быть заполнены' });
      return;
    }

    const { user, tokens } = await authService.register({
      username,
      email,
      password,
    });

    // Устанавливаем refresh токен в httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    
    if (error.message.includes('уже используется') || error.message.includes('уже занято')) {
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
    }
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({ message: 'Логин и пароль обязательны' });
      return;
    }

    const { user, tokens } = await authService.login(emailOrUsername, password);

    // Устанавливаем refresh токен в httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.json({
      message: 'Успешная авторизация',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    
    if (error.message === 'Пользователь не найден' || error.message === 'Неверный пароль') {
      res.status(401).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Ошибка при авторизации' });
    }
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Получаем refresh токен из cookie или заголовка
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token отсутствует' });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    // Обновляем refresh токен в cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.json({
      message: 'Токены успешно обновлены',
      accessToken: tokens.accessToken,
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ message: error.message || 'Ошибка при обновлении токенов' });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Получаем refresh токен из cookie или запроса
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Очищаем cookie
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Выход выполнен успешно' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Ошибка при выходе из системы' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatar: req.user.avatar,
        isAdmin: req.user.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'Ошибка при получении данных пользователя' });
  }
}; 