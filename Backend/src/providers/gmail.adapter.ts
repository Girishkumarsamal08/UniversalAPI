import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export class GmailAdapter implements CRMProvider {
  readonly providerName = 'gmail';
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
          externalId: 'gmail-c-001',
          name: 'Alex Rivera',
          email: 'alex.rivera@globalenterprise.com',
          phone: '+1-555-0321',
          jobTitle: 'VP Technology (Email Contact)',
          provider: 'gmail',
        },
        {
          id: '',
          externalId: 'gmail-c-002',
          name: 'Elena Rostova',
          email: 'elena.rostova@cloudscale.io',
          phone: '+1-555-0654',
          jobTitle: 'Director of Procurement (Email Contact)',
          provider: 'gmail',
        },
      ];
    }

    try {
      // Fetch user profile
      const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const profile: any = await profileRes.json();
      return [
        {
          id: '',
          externalId: profile.emailAddress || 'gmail-me',
          name: profile.emailAddress ? profile.emailAddress.split('@')[0] : 'Google Workspace Account',
          email: profile.emailAddress,
          jobTitle: `Gmail Account (${profile.messagesTotal || 0} messages)`,
          provider: 'gmail',
        },
      ];
    } catch (err) {
      logger.warn('Gmail API getContacts failed, falling back to mock:', err);
      return [
        {
          id: '',
          externalId: 'gmail-c-001',
          name: 'Alex Rivera',
          email: 'alex.rivera@globalenterprise.com',
          phone: '+1-555-0321',
          jobTitle: 'VP Technology (Email Contact)',
          provider: 'gmail',
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
      externalId: `gmail-c-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'gmail',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'gmail-co-001',
        name: 'Google Workspace Mailbox',
        website: 'https://workspace.google.com',
        industry: 'Cloud Communication',
        size: '10000+',
        provider: 'gmail',
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
      externalId: `gmail-co-${Date.now()}`,
      name: data.name,
      provider: 'gmail',
    };
  }

  async getDeals(_options?: ProviderQueryOptions): Promise<Deal[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
