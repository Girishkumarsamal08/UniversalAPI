// HubSpot Adapter — STUB (Swayamsuchee to implement)
// Implements the CRMProvider interface for HubSpot CRM API

import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company } from '../schemas/unified.types';

export class HubSpotAdapter implements CRMProvider {
  readonly providerName = 'hubspot';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * TODO (Swayamsuchee): Implement using HubSpot Contacts API v3
   * Docs: https://developers.hubspot.com/docs/api/crm/contacts
   * Map HubSpot contact shape → unified Contact DTO
   */
  async getContacts(_options?: ProviderQueryOptions): Promise<Contact[]> {
    throw new Error('HubSpotAdapter.getContacts() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /crm/v3/objects/contacts/{contactId}
   */
  async getContactById(_externalId: string): Promise<Contact | null> {
    throw new Error('HubSpotAdapter.getContactById() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): POST /crm/v3/objects/contacts
   */
  async createContact(_data: CreateContactData): Promise<Contact> {
    throw new Error('HubSpotAdapter.createContact() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /crm/v3/objects/companies
   * Docs: https://developers.hubspot.com/docs/api/crm/companies
   */
  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    throw new Error('HubSpotAdapter.getCompanies() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /crm/v3/objects/companies/{companyId}
   */
  async getCompanyById(_externalId: string): Promise<Company | null> {
    throw new Error('HubSpotAdapter.getCompanyById() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): POST /crm/v3/objects/companies
   */
  async createCompany(_data: CreateCompanyData): Promise<Company> {
    throw new Error('HubSpotAdapter.createCompany() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /crm/v3/objects/contacts?limit=1 to verify token
   */
  async testConnection(): Promise<boolean> {
    return false;
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS (Swayamsuchee to complete)
  // ─────────────────────────────────────────────

  /**
   * Maps raw HubSpot contact object → unified Contact DTO
   */
  private mapContact(raw: Record<string, unknown>): Contact {
    // TODO: Map HubSpot fields to unified Contact
    throw new Error('Not implemented: ' + JSON.stringify(raw));
  }

  /**
   * Maps raw HubSpot company object → unified Company DTO
   */
  private mapCompany(raw: Record<string, unknown>): Company {
    // TODO: Map HubSpot fields to unified Company
    throw new Error('Not implemented: ' + JSON.stringify(raw));
  }
}
