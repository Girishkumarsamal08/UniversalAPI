// Companies Router

import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany } from './companies.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { readLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', readLimiter, getCompanies);
router.get('/:id', readLimiter, getCompanyById);
router.post('/', createCompany);

export default router;
