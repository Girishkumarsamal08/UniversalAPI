// HubSpot Adapter - Normalizes HubSpot crm API to Universal API
import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { transform } from './mapper';
import hubspotMapping from './mappings/hubspot.json';
import { logger } from '../utils/logger';

export class HubSpotAdapter implements CRMProvider {
  readonly providerName = 'hubspot';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Helper to check if using mock mode token
  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    if (this.isMockToken()) {
      logger.info('HubSpotAdapter: Using mock fallback for getContacts');
      return [
        {
          id: '',
          externalId: 'hs_contact_101',
          name: 'Sarah Connor',
          email: 'sarah.connor@sky.net',
          phone: '+1-555-0199',
          jobTitle: 'Structural Engineer',
          provider: 'hubspot',
        },
        {
          id: '',
          externalId: 'hs_contact_102',
          name: 'Marcus Wright',
          email: 'marcus@projectangel.com',
          phone: '+1-555-0248',
          jobTitle: 'Project Manager',
          provider: 'hubspot',
        }
      ];
    }

    try {
      const limit = options?.limit || 10;
      const properties = 'firstname,lastname,email,phone,jobtitle';
      const url = `https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=${properties}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HubSpot API error: ${res.status} ${res.statusText}`);
      }

      const body: any = await res.json();
      const results = body?.results || [];

      return results.map((raw: any) => this.mapContact(raw));
    } catch (error) {
      logger.error('HubSpot getContacts failed:', error);
      throw error;
    }
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    if (this.isMockToken()) {
      const contacts = await this.getContacts();
      return contacts.find(c => c.externalId === externalId) || null;
    }

    try {
      const properties = 'firstname,lastname,email,phone,jobtitle';
      const url = `https://api.hubapi.com/crm/v3/objects/contacts/${externalId}?properties=${properties}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HubSpot API error: ${res.status}`);

      const raw = await res.json();
      return this.mapContact(raw);
    } catch (error) {
      logger.error(`HubSpot getContactById failed for ${externalId}:`, error);
      throw error;
    }
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    if (this.isMockToken()) {
      logger.info('HubSpotAdapter: Using mock fallback for createContact');
      return {
        id: '',
        externalId: `hs_contact_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        provider: 'hubspot',
      };
    }

    try {
      const url = 'https://api.hubapi.com/crm/v3/objects/contacts';
      const [firstname, ...lastnameParts] = data.name.split(' ');
      const lastname = lastnameParts.join(' ');
      
      const properties = {
        firstname,
        lastname: lastname || '',
        email: data.email || '',
        phone: data.phone || '',
        jobtitle: data.jobTitle || '',
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      if (!res.ok) {
        throw new Error(`HubSpot API error: ${res.status} ${res.statusText}`);
      }

      const raw = await res.json();
      return this.mapContact(raw);
    } catch (error) {
      logger.error('HubSpot createContact failed:', error);
      throw error;
    }
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    if (this.isMockToken()) {
      logger.info('HubSpotAdapter: Using mock fallback for getCompanies');
      return [
        {
          id: '',
          externalId: 'hs_company_101',
          name: 'Cyberdyne Systems',
          website: 'https://cyberdyne.systems',
          industry: 'Defense & Robotics',
          size: '500',
          provider: 'hubspot',
        },
        {
          id: '',
          externalId: 'hs_company_102',
          name: 'Resistance HQ',
          website: 'https://johnconnor.org',
          industry: 'Non-Profit',
          size: '10000',
          provider: 'hubspot',
        }
      ];
    }

    try {
      const limit = options?.limit || 10;
      const properties = 'name,website,industry,numberofemployees';
      const url = `https://api.hubapi.com/crm/v3/objects/companies?limit=${limit}&properties=${properties}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HubSpot API error: ${res.status}`);
      }

      const body: any = await res.json();
      const results = body?.results || [];

      return results.map((raw: any) => this.mapCompany(raw));
    } catch (error) {
      logger.error('HubSpot getCompanies failed:', error);
      throw error;
    }
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    if (this.isMockToken()) {
      const companies = await this.getCompanies();
      return companies.find(c => c.externalId === externalId) || null;
    }

    try {
      const properties = 'name,website,industry,numberofemployees';
      const url = `https://api.hubapi.com/crm/v3/objects/companies/${externalId}?properties=${properties}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HubSpot API error: ${res.status}`);

      const raw = await res.json();
      return this.mapCompany(raw);
    } catch (error) {
      logger.error(`HubSpot getCompanyById failed for ${externalId}:`, error);
      throw error;
    }
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    if (this.isMockToken()) {
      logger.info('HubSpotAdapter: Using mock fallback for createCompany');
      return {
        id: '',
        externalId: `hs_company_${Date.now()}`,
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        provider: 'hubspot',
      };
    }

    try {
      const url = 'https://api.hubapi.com/crm/v3/objects/companies';
      const properties = {
        name: data.name,
        website: data.website || '',
        industry: data.industry || '',
        numberofemployees: data.size || '',
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      if (!res.ok) {
        throw new Error(`HubSpot API error: ${res.status}`);
      }

      const raw = await res.json();
      return this.mapCompany(raw);
    } catch (error) {
      logger.error('HubSpot createCompany failed:', error);
      throw error;
    }
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    if (this.isMockToken()) {
      logger.info('HubSpotAdapter: Using mock fallback for getDeals');
      return [
        {
          id: '',
          externalId: 'hs_deal_101',
          title: 'Skynet Defense Network Deployment',
          amount: 15000000,
          stage: 'Contract Signed',
          provider: 'hubspot',
        },
        {
          id: '',
          externalId: 'hs_deal_102',
          title: 'T-800 CPU Sourcing Batch B',
          amount: 250000,
          stage: 'Proposal Sent',
          provider: 'hubspot',
        }
      ];
    }

    try {
      const limit = options?.limit || 10;
      const properties = 'dealname,amount,dealstage';
      const url = `https://api.hubapi.com/crm/v3/objects/deals?limit=${limit}&properties=${properties}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HubSpot API error: ${res.status}`);
      }

      const body: any = await res.json();
      const results = body?.results || [];

      return results.map((raw: any) => this.mapDeal(raw));
    } catch (error) {
      logger.error('HubSpot getDeals failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  // Normalization mappers
  private mapContact(raw: any): Contact {
    return transform<Contact>(raw, hubspotMapping.contact, 'hubspot');
  }

  private mapCompany(raw: any): Company {
    return transform<Company>(raw, hubspotMapping.company, 'hubspot');
  }

  private mapDeal(raw: any): Deal {
    return transform<Deal>(raw, hubspotMapping.deal, 'hubspot');
  }
}
