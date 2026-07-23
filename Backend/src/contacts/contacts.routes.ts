// Contacts Router

import { Router } from 'express';
import { getContacts, getContactById, createContact, deleteContact } from './contacts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { readLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All contact routes require authentication
router.use(authMiddleware);

router.get('/', readLimiter, getContacts);
router.get('/:id', readLimiter, getContactById);
router.post('/', createContact);
router.delete('/:id', deleteContact);

export default router;
