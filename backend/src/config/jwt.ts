import { Secret } from 'jsonwebtoken';

interface JWTConfig {
  secret: string;
  accessExpiration: string;
  refreshExpiration: string;
}

const jwtConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || 'your_default_jwt_secret',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
};

export default jwtConfig; 