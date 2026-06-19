// Companies Service — business logic layer

import prisma from '../database/prisma.client';
import { getProviderAdapter } from '../providers/provider.registry';
import { CreateCompanyInput, CompanyQueryInput } from '../schemas/validation.schemas';
import { Company, PaginatedResponse } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export const getCompanies = async (
  query: CompanyQueryInput,
  userId: string,
  organizationId: string
): Promise<PaginatedResponse<Company>> => {
  const { page, limit, provider, search } = query;
  const skip = (page - 1) * limit;

  // If provider is specified and not 'all', use the adapter (live data)
  if (provider && provider !== 'all') {
    const adapter = await getProviderAdapter(provider, userId);
    const companies = await adapter.getCompanies({ page, limit, search });
    return {
      data: companies,
      pagination: {
        page,
        limit,
        total: companies.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  // Default: query from DB (synced / mock data)
  const where = {
    organizationId,
    ...(provider && provider !== 'all' ? { provider } : {}),
    ...(search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : {}),
  };

  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data: Company[] = companies.map((c) => ({
    id: c.id,
    externalId: c.externalId,
    name: c.name,
    website: c.website ?? undefined,
    industry: c.industry ?? undefined,
    size: c.size ?? undefined,
    provider: c.provider,
    organizationId: c.organizationId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
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

export const getCompanyById = async (
  id: string,
  organizationId: string
): Promise<Company | null> => {
  const company = await prisma.company.findFirst({
    where: { id, organizationId },
  });

  if (!company) return null;

  return {
    id: company.id,
    externalId: company.externalId,
    name: company.name,
    website: company.website ?? undefined,
    industry: company.industry ?? undefined,
    size: company.size ?? undefined,
    provider: company.provider,
    organizationId: company.organizationId,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
};

export const createCompany = async (
  input: CreateCompanyInput,
  userId: string,
  organizationId: string
): Promise<Company> => {
  const adapter = await getProviderAdapter(input.provider, userId);
  const created = await adapter.createCompany(input);

  // Sync to local DB
  const saved = await prisma.company.create({
    data: {
      externalId: created.externalId,
      provider: created.provider,
      name: created.name,
      website: created.website,
      industry: created.industry,
      size: created.size,
      organizationId,
    },
  });

  logger.info(`Company created: ${saved.id} via ${input.provider}`);

  return {
    id: saved.id,
    externalId: saved.externalId,
    name: saved.name,
    website: saved.website ?? undefined,
    industry: saved.industry ?? undefined,
    size: saved.size ?? undefined,
    provider: saved.provider,
    organizationId: saved.organizationId,
    createdAt: saved.createdAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
  };
};
