import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { v4 as uuidv4 } from 'uuid';

const MERGE_CONTACTS: Contact[] = [
  { id: uuidv4(), externalId: 'merge-c-001', name: 'Merge.dev Bot', email: 'hello@merge.dev', phone: '+1-555-MERGE', jobTitle: 'Unified API Wrapper', provider: 'merge' },
  { id: uuidv4(), externalId: 'merge-c-002', name: 'HRIS Mock Employee', email: 'employee@merge-hiring.com', phone: '', jobTitle: 'HRIS Model User', provider: 'merge' },
];

const MERGE_COMPANIES: Company[] = [
  { id: uuidv4(), externalId: 'merge-co-001', name: 'Merge Dev Inc', website: 'https://merge.dev', industry: 'API Platform', size: '100-250', provider: 'merge' },
];

const MERGE_DEALS: Deal[] = [
  { id: uuidv4(), externalId: 'merge-d-001', title: 'Merge.dev Growth Suite', amount: 50000, stage: 'Active Sub', provider: 'merge' },
];

export class MergeAdapter implements CRMProvider {
  readonly providerName = 'merge';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    return [...MERGE_CONTACTS];
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    return MERGE_CONTACTS.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const contact: Contact = {
      id: uuidv4(),
      externalId: `merge-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'merge',
    };
    MERGE_CONTACTS.push(contact);
    return contact;
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    return [...MERGE_COMPANIES];
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    return MERGE_COMPANIES.find(c => c.externalId === externalId) || null;
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    const company: Company = {
      id: uuidv4(),
      externalId: `merge-co-${Date.now()}`,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      provider: 'merge',
    };
    MERGE_COMPANIES.push(company);
    return company;
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    return [...MERGE_DEALS];
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
