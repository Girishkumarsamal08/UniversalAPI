// Salesforce Adapter — STUB (Swayamsuchee to implement)
// Implements CRMProvider interface for Salesforce REST API

import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company } from '../schemas/unified.types';

export class SalesforceAdapter implements CRMProvider {
  readonly providerName = 'salesforce';
  private accessToken: string;
  private instanceUrl: string;

  constructor(accessToken: string, instanceUrl: string = 'https://login.salesforce.com') {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl;
  }

  /**
   * TODO (Swayamsuchee): GET /services/data/v57.0/sobjects/Contact
   * Docs: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_sobject_basic_info.htm
   * Map Salesforce Contact fields → unified Contact DTO
   */
  async getContacts(_options?: ProviderQueryOptions): Promise<Contact[]> {
    throw new Error('SalesforceAdapter.getContacts() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /services/data/v57.0/sobjects/Contact/{id}
   */
  async getContactById(_externalId: string): Promise<Contact | null> {
    throw new Error('SalesforceAdapter.getContactById() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): POST /services/data/v57.0/sobjects/Contact
   */
  async createContact(_data: CreateContactData): Promise<Contact> {
    throw new Error('SalesforceAdapter.createContact() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /services/data/v57.0/sobjects/Account
   * In Salesforce, Companies = Accounts
   */
  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    throw new Error('SalesforceAdapter.getCompanies() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): GET /services/data/v57.0/sobjects/Account/{id}
   */
  async getCompanyById(_externalId: string): Promise<Company | null> {
    throw new Error('SalesforceAdapter.getCompanyById() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): POST /services/data/v57.0/sobjects/Account
   */
  async createCompany(_data: CreateCompanyData): Promise<Company> {
    throw new Error('SalesforceAdapter.createCompany() not yet implemented');
  }

  /**
   * TODO (Swayamsuchee): Use SOQL: SELECT Id FROM Contact LIMIT 1
   */
  async testConnection(): Promise<boolean> {
    return false;
  }

  /**
   * TODO (Swayamsuchee): Map Salesforce Contact → unified Contact DTO
   * Key field mappings:
   *   SF.Id             → Contact.externalId
   *   SF.FirstName + LastName → Contact.name
   *   SF.Email          → Contact.email
   *   SF.Phone          → Contact.phone
   *   SF.Title          → Contact.jobTitle
   */
  private mapContact(raw: Record<string, unknown>): Contact {
    throw new Error('Not implemented: ' + JSON.stringify(raw));
  }

  /**
   * TODO (Swayamsuchee): Map Salesforce Account → unified Company DTO
   * Key field mappings:
   *   SF.Id             → Company.externalId
   *   SF.Name           → Company.name
   *   SF.Website        → Company.website
   *   SF.Industry       → Company.industry
   *   SF.NumberOfEmployees → Company.size
   */
  private mapCompany(raw: Record<string, unknown>): Company {
    throw new Error('Not implemented: ' + JSON.stringify(raw));
  }
}
