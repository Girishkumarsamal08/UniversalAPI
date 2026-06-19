// CRM Provider Interface — All adapters must implement this contract

import { Contact, Company } from '../schemas/unified.types';

export interface CRMProvider {
  readonly providerName: string;

  /**
   * Fetch all contacts from the CRM provider
   * Returns contacts normalized to the unified Contact shape
   */
  getContacts(options?: ProviderQueryOptions): Promise<Contact[]>;

  /**
   * Fetch a single contact by provider-specific ID
   */
  getContactById(externalId: string): Promise<Contact | null>;

  /**
   * Create a contact in the provider
   */
  createContact(data: CreateContactData): Promise<Contact>;

  /**
   * Fetch all companies from the CRM provider
   * Returns companies normalized to the unified Company shape
   */
  getCompanies(options?: ProviderQueryOptions): Promise<Company[]>;

  /**
   * Fetch a single company by provider-specific ID
   */
  getCompanyById(externalId: string): Promise<Company | null>;

  /**
   * Create a company in the provider
   */
  createCompany(data: CreateCompanyData): Promise<Company>;

  /**
   * Test if the provider credentials/token are still valid
   */
  testConnection(): Promise<boolean>;
}

export interface ProviderQueryOptions {
  limit?: number;
  page?: number;
  search?: string;
}

export interface CreateContactData {
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
}

export interface CreateCompanyData {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
}

export type ProviderName = 'hubspot' | 'salesforce' | 'pipedrive' | 'mock';
