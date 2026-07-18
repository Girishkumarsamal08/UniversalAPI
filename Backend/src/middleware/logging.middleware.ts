// Request logging middleware — logs every API call to DB

import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prisma.client';
import { logger } from '../utils/logger';
import { maskPII } from '../utils/pii.masker';

export interface MemoryApiLog {
  id: string;
  userId: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
  timestamp: string;
}

export const memoryLogs: MemoryApiLog[] = [];

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
    const userAgent = req.get('User-Agent') ?? null;
    const errorMessage = res.statusCode >= 400 ? maskPII(res.statusMessage) : null;

    const logData: MemoryApiLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user?.id ?? null,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      ipAddress,
      userAgent,
      errorMessage,
      timestamp: new Date().toISOString(),
    };

    // Store in-memory
    memoryLogs.unshift(logData);
    if (memoryLogs.length > 100) {
      memoryLogs.pop();
    }

    try {
      await prisma.apiLog.create({
        data: {
          userId: req.user?.id ?? null,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          ipAddress,
          userAgent,
          errorMessage,
        },
      });
    } catch (err) {
      // Never crash the server over logging
      logger.warn('Failed to write API log to DB:', err);
    }
  });

  next();
};
