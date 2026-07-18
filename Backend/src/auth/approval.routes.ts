import { Router, Request, Response } from 'express';
import prisma from '../database/prisma.client';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendForbidden } from '../utils/response.helper';
import { logger } from '../utils/logger';

const router = Router();

// Require admin/manager roles for all approvals endpoints
router.use(authMiddleware);

/**
 * List pending approvals for the organization
 */
router.get('/', requirePermission('approve_requests'), async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      sendForbidden(res, 'No organization associated with user');
      return;
    }

    const pendingRequests = await prisma.approvalRequest.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDING',
      },
    });

    // Populate user emails/details if any
    const enriched = await Promise.all(
      pendingRequests.map(async (reqItem) => {
        const requester = await prisma.user.findUnique({
          where: { id: reqItem.userId },
          select: { name: true, email: true, role: true, department: true },
        });
        return {
          ...reqItem,
          requester,
        };
      })
    );

    sendSuccess(res, enriched, 'Pending requests fetched');
  } catch (err: any) {
    logger.error('Failed to get approvals:', err);
    sendBadRequest(res, 'Failed to fetch pending approvals');
  }
});

/**
 * Resolve a pending approval request (Approve or Reject)
 */
router.post('/:id/resolve', requirePermission('approve_requests'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body; // 'APPROVED' | 'REJECTED'

    if (resolution !== 'APPROVED' && resolution !== 'REJECTED') {
      sendBadRequest(res, 'Invalid resolution status. Must be APPROVED or REJECTED');
      return;
    }

    const requestItem = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!requestItem || requestItem.status !== 'PENDING') {
      sendBadRequest(res, 'Request not found or already resolved');
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.approvalRequest.update({
        where: { id },
        data: {
          status: resolution,
          resolvedAt: new Date(),
          resolvedById: req.user?.id,
        },
      });

      if (resolution === 'APPROVED') {
        if (requestItem.action === 'APPROVE_USER') {
          // Activate user
          await tx.user.update({
            where: { id: requestItem.targetId! },
            data: { status: 'APPROVED' },
          });
        } else if (requestItem.action === 'ADD_INTEGRATION') {
          // Perform integration activation
          await tx.integration.upsert({
            where: { userId_provider: { userId: requestItem.userId, provider: requestItem.targetId! } },
            create: {
              userId: requestItem.userId,
              provider: requestItem.targetId!,
              status: 'Connected',
              accessToken: `mock-access-token-${requestItem.targetId}-${Date.now()}`,
            },
            update: {
              status: 'Connected',
              accessToken: `mock-access-token-${requestItem.targetId}-${Date.now()}`,
            },
          });
        } else if (requestItem.action === 'DELETE_API') {
          // Perform revoke
          await tx.integration.deleteMany({
            where: { userId: requestItem.userId, provider: requestItem.targetId! },
          });
        }
      } else {
        // If rejected and action was APPROVE_USER, set status to REJECTED or delete membership
        if (requestItem.action === 'APPROVE_USER') {
          await tx.user.update({
            where: { id: requestItem.targetId! },
            data: { status: 'REJECTED' },
          });
        }
      }
    });

    sendSuccess(res, null, `Request resolved successfully as ${resolution}`);
  } catch (err: any) {
    logger.error('Failed to resolve request:', err);
    sendBadRequest(res, 'Failed to resolve approval request');
  }
});

export default router;
