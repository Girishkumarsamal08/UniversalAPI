import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { v4 as uuidv4 } from 'uuid';

const ZAPIER_CONTACTS: Contact[] = [
  { id: uuidv4(), externalId: 'zapier-c-001', name: 'Zapier Webhook Hook', email: 'trigger@zapier.com', phone: '+1-800-ZAPIER', jobTitle: 'Automation Trigger', provider: 'zapier' },
  { id: uuidv4(), externalId: 'zapier-c-002', name: 'Slack Integration User', email: 'slack@zapier-automation.io', phone: '', jobTitle: 'Action Runner', provider: 'zapier' },
];

const ZAPIER_COMPANIES: Company[] = [
  { id: uuidv4(), externalId: 'zapier-co-001', name: 'Zapier Inc', website: 'https://zapier.com', industry: 'Automation', size: '500-1000', provider: 'zapier' },
];

const ZAPIER_DEALS: Deal[] = [
  { id: uuidv4(), externalId: 'zapier-d-001', title: 'Zapier Premium Automation Tier', amount: 15000, stage: 'Active Sub', provider: 'zapier' },
];

export class ZapierAdapter implements CRMProvider {
  readonly providerName = 'zapier';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    return [...ZAPIER_CONTACTS];
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    return ZAPIER_CONTACTS.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const contact: Contact = {
      id: uuidv4(),
      externalId: `zapier-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'zapier',
    };
    ZAPIER_CONTACTS.push(contact);
    return contact;
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    return [...ZAPIER_COMPANIES];
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    return ZAPIER_COMPANIES.find(c => c.externalId === externalId) || null;
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    const company: Company = {
      id: uuidv4(),
      externalId: `zapier-co-${Date.now()}`,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      provider: 'zapier',
    };
    ZAPIER_COMPANIES.push(company);
    return company;
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    return [...ZAPIER_DEALS];
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
