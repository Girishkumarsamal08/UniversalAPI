// Salesforce Adapter — Implements the CRMProvider interface for Salesforce
import { CRMProvider, ProviderQueryOptions, CreateContactData, CreateCompanyData } from './crm.provider.interface';
import { Contact, Company, Deal } from '../schemas/unified.types';
import { transform } from './mapper';
import salesforceMapping from './mappings/salesforce.json';
import { logger } from '../utils/logger';

export class SalesforceAdapter implements CRMProvider {
  readonly providerName = 'salesforce';
  private accessToken: string;
  private instanceUrl: string;

  constructor(accessToken: string, instanceUrl: string = 'https://login.salesforce.com') {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl;
  }

  private isMockToken(): boolean {
    return !this.accessToken || this.accessToken.startsWith('mock-');
  }

  async getContacts(options?: ProviderQueryOptions): Promise<Contact[]> {
    if (this.isMockToken()) {
      logger.info('SalesforceAdapter: Using mock fallback for getContacts');
      return [
        {
          id: '',
          externalId: 'sf_contact_201',
          name: 'Luke Skywalker',
          email: 'luke@tatooine.org',
          phone: '+1-555-0808',
          jobTitle: 'Jedi Knight',
          provider: 'salesforce',
        },
        {
          id: '',
          externalId: 'sf_contact_202',
          name: 'Leia Organa',
          email: 'princess@alderaan.gov',
          phone: '+1-555-0909',
          jobTitle: 'Senator',
          provider: 'salesforce',
        }
      ];
    }

    try {
      const url = `${this.instanceUrl}/services/data/v57.0/query?q=SELECT+Id,FirstName,LastName,Email,Phone,Title+FROM+Contact+LIMIT+${options?.limit || 10}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Salesforce API error: ${res.status}`);
      const body: any = await res.json();
      const records = body?.records || [];
      return records.map((r: any) => this.mapContact(r));
    } catch (error) {
      logger.error('Salesforce getContacts failed:', error);
      throw error;
    }
  }

  async getContactById(externalId: string): Promise<Contact | null> {
    if (this.isMockToken()) {
      const contacts = await this.getContacts();
      return contacts.find(c => c.externalId === externalId) || null;
    }
    try {
      const url = `${this.instanceUrl}/services/data/v57.0/sobjects/Contact/${externalId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Salesforce error: ${res.status}`);
      const r: any = await res.json();
      return this.mapContact(r);
    } catch (error) {
      logger.error('Salesforce getContactById failed:', error);
      throw error;
    }
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    if (this.isMockToken()) {
      return {
        id: '',
        externalId: `sf_contact_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        provider: 'salesforce',
      };
    }
    try {
      const url = `${this.instanceUrl}/services/data/v57.0/sobjects/Contact`;
      const [firstname, ...lastnameParts] = data.name.split(' ');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FirstName: firstname,
          LastName: lastnameParts.join(' ') || 'SF-Lastname',
          Email: data.email,
          Phone: data.phone,
          Title: data.jobTitle,
        }),
      });
      if (!res.ok) throw new Error(`Salesforce create contact error: ${res.status}`);
      const body: any = await res.json();
      return {
        id: '',
        externalId: body.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        provider: 'salesforce',
        _raw_passthrough: body,
      };
    } catch (error) {
      logger.error('Salesforce createContact failed:', error);
      throw error;
    }
  }

  async getCompanies(options?: ProviderQueryOptions): Promise<Company[]> {
    if (this.isMockToken()) {
      return [
        {
          id: '',
          externalId: 'sf_company_201',
          name: 'Jedi Council',
          website: 'https://jedi.org',
          industry: 'Government & Spiritual',
          size: '12',
          provider: 'salesforce',
        },
        {
          id: '',
          externalId: 'sf_company_202',
          name: 'Galactic Empire Corp',
          website: 'https://empire.gov',
          industry: 'Defense & Aerospace',
          size: '1000000',
          provider: 'salesforce',
        }
      ];
    }
    try {
      const url = `${this.instanceUrl}/services/data/v57.0/query?q=SELECT+Id,Name,Website,Industry,NumberOfEmployees+FROM+Account+LIMIT+${options?.limit || 10}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (!res.ok) throw new Error(`Salesforce Account Query error: ${res.status}`);
      const body: any = await res.json();
      return (body?.records || []).map((r: any) => this.mapCompany(r));
    } catch (error) {
      logger.error('Salesforce getCompanies failed:', error);
      throw error;
    }
  }

  async getCompanyById(externalId: string): Promise<Company | null> {
    if (this.isMockToken()) {
      const companies = await this.getCompanies();
      return companies.find(c => c.externalId === externalId) || null;
    }
    try {
      const url = `${this.instanceUrl}/services/data/v57.0/sobjects/Account/${externalId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Salesforce error: ${res.status}`);
      const r: any = await res.json();
      return this.mapCompany(r);
    } catch (error) {
      logger.error('Salesforce getCompanyById failed:', error);
      throw error;
    }
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    if (this.isMockToken()) {
      return {
        id: '',
        externalId: `sf_company_${Date.now()}`,
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        provider: 'salesforce',
      };
    }
    try {
      const url = `${this.instanceUrl}/services/data/v57.0/sobjects/Account`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: data.name,
          Website: data.website,
          Industry: data.industry,
          NumberOfEmployees: data.size ? parseInt(data.size, 10) : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Salesforce create Account failed: ${res.status}`);
      const body: any = await res.json();
      return {
        id: '',
        externalId: body.id,
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        provider: 'salesforce',
        _raw_passthrough: body,
      };
    } catch (error) {
      logger.error('Salesforce createCompany failed:', error);
      throw error;
    }
  }

  async getDeals(options?: ProviderQueryOptions): Promise<Deal[]> {
    if (this.isMockToken()) {
      return [
        {
          id: '',
          externalId: 'sf_deal_201',
          title: 'Death Star Superlaser Procurement',
          amount: 850000000,
          stage: 'Proposal/Price Quote',
          provider: 'salesforce',
        },
        {
          id: '',
          externalId: 'sf_deal_202',
          title: 'X-Wing T-65 Sourcing',
          amount: 12000000,
          stage: 'Negotiation/Review',
          provider: 'salesforce',
        }
      ];
    }
    try {
      const url = `${this.instanceUrl}/services/data/v57.0/query?q=SELECT+Id,Name,Amount,StageName+FROM+Opportunity+LIMIT+${options?.limit || 10}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      if (!res.ok) throw new Error(`Salesforce Opportunity query error: ${res.status}`);
      const body: any = await res.json();
      return (body?.records || []).map((r: any) => this.mapDeal(r));
    } catch (error) {
      logger.error('Salesforce getDeals failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (this.isMockToken()) return true;
    try {
      const res = await fetch(`${this.instanceUrl}/services/data/v57.0/sobjects/Contact/limit/1`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  // Normalization Mappers using Declarative transform engine
  private mapContact(raw: any): Contact {
    return transform<Contact>(raw, salesforceMapping.contact, 'salesforce');
  }

  private mapCompany(raw: any): Company {
    return transform<Company>(raw, salesforceMapping.company, 'salesforce');
  }

  private mapDeal(raw: any): Deal {
    return transform<Deal>(raw, salesforceMapping.deal, 'salesforce');
  }
}
