// Rate Limit Middleware

import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.helper';
import { Request, Response } from 'express';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, 'Too many requests. Please try again later.', 429);
  },
});

// Strict limiter for auth endpoints (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (_req: Request, res: Response) => {
    sendError(res, 'Too many authentication attempts. Please try again in 15 minutes.', 429);
  },
});

// Lenient limiter for read operations
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, 'Rate limit exceeded. Please slow down.', 429);
  },
});
