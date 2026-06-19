// Zod validation schemas for request bodies

import { z } from 'zod';

// ─────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  organizationName: z.string().min(2).max(100).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─────────────────────────────────────────────
// CONTACT SCHEMAS
// ─────────────────────────────────────────────
export const CreateContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(200).optional(),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock']).default('mock'),
});

export const ContactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'all']).optional(),
  search: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// COMPANY SCHEMAS
// ─────────────────────────────────────────────
export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock']).default('mock'),
});

export const CompanyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'all']).optional(),
  search: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type ContactQueryInput = z.infer<typeof ContactQuerySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type CompanyQueryInput = z.infer<typeof CompanyQuerySchema>;
