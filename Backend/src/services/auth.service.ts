// Auth Service — Register, Login, Logout logic

import bcrypt from 'bcryptjs';
import prisma from '../database/prisma.client';
import { createTokenPair, rotateRefreshToken, revokeAllUserTokens } from './jwt.service';
import { RegisterInput, LoginInput } from '../schemas/validation.schemas';
import { TokenPair, UserPayload } from '../schemas/unified.types';
import { logger } from '../utils/logger';

const BCRYPT_ROUNDS = 12;

export const registerUser = async (
  input: RegisterInput
): Promise<{ user: UserPayload; tokens: TokenPair }> => {
  const { name, email, password, organizationName } = input;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user + org in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const orgName = organizationName || `${name}'s Organization`;
    const org = await tx.organization.create({
      data: {
        name: orgName,
        ownerId: user.id,
      },
    });

    await tx.orgMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'owner',
      },
    });

    return { user, org };
  });

  logger.info(`New user registered: ${email}`);

  const userPayload: UserPayload = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    organizationId: result.org.id,
  };

  const tokens = await createTokenPair(userPayload);
  return { user: userPayload, tokens };
};

export const loginUser = async (
  input: LoginInput
): Promise<{ user: UserPayload; tokens: TokenPair }> => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { role: 'owner' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  logger.info(`User logged in: ${email}`);

  const userPayload: UserPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.memberships[0]?.organizationId,
  };

  const tokens = await createTokenPair(userPayload);
  return { user: userPayload, tokens };
};

export const refreshUserTokens = async (
  refreshToken: string
): Promise<TokenPair> => {
  const tokens = await rotateRefreshToken(refreshToken);
  if (!tokens) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }
  return tokens;
};

export const logoutUser = async (userId: string): Promise<void> => {
  await revokeAllUserTokens(userId);
  logger.info(`User logged out: ${userId}`);
};

export const getProfile = async (userId: string): Promise<UserPayload> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: { take: 1 },
    },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.memberships[0]?.organizationId,
  };
};
