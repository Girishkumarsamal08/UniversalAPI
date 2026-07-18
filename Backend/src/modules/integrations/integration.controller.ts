// Integration Controller — Maps HTTP requests to IntegrationService logic
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import * as IntegrationService from './integration.service';
import { sendSuccess, sendError, sendBadRequest, sendUnauthorized } from '../../utils/response.helper';
import { logger } from '../../utils/logger';
import prisma from '../../database/prisma.client';

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

export const connect = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const userRole = req.user?.role || 'Developer';
    if (userRole !== 'CTO' && userRole !== 'Admin') {
      // Create approval request instead of executing
      await prisma.approvalRequest.create({
        data: {
          organizationId: req.user?.organizationId!,
          userId: userId,
          action: 'ADD_INTEGRATION',
          targetId: provider,
          status: 'PENDING',
        },
      });
      sendSuccess(res, { url: '', status: 'PENDING_APPROVAL' }, 'Connection request submitted for administrator approval.');
      return;
    }

    const authUrl = await IntegrationService.generateAuthorizationUrl(provider, userId);
    sendSuccess(res, authUrl, 'OAuth URL generated');
  } catch (err: any) {
    logger.error(`Failed to connect for ${req.params.provider}:`, err);
    sendError(res, 'Failed to start connection');
  }
};

export const callback = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  const { provider } = req.params;
  const code = req.query.code as string;
  const userId = (req.query.state as string) || req.user?.id || 'dev-mock-user-001';

  if (!code) {
    res.status(400).send('<h1>OAuth Error</h1><p>Missing authorization code from provider.</p>');
    return;
  }

  try {
    await IntegrationService.exchangeCodeForToken(provider, code, userId);
    
    // Return standard popup closure postMessage page
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Connection Successful</title></head>
      <body style="background:#0d1117; color:#c9d1d9; font-family:sans-serif; text-align:center; padding:48px;">
        <h2 style="color:#58a6ff;">Connection Successful!</h2>
        <p>Connecting to ${provider}... You may close this window.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${provider}' }, '*');
          }
          setTimeout(() => { window.close(); }, 1000);
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err: any) {
    logger.error(`OAuth Callback failed for ${provider}:`, err);
    res.status(500).send(`<h1>OAuth Authorization Failed</h1><p>${err.message}</p>`);
  }
};

export const disconnect = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const userRole = req.user?.role || 'Developer';
    if (userRole !== 'CTO' && userRole !== 'Admin') {
      // Create approval request instead of executing
      await prisma.approvalRequest.create({
        data: {
          organizationId: req.user?.organizationId!,
          userId: userId,
          action: 'DELETE_API',
          targetId: provider,
          status: 'PENDING',
        },
      });
      sendSuccess(res, { status: 'PENDING_APPROVAL' }, 'Revoke request submitted for administrator approval.');
      return;
    }

    await IntegrationService.revokeConnection(provider, userId);
    sendSuccess(res, null, `${provider} disconnected successfully`);
  } catch (err: any) {
    logger.error(`Failed to disconnect ${req.params.provider}:`, err);
    sendError(res, 'Failed to disconnect');
  }
};

export const sync = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      sendUnauthorized(res);
      return;
    }

    const user = await import('../../database/prisma.client').then(m =>
      m.default.user.findUnique({
        where: { id: userId },
        select: { memberships: { select: { organizationId: true } } },
      })
    );

    const organizationId = user?.memberships[0]?.organizationId;
    if (!organizationId) {
      sendBadRequest(res, 'User is not associated with an organization');
      return;
    }

    const syncResult = await IntegrationService.syncProviderData(provider, userId, organizationId);
    sendSuccess(res, syncResult, 'Sync completed successfully');
  } catch (err: any) {
    logger.error(`Sync failed for ${req.params.provider}:`, err);
    sendError(res, `Sync failed: ${err.message}`);
  }
};

export const oauthSimulatePage = (req: ExpressRequest, res: ExpressResponse): void => {
  const { provider } = req.params;
  const userId = (req.query.userId as string) || 'dev-mock-user-001';
  const displayName = provider.charAt(0).toUpperCase() + provider.slice(1);
  const color = provider === 'hubspot' ? '#ff7a00' : provider === 'salesforce' ? '#00a1e0' : provider === 'pipedrive' ? '#26b860' : '#8b5cf6';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connect ${displayName} - Simulated OAuth 2.0 Consent</title>
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
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
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
          font-size: 18px;
          color: white;
          font-weight: 700;
        }
        .arrow {
          font-size: 24px;
          color: #8b949e;
        }
        h2 {
          color: #f0f6ff;
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 600;
        }
        p {
          color: #8b949e;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 24px;
        }
        .permissions-list {
          text-align: left;
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 28px;
          font-size: 13px;
        }
        .permissions-title {
          font-weight: 600;
          color: #f0f6ff;
          margin-bottom: 8px;
        }
        .permission-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8b949e;
          margin: 6px 0;
        }
        .check { color: #3fb950; font-weight: bold; }
        .btn-group {
          display: flex;
          gap: 12px;
        }
        button {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-allow {
          background: #238636;
          color: white;
        }
        .btn-allow:hover {
          background: #2ea043;
        }
        .btn-cancel {
          background: #21262d;
          color: #c9d1d9;
          border: 1px solid #30363d;
        }
        .btn-cancel:hover {
          background: #30363d;
        }
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
        <h2>Authorize ${displayName} Connection</h2>
        <p><strong>Universal API</strong> requests authorization to connect to your simulated ${displayName} developer account.</p>
        
        <div class="permissions-list">
          <div class="permissions-title">Requested Scopes:</div>
          <div class="permission-item"><span class="check">✓</span> Read &amp; Write Contacts</div>
          <div class="permission-item"><span class="check">✓</span> Read &amp; Write Companies</div>
          <div class="permission-item"><span class="check">✓</span> Read Opportunities / Deals</div>
          <div class="permission-item"><span class="check">✓</span> Offline access (Refresh Token)</div>
        </div>

        <div class="btn-group">
          <button class="btn-cancel" onclick="window.close()">Cancel</button>
          <button class="btn-allow" onclick="authorize()">Authorize</button>
        </div>
      </div>
      <script>
        function authorize() {
          const mockCode = 'mock-code-' + Math.random().toString(36).substr(2, 9);
          // Redirect to the actual callback endpoint to complete token exchange simulation
          window.location.href = '/api/v1/integrations/${provider}/callback?code=' + mockCode + '&state=${userId}';
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
};
