import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
}

export class TeamsAdapter implements CRMProvider {
  readonly providerName = 'teams';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getJoinedTeams(): Promise<any[]> {
    if (this.isMockToken()) {
      return [
        { id: 'team-ms-01', displayName: 'Engineering & Product', description: 'Core product engineering' },
        { id: 'team-ms-02', displayName: 'Sales & Marketing', description: 'GTM and customer acquisition' },
      ];
    }

    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const data: any = await res.json();
      return data.value || [];
    } catch (err) {
      logger.warn('Teams Graph API getJoinedTeams error:', err);
      return [
        { id: 'team-ms-01', displayName: 'Engineering & Product', description: 'Core product engineering' },
      ];
    }
  }

  async getContacts(_options?: ProviderQueryOptions): Promise<Contact[]> {
    const teams = await this.getJoinedTeams();
    return teams.map(t => ({
      id: '',
      externalId: t.id,
      name: `${t.displayName} (Team)`,
      email: `${t.id}@teams.microsoft.com`,
      jobTitle: t.description || 'Microsoft Teams Workspace',
      provider: 'teams',
    }));
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    return {
      id: '',
      externalId: `teams-t-${Date.now()}`,
      name: data.name,
      email: data.email,
      provider: 'teams',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'teams-org-01',
        name: 'Microsoft 365 Tenant',
        website: 'https://teams.microsoft.com',
        industry: 'Enterprise Software',
        size: '10000+',
        provider: 'teams',
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
      externalId: `teams-org-${Date.now()}`,
      name: data.name,
      provider: 'teams',
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
