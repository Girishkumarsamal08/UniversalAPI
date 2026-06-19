// Error Handling Middleware — Global error handler

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response.helper';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Global error handler (must have 4 params for Express to recognize it)
export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    statusCode,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  sendError(res, message, statusCode);
};

// Handle 404 — Must be placed before errorMiddleware
export const notFoundMiddleware = (req: Request, res: Response): void => {
  sendError(
    res,
    `Route ${req.method} ${req.url} not found`,
    404
  );
};

// Factory for operational errors
export const createAppError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
