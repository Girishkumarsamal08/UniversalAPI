// Deals Router
import { Router } from 'express';
import { getDeals, getDealById, createDeal } from './deals.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { readLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All deal routes require authentication
router.use(authMiddleware);

router.get('/', readLimiter, getDeals);
router.get('/:id', readLimiter, getDealById);
router.post('/', createDeal);

export default router;
