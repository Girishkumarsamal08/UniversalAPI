// Contacts Service — business logic layer

import prisma from '../database/prisma.client';
import { getProviderAdapter } from '../providers/provider.registry';
import { CreateContactInput, ContactQueryInput } from '../schemas/validation.schemas';
import { Contact, PaginatedResponse } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export const getContacts = async (
  query: ContactQueryInput,
  userId: string,
  organizationId: string
): Promise<PaginatedResponse<Contact>> => {
  const { page, limit, provider, search } = query;

  // Always use mock adapter if provider=mock OR if org is the dev mock org
  const useMock = provider === 'mock' || !provider || provider === 'all' || organizationId === 'dev-mock-org-001';
  if (useMock) {
    const adapter = await getProviderAdapter('mock', userId);
    const contacts = await adapter.getContacts({ page, limit, search });
    return {
      data: contacts,
      pagination: {
        page,
        limit,
        total: contacts.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  // Use real DB when available
  const where = {
    organizationId,
    ...(provider && provider !== 'all' ? { provider } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, contacts] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data: Contact[] = contacts.map((c) => ({
    id: c.id,
    externalId: c.externalId,
    name: c.name,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    jobTitle: c.jobTitle ?? undefined,
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

export const getContactById = async (
  id: string,
  organizationId: string
): Promise<Contact | null> => {
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId },
  });

  if (!contact) return null;

  return {
    id: contact.id,
    externalId: contact.externalId,
    name: contact.name,
    email: contact.email ?? undefined,
    phone: contact.phone ?? undefined,
    jobTitle: contact.jobTitle ?? undefined,
    provider: contact.provider,
    organizationId: contact.organizationId,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
};

export const createContact = async (
  input: CreateContactInput,
  userId: string,
  organizationId: string
): Promise<Contact> => {
  const adapter = await getProviderAdapter(input.provider, userId);
  const created = await adapter.createContact(input);

  // Sync to local DB
  const saved = await prisma.contact.create({
    data: {
      externalId: created.externalId,
      provider: created.provider,
      name: created.name,
      email: created.email,
      phone: created.phone,
      jobTitle: created.jobTitle,
      organizationId,
    },
  });

  logger.info(`Contact created: ${saved.id} via ${input.provider}`);

  return {
    id: saved.id,
    externalId: saved.externalId,
    name: saved.name,
    email: saved.email ?? undefined,
    phone: saved.phone ?? undefined,
    jobTitle: saved.jobTitle ?? undefined,
    provider: saved.provider,
    organizationId: saved.organizationId,
    createdAt: saved.createdAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
  };
};
