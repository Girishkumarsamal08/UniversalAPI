// Auth Controller — HTTP layer for auth routes

import { Request, Response } from 'express';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../schemas/validation.schemas';
import * as AuthService from '../services/auth.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
} from '../utils/response.helper';
import { logger } from '../utils/logger';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               organizationName:
 *                 type: string
 *                 example: Acme Corp
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendBadRequest(res, 'Validation failed', errors);
    return;
  }

  try {
    const { user, tokens } = await AuthService.registerUser(parsed.data);
    sendCreated(res, { user, tokens }, 'Registration successful');
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      sendBadRequest(res, 'Email already registered');
      return;
    }
    logger.error('Register error:', error);
    sendError(res, 'Registration failed');
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with JWT tokens
 *       401:
 *         description: Invalid credentials
 */
// Demo credentials for no-DB dev mode
const DEMO_EMAIL    = 'admin@unifiedcrm.io';
const DEMO_PASSWORD = 'Password123';

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendBadRequest(res, 'Validation failed', errors);
    return;
  }

  try {
    const { user, tokens } = await AuthService.loginUser(parsed.data);
    sendSuccess(res, { user, tokens }, 'Login successful');
  } catch (error: unknown) {
    // ── DB unavailable? Fall back to mock credentials in dev ──
    const isDbDown =
      error instanceof Error &&
      (error.message.includes("Can't reach database") ||
       error.message.includes('ECONNREFUSED') ||
       error.message.includes('P1001'));

    if (isDbDown && process.env.NODE_ENV === 'development') {
      const { email, password } = parsed.data;
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const { generateAccessToken, generateRefreshToken } = await import('../services/jwt.service');
        const demoUser = {
          id: 'dev-mock-user-001',
          email: DEMO_EMAIL,
          name: 'Admin User',
          organizationId: 'dev-mock-org-001',
        };
        const accessToken  = generateAccessToken(demoUser);
        const refreshToken = generateRefreshToken();
        logger.warn('DEV MODE: Mock login used — set up PostgreSQL for full auth.');
        sendSuccess(res, {
          user: demoUser,
          tokens: { accessToken, refreshToken, expiresIn: '15m' },
        }, 'Login successful (dev mock mode)');
        return;
      }
      sendUnauthorized(res, 'Invalid credentials. Use: admin@unifiedcrm.io / Password123');
      return;
    }

    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }
    logger.error('Login error:', error);
    sendError(res, 'Login failed');
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const parsed = RefreshTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    sendBadRequest(res, 'refreshToken is required');
    return;
  }

  try {
    const tokens = await AuthService.refreshUserTokens(parsed.data.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed');
  } catch (error: unknown) {
    sendUnauthorized(res, 'Invalid or expired refresh token');
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke all tokens
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (userId) {
      await AuthService.logoutUser(userId);
    }
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    sendError(res, 'Logout failed');
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }
    const user = await AuthService.getProfile(userId);
    sendSuccess(res, user, 'Profile retrieved');
  } catch (error) {
    logger.error('GetMe error:', error);
    sendError(res, 'Failed to fetch profile');
  }
};
