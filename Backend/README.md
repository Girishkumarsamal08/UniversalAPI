# Unified CRM API — Backend

> A production-ready Node.js/TypeScript backend that unifies HubSpot, Salesforce, and Pipedrive into a single REST API.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env .env.local
# Edit .env with your PostgreSQL URL and secrets

# 3. Generate Prisma client
npm run prisma:generate

# 4. Push schema to database
npm run prisma:push

# 5. Seed with demo data
npm run seed

# 6. Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/               # Register, Login, JWT
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   ├── contacts/           # Unified Contacts API
│   │   ├── contacts.service.ts
│   │   ├── contacts.controller.ts
│   │   └── contacts.routes.ts
│   ├── companies/          # Unified Companies API
│   │   ├── companies.service.ts
│   │   ├── companies.controller.ts
│   │   └── companies.routes.ts
│   ├── providers/          # CRM Provider Adapters
│   │   ├── crm.provider.interface.ts  ← INTERFACE (all adapters implement this)
│   │   ├── mock.adapter.ts            ← WORKING mock data
│   │   ├── hubspot.adapter.ts         ← STUB (Swayamsuchee)
│   │   ├── salesforce.adapter.ts      ← STUB (Swayamsuchee)
│   │   ├── pipedrive.adapter.ts       ← STUB (Swayamsuchee)
│   │   ├── provider.registry.ts       ← resolves correct adapter
│   │   └── providers.routes.ts
│   ├── database/
│   │   ├── prisma.client.ts
│   │   └── seed.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts          ← JWT validation
│   │   ├── rateLimit.middleware.ts     ← rate limiting
│   │   ├── error.middleware.ts         ← global error handler
│   │   └── logging.middleware.ts       ← DB request logs
│   ├── schemas/
│   │   ├── unified.types.ts            ← Contact, Company DTOs
│   │   └── validation.schemas.ts       ← Zod validators
│   ├── services/
│   │   ├── jwt.service.ts
│   │   ├── auth.service.ts
│   │   └── swagger.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── response.helper.ts
│   ├── app.ts              ← Express app factory
│   └── server.ts           ← Entry point
├── prisma/
│   └── schema.prisma       ← All database tables
├── .env                    ← Environment variables
├── package.json
└── tsconfig.json
```

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Create account |
| POST | `/api/v1/auth/login` | ❌ | Login → JWT |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh tokens |
| POST | `/api/v1/auth/logout` | ✅ | Revoke all tokens |
| GET | `/api/v1/auth/me` | ✅ | Get profile |
| GET | `/api/v1/contacts` | ✅ | List contacts (paginated) |
| GET | `/api/v1/contacts/:id` | ✅ | Get contact by ID |
| POST | `/api/v1/contacts` | ✅ | Create contact |
| GET | `/api/v1/companies` | ✅ | List companies (paginated) |
| GET | `/api/v1/companies/:id` | ✅ | Get company by ID |
| POST | `/api/v1/companies` | ✅ | Create company |
| GET | `/api/v1/providers` | ✅ | List provider connection status |

## 📚 Documentation

Once running, visit: **http://localhost:3000/api/docs**

## 🧪 Testing with Postman

1. `POST /api/v1/auth/login` with `{ "email": "admin@unifiedcrm.io", "password": "Password123" }`
2. Copy the `accessToken` from the response
3. Add `Authorization: Bearer <token>` header to all other requests
4. `GET /api/v1/contacts?provider=mock` returns mock data immediately

## 🗄️ Database Tables

- `users` — registered users
- `organizations` — orgs (created on register)
- `org_members` — user ↔ org many-to-many
- `provider_connections` — OAuth tokens per provider
- `contacts` — unified contacts (synced from providers)
- `companies` — unified companies (synced from providers)
- `api_logs` — every API request logged
- `refresh_tokens` — JWT refresh token store

## 🔌 Provider Adapters (for Swayamsuchee)

Each provider must implement the `CRMProvider` interface in `src/providers/crm.provider.interface.ts`:

```typescript
interface CRMProvider {
  getContacts(options?): Promise<Contact[]>;
  getContactById(externalId): Promise<Contact | null>;
  createContact(data): Promise<Contact>;
  getCompanies(options?): Promise<Company[]>;
  getCompanyById(externalId): Promise<Company | null>;
  createCompany(data): Promise<Company>;
  testConnection(): Promise<boolean>;
}
```

Fill in the stubs: `hubspot.adapter.ts`, `salesforce.adapter.ts`, `pipedrive.adapter.ts`
