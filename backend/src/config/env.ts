import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });
dotenv.config();

export const config = {
  PORT: Number(process.env.PORT || 5000),
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-university-key',
  TOKEN_EXPIRES_IN: process.env.TOKEN_EXPIRES_IN || '7d',
  DATABASE_PATH:
    process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'university-club.db'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  REMINDER_DAYS: Number(process.env.REMINDER_DAYS || 3),
};

export default config;