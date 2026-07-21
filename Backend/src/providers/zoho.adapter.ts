import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const ZOHO_CONTACTS: Contact[] = [
  { id: uuidv4(), externalId: 'zoho-c-001', name: 'Ramesh Kumar', email: 'ramesh.kumar@zoho.in', phone: '+91-98765-43210', jobTitle: 'HR Director', provider: 'zoho' },
  { id: uuidv4(), externalId: 'zoho-c-002', name: 'Priya Sharma', email: 'priya.s@zohocorp.com', phone: '+91-98765-43211', jobTitle: 'Procurement Head', provider: 'zoho' },
];

const ZOHO_COMPANIES: Company[] = [
  { id: uuidv4(), externalId: 'zoho-co-001', name: 'Zoho Corporation', website: 'https://zoho.com', industry: 'Software', size: '10000+', provider: 'zoho' },
  { id: uuidv4(), externalId: 'zoho-co-002', name: 'Bharat Logistics', website: 'https://bharatlogistics.in', industry: 'Logistics', size: '200-500', provider: 'zoho' },
];

const ZOHO_DEALS: Deal[] = [
  { id: uuidv4(), externalId: 'zoho-d-001', title: 'Zoho CRM Custom Implementation', amount: 85000, stage: 'Proposal/Quote', provider: 'zoho' },
  { id: uuidv4(), externalId: 'zoho-d-002', title: 'Zoho Books ERP Migration', amount: 30000, stage: 'Negotiation', provider: 'zoho' },
];

export class ZohoAdapter implements CRMProvider {
  readonly providerName = 'zoho';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    if (this.isMockToken()) {
      return [...ZOHO_CONTACTS];
    }
    // Stub for actual Zoho HTTP integration
    try {
      const res = await fetch(`https://www.zohoapis.com/crm/v2/Contacts?limit=${options?.limit || 20}`, {
        headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}` }
      });
      if (!res.ok) throw new Error(`Zoho API Error: ${res.status}`);
      const body: any = await res.json();
      return (body?.data || []).map((z: any) => ({
        id: '',
        externalId: z.id,
        name: z.Full_Name || `${z.First_Name || ''} ${z.Last_Name || ''}`.trim(),
        email: z.Email,
        phone: z.Phone,
        jobTitle: z.Title,
        provider: 'zoho',
      }));
    } catch (err) {
      logger.warn('Zoho getContacts failed, falling back to mock data:', err);
      return [...ZOHO_CONTACTS];
    }
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const contact: Contact = {
      id: uuidv4(),
      externalId: `zoho-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'zoho',
    };
    ZOHO_CONTACTS.push(contact);
    return contact;
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    return [...ZOHO_COMPANIES];
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    return ZOHO_COMPANIES.find(c => c.externalId === externalId) || null;
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    const company: Company = {
      id: uuidv4(),
      externalId: `zoho-co-${Date.now()}`,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size: data.size,
      provider: 'zoho',
    };
    ZOHO_COMPANIES.push(company);
    return company;
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    return [...ZOHO_DEALS];
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
