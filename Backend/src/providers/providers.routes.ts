// Providers Router — connection status, connect/disconnect, and OAuth simulation
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../database/prisma.client';
import { SUPPORTED_PROVIDERS } from '../providers/provider.registry';
import { sendSuccess, sendError } from '../utils/response.helper';

const router = Router();

// Shared in-memory mock connection states for offline/mock development users
export const mockConnections: Record<string, boolean> = {
  hubspot: false,
  salesforce: false,
  pipedrive: false,
};

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Get all supported providers and their connection status
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    let connectedMap: Record<string, boolean> = {};

    // Only query DB if it's available (not a dev mock user)
    if (req.user?.id && !req.user.id.startsWith('dev-mock-user')) {
      try {
        const connections = await prisma.integration.findMany({
          where: { userId: req.user.id },
          select: { provider: true, status: true },
        });
        connections.forEach((c) => {
          connectedMap[c.provider] = c.status === 'Connected' || c.status === 'Syncing';
        });
      } catch (dbErr) {
        // DB is down: fall back to mock connection states
        connectedMap = { ...mockConnections };
      }
    } else {
      connectedMap = { ...mockConnections };
    }

    const providers = SUPPORTED_PROVIDERS.map((name) => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      isConnected: name === 'mock' ? true : (connectedMap[name] || false),
      isMock: name === 'mock',
    }));

    sendSuccess(res, providers, 'Providers retrieved');
  } catch (error) {
    sendError(res, 'Failed to fetch providers');
  }
});

/**
 * @swagger
 * /providers/{name}/connect:
 *   post:
 *     summary: Connect a CRM provider (Simulated OAuth)
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:name/connect', authMiddleware, async (req: Request, res: Response) => {
  const { name } = req.params;

  if (req.user?.id.startsWith('dev-mock-user')) {
    mockConnections[name] = true;
    return sendSuccess(res, null, `${name} connected successfully (mock connection)`);
  }

  try {
    await prisma.integration.upsert({
      where: {
        userId_provider: { userId: req.user!.id, provider: name },
      },
      update: { status: 'Connected', accessToken: 'mock-access-token-123' },
      create: {
        userId: req.user!.id,
        provider: name,
        accessToken: 'mock-access-token-123',
        status: 'Connected',
      },
    });
    sendSuccess(res, null, `${name} connected successfully`);
  } catch (error) {
    // Database down: fallback to mock connections
    mockConnections[name] = true;
    sendSuccess(res, null, `${name} connected successfully (mock fallback connection)`);
  }
});

/**
 * @swagger
 * /providers/{name}/disconnect:
 *   post:
 *     summary: Disconnect/revoke a CRM provider
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:name/disconnect', authMiddleware, async (req: Request, res: Response) => {
  const { name } = req.params;

  if (req.user?.id.startsWith('dev-mock-user')) {
    mockConnections[name] = false;
    return sendSuccess(res, null, `${name} disconnected successfully (mock disconnection)`);
  }

  try {
    await prisma.integration.update({
      where: {
        userId_provider: { userId: req.user!.id, provider: name },
      },
      data: { status: 'Not Connected' },
    });
    sendSuccess(res, null, `${name} disconnected successfully`);
  } catch (error) {
    // Database down: fallback to mock connections
    mockConnections[name] = false;
    sendSuccess(res, null, `${name} disconnected successfully (mock fallback disconnection)`);
  }
});

/**
 * GET /providers/:name/oauth-simulate
 * Displays a realistic mock OAuth login consent page
 */
router.get('/:name/oauth-simulate', (req: Request, res: Response) => {
  const { name } = req.params;
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const color = name === 'hubspot' ? '#ff7a00' : name === 'salesforce' ? '#00a1e0' : name === 'pipedrive' ? '#26b860' : '#8b5cf6';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connect ${displayName} - OAuth Authorization</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
          margin: 0 0 28px;
        }
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
        <h2>Connect to ${displayName}</h2>
        <p><strong>Unified CRM</strong> requests permission to view, edit, and sync contacts and companies from your ${displayName} account.</p>
        <div class="btn-group">
          <button class="btn-cancel" onclick="window.close()">Cancel</button>
          <button class="btn-allow" onclick="authorize()">Authorize</button>
        </div>
      </div>
      <script>
        function authorize() {
          const token = localStorage.getItem('unified_token');
          fetch('/api/v1/providers/${name}/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          })
          .then(res => res.json())
          .then(data => {
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${name}' }, '*');
            }
            window.close();
          })
          .catch(err => {
            alert('Failed to connect: ' + err.message);
          });
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

export default router;
