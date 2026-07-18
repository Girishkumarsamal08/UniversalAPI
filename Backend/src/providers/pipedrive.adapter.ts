// Pipedrive Adapter — Implements CRMProvider interface for Pipedrive
import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { transform } from './mapper';
import pipedriveMapping from './mappings/pipedrive.json';
import { logger } from '../utils/logger';

export class PipedriveAdapter implements CRMProvider {
  readonly providerName = 'pipedrive';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    if (this.isMockToken()) {
      logger.info('PipedriveAdapter: Using mock fallback for getContacts');
      return [
        {
          id: '',
          externalId: 'pd_person_301',
          name: 'Anakin Skywalker',
          email: 'anakin@deathstar.com',
          phone: '+1-555-0606',
          jobTitle: 'Sith Lord',
          provider: 'pipedrive',
        },
        {
          id: '',
          externalId: 'pd_person_302',
          name: 'Obi-Wan Kenobi',
          email: 'ben@jedi.org',
          phone: '+1-555-0707',
          jobTitle: 'Hermit',
          provider: 'pipedrive',
        }
      ];
    }

    try {
      const limit = options?.limit || 10;
      const url = `https://api.pipedrive.com/v1/persons?limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Pipedrive API error: ${res.status}`);
      const body: any = await res.json();
      const records = body?.data || [];
      return records.map((r: any) => this.mapContact(r));
    } catch (error) {
      logger.error('Pipedrive getContacts failed:', error);
      throw error;
    }
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    if (this.isMockToken()) {
      const contacts = await this.getContacts();
      return contacts.find(c => c.externalId === externalId) || null;
    }
    try {
      const url = `https://api.pipedrive.com/v1/persons/${externalId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Pipedrive error: ${res.status}`);
      const body: any = await res.json();
      return this.mapContact(body?.data);
    } catch (error) {
      logger.error('Pipedrive getContactById failed:', error);
      throw error;
    }
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    if (this.isMockToken()) {
      return {
        id: '',
        externalId: `pd_person_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        provider: 'pipedrive',
      };
    }
    try {
      const url = 'https://api.pipedrive.com/v1/persons';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email ? [{ value: data.email, primary: true }] : undefined,
          phone: data.phone ? [{ value: data.phone, primary: true }] : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Pipedrive create contact failed: ${res.status}`);
      const body: any = await res.json();
      return this.mapContact(body?.data);
    } catch (error) {
      logger.error('Pipedrive createContact failed:', error);
      throw error;
    }
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    if (this.isMockToken()) {
      return [
        {
          id: '',
          externalId: 'pd_org_301',
          name: 'The Galactic Senate',
          website: 'https://coruscant.gov',
          industry: 'Legislative',
          size: '5000',
          provider: 'pipedrive',
        },
        {
          id: '',
          externalId: 'pd_org_302',
          name: 'Tatooine Moisture Farms',
          website: 'https://moisturefarm.org',
          industry: 'Agriculture',
          size: '50',
          provider: 'pipedrive',
        }
      ];
    }
    try {
      const limit = options?.limit || 10;
      const url = `https://api.pipedrive.com/v1/organizations?limit=${limit}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (!res.ok) throw new Error(`Pipedrive organizations error: ${res.status}`);
      const body: any = await res.json();
      const records = body?.data || [];
      return records.map((r: any) => this.mapCompany(r));
    } catch (error) {
      logger.error('Pipedrive getCompanies failed:', error);
      throw error;
    }
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    if (this.isMockToken()) {
      const companies = await this.getCompanies();
      return companies.find(c => c.externalId === externalId) || null;
    }
    try {
      const url = `https://api.pipedrive.com/v1/organizations/${externalId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Pipedrive error: ${res.status}`);
      const body: any = await res.json();
      return this.mapCompany(body?.data);
    } catch (error) {
      logger.error('Pipedrive getCompanyById failed:', error);
      throw error;
    }
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    if (this.isMockToken()) {
      return {
        id: '',
        externalId: `pd_org_${Date.now()}`,
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        provider: 'pipedrive',
      };
    }
    try {
      const url = 'https://api.pipedrive.com/v1/organizations';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
        }),
      });
      if (!res.ok) throw new Error(`Pipedrive create organization failed: ${res.status}`);
      const body: any = await res.json();
      return this.mapCompany(body?.data);
    } catch (error) {
      logger.error('Pipedrive createCompany failed:', error);
      throw error;
    }
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    if (this.isMockToken()) {
      return [
        {
          id: '',
          externalId: 'pd_deal_301',
          title: 'Millennium Falcon Hyperdrive Service',
          amount: 85000,
          stage: 'In Negotiation',
          provider: 'pipedrive',
        },
        {
          id: '',
          externalId: 'pd_deal_302',
          title: 'Bespin Tibanna Gas Cargo Lease',
          amount: 450000,
          stage: 'Won',
          provider: 'pipedrive',
        }
      ];
    }
    try {
      const limit = options?.limit || 10;
      const url = `https://api.pipedrive.com/v1/deals?limit=${limit}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (!res.ok) throw new Error(`Pipedrive deals query failed: ${res.status}`);
      const body: any = await res.json();
      const records = body?.data || [];
      return records.map((r: any) => this.mapDeal(r));
    } catch (error) {
      logger.error('Pipedrive getDeals failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://api.pipedrive.com/v1/users/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  // Normalization Helpers using Declarative transform engine
  private mapContact(r: any): Contact {
    return transform<Contact>(r, pipedriveMapping.contact, 'pipedrive');
  }

  private mapCompany(r: any): Company {
    return transform<Company>(r, pipedriveMapping.company, 'pipedrive');
  }

  private mapDeal(r: any): Deal {
    return transform<Deal>(r, pipedriveMapping.deal, 'pipedrive');
  }
}
