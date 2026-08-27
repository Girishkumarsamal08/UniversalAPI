// Auth Controller — HTTP layer for auth routes

import { Request, Response } from 'express';
import { RegisterSchema, LoginSchema, RefreshTokenSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../schemas/validation.schemas';
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
    const detailedMessage = errors.length > 0 ? errors.join(' | ') : 'Validation failed';
    sendBadRequest(res, detailedMessage, errors);
    return;
  }

  try {
    const { user, tokens } = await AuthService.registerUser(parsed.data);
    sendCreated(res, { user, tokens }, 'Registration successful');
  } catch (error: unknown) {
    const isDbDown =
      error instanceof Error &&
      (error.message.includes("Can't reach database") ||
       error.message.includes('ECONNREFUSED') ||
       error.message.includes('P1001') ||
       error.message.includes('P2021') ||
       error.message.includes('does not exist') ||
       (error as any).code === 'P1001' ||
       (error as any).code === 'P2021');

    if (isDbDown && process.env.NODE_ENV === 'development') {
      const { name, email } = parsed.data;
      const { generateAccessToken, generateRefreshToken } = await import('../services/jwt.service');
      const demoUser = {
        id: `dev-mock-user-${Date.now()}`,
        email,
        name: name || email.split('@')[0] || 'Mock User',
        organizationId: 'dev-mock-org-001',
      };
      const accessToken  = generateAccessToken(demoUser);
      const refreshToken = generateRefreshToken();
      logger.warn('DEV MODE: Mock register used — set up PostgreSQL for full auth.');
      sendCreated(res, {
        user: demoUser,
        tokens: { accessToken, refreshToken, expiresIn: '15m' },
      }, 'Registration successful (dev mock mode)');
      return;
    }

    if (error instanceof Error) {
      if (error.message === 'EMAIL_EXISTS') {
        sendBadRequest(res, 'Email already registered');
        return;
      }
      if (error.message === 'BUSINESS_EMAIL_ONLY') {
        sendBadRequest(res, 'A valid business email domain is required.');
        return;
      }
      if (error.message === 'ADMIN_REQUIRED_FOR_NEW_WORKSPACE') {
        sendBadRequest(res, 'Only a CTO or Admin can register a new company workspace.');
        return;
      }
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
const DEMO_PASSWORD = 'UnifiedCRM2026!Secured';

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
       error.message.includes('P1001') ||
       error.message.includes('P2021') ||
       error.message.includes('does not exist') ||
       (error as any).code === 'P1001' ||
       (error as any).code === 'P2021');

    if (isDbDown && process.env.NODE_ENV === 'development') {
      const { email, password } = parsed.data;
      const normEmail = email.trim().toLowerCase();
      const demoPasswords = ['Mickey@123', 'UnifiedCRM2026!Secured', 'Password123', 'admin123'];
      const demoEmails = ['biswajitasamal8342@gmail.com', 'admin@unifiedcrm.io', 'cto@unifiedcrm.io'];

      if (demoEmails.includes(normEmail) && demoPasswords.includes(password)) {
        const { generateAccessToken, generateRefreshToken } = await import('../services/jwt.service');
        const demoUser = {
          id: 'dev-mock-user-001',
          email: normEmail,
          name: normEmail === 'biswajitasamal8342@gmail.com' || normEmail === 'cto@unifiedcrm.io' ? 'Girish Kumar Samal' : 'Admin User',
          organizationId: 'dev-mock-org-001',
          role: normEmail === 'biswajitasamal8342@gmail.com' || normEmail === 'cto@unifiedcrm.io' ? 'CTO' : 'Admin',
          department: 'Engineering',
          status: 'APPROVED',
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
      sendUnauthorized(res, 'Invalid credentials. Use biswajitasamal8342@gmail.com / Mickey@123 or admin@unifiedcrm.io / UnifiedCRM2026!Secured');
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

// Memory Map for reset codes (email -> { code, expires })
const resetCodes = new Map<string, { code: string; expires: Date }>();

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendBadRequest(res, 'Validation failed', errors);
    return;
  }

  const { email } = parsed.data;
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    resetCodes.set(email.toLowerCase(), { code, expires });
    logger.info(`[PASSWORD RESET] Generated verification code for ${email}: ${code}`);

    sendSuccess(res, { devCode: code }, 'Password reset code generated.');
  } catch (error) {
    logger.error('ForgotPassword error:', error);
    sendError(res, 'Failed to process forgot password request');
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendBadRequest(res, 'Validation failed', errors);
    return;
  }

  const { email, code, newPassword } = parsed.data;
  const entry = resetCodes.get(email.toLowerCase());

  if (!entry) {
    sendBadRequest(res, 'No reset code has been requested for this email.');
    return;
  }

  if (entry.code !== code) {
    sendBadRequest(res, 'Invalid verification code.');
    return;
  }

  if (entry.expires < new Date()) {
    sendBadRequest(res, 'Verification code has expired. Please request a new one.');
    return;
  }

  try {
    await AuthService.updatePasswordByEmail(email, newPassword);
    resetCodes.delete(email.toLowerCase());
    sendSuccess(res, null, 'Password reset successful. You can now log in.');
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      sendBadRequest(res, 'No account found with this email address.');
      return;
    }
    logger.error('ResetPassword error:', error);
    sendError(res, 'Failed to reset password.');
  }
};
