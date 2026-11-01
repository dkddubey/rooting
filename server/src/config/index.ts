import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  jwtSecret: process.env.JWT_SECRET || 'rootsconnect_default_secret_jwt_key_2026',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  matchThreshold: process.env.MATCH_THRESHOLD ? parseFloat(process.env.MATCH_THRESHOLD) : 0.85,
  isDev: process.env.NODE_ENV !== 'production'
};

export const prisma = new PrismaClient();

