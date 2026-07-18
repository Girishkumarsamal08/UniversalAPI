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
  const { name, email, password, organizationName, department, role } = input;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  // Enforce business email domain
  const FREE_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'zoho.com', 'proton.me', 'icloud.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || FREE_DOMAINS.includes(domain)) {
    throw new Error('BUSINESS_EMAIL_ONLY');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Search if organization exists for this domain
  const existingOrg = await prisma.organization.findFirst({
    where: { domain },
  });

  let userStatus = 'APPROVED';
  if (existingOrg) {
    // Company workspace already exists -> user is pending approval
    userStatus = 'PENDING';
  } else {
    // New company workspace -> only CTO or Admin can create it
    if (role !== 'CTO' && role !== 'Admin') {
      throw new Error('ADMIN_REQUIRED_FOR_NEW_WORKSPACE');
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'Developer',
        department: department || 'Engineering',
        status: userStatus,
      },
    });

    let orgId = '';
    if (existingOrg) {
      orgId = existingOrg.id;
      // Add user as pending member to existing organization
      await tx.orgMember.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          role: role || 'Developer',
        },
      });

      // Log an Approval Request
      await tx.approvalRequest.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          action: 'APPROVE_USER',
          targetId: user.id,
          status: 'PENDING',
        },
      });
    } else {
      const orgName = organizationName || `${name}'s Organization`;
      const org = await tx.organization.create({
        data: {
          name: orgName,
          domain,
          ownerId: user.id,
        },
      });
      orgId = org.id;

      await tx.orgMember.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          role: 'owner', // owner role matches workspace setup
        },
      });
    }

    return { user, orgId };
  });

  logger.info(`New user registered: ${email} (Status: ${userStatus})`);

  const userPayload: UserPayload = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    organizationId: result.orgId,
    role: result.user.role,
    department: result.user.department,
    status: result.user.status,
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
    role: user.role,
    department: user.department,
    status: user.status,
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
    role: user.role,
    department: user.department,
    status: user.status,
  };
};
