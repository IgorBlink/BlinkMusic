import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import jwtConfig from '../config/jwt';
import { logger } from '../utils/logger';
import { JwtUtils } from '../utils/jwt';

// Расширяем интерфейс Express.Request, чтобы включить авторизованного пользователя
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Требуется авторизация' });
      return;
    }

    try {
      // Верифицируем JWT токен с помощью утилиты
      const decoded = JwtUtils.verify(token, jwtConfig.secret) as { id: string };
      
      // Находим пользователя по ID из токена
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        res.status(401).json({ message: 'Пользователь не найден' });
        return;
      }
      
      // Добавляем пользователя в объект запроса
      req.user = user;
      next();
    } catch (error) {
      logger.error('JWT verification error:', error);
      res.status(401).json({ message: 'Недействительный токен' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Middleware для проверки роли администратора
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      message: 'Доступ запрещен. Требуются права администратора',
    });
  }
};

// Middleware для проверки владельца ресурса
export const isOwnerOrAdmin = (resourceField: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resourceId = req.params.id;
    const userId = req.user?._id.toString();
    const resourceUserId = req.body[resourceField]?.toString() || '';

    if (
      (req.user && req.user.isAdmin) ||
      userId === resourceId ||
      userId === resourceUserId
    ) {
      next();
    } else {
      res.status(403).json({
        message: 'Доступ запрещен. Вы не являетесь владельцем ресурса',
      });
    }
  };
}; 