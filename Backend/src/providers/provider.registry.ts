// Provider Registry — resolves the correct adapter for a given provider name

import { CRMProvider } from './crm.provider.interface';
import { MockAdapter } from './mock.adapter';
import { HubSpotAdapter } from './hubspot.adapter';
import { SalesforceAdapter } from './salesforce.adapter';
import { PipedriveAdapter } from './pipedrive.adapter';
import prisma from '../database/prisma.client';

export const getProviderAdapter = async (
  providerName: string,
  userId: string
): Promise<CRMProvider> => {
  if (providerName === 'mock') {
    return new MockAdapter();
  }

  // Look up OAuth token from DB
  const connection = await prisma.providerConnection.findUnique({
    where: {
      userId_provider: { userId, provider: providerName },
    },
  });

  if (!connection || !connection.isActive) {
    throw new Error(`No active connection found for provider: ${providerName}. Please connect via OAuth first.`);
  }

  switch (providerName) {
    case 'hubspot':
      return new HubSpotAdapter(connection.accessToken);

    case 'salesforce':
      return new SalesforceAdapter(connection.accessToken);

    case 'pipedrive':
      return new PipedriveAdapter(connection.accessToken);

    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
};

export const SUPPORTED_PROVIDERS = ['hubspot', 'salesforce', 'pipedrive', 'mock'] as const;
