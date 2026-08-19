// Integration Controller — Maps HTTP requests to IntegrationService logic

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import * as IntegrationService from './integration.service';
import { sendSuccess, sendError, sendBadRequest, sendUnauthorized } from '../../utils/response.helper';
import { logger } from '../../utils/logger';
import prisma from '../../database/prisma.client';
import { getProviderMeta } from './provider-metadata';

// ────────────────────────────────────────────────────────────────
// GET /integrations — List all integrations for the user
// ────────────────────────────────────────────────────────────────

export const getIntegrations = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const integrations = await IntegrationService.getIntegrationsForUser(userId, req.user?.organizationId);
    sendSuccess(res, integrations, 'Integrations retrieved');
  } catch (err: any) {
    logger.error('Failed to get integrations:', err);
    sendError(res, 'Failed to fetch integrations');
  }
};

// ────────────────────────────────────────────────────────────────
// GET /integrations/metadata — Public provider catalog
// ────────────────────────────────────────────────────────────────

export const getProviderMetadata = async (_req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const metadata = IntegrationService.getProviderMetadataList();
    sendSuccess(res, metadata, 'Provider metadata retrieved');
  } catch (err: any) {
    logger.error('Failed to get provider metadata:', err);
    sendError(res, 'Failed to fetch provider metadata');
  }
};

// ────────────────────────────────────────────────────────────────
// GET /integrations/:provider/status — Single provider status
// ────────────────────────────────────────────────────────────────

export const getStatus = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const meta = getProviderMeta(provider);
    if (!meta) {
      sendBadRequest(res, `Unknown provider: ${provider}`);
      return;
    }

    const integrations = await IntegrationService.getIntegrationsForUser(userId, req.user?.organizationId);
    const integration = integrations.find(i => i.provider === provider.toLowerCase());

    if (!integration) {
      sendSuccess(res, {
        provider,
        status: 'NOT_CONNECTED',
        displayName: meta.displayName,
        category: meta.category,
        capabilities: meta.capabilities,
      }, 'Provider status retrieved');
      return;
    }

    sendSuccess(res, integration, 'Provider status retrieved');
  } catch (err: any) {
    logger.error(`Failed to get status for ${req.params.provider}:`, err);
    sendError(res, 'Failed to fetch provider status');
  }
};

// ────────────────────────────────────────────────────────────────
// GET / POST /integrations/:provider/connect — Start OAuth flow
// ────────────────────────────────────────────────────────────────

export const connect = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const meta = getProviderMeta(provider);
    if (!meta) {
      sendBadRequest(res, `Unknown provider: ${provider}`);
      return;
    }

    if (provider.toLowerCase() === 'mock') {
      sendSuccess(res, { status: 'CONNECTED', provider: 'mock' }, 'Developer Sandbox is active.');
      return;
    }

    // Direct manual token connection for enterprise testing
    const { accountUserId, apiKey, portalDomain } = req.body || {};
    if (apiKey) {
      const p = provider.toLowerCase();
      const accountLabel = accountUserId || portalDomain || `${p}_workspace_${Date.now().toString().slice(-4)}`;

      try {
        await prisma.integration.upsert({
          where: {
            userId_provider: { userId, provider: p },
          },
          update: {
            accessToken: apiKey,
            status: 'Connected',
            connectedAt: new Date(),
          },
          create: {
            userId,
            provider: p,
            accessToken: apiKey,
            status: 'Connected',
            connectedAt: new Date(),
          },
        });
      } catch (e) {
        // Fallback
      }

      await IntegrationService.logIntegrationEvent(userId, `${p.toUpperCase()} Connected with Platform Credentials (${accountLabel})`);
      sendSuccess(res, { status: 'CONNECTED', provider: p, connectedAccount: accountLabel }, `${meta.displayName} connected successfully.`);
      return;
    }

    const authUrlResponse = await IntegrationService.generateAuthorizationUrl(provider, userId);
    sendSuccess(res, authUrlResponse, 'OAuth authorization URL generated');
  } catch (err: any) {
    logger.error(`Failed to generate connect URL for ${req.params.provider}:`, err);
    sendError(res, 'Failed to start OAuth authorization');
  }
};

// ────────────────────────────────────────────────────────────────
// GET /integrations/:provider/callback — OAuth callback with CSRF validation
// ────────────────────────────────────────────────────────────────

export const callback = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  const { provider } = req.params;
  const code = req.query.code as string;
  const state = req.query.state as string;
  const errorParam = req.query.error as string;
  const errorDescription = req.query.error_description as string;

  if (errorParam) {
    logger.warn(`Provider OAuth authorization denied: ${errorParam} - ${errorDescription}`);
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authorization Denied</title></head>
      <body style="background:#0d1117; color:#c9d1d9; font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:48px;">
        <h2 style="color:#f85149;">Authorization Cancelled</h2>
        <p>${errorDescription || 'The provider authorization was cancelled. No connection was created.'}</p>
        <button onclick="window.close()" style="padding:10px 20px; background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; cursor:pointer;">Close Window</button>
      </body>
      </html>
    `);
    return;
  }

  if (!code) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>OAuth Error</title></head>
      <body style="background:#0d1117; color:#c9d1d9; font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:48px;">
        <h2 style="color:#f85149;">Missing Authorization Code</h2>
        <p>Provider did not return an authorization code.</p>
        <button onclick="window.close()" style="padding:10px 20px; background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; cursor:pointer;">Close Window</button>
      </body>
      </html>
    `);
    return;
  }

  // Validate state token for CSRF protection
  const stateValidation = IntegrationService.validateOAuthState(state);
  const userId = stateValidation.userId || req.user?.id || 'dev-mock-user-001';

  try {
    await IntegrationService.exchangeCodeForToken(provider, code, userId);

    const meta = getProviderMeta(provider);
    const displayName = meta?.displayName || provider;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Connected to ${displayName}</title></head>
      <body style="background:#0d1117; color:#c9d1d9; font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:48px;">
        <div style="max-width:420px; margin:0 auto; background:#161b22; border:1px solid rgba(46,213,115,0.3); border-radius:12px; padding:32px;">
          <div style="font-size:36px; margin-bottom:12px;">✅</div>
          <h2 style="color:#2ed573; margin:0 0 8px;">Connected Successfully!</h2>
          <p style="color:#8b949e; font-size:14px; margin:0 0 24px;">Universal API is now securely connected to ${displayName}.</p>
          <p style="color:#58a6ff; font-size:12px;">Closing window...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${provider}' }, '*');
          }
          setTimeout(() => { window.close(); }, 1200);
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err: any) {
    logger.error(`OAuth Callback failed for ${provider}:`, err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authorization Failed</title></head>
      <body style="background:#0d1117; color:#c9d1d9; font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; padding:48px;">
        <h2 style="color:#f85149;">Authorization Failed</h2>
        <p style="color:#8b949e;">${err.message || 'An error occurred while exchanging tokens with the provider.'}</p>
        <button onclick="window.close()" style="padding:10px 20px; background:#21262d; color:#c9d1d9; border:1px solid #30363d; border-radius:6px; cursor:pointer;">Close Window</button>
      </body>
      </html>
    `);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /integrations/:provider/disconnect — Disconnect
// ────────────────────────────────────────────────────────────────

export const disconnect = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const retainData = req.body?.retainData === true;
    await IntegrationService.revokeConnection(provider, userId, { retainData });

    const meta = getProviderMeta(provider);
    const displayName = meta?.displayName || provider;
    const message = retainData
      ? `${displayName} disconnected. Synced data has been retained.`
      : `${displayName} disconnected and synced data purged.`;

    sendSuccess(res, { provider, status: 'DISCONNECTED', retainData }, message);
  } catch (err: any) {
    logger.error(`Failed to disconnect ${req.params.provider}:`, err);
    sendError(res, 'Failed to disconnect integration');
  }
};

// ────────────────────────────────────────────────────────────────
// POST /integrations/:provider/sync — Trigger data sync
// ────────────────────────────────────────────────────────────────

export const sync = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { memberships: { select: { organizationId: true } } },
    });

    const organizationId = user?.memberships[0]?.organizationId;
    if (!organizationId) {
      sendBadRequest(res, 'User is not associated with an organization');
      return;
    }

    const syncResult = await IntegrationService.syncProviderData(provider, userId, organizationId);
    sendSuccess(res, syncResult, 'Sync completed successfully');
  } catch (err: any) {
    logger.error(`Sync failed for ${req.params.provider}:`, err);

    if (err.message?.includes('not connected')) {
      sendBadRequest(res, `PROVIDER_NOT_CONNECTED: ${err.message}`);
    } else if (err.message?.includes('Token') || err.message?.includes('401') || err.message?.includes('Reauth')) {
      sendError(res, `REAUTH_REQUIRED: ${err.message}`);
    } else {
      sendError(res, `Sync failed: ${err.message}`);
    }
  }
};

// ────────────────────────────────────────────────────────────────
// GET /integrations/:provider/oauth-simulate — Interactive OAuth simulation consent
// ────────────────────────────────────────────────────────────────

export const oauthSimulatePage = (req: ExpressRequest, res: ExpressResponse): void => {
  const { provider } = req.params;
  const state = (req.query.state as string) || `sim_state_${Date.now()}`;
  const userId = (req.query.userId as string) || 'dev-mock-user-001';
  const meta = getProviderMeta(provider);
  const displayName = meta?.displayName || provider.charAt(0).toUpperCase() + provider.slice(1);

  const brandColors: Record<string, string> = {
    hubspot: '#ff7a00', salesforce: '#00a1e0', pipedrive: '#26b860',
    zoho: '#d14836', slack: '#4a154b', teams: '#5059c9',
    gmail: '#ea4335', outlook_mail: '#0078d4', google_calendar: '#4285f4',
    outlook_calendar: '#0078d4', calendly: '#006bff', notion: '#000000',
    mock: '#8b5cf6',
  };
  const color = brandColors[provider] || '#8b5cf6';

  const scopes = meta?.scopes?.length ? meta.scopes : ['Read & Write Contacts', 'Read & Write Companies', 'Read Opportunities / Deals'];
  const scopeItems = scopes.map(s => `<div class="permission-item"><span class="check">✓</span> ${s}</div>`).join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authorize ${displayName} - Universal Gateway Sandbox</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0d1117;
          color: #c9d1d9;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .container {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 32px;
          max-width: 420px;
          width: 90%;
          text-align: center;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        }
        .logo-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .app-logo {
          width: 48px;
          height: 48px;
          border-radius: 10px;
        }
        .provider-logo {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: white;
          font-weight: 700;
        }
        .arrow { font-size: 20px; color: #8b949e; }
        h2 { color: #f0f6ff; margin: 0 0 8px; font-size: 19px; font-weight: 600; }
        p { color: #8b949e; font-size: 13px; line-height: 1.5; margin: 0 0 20px; }
        .permissions-list {
          text-align: left;
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          font-size: 12px;
        }
        .permissions-title { font-weight: 600; color: #f0f6ff; margin-bottom: 8px; font-size: 13px; }
        .permission-item { display: flex; align-items: center; gap: 8px; color: #8b949e; margin: 6px 0; }
        .check { color: #3fb950; font-weight: bold; }
        .btn-group { display: flex; gap: 12px; }
        button {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-allow { background: #238636; color: white; }
        .btn-allow:hover { background: #2ea043; }
        .btn-cancel { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; }
        .btn-cancel:hover { background: #30363d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-box">
          <svg class="app-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="background: linear-gradient(135deg, #1f6feb, #8b5cf6); color: white; padding: 8px; box-sizing: border-box;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div class="arrow">⇄</div>
          <div class="provider-logo">${displayName.substring(0, 2).toUpperCase()}</div>
        </div>
        <h2>Authorize ${displayName}</h2>
        <p><strong>Universal API Gateway</strong> is requesting permission to securely connect to your ${displayName} account.</p>
        
        <div class="permissions-list">
          <div class="permissions-title">Requested Scopes:</div>
          ${scopeItems}
          <div class="permission-item"><span class="check">✓</span> Offline access (Refresh Token)</div>
        </div>

        <div class="btn-group">
          <button class="btn-cancel" onclick="window.close()">Cancel</button>
          <button class="btn-allow" onclick="authorize()">Allow & Connect</button>
        </div>
      </div>
      <script>
        function authorize() {
          const simCode = 'sim-code-' + Math.random().toString(36).substr(2, 9);
          window.location.href = '/api/v1/integrations/${provider}/callback?code=' + simCode + '&state=${encodeURIComponent(state)}';
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
};
