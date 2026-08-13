// Integration Module Types

export type IntegrationStatus =
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
  | 'payments'
  | 'commerce'
  | 'automation';

export interface IntegrationDTO {
  id: string;
  provider: string;
  category: ProviderCategory;
  displayName: string;
  status: IntegrationStatus;
  connectedAt: string;
  lastSyncedAt?: string;
  connectedAccount?: string;   // email or account label of the user who connected
  capabilities: string[];
  oauthVersion: string;
  syncedCounts?: {
    contacts: number;
    companies: number;
    deals: number;
  };
  expiresAt?: string;
  comingSoon: boolean;
  scopes?: string[];
}

export interface ProviderMetadata {
  provider: string;
  displayName: string;
  category: ProviderCategory;
  description: string;
  capabilities: string[];
  oauthVersion: string;
  comingSoon: boolean;
  scopes?: string[];
}

export interface OAuthUrlResponse {
  provider: string;
  authorizationUrl: string;
}

export interface SyncResponse {
  provider: string;
  status: string;
  syncedCounts: {
    contacts: number;
    companies: number;
    deals: number;
  };
  lastSyncedAt: string;
  duration?: number; // milliseconds
}

export interface DisconnectOptions {
  retainData?: boolean; // If true, keep synced records but mark them stale
}
