import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { v4 as uuidv4 } from 'uuid';

const UNIFIEDTO_CONTACTS: Contact[] = [
  { id: uuidv4(), externalId: 'unifiedto-c-001', name: 'Unified.to Hub User', email: 'support@unified.to', phone: '+1-800-UNIFIED', jobTitle: 'API Gateway Bot', provider: 'unifiedto' },
];

const UNIFIEDTO_COMPANIES: Company[] = [
  { id: uuidv4(), externalId: 'unifiedto-co-001', name: 'Unified.to Inc', website: 'https://unified.to', industry: 'Integration Unified API', size: '50-100', provider: 'unifiedto' },
];

const UNIFIEDTO_DEALS: Deal[] = [
  { id: uuidv4(), externalId: 'unifiedto-d-001', title: 'Unified.to Scaling Plan', amount: 25000, stage: 'Active Sub', provider: 'unifiedto' },
];

export class UnifiedToAdapter implements CRMProvider {
  readonly providerName = 'unifiedto';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    return [...UNIFIEDTO_CONTACTS];
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    return UNIFIEDTO_CONTACTS.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const contact: Contact = {
      id: uuidv4(),
      externalId: `unifiedto-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'unifiedto',
    };
    UNIFIEDTO_CONTACTS.push(contact);
    return contact;
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    return [...UNIFIEDTO_COMPANIES];
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    return UNIFIEDTO_COMPANIES.find(c => c.externalId === externalId) || null;
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    const company: Company = {
      id: uuidv4(),
      externalId: `unifiedto-co-${Date.now()}`,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      provider: 'unifiedto',
    };
    UNIFIEDTO_COMPANIES.push(company);
    return company;
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    return [...UNIFIEDTO_DEALS];
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
