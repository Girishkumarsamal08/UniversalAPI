// Provider Metadata Registry — single source of truth for all integration provider definitions
// This replaces hardcoded provider arrays previously scattered across integration.service.ts and App.jsx

import { ProviderCategory, ProviderMetadata } from './integration.types';

/**
 * Master registry of every provider the platform knows about.
 * Each entry defines display metadata, category, capabilities, and availability.
 *
 * Adding a new provider? Just add an entry here — the frontend and backend
 * both derive their provider list from this file.
 */
export const PROVIDER_REGISTRY: ProviderMetadata[] = [
  // ────────────────────────────────────────────
  // CRM PLATFORMS
  // ────────────────────────────────────────────
  {
    provider: 'hubspot',
    displayName: 'HubSpot',
    category: 'crm',
    description: 'Sync contacts, companies, deals and lifecycle pipelines.',
    capabilities: ['Contacts', 'Companies', 'Deals', 'Pipelines', 'Activities'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['contacts', 'crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.companies.read', 'crm.objects.companies.write'],
  },
  {
    provider: 'salesforce',
    displayName: 'Salesforce',
    category: 'crm',
    description: 'Sync Leads, Contacts, Accounts, Opportunities and enterprise pipelines.',
    capabilities: ['Leads', 'Contacts', 'Accounts', 'Opportunities', 'Cases'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['api', 'refresh_token'],
  },
  {
    provider: 'pipedrive',
    displayName: 'Pipedrive',
    category: 'crm',
    description: 'Sync Persons, Organizations, Deals and Sales pipelines.',
    capabilities: ['Persons', 'Organizations', 'Deals', 'Pipelines', 'Activities'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['deals:read', 'contacts:read', 'organizations:read'],
  },
  {
    provider: 'zoho',
    displayName: 'Zoho CRM',
    category: 'crm',
    description: 'Sync Zoho CRM contacts, deals, accounts and workflow automation.',
    capabilities: ['Contacts', 'Deals', 'Accounts', 'Workflows'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['ZohoCRM.modules.ALL'],
  },
  {
    provider: 'dynamics365',
    displayName: 'Microsoft Dynamics 365',
    category: 'crm',
    description: 'Sync enterprise CRM data including leads, accounts and opportunities.',
    capabilities: ['Leads', 'Accounts', 'Opportunities', 'Cases'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: true,
    scopes: [],
  },

  // ────────────────────────────────────────────
  // COMMUNICATION
  // ────────────────────────────────────────────
  {
    provider: 'slack',
    displayName: 'Slack',
    category: 'communication',
    description: 'Real-time team notification webhooks and CRM deal alerts.',
    capabilities: ['Channel Messages', 'Deal Alerts', 'Notifications'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['channels:read', 'chat:write', 'incoming-webhook'],
  },
  {
    provider: 'discord',
    displayName: 'Discord',
    category: 'communication',
    description: 'Community and team notifications via Discord bot webhooks.',
    capabilities: ['Webhooks', 'Bot Messages', 'Channel Alerts'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: true,
    scopes: [],
  },

  // ────────────────────────────────────────────
  // EMAIL
  // ────────────────────────────────────────────
  {
    provider: 'gmail',
    displayName: 'Gmail & Google Workspace',
    category: 'email',
    description: 'Sync customer email threads, outreach logs, and delivery tracking.',
    capabilities: ['Email Threads', 'Messages', 'Attachments', 'Labels'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },
  {
    provider: 'outlook_mail',
    displayName: 'Microsoft Outlook Email',
    category: 'email',
    description: 'Enterprise Office 365 email sync and thread normalization.',
    capabilities: ['Email Threads', 'Messages', 'Attachments', 'Folders'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['Mail.Read', 'Mail.ReadWrite'],
  },

  // ────────────────────────────────────────────
  // CALENDAR
  // ────────────────────────────────────────────
  {
    provider: 'google_calendar',
    displayName: 'Google Calendar',
    category: 'calendar',
    description: 'Sync meeting schedules, sales demos, and calendar availability.',
    capabilities: ['Events', 'Availability', 'Scheduling', 'Reminders'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  },
  {
    provider: 'outlook_calendar',
    displayName: 'Outlook 365 Calendar',
    category: 'calendar',
    description: 'Enterprise Microsoft 365 calendar scheduling & event sync.',
    capabilities: ['Events', 'Availability', 'Scheduling', 'Reminders'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['Calendars.Read', 'Calendars.ReadWrite'],
  },

  // ────────────────────────────────────────────
  // PAYMENTS
  // ────────────────────────────────────────────
  {
    provider: 'stripe',
    displayName: 'Stripe',
    category: 'payments',
    description: 'Sync payments, subscriptions, invoices and customer billing.',
    capabilities: ['Payments', 'Subscriptions', 'Invoices', 'Customers'],
    oauthVersion: 'OAuth 2.0 / API Key',
    comingSoon: false,
    scopes: ['read_write'],
  },
  {
    provider: 'razorpay',
    displayName: 'Razorpay Gateway',
    category: 'payments',
    description: 'Sync merchant payments, UPI transfers, subscriptions and payout ledgers.',
    capabilities: ['Payments', 'Customers', 'Orders', 'Refunds'],
    oauthVersion: 'API Key',
    comingSoon: false,
    scopes: [],
  },
  {
    provider: 'paypal',
    displayName: 'PayPal',
    category: 'payments',
    description: 'Global transaction processing, merchant payouts and subscription ledgers.',
    capabilities: ['Payments', 'Payouts', 'Subscriptions', 'Disputes'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: [],
  },

  // ────────────────────────────────────────────
  // E-COMMERCE
  // ────────────────────────────────────────────
  {
    provider: 'shopify',
    displayName: 'Shopify',
    category: 'commerce',
    description: 'Sync customer profiles, e-commerce orders and product catalogs.',
    capabilities: ['Customers', 'Orders', 'Products', 'Inventory'],
    oauthVersion: 'OAuth 2.0',
    comingSoon: false,
    scopes: ['read_customers', 'read_orders', 'read_products'],
  },
  {
    provider: 'woocommerce',
    displayName: 'WooCommerce',
    category: 'commerce',
    description: 'WordPress e-commerce order management and product sync.',
    capabilities: ['Customers', 'Orders', 'Products', 'Coupons'],
    oauthVersion: 'API Key',
    comingSoon: true,
    scopes: [],
  },

  // ────────────────────────────────────────────
  // COMING SOON — Specialized integrations
  // ────────────────────────────────────────────
  {
    provider: 'online_banking',
    displayName: 'Corporate Net Banking',
    category: 'payments',
    description: 'Sync IMPS/NEFT/RTGS wire transfers and corporate bank statements.',
    capabilities: ['Wire Transfers', 'Statements', 'Reconciliation'],
    oauthVersion: 'Bank-Specific API',
    comingSoon: true,
    scopes: [],
  },
  {
    provider: 'amazon',
    displayName: 'Amazon Selling Partner',
    category: 'commerce',
    description: 'Merchant fulfillment orders, FBA tracking and inventory ledgers.',
    capabilities: ['Orders', 'Fulfillment', 'Inventory', 'FBA'],
    oauthVersion: 'SP-API / LWA',
    comingSoon: true,
    scopes: [],
  },
  {
    provider: 'flipkart',
    displayName: 'Flipkart Marketplace',
    category: 'commerce',
    description: 'Sync Flipkart merchant orders, customer purchases and inventory.',
    capabilities: ['Orders', 'Products', 'Inventory', 'Returns'],
    oauthVersion: 'Seller API',
    comingSoon: true,
    scopes: [],
  },

  // ────────────────────────────────────────────
  // AUTOMATION
  // ────────────────────────────────────────────
  {
    provider: 'zapier',
    displayName: 'Zapier',
    category: 'automation',
    description: 'Trigger automated Zapier flows on new contacts, deals and order sync events.',
    capabilities: ['Webhooks', 'Triggers', 'Automated Flows'],
    oauthVersion: 'Webhook / API Key',
    comingSoon: false,
    scopes: [],
  },

  // ────────────────────────────────────────────
  // DEVELOPER SANDBOX
  // ────────────────────────────────────────────
  {
    provider: 'mock',
    displayName: 'Developer Sandbox (Mock)',
    category: 'crm',
    description: 'Simulated static CRM data for rapid testing without credentials.',
    capabilities: ['Contacts', 'Companies', 'Deals'],
    oauthVersion: 'Mock Mode',
    comingSoon: false,
    scopes: [],
  },
];

/**
 * Lookup a single provider's metadata
 */
export const getProviderMeta = (provider: string): ProviderMetadata | undefined => {
  return PROVIDER_REGISTRY.find(p => p.provider === provider.toLowerCase());
};

/**
 * Get all provider keys (for default listing)
 */
export const getAllProviderKeys = (): string[] => {
  return PROVIDER_REGISTRY.map(p => p.provider);
};

/**
 * Get providers filtered by category
 */
export const getProvidersByCategory = (category: ProviderCategory): ProviderMetadata[] => {
  return PROVIDER_REGISTRY.filter(p => p.category === category);
};

/**
 * All categories in display order
 */
export const CATEGORY_ORDER: { id: ProviderCategory; label: string }[] = [
  { id: 'crm', label: 'CRM Platforms' },
  { id: 'communication', label: 'Communication' },
  { id: 'email', label: 'Email' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'payments', label: 'Payments' },
  { id: 'commerce', label: 'E-Commerce' },
  { id: 'automation', label: 'Automation' },
];
