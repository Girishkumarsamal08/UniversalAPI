// Zod validation schemas for request bodies

import { z } from 'zod';

// ─────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────
export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(3, 'Password must be at least 3 characters'),
  organizationName: z.string().optional().or(z.literal('')),
  department: z.string().optional().default('Engineering'),
  role: z.enum(['CTO', 'CEO', 'Admin', 'Regional Head', 'Manager', 'Senior Developer', 'Support Engineer', 'Sales Lead', 'Client', 'Employee', 'Intern']).optional().default('Employee'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Reset code must be exactly 6 characters'),
  newPassword: z.string().min(3, 'Password must be at least 3 characters'),
});

// ─────────────────────────────────────────────
// CONTACT SCHEMAS
// ─────────────────────────────────────────────
export const CreateContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(200).optional(),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto']).default('mock'),
});

export const ContactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto', 'all']).optional(),
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
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto']).default('mock'),
});

export const CompanyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto', 'all']).optional(),
  search: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// DEAL SCHEMAS
// ─────────────────────────────────────────────
export const CreateDealSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().optional(),
  stage: z.string().max(100).optional(),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto']).default('mock'),
});

export const DealQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  provider: z.enum(['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto', 'all']).optional(),
  search: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type ContactQueryInput = z.infer<typeof ContactQuerySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type CompanyQueryInput = z.infer<typeof CompanyQuerySchema>;
export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type DealQueryInput = z.infer<typeof DealQuerySchema>;
