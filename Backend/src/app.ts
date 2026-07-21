// Express Application Configuration

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { setupSwagger } from './services/swagger.service';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { requestLoggerMiddleware } from './middleware/logging.middleware';
import authRoutes from './auth/auth.routes';
import contactsRoutes from './contacts/contacts.routes';
import companiesRoutes from './companies/companies.routes';
import providersRoutes from './providers/providers.routes';
import logsRoutes from './logs/logs.routes';
import analyticsRoutes from './analytics/analytics.routes';
import integrationRoutes from './modules/integrations/integration.routes';
import dealsRoutes from './deals/deals.routes';
import approvalRoutes from './auth/approval.routes';
import projectRoutes from './projects/project.routes';
import erpRoutes from './modules/erp/erp.routes';
import documentRoutes from './modules/documents/document.routes';

export const createApp = (): Express => {
  const app = express();

  // ─────────────────────────────────────────────
  // Security Middleware
  // ─────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Allow Swagger UI
  }));

  app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ─────────────────────────────────────────────
  // Request Parsing & Optimization
  // ─────────────────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─────────────────────────────────────────────
  // HTTP Request Logging (Morgan + Winston)
  // ─────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ─────────────────────────────────────────────
  // Rate Limiting
  // ─────────────────────────────────────────────
  app.use(generalLimiter);

  // ─────────────────────────────────────────────
  // Swagger API Documentation
  // ─────────────────────────────────────────────
  setupSwagger(app);

  // ─────────────────────────────────────────────
  // Health Check
  // ─────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'unified-crm-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // ─────────────────────────────────────────────
  // API Routes (v1)
  // ─────────────────────────────────────────────
  const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

  // DB Request Logging Middleware
  app.use(requestLoggerMiddleware);

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/contacts`, contactsRoutes);
  app.use(`${API_PREFIX}/companies`, companiesRoutes);
  app.use(`${API_PREFIX}/deals`, dealsRoutes);
  app.use(`${API_PREFIX}/providers`, providersRoutes);
  app.use(`${API_PREFIX}/logs`, logsRoutes);
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
  app.use(`${API_PREFIX}/integrations`, integrationRoutes);
  app.use(`${API_PREFIX}/approvals`, approvalRoutes);
  app.use(`${API_PREFIX}/projects`, projectRoutes);
  app.use(`${API_PREFIX}/erp`, erpRoutes);
  app.use(`${API_PREFIX}/documents`, documentRoutes);

  // ─────────────────────────────────────────────
  // Error Handling (must be last)
  // ─────────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
