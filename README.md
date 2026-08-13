<p align="center">
  <img src="logo.png" width="140" alt="Universal API Logo" />
</p>

<h1 align="center">Universal API</h1>

<p align="center">
  <strong>One API. Every CRM. Zero vendor lock-in.</strong>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-▶-blue?style=for-the-badge" alt="Quick Start" /></a>
  <a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-🏗-blueviolet?style=for-the-badge" alt="Architecture" /></a>
  <a href="#-api-reference"><img src="https://img.shields.io/badge/API%20Docs-📖-green?style=for-the-badge" alt="API Docs" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/15K+ Lines-of_Code-orange" alt="Lines of Code" />
</p>

---

## What is Universal API?

Universal API is a **unified integration platform** that lets businesses connect multiple SaaS providers — CRMs, email, calendars, payment gateways, e-commerce — through a **single, standardized API layer**.

Instead of writing separate integrations for HubSpot, Salesforce, Pipedrive, Gmail, Shopify, Razorpay, and a dozen other systems, you write **one API call** and the platform handles the rest:

```
GET /api/v1/contacts → Returns normalized contacts from HubSpot, Salesforce, or Pipedrive
```

The platform sits in the middle:

```
                   ┌─────────────────────────┐
                   │     YOUR APPLICATION     │
                   └───────────┬─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    UNIVERSAL API     │
                    │   Normalize · Auth   │
                    │   Sync · Log · Map   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────▼─────┐       ┌─────▼─────┐        ┌─────▼─────┐
    │  HubSpot  │       │Salesforce │        │ Pipedrive │
    │  Gmail    │       │  Outlook  │        │  Shopify  │
    │  Stripe   │       │  Razorpay │        │  Slack    │
    └───────────┘       └───────────┘        └───────────┘
```

---

## ✨ Features

### 🔗 Integration Lifecycle Engine

Every integration follows a complete OAuth lifecycle with **7 distinct states**:

| State | What's happening |
|-------|-----------------|
| `Not Connected` | Provider available, no auth yet |
| `Connecting` | OAuth redirect in progress |
| `Connected` | Tokens stored, API access active |
| `Syncing` | Background data fetch running |
| `Expired` | Access token expired, auto-refresh attempted |
| `Revoked` | Authorization invalidated at provider side |
| `Connection Failed` | Auth or sync error occurred |

**Token lifecycle is fully automated** — a background scheduler proactively refreshes tokens 15 minutes before expiry. Users rarely need to reconnect.

### 🔌 22 Provider Integrations

| Category | Providers | Status |
|----------|-----------|--------|
| **CRM** | HubSpot, Salesforce, Pipedrive, Zoho CRM, Microsoft Dynamics 365 | ✅ / 🔜 |
| **Email** | Gmail & Google Workspace, Microsoft Outlook | ✅ |
| **Calendar** | Google Calendar, Outlook 365 Calendar | ✅ |
| **Payments** | Stripe, Razorpay, PayPal | ✅ |
| **E-Commerce** | Shopify, WooCommerce, Amazon, Flipkart | ✅ / 🔜 |
| **Communication** | Slack, Discord | ✅ / 🔜 |
| **Automation** | Zapier | ✅ |
| **Sandbox** | Mock Provider (no credentials needed) | ✅ |

Each provider has its own **OAuth configuration** with typed endpoints, scopes, and revocation URLs. No giant `if/else` chains.

### 🧬 Declarative Data Normalization

Provider-specific fields are mapped to a **unified schema** using JSON mapping configs:

```json
// HubSpot → Universal API
{
  "contact": {
    "name": { "type": "join", "fields": ["properties.firstname", "properties.lastname"] },
    "email": "properties.email",
    "phone": "properties.phone",
    "jobTitle": "properties.jobtitle"
  }
}
```

The same `Contact` object comes out the same regardless of source:

```json
{
  "id": "universal_abc123",
  "name": "Sarah Connor",
  "email": "sarah@skynet.com",
  "provider": "hubspot",
  "_raw_passthrough": { /* original HubSpot payload */ }
}
```

The `_raw_passthrough` field always carries the unmodified upstream response — nothing is ever silently dropped.

### 🏢 Multi-Tenant Organization Model

- **Organizations** with owner, admin, and member roles
- **RBAC** (Role-Based Access Control) with 7 configurable roles: CTO, CEO, Admin, Regional Head, Senior Developer, Support Engineer, Employee
- **Approval workflows** — non-admin users submit integration requests that require admin approval
- **Department-based access** restrictions on sensitive endpoints
- **Configurable tab scoping** — admins control which dashboard sections each role can see

### 🔐 Security

- **JWT authentication** with access + refresh token rotation
- **Helmet** security headers
- **Rate limiting** (configurable per-window)
- **CORS whitelist**
- **Zod validation** on all request bodies
- **Tokens stored server-side only** — never exposed to the browser
- **Provider-side revocation** on disconnect (Salesforce, Zoho, Google, Slack, Stripe)
- **Graceful shutdown** with connection cleanup

### 📊 Built-in Analytics & Logging

Every API call and integration event is logged:

```
11:32:04  HubSpot     OAuth Authorization    SUCCESS
11:32:10  HubSpot     Token Exchange         SUCCESS
11:32:15  HubSpot     Contacts Sync          SUCCESS   248 records
11:32:17  HubSpot     Companies Sync         SUCCESS   41 records
12:10:41  HubSpot     Disconnect             SUCCESS
```

The dashboard surfaces:
- Connected provider count, total synced records
- Per-provider data distribution breakdown
- API request logs with latency, status codes, error traces
- Real-time sync progress

### 🧪 Developer Sandbox

The **Mock Provider** ships with the platform. No API keys, no OAuth, no credentials — just connect and start testing. Every endpoint returns realistic sample data so you can build your frontend before connecting a single real provider.

---

## 🏗 Architecture

### Backend

```
Backend/
├── prisma/
│   └── schema.prisma              # 12 models (User, Org, Integration, Contact, Company, Deal, ...)
├── src/
│   ├── server.ts                  # Entry point + graceful shutdown
│   ├── app.ts                     # Express app factory + middleware stack
│   ├── auth/                      # JWT auth, registration, approval workflows
│   ├── contacts/                  # CRUD + provider-aware queries
│   ├── companies/                 # CRUD + provider-aware queries
│   ├── deals/                     # CRUD + provider-aware queries
│   ├── providers/
│   │   ├── crm.provider.interface.ts   # Adapter contract (getContacts, getCompanies, getDeals, testConnection)
│   │   ├── hubspot.adapter.ts          # HubSpot API ↔ Unified schema
│   │   ├── salesforce.adapter.ts       # Salesforce API ↔ Unified schema
│   │   ├── pipedrive.adapter.ts        # Pipedrive API ↔ Unified schema
│   │   ├── zoho.adapter.ts             # Zoho CRM API ↔ Unified schema
│   │   ├── mock.adapter.ts             # Static test data adapter
│   │   ├── mapper.ts                   # Declarative JSON→schema transform engine
│   │   ├── mappings/                   # Per-provider JSON mapping configs
│   │   └── provider.registry.ts        # Resolves adapter by name + user tokens
│   ├── modules/
│   │   ├── integrations/
│   │   │   ├── integration.types.ts       # 7-state lifecycle types
│   │   │   ├── provider-metadata.ts       # 22-provider registry
│   │   │   ├── oauth-config.ts            # Typed OAuth configs per provider
│   │   │   ├── integration.service.ts     # OAuth flows, sync, revocation, token refresh
│   │   │   ├── integration.controller.ts  # HTTP handlers
│   │   │   └── integration.routes.ts      # Route registration
│   │   ├── erp/                     # ERP modules (Inventory, Finance, HR, Orders)
│   │   └── documents/               # Document parsing
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT verification
│   │   ├── rbac.middleware.ts        # Role & department access control
│   │   ├── rateLimit.middleware.ts   # Express rate limiting
│   │   ├── logging.middleware.ts     # Request logging to DB
│   │   └── error.middleware.ts       # Global error handler
│   ├── services/
│   │   ├── auth.service.ts           # Password hashing, user management
│   │   ├── jwt.service.ts            # Token generation + role permissions map
│   │   └── swagger.service.ts        # OpenAPI documentation
│   ├── schemas/
│   │   ├── unified.types.ts          # Contact, Company, Deal canonical shapes
│   │   └── validation.schemas.ts     # Zod request validation
│   ├── analytics/                    # Aggregation endpoints
│   ├── logs/                         # API log queries
│   ├── projects/                     # Workspace project management
│   └── utils/                        # Logger, response helpers
```

### Frontend

```
Frontend/
├── src/
│   ├── App.jsx          # Single-file enterprise dashboard (~6000 lines)
│   ├── index.css         # Global styles
│   └── main.jsx          # React entry
├── vite.config.js        # Vite build config
└── vercel.json           # Production deployment proxy rules
```

The dashboard includes **24 interactive sections**:

| Section | Description |
|---------|-------------|
| Dashboard | KPIs, charts, at-a-glance metrics |
| CTO ERP Console | Executive resource planning view |
| AI Document Parser | PDF upload and extraction |
| Contacts | Searchable, provider-tagged contact list |
| Companies | Company directory with industry/size |
| Integrations | 22-provider marketplace with 7-state cards |
| Workspace Projects | Project management with assignments |
| Feature Matrix | Schema builder, AES encryption demo, mock sandbox, token refresh sim |
| API Playground | Postman-like HTTP request builder |
| End-to-End Flow | Visual integration flow walkthrough |
| Architecture | System architecture diagrams |
| Normalization Explorer | Compare raw vs normalized data |
| Technical Challenges | Problem-solution documentation |
| Developer Experience | DX tooling showcase |
| Future Roadmap | Product roadmap |
| Team & Ownership | Team structure |
| Enterprise Specs | Enterprise compliance specs |
| Documentation | Auto-generated API docs |
| Request Logs | Real-time API audit trail |
| Analytics | Provider distribution, sync metrics |
| ERP: Inventory | Inventory management module |
| ERP: Finance | Financial ledger |
| ERP: HR | Human resources module |
| ERP: Order Queue | Order processing pipeline |
| Platform Config | RBAC scoping matrix editor |

### Database Schema

12 PostgreSQL tables managed by Prisma:

```
User ──┬── OrgMember ──── Organization
       │                      │
       ├── Integration         ├── Contact
       ├── RefreshToken        ├── Company
       └── ApiLog              ├── Deal
                               └── Project ── ProjectAssignment

ApprovalRequest (standalone)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (or run in mock mode without a database)
- **npm** ≥ 9

### 1. Clone

```bash
git clone https://github.com/Girishkumarsamal08/UniversalAPI.git
cd UniversalAPI
```

### 2. Install Dependencies

```bash
# Root (concurrently for dev mode)
npm install

# Backend
cd Backend && npm install

# Frontend
cd ../Frontend && npm install
cd ..
```

### 3. Configure Environment

```bash
cp Backend/.env.example Backend/.env
# OR create Backend/.env manually:
```

```env
# Required
DATABASE_URL="postgresql://postgres:password@localhost:5432/unified_crm_db?schema=public"
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Optional — without these, providers fall back to simulation mode
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
```

### 4. Database Setup

```bash
cd Backend
npx prisma generate
npx prisma db push       # Creates tables
npx prisma db seed       # Optional: seed sample data
```

> **No database?** The server starts in mock mode automatically. You'll get a warning but everything works with the Mock provider.

### 5. Run

```bash
# From project root — starts both backend and frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/health |

---

## 📖 API Reference

### Authentication

```bash
# Register
POST /api/v1/auth/register
{ "name": "Girish", "email": "girish@example.com", "password": "Secret123!" }

# Login → returns JWT tokens
POST /api/v1/auth/login
{ "email": "girish@example.com", "password": "Secret123!" }

# Refresh
POST /api/v1/auth/refresh
{ "refreshToken": "..." }
```

### Contacts

```bash
GET    /api/v1/contacts              # List all (paginated, searchable)
GET    /api/v1/contacts/:id          # Get one
POST   /api/v1/contacts              # Create
PATCH  /api/v1/contacts/:id          # Update
DELETE /api/v1/contacts/:id          # Delete
```

### Companies & Deals

Same CRUD pattern as contacts:
```
/api/v1/companies
/api/v1/deals
```

### Integrations

```bash
GET    /api/v1/integrations              # List all providers + status
GET    /api/v1/integrations/metadata     # Public provider catalog (no auth)
GET    /api/v1/integrations/:provider/status    # Single provider status
POST   /api/v1/integrations/:provider/connect   # Start OAuth or submit credentials
POST   /api/v1/integrations/:provider/disconnect # Disconnect + optional data retention
POST   /api/v1/integrations/:provider/sync      # Trigger data sync
```

### Other Endpoints

```bash
GET    /api/v1/logs                  # API request audit trail
GET    /api/v1/analytics             # Dashboard analytics
GET    /api/v1/projects              # Workspace projects
POST   /api/v1/approvals/:id/resolve # Approve/reject integration requests
```

All endpoints return a consistent response shape:

```json
{
  "success": true,
  "data": { ... },
  "message": "Contacts retrieved",
  "timestamp": "2026-08-13T06:00:00.000Z"
}
```

---

## 🔧 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js + TypeScript | Type safety across the stack |
| **API** | Express.js | Battle-tested, massive ecosystem |
| **Database** | PostgreSQL + Prisma ORM | Typed queries, migrations, studio |
| **Auth** | JWT (access + refresh) + bcrypt | Stateless auth with rotation |
| **Validation** | Zod | Runtime type validation on all inputs |
| **Security** | Helmet + CORS + Rate Limiting | Defense-in-depth |
| **Docs** | Swagger/OpenAPI | Auto-generated API documentation |
| **Logging** | Winston + Morgan | Structured, leveled logging |
| **Frontend** | React 19 + Vite 8 | Fast dev, instant HMR |
| **Icons** | Lucide React | Clean, consistent iconography |
| **Deployment** | Vercel (frontend) + Render (backend) | Zero-config deploy |

---

## 🌐 Deployment

### Production URLs

| Service | URL |
|---------|-----|
| Frontend | Deployed on **Vercel** |
| Backend | Deployed on **Render** (`universalapi-sa2a.onrender.com`) |

The `vercel.json` proxies `/api/v1/*` requests to the Render backend, so the frontend and API share the same domain in production.

### Deploy Your Own

**Backend (Render):**
1. Push to GitHub
2. Connect repo to Render
3. Set build command: `cd Backend && npm install && npx prisma generate && npm run build`
4. Set start command: `cd Backend && npm start`
5. Add environment variables (DATABASE_URL, JWT_SECRET, etc.)

**Frontend (Vercel):**
1. Import repo to Vercel
2. Set output directory: `dist`
3. Set build command: `npm run build`

---

## 🗺 Roadmap

- [ ] Webhook event listeners (real-time sync from providers)
- [ ] Background job queue (Bull/BullMQ for async sync)
- [ ] Incremental sync with cursor-based pagination
- [ ] End-to-end encryption for stored tokens (AES-256-GCM)
- [ ] GraphQL gateway alongside REST
- [ ] Provider health monitoring dashboard
- [ ] Audit log export (CSV/JSON)
- [ ] SSO (SAML/OIDC) for enterprise auth

---

## 👥 Team

Built by **Girish Kumar Samal** and team.

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  <sub>Built with ☕ and an unreasonable amount of TypeScript.</sub>
</p>
