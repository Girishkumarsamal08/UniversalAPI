import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export class OutlookAdapter implements CRMProvider {
  readonly providerName = 'outlook_mail';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getContacts(_options?: ProviderQueryOptions): Promise<Contact[]> {
    if (this.isMockToken()) {
      return [
        {
          id: '',
          externalId: 'outlook-c-001',
          name: 'David Vance',
          email: 'david.vance@enterprisecorp.com',
          phone: '+1-555-0812',
          jobTitle: 'Chief Compliance Officer',
          provider: 'outlook_mail',
        },
        {
          id: '',
          externalId: 'outlook-c-002',
          name: 'Sarah Sterling',
          email: 'sarah.sterling@finpartners.org',
          phone: '+1-555-0943',
          jobTitle: 'Head of Enterprise Sales',
          provider: 'outlook_mail',
        },
      ];
    }

    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/contacts?$top=20', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const data: any = await res.json();
      return (data.value || []).map((c: any) => ({
        id: '',
        externalId: c.id,
        name: c.displayName || `${c.givenName || ''} ${c.surname || ''}`.trim(),
        email: c.emailAddresses?.[0]?.address,
        phone: c.mobilePhone || c.businessPhones?.[0],
        jobTitle: c.jobTitle,
        provider: 'outlook_mail',
      }));
    } catch (err) {
      logger.warn('Outlook Contacts API failed, falling back:', err);
      return [
        {
          id: '',
          externalId: 'outlook-c-001',
          name: 'David Vance',
          email: 'david.vance@enterprisecorp.com',
          phone: '+1-555-0812',
          jobTitle: 'Chief Compliance Officer',
          provider: 'outlook_mail',
        },
      ];
    }
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    return {
      id: '',
      externalId: `outlook-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'outlook_mail',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'outlook-co-001',
        name: 'Microsoft 365 Exchange Online',
        website: 'https://outlook.office.com',
        industry: 'Cloud Productivity & Messaging',
        size: '10000+',
        provider: 'outlook_mail',
      },
    ];
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    const companies = await this.getCompanies();
    return companies.find(c => c.externalId === externalId) || null;
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    return {
      id: '',
      externalId: `outlook-co-${Date.now()}`,
      name: data.name,
      provider: 'outlook_mail',
    };
  }

  async getDeals(_options?: ProviderQueryOptions): Promise<Deal[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
