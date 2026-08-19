// OAuth Provider Configuration — Typed configurations for all MVP providers
// Each provider's OAuth endpoints, scopes, and credential env-var keys are defined here.

export interface OAuthProviderConfig {
  provider: string;
  authBaseUrl: string;
  tokenUrl: string;
  revokeUrl?: string;          // For provider-side token revocation
  scopes: string[];
  scopeDelimiter?: string;     // Space by default, some use comma or plus
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
  redirectUriEnvKey: string;
  supportsRefresh: boolean;
  tokenExpirySeconds?: number; // Default expiry if provider doesn't return expires_in
  extraAuthParams?: Record<string, string>;
}

/**
 * OAuth configurations keyed by provider name.
 * Strictly focused on the 12 MVP SaaS integrations.
 */
const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  // ── CRM ─────────────────────────────────────────────────────────────
  hubspot: {
    provider: 'hubspot',
    authBaseUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    revokeUrl: undefined,
    scopes: [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
    ],
    clientIdEnvKey: 'HUBSPOT_CLIENT_ID',
    clientSecretEnvKey: 'HUBSPOT_CLIENT_SECRET',
    redirectUriEnvKey: 'HUBSPOT_REDIRECT_URI',
    supportsRefresh: true,
    tokenExpirySeconds: 1800, // 30 minutes
  },

  salesforce: {
    provider: 'salesforce',
    authBaseUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    revokeUrl: 'https://login.salesforce.com/services/oauth2/revoke',
    scopes: ['api', 'refresh_token', 'offline_access'],
    clientIdEnvKey: 'SALESFORCE_CLIENT_ID',
    clientSecretEnvKey: 'SALESFORCE_CLIENT_SECRET',
    redirectUriEnvKey: 'SALESFORCE_REDIRECT_URI',
    supportsRefresh: true,
  },

  pipedrive: {
    provider: 'pipedrive',
    authBaseUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    revokeUrl: undefined,
    scopes: ['contacts:full', 'deals:full'],
    clientIdEnvKey: 'PIPEDRIVE_CLIENT_ID',
    clientSecretEnvKey: 'PIPEDRIVE_CLIENT_SECRET',
    redirectUriEnvKey: 'PIPEDRIVE_REDIRECT_URI',
    supportsRefresh: true,
  },

  zoho: {
    provider: 'zoho',
    authBaseUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    revokeUrl: 'https://accounts.zoho.com/oauth/v2/token/revoke',
    scopes: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL'],
    clientIdEnvKey: 'ZOHO_CLIENT_ID',
    clientSecretEnvKey: 'ZOHO_CLIENT_SECRET',
    redirectUriEnvKey: 'ZOHO_REDIRECT_URI',
    supportsRefresh: true,
    extraAuthParams: { access_type: 'offline' },
  },

  // ── COMMUNICATION ──────────────────────────────────────────────────
  slack: {
    provider: 'slack',
    authBaseUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    revokeUrl: 'https://slack.com/api/auth.revoke',
    scopes: ['channels:read', 'chat:write', 'channels:history', 'incoming-webhook'],
    scopeDelimiter: ',',
    clientIdEnvKey: 'SLACK_CLIENT_ID',
    clientSecretEnvKey: 'SLACK_CLIENT_SECRET',
    redirectUriEnvKey: 'SLACK_REDIRECT_URI',
    supportsRefresh: false, // Slack bot tokens don't expire unless configured with token rotation
  },

  teams: {
    provider: 'teams',
    authBaseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    revokeUrl: undefined,
    scopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All', 'Chat.ReadWrite', 'offline_access'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    supportsRefresh: true,
  },

  // ── EMAIL ──────────────────────────────────────────────────────────
  gmail: {
    provider: 'gmail',
    authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
    clientIdEnvKey: 'GOOGLE_CLIENT_ID',
    clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnvKey: 'GOOGLE_REDIRECT_URI',
    supportsRefresh: true,
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },

  outlook_mail: {
    provider: 'outlook_mail',
    authBaseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    revokeUrl: undefined,
    scopes: ['Mail.Read', 'Mail.ReadWrite', 'offline_access'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    supportsRefresh: true,
  },

  // ── CALENDAR ───────────────────────────────────────────────────────
  google_calendar: {
    provider: 'google_calendar',
    authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    clientIdEnvKey: 'GOOGLE_CLIENT_ID',
    clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnvKey: 'GOOGLE_REDIRECT_URI',
    supportsRefresh: true,
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },

  outlook_calendar: {
    provider: 'outlook_calendar',
    authBaseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    revokeUrl: undefined,
    scopes: ['Calendars.Read', 'Calendars.ReadWrite', 'offline_access'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    supportsRefresh: true,
  },

  calendly: {
    provider: 'calendly',
    authBaseUrl: 'https://auth.calendly.com/oauth/authorize',
    tokenUrl: 'https://auth.calendly.com/oauth/token',
    revokeUrl: 'https://auth.calendly.com/oauth/revoke',
    scopes: ['default'],
    clientIdEnvKey: 'CALENDLY_CLIENT_ID',
    clientSecretEnvKey: 'CALENDLY_CLIENT_SECRET',
    redirectUriEnvKey: 'CALENDLY_REDIRECT_URI',
    supportsRefresh: true,
  },

  // ── PRODUCTIVITY ───────────────────────────────────────────────────
  notion: {
    provider: 'notion',
    authBaseUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    revokeUrl: undefined,
    scopes: [],
    clientIdEnvKey: 'NOTION_CLIENT_ID',
    clientSecretEnvKey: 'NOTION_CLIENT_SECRET',
    redirectUriEnvKey: 'NOTION_REDIRECT_URI',
    supportsRefresh: false, // Notion issues non-expiring internal bot integration tokens
  },
};

/**
 * Retrieve the OAuth config for a given provider.
 */
export const getOAuthConfig = (provider: string): OAuthProviderConfig | undefined => {
  return OAUTH_CONFIGS[provider.toLowerCase()];
};

/**
 * Check if a provider supports OAuth flow
 */
export const supportsOAuth = (provider: string): boolean => {
  return provider.toLowerCase() in OAUTH_CONFIGS;
};

/**
 * Get all providers that have OAuth configurations
 */
export const getOAuthProviders = (): string[] => {
  return Object.keys(OAUTH_CONFIGS);
};
