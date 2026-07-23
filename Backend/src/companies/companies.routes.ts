// Companies Router

import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany, deleteCompany } from './companies.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { readLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', readLimiter, getCompanies);
router.get('/:id', readLimiter, getCompanyById);
router.post('/', createCompany);
router.delete('/:id', deleteCompany);

export default router;
