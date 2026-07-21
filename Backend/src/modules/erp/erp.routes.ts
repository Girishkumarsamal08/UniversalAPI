// CTO Dynamic ERP System Router
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { sendSuccess, sendBadRequest, sendForbidden } from '../../utils/response.helper';
import prisma from '../../database/prisma.client';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authMiddleware);

// Sample in-memory state store for interactive CTO ERP updates
let erpPeopleStore = [
  { id: 'usr-1', name: 'Girish Kumar Samal', role: 'CTO', dept: 'Engineering', tasksCompleted: 48, activeProjects: 4, sprintVelocity: '98%', billableHours: 160, efficiency: '98.5%', status: 'Active', color: '#2ed573' },
  { id: 'usr-2', name: 'Swayamsuchee Mohanty', role: 'Senior Developer', dept: 'Integrations', tasksCompleted: 42, activeProjects: 3, sprintVelocity: '95%', billableHours: 152, efficiency: '96.2%', status: 'Active', color: '#58a6ff' },
  { id: 'usr-3', name: 'Aarav Sharma', role: 'Lead Architect', dept: 'Core Platform', tasksCompleted: 39, activeProjects: 2, sprintVelocity: '92%', billableHours: 148, efficiency: '94.0%', status: 'Active', color: '#a78bfa' },
  { id: 'usr-4', name: 'Ananya Roy', role: 'DevOps Lead', dept: 'Infrastructure', tasksCompleted: 35, activeProjects: 3, sprintVelocity: '89%', billableHours: 140, efficiency: '91.8%', status: 'Active', color: '#d29922' },
  { id: 'usr-5', name: 'Rohan Verma', role: 'Support Engineer', dept: 'Customer Ops', tasksCompleted: 51, activeProjects: 2, sprintVelocity: '97%', billableHours: 165, efficiency: '97.0%', status: 'Active', color: '#2ed573' },
];

let erpClientStore = [
  { id: 'cli-101', name: 'Acme Global Corp', crmProvider: 'HubSpot', contractValue: '$185,000/yr', crmStatus: 'Connected', healthScore: 96, currentPhase: 'Phase 3: Production Deployment', progress: 85, milestones: '17/20', ctoOwner: 'Girish Kumar Samal' },
  { id: 'cli-102', name: 'Apex Enterprise Software', crmProvider: 'Salesforce', contractValue: '$240,000/yr', crmStatus: 'Connected', healthScore: 92, currentPhase: 'Phase 2: Data Schema Normalization', progress: 68, milestones: '14/20', ctoOwner: 'Girish Kumar Samal' },
  { id: 'cli-103', name: 'Nova Logistics Pvt Ltd', crmProvider: 'Pipedrive', contractValue: '$95,000/yr', crmStatus: 'Syncing', healthScore: 88, currentPhase: 'Phase 4: Webhook Stream Setup', progress: 92, milestones: '18/20', ctoOwner: 'Swayamsuchee Mohanty' },
  { id: 'cli-104', name: 'Vanguard Healthcare', crmProvider: 'Zoho CRM', contractValue: '$310,000/yr', crmStatus: 'Connected', healthScore: 98, currentPhase: 'Phase 1: OAuth Vault Authentication', progress: 45, milestones: '9/20', ctoOwner: 'Girish Kumar Samal' },
  { id: 'cli-105', name: 'Horizon Cloud Services', crmProvider: 'Zapier / Custom', contractValue: '$120,000/yr', crmStatus: 'Active', healthScore: 94, currentPhase: 'Phase 3: Final Security Verification', progress: 78, milestones: '15/20', ctoOwner: 'Aarav Sharma' },
];

/**
 * GET /api/v1/erp/overview
 * Dynamic CTO Executive ERP Progress Summary
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const isCTOorAdmin = req.user?.role === 'CTO' || req.user?.role === 'CEO' || req.user?.role === 'Admin';
    
    // Count db metrics if available
    let totalContacts = 0;
    let totalCompanies = 0;
    try {
      totalContacts = await prisma.contact.count();
      totalCompanies = await prisma.company.count();
    } catch (e) {
      totalContacts = 142;
      totalCompanies = 38;
    }

    const overview = {
      executiveSummary: {
        companyHealthIndex: '96.4%',
        activeClientsCount: erpClientStore.length,
        totalTeamMembers: erpPeopleStore.length,
        averageSprintVelocity: '94.2%',
        totalContractValue: '$950,000 / yr',
        crmIntegrationsOnline: '7 / 7 Active Connectors',
        monthlyApiVolume: '4.8M Requests',
        averageSlaAdherence: '99.94%',
      },
      userScope: {
        role: req.user?.role,
        isCTO: isCTOorAdmin,
        name: req.user?.name,
        email: req.user?.email,
      }
    };

    sendSuccess(res, overview, 'CTO ERP Overview retrieved');
  } catch (err: any) {
    logger.error('Failed to get CTO ERP overview:', err);
    sendBadRequest(res, 'Failed to fetch CTO ERP overview');
  }
});

/**
 * GET /api/v1/erp/people
 * Track Company Progress by People (Team/Engineers)
 */
router.get('/people', (req: Request, res: Response) => {
  sendSuccess(res, erpPeopleStore, 'CTO ERP People Progress retrieved');
});

/**
 * POST /api/v1/erp/people
 * Add or update Team Member ERP Progress (CTO Console)
 */
router.post('/people', (req: Request, res: Response) => {
  const { name, role, dept, tasksCompleted, activeProjects, sprintVelocity, billableHours, efficiency } = req.body;
  if (!name) {
    sendBadRequest(res, 'Name is required');
    return;
  }

  const newMember = {
    id: `usr-${Date.now()}`,
    name,
    role: role || 'Developer',
    dept: dept || 'Engineering',
    tasksCompleted: Number(tasksCompleted) || 10,
    activeProjects: Number(activeProjects) || 1,
    sprintVelocity: sprintVelocity || '90%',
    billableHours: Number(billableHours) || 120,
    efficiency: efficiency || '95.0%',
    status: 'Active',
    color: '#58a6ff',
  };

  erpPeopleStore.unshift(newMember);
  sendSuccess(res, newMember, 'Team member progress logged');
});

/**
 * GET /api/v1/erp/clients
 * Track Company Progress by Clients (CRM Connections & Delivery Milestones)
 */
router.get('/clients', (req: Request, res: Response) => {
  sendSuccess(res, erpClientStore, 'CTO ERP Client Progress retrieved');
});

/**
 * POST /api/v1/erp/clients
 * Add or update Client ERP Progress (CTO Console)
 */
router.post('/clients', (req: Request, res: Response) => {
  const { name, crmProvider, contractValue, crmStatus, healthScore, currentPhase, progress, milestones } = req.body;
  if (!name) {
    sendBadRequest(res, 'Client name is required');
    return;
  }

  const newClient = {
    id: `cli-${Date.now()}`,
    name,
    crmProvider: crmProvider || 'HubSpot',
    contractValue: contractValue || '$100,000/yr',
    crmStatus: crmStatus || 'Connected',
    healthScore: Number(healthScore) || 95,
    currentPhase: currentPhase || 'Phase 1: Initial Setup',
    progress: Number(progress) || 50,
    milestones: milestones || '10/20',
    ctoOwner: req.user?.name || 'CTO Console',
  };

  erpClientStore.unshift(newClient);
  sendSuccess(res, newClient, 'Client progress record created');
});

/**
 * GET /api/v1/erp/resources
 * Resource & Budget Allocation
 */
router.get('/resources', (req: Request, res: Response) => {
  const resources = {
    budgets: [
      { dept: 'Core Platform Engineering', allocated: '$450,000', spent: '$280,000', remaining: '$170,000', util: '62.2%' },
      { dept: 'CRM Connectors & Gateway', allocated: '$320,000', spent: '$195,000', remaining: '$125,000', util: '60.9%' },
      { dept: 'DevOps & AWS Cloud Edge', allocated: '$180,000', spent: '$110,000', remaining: '$70,000', util: '61.1%' },
      { dept: 'Customer Support & Ops', allocated: '$120,000', spent: '$75,000', remaining: '$45,000', util: '62.5%' },
    ],
    cloudCostBreakdown: [
      { provider: 'HubSpot Gateway Connector', monthlyCost: '$1,420', status: 'Optimal' },
      { provider: 'Salesforce Adapter Cluster', monthlyCost: '$2,850', status: 'Optimal' },
      { provider: 'Pipedrive Async Worker', monthlyCost: '$890', status: 'Optimal' },
      { provider: 'Zoho / Zapier Webhook Nodes', monthlyCost: '$1,150', status: 'Optimal' },
    ]
  };
  sendSuccess(res, resources, 'CTO ERP Resources retrieved');
});

export default router;
