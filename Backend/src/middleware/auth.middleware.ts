// Auth Middleware — validates JWT Bearer token

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service';
import { sendUnauthorized } from '../utils/response.helper';
import { UserPayload } from '../schemas/unified.types';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Missing or invalid Authorization header');
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      organizationId: payload.organizationId,
    };
    next();
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        sendUnauthorized(res, 'Access token expired');
        return;
      }
      if (err.name === 'JsonWebTokenError') {
        sendUnauthorized(res, 'Invalid access token');
        return;
      }
    }
    sendUnauthorized(res, 'Authentication failed');
  }
};

// Optional auth — doesn't reject if no token
export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
      };
    } catch {
      // Silently ignore invalid tokens in optional mode
    }
  }
  next();
};
