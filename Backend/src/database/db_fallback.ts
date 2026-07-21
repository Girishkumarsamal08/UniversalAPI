import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const DB_FILE = path.join(__dirname, '../../local_database.json');

// Interface defining the local database file shape
interface FallbackSchema {
  users: any[];
  organizations: any[];
  orgMembers: any[];
  integrations: any[];
  contacts: any[];
  companies: any[];
  deals: any[];
  apiLogs: any[];
  refreshTokens: any[];
  projects: any[];
  projectAssignments: any[];
  approvalRequests: any[];
  documents: any[];
}

class DatabaseFallback {
  private data: FallbackSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): FallbackSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          organizations: parsed.organizations || [],
          orgMembers: parsed.orgMembers || [],
          integrations: parsed.integrations || [],
          contacts: parsed.contacts || [],
          companies: parsed.companies || [],
          deals: parsed.deals || [],
          apiLogs: parsed.apiLogs || [],
          refreshTokens: parsed.refreshTokens || [],
          projects: parsed.projects || [],
          projectAssignments: parsed.projectAssignments || [],
          approvalRequests: parsed.approvalRequests || [],
          documents: parsed.documents || [],
        };
      }
    } catch (err) {
      logger.error('Failed to read local fallback database file:', err);
    }
    // Initialize default seed data if no local database exists
    const defaultData: FallbackSchema = {
      users: [
        {
          id: 'dev-mock-user-001',
          email: 'admin@unifiedcrm.io',
          name: 'Admin User',
          passwordHash: '$2a$10$bMPdlWrre.Bw/F5oztARGOn4aHfL43bP9g35Oo8Vmvx3eZeu.GjZ2', // mock bcrypt hash for UnifiedCRM2026!Secured
          role: 'CTO',
          department: 'Engineering',
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      organizations: [
        {
          id: 'dev-mock-org-001',
          name: 'Acme Dev Org',
          domain: 'unifiedcrm.io',
          ownerId: 'dev-mock-user-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      orgMembers: [
        {
          id: 'dev-mock-member-001',
          userId: 'dev-mock-user-001',
          organizationId: 'dev-mock-org-001',
          role: 'owner',
          joinedAt: new Date().toISOString(),
        }
      ],
      integrations: [],
      contacts: [],
      companies: [],
      deals: [],
      apiLogs: [],
      refreshTokens: [],
      projects: [
        {
          id: 'proj-mock-001',
          name: 'Core Sync Portal',
          description: 'SaaS normalizer synchronization platform API gateway integration.',
          organizationId: 'dev-mock-org-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      projectAssignments: [
        {
          id: 'assign-mock-001',
          projectId: 'proj-mock-001',
          userId: 'dev-mock-user-001',
          assignedAt: new Date().toISOString()
        }
      ],
      approvalRequests: [],
      documents: []
    };
    this.saveDatabase(defaultData);
    return defaultData;
  }

  private saveDatabase(dataToSave: FallbackSchema = this.data): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Failed to write to local fallback database file:', err);
    }
  }

  // Model simulator factory helper
  private createModelProxy(tableName: keyof FallbackSchema) {
    const self = this;
    return {
      async findUnique(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const records = self.data[tableName];
        const match = records.find(r => self.matchQuery(r, where));
        if (!match) return null;
        const cloned = self.clone(match);
        return self.resolveIncludes(tableName, cloned, args?.include);
      },
      async findFirst(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const records = self.data[tableName];
        const match = records.find(r => self.matchQuery(r, where));
        if (!match) return null;
        const cloned = self.clone(match);
        return self.resolveIncludes(tableName, cloned, args?.include);
      },
      async findMany(args: any) {
        self.data = self.loadDatabase();
        let records = self.data[tableName];
        const where = args?.where || {};
        
        // Filter records
        records = records.filter(r => self.matchQuery(r, where));
        
        // Handle sorting (default desc by createdAt)
        if (args?.orderBy) {
          const field = Object.keys(args.orderBy)[0];
          const direction = args.orderBy[field];
          records.sort((a, b) => {
            const valA = a[field] || '';
            const valB = b[field] || '';
            if (direction === 'desc') {
              return valA > valB ? -1 : valA < valB ? 1 : 0;
            } else {
              return valA > valB ? 1 : valA < valB ? -1 : 0;
            }
          });
        }
        
        // Handle skip/take pagination
        if (typeof args?.skip === 'number') {
          records = records.slice(args.skip);
        }
        if (typeof args?.take === 'number') {
          records = records.slice(0, args.take);
        }
        
        return records.map(r => {
          const cloned = self.clone(r);
          return self.resolveIncludes(tableName, cloned, args?.include);
        });
      },
      async create(args: any) {
        self.data = self.loadDatabase();
        const data = args?.data || {};
        
        // Generate new record mapping Prisma fields
        const newRecord = {
          id: data.id || `${tableName.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Convert nested date fields if necessary
        for (const key of Object.keys(newRecord)) {
          if (newRecord[key] instanceof Date) {
            newRecord[key] = newRecord[key].toISOString();
          }
        }

        self.data[tableName].push(newRecord);
        self.saveDatabase();
        return self.clone(newRecord);
      },
      async update(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const data = args?.data || {};
        const idx = self.data[tableName].findIndex(r => self.matchQuery(r, where));
        if (idx === -1) {
          throw new Error(`Record not found in ${tableName} for update`);
        }
        const updated = {
          ...self.data[tableName][idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        for (const key of Object.keys(updated)) {
          if (updated[key] instanceof Date) {
            updated[key] = updated[key].toISOString();
          }
        }
        self.data[tableName][idx] = updated;
        self.saveDatabase();
        return self.clone(updated);
      },
      async updateMany(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const data = args?.data || {};
        let count = 0;
        self.data[tableName] = self.data[tableName].map(r => {
          if (self.matchQuery(r, where)) {
            count++;
            return {
              ...r,
              ...data,
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        });
        self.saveDatabase();
        return { count };
      },
      async upsert(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const update = args?.update || {};
        const create = args?.create || {};
        
        const idx = self.data[tableName].findIndex(r => self.matchQuery(r, where));
        if (idx !== -1) {
          // Perform Update
          const updated = {
            ...self.data[tableName][idx],
            ...update,
            updatedAt: new Date().toISOString(),
          };
          self.data[tableName][idx] = updated;
          self.saveDatabase();
          return self.clone(updated);
        } else {
          // Perform Create
          const newRecord = {
            id: create.id || `${tableName.slice(0, -1)}-${Date.now()}`,
            ...create,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          self.data[tableName].push(newRecord);
          self.saveDatabase();
          return self.clone(newRecord);
        }
      },
      async delete(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const idx = self.data[tableName].findIndex(r => self.matchQuery(r, where));
        if (idx === -1) {
          throw new Error(`Record not found in ${tableName} for delete`);
        }
        const record = self.data[tableName].splice(idx, 1)[0];
        self.saveDatabase();
        return self.clone(record);
      },
      async deleteMany(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const initialLen = self.data[tableName].length;
        self.data[tableName] = self.data[tableName].filter(r => !self.matchQuery(r, where));
        self.saveDatabase();
        return { count: initialLen - self.data[tableName].length };
      },
      async count(args: any) {
        self.data = self.loadDatabase();
        const where = args?.where || {};
        const records = self.data[tableName].filter(r => self.matchQuery(r, where));
        return records.length;
      },
      async groupBy(args: any) {
        self.data = self.loadDatabase();
        const by: string[] = args?.by || [];
        const where = args?.where || {};
        const records = self.data[tableName].filter(r => self.matchQuery(r, where));
        
        // Simple mock group-by aggregator
        const groups: Record<string, any> = {};
        for (const r of records) {
          const key = by.map(f => String(r[f])).join('::');
          if (!groups[key]) {
            groups[key] = {
              _count: 0,
              _avg: {},
              _sum: {},
              records: [],
            };
            by.forEach(f => { groups[key][f] = r[f]; });
          }
          groups[key]._count++;
          groups[key].records.push(r);
        }

        // Apply aggregators if requested
        return Object.values(groups).map((g: any) => {
          const res: any = {};
          by.forEach(f => { res[f] = g[f]; });
          
          if (args?._count) {
            res._count = typeof args._count === 'boolean' ? g._count : { id: g._count };
          }
          if (args?._avg) {
            const avgField = Object.keys(args._avg)[0];
            const sum = g.records.reduce((acc: number, cur: any) => acc + (Number(cur[avgField]) || 0), 0);
            res._avg = { [avgField]: sum / g._count };
          }
          return res;
        });
      }
    };
  }

  // Deep clone helper to prevent direct reference leaks
  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // Query matching matcher
  private matchQuery(record: any, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      const val = where[key];
      
      // Handle special unique compound keys like userId_provider or email
      if (key === 'userId_provider' && val) {
        if (record.userId !== val.userId || record.provider !== val.provider) {
          return false;
        }
        continue;
      }
      if (key === 'userId_organizationId' && val) {
        if (record.userId !== val.userId || record.organizationId !== val.organizationId) {
          return false;
        }
        continue;
      }

      // Handle OR clause
      if (key === 'OR' && Array.isArray(val)) {
        const anyMatch = val.some((subWhere: any) => this.matchQuery(record, subWhere));
        if (!anyMatch) return false;
        continue;
      }

      // Handle contains mode/insensitive
      if (val && typeof val === 'object' && 'contains' in val) {
        const searchStr = String(val.contains).toLowerCase();
        const recordVal = String(record[key] || '').toLowerCase();
        if (!recordVal.includes(searchStr)) {
          return false;
        }
        continue;
      }

      // Exact match check
      if (record[key] !== val) {
        return false;
      }
    }
    return true;
  }

  private resolveIncludes(tableName: string, record: any, include: any): any {
    if (!record || !include) return record;

    if (tableName === 'users' && include.memberships) {
      const orgMembers = this.data.orgMembers || [];
      let matches = orgMembers.filter(m => m.userId === record.id);
      if (typeof include.memberships === 'object' && include.memberships.take) {
        matches = matches.slice(0, include.memberships.take);
      }
      record.memberships = matches.map(m => this.clone(m));
    }

    if (tableName === 'refreshTokens' && include.user) {
      const users = this.data.users || [];
      const userMatch = users.find(u => u.id === record.userId);
      if (userMatch) {
        const clonedUser = this.clone(userMatch);
        if (typeof include.user === 'object' && include.user.include) {
          this.resolveIncludes('users', clonedUser, include.user.include);
        }
        record.user = clonedUser;
      }
    }

    if (tableName === 'projectAssignments' && include.project) {
      const projects = this.data.projects || [];
      const projMatch = projects.find(p => p.id === record.projectId);
      if (projMatch) {
        record.project = this.clone(projMatch);
      }
    }

    return record;
  }

  // Expose root model proxies
  get user() { return this.createModelProxy('users'); }
  get organization() { return this.createModelProxy('organizations'); }
  get orgMember() { return this.createModelProxy('orgMembers'); }
  get providerConnection() { return this.createModelProxy('integrations'); }
  get integration() { return this.createModelProxy('integrations'); }
  get contact() { return this.createModelProxy('contacts'); }
  get company() { return this.createModelProxy('companies'); }
  get deal() { return this.createModelProxy('deals'); }
  get apiLog() { return this.createModelProxy('apiLogs'); }
  get refreshToken() { return this.createModelProxy('refreshTokens'); }
  get project() { return this.createModelProxy('projects'); }
  get projectAssignment() { return this.createModelProxy('projectAssignments'); }
  get approvalRequest() { return this.createModelProxy('approvalRequests'); }
  get document() { return this.createModelProxy('documents'); }

  // Expose top level helper functions
  async $connect() { return Promise.resolve(); }
  async $disconnect() { return Promise.resolve(); }
  async $transaction(callback: (tx: any) => Promise<any>) {
    return callback(this);
  }
}

export const dbFallback = new DatabaseFallback();
