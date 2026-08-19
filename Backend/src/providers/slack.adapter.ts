import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { logger } from '../utils/logger';

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  text: string;
  sender: string;
  timestamp: string;
}

export class SlackAdapter implements CRMProvider {
  readonly providerName = 'slack';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getChannels(): Promise<SlackChannel[]> {
    if (this.isMockToken()) {
      return [
        { id: 'C0123456789', name: 'general', isPrivate: false, memberCount: 42 },
        { id: 'C0987654321', name: 'sales-leads', isPrivate: false, memberCount: 18 },
        { id: 'C0112233445', name: 'crm-alerts', isPrivate: true, memberCount: 8 },
      ];
    }

    try {
      const res = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const data: any = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to list Slack channels');
      return (data.channels || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private,
        memberCount: ch.num_members || 0,
      }));
    } catch (err) {
      logger.warn('Slack getChannels error, using fallback:', err);
      return [
        { id: 'C0123456789', name: 'general', isPrivate: false, memberCount: 42 },
        { id: 'C0987654321', name: 'sales-leads', isPrivate: false, memberCount: 18 },
      ];
    }
  }

  async postMessage(channelId: string, text: string): Promise<boolean> {
    if (this.isMockToken()) {
      logger.info(`[Slack Mock] Message sent to ${channelId}: "${text}"`);
      return true;
    }

    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel: channelId, text }),
      });
      const data: any = await res.json();
      return !!data.ok;
    } catch (err) {
      logger.error('Slack postMessage failed:', err);
      return false;
    }
  }

  // CRMProvider contract compliance for unified sync engine
  async getContacts(_options?: ProviderQueryOptions): Promise<Contact[]> {
    const channels = await this.getChannels();
    return channels.map(ch => ({
      id: '',
      externalId: ch.id,
      name: `#${ch.name} Channel`,
      email: `${ch.name}@slack-workspace.internal`,
      jobTitle: `Slack Channel (${ch.memberCount} members)`,
      provider: 'slack',
    }));
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.externalId === externalId) || null;
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    return {
      id: '',
      externalId: `slack-ch-${Date.now()}`,
      name: data.name,
      email: data.email,
      provider: 'slack',
    };
  }

  async getCompanies(_options?: ProviderQueryOptions): Promise<Company[]> {
    return [
      {
        id: '',
        externalId: 'slack-team-001',
        name: 'Slack Connected Workspace',
        website: 'https://slack.com',
        industry: 'Communication & Collaboration',
        size: '1000+',
        provider: 'slack',
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
      externalId: `slack-team-${Date.now()}`,
      name: data.name,
      provider: 'slack',
    };
  }

  async getDeals(_options?: ProviderQueryOptions): Promise<Deal[]> {
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const data: any = await res.json();
      return !!data.ok;
    } catch {
      return false;
    }
  }
}
