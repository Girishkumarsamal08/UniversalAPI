<p align="center">
  <img src="logo.png" width="140" alt="Universal API Logo" />
</p>

<h1 align="center">Universal CRM Gateway</h1>

<p align="center">
  <strong>Universal API &amp; Integration Gateway — Connect Business SaaS Tools to One Normalized Interface.</strong>
</p>

<p align="center">
  <a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-Gateway-blueviolet?style=for-the-badge" alt="Architecture" /></a>
  <a href="#-mvp-integration-catalog"><img src="https://img.shields.io/badge/Catalog-12%20MVP%20Providers-blue?style=for-the-badge" alt="Catalog" /></a>
  <a href="#-security--encryption"><img src="https://img.shields.io/badge/Security-AES--256%20GCM-green?style=for-the-badge" alt="Security" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 1. Product Purpose & Architecture

The **Universal CRM Gateway** is an integration and data normalization gateway. Companies connect their existing SaaS tools to our Universal API instead of building separate custom integrations for every third-party provider.

The external providers remain the primary systems of record. The gateway standardizes, normalizes, authenticates, and synchronizes data into a single unified schema.

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   HubSpot    │ │  Salesforce  │ │  Pipedrive   │ │   Zoho CRM   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐
│    Slack     │ │   MS Teams   │ │    Gmail     │ │  MS Outlook  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐
│ Google Cal   │ │ Outlook Cal  │ │   Calendly   │ │    Notion    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       └────────────────┼────────────────┼────────────────┘
                        ▼
            ┌───────────────────────┐
            │ UNIVERSAL API GATEWAY │
            │  OAuth 2.0 Engine     │
            │  AES-256 Vault        │
            │  Normalization Layer  │
            └───────────┬───────────┘
                        ▼
       Normalized Universal Schema & REST API
     ┌───────────┬────────────┬──────────┐
     ▼           ▼            ▼          ▼
  Contacts   Companies      Deals     Activities
```

---

## 2. Final MVP Integration Catalog

The integration catalog focuses on 5 core verticals:

### 💼 CRM Platforms
1. **HubSpot** (`OAuth 2.0`): Contacts, Companies, Deals, Pipelines, Activities
2. **Salesforce** (`OAuth 2.0`): Leads, Contacts, Accounts, Opportunities, Cases
3. **Pipedrive** (`OAuth 2.0`): Persons, Organizations, Deals, Pipelines, Activities
4. **Zoho CRM** (`OAuth 2.0`): Contacts, Leads, Accounts, Deals, Pipelines, Activities
5. **Developer Sandbox** (`Mock Mode`): Full simulated dataset for offline testing without credentials.

### 💬 Communication
6. **Slack** (`OAuth 2.0`): Channels, Messages, Notifications, Webhooks
7. **Microsoft Teams** (`Microsoft OAuth / Graph`): Teams, Channels, Messages, Notifications

### 📧 Email
8. **Gmail / Google Workspace** (`Google OAuth 2.0`): Emails, Threads, Attachments, Labels
9. **Microsoft Outlook** (`Microsoft OAuth / Graph`): Emails, Threads, Attachments, Folders

### 📅 Calendar
10. **Google Calendar** (`Google OAuth 2.0`): Events, Availability, Scheduling, Reminders
11. **Outlook Calendar** (`Microsoft OAuth / Graph`): Events, Availability, Scheduling, Reminders
12. **Calendly** (`OAuth 2.0`): Events, Invitees, Availability, Scheduling

### 📝 Productivity
13. **Notion** (`OAuth 2.0`): Pages, Databases, Blocks, Users

---

## 3. Provider Status Lifecycle (13 States)

Every provider is tracked across 13 distinct status states:

| Status | Indicator | Description |
|---|---|---|
| `NOT_CONNECTED` | `○ Not Connected` | Provider credentials configured, awaiting user authorization |
| `CONFIGURATION_REQUIRED` | `🔧 Configuration required` | Provider OAuth credentials missing in `.env` |
| `CONNECTING` | `● Connecting...` | OAuth authorization popup opened |
| `AUTHORIZING` | `● Authorizing...` | Provider exchange in progress |
| `CONNECTED` | `● Connected` | Active valid connection |
| `SYNCING` | `● Syncing...` | Normalization sync job in progress |
| `SYNC_SUCCESS` | `● Sync complete` | Last sync completed successfully |
| `TOKEN_EXPIRED` | `⚠ Token Expired` | Access token expired, awaiting automatic or manual renewal |
| `REAUTH_REQUIRED` | `⚠ Reauth required` | Refresh token expired or revoked |
| `CONNECTION_ERROR` | `⚠ Connection error` | Provider returned error code |
| `DISCONNECTING` | `● Disconnecting...` | Token invalidation in progress |
| `DISCONNECTED` | `○ Disconnected` | Connection removed by user |
| `REVOKED` | `⚠ Revoked` | Authorization revoked at provider portal |

---

## 4. OAuth 2.0 Security & Token Handling

- **Zero Secret Exposure**: Client Secrets, Access Tokens, and Refresh Tokens are strictly server-side and never returned to the frontend.
- **AES-256-GCM Encryption**: All access and refresh tokens stored in the database are encrypted at rest using `aes-256-gcm`.
- **CSRF State Validation**: OAuth connection requests generate secure single-use state tokens validated on callback.
- **Proactive Token Refresh**: Background daemon scans every 5 minutes and renews tokens expiring within 15 minutes.
- **Data Retention Choices**: When disconnecting a provider, users can choose between permanently purging synced data or retaining records for historical reporting.

---

## 5. Environment Configuration (`Backend/.env`)

```env
# Server
PORT=3000
NODE_ENV=development
API_VERSION=v1
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Database & Authentication
DATABASE_URL="postgresql://postgres:password@localhost:5432/unified_crm_db?schema=public"
JWT_SECRET=your_32_char_jwt_secret
JWT_REFRESH_SECRET=your_32_char_jwt_refresh_secret
ENCRYPTION_KEY=your_32_char_aes_encryption_key

# 1. HubSpot
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/v1/integrations/hubspot/callback

# 2. Salesforce
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_REDIRECT_URI=http://localhost:3000/api/v1/integrations/salesforce/callback

# 3. Pipedrive
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=http://localhost:3000/api/v1/integrations/pipedrive/callback

# 4. Zoho CRM
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REDIRECT_URI=http://localhost:3000/api/v1/integrations/zoho/callback

# 5. Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3000/api/v1/integrations/slack/callback

# 6. Microsoft Graph (Teams, Outlook, Outlook Calendar)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/v1/integrations/teams/callback

# 7. Google Workspace (Gmail, Google Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/integrations/gmail/callback

# 8. Calendly
CALENDLY_CLIENT_ID=
CALENDLY_CLIENT_SECRET=
CALENDLY_REDIRECT_URI=http://localhost:3000/api/v1/integrations/calendly/callback

# 9. Notion
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=http://localhost:3000/api/v1/integrations/notion/callback
```

---

## 6. Quick Start & Local Testing

### Backend
```bash
cd Backend
npm install
npm run dev
```
- API Base: `http://localhost:3000/api/v1`
- Swagger Docs: `http://localhost:3000/api/docs`
- Health: `http://localhost:3000/health`

### Frontend
```bash
cd Frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 7. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/integrations` | `GET` | Retrieve list of integrations with connection metadata |
| `/api/v1/integrations/metadata` | `GET` | Public provider catalog metadata |
| `/api/v1/integrations/:provider/status` | `GET` | Get status for a specific provider |
| `/api/v1/integrations/:provider/connect` | `GET/POST` | Generate OAuth URL or submit credentials |
| `/api/v1/integrations/:provider/callback` | `GET` | OAuth code exchange callback with CSRF check |
| `/api/v1/integrations/:provider/sync` | `POST` | Trigger normalization data synchronization |
| `/api/v1/integrations/:provider/disconnect` | `POST` | Disconnect with data retention option |
| `/api/v1/contacts` | `GET/POST` | Normalized Contacts across all connected sources |
| `/api/v1/companies` | `GET/POST` | Normalized Companies across all connected sources |
| `/api/v1/deals` | `GET` | Normalized Deals across CRM providers |
