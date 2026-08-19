// Integration Module Types

export type IntegrationStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'AUTHORIZING'
  | 'CONNECTED'
  | 'SYNCING'
  | 'SYNC_SUCCESS'
  | 'TOKEN_EXPIRED'
  | 'REAUTH_REQUIRED'
  | 'CONNECTION_ERROR'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'REVOKED'
  | 'CONFIGURATION_REQUIRED'
  // Legacy string mappings for backward compatibility
  | 'Not Connected'
  | 'Connecting'
  | 'Connected'
  | 'Syncing'
  | 'Expired'
  | 'Connection Failed'
  | 'Revoked';

export type ProviderCategory =
  | 'crm'
  | 'communication'
  | 'email'
  | 'calendar'
  | 'productivity';

export interface IntegrationDTO {
  id: string;
  provider: string;
  category: ProviderCategory;
  displayName: string;
  status: IntegrationStatus;
  statusDetails?: string;
  isConfigured: boolean;       // whether required CLIENT_ID/SECRET exist in env
  missingEnvKeys?: string[];    // list of env keys needed if isConfigured is false
  connectedAt: string;
  lastSyncedAt?: string;
  connectedAccount?: string;   // email or account label of the user who connected
  capabilities: string[];
  oauthVersion: string;
  syncedCounts?: {
    contacts?: number;
    companies?: number;
    deals?: number;
    messages?: number;
    channels?: number;
    emails?: number;
    events?: number;
    pages?: number;
  };
  expiresAt?: string;
  scopes?: string[];
  docsUrl?: string;
}

export interface ProviderMetadata {
  provider: string;
  displayName: string;
  category: ProviderCategory;
  description: string;
  capabilities: string[];
  oauthVersion: string;
  scopes?: string[];
  clientIdEnvKey: string;
  clientSecretEnvKey: string;
  redirectUriEnvKey: string;
  docsUrl?: string;
}

export interface OAuthUrlResponse {
  provider: string;
  authorizationUrl: string;
  state?: string;
}

export interface SyncResponse {
  provider: string;
  status: string;
  syncedCounts: {
    contacts?: number;
    companies?: number;
    deals?: number;
    messages?: number;
    channels?: number;
    emails?: number;
    events?: number;
    pages?: number;
  };
  lastSyncedAt: string;
  duration?: number; // milliseconds
}

export interface DisconnectOptions {
  retainData?: boolean; // If true, keep synced records
}
