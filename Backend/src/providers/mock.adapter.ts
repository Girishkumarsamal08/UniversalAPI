// Mock Provider Adapter — Returns realistic mock data
// Used in development and as fallback when no real provider is connected
// Swayamsuchee will replace this with real HubSpot/Salesforce/Pipedrive connectors

import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company } from '../schemas/unified.types';
import { v4 as uuidv4 } from 'uuid';

const MOCK_CONTACTS: Contact[] = [
  { id: uuidv4(), externalId: 'mock-c-001', name: 'John Doe', email: 'john.doe@example.com', phone: '+1-555-0101', jobTitle: 'CEO', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-c-002', name: 'Jane Smith', email: 'jane.smith@techcorp.com', phone: '+1-555-0102', jobTitle: 'CTO', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-c-003', name: 'Bob Johnson', email: 'bob.j@enterprise.io', phone: '+1-555-0103', jobTitle: 'VP Sales', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-c-004', name: 'Alice Brown', email: 'alice@startup.com', phone: '+1-555-0104', jobTitle: 'Account Manager', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-c-005', name: 'Charlie Wilson', email: 'charlie@example.org', phone: '+1-555-0105', jobTitle: 'Developer', provider: 'mock' },
];

const MOCK_COMPANIES: Company[] = [
  { id: uuidv4(), externalId: 'mock-co-001', name: 'TechCorp Inc', website: 'https://techcorp.com', industry: 'Technology', size: '100-500', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-co-002', name: 'Enterprise Solutions', website: 'https://enterprise.io', industry: 'Consulting', size: '500-1000', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-co-003', name: 'StartupXYZ', website: 'https://startup.xyz', industry: 'Fintech', size: '10-50', provider: 'mock' },
  { id: uuidv4(), externalId: 'mock-co-004', name: 'Global Markets Ltd', website: 'https://globalmarkets.com', industry: 'Finance', size: '1000+', provider: 'mock' },
];

export class MockAdapter implements CRMProvider {
  readonly providerName = 'mock';

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    let contacts = [...MOCK_CONTACTS];

    if (options?.search) {
      const search = options.search.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search)
      );
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const start = (page - 1) * limit;
    return contacts.slice(start, start + limit);
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    return MOCK_CONTACTS.find((c) => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const newContact: Contact = {
      id: uuidv4(),
      externalId: `mock-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'mock',
      createdAt: new Date().toISOString(),
    };
    MOCK_CONTACTS.push(newContact);
    return newContact;
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    let companies = [...MOCK_COMPANIES];

    if (options?.search) {
      const search = options.search.toLowerCase();
      companies = companies.filter((c) =>
        c.name.toLowerCase().includes(search)
      );
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const start = (page - 1) * limit;
    return companies.slice(start, start + limit);
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    return MOCK_COMPANIES.find((c) => c.externalId === externalId) || null;
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    const newCompany: Company = {
      id: uuidv4(),
      externalId: `mock-co-${Date.now()}`,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      provider: 'mock',
      createdAt: new Date().toISOString(),
    };
    MOCK_COMPANIES.push(newCompany);
    return newCompany;
  }

  async testConnection(): Promise<boolean> {
    return true; // Mock is always available
  }
}
