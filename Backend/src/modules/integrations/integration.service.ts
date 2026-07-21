// Integration Service — OAuth flow and normalization sync coordinator
import prisma from '../../database/prisma.client';
import { getProviderAdapter } from '../../providers/provider.registry';
import { HubSpotAdapter } from '../../providers/hubspot.adapter';
import { SalesforceAdapter } from '../../providers/salesforce.adapter';
import { PipedriveAdapter } from '../../providers/pipedrive.adapter';
import { IntegrationDTO, OAuthUrlResponse, SyncResponse, IntegrationStatus } from './integration.types';
import { memoryLogs } from '../../middleware/logging.middleware';
import { logger } from '../../utils/logger';

// Helper to log integration events to the system logs
export const logIntegrationEvent = async (
  userId: string,
  event: string,
  isError: boolean = false,
  errorMsg?: string
): Promise<void> => {
  const logData = {
    userId,
    endpoint: `INTEGRATION: ${event}`,
    method: 'EVENT',
    statusCode: isError ? 400 : 200,
    responseTime: 0,
    ipAddress: '127.0.0.1',
    userAgent: 'Universal-API-Agent/1.0',
    errorMessage: errorMsg || null,
  };

  try {
    await prisma.apiLog.create({
      data: logData,
    });
  } catch (err) {
    // If DB is offline, store in the global memory logs
    memoryLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...logData,
      timestamp: new Date().toISOString(),
    });
    if (memoryLogs.length > 100) memoryLogs.pop();
  }
};

export const getIntegrationsForUser = async (userId: string, organizationId?: string): Promise<IntegrationDTO[]> => {
  let userIds = [userId];
  if (organizationId) {
    const orgMembers = await prisma.orgMember.findMany({
      where: { organizationId },
      select: { userId: true },
    });
    if (orgMembers.length > 0) {
      userIds = orgMembers.map(m => m.userId);
    }
  }

  const dbConnections = await prisma.integration.findMany({
    where: { userId: { in: userIds } },
  });

  const defaultProviders = [
    'hubspot', 'salesforce', 'pipedrive', 'zoho', 'merge', 'unifiedto',
    'gmail', 'outlook_mail',
    'google_calendar', 'outlook_calendar',
    'razorpay', 'paypal', 'online_banking',
    'shopify', 'flipkart', 'amazon',
    'zapier', 'slack',
    'mock'
  ];

  const allProviderKeys = Array.from(new Set([...defaultProviders, ...dbConnections.map(c => c.provider)]));

  return allProviderKeys.map((provider) => {
    const conn = dbConnections.find((c) => c.provider === provider);
    const isMock = provider === 'mock';
    const currentStatus: IntegrationStatus = (conn?.status as IntegrationStatus) || (isMock ? 'Connected' : 'Not Connected');

    let capabilities = ['Sync Data', 'Webhooks'];
    if (['hubspot', 'salesforce', 'pipedrive', 'zoho', 'mock'].includes(provider)) {
      capabilities = ['Contacts', 'Companies', 'Deals'];
    } else if (['gmail', 'outlook_mail'].includes(provider)) {
      capabilities = ['Email Threads', 'Outreach Logs', 'Delivery Tracking'];
    } else if (['google_calendar', 'outlook_calendar'].includes(provider)) {
      capabilities = ['Calendar Events', 'Availability Slots', 'Booking Sync'];
    } else if (['razorpay', 'paypal', 'online_banking'].includes(provider)) {
      capabilities = ['Payment Transactions', 'Merchant Ledger', 'Payout Webhooks'];
    } else if (['shopify', 'flipkart', 'amazon'].includes(provider)) {
      capabilities = ['Customer Orders', 'Product Catalogs', 'Inventory Ledger'];
    }

    return {
      id: conn?.id || `new-${provider}`,
      provider,
      status: currentStatus,
      connectedAt: conn?.connectedAt?.toISOString() || (isMock ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString()),
      lastSyncedAt: conn?.lastSyncedAt?.toISOString() || (isMock ? new Date(Date.now() - 10 * 60 * 1000).toISOString() : undefined),
      connectedAccount: (conn as any)?.connectedAccount || (isMock ? `${provider}@unifiedcrm.io` : undefined),
      capabilities,
      oauthVersion: isMock ? 'Mock Mode' : 'OAuth 2.0 / API Key',
    };
  });
};

export const generateAuthorizationUrl = async (
  provider: string,
  userId: string
): Promise<OAuthUrlResponse> => {
  const p = provider.toLowerCase();
  
  // Look up credentials based on provider
  let clientId = '';
  let redirectUri = '';
  let authBaseUrl = '';
  let scopes = '';

  if (p === 'hubspot') {
    clientId = process.env.HUBSPOT_CLIENT_ID || 'your_hubspot_client_id';
    redirectUri = process.env.HUBSPOT_REDIRECT_URI || `http://localhost:3000/api/v1/integrations/hubspot/callback`;
    authBaseUrl = 'https://app.hubspot.com/oauth/authorize';
    scopes = 'contacts crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.companies.write';
  } else if (p === 'salesforce') {
    clientId = process.env.SALESFORCE_CLIENT_ID || 'your_salesforce_client_id';
    redirectUri = process.env.SALESFORCE_REDIRECT_URI || `http://localhost:3000/api/v1/integrations/salesforce/callback`;
    authBaseUrl = 'https://login.salesforce.com/services/oauth2/authorize';
    scopes = 'api refresh_token';
  } else if (p === 'pipedrive') {
    clientId = process.env.PIPEDRIVE_CLIENT_ID || 'your_pipedrive_client_id';
    redirectUri = process.env.PIPEDRIVE_REDIRECT_URI || `http://localhost:3000/api/v1/integrations/pipedrive/callback`;
    authBaseUrl = 'https://oauth.pipedrive.com/oauth/authorize';
  }

  // If Client ID is placeholder, route to local simulation endpoint
  if (clientId.includes('your_') || !clientId) {
    logger.info(`OAuth credentials not configured for ${provider}. Falling back to simulation mode.`);
    const simulationUrl = `http://localhost:3000/api/v1/integrations/${p}/oauth-simulate?userId=${userId}`;
    return {
      provider,
      authorizationUrl: simulationUrl,
    };
  }

  // Generate real OAuth URL
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    ...(scopes ? { scope: scopes } : {}),
  });

  return {
    provider,
    authorizationUrl: `${authBaseUrl}?${query.toString()}`,
  };
};

export const exchangeCodeForToken = async (
  provider: string,
  code: string,
  userId: string
): Promise<void> => {
  const p = provider.toLowerCase();
  logger.info(`Exchanging OAuth authorization code for provider: ${provider}`);
  
  let accessToken = '';
  let refreshToken = '';
  let expiresAt: Date | undefined;

  // Check if simulated code
  if (code.startsWith('mock-')) {
    accessToken = `mock-access-token-${p}-${Date.now()}`;
    refreshToken = `mock-refresh-token-${p}-${Date.now()}`;
    expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  } else {
    // Real Token Exchange
    let tokenUrl = '';
    let clientId = '';
    let clientSecret = '';
    let redirectUri = '';

    if (p === 'hubspot') {
      tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
      clientId = process.env.HUBSPOT_CLIENT_ID!;
      clientSecret = process.env.HUBSPOT_CLIENT_SECRET!;
      redirectUri = process.env.HUBSPOT_REDIRECT_URI!;
    } else if (p === 'salesforce') {
      tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
      clientId = process.env.SALESFORCE_CLIENT_ID!;
      clientSecret = process.env.SALESFORCE_CLIENT_SECRET!;
      redirectUri = process.env.SALESFORCE_REDIRECT_URI!;
    } else if (p === 'pipedrive') {
      tokenUrl = 'https://oauth.pipedrive.com/oauth/token';
      clientId = process.env.PIPEDRIVE_CLIENT_ID!;
      clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET!;
      redirectUri = process.env.PIPEDRIVE_REDIRECT_URI!;
    }

    try {
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      });

      if (!res.ok) {
        throw new Error(`Token exchange failed with status: ${res.status}`);
      }

      const body: any = await res.json();
      accessToken = body.access_token;
      refreshToken = body.refresh_token;
      if (body.expires_in) {
        expiresAt = new Date(Date.now() + body.expires_in * 1000);
      }
    } catch (err: any) {
      await logIntegrationEvent(userId, `OAuth Failed for ${provider}`, true, err.message);
      throw err;
    }
  }

  // Save tokens to DB
  await prisma.integration.upsert({
    where: {
      userId_provider: { userId, provider: p },
    },
    update: {
      accessToken,
      refreshToken,
      expiresAt,
      status: 'Connected',
      connectedAt: new Date(),
    },
    create: {
      userId,
      provider: p,
      accessToken,
      refreshToken,
      expiresAt,
      status: 'Connected',
      connectedAt: new Date(),
    },
  });

  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected`);
};

const refreshLocks = new Map<string, Promise<void>>();

export const refreshAccessToken = async (provider: string, userId: string): Promise<void> => {
  const p = provider.toLowerCase();
  const lockKey = `${userId}:${p}`;

  // Coalesce duplicate requests for the same integration refresh
  if (refreshLocks.has(lockKey)) {
    logger.info(`Token refresh already in progress for ${lockKey}, waiting...`);
    return refreshLocks.get(lockKey);
  }

  const refreshPromise = (async () => {
    const conn = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: p } },
    });

    if (!conn || !conn.refreshToken) {
      throw new Error(`No refresh token available to renew connection for ${provider}`);
    }

    if (conn.refreshToken.startsWith('mock-')) {
      // Generate new mock tokens
      const nextExpires = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.integration.update({
        where: { id: conn.id },
        data: {
          accessToken: `mock-access-token-${p}-${Date.now()}`,
          expiresAt: nextExpires,
          status: 'Connected',
        },
      });
      await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Token Refreshed`);
      return;
    }

    // Real Token Refresh
    let tokenUrl = '';
    let clientId = '';
    let clientSecret = '';

    if (p === 'hubspot') {
      tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
      clientId = process.env.HUBSPOT_CLIENT_ID!;
      clientSecret = process.env.HUBSPOT_CLIENT_SECRET!;
    } else if (p === 'salesforce') {
      tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
      clientId = process.env.SALESFORCE_CLIENT_ID!;
      clientSecret = process.env.SALESFORCE_CLIENT_SECRET!;
    } else if (p === 'pipedrive') {
      tokenUrl = 'https://oauth.pipedrive.com/oauth/token';
      clientId = process.env.PIPEDRIVE_CLIENT_ID!;
      clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET!;
    }

    try {
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: conn.refreshToken,
        }),
      });

      if (!res.ok) {
        throw new Error(`Token refresh failed with status: ${res.status}`);
      }

      const body: any = await res.json();
      await prisma.integration.update({
        where: { id: conn.id },
        data: {
          accessToken: body.access_token,
          refreshToken: body.refresh_token || conn.refreshToken,
          expiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : conn.expiresAt,
          status: 'Connected',
        },
      });

      await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Token Refreshed`);
    } catch (err: any) {
      await prisma.integration.update({
        where: { id: conn.id },
        data: { status: 'Expired' },
      });
      await logIntegrationEvent(userId, `Token Expired for ${provider}`, true, err.message);
      throw err;
    }
  })();

  refreshLocks.set(lockKey, refreshPromise);
  try {
    await refreshPromise;
  } finally {
    refreshLocks.delete(lockKey);
  }
};

export const revokeConnection = async (provider: string, userId: string): Promise<void> => {
  const p = provider.toLowerCase();
  
  // Set integration back to Not Connected state
  await prisma.integration.delete({
    where: {
      userId_provider: { userId, provider: p },
    },
  });

  // Clean synced items for this provider/user org context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberships: { select: { organizationId: true } } },
  });
  
  const organizationId = user?.memberships[0]?.organizationId;
  if (organizationId) {
    await prisma.contact.deleteMany({
      where: { provider: p, organizationId },
    });
    await prisma.company.deleteMany({
      where: { provider: p, organizationId },
    });
    await prisma.deal.deleteMany({
      where: { provider: p, organizationId },
    });
  }

  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Disconnected`);
};

export const syncProviderData = async (
  provider: string,
  userId: string,
  organizationId: string
): Promise<SyncResponse> => {
  const p = provider.toLowerCase();
  logger.info(`Starting CRM sync for ${provider} under organization: ${organizationId}`);

  // Fetch connection details
  const conn = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: p } },
  });

  if (!conn) {
    throw new Error(`Integration for ${provider} is not connected.`);
  }

  // Update status to syncing
  await prisma.integration.update({
    where: { id: conn.id },
    data: { status: 'Syncing' },
  });

  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sync Started`);

  try {
    // Check and refresh token if expired
    if (conn.expiresAt && new Date() >= conn.expiresAt) {
      logger.info(`Access token expired for ${provider}. Refreshing...`);
      await refreshAccessToken(p, userId);
    }

    const adapter = await getProviderAdapter(p, userId);
    
    // Fetch and Normalize Contacts
    const contacts = await adapter.getContacts();
    for (const c of contacts) {
      await prisma.contact.upsert({
        where: {
          externalId_provider_organizationId: {
            externalId: c.externalId,
            provider: p,
            organizationId,
          },
        },
        update: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          jobTitle: c.jobTitle,
        },
        create: {
          externalId: c.externalId,
          provider: p,
          organizationId,
          name: c.name,
          email: c.email,
          phone: c.phone,
          jobTitle: c.jobTitle,
        },
      });
    }

    // Fetch and Normalize Companies
    const companies = await adapter.getCompanies();
    for (const co of companies) {
      await prisma.company.upsert({
        where: {
          externalId_provider_organizationId: {
            externalId: co.externalId,
            provider: p,
            organizationId,
          },
        },
        update: {
          name: co.name,
          website: co.website,
          industry: co.industry,
          size: co.size,
        },
        create: {
          externalId: co.externalId,
          provider: p,
          organizationId,
          name: co.name,
          website: co.website,
          industry: co.industry,
          size: co.size,
        },
      });
    }

    // Fetch and Normalize Deals (only if supported)
    let syncedDealsCount = 0;
    try {
      const deals = await adapter.getDeals();
      for (const d of deals) {
        await prisma.deal.upsert({
          where: {
            externalId_provider_organizationId: {
              externalId: d.externalId,
              provider: p,
              organizationId,
            },
          },
          update: {
            title: d.title,
            amount: d.amount,
            stage: d.stage,
          },
          create: {
            externalId: d.externalId,
            provider: p,
            organizationId,
            title: d.title,
            amount: d.amount,
            stage: d.stage,
          },
        });
      }
      syncedDealsCount = deals.length;
    } catch (dealErr: any) {
      logger.warn(`Failed to sync deals for ${provider}: ${dealErr.message}`);
    }

    const lastSyncedAt = new Date();
    await prisma.integration.update({
      where: { id: conn.id },
      data: {
        status: 'Connected',
        lastSyncedAt,
      },
    });

    await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sync Completed`);

    return {
      provider,
      status: 'success',
      syncedCounts: {
        contacts: contacts.length,
        companies: companies.length,
        deals: syncedDealsCount,
      },
      lastSyncedAt: lastSyncedAt.toISOString(),
    };
  } catch (err: any) {
    await prisma.integration.update({
      where: { id: conn.id },
      data: { status: 'Connection Failed' },
    });
    await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sync Failed`, true, err.message);
    throw err;
  }
};

/**
 * Scans the database periodically and proactively refreshes OAuth tokens
 * that are close to expiring (within 15 minutes of expiration).
 */
export const startProactiveRefreshScheduler = (): void => {
  logger.info('⏰ Proactive OAuth Token Refresh Scheduler initialized');
  
  // Run checks every 5 minutes
  setInterval(async () => {
    try {
      logger.info('Running proactive token refresh scan...');
      const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
      
      const expiringConnections = await prisma.integration.findMany({
        where: {
          status: 'Connected',
          expiresAt: {
            lte: fifteenMinutesFromNow,
            gt: new Date() // not already expired
          }
        }
      });
      
      if (expiringConnections.length === 0) {
        logger.debug('No expiring OAuth connections found in this scan.');
        return;
      }
      
      logger.info(`Found ${expiringConnections.length} integrations requiring proactive refresh.`);
      
      for (const conn of expiringConnections) {
        logger.info(`Proactively refreshing token for user ${conn.userId}, provider ${conn.provider}`);
        await refreshAccessToken(conn.provider, conn.userId).catch((err) => {
          logger.error(`Proactive token refresh failed for user ${conn.userId}, provider ${conn.provider}:`, err);
        });
      }
    } catch (err) {
      logger.error('Error occurred in proactive token refresh worker loop:', err);
    }
  }, 5 * 60 * 1000);
};
