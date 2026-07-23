// Deals Service — business logic for normalized CRM Deals
import prisma from '../database/prisma.client';
import { getProviderAdapter } from '../providers/provider.registry';
import { CreateDealInput, DealQueryInput } from '../schemas/validation.schemas';
import { Deal, PaginatedResponse } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export const getDeals = async (
  query: DealQueryInput,
  userId: string,
  organizationId: string
): Promise<PaginatedResponse<Deal>> => {
  const { page, limit, provider, search } = query;

  // Check if mock mode is triggered
  const useMock = provider === 'mock' || organizationId === 'dev-mock-org-001';
  if (useMock) {
    const adapter = await getProviderAdapter('mock', userId);
    const deals = await adapter.getDeals({ page, limit, search });
    return {
      data: deals,
      pagination: {
        page,
        limit,
        total: deals.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  const skip = (page - 1) * limit;
  const where = {
    organizationId,
    ...(provider ? { provider } : {}),
    ...(search
      ? {
          title: { contains: search, mode: 'insensitive' as const },
        }
      : {}),
  };

  const [total, deals] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data: Deal[] = deals.map((d: any) => ({
    id: d.id,
    externalId: d.externalId,
    title: d.title,
    amount: d.amount ?? undefined,
    stage: d.stage ?? undefined,
    provider: d.provider,
    organizationId: d.organizationId,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    _raw_passthrough: d.rawData ?? undefined,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const getDealById = async (
  id: string,
  organizationId: string
): Promise<Deal | null> => {
  const d = await prisma.deal.findFirst({
    where: { id, organizationId },
  });

  if (!d) return null;

  return {
    id: d.id,
    externalId: d.externalId,
    title: d.title,
    amount: d.amount ?? undefined,
    stage: d.stage ?? undefined,
    provider: d.provider,
    organizationId: d.organizationId,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    _raw_passthrough: d.rawData ?? undefined,
  };
};

export const createDeal = async (
  input: CreateDealInput,
  userId: string,
  organizationId: string
): Promise<Deal> => {
  const adapter = await getProviderAdapter(input.provider, userId);
  
  // Create deal via CRM adapter
  let createdExternalId = `mock-d-${Date.now()}`;
  let adapterCreated: any = null;
  try {
    // If adapter has a specific createDeal method we can call it.
    // Otherwise fallback to simulated external creation.
    if ('createDeal' in adapter && typeof (adapter as any).createDeal === 'function') {
      adapterCreated = await (adapter as any).createDeal(input);
      createdExternalId = adapterCreated.externalId;
    }
  } catch (err) {
    logger.warn(`Failed to create deal externally via adapter: ${err}`);
  }

  // Save to database
  const saved = await prisma.deal.create({
    data: {
      externalId: createdExternalId,
      provider: input.provider,
      title: input.title,
      amount: input.amount,
      stage: input.stage || 'Pipeline',
      organizationId,
      rawData: adapterCreated?._raw_passthrough || null,
    },
  });

  logger.info(`Deal created: ${saved.id} via ${input.provider}`);

  return {
    id: saved.id,
    externalId: saved.externalId,
    title: saved.title,
    amount: saved.amount ?? undefined,
    stage: saved.stage ?? undefined,
    provider: saved.provider,
    organizationId: saved.organizationId,
    createdAt: saved.createdAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
    _raw_passthrough: saved.rawData ?? undefined,
  };
};
