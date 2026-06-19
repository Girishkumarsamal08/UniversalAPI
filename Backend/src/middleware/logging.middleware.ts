// Request logging middleware — logs every API call to DB

import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prisma.client';
import { logger } from '../utils/logger';

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;

    try {
      await prisma.apiLog.create({
        data: {
          userId: req.user?.id ?? null,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          ipAddress: req.ip ?? req.socket.remoteAddress,
          userAgent: req.get('User-Agent'),
          errorMessage: res.statusCode >= 400 ? res.statusMessage : null,
        },
      });
    } catch (err) {
      // Never crash the server over logging
      logger.warn('Failed to write API log to DB:', err);
    }
  });

  next();
};
