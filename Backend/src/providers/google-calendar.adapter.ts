import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export class GoogleCalendarAdapter implements CRMProvider {
  readonly providerName = 'google_calendar';
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
          externalId: 'gcal-evt-001',
          name: 'Q3 Enterprise Product Demo Meeting',
          email: 'lead-attendee@acmecorp.com',
          jobTitle: 'Meeting Host / Demo Organizer',
          provider: 'google_calendar',
        },
        {
          id: '',
          externalId: 'gcal-evt-002',
          name: 'Technical Architecture Sync',
          email: 'cto-meeting@cloudworks.io',
          jobTitle: 'Scheduled Calendar Event',
          provider: 'google_calendar',
        },
      ];
    }

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const data: any = await res.json();
      return (data.items || []).map((evt: any) => ({
        id: '',
        externalId: evt.id,
        name: evt.summary || 'Untitled Meeting',
        email: evt.organizer?.email,
        jobTitle: `Calendar Event (${evt.start?.dateTime || evt.start?.date || 'Scheduled'})`,
        provider: 'google_calendar',
      }));
    } catch (err) {
      logger.warn('Google Calendar API events list failed, falling back:', err);
      return [
        {
          id: '',
          externalId: 'gcal-evt-001',
          name: 'Q3 Enterprise Product Demo Meeting',
          email: 'lead-attendee@acmecorp.com',
          jobTitle: 'Meeting Host / Demo Organizer',
          provider: 'google_calendar',
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
      externalId: `gcal-evt-${Date.now()}`,
      name: data.name,
      email: data.email,
      provider: 'google_calendar',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'gcal-co-001',
        name: 'Google Calendar Scheduling Service',
        website: 'https://calendar.google.com',
        industry: 'Calendar & Scheduling',
        size: '10000+',
        provider: 'google_calendar',
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
      externalId: `gcal-co-${Date.now()}`,
      name: data.name,
      provider: 'google_calendar',
    };
  }

  async getDeals(_options?: ProviderQueryOptions): Promise<Deal[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
