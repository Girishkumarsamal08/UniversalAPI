// Provider Metadata Registry — Single source of truth for MVP integrations
// Strictly focused on CRM, Communication, Email, Calendar, and Productivity.

import { ProviderCategory, ProviderMetadata } from './integration.types';

/**
 * Master registry of the 12 MVP providers + Developer Sandbox Mock.
 */
export const PROVIDER_REGISTRY: ProviderMetadata[] = [
  // ────────────────────────────────────────────
  // CRM PLATFORMS
  // ────────────────────────────────────────────
  {
    provider: 'hubspot',
    displayName: 'HubSpot',
    category: 'crm',
    description: 'Sync contacts, companies, deals, pipelines, and lifecycle activities.',
    capabilities: ['Contacts', 'Companies', 'Deals', 'Pipelines', 'Activities'],
    oauthVersion: 'OAuth 2.0',
    scopes: ['contacts', 'crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.companies.read', 'crm.objects.companies.write'],
    clientIdEnvKey: 'HUBSPOT_CLIENT_ID',
    clientSecretEnvKey: 'HUBSPOT_CLIENT_SECRET',
    redirectUriEnvKey: 'HUBSPOT_REDIRECT_URI',
    docsUrl: 'https://developers.hubspot.com/docs/api/overview',
  },
  {
    provider: 'salesforce',
    displayName: 'Salesforce',
    category: 'crm',
    description: 'Sync Leads, Contacts, Accounts, Opportunities, and enterprise cases.',
    capabilities: ['Leads', 'Contacts', 'Accounts', 'Opportunities', 'Cases'],
    oauthVersion: 'OAuth 2.0',
    scopes: ['api', 'refresh_token', 'offline_access'],
    clientIdEnvKey: 'SALESFORCE_CLIENT_ID',
    clientSecretEnvKey: 'SALESFORCE_CLIENT_SECRET',
    redirectUriEnvKey: 'SALESFORCE_REDIRECT_URI',
    docsUrl: 'https://developer.salesforce.com/docs',
  },
  {
    provider: 'pipedrive',
    displayName: 'Pipedrive',
    category: 'crm',
    description: 'Sync Persons, Organizations, Deals, Pipelines, and Sales activities.',
    capabilities: ['Persons', 'Organizations', 'Deals', 'Pipelines', 'Activities'],
    oauthVersion: 'OAuth 2.0',
    scopes: ['contacts:full', 'deals:full'],
    clientIdEnvKey: 'PIPEDRIVE_CLIENT_ID',
    clientSecretEnvKey: 'PIPEDRIVE_CLIENT_SECRET',
    redirectUriEnvKey: 'PIPEDRIVE_REDIRECT_URI',
    docsUrl: 'https://developers.pipedrive.com/docs/api/v1',
  },
  {
    provider: 'zoho',
    displayName: 'Zoho CRM',
    category: 'crm',
    description: 'Sync Zoho CRM contacts, leads, accounts, deals, pipelines, and activities.',
    capabilities: ['Contacts', 'Leads', 'Accounts', 'Deals', 'Pipelines', 'Activities'],
    oauthVersion: 'OAuth 2.0',
    scopes: ['ZohoCRM.modules.ALL'],
    clientIdEnvKey: 'ZOHO_CLIENT_ID',
    clientSecretEnvKey: 'ZOHO_CLIENT_SECRET',
    redirectUriEnvKey: 'ZOHO_REDIRECT_URI',
    docsUrl: 'https://www.zoho.com/crm/developer/docs/api/v2/',
  },

  // ────────────────────────────────────────────
  // COMMUNICATION
  // ────────────────────────────────────────────
  {
    provider: 'slack',
    displayName: 'Slack',
    category: 'communication',
    description: 'Sync workspace channels, messages, interactive alerts, and webhook notifications.',
    capabilities: ['Channels', 'Messages', 'Notifications', 'Webhooks'],
    oauthVersion: 'OAuth 2.0',
    scopes: ['channels:read', 'chat:write', 'channels:history', 'incoming-webhook'],
    clientIdEnvKey: 'SLACK_CLIENT_ID',
    clientSecretEnvKey: 'SLACK_CLIENT_SECRET',
    redirectUriEnvKey: 'SLACK_REDIRECT_URI',
    docsUrl: 'https://api.slack.com/',
  },
  {
    provider: 'teams',
    displayName: 'Microsoft Teams',
    category: 'communication',
    description: 'Enterprise Microsoft Graph sync for Teams, channels, chats, and notification alerts.',
    capabilities: ['Teams', 'Channels', 'Messages', 'Notifications'],
    oauthVersion: 'Microsoft OAuth',
    scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All', 'Chat.ReadWrite'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/teams-concept-overview',
  },

  // ────────────────────────────────────────────
  // EMAIL
  // ────────────────────────────────────────────
  {
    provider: 'gmail',
    displayName: 'Gmail / Google Workspace',
    category: 'email',
    description: 'Sync customer email threads, messages, attachments, and mailbox labels.',
    capabilities: ['Emails', 'Threads', 'Attachments', 'Labels'],
    oauthVersion: 'Google OAuth 2.0',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    clientIdEnvKey: 'GOOGLE_CLIENT_ID',
    clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnvKey: 'GOOGLE_REDIRECT_URI',
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  {
    provider: 'outlook_mail',
    displayName: 'Microsoft Outlook',
    category: 'email',
    description: 'Enterprise Office 365 email sync, message threads, attachments, and folders.',
    capabilities: ['Emails', 'Threads', 'Attachments', 'Folders'],
    oauthVersion: 'Microsoft OAuth',
    scopes: ['Mail.Read', 'Mail.ReadWrite'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview',
  },

  // ────────────────────────────────────────────
  // CALENDAR
  // ────────────────────────────────────────────
  {
    provider: 'google_calendar',
    displayName: 'Google Calendar',
    category: 'calendar',
    description: 'Sync meeting schedules, availability calendars, invites, and reminders.',
    capabilities: ['Events', 'Availability', 'Scheduling', 'Reminders'],
    oauthVersion: 'Google OAuth 2.0',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    clientIdEnvKey: 'GOOGLE_CLIENT_ID',
    clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnvKey: 'GOOGLE_REDIRECT_URI',
    docsUrl: 'https://developers.google.com/calendar/api',
  },
  {
    provider: 'outlook_calendar',
    displayName: 'Outlook Calendar',
    category: 'calendar',
    description: 'Enterprise Microsoft 365 calendar scheduling, availability, and event sync.',
    capabilities: ['Events', 'Availability', 'Scheduling', 'Reminders'],
    oauthVersion: 'Microsoft OAuth',
    scopes: ['Calendars.Read', 'Calendars.ReadWrite'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/calendar',
  },
  {
    provider: 'calendly',
    displayName: 'Calendly',
    category: 'calendar',
    description: 'Sync scheduled appointments, invitee answers, event types, and booking slots.',
    capabilities: ['Events', 'Invitees', 'Availability', 'Scheduling'],
    oauthVersion: 'OAuth 2.0',
    scopes: ['default'],
    clientIdEnvKey: 'CALENDLY_CLIENT_ID',
    clientSecretEnvKey: 'CALENDLY_CLIENT_SECRET',
    redirectUriEnvKey: 'CALENDLY_REDIRECT_URI',
    docsUrl: 'https://developer.calendly.com/',
  },

  // ────────────────────────────────────────────
  // PRODUCTIVITY
  // ────────────────────────────────────────────
  {
    provider: 'notion',
    displayName: 'Notion',
    category: 'productivity',
    description: 'Sync workspace pages, databases, content blocks, and organization users.',
    capabilities: ['Pages', 'Databases', 'Blocks', 'Users'],
    oauthVersion: 'OAuth 2.0',
    scopes: [],
    clientIdEnvKey: 'NOTION_CLIENT_ID',
    clientSecretEnvKey: 'NOTION_CLIENT_SECRET',
    redirectUriEnvKey: 'NOTION_REDIRECT_URI',
    docsUrl: 'https://developers.notion.com/',
  },

  // ────────────────────────────────────────────
  // DEVELOPER SANDBOX (MOCK)
  // ────────────────────────────────────────────
  {
    provider: 'mock',
    displayName: 'Developer Sandbox (Mock)',
    category: 'crm',
    description: 'Simulated CRM dataset for rapid local testing without external API credentials.',
    capabilities: ['Contacts', 'Companies', 'Deals', 'Activities'],
    oauthVersion: 'Developer Sandbox',
    scopes: [],
    clientIdEnvKey: '',
    clientSecretEnvKey: '',
    redirectUriEnvKey: '',
  },
];

/**
 * Lookup a single provider's metadata
 */
export const getProviderMeta = (provider: string): ProviderMetadata | undefined => {
  return PROVIDER_REGISTRY.find(p => p.provider.toLowerCase() === provider.toLowerCase());
};

/**
 * Get all provider keys (for listing)
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
 * Categories in display order
 */
export const CATEGORY_ORDER: { id: ProviderCategory; label: string }[] = [
  { id: 'crm', label: 'CRM' },
  { id: 'communication', label: 'Communication' },
  { id: 'email', label: 'Email' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'productivity', label: 'Productivity' },
];
