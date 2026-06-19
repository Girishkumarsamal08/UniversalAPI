// Swagger configuration — Phase 9: API Documentation

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🔗 Unified CRM API',
      version: '1.0.0',
      description: `
## Unified CRM API Documentation

A unified backend that aggregates **HubSpot**, **Salesforce**, and **Pipedrive** data through a single REST API.

### Authentication
Use the \`/auth/register\` endpoint to create an account, then \`/auth/login\` to get a JWT token.
Include the token as: \`Authorization: Bearer <token>\`

### Demo Credentials (after seeding)
- **Email:** admin@unifiedcrm.io  
- **Password:** Password123

### Mock Data
All endpoints work without a real CRM connection — use \`provider=mock\` in queries.
      `,
      contact: {
        name: 'Unified CRM Team',
        email: 'team@unifiedcrm.io',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            externalId: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            jobTitle: { type: 'string' },
            provider: { type: 'string', enum: ['hubspot', 'salesforce', 'pipedrive', 'mock'] },
            organizationId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            externalId: { type: 'string' },
            name: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            industry: { type: 'string' },
            size: { type: 'string' },
            provider: { type: 'string', enum: ['hubspot', 'salesforce', 'pipedrive', 'mock'] },
            organizationId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints — register, login, refresh, logout' },
      { name: 'Contacts', description: 'Unified contacts API across all CRM providers' },
      { name: 'Companies', description: 'Unified companies API across all CRM providers' },
      { name: 'Providers', description: 'CRM provider connection management' },
    ],
  },
  apis: ['./src/**/*.controller.ts', './src/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Unified CRM API Docs',
      customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .swagger-ui .topbar-wrapper img { display: none; }
        .swagger-ui .topbar-wrapper::after { content: '🔗 Unified CRM API'; color: white; font-size: 1.5rem; font-weight: bold; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );

  // Raw JSON spec
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
