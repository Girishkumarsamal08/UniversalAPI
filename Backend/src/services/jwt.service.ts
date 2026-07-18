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

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  CTO: ['view_dashboard', 'manage_integrations', 'delete_integrations', 'view_billing', 'manage_users', 'view_security', 'view_audit_logs', 'view_analytics', 'use_playground', 'approve_requests', 'view_regional_perf', 'manage_teams', 'view_deployments', 'view_sprints', 'view_projects', 'view_logs', 'view_docs', 'view_testing', 'view_support'],
  Admin: ['view_dashboard', 'manage_integrations', 'view_billing', 'manage_users', 'view_security', 'view_audit_logs', 'view_analytics', 'use_playground', 'approve_requests', 'manage_teams', 'view_projects', 'view_logs', 'view_docs'],
  'Regional Head': ['view_dashboard', 'view_regional_perf', 'manage_users', 'view_analytics', 'view_logs', 'view_docs'],
  'Engineering Manager': ['view_dashboard', 'manage_teams', 'view_deployments', 'view_analytics', 'use_playground', 'view_projects', 'view_logs', 'view_docs'],
  'Team Lead': ['view_dashboard', 'view_sprints', 'view_deployments', 'use_playground', 'view_projects', 'view_logs', 'view_docs'],
  'Senior Developer': ['view_dashboard', 'use_playground', 'view_projects', 'view_logs', 'view_docs'],
  Developer: ['view_dashboard', 'use_playground', 'view_projects', 'view_logs', 'view_docs'],
  'QA Engineer': ['view_dashboard', 'view_testing', 'use_playground', 'view_docs'],
  'Support Engineer': ['view_dashboard', 'view_support', 'use_playground', 'view_docs'],
  Intern: ['view_dashboard', 'view_docs']
};

export const generateAccessToken = (payload: UserPayload): string => {
  const role = payload.role || 'Developer';
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Developer;
  
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    organizationId: payload.organizationId,
    role,
    department: payload.department || 'Engineering',
    status: payload.status || 'APPROVED',
    permissions,
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
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
    include: {
      user: {
        include: {
          memberships: { take: 1 }
        }
      }
    },
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
    organizationId: tokenRecord.user.memberships[0]?.organizationId,
    role: tokenRecord.user.role,
    department: tokenRecord.user.department,
    status: tokenRecord.user.status,
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
