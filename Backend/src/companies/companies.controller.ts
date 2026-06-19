// Companies Controller

import { Request, Response } from 'express';
import { CompanyQuerySchema, CreateCompanySchema } from '../schemas/validation.schemas';
import * as CompaniesService from './companies.service';
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
 * /companies:
 *   get:
 *     summary: Get all companies (unified from all providers)
 *     tags: [Companies]
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
 *         description: Paginated list of companies
 */
export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  const parsed = CompanyQuerySchema.safeParse(req.query);
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
    const result = await CompaniesService.getCompanies(parsed.data, req.user.id, req.user.organizationId);
    sendSuccess(res, result, 'Companies retrieved');
  } catch (error) {
    logger.error('GetCompanies error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to fetch companies');
  }
};

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get a company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Company found
 *       404:
 *         description: Company not found
 */
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.organizationId) {
    sendUnauthorized(res);
    return;
  }

  try {
    const company = await CompaniesService.getCompanyById(req.params.id, req.user.organizationId);
    if (!company) {
      sendNotFound(res, 'Company not found');
      return;
    }
    sendSuccess(res, company, 'Company retrieved');
  } catch (error) {
    logger.error('GetCompanyById error:', error);
    sendError(res, 'Failed to fetch company');
  }
};

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
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
 *               website: { type: string }
 *               industry: { type: string }
 *               size: { type: string }
 *               provider:
 *                 type: string
 *                 enum: [hubspot, salesforce, pipedrive, mock]
 *                 default: mock
 *     responses:
 *       201:
 *         description: Company created
 */
export const createCompany = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateCompanySchema.safeParse(req.body);
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
    const company = await CompaniesService.createCompany(parsed.data, req.user.id, req.user.organizationId);
    sendCreated(res, company, 'Company created');
  } catch (error) {
    logger.error('CreateCompany error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create company');
  }
};
