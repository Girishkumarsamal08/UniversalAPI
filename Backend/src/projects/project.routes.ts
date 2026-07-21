import { Router, Request, Response } from 'express';
import prisma from '../database/prisma.client';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendForbidden } from '../utils/response.helper';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

/**
 * List projects assigned to the user (or all projects if CTO/Admin)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      sendForbidden(res, 'No organization associated with user');
      return;
    }

    const isDeveloper = req.user?.role === 'Employee' || req.user?.role === 'Senior Developer' || req.user?.role === 'Intern';

    let projects;
    if (isDeveloper) {
      // Developers only see projects they are assigned to
      const assignments = await prisma.projectAssignment.findMany({
        where: { userId: req.user?.id! },
        include: {
          project: true,
        },
      });
      projects = assignments.map(a => a.project);
    } else {
      // Managers, Regional Heads, CTOs, and Admins see all projects in the organization
      projects = await prisma.project.findMany({
        where: { organizationId: orgId },
      });
    }

    sendSuccess(res, projects, 'Projects retrieved');
  } catch (err: any) {
    logger.error('Failed to get projects:', err);
    sendBadRequest(res, 'Failed to fetch projects');
  }
});

/**
 * Create a new project inside the workspace
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const orgId = req.user?.organizationId;

    if (!orgId) {
      sendForbidden(res, 'No organization associated with user');
      return;
    }

    if (!name || name.trim().length === 0) {
      sendBadRequest(res, 'Project name is required');
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        organizationId: orgId,
      },
    });

    // Auto-assign the creator
    await prisma.projectAssignment.create({
      data: {
        projectId: project.id,
        userId: req.user?.id!,
      },
    });

    sendSuccess(res, project, 'Project created successfully');
  } catch (err: any) {
    logger.error('Failed to create project:', err);
    sendBadRequest(res, 'Failed to create project');
  }
});

export default router;
