// JWT Token Service

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserPayload, TokenPair } from '../schemas/unified.types';
import prisma from '../database/prisma.client';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.error('❌ JWT secrets are not configured in environment variables');
  process.exit(1);
}

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'unified-crm-api',
    audience: 'unified-crm-client',
  } as SignOptions);
};

export const generateRefreshToken = (): string => {
  return uuidv4() + '-' + uuidv4();
};

export const verifyAccessToken = (token: string): UserPayload & JwtPayload => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'unified-crm-api',
    audience: 'unified-crm-client',
  }) as UserPayload & JwtPayload;
};

export const createTokenPair = async (user: UserPayload): Promise<TokenPair> => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Calculate expiry for refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN as string,
  };
};

export const rotateRefreshToken = async (oldToken: string): Promise<TokenPair | null> => {
  // Find and validate old token
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
    return null;
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { isRevoked: true },
  });

  // Generate new pair
  const userPayload: UserPayload = {
    id: tokenRecord.user.id,
    email: tokenRecord.user.email,
    name: tokenRecord.user.name,
  };

  return createTokenPair(userPayload);
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.update({
    where: { token },
    data: { isRevoked: true },
  });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
};
