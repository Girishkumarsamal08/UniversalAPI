// Request Logs Router
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../database/prisma.client';
import { memoryLogs } from '../middleware/logging.middleware';
import { sendSuccess } from '../utils/response.helper';

const router = Router();

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Retrieve recent API activity logs
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of API activity logs
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '50', 10);
  const search = req.query.search as string || '';

  try {
    // Query PostgreSQL if available
    const dbLogs = await prisma.apiLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      where: search ? {
        OR: [
          { endpoint: { contains: search, mode: 'insensitive' } },
          { method: { contains: search, mode: 'insensitive' } },
          { errorMessage: { contains: search, mode: 'insensitive' } },
        ]
      } : undefined
    });

    const formattedLogs = dbLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      responseTime: log.responseTime,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      errorMessage: log.errorMessage,
      timestamp: log.timestamp.toISOString(),
    }));

    sendSuccess(res, formattedLogs, 'Logs retrieved from database');
  } catch (err) {
    // Database connection down: fallback to in-memory logs
    let filteredLogs = [...memoryLogs];
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.endpoint.toLowerCase().includes(lowerSearch) ||
        log.method.toLowerCase().includes(lowerSearch) ||
        (log.errorMessage && log.errorMessage.toLowerCase().includes(lowerSearch))
      );
    }

    const logsSlice = filteredLogs.slice(0, limit);
    sendSuccess(res, logsSlice, 'Logs retrieved from memory (dev mock mode)');
  }
});

export default router;
