// Integration Module Types

export type IntegrationStatus =
  | 'Not Connected'
  | 'Connecting'
  | 'Connected'
  | 'Syncing'
  | 'Expired'
  | 'Connection Failed';

export interface IntegrationDTO {
  id: string;
  provider: string;
  status: IntegrationStatus;
  connectedAt: string;
  lastSyncedAt?: string;
  connectedAccount?: string; // email of user who connected it
  capabilities: string[];
  oauthVersion: string;
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
}
