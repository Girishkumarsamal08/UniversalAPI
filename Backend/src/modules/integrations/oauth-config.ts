// OAuth Provider Configuration — typed config per provider replacing if/else chains
// Each provider's OAuth endpoints, scopes, and credential env-var keys are defined here.

/**
 * Configuration for a single OAuth provider.
 * The integration service looks up configs by provider key instead of
 * branching through if/else chains.
 */
export interface OAuthProviderConfig {
  provider: string;
  authBaseUrl: string;
  tokenUrl: string;
  revokeUrl?: string;          // For provider-side token revocation (not all support it)
  scopes: string[];
  scopeDelimiter?: string;     // Space by default, some use comma
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
  redirectUriEnvKey: string;
  supportsRefresh: boolean;
  tokenExpirySeconds?: number; // Default expiry if provider doesn't return expires_in
}

/**
 * OAuth configurations keyed by provider name.
 * Only providers that support standard OAuth 2.0 flows are listed here.
 * Providers using API keys only (Razorpay, etc.) are not included.
 */
const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  hubspot: {
    provider: 'hubspot',
    authBaseUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    revokeUrl: undefined, // HubSpot does not have a standard revoke endpoint
    scopes: ['contacts', 'crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.companies.read', 'crm.objects.companies.write'],
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
    scopes: ['api', 'refresh_token'],
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
    scopes: [],
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
    scopes: ['ZohoCRM.modules.ALL'],
    clientIdEnvKey: 'ZOHO_CLIENT_ID',
    clientSecretEnvKey: 'ZOHO_CLIENT_SECRET',
    redirectUriEnvKey: 'ZOHO_REDIRECT_URI',
    supportsRefresh: true,
  },

  gmail: {
    provider: 'gmail',
    authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    clientIdEnvKey: 'GOOGLE_CLIENT_ID',
    clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnvKey: 'GOOGLE_REDIRECT_URI',
    supportsRefresh: true,
  },

  google_calendar: {
    provider: 'google_calendar',
    authBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    clientIdEnvKey: 'GOOGLE_CLIENT_ID',
    clientSecretEnvKey: 'GOOGLE_CLIENT_SECRET',
    redirectUriEnvKey: 'GOOGLE_REDIRECT_URI',
    supportsRefresh: true,
  },

  outlook_mail: {
    provider: 'outlook_mail',
    authBaseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    revokeUrl: undefined, // Microsoft uses session management, not a standard revoke endpoint
    scopes: ['Mail.Read', 'Mail.ReadWrite', 'offline_access'],
    clientIdEnvKey: 'MICROSOFT_CLIENT_ID',
    clientSecretEnvKey: 'MICROSOFT_CLIENT_SECRET',
    redirectUriEnvKey: 'MICROSOFT_REDIRECT_URI',
    supportsRefresh: true,
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

  shopify: {
    provider: 'shopify',
    authBaseUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    revokeUrl: undefined,
    scopes: ['read_customers', 'read_orders', 'read_products'],
    scopeDelimiter: ',',
    clientIdEnvKey: 'SHOPIFY_CLIENT_ID',
    clientSecretEnvKey: 'SHOPIFY_CLIENT_SECRET',
    redirectUriEnvKey: 'SHOPIFY_REDIRECT_URI',
    supportsRefresh: false, // Shopify tokens don't expire by default
  },

  slack: {
    provider: 'slack',
    authBaseUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    revokeUrl: 'https://slack.com/api/auth.revoke',
    scopes: ['channels:read', 'chat:write', 'incoming-webhook'],
    clientIdEnvKey: 'SLACK_CLIENT_ID',
    clientSecretEnvKey: 'SLACK_CLIENT_SECRET',
    redirectUriEnvKey: 'SLACK_REDIRECT_URI',
    supportsRefresh: false, // Slack bot tokens don't expire
  },

  stripe: {
    provider: 'stripe',
    authBaseUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    revokeUrl: 'https://connect.stripe.com/oauth/deauthorize',
    scopes: ['read_write'],
    clientIdEnvKey: 'STRIPE_CLIENT_ID',
    clientSecretEnvKey: 'STRIPE_CLIENT_SECRET',
    redirectUriEnvKey: 'STRIPE_REDIRECT_URI',
    supportsRefresh: true,
  },

  paypal: {
    provider: 'paypal',
    authBaseUrl: 'https://www.paypal.com/signin/authorize',
    tokenUrl: 'https://api-m.paypal.com/v1/oauth2/token',
    revokeUrl: undefined,
    scopes: [],
    clientIdEnvKey: 'PAYPAL_CLIENT_ID',
    clientSecretEnvKey: 'PAYPAL_CLIENT_SECRET',
    redirectUriEnvKey: 'PAYPAL_REDIRECT_URI',
    supportsRefresh: false,
  },
};

/**
 * Retrieve the OAuth config for a given provider.
 * Returns undefined for providers that don't use OAuth (API-key-only, or coming-soon).
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
