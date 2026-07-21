// Provider Registry — resolves the correct adapter for a given provider name

import { CRMProvider } from './crm.provider.interface';
import { MockAdapter } from './mock.adapter';
import { HubSpotAdapter } from './hubspot.adapter';
import { SalesforceAdapter } from './salesforce.adapter';
import { PipedriveAdapter } from './pipedrive.adapter';
import { ZohoAdapter } from './zoho.adapter';
import { ZapierAdapter } from './zapier.adapter';
import { MergeAdapter } from './merge.adapter';
import { UnifiedToAdapter } from './unifiedto.adapter';
import prisma from '../database/prisma.client';

export const getProviderAdapter = async (
  providerName: string,
  userId: string
): Promise<CRMProvider> => {
  if (providerName === 'mock' || !providerName) {
    return new MockAdapter();
  }

  try {
    // Look up OAuth token from DB
    const connection = await prisma.integration.findUnique({
      where: {
        userId_provider: { userId, provider: providerName },
      },
    });

    if (connection && (connection.status === 'Connected' || connection.status === 'Syncing')) {
      switch (providerName) {
        case 'hubspot':
          return new HubSpotAdapter(connection.accessToken);
        case 'salesforce':
          return new SalesforceAdapter(connection.accessToken);
        case 'pipedrive':
          return new PipedriveAdapter(connection.accessToken);
        case 'zoho':
          return new ZohoAdapter(connection.accessToken);
        case 'zapier':
          return new ZapierAdapter(connection.accessToken);
        case 'merge':
          return new MergeAdapter(connection.accessToken);
        case 'unifiedto':
          return new UnifiedToAdapter(connection.accessToken);
      }
    }
  } catch (err) {
    // DB or lookup error fallback
  }

  // Graceful fallback adapter so no integration route crashes
  return new MockAdapter();
};

export const SUPPORTED_PROVIDERS = ['hubspot', 'salesforce', 'pipedrive', 'mock', 'zapier', 'zoho', 'merge', 'unifiedto'] as const;
