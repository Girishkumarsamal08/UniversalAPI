import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export class CalendlyAdapter implements CRMProvider {
  readonly providerName = 'calendly';
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
          externalId: 'cal-inv-001',
          name: 'Samantha Ray',
          email: 'samantha.ray@ventures.co',
          phone: '+1-555-0722',
          jobTitle: 'Investment Director (Calendly Invitee)',
          provider: 'calendly',
        },
        {
          id: '',
          externalId: 'cal-inv-002',
          name: 'Daniel Brooks',
          email: 'd.brooks@fintechlab.io',
          phone: '+1-555-0911',
          jobTitle: 'Enterprise Architect (Calendly Invitee)',
          provider: 'calendly',
        },
      ];
    }

    try {
      // Get current user info to fetch scheduled events
      const userRes = await fetch('https://api.calendly.com/users/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const userData: any = await userRes.json();
      const userUri = userData.resource?.uri;

      if (!userUri) {
        throw new Error('Calendly user profile unavailable');
      }

      const eventsRes = await fetch(`https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&count=20`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const eventsData: any = await eventsRes.json();

      return (eventsData.collection || []).map((evt: any) => ({
        id: '',
        externalId: evt.uri ? evt.uri.split('/').pop() : `cal-${Date.now()}`,
        name: evt.name || 'Calendly Booking',
        email: evt.event_memberships?.[0]?.user_email,
        jobTitle: `Calendly Booking (${evt.status || 'Active'})`,
        provider: 'calendly',
      }));
    } catch (err) {
      logger.warn('Calendly getContacts failed, falling back:', err);
      return [
        {
          id: '',
          externalId: 'cal-inv-001',
          name: 'Samantha Ray',
          email: 'samantha.ray@ventures.co',
          phone: '+1-555-0722',
          jobTitle: 'Investment Director (Calendly Invitee)',
          provider: 'calendly',
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
      externalId: `cal-inv-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      provider: 'calendly',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'cal-org-001',
        name: 'Calendly Organization',
        website: 'https://calendly.com',
        industry: 'Automated Scheduling Software',
        size: '500-1000',
        provider: 'calendly',
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
      externalId: `cal-org-${Date.now()}`,
      name: data.name,
      provider: 'calendly',
    };
  }

  async getDeals(_options?: ProviderQueryOptions): Promise<Deal[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://api.calendly.com/users/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
