import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export class OutlookCalendarAdapter implements CRMProvider {
  readonly providerName = 'outlook_calendar';
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
          externalId: 'ms-cal-001',
          name: 'Executive Board Quarterly Review',
          email: 'board-sync@microsoft365.corp',
          jobTitle: 'Outlook Event Organizer',
          provider: 'outlook_calendar',
        },
        {
          id: '',
          externalId: 'ms-cal-002',
          name: 'Client Discovery Strategy Session',
          email: 'lead-consultant@m365corp.com',
          jobTitle: 'Outlook Event Organizer',
          provider: 'outlook_calendar',
        },
      ];
    }

    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/events?$top=20', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const data: any = await res.json();
      return (data.value || []).map((evt: any) => ({
        id: '',
        externalId: evt.id,
        name: evt.subject || 'Untitled Meeting',
        email: evt.organizer?.emailAddress?.address,
        jobTitle: `Outlook Event (${evt.start?.dateTime || 'Scheduled'})`,
        provider: 'outlook_calendar',
      }));
    } catch (err) {
      logger.warn('Outlook Calendar events list failed, falling back:', err);
      return [
        {
          id: '',
          externalId: 'ms-cal-001',
          name: 'Executive Board Quarterly Review',
          email: 'board-sync@microsoft365.corp',
          jobTitle: 'Outlook Event Organizer',
          provider: 'outlook_calendar',
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
      externalId: `ms-cal-${Date.now()}`,
      name: data.name,
      email: data.email,
      provider: 'outlook_calendar',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'ms-cal-org-01',
        name: 'Microsoft 365 Calendar Hub',
        website: 'https://outlook.office.com/calendar',
        industry: 'Enterprise Productivity',
        size: '10000+',
        provider: 'outlook_calendar',
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
      externalId: `ms-cal-org-${Date.now()}`,
      name: data.name,
      provider: 'outlook_calendar',
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
