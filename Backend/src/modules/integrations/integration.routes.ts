// Integration Router
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as IntegrationController from './integration.controller';

const router = Router();

// Expose integrations CRUD
router.get('/', authMiddleware, IntegrationController.getIntegrations);
router.get('/:provider/connect', authMiddleware, IntegrationController.connect);
router.post('/:provider/disconnect', authMiddleware, IntegrationController.disconnect);
router.post('/:provider/sync', authMiddleware, IntegrationController.sync);

// Callback & Simulator endpoints (no JWT in header required, state/query-param mapping handles auth context)
router.get('/:provider/callback', IntegrationController.callback);
router.get('/:provider/oauth-simulate', IntegrationController.oauthSimulatePage);

export default router;
