// Deals Controller
import { Request, Response } from 'express';
import { DealQuerySchema, CreateDealSchema } from '../schemas/validation.schemas';
import * as DealsService from './deals.service';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
} from '../utils/response.helper';
import { logger } from '../utils/logger';

export const getDeals = async (req: Request, res: Response): Promise<void> => {
  const parsed = DealQuerySchema.safeParse(req.query);
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
    const result = await DealsService.getDeals(parsed.data, req.user.id, req.user.organizationId);
    sendSuccess(res, result, 'Deals retrieved');
  } catch (error) {
    logger.error('GetDeals error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to fetch deals');
  }
};

export const getDealById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.organizationId) {
    sendUnauthorized(res);
    return;
  }

  try {
    const deal = await DealsService.getDealById(req.params.id, req.user.organizationId);
    if (!deal) {
      sendNotFound(res, 'Deal not found');
      return;
    }
    sendSuccess(res, deal, 'Deal retrieved');
  } catch (error) {
    logger.error('GetDealById error:', error);
    sendError(res, 'Failed to fetch deal');
  }
};

export const createDeal = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateDealSchema.safeParse(req.body);
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
    const deal = await DealsService.createDeal(parsed.data, req.user.id, req.user.organizationId);
    sendCreated(res, deal, 'Deal created');
  } catch (error) {
    logger.error('CreateDeal error:', error);
    sendError(res, error instanceof Error ? error.message : 'Failed to create deal');
  }
};
