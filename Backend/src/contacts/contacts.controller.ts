// Contacts Controller

import { Request, Response } from 'express';
import { ContactQuerySchema, CreateContactSchema } from '../schemas/validation.schemas';
import * as ContactsService from './contacts.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
} from '../utils/response.helper';
import { logger } from '../utils/logger';

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts (unified from all providers)
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: provider
 *         schema: { type: string, enum: [hubspot, salesforce, pipedrive, mock, all] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of contacts
 *       401:
 *         description: Unauthorized
 */
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  const parsed = ContactQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendBadRequest(res, 'Invalid query parameters', errors);
    return;
  }

  if (!req.user?.id || !req.user?.organizationId) {
    sendUnauthorized(res);
    return;
  }

  try {
    const result = await ContactsService.getContacts(parsed.data, req.user.id, req.user.organizationId);
    sendSuccess(res, result, 'Contacts retrieved');
  } catch (error) {
    logger.error('GetContacts error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to fetch contacts');
  }
};

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get a contact by ID
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contact found
 *       404:
 *         description: Contact not found
 */
export const getContactById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.organizationId) {
    sendUnauthorized(res);
    return;
  }

  try {
    const contact = await ContactsService.getContactById(req.params.id, req.user.organizationId);
    if (!contact) {
      sendNotFound(res, 'Contact not found');
      return;
    }
    sendSuccess(res, contact, 'Contact retrieved');
  } catch (error) {
    logger.error('GetContactById error:', error);
    sendError(res, 'Failed to fetch contact');
  }
};

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               jobTitle: { type: string }
 *               provider:
 *                 type: string
 *                 enum: [hubspot, salesforce, pipedrive, mock]
 *                 default: mock
 *     responses:
 *       201:
 *         description: Contact created
 */
export const createContact = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateContactSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    sendBadRequest(res, 'Validation failed', errors);
    return;
  }

  if (!req.user?.id || !req.user?.organizationId) {
    sendUnauthorized(res);
    return;
  }

  try {
    const contact = await ContactsService.createContact(parsed.data, req.user.id, req.user.organizationId);
    sendCreated(res, contact, 'Contact created');
  } catch (error) {
    logger.error('CreateContact error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create contact');
  }
};
