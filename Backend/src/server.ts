// Server Entry Point

import 'dotenv/config';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './database/prisma.client';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async (): Promise<void> => {
  try {
    // Attempt database connection (non-blocking in mock mode)
    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn('⚠️  Database unavailable — starting in MOCK MODE (no DB required for mock data)');
      logger.warn('   Set DATABASE_URL in .env and restart to enable full functionality.');
    }

    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════╗
║           🔗 Unified CRM API Server               ║
╠═══════════════════════════════════════════════════╣
║  Environment : ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║  Port        : ${String(PORT).padEnd(33)}║
║  API Base    : http://localhost:${PORT}/api/v1       ║
║  Swagger     : http://localhost:${PORT}/api/docs     ║
║  Health      : http://localhost:${PORT}/health       ║
╚═══════════════════════════════════════════════════╝
      `);
    });

    // ─────────────────────────────────────────────
    // Graceful Shutdown
    // ─────────────────────────────────────────────
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        logger.info('Database disconnected. Goodbye! 👋');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
