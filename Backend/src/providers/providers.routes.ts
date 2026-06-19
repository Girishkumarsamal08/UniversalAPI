// Providers Router — list connected providers, OAuth status

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../database/prisma.client';
import { SUPPORTED_PROVIDERS } from '../providers/provider.registry';
import { sendSuccess, sendError } from '../utils/response.helper';

const router = Router();

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Get all supported providers and their connection status
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of providers with connection status
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    let connectedMap: Record<string, boolean> = {};

    // Only query DB if it's available (not the dev mock user)
    if (req.user?.id !== 'dev-mock-user-001') {
      const connections = await prisma.providerConnection.findMany({
        where: { userId: req.user!.id },
        select: { provider: true, isActive: true },
      });
      connections.forEach((c) => { connectedMap[c.provider] = c.isActive; });
    }

    const providers = SUPPORTED_PROVIDERS.map((name) => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      isConnected: name === 'mock' ? true : (connectedMap[name] || false),
      isMock: name === 'mock',
    }));

    sendSuccess(res, providers, 'Providers retrieved');
  } catch (error) {
    sendError(res, 'Failed to fetch providers');
  }
});

export default router;
