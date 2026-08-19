// Integration Service — OAuth flow and normalization sync coordinator

import prisma from '../../database/prisma.client';
import { getProviderAdapter } from '../../providers/provider.registry';
import { IntegrationDTO, OAuthUrlResponse, SyncResponse, IntegrationStatus, DisconnectOptions } from './integration.types';
import { PROVIDER_REGISTRY, getProviderMeta, getAllProviderKeys } from './provider-metadata';
import { getOAuthConfig } from './oauth-config';
import { memoryLogs } from '../../middleware/logging.middleware';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

// In-memory OAuth state cache for CSRF protection (valid for 15 minutes)
const oauthStateCache = new Map<string, { userId: string; createdAt: number }>();

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateCache.entries()) {
    if (now - data.createdAt > 15 * 60 * 1000) {
      oauthStateCache.delete(state);
    }
  }
}, 5 * 60 * 1000);

// ────────────────────────────────────────────────────────────────
// CREDENTIAL CONFIGURATION CHECK
// ────────────────────────────────────────────────────────────────

/**
 * Check if the required OAuth credentials for a provider are present in .env
 */
export const checkProviderConfiguration = (provider: string): { isConfigured: boolean; missingKeys: string[] } => {
  const p = provider.toLowerCase();
  if (p === 'mock') {
    return { isConfigured: true, missingKeys: [] };
  }

  const config = getOAuthConfig(p);
  if (!config) {
    return { isConfigured: false, missingKeys: ['OAUTH_CONFIG_MISSING'] };
  }

  const missingKeys: string[] = [];
  const clientId = process.env[config.clientIdEnvKey];
  const clientSecret = process.env[config.clientSecretEnvKey];

  if (!clientId || clientId.trim() === '' || clientId.startsWith('your_')) {
    missingKeys.push(config.clientIdEnvKey);
  }
  if (!clientSecret || clientSecret.trim() === '' || clientSecret.startsWith('your_')) {
    missingKeys.push(config.clientSecretEnvKey);
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
};

// ────────────────────────────────────────────────────────────────
// LOGGING HELPER
// ────────────────────────────────────────────────────────────────

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
    userAgent: 'Universal-API-Gateway/1.0',
    errorMessage: errorMsg || null,
  };

  try {
    await prisma.apiLog.create({
      data: logData,
    });
  } catch (err) {
    memoryLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...logData,
      timestamp: new Date().toISOString(),
    });
    if (memoryLogs.length > 100) memoryLogs.pop();
  }
};

// ────────────────────────────────────────────────────────────────
// GET INTEGRATIONS (enriched with status, config check, and counts)
// ────────────────────────────────────────────────────────────────

export const getIntegrationsForUser = async (userId: string, organizationId?: string): Promise<IntegrationDTO[]> => {
  let userIds = [userId];
  if (organizationId) {
    try {
      const orgMembers = await prisma.orgMember.findMany({
        where: { organizationId },
        select: { userId: true },
      });
      if (orgMembers.length > 0) {
        userIds = orgMembers.map(m => m.userId);
      }
    } catch (err) {
      // Fallback
    }
  }

  let dbConnections: any[] = [];
  try {
    dbConnections = await prisma.integration.findMany({
      where: { userId: { in: userIds } },
    });
  } catch (err) {
    logger.warn('Failed to query integration connections from DB:', err);
  }

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

    const isMock = providerKey === 'mock';
    const conn = dbConnections.find((c) => c.provider === providerKey);
    const { isConfigured, missingKeys } = checkProviderConfiguration(providerKey);

    let currentStatus: IntegrationStatus = 'NOT_CONNECTED';

    if (isMock) {
      currentStatus = 'CONNECTED';
    } else if (conn) {
      const dbStatus = conn.status;
      if (dbStatus === 'Connected') {
        if (conn.expiresAt && new Date() >= new Date(conn.expiresAt)) {
          currentStatus = 'TOKEN_EXPIRED';
        } else {
          currentStatus = 'CONNECTED';
        }
      } else if (dbStatus === 'Syncing') {
        currentStatus = 'SYNCING';
      } else if (dbStatus === 'Connecting') {
        currentStatus = 'CONNECTING';
      } else if (dbStatus === 'Expired' || dbStatus === 'TOKEN_EXPIRED') {
        currentStatus = 'TOKEN_EXPIRED';
      } else if (dbStatus === 'Reauth Required' || dbStatus === 'REAUTH_REQUIRED') {
        currentStatus = 'REAUTH_REQUIRED';
      } else if (dbStatus === 'Revoked' || dbStatus === 'REVOKED') {
        currentStatus = 'REVOKED';
      } else if (dbStatus === 'Connection Failed' || dbStatus === 'CONNECTION_ERROR') {
        currentStatus = 'CONNECTION_ERROR';
      } else if (dbStatus === 'Disconnected' || dbStatus === 'DISCONNECTED') {
        currentStatus = 'DISCONNECTED';
      } else {
        currentStatus = 'CONNECTED';
      }
    } else {
      if (!isConfigured) {
        currentStatus = 'CONFIGURATION_REQUIRED';
      } else {
        currentStatus = 'NOT_CONNECTED';
      }
    }

    return {
      id: conn?.id || `new-${providerKey}`,
      provider: providerKey,
      category: meta.category,
      displayName: meta.displayName,
      status: currentStatus,
      isConfigured,
      missingEnvKeys: missingKeys,
      connectedAt: conn?.connectedAt?.toISOString() || (isMock ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : new Date().toISOString()),
      lastSyncedAt: conn?.lastSyncedAt?.toISOString() || (isMock ? new Date(Date.now() - 10 * 60 * 1000).toISOString() : undefined),
      connectedAccount: (conn as any)?.connectedAccount || (isMock ? `sandbox@universalapi.io` : undefined),
      capabilities: meta.capabilities,
      oauthVersion: meta.oauthVersion,
      syncedCounts: syncedCountsByProvider[providerKey] || (isMock ? { contacts: 12, companies: 5, deals: 8 } : undefined),
      expiresAt: conn?.expiresAt?.toISOString(),
      scopes: meta.scopes,
      docsUrl: meta.docsUrl,
    } as IntegrationDTO;
  }).filter(Boolean) as IntegrationDTO[];
};

// ────────────────────────────────────────────────────────────────
// GENERATE OAUTH AUTHORIZATION URL (with CSRF state)
// ────────────────────────────────────────────────────────────────

export const generateAuthorizationUrl = async (
  provider: string,
  userId: string
): Promise<OAuthUrlResponse> => {
  const p = provider.toLowerCase();
  const config = getOAuthConfig(p);

  if (!config) {
    throw new Error(`No OAuth configuration found for provider: ${provider}`);
  }

  // Generate random CSRF state token and cache it
  const stateToken = `${p}_${crypto.randomBytes(16).toString('hex')}`;
  oauthStateCache.set(stateToken, { userId, createdAt: Date.now() });

  const clientId = process.env[config.clientIdEnvKey] || '';
  const redirectUri = process.env[config.redirectUriEnvKey] || `http://localhost:3000/api/v1/integrations/${p}/callback`;

  // If credentials are not set in .env, route to simulated consent page for local testing
  if (!clientId || clientId.startsWith('your_')) {
    logger.info(`OAuth credentials not configured in .env for ${provider}. Routing to simulated OAuth authorization.`);
    return {
      provider,
      authorizationUrl: `http://localhost:3000/api/v1/integrations/${p}/oauth-simulate?state=${stateToken}&userId=${userId}`,
      state: stateToken,
    };
  }

  const scopeStr = config.scopes.join(config.scopeDelimiter || ' ');
  const queryParams: Record<string, string> = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: stateToken,
    ...(scopeStr ? { scope: scopeStr } : {}),
    ...(config.extraAuthParams || {}),
  };

  const query = new URLSearchParams(queryParams);

  return {
    provider,
    authorizationUrl: `${config.authBaseUrl}?${query.toString()}`,
    state: stateToken,
  };
};

// ────────────────────────────────────────────────────────────────
// VALIDATE CSRF STATE
// ────────────────────────────────────────────────────────────────

export const validateOAuthState = (state: string): { valid: boolean; userId?: string } => {
  if (!state) return { valid: false };

  // Check state cache
  const cached = oauthStateCache.get(state);
  if (cached) {
    oauthStateCache.delete(state); // Prevent replay attacks
    return { valid: true, userId: cached.userId };
  }

  // If state was directly a userId (fallback for development simulation)
  if (state.startsWith('usr-') || state.startsWith('dev-')) {
    return { valid: true, userId: state };
  }

  return { valid: false };
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

  if (code.startsWith('mock-') || code.startsWith('sim-')) {
    // Simulated token generation for development
    accessToken = `mock-access-token-${p}-${Date.now()}`;
    refreshToken = `mock-refresh-token-${p}-${Date.now()}`;
    expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  } else {
    // Real OAuth exchange
    const config = getOAuthConfig(p);
    if (!config) {
      throw new Error(`No OAuth configuration found for provider: ${provider}`);
    }

    const clientId = process.env[config.clientIdEnvKey];
    const clientSecret = process.env[config.clientSecretEnvKey];
    const redirectUri = process.env[config.redirectUriEnvKey] || `http://localhost:3000/api/v1/integrations/${p}/callback`;

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials (${config.clientIdEnvKey} or ${config.clientSecretEnvKey}) in environment.`);
    }

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
        const errText = await res.text();
        throw new Error(`Token exchange failed (${res.status}): ${errText}`);
      }

      const body: any = await res.json();
      accessToken = body.access_token;
      refreshToken = body.refresh_token || '';

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

  // Save tokens to DB (prisma proxy automatically handles AES-256 encryption)
  await prisma.integration.upsert({
    where: {
      userId_provider: { userId, provider: p },
    },
    update: {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt,
      status: 'Connected',
      connectedAt: new Date(),
    },
    create: {
      userId,
      provider: p,
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt,
      status: 'Connected',
      connectedAt: new Date(),
    },
  });

  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected via OAuth`);
};

// ────────────────────────────────────────────────────────────────
// TOKEN REFRESH
// ────────────────────────────────────────────────────────────────

const refreshLocks = new Map<string, Promise<void>>();

export const refreshAccessToken = async (provider: string, userId: string): Promise<void> => {
  const p = provider.toLowerCase();
  const lockKey = `${userId}:${p}`;

  if (refreshLocks.has(lockKey)) {
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
        data: { status: 'Reauth Required' },
      });
      await logIntegrationEvent(userId, `Token Refresh Failed / Reauth Required for ${provider}`, true, err.message);
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
// PROVIDER TOKEN REVOCATION
// ────────────────────────────────────────────────────────────────

const revokeProviderToken = async (provider: string, token: string): Promise<void> => {
  const config = getOAuthConfig(provider);
  if (!config?.revokeUrl || token.startsWith('mock-')) {
    return;
  }

  try {
    logger.info(`Revoking token at provider ${provider}: ${config.revokeUrl}`);
    await fetch(config.revokeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
  } catch (err: any) {
    logger.warn(`Provider-side revocation failed for ${provider}: ${err.message}`);
  }
};

// ────────────────────────────────────────────────────────────────
// DISCONNECT / REVOKE
// ────────────────────────────────────────────────────────────────

export const revokeConnection = async (
  provider: string,
  userId: string,
  options?: DisconnectOptions
): Promise<void> => {
  const p = provider.toLowerCase();
  const retainData = options?.retainData ?? false;

  const conn = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: p } },
  });

  if (conn?.accessToken) {
    await revokeProviderToken(p, conn.accessToken);
  }

  if (conn) {
    await prisma.integration.delete({
      where: { id: conn.id },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberships: { select: { organizationId: true } } },
  });

  const organizationId = user?.memberships[0]?.organizationId;
  if (organizationId && !retainData) {
    await prisma.contact.deleteMany({ where: { provider: p, organizationId } });
    await prisma.company.deleteMany({ where: { provider: p, organizationId } });
    await prisma.deal.deleteMany({ where: { provider: p, organizationId } });
    logger.info(`Purged synced data for provider ${p} in org ${organizationId}`);
  }

  const action = retainData ? 'Disconnected (Data Retained)' : 'Disconnected & Data Purged';
  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} ${action}`);
};

// ────────────────────────────────────────────────────────────────
// DATA SYNC & NORMALIZATION COORDINATOR
// ────────────────────────────────────────────────────────────────

export const syncProviderData = async (
  provider: string,
  userId: string,
  organizationId: string
): Promise<SyncResponse> => {
  const p = provider.toLowerCase();
  const syncStart = Date.now();
  logger.info(`Starting sync for ${provider} under org: ${organizationId}`);

  let conn = null;
  if (p !== 'mock') {
    conn = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: p } },
    });

    if (!conn) {
      throw new Error(`Integration for ${provider} is not connected.`);
    }

    // Check and refresh token if expired
    if (conn.expiresAt && new Date() >= new Date(conn.expiresAt)) {
      logger.info(`Access token expired for ${provider}. Refreshing...`);
      await refreshAccessToken(p, userId);
    }

    await prisma.integration.update({
      where: { id: conn.id },
      data: { status: 'Syncing' },
    });
  }

  await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sync Started`);

  try {
    const adapter = await getProviderAdapter(p, userId);

    // Fetch and Normalize Contacts / Items
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

    // Fetch and Normalize Companies / Workspaces
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

    // Fetch Deals if applicable
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
    } catch {
      // Non-CRM providers return 0 deals cleanly
    }

    const lastSyncedAt = new Date();
    const duration = Date.now() - syncStart;

    if (conn) {
      await prisma.integration.update({
        where: { id: conn.id },
        data: {
          status: 'Connected',
          lastSyncedAt,
        },
      });
    }

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
    if (conn) {
      await prisma.integration.update({
        where: { id: conn.id },
        data: { status: 'Connection Failed' },
      });
    }
    await logIntegrationEvent(userId, `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sync Failed`, true, err.message);
    throw err;
  }
};

export const getProviderMetadataList = () => {
  return PROVIDER_REGISTRY;
};

// ────────────────────────────────────────────────────────────────
// PROACTIVE TOKEN REFRESH SCHEDULER
// Scans DB every 5 minutes and refreshes tokens expiring within 15 minutes
// ────────────────────────────────────────────────────────────────

export const startProactiveRefreshScheduler = (): void => {
  logger.info('⏰ Proactive OAuth Token Refresh Scheduler initialized');

  setInterval(async () => {
    try {
      const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);

      const expiringConnections = await prisma.integration.findMany({
        where: {
          status: 'Connected',
          expiresAt: {
            lte: fifteenMinutesFromNow,
            gt: new Date(),
          },
        },
      });

      if (expiringConnections.length === 0) return;

      for (const conn of expiringConnections) {
        logger.info(`Proactively refreshing token for user ${conn.userId}, provider ${conn.provider}`);
        await refreshAccessToken(conn.provider, conn.userId).catch((err) => {
          logger.error(`Proactive refresh failed for ${conn.provider}:`, err);
        });
      }
    } catch (err) {
      // Background worker safe catch
    }
  }, 5 * 60 * 1000);
};

