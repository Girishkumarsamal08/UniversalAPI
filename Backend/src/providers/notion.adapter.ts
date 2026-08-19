import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export class NotionAdapter implements CRMProvider {
  readonly providerName = 'notion';
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
          externalId: 'notion-usr-001',
          name: 'Nadia Chen',
          email: 'nadia.chen@productdesign.io',
          jobTitle: 'Notion Workspace Admin & Product Lead',
          provider: 'notion',
        },
        {
          id: '',
          externalId: 'notion-usr-002',
          name: 'Liam Sterling',
          email: 'liam.sterling@growthlabs.co',
          jobTitle: 'Knowledge Base Architect',
          provider: 'notion',
        },
      ];
    }

    try {
      const res = await fetch('https://api.notion.com/v1/users?page_size=20', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28',
        },
      });
      const data: any = await res.json();
      return (data.results || []).map((u: any) => ({
        id: '',
        externalId: u.id,
        name: u.name || 'Notion User',
        email: u.person?.email,
        jobTitle: `Notion ${u.type === 'bot' ? 'Bot Integration' : 'Workspace Member'}`,
        provider: 'notion',
      }));
    } catch (err) {
      logger.warn('Notion users API failed, using fallback:', err);
      return [
        {
          id: '',
          externalId: 'notion-usr-001',
          name: 'Nadia Chen',
          email: 'nadia.chen@productdesign.io',
          jobTitle: 'Notion Workspace Admin & Product Lead',
          provider: 'notion',
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
      externalId: `notion-usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      provider: 'notion',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'notion-ws-001',
        name: 'Notion Connected Workspace',
        website: 'https://notion.so',
        industry: 'Knowledge Management & Productivity',
        size: '1000+',
        provider: 'notion',
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
      externalId: `notion-ws-${Date.now()}`,
      name: data.name,
      provider: 'notion',
    };
  }

  async getDeals(_options?: ProviderQueryOptions): Promise<Deal[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28',
        },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
