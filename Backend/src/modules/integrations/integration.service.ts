// Integration Service — OAuth flow and normalization sync coordinator
// Refactored to use provider-metadata registry and oauth-config objects
// instead of hardcoded if/else chains.

import prisma from '../../database/prisma.client';
import { getProviderAdapter } from '../../providers/provider.registry';
import { IntegrationDTO, OAuthUrlResponse, SyncResponse, IntegrationStatus, DisconnectOptions } from './integration.types';
import { PROVIDER_REGISTRY, getProviderMeta, getAllProviderKeys } from './provider-metadata';
import { getOAuthConfig, supportsOAuth } from './oauth-config';
import { memoryLogs } from '../../middleware/logging.middleware';
import { logger } from '../../utils/logger';

// ────────────────────────────────────────────────────────────────
// LOGGING HELPER
// ────────────────────────────────────────────────────────────────

/**
 * Log integration lifecycle events to the ApiLog table (or memory fallback).
 * Every connect, sync, refresh, disconnect, and revoke action generates a log.
 */
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

// ────────────────────────────────────────────────────────────────
// GET INTEGRATIONS (enriched with provider metadata + synced counts)
// ────────────────────────────────────────────────────────────────

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

  // Use the provider registry as the canonical list
  const allProviderKeys = getAllProviderKeys();

  // Fetch synced record counts per provider for the org
  let syncedCountsByProvider: Record<string, { contacts: number; companies: number; deals: number }> = {};
  if (organizationId) {
    try {
      const [contactCounts, companyCounts, dealCounts] = await Promise.all([
        prisma.contact.groupBy({ by: ['provider'], where: { organizationId }, _count: true }),
        prisma.company.groupBy({ by: ['provider'], where: { organizationId }, _count: true }),
        prisma.deal.groupBy({ by: ['provider'], where: { organizationId }, _count: true }),
      ]);
      for (const c of contactCounts) {
        if (!syncedCountsByProvider[c.provider]) syncedCountsByProvider[c.provider] = { contacts: 0, companies: 0, deals: 0 };
        syncedCountsByProvider[c.provider].contacts = c._count;
      }
      for (const c of companyCounts) {
        if (!syncedCountsByProvider[c.provider]) syncedCountsByProvider[c.provider] = { contacts: 0, companies: 0, deals: 0 };
        syncedCountsByProvider[c.provider].companies = c._count;
      }
      for (const d of dealCounts) {
        if (!syncedCountsByProvider[d.provider]) syncedCountsByProvider[d.provider] = { contacts: 0, companies: 0, deals: 0 };
        syncedCountsByProvider[d.provider].deals = d._count;
      }
    } catch (err) {
      logger.warn('Failed to fetch synced counts:', err);
    }
  }

  return allProviderKeys.map((providerKey) => {
    const meta = getProviderMeta(providerKey);
    if (!meta) return null;

    const conn = dbConnections.find((c) => c.provider === providerKey);
    const isMock = providerKey === 'mock';
    const currentStatus: IntegrationStatus = (conn?.status as IntegrationStatus) || (isMock ? 'Connected' : 'Not Connected');

    return {
      id: conn?.id || `new-${providerKey}`,
      provider: providerKey,
      category: meta.category,
      displayName: meta.displayName,
      status: currentStatus,
      connectedAt: conn?.connectedAt?.toISOString() || (isMock ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString()),
      lastSyncedAt: conn?.lastSyncedAt?.toISOString() || (isMock ? new Date(Date.now() - 10 * 60 * 1000).toISOString() : undefined),
      connectedAccount: (conn as any)?.connectedAccount || (isMock ? `mock@unifiedcrm.io` : undefined),
      capabilities: meta.capabilities,
      oauthVersion: meta.oauthVersion,
      syncedCounts: syncedCountsByProvider[providerKey] || (isMock ? { contacts: 12, companies: 5, deals: 8 } : undefined),
      expiresAt: conn?.expiresAt?.toISOString(),
      comingSoon: meta.comingSoon,
      scopes: meta.scopes,
    } as IntegrationDTO;
  }).filter(Boolean) as IntegrationDTO[];
};

// ────────────────────────────────────────────────────────────────
// GENERATE OAUTH AUTHORIZATION URL
// Uses oauth-config.ts lookup instead of if/else chains
// ────────────────────────────────────────────────────────────────

export const generateAuthorizationUrl = async (
  provider: string,
  userId: string
): Promise<OAuthUrlResponse> => {
  const p = provider.toLowerCase();
  const config = getOAuthConfig(p);

  if (!config) {
    // Provider doesn't use OAuth — fall back to simulation
    logger.info(`No OAuth config for ${provider}. Falling back to simulation mode.`);
    return {
      provider,
      authorizationUrl: `http://localhost:3000/api/v1/integrations/${p}/oauth-simulate?userId=${userId}`,
    };
  }

  // Read credentials from env using the config's env key names
  const clientId = process.env[config.clientIdEnvKey] || '';
  const redirectUri = process.env[config.redirectUriEnvKey] || `http://localhost:3000/api/v1/integrations/${p}/callback`;

  // If Client ID is placeholder, route to local simulation endpoint
  if (!clientId || clientId.startsWith('your_')) {
    logger.info(`OAuth credentials not configured for ${provider}. Falling back to simulation mode.`);
    return {
      provider,
      authorizationUrl: `http://localhost:3000/api/v1/integrations/${p}/oauth-simulate?userId=${userId}`,
    };
  }

  // Build real OAuth authorization URL
  const scopeStr = config.scopes.join(config.scopeDelimiter || ' ');
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: userId,
    ...(scopeStr ? { scope: scopeStr } : {}),
  });

  return {
    provider,
    authorizationUrl: `${config.authBaseUrl}?${query.toString()}`,
  };
};

// ────────────────────────────────────────────────────────────────
// EXCHANGE AUTHORIZATION CODE FOR TOKENS
// ────────────────────────────────────────────────────────────────

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
    // Real Token Exchange — lookup config
    const config = getOAuthConfig(p);
    if (!config) {
      throw new Error(`No OAuth configuration found for provider: ${provider}`);
    }

    const clientId = process.env[config.clientIdEnvKey]!;
    const clientSecret = process.env[config.clientSecretEnvKey]!;
    const redirectUri = process.env[config.redirectUriEnvKey]!;

    try {
      const res = await fetch(config.tokenUrl, {
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
      } else if (config.tokenExpirySeconds) {
        expiresAt = new Date(Date.now() + config.tokenExpirySeconds * 1000);
      }
    } catch (err: any) {
      await logIntegrationEvent(userId, `OAuth Token Exchange Failed for ${provider}`, true, err.message);
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

  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected via OAuth`);
};

// ────────────────────────────────────────────────────────────────
// TOKEN REFRESH (with coalescing to prevent duplicate refreshes)
// ────────────────────────────────────────────────────────────────

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
      await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Token Refreshed (Mock)`);
      return;
    }

    // Real Token Refresh — lookup config
    const config = getOAuthConfig(p);
    if (!config) {
      throw new Error(`No OAuth configuration found for provider: ${provider}`);
    }

    const clientId = process.env[config.clientIdEnvKey]!;
    const clientSecret = process.env[config.clientSecretEnvKey]!;

    try {
      const res = await fetch(config.tokenUrl, {
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

// ────────────────────────────────────────────────────────────────
// PROVIDER-SIDE TOKEN REVOCATION
// Calls the provider's revoke endpoint if one exists
// ────────────────────────────────────────────────────────────────

const revokeProviderToken = async (provider: string, token: string): Promise<void> => {
  const config = getOAuthConfig(provider);
  if (!config?.revokeUrl) {
    logger.info(`Provider ${provider} does not have a revoke endpoint. Skipping provider-side revocation.`);
    return;
  }

  // Don't attempt revocation for mock tokens
  if (token.startsWith('mock-')) {
    logger.info(`Skipping provider-side revocation for mock token.`);
    return;
  }

  try {
    logger.info(`Revoking token at provider ${provider}: ${config.revokeUrl}`);
    const res = await fetch(config.revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token }),
    });

    if (res.ok) {
      logger.info(`Provider-side revocation succeeded for ${provider}`);
    } else {
      logger.warn(`Provider-side revocation returned status ${res.status} for ${provider}`);
    }
  } catch (err: any) {
    // Revocation failure should NOT block the disconnect flow
    logger.warn(`Provider-side revocation failed for ${provider}: ${err.message}`);
  }
};

// ────────────────────────────────────────────────────────────────
// DISCONNECT / REVOKE CONNECTION
// Supports both Policy A (delete data) and Policy B (retain data)
// ────────────────────────────────────────────────────────────────

export const revokeConnection = async (
  provider: string,
  userId: string,
  options?: DisconnectOptions
): Promise<void> => {
  const p = provider.toLowerCase();
  const retainData = options?.retainData ?? false;

  // Step 1: Look up the connection to get the token for revocation
  const conn = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: p } },
  });

  // Step 2: Attempt provider-side token revocation
  if (conn?.accessToken) {
    await revokeProviderToken(p, conn.accessToken);
  }

  // Step 3: Delete the integration record
  if (conn) {
    await prisma.integration.delete({
      where: { id: conn.id },
    });
  }

  // Step 4: Handle synced data based on retainData flag
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberships: { select: { organizationId: true } } },
  });

  const organizationId = user?.memberships[0]?.organizationId;
  if (organizationId && !retainData) {
    // Policy A: Delete all synced records from this provider
    await prisma.contact.deleteMany({
      where: { provider: p, organizationId },
    });
    await prisma.company.deleteMany({
      where: { provider: p, organizationId },
    });
    await prisma.deal.deleteMany({
      where: { provider: p, organizationId },
    });
    logger.info(`Deleted synced data for provider ${p} in org ${organizationId}`);
  } else if (organizationId && retainData) {
    // Policy B: Data is retained (no deletion) — records remain with their provider tag
    // Users can distinguish them by provider field and the integration being disconnected
    logger.info(`Retaining synced data for provider ${p} in org ${organizationId} (retainData=true)`);
  }

  // Step 5: Log the event
  const action = retainData ? 'Disconnected (Data Retained)' : 'Disconnected & Data Purged';
  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} ${action}`);
};

// ────────────────────────────────────────────────────────────────
// SYNC PROVIDER DATA (fetch + normalize + upsert)
// ────────────────────────────────────────────────────────────────

export const syncProviderData = async (
  provider: string,
  userId: string,
  organizationId: string
): Promise<SyncResponse> => {
  const p = provider.toLowerCase();
  const syncStart = Date.now();
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
    const duration = Date.now() - syncStart;

    await prisma.integration.update({
      where: { id: conn.id },
      data: {
        status: 'Connected',
        lastSyncedAt,
      },
    });

    await logIntegrationEvent(
      userId,
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sync Completed — ${contacts.length} contacts, ${companies.length} companies, ${syncedDealsCount} deals in ${(duration / 1000).toFixed(1)}s`
    );

    return {
      provider,
      status: 'success',
      syncedCounts: {
        contacts: contacts.length,
        companies: companies.length,
        deals: syncedDealsCount,
      },
      lastSyncedAt: lastSyncedAt.toISOString(),
      duration,
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

// ────────────────────────────────────────────────────────────────
// GET PROVIDER METADATA (public — for frontend catalog)
// ────────────────────────────────────────────────────────────────

export const getProviderMetadataList = () => {
  return PROVIDER_REGISTRY;
};

// ────────────────────────────────────────────────────────────────
// PROACTIVE TOKEN REFRESH SCHEDULER
// Scans DB every 5 minutes and refreshes tokens expiring within 15 minutes
// ────────────────────────────────────────────────────────────────

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
