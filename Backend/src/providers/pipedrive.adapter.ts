// Pipedrive Adapter — STUB (Swayamsuchee to implement)
// Implements CRMProvider interface for Pipedrive REST API

import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company } from '../schemas/unified.types';

export class PipedriveAdapter implements CRMProvider {
  readonly providerName = 'pipedrive';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * TODO (Swayamsuchee): GET /api/v1/persons
   * Docs: https://developers.pipedrive.com/docs/api/v1/Persons
   * In Pipedrive, Contacts = Persons
   */
  async getContacts(_options?: ProviderQueryOptions): Promise<Contact[]> {
    throw new Error('PipedriveAdapter.getContacts() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /api/v1/persons/{id}
   */
  async getContactById(_externalId: string): Promise<Contact | null> {
    throw new Error('PipedriveAdapter.getContactById() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): POST /api/v1/persons
   */
  async createContact(_data: CreateContactData): Promise<Contact> {
    throw new Error('PipedriveAdapter.createContact() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /api/v1/organizations
   * In Pipedrive, Companies = Organizations
   */
  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    throw new Error('PipedriveAdapter.getCompanies() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /api/v1/organizations/{id}
   */
  async getCompanyById(_externalId: string): Promise<Company | null> {
    throw new Error('PipedriveAdapter.getCompanyById() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): POST /api/v1/organizations
   */
  async createCompany(_data: CreateCompanyData): Promise<Company> {
    throw new Error('PipedriveAdapter.createCompany() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /api/v1/users/me — test connectivity
   */
  async testConnection(): Promise<boolean> {
    return false;
  }

  /**
   * TODO (Swayamsuchee): Map Pipedrive Person → unified Contact DTO
   * Key field mappings:
   *   PD.id             → Contact.externalId
   *   PD.name           → Contact.name
   *   PD.email[0].value → Contact.email
   *   PD.phone[0].value → Contact.phone
   *   PD.job_title      → Contact.jobTitle
   */
  private mapContact(raw: Record<string, unknown>): Contact {
    throw new Error('Not implemented: ' + JSON.stringify(raw));
  }

  /**
   * TODO (Swayamsuchee): Map Pipedrive Organization → unified Company DTO
   * Key field mappings:
   *   PD.id             → Company.externalId
   *   PD.name           → Company.name
   *   PD.cc_email       → Company.website (approximate)
   *   PD.category_id    → Company.industry
   *   PD.people_count   → Company.size
   */
  private mapCompany(raw: Record<string, unknown>): Company {
    throw new Error('Not implemented: ' + JSON.stringify(raw));
  }
}
