import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  User, Activity, CheckCircle, Building2, RefreshCw,
  Shield, Eye, EyeOff, LogOut, Wifi, WifiOff, AlertCircle,
  Zap, ChevronRight, BarChart3, Terminal, BookOpen, ExternalLink,
  Globe, Copy, Check, Play, Settings, Menu, X, Briefcase,
  LayoutDashboard, Grid, Cpu, GitMerge, Compass, HelpCircle,
  Users, FileText, Map, Code, Clock, ArrowRight, Lock, Server,
  CheckSquare, Info, Book, File, Layers
} from 'lucide-react';
import DocumentParser from './components/DocumentParser';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
let AUTH_TOKEN = localStorage.getItem('unified_token') || '';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('unified_token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
    AUTH_TOKEN = '';
    localStorage.removeItem('unified_token');
    localStorage.removeItem('unified_user');
    window.location.reload();
  }
  return Promise.reject(err);
});

const WORLDWIDE_COMPANIES = [
  // TECHNOLOGY & SOFTWARE (US & GLOBAL)
  { name: 'Google', website: 'https://google.com', industry: 'Technology', size: '150,000+' },
  { name: 'Microsoft', website: 'https://microsoft.com', industry: 'Technology', size: '220,000+' },
  { name: 'Apple', website: 'https://apple.com', industry: 'Technology', size: '160,000+' },
  { name: 'Amazon', website: 'https://amazon.com', industry: 'E-commerce', size: '1,500,000+' },
  { name: 'Meta', website: 'https://meta.com', industry: 'Social Media', size: '70,000+' },
  { name: 'Nvidia', website: 'https://nvidia.com', industry: 'Technology', size: '26,000+' },
  { name: 'Netflix', website: 'https://netflix.com', industry: 'Entertainment', size: '12,000+' },
  { name: 'Salesforce', website: 'https://salesforce.com', industry: 'Software', size: '79,000+' },
  { name: 'Adobe', website: 'https://adobe.com', industry: 'Software', size: '29,000+' },
  { name: 'Oracle', website: 'https://oracle.com', industry: 'Software', size: '143,000+' },
  { name: 'IBM', website: 'https://ibm.com', industry: 'Technology', size: '280,000+' },
  { name: 'Intel', website: 'https://intel.com', industry: 'Semiconductors', size: '121,000+' },
  { name: 'AMD', website: 'https://amd.com', industry: 'Semiconductors', size: '25,000+' },
  { name: 'Qualcomm', website: 'https://qualcomm.com', industry: 'Semiconductors', size: '51,000+' },
  { name: 'Cisco', website: 'https://cisco.com', industry: 'Networking', size: '83,000+' },
  { name: 'HP Inc.', website: 'https://hp.com', industry: 'Technology', size: '58,000+' },
  { name: 'Dell Technologies', website: 'https://dell.com', industry: 'Technology', size: '133,000+' },
  { name: 'ServiceNow', website: 'https://servicenow.com', industry: 'Software', size: '22,000+' },
  { name: 'Workday', website: 'https://workday.com', industry: 'Software', size: '18,000+' },
  { name: 'Snowflake', website: 'https://snowflake.com', industry: 'Software', size: '7,000+' },
  { name: 'Palantir', website: 'https://palantir.com', industry: 'Software', size: '3,800+' },
  { name: 'CrowdStrike', website: 'https://crowdstrike.com', industry: 'Cybersecurity', size: '8,000+' },
  { name: 'Cloudflare', website: 'https://cloudflare.com', industry: 'Technology', size: '3,500+' },
  { name: 'Datadog', website: 'https://datadoghq.com', industry: 'Software', size: '5,200+' },
  { name: 'Splunk', website: 'https://splunk.com', industry: 'Software', size: '8,000+' },
  { name: 'Atlassian', website: 'https://atlassian.com', industry: 'Software', size: '11,000+' },
  { name: 'Slack', website: 'https://slack.com', industry: 'Software', size: '2,500' },
  { name: 'Zoom', website: 'https://zoom.us', industry: 'Communication', size: '6,000+' },
  { name: 'Stripe', website: 'https://stripe.com', industry: 'Fintech', size: '8,000+' },
  { name: 'Shopify', website: 'https://shopify.com', industry: 'E-commerce', size: '10,000+' },
  { name: 'Airbnb', website: 'https://airbnb.com', industry: 'Hospitality', size: '6,000+' },
  { name: 'Spotify', website: 'https://spotify.com', industry: 'Entertainment', size: '9,000+' },
  { name: 'Uber', website: 'https://uber.com', industry: 'Transportation', size: '29,000+' },
  { name: 'Lyft', website: 'https://lyft.com', industry: 'Transportation', size: '4,000+' },
  { name: 'Pinterest', website: 'https://pinterest.com', industry: 'Social Media', size: '4,000+' },
  { name: 'Snap Inc.', website: 'https://snap.com', industry: 'Social Media', size: '5,300+' },
  { name: 'Twitter (X)', website: 'https://x.com', industry: 'Social Media', size: '2,000+' },
  { name: 'eBay', website: 'https://ebay.com', industry: 'E-commerce', size: '11,000+' },
  { name: 'Etsy', website: 'https://etsy.com', industry: 'E-commerce', size: '2,400+' },
  { name: 'Wayfair', website: 'https://wayfair.com', industry: 'E-commerce', size: '14,000+' },
  { name: 'MercadoLibre', website: 'https://mercadolibre.com', industry: 'E-commerce', size: '40,000+' },
  { name: 'Notion', website: 'https://notion.so', industry: 'Software', size: '500+' },
  { name: 'Asana', website: 'https://asana.com', industry: 'Software', size: '1,800+' },
  { name: 'Monday.com', website: 'https://monday.com', industry: 'Software', size: '1,500+' },

  // GLOBAL AUTOMOTIVE
  { name: 'Tesla', website: 'https://tesla.com', industry: 'Automotive', size: '120,000+' },
  { name: 'Toyota Motor', website: 'https://toyota.com', industry: 'Automotive', size: '370,000+' },
  { name: 'Volkswagen Group', website: 'https://volkswagen.com', industry: 'Automotive', size: '670,000+' },
  { name: 'Ford Motor Company', website: 'https://ford.com', industry: 'Automotive', size: '177,000+' },
  { name: 'General Motors', website: 'https://gm.com', industry: 'Automotive', size: '167,000+' },
  { name: 'Honda Motor', website: 'https://honda.com', industry: 'Automotive', size: '197,000+' },
  { name: 'Nissan Motor', website: 'https://nissan-global.com', industry: 'Automotive', size: '131,000+' },
  { name: 'BMW Group', website: 'https://bmwgroup.com', industry: 'Automotive', size: '149,000+' },
  { name: 'Mercedes-Benz Group', website: 'https://mercedes-benz.com', industry: 'Automotive', size: '170,000+' },
  { name: 'Porsche', website: 'https://porsche.com', industry: 'Automotive', size: '39,000+' },
  { name: 'Audi', website: 'https://audi.com', industry: 'Automotive', size: '85,000+' },
  { name: 'Volvo Cars', website: 'https://volvocars.com', industry: 'Automotive', size: '40,000+' },
  { name: 'Hyundai Motor', website: 'https://hyundai.com', industry: 'Automotive', size: '120,000+' },
  { name: 'Kia Motors', website: 'https://kia.com', industry: 'Automotive', size: '52,000+' },
  { name: 'Ferrari', website: 'https://ferrari.com', industry: 'Automotive', size: '4,500+' },

  // GLOBAL FINANCE, BANKING & PAYMENTS
  { name: 'Visa', website: 'https://visa.com', industry: 'Financial Services', size: '28,000+' },
  { name: 'Mastercard', website: 'https://mastercard.com', industry: 'Financial Services', size: '29,000+' },
  { name: 'American Express', website: 'https://americanexpress.com', industry: 'Financial Services', size: '77,000+' },
  { name: 'PayPal', website: 'https://paypal.com', industry: 'Fintech', size: '29,000+' },
  { name: 'JPMorgan Chase', website: 'https://jpmorganchase.com', industry: 'Banking', size: '290,000+' },
  { name: 'Goldman Sachs', website: 'https://goldmansachs.com', industry: 'Banking', size: '48,000+' },
  { name: 'Morgan Stanley', website: 'https://morganstanley.com', industry: 'Banking', size: '82,000+' },
  { name: 'Bank of America', website: 'https://bankofamerica.com', industry: 'Banking', size: '213,000+' },
  { name: 'Citigroup', website: 'https://citigroup.com', industry: 'Banking', size: '240,000+' },
  { name: 'Wells Fargo', website: 'https://wellsfargo.com', industry: 'Banking', size: '238,000+' },
  { name: 'HSBC Holdings', website: 'https://hsbc.com', industry: 'Banking', size: '220,000+' },
  { name: 'Barclays', website: 'https://barclays.com', industry: 'Banking', size: '80,000+' },
  { name: 'Deutsche Bank', website: 'https://db.com', industry: 'Banking', size: '84,000+' },
  { name: 'UBS Group', website: 'https://ubs.com', industry: 'Banking', size: '74,000+' },
  { name: 'BNP Paribas', website: 'https://group.bnpparibas', industry: 'Banking', size: '190,000+' },

  // AEROSPACE & LOGISTICS
  { name: 'SpaceX', website: 'https://spacex.com', industry: 'Aerospace', size: '12,000+' },
  { name: 'Boeing', website: 'https://boeing.com', industry: 'Aerospace', size: '156,000+' },
  { name: 'Airbus', website: 'https://airbus.com', industry: 'Aerospace', size: '134,000+' },
  { name: 'Lockheed Martin', website: 'https://lockheedmartin.com', industry: 'Aerospace', size: '116,000+' },
  { name: 'Northrop Grumman', website: 'https://northropgrumman.com', industry: 'Aerospace', size: '95,000+' },
  { name: 'FedEx', website: 'https://fedex.com', industry: 'Logistics', size: '500,000+' },
  { name: 'UPS', website: 'https://ups.com', industry: 'Logistics', size: '536,000+' },
  { name: 'DHL Group', website: 'https://dhl.com', industry: 'Logistics', size: '600,000+' },
  { name: 'Delta Air Lines', website: 'https://delta.com', industry: 'Airlines', size: '90,000+' },
  { name: 'United Airlines', website: 'https://united.com', industry: 'Airlines', size: '93,000+' },
  { name: 'American Airlines', website: 'https://aa.com', industry: 'Airlines', size: '129,000+' },

  // GLOBAL CONSUMER RETAIL, FOOD & DRINK
  { name: 'Walmart', website: 'https://walmart.com', industry: 'Retail', size: '2,100,000+' },
  { name: 'Costco Wholesale', website: 'https://costco.com', industry: 'Retail', size: '304,000+' },
  { name: 'Target', website: 'https://target.com', industry: 'Retail', size: '440,000+' },
  { name: 'Home Depot', website: 'https://homedepot.com', industry: 'Retail', size: '470,000+' },
  { name: 'Costco', website: 'https://costco.com', industry: 'Retail', size: '280,000+' },
  { name: 'IKEA', website: 'https://ikea.com', industry: 'Retail', size: '230,000+' },
  { name: 'H&M Group', website: 'https://hmgroup.com', industry: 'Retail', size: '100,000+' },
  { name: 'Inditex (Zara)', website: 'https://inditex.com', industry: 'Retail', size: '160,000+' },
  { name: 'Nike', website: 'https://nike.com', industry: 'Apparel', size: '79,000+' },
  { name: 'Adidas', website: 'https://adidas.com', industry: 'Apparel', size: '59,000+' },
  { name: 'Coca-Cola Company', website: 'https://coca-colacompany.com', industry: 'Beverages', size: '82,000+' },
  { name: 'PepsiCo', website: 'https://pepsico.com', industry: 'Food & Beverage', size: '315,000+' },
  { name: 'Nestlé', website: 'https://nestle.com', industry: 'Food & Beverage', size: '275,000+' },
  { name: 'McDonald\'s', website: 'https://mcdonalds.com', industry: 'Food Service', size: '200,000+' },
  { name: 'Starbucks', website: 'https://starbucks.com', industry: 'Food Service', size: '380,000+' },
  { name: 'Unilever', website: 'https://unilever.com', industry: 'Consumer Goods', size: '127,000+' },
  { name: 'Procter & Gamble', website: 'https://pg.com', industry: 'Consumer Goods', size: '107,000+' },
  { name: 'L\'Oréal', website: 'https://loreal.com', industry: 'Consumer Goods', size: '88,000+' },
  { name: 'Colgate-Palmolive', website: 'https://colgatepalmolive.com', industry: 'Consumer Goods', size: '34,000+' },
  { name: 'Kraft Heinz', website: 'https://kraftheinzcompany.com', industry: 'Food & Beverage', size: '36,000+' },

  // ELECTRONICS & ADVANCED MANUFACTURING
  { name: 'Samsung Electronics', website: 'https://samsung.com', industry: 'Electronics', size: '270,000+' },
  { name: 'Sony Group', website: 'https://sony.com', industry: 'Electronics', size: '113,000+' },
  { name: 'Panasonic', website: 'https://panasonic.com', industry: 'Electronics', size: '240,000+' },
  { name: 'LG Electronics', website: 'https://lg.com', industry: 'Electronics', size: '75,000+' },
  { name: 'Nintendo', website: 'https://nintendo.com', industry: 'Entertainment', size: '7,000+' },
  { name: 'General Electric', website: 'https://ge.com', industry: 'Manufacturing', size: '125,000+' },
  { name: 'Siemens', website: 'https://siemens.com', industry: 'Manufacturing', size: '311,000+' },
  { name: 'Honeywell', website: 'https://honeywell.com', industry: 'Manufacturing', size: '97,000+' },
  { name: 'Caterpillar', website: 'https://caterpillar.com', industry: 'Manufacturing', size: '107,000+' },
  { name: 'ASML', website: 'https://asml.com', industry: 'Semiconductors', size: '40,000+' },

  // PHARMA & LIFE SCIENCES
  { name: 'Pfizer', website: 'https://pfizer.com', industry: 'Pharmaceuticals', size: '83,000+' },
  { name: 'Johnson & Johnson', website: 'https://jnj.com', industry: 'Healthcare', size: '150,000+' },
  { name: 'Moderna', website: 'https://modernatx.com', industry: 'Biotech', size: '5,000+' },
  { name: 'AstraZeneca', website: 'https://astrazeneca.com', industry: 'Pharmaceuticals', size: '89,000+' },
  { name: 'Roche', website: 'https://roche.com', industry: 'Pharmaceuticals', size: '103,000+' },
  { name: 'Novartis', website: 'https://novartis.com', industry: 'Pharmaceuticals', size: '100,000+' },
  { name: 'Merck & Co.', website: 'https://merck.com', industry: 'Pharmaceuticals', size: '72,000+' },
  { name: 'Eli Lilly', website: 'https://lilly.com', industry: 'Pharmaceuticals', size: '39,000+' },
  { name: 'Bristol Myers Squibb', website: 'https://bms.com', industry: 'Pharmaceuticals', size: '34,000+' },
  { name: 'CVS Health', website: 'https://cvshealth.com', industry: 'Healthcare', size: '300,000+' },

  // ENERGY & UTILITIES
  { name: 'ExxonMobil', website: 'https://exxonmobil.com', industry: 'Energy', size: '62,000+' },
  { name: 'Chevron', website: 'https://chevron.com', industry: 'Energy', size: '43,000+' },
  { name: 'Shell', website: 'https://shell.com', industry: 'Energy', size: '90,000+' },
  { name: 'BP', website: 'https://bp.com', industry: 'Energy', size: '67,000+' },
  { name: 'TotalEnergies', website: 'https://totalenergies.com', industry: 'Energy', size: '100,000+' },
  { name: 'Saudi Aramco', website: 'https://aramco.com', industry: 'Energy', size: '70,000+' },

  // GLOBAL CONSULTING, SERVICES & AGENCY
  { name: 'Deloitte', website: 'https://deloitte.com', industry: 'Consulting', size: '450,000+' },
  { name: 'PwC', website: 'https://pwc.com', industry: 'Consulting', size: '360,000+' },
  { name: 'EY', website: 'https://ey.com', industry: 'Consulting', size: '390,000+' },
  { name: 'KPMG', website: 'https://kpmg.com', industry: 'Consulting', size: '270,000+' },
  { name: 'Accenture', website: 'https://accenture.com', industry: 'Consulting', size: '730,000+' },
  { name: 'McKinsey & Company', website: 'https://mckinsey.com', industry: 'Consulting', size: '45,000+' },
  { name: 'Boston Consulting Group', website: 'https://bcg.com', industry: 'Consulting', size: '30,000+' },
  { name: 'Bain & Company', website: 'https://bain.com', industry: 'Consulting', size: '18,000+' },
  { name: 'Infosys', website: 'https://infosys.com', industry: 'IT Services', size: '320,000+' },
  { name: 'Cognizant', website: 'https://cognizant.com', industry: 'IT Services', size: '340,000+' },
];

const PROVIDER_COLORS = {
  hubspot: { bg: 'rgba(255,122,0,0.18)', text: '#ff8c42', border: 'rgba(255,122,0,0.35)' },
  salesforce: { bg: 'rgba(0,161,224,0.18)', text: '#29b6e8', border: 'rgba(0,161,224,0.35)' },
  pipedrive: { bg: 'rgba(38,184,96,0.18)', text: '#2ed573', border: 'rgba(38,184,96,0.35)' },
  mock: { bg: 'rgba(139,92,246,0.18)', text: '#a78bfa', border: 'rgba(139,92,246,0.35)' },
};

function ProviderBadge({ provider }) {
  const c = PROVIDER_COLORS[provider] || PROVIDER_COLORS.mock;
  return (
    <span style={{
      padding: '3px 12px', borderRadius: '20px', fontSize: '0.71rem',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      textTransform: 'capitalize', fontWeight: '600', letterSpacing: '0.02em',
    }}>{provider}</span>
  );
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        display: 'flex', alignItems: 'center', color: '#8b949e', outline: 'none',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
      onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
    >
      {show
        ? <EyeOff size={17} />
        : <Eye size={17} />
      }
    </button>
  );
}

const simPayloads = {
  hubspot: {
    title: 'HubSpot Contact API',
    raw: `{
  "id": "vid-827101",
  "properties": {
    "firstname": "Jane",
    "lastname": "Doe",
    "email": "jane.doe@acme.com",
    "phone": "+1-555-890-1234",
    "jobtitle": "Head of Platform Engineering",
    "hs_analytics_last_visit": "2026-07-18T10:00:00Z",
    "lifecyclestage": "lead"
  }
}`,
    normalized: `{
  "id": "contact_8a92b3c7",
  "name": "Jane Doe",
  "email": "jane.doe@acme.com",
  "phone": "+1-555-890-1234",
  "jobTitle": "Head of Platform Engineering",
  "provider": "hubspot",
  "rawData": {
    "id": "vid-827101",
    "properties": {
      "firstname": "Jane",
      "lastname": "Doe",
      "email": "jane.doe@acme.com"
    }
  }
}`
  },
  salesforce: {
    title: 'Salesforce Contact API',
    raw: `{
  "attributes": { "type": "Contact" },
  "Id": "0038W00002NlW5yQAF",
  "FirstName": "Jane",
  "LastName": "Doe",
  "Email": "jane.doe@acme.com",
  "Phone": "+1-555-890-1234",
  "Title": "Head of Platform Engineering",
  "HasOptedOutOfEmail": false,
  "LastModifiedDate": "2026-07-17T15:30:00Z"
}`,
    normalized: `{
  "id": "contact_8a92b3c7",
  "name": "Jane Doe",
  "email": "jane.doe@acme.com",
  "phone": "+1-555-890-1234",
  "jobTitle": "Head of Platform Engineering",
  "provider": "salesforce",
  "rawData": {
    "Id": "0038W00002NlW5yQAF",
    "attributes": { "type": "Contact" }
  }
}`
  },
  pipedrive: {
    title: 'Pipedrive Person API',
    raw: `{
  "id": 8271,
  "name": "Jane Doe",
  "email": [
    { "value": "jane.doe@acme.com", "primary": true }
  ],
  "phone": [
    { "value": "+1-555-890-1234", "primary": true }
  ],
  "label": 3,
  "update_time": "2026-07-19T00:30:00Z"
}`,
    normalized: `{
  "id": "contact_8a92b3c7",
  "name": "Jane Doe",
  "email": "jane.doe@acme.com",
  "phone": "+1-555-890-1234",
  "jobTitle": "Lead",
  "provider": "pipedrive",
  "rawData": {
    "id": 8271,
    "email": [ { "value": "jane.doe@acme.com" } ]
  }
}`
  }
};

const frontendRolePermissions = {
  CTO: {
    title: 'CTO Console (All Scopes & ERP)',
    tabsCount: 22,
    perms: ['Full Admin Scopes', 'CTO Dynamic ERP Console', 'Delete Integrations', 'System Audit Logs', 'Billing & Analytics', 'Team Progress', 'Client Milestones']
  },
  CEO: {
    title: 'CEO Executive Console',
    tabsCount: 8,
    perms: ['CTO ERP Executive Summary', 'Company Revenue Analytics', 'Client Accounts Overview', 'High-Level Reporting']
  },
  Admin: {
    title: 'Admin Console',
    tabsCount: 12,
    perms: ['Admin Scopes', 'Manage Integrations', 'View Audit Logs', 'Workspace Projects', 'CTO ERP Console', 'Platform Config']
  },
  'Regional Head': {
    title: 'Regional Head Console',
    tabsCount: 6,
    perms: ['Regional Latency Monitor', 'View Analytics', 'View Request Logs']
  },
  Manager: {
    title: 'Manager Console',
    tabsCount: 6,
    perms: ['Team Workloads', 'Project Milestones', 'View Contacts & Companies', 'Documentation']
  },
  'Senior Developer': {
    title: 'Senior Dev Console',
    tabsCount: 7,
    perms: ['Playground', 'Projects', 'Request Logs', 'Explorer', 'API Gateway Scopes']
  },
  'Support Engineer': {
    title: 'Support Console',
    tabsCount: 5,
    perms: ['Diagnostic Hub', 'Playground', 'Docs', 'Audit Logs']
  },
  'Sales Lead': {
    title: 'Sales Lead Console',
    tabsCount: 5,
    perms: ['CRM Integration Marketplace', 'Contacts & Companies Sync', 'Deals Analytics']
  },
  Client: {
    title: 'Client Workspace Portal',
    tabsCount: 5,
    perms: ['Client Deliverables', 'Project Status Tracking', 'Documentation', 'Company Sync']
  },
  Employee: {
    title: 'Employee Console',
    tabsCount: 5,
    perms: ['Playground', 'Projects', 'Explorer', 'Docs']
  },
  Intern: {
    title: 'Intern Console',
    tabsCount: 2,
    perms: ['Developer Docs', 'Dashboard Access Only']
  }
};

function CountUp({ end, duration = 1500, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const endVal = parseFloat(end);
    if (isNaN(endVal)) {
      setCount(end);
      return;
    }
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * endVal;
      setCount(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  const displayValue = typeof count === 'number'
    ? count.toFixed(decimals)
    : count;

  return <span>{displayValue}{suffix}</span>;
}

// ═════════════════════════════════════════════════════════════════════════
// CTO DYNAMIC ERP SYSTEM CONSOLE COMPONENT
// ═════════════════════════════════════════════════════════════════════════
function CtoErpConsoleView({ currentUser, showToast }) {
  const [erpTab, setErpTab] = useState('overview');
  const [peopleList, setPeopleList] = useState([
    { id: 'usr-1', name: 'Girish Kumar Samal', role: 'CTO', dept: 'Engineering', tasksCompleted: 48, activeProjects: 4, sprintVelocity: '98%', billableHours: 160, efficiency: '98.5%', status: 'Active', color: '#2ed573' },
    { id: 'usr-2', name: 'Swayamsuchee Mohanty', role: 'Senior Developer', dept: 'Integrations', tasksCompleted: 42, activeProjects: 3, sprintVelocity: '95%', billableHours: 152, efficiency: '96.2%', status: 'Active', color: '#58a6ff' },
    { id: 'usr-3', name: 'Aarav Sharma', role: 'Lead Architect', dept: 'Core Platform', tasksCompleted: 39, activeProjects: 2, sprintVelocity: '92%', billableHours: 148, efficiency: '94.0%', status: 'Active', color: '#a78bfa' },
    { id: 'usr-4', name: 'Ananya Roy', role: 'DevOps Lead', dept: 'Infrastructure', tasksCompleted: 35, activeProjects: 3, sprintVelocity: '89%', billableHours: 140, efficiency: '91.8%', status: 'Active', color: '#d29922' },
    { id: 'usr-5', name: 'Rohan Verma', role: 'Support Engineer', dept: 'Customer Ops', tasksCompleted: 51, activeProjects: 2, sprintVelocity: '97%', billableHours: 165, efficiency: '97.0%', status: 'Active', color: '#2ed573' },
  ]);

  const [clientList, setClientList] = useState([
    { id: 'cli-101', name: 'Acme Global Corp', crmProvider: 'HubSpot', contractValue: '$185,000/yr', crmStatus: 'Connected', healthScore: 96, currentPhase: 'Phase 3: Production Deployment', progress: 85, milestones: '17/20', ctoOwner: 'Girish Kumar Samal' },
    { id: 'cli-102', name: 'Apex Enterprise Software', crmProvider: 'Salesforce', contractValue: '$240,000/yr', crmStatus: 'Connected', healthScore: 92, currentPhase: 'Phase 2: Data Schema Normalization', progress: 68, milestones: '14/20', ctoOwner: 'Girish Kumar Samal' },
    { id: 'cli-103', name: 'Nova Logistics Pvt Ltd', crmProvider: 'Pipedrive', contractValue: '$95,000/yr', crmStatus: 'Syncing', healthScore: 88, currentPhase: 'Phase 4: Webhook Stream Setup', progress: 92, milestones: '18/20', ctoOwner: 'Swayamsuchee Mohanty' },
    { id: 'cli-104', name: 'Vanguard Healthcare', crmProvider: 'Zoho CRM', contractValue: '$310,000/yr', crmStatus: 'Connected', healthScore: 98, currentPhase: 'Phase 1: OAuth Vault Authentication', progress: 45, milestones: '9/20', ctoOwner: 'Girish Kumar Samal' },
    { id: 'cli-105', name: 'Horizon Cloud Services', crmProvider: 'Zapier / Custom', contractValue: '$120,000/yr', crmStatus: 'Active', healthScore: 94, currentPhase: 'Phase 3: Final Security Verification', progress: 78, milestones: '15/20', ctoOwner: 'Aarav Sharma' },
  ]);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  const [newPerson, setNewPerson] = useState({ name: '', role: 'Developer', dept: 'Engineering', tasksCompleted: 15, activeProjects: 2, sprintVelocity: '92%', billableHours: 140, efficiency: '95%' });
  const [newClient, setNewClient] = useState({ name: '', crmProvider: 'HubSpot', contractValue: '$150,000/yr', crmStatus: 'Connected', healthScore: 95, currentPhase: 'Phase 1: Setup', progress: 50, milestones: '10/20' });

  useEffect(() => {
    const token = localStorage.getItem('unified_token');
    if (!token) return;
    fetch('/api/v1/erp/people', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => { if (res.data) setPeopleList(res.data); })
      .catch(() => { });

    fetch('/api/v1/erp/clients', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => { if (res.data) setClientList(res.data); })
      .catch(() => { });
  }, []);

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (!newPerson.name) return;
    const item = { id: `usr-${Date.now()}`, ...newPerson, status: 'Active', color: '#58a6ff' };
    setPeopleList([item, ...peopleList]);
    fetch('/api/v1/erp/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('unified_token')}` },
      body: JSON.stringify(newPerson)
    }).catch(() => { });
    setShowPersonModal(false);
    showToast(`Logged ERP team progress for ${newPerson.name}`);
    setNewPerson({ name: '', role: 'Developer', dept: 'Engineering', tasksCompleted: 15, activeProjects: 2, sprintVelocity: '92%', billableHours: 140, efficiency: '95%' });
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name) return;
    const item = { id: `cli-${Date.now()}`, ...newClient, ctoOwner: currentUser?.name || 'CTO Console' };
    setClientList([item, ...clientList]);
    fetch('/api/v1/erp/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('unified_token')}` },
      body: JSON.stringify(newClient)
    }).catch(() => { });
    setShowClientModal(false);
    showToast(`Logged ERP client milestone for ${newClient.name}`);
    setNewClient({ name: '', crmProvider: 'HubSpot', contractValue: '$150,000/yr', crmStatus: 'Connected', healthScore: 95, currentPhase: 'Phase 1: Setup', progress: 50, milestones: '10/20' });
  };

  const filteredPeople = peopleList.filter(p => p.name.toLowerCase().includes(peopleSearch.toLowerCase()) || p.role.toLowerCase().includes(peopleSearch.toLowerCase()) || p.dept.toLowerCase().includes(peopleSearch.toLowerCase()));
  const filteredClients = clientList.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.crmProvider.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(31,111,235,0.12) 0%, rgba(139,92,246,0.12) 100%)',
        border: '1px solid rgba(31,111,235,0.3)', borderRadius: '14px', padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', padding: '2px 8px', borderRadius: '4px', color: 'white', fontWeight: '800', fontSize: '0.72rem' }}>CTO EXECUTIVE ERP</span>
            <span style={{ color: '#2ed573', fontSize: '0.78rem', fontWeight: '700' }}>● Live Platform Synchronization</span>
          </div>
          <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.25rem', fontWeight: '800' }}>CTO Dynamic ERP System Console</h3>
          <p style={{ margin: '4px 0 0', color: '#8b949e', fontSize: '0.82rem' }}>Track overall company velocity, staff workload & productivity by people, and client CRM integration milestones.</p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {[
            { id: 'overview', label: '📊 Company Progress' },
            { id: 'people', label: `👥 People Progress (${peopleList.length})` },
            { id: 'clients', label: `🏢 Client Progress (${clientList.length})` },
            { id: 'resources', label: '💰 ERP Resources' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setErpTab(tab.id)} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: erpTab === tab.id ? 'linear-gradient(135deg, #1f6feb, #8b5cf6)' : 'transparent',
              color: erpTab === tab.id ? 'white' : '#8b949e', fontSize: '0.8rem', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {erpTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '18px' }}>
              <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Company Health Index</span>
              <h3 style={{ color: '#2ed573', fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0' }}>96.4%</h3>
              <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>Optimal Platform Velocity</span>
            </div>
            <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '18px' }}>
              <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Active Enterprise Clients</span>
              <h3 style={{ color: '#58a6ff', fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0' }}>{clientList.length} Accounts</h3>
              <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>HubSpot, Salesforce, Pipedrive, Zoho</span>
            </div>
            <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '18px' }}>
              <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Team Sprint Velocity</span>
              <h3 style={{ color: '#a78bfa', fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0' }}>94.2%</h3>
              <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>{peopleList.length} Active Engineers & Staff</span>
            </div>
            <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '18px' }}>
              <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Total Annual Value</span>
              <h3 style={{ color: '#f1e05a', fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0' }}>$945,000</h3>
              <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>Contracted Client Value</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ color: '#e6edf3', margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>👥 People & Team Efficiency Leaderboard</h4>
                <button onClick={() => setErpTab('people')} style={{ background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>View All →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {peopleList.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13,17,23,0.6)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(48,54,61,0.3)' }}>
                    <div>
                      <div style={{ color: '#e6edf3', fontWeight: '700', fontSize: '0.85rem' }}>{p.name}</div>
                      <div style={{ color: '#8b949e', fontSize: '0.75rem' }}>{p.role} · {p.dept}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: p.color, fontWeight: '800', fontSize: '0.88rem' }}>{p.efficiency} Efficiency</div>
                      <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>{p.tasksCompleted} Tasks ({p.sprintVelocity} vel)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ color: '#e6edf3', margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>🏢 Client Accounts CRM Delivery Milestones</h4>
                <button onClick={() => setErpTab('clients')} style={{ background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>View All →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {clientList.slice(0, 4).map(c => (
                  <div key={c.id} style={{ background: 'rgba(13,17,23,0.6)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(48,54,61,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#e6edf3', fontWeight: '700', fontSize: '0.85rem' }}>{c.name}</span>
                      <span style={{ background: 'rgba(31,111,235,0.15)', color: '#58a6ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>{c.crmProvider}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b949e', fontSize: '0.75rem', marginBottom: '6px' }}>
                      <span>{c.currentPhase}</span>
                      <span style={{ color: '#2ed573', fontWeight: '700' }}>{c.progress}% Complete</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(48,54,61,0.6)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.progress}%`, background: 'linear-gradient(90deg, #1f6feb, #2ed573)', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {erpTab === 'people' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <input
              type="text"
              placeholder="🔍 Search team by name, role, department..."
              value={peopleSearch}
              onChange={e => setPeopleSearch(e.target.value)}
              style={{ padding: '10px 16px', background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', width: '320px', outline: 'none' }}
            />
            <button onClick={() => setShowPersonModal(true)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
              ➕ Log Team Member Progress
            </button>
          </div>

          <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.6)', color: '#8b949e', paddingBottom: '10px' }}>
                  <th style={{ padding: '10px' }}>Team Member</th>
                  <th style={{ padding: '10px' }}>Role / Dept</th>
                  <th style={{ padding: '10px' }}>Active Projects</th>
                  <th style={{ padding: '10px' }}>Tasks Completed</th>
                  <th style={{ padding: '10px' }}>Sprint Velocity</th>
                  <th style={{ padding: '10px' }}>Billable Hours</th>
                  <th style={{ padding: '10px' }}>Efficiency Score</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)' }}>
                    <td style={{ padding: '14px 10px', color: '#e6edf3', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.78rem' }}>
                          {p.name.charAt(0)}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px', color: '#8b949e' }}>
                      <div style={{ color: '#e6edf3', fontWeight: '600' }}>{p.role}</div>
                      <div style={{ fontSize: '0.75rem' }}>{p.dept}</div>
                    </td>
                    <td style={{ padding: '14px 10px', color: '#58a6ff', fontWeight: '700' }}>{p.activeProjects} Projects</td>
                    <td style={{ padding: '14px 10px', color: '#e6edf3', fontWeight: '700' }}>{p.tasksCompleted} Completed</td>
                    <td style={{ padding: '14px 10px', color: '#a78bfa', fontWeight: '700' }}>{p.sprintVelocity}</td>
                    <td style={{ padding: '14px 10px', color: '#8b949e' }}>{p.billableHours} hrs</td>
                    <td style={{ padding: '14px 10px', color: p.color, fontWeight: '800' }}>{p.efficiency}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '4px', background: `${p.color}18`, color: p.color, fontWeight: '700', fontSize: '0.72rem' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {erpTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <input
              type="text"
              placeholder="🔍 Search client account or CRM provider..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              style={{ padding: '10px 16px', background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', width: '320px', outline: 'none' }}
            />
            <button onClick={() => setShowClientModal(true)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
              ➕ Add Client Project Progress
            </button>
          </div>

          <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.6)', color: '#8b949e', paddingBottom: '10px' }}>
                  <th style={{ padding: '10px' }}>Client Account</th>
                  <th style={{ padding: '10px' }}>CRM Platform</th>
                  <th style={{ padding: '10px' }}>Contract Value</th>
                  <th style={{ padding: '10px' }}>CRM Status</th>
                  <th style={{ padding: '10px' }}>Current Phase</th>
                  <th style={{ padding: '10px' }}>Delivery Progress</th>
                  <th style={{ padding: '10px' }}>Health Score</th>
                  <th style={{ padding: '10px' }}>CTO Owner</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)' }}>
                    <td style={{ padding: '14px 10px', color: '#e6edf3', fontWeight: '700' }}>{c.name}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(31,111,235,0.12)', border: '1px solid rgba(31,111,235,0.3)', color: '#58a6ff', fontWeight: '700', fontSize: '0.76rem' }}>
                        {c.crmProvider}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', color: '#2ed573', fontWeight: '800' }}>{c.contractValue}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: c.crmStatus === 'Connected' ? '#2ed57320' : '#d2992220', color: c.crmStatus === 'Connected' ? '#2ed573' : '#d29922', fontWeight: '700', fontSize: '0.72rem' }}>
                        {c.crmStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', color: '#8b949e' }}>{c.currentPhase}</td>
                    <td style={{ padding: '14px 10px', width: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b949e', marginBottom: '4px' }}>
                        <span>Milestones {c.milestones}</span>
                        <span style={{ color: '#58a6ff', fontWeight: '700' }}>{c.progress}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(48,54,61,0.6)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.progress}%`, background: 'linear-gradient(90deg, #1f6feb, #2ed573)', borderRadius: '3px' }}></div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px', color: '#a78bfa', fontWeight: '800' }}>{c.healthScore} / 100</td>
                    <td style={{ padding: '14px 10px', color: '#8b949e' }}>{c.ctoOwner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {erpTab === 'resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.95rem', fontWeight: '800' }}>💰 Departmental Budget vs Spend</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', paddingBottom: '8px' }}>
                    <th style={{ padding: '8px' }}>Department</th>
                    <th style={{ padding: '8px' }}>Allocated</th>
                    <th style={{ padding: '8px' }}>Spent</th>
                    <th style={{ padding: '8px' }}>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dept: 'Core Engineering', alloc: '$450,000', spent: '$280,000', util: '62.2%' },
                    { dept: 'CRM Connectors Gateway', alloc: '$320,000', spent: '$195,000', util: '60.9%' },
                    { dept: 'DevOps & AWS Edge', alloc: '$180,000', spent: '$110,000', util: '61.1%' },
                    { dept: 'Customer Support Ops', alloc: '$120,000', spent: '$75,000', util: '62.5%' }
                  ].map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                      <td style={{ padding: '10px 8px', color: '#e6edf3', fontWeight: '700' }}>{r.dept}</td>
                      <td style={{ padding: '10px 8px', color: '#58a6ff' }}>{r.alloc}</td>
                      <td style={{ padding: '10px 8px', color: '#f85149' }}>{r.spent}</td>
                      <td style={{ padding: '10px 8px', color: '#2ed573', fontWeight: '700' }}>{r.util}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.95rem', fontWeight: '800' }}>☁️ Cloud Infrastructure & Connector Costs</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', paddingBottom: '8px' }}>
                    <th style={{ padding: '8px' }}>Integration Service</th>
                    <th style={{ padding: '8px' }}>Monthly Cost</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { prov: 'HubSpot Gateway Node', cost: '$1,420 / mo', status: 'Optimal' },
                    { prov: 'Salesforce Adapter Cluster', cost: '$2,850 / mo', status: 'Optimal' },
                    { prov: 'Pipedrive Async Worker', cost: '$890 / mo', status: 'Optimal' },
                    { prov: 'Zoho & Zapier Edge', cost: '$1,150 / mo', status: 'Optimal' }
                  ].map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                      <td style={{ padding: '10px 8px', color: '#e6edf3', fontWeight: '700' }}>{c.prov}</td>
                      <td style={{ padding: '10px 8px', color: '#a78bfa', fontWeight: '700' }}>{c.cost}</td>
                      <td style={{ padding: '10px 8px' }}><span style={{ color: '#2ed573', background: '#2ed57315', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showPersonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#161b22', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '14px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#e6edf3', fontSize: '1.1rem', fontWeight: '800' }}>👥 Log Team Progress (CTO Console)</h3>
            <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>MEMBER NAME</label>
                <input type="text" required value={newPerson.name} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} placeholder="e.g. Rahul Sharma" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>ROLE</label>
                  <input type="text" value={newPerson.role} onChange={e => setNewPerson({ ...newPerson, role: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>DEPARTMENT</label>
                  <input type="text" value={newPerson.dept} onChange={e => setNewPerson({ ...newPerson, dept: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>TASKS COMPLETED</label>
                  <input type="number" value={newPerson.tasksCompleted} onChange={e => setNewPerson({ ...newPerson, tasksCompleted: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>EFFICIENCY SCORE</label>
                  <input type="text" value={newPerson.efficiency} onChange={e => setNewPerson({ ...newPerson, efficiency: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPersonModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(48,54,61,0.8)', color: '#8b949e', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#161b22', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '14px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#e6edf3', fontSize: '1.1rem', fontWeight: '800' }}>🏢 Add Client ERP Progress</h3>
            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>CLIENT ACCOUNT NAME</label>
                <input type="text" required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} placeholder="e.g. Global Tech Solutions" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>CRM PROVIDER</label>
                  <select value={newClient.crmProvider} onChange={e => setNewClient({ ...newClient, crmProvider: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }}>
                    {['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho CRM', 'Zapier'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>CONTRACT VALUE</label>
                  <input type="text" value={newClient.contractValue} onChange={e => setNewClient({ ...newClient, contractValue: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>PROGRESS %</label>
                  <input type="number" value={newClient.progress} onChange={e => setNewClient({ ...newClient, progress: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>HEALTH SCORE (0-100)</label>
                  <input type="number" value={newClient.healthScore} onChange={e => setNewClient({ ...newClient, healthScore: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowClientModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(48,54,61,0.8)', color: '#8b949e', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [simTab, setSimTab] = useState('hubspot');

  // Custom interactive & dynamic landing page/auth states
  const [simCustomRaw, setSimCustomRaw] = useState(simPayloads.hubspot.raw);
  const [simNormalized, setSimNormalized] = useState(simPayloads.hubspot.normalized);
  const [liveLogs, setLiveLogs] = useState([
    `[${new Date().toLocaleTimeString()}] INFO: API Gateway initialized on port 3000`,
    `[${new Date().toLocaleTimeString()}] SUCCESS: Database connected in fallback mode`,
  ]);
  const [previewRole, setPreviewRole] = useState('Employee');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request code, 2 = reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [providers, setProviders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(!!AUTH_TOKEN);
  const [registering, setRegistering] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    department: 'Engineering',
    role: 'CTO'
  });
  const [loginError, setLoginError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [backendDown, setBackendDown] = useState(false);

  // Custom features states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [credentialModal, setCredentialModal] = useState(null);
  const [devResetCode, setDevResetCode] = useState('');
  const [isSyncing, setIsSyncing] = useState({});
  const [toast, setToast] = useState(null);

  // Worldwide Company Adder States
  const [isCompanyAdderOpen, setIsCompanyAdderOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyForm, setCompanyForm] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    provider: 'mock'
  });
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  // API Log Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logMethod, setLogMethod] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Feature Matrix states
  const [fmTab, setFmTab] = useState('build');
  const [fmBuildEndpoint, setFmBuildEndpoint] = useState('contacts/sync');
  const [fmBuildFields, setFmBuildFields] = useState([
    { name: 'email', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'phone', type: 'string' }
  ]);
  const [fmBuildOutput, setFmBuildOutput] = useState('');
  const [fmEncryptValue, setFmEncryptValue] = useState('ghs_HubSpotAccessTokenValue12345');
  const [fmCiphertext, setFmCiphertext] = useState('');
  const [fmDecrypted, setFmDecrypted] = useState('');
  const [fmEncLoading, setFmEncLoading] = useState(false);
  const [fmTestSchema, setFmTestSchema] = useState('contacts');
  const [fmTestOutput, setFmTestOutput] = useState('');
  const [fmTestLoading, setFmTestLoading] = useState(false);
  const [fmRefreshTimeline, setFmRefreshTimeline] = useState([]);
  const [fmRefreshStep, setFmRefreshStep] = useState(0);
  const [fmRefreshRunning, setFmRefreshRunning] = useState(false);

  // Enterprise tenancy & RBAC states
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('unified_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [approvals, setApprovals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // API Playground states
  const [playgroundMethod, setPlaygroundMethod] = useState('GET');
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/contacts');
  const [playgroundHeaders, setPlaygroundHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [playgroundParams, setPlaygroundParams] = useState([{ key: 'limit', value: '10' }]);
  const [playgroundBody, setPlaygroundBody] = useState('{\n  "name": "Jane Doe",\n  "email": "jane@example.com",\n  "phone": "555-0199",\n  "jobTitle": "Product Manager",\n  "provider": "mock"\n}');
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundLatency, setPlaygroundLatency] = useState(null);
  const [playgroundPayloadSize, setPlaygroundPayloadSize] = useState(null);
  const [playgroundHistory, setPlaygroundHistory] = useState([
    { method: 'GET', endpoint: '/contacts', timestamp: '10:05 AM', status: 200, latency: '42ms' },
    { method: 'GET', endpoint: '/companies', timestamp: '10:02 AM', status: 200, latency: '35ms' },
    { method: 'POST', endpoint: '/contacts', timestamp: '09:55 AM', status: 201, latency: '89ms' },
  ]);
  const [playgroundActiveTab, setPlaygroundActiveTab] = useState('params');
  const [copied, setCopied] = useState(false);

  // Normalization Explorer states
  const [explorerProvider, setExplorerProvider] = useState('hubspot');
  const [explorerModel, setExplorerModel] = useState('contact');

  // Marketplace filter state
  const [marketFilter, setMarketFilter] = useState('all');

  const [roleTabConfigs, setRoleTabConfigs] = useState(() => {
    const saved = localStorage.getItem('unified_role_configs');
    if (saved) return JSON.parse(saved);
    return {
      CTO: ['dashboard', 'cto-erp', 'doc-parser', 'contacts', 'companies', 'integrations', 'projects', 'feature-matrix', 'api-playground', 'flow', 'architecture', 'explorer', 'challenges', 'dx', 'roadmap', 'team', 'enterprise', 'docs', 'logs', 'analytics', 'erp-inventory', 'erp-finance', 'erp-hr', 'erp-orders'],
      CEO: ['dashboard', 'cto-erp', 'doc-parser', 'contacts', 'companies', 'integrations', 'projects', 'analytics', 'docs', 'erp-finance'],
      Admin: ['dashboard', 'cto-erp', 'doc-parser', 'contacts', 'companies', 'integrations', 'projects', 'logs', 'analytics', 'docs', 'erp-inventory', 'erp-finance', 'erp-hr', 'erp-orders'],
      'Regional Head': ['dashboard', 'doc-parser', 'contacts', 'companies', 'analytics', 'erp-inventory', 'erp-orders'],
      Manager: ['dashboard', 'doc-parser', 'projects', 'contacts', 'companies', 'analytics', 'docs'],
      'Senior Developer': ['dashboard', 'doc-parser', 'projects', 'api-playground', 'explorer', 'flow', 'dx', 'docs'],
      'Support Engineer': ['dashboard', 'doc-parser', 'contacts', 'companies', 'logs', 'docs'],
      'Sales Lead': ['dashboard', 'doc-parser', 'contacts', 'companies', 'integrations', 'analytics'],
      Client: ['dashboard', 'doc-parser', 'projects', 'contacts', 'companies', 'docs'],
      Employee: ['dashboard', 'doc-parser', 'projects', 'api-playground', 'explorer', 'docs'],
      Intern: ['dashboard', 'doc-parser', 'architecture', 'challenges', 'dx', 'roadmap', 'team', 'enterprise', 'docs'],
    };
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      // Redirect out of unauthorized views if not approved yet
      if (currentUser?.status === 'PENDING') {
        setLoading(false);
        return;
      }

      // Fetch org projects and approvals for managers/admins
      const hasApprovalPerm = currentUser?.role === 'CTO' || currentUser?.role === 'Admin';

      const promises = [
        api.get('/integrations'),
        api.get('/contacts?limit=50').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/companies?limit=50').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/analytics').catch(() => ({ data: { data: null } })),
        api.get('/logs?limit=50').catch(() => ({ data: { data: [] } })),
        api.get('/projects').catch(() => ({ data: { data: [] } }))
      ];

      if (hasApprovalPerm) {
        promises.push(api.get('/approvals').catch(() => ({ data: { data: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      const [rIntegrations, rContacts, rCompanies, rAnalytics, rLogs, rProjects, rApprovals] = await Promise.all(promises);

      setProviders(rIntegrations.data?.data || []);
      setContacts(rContacts.data?.data?.data || []);
      setCompanies(rCompanies.data?.data?.data || []);
      setAnalytics(rAnalytics.data?.data || null);
      setLogs(rLogs.data?.data || []);
      setProjects(rProjects.data?.data || []);
      setApprovals(rApprovals.data?.data || []);
      setBackendDown(false);
    } catch (err) {
      if (!err.response) {
        setBackendDown(true);
        setFetchError('Backend server is not reachable. Run: cd backend && npm run dev');
      } else {
        setFetchError(err.response?.data?.message || `Error ${err.response?.status}: Something went wrong.`);
      }
    } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn, fetchData]);

  const handleDeleteCompany = async (id, provider) => {
    if (provider === 'mock') {
      setCompanies(prev => prev.filter(c => c.id !== id));
      showToast('🏢 Mock company removed from view', 'success');
      return;
    }
    try {
      await api.delete(`/companies/${id}`);
      showToast('🏢 Company removed successfully', 'success');
      setCompanies(prev => prev.filter(c => c.id !== id));
      api.get('/analytics').then(r => setAnalytics(r.data?.data || null)).catch(() => {});
      api.get('/logs?limit=50').then(r => setLogs(r.data?.data || [])).catch(() => {});
    } catch (err) {
      showToast('❌ Failed to delete company: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleDeleteContact = async (id, provider) => {
    if (provider === 'mock') {
      setContacts(prev => prev.filter(c => c.id !== id));
      showToast('👤 Mock contact removed from view', 'success');
      return;
    }
    try {
      await api.delete(`/contacts/${id}`);
      showToast('👤 Contact removed successfully', 'success');
      setContacts(prev => prev.filter(c => c.id !== id));
      api.get('/analytics').then(r => setAnalytics(r.data?.data || null)).catch(() => {});
      api.get('/logs?limit=50').then(r => setLogs(r.data?.data || [])).catch(() => {});
    } catch (err) {
      showToast('❌ Failed to delete contact: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.name.trim()) {
      showToast('❌ Company name is required', 'error');
      return;
    }
    setIsAddingCompany(true);
    try {
      const response = await api.post('/companies', {
        name: companyForm.name,
        website: companyForm.website || undefined,
        industry: companyForm.industry || undefined,
        size: companyForm.size || undefined,
        provider: companyForm.provider || 'mock'
      });
      showToast('🏢 Company added successfully!', 'success');
      
      const newCo = response.data?.data;
      if (newCo) {
        setCompanies(prev => [newCo, ...prev]);
      } else {
        fetchData();
      }

      setCompanyForm({ name: '', website: '', industry: '', size: '', provider: 'mock' });
      setCompanySearchQuery('');
      setIsCompanyAdderOpen(false);

      api.get('/analytics').then(r => setAnalytics(r.data?.data || null)).catch(() => {});
      api.get('/logs?limit=50').then(r => setLogs(r.data?.data || [])).catch(() => {});
    } catch (err) {
      showToast('❌ Failed to add company: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsAddingCompany(false);
    }
  };

  // Feature Matrix: Run Encryption simulation
  const handleFmEncrypt = () => {
    setFmEncLoading(true);
    setFmCiphertext('');
    setFmDecrypted('');
    
    setTimeout(() => {
      const iv = Array.from({length: 12}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const tag = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const encrypted = btoa(fmEncryptValue).substring(0, 24);
      
      setFmCiphertext(`aes-256-gcm:$iv=${iv}:$tag=${tag}:$ciphertext=${encrypted}`);
      setFmDecrypted(fmEncryptValue);
      setFmEncLoading(false);
      showToast('🔒 Data encrypted and stored in DB', 'success');
    }, 800);
  };

  // Feature Matrix: Run Mock Query
  const handleFmTestQuery = () => {
    setFmTestLoading(true);
    setFmTestOutput('');
    setTimeout(() => {
      let outputObj = [];
      if (fmTestSchema === 'contacts') {
        outputObj = [
          { id: 'uuid-1', externalId: 'mock-c-01', name: 'John Doe', email: 'john.doe@example.com', jobTitle: 'CEO', provider: 'mock' },
          { id: 'uuid-2', externalId: 'mock-c-02', name: 'Jane Smith', email: 'jane.smith@techcorp.com', jobTitle: 'CTO', provider: 'mock' }
        ];
      } else if (fmTestSchema === 'companies') {
        outputObj = [
          { id: 'uuid-3', externalId: 'mock-co-01', name: 'TechCorp Inc', website: 'techcorp.com', industry: 'Technology', provider: 'mock' },
          { id: 'uuid-4', externalId: 'mock-co-02', name: 'StartupXYZ', website: 'startup.xyz', industry: 'Fintech', provider: 'mock' }
        ];
      } else {
        outputObj = [
          { id: 'uuid-5', externalId: 'mock-d-01', title: 'Enterprise Licensing Deal', amount: 150000, stage: 'Negotiation', provider: 'mock' }
        ];
      }
      setFmTestOutput(JSON.stringify({
        success: true,
        statusCode: 200,
        provider: 'mock',
        data: outputObj,
        timestamp: new Date().toISOString()
      }, null, 2));
      setFmTestLoading(false);
      showToast('🚀 Mock request complete (200 OK)', 'success');
    }, 600);
  };

  // Feature Matrix: Run Token Refresh Simulator
  const handleFmRefreshSim = () => {
    if (fmRefreshRunning) return;
    setFmRefreshRunning(true);
    setFmRefreshStep(0);
    setFmRefreshTimeline([]);

    const log = (msg) => setFmRefreshTimeline(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // Step 1: Send Request
    setTimeout(() => {
      setFmRefreshStep(1);
      log('📡 Sending GET /api/v1/contacts with current access_token...');
    }, 0);

    // Step 2: 401 Unauthorized
    setTimeout(() => {
      setFmRefreshStep(2);
      log('❌ Server returned: 401 Unauthorized. Access token expired.');
    }, 1500);

    // Step 3: Call refresh endpoint
    setTimeout(() => {
      setFmRefreshStep(3);
      log('🔄 Client interceptor triggers POST /api/v1/auth/refresh with refresh_token...');
    }, 3000);

    // Step 4: Token Rotated
    setTimeout(() => {
      setFmRefreshStep(4);
      log('🔑 Server validated refresh_token! Rotated keys and returned new access_token.');
    }, 4500);

    // Step 5: Retry successful
    setTimeout(() => {
      setFmRefreshStep(5);
      log('🎉 Retrying original request with new access_token -> 200 OK!');
      setFmRefreshRunning(false);
      showToast('🔄 Token successfully refreshed!', 'success');
    }, 6000);
  };

  useEffect(() => {
    if (simPayloads[simTab]) {
      setSimCustomRaw(simPayloads[simTab].raw);
      setSimNormalized(simPayloads[simTab].normalized);
    }
  }, [simTab]);

  const handleNormalizeInput = (rawText) => {
    setSimCustomRaw(rawText);
    try {
      const parsed = JSON.parse(rawText);
      let normalizedObj = {};

      if (simTab === 'hubspot') {
        const props = parsed.properties || {};
        normalizedObj = {
          id: parsed.id ? `contact_${parsed.id}` : `contact_${Math.random().toString(36).substr(2, 8)}`,
          name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || 'Jane Doe',
          email: props.email || 'jane.doe@acme.com',
          phone: props.phone || '+1-555-890-1234',
          jobTitle: props.jobtitle || 'Head of Platform Engineering',
          provider: 'hubspot',
          rawData: {
            id: parsed.id || 'vid-827101',
            properties: {
              firstname: props.firstname || 'Jane',
              lastname: props.lastname || 'Doe',
              email: props.email || 'jane.doe@acme.com'
            }
          }
        };
      } else if (simTab === 'salesforce') {
        normalizedObj = {
          id: parsed.Id ? `contact_${parsed.Id.substring(0, 8)}` : `contact_${Math.random().toString(36).substr(2, 8)}`,
          name: `${parsed.FirstName || ''} ${parsed.LastName || ''}`.trim() || 'Jane Doe',
          email: parsed.Email || 'jane.doe@acme.com',
          phone: parsed.Phone || '+1-555-890-1234',
          jobTitle: parsed.Title || 'Head of Platform Engineering',
          provider: 'salesforce',
          rawData: {
            Id: parsed.Id || '0038W00002NlW5yQAF',
            attributes: parsed.attributes || { type: "Contact" }
          }
        };
      } else if (simTab === 'pipedrive') {
        const emailVal = Array.isArray(parsed.email)
          ? (parsed.email[0]?.value || parsed.email[0])
          : parsed.email;
        const phoneVal = Array.isArray(parsed.phone)
          ? (parsed.phone[0]?.value || parsed.phone[0])
          : parsed.phone;
        normalizedObj = {
          id: parsed.id ? `contact_${parsed.id}` : `contact_${Math.random().toString(36).substr(2, 8)}`,
          name: parsed.name || 'Jane Doe',
          email: emailVal || 'jane.doe@acme.com',
          phone: phoneVal || '+1-555-890-1234',
          jobTitle: parsed.jobTitle || 'Lead',
          provider: 'pipedrive',
          rawData: {
            id: parsed.id || 8271,
            email: Array.isArray(parsed.email) ? parsed.email : [{ value: emailVal || 'jane.doe@acme.com' }]
          }
        };
      } else {
        normalizedObj = {
          id: parsed.id || `contact_${Math.random().toString(36).substr(2, 8)}`,
          name: parsed.name || parsed.FirstName || 'Jane Doe',
          email: parsed.email || parsed.Email || 'jane.doe@acme.com',
          phone: parsed.phone || parsed.Phone || '+1-555-890-1234',
          jobTitle: parsed.jobTitle || parsed.Title || 'Developer',
          provider: 'mock',
          rawData: parsed
        };
      }

      setSimNormalized(JSON.stringify(normalizedObj, null, 2));
    } catch (e) {
      setSimNormalized(`// Invalid JSON syntax: \n// ${e.message}`);
    }
  };

  useEffect(() => {
    if (isLoggedIn || showAuth) return;
    const logPool = [
      "INFO: Webhook received from HubSpot (resource: contact.creation)",
      "SUCCESS: Normalized contact mapping completed for user_id dev-mock-user-001 in 12ms",
      "INFO: Token refresh requested for Salesforce connection",
      "SUCCESS: AES-256 decrypted access token successfully, revolving...",
      "INFO: Query received: GET /api/v1/contacts?limit=10&provider=pipedrive",
      "SUCCESS: Retrieved and serialized 10 contacts from Pipedrive API",
      "WARNING: High serialization latency warning on salesforce gateway connector (32ms)",
      "INFO: Intern role request routing: restricted tab diagnostic block applied",
      "SUCCESS: Audit trail committed for project Core Sync Portal changes",
      "INFO: Synced database state fallback - local_database.json updated"
    ];

    const interval = setInterval(() => {
      const randomMsg = logPool[Math.floor(Math.random() * logPool.length)];
      setLiveLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ${randomMsg}`,
        ...prev.slice(0, 5)
      ]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoggedIn, showAuth]);

  const handleQuickFill = () => {
    setLoginForm(prev => ({
      ...prev,
      email: 'admin@unifiedcrm.io',
      password: 'UnifiedCRM2026!Secured'
    }));
    showToast('Demo admin credentials filled!', 'success');
  };

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        const prov = event.data.provider;
        const displayName = prov.charAt(0).toUpperCase() + prov.slice(1);
        showToast(`${displayName} connected successfully.`);
        fetchData();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError(''); setSuccessMsg(''); setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginForm.email, password: loginForm.password });
      AUTH_TOKEN = res.data.data.tokens.accessToken;
      localStorage.setItem('unified_token', AUTH_TOKEN);
      localStorage.setItem('unified_user', JSON.stringify(res.data.data.user));
      setCurrentUser(res.data.data.user);
      setIsLoggedIn(true);
    } catch (err) {
      if (!err.response) setLoginError('⚠️ Backend not running. Start: cd backend && npm run dev');
      else if (err.response?.status === 401) setLoginError('❌ Wrong email or password.');
      else setLoginError('❌ ' + (err.response?.data?.message || 'Login failed. Try again.'));
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setLoginError(''); setSuccessMsg(''); setLoginLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: loginForm.name.trim() || loginForm.email.split('@')[0] || 'User',
        email: loginForm.email.trim(),
        password: loginForm.password,
        organizationName: loginForm.organizationName ? loginForm.organizationName.trim() : undefined,
        department: loginForm.department || 'Engineering',
        role: loginForm.role || 'CTO'
      });

      const { tokens, user } = res.data?.data || {};
      if (tokens?.accessToken && user) {
        localStorage.setItem('unified_token', tokens.accessToken);
        localStorage.setItem('unified_user', JSON.stringify(user));
        AUTH_TOKEN = tokens.accessToken;
        setCurrentUser(user);
        setIsLoggedIn(true);
        setShowAuth(false);
        showToast(`🎉 Registration successful! Welcome to ${loginForm.organizationName || 'your workspace'} as ${user.role}!`, 'success');
        fetchData();
      } else {
        setSuccessMsg('✅ Registration successful! Please sign in with your credentials.');
        setRegistering(false);
      }
    } catch (err) {
      if (!err.response) {
        setLoginError('⚠️ Backend not running. Start server.');
      } else {
        const resErr = err.response?.data;
        const errorText = resErr?.errors ? resErr.errors.join(', ') : (resErr?.message || 'Registration failed. Please try again.');
        setLoginError('❌ ' + errorText);
      }
    } finally { setLoginLoading(false); }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault(); setLoginError(''); setSuccessMsg(''); setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      showToast(`🔐 Security code sent to ${forgotEmail}! Please check your email inbox.`, 'success');
      setSuccessMsg(`✅ Verification code sent to ${forgotEmail}. Enter the code and your new password below.`);
      setForgotStep(2);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Failed to send verification code. Please check email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setLoginError(''); setSuccessMsg('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setLoginError('❌ New Password and Confirm Password do not match.');
      return;
    }

    if (forgotNewPassword.length < 3) {
      setLoginError('❌ New Password must be at least 3 characters.');
      return;
    }

    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        newPassword: forgotNewPassword
      });
      showToast('🎉 Password reset successful! Please sign in with your new password.', 'success');
      setSuccessMsg('✅ Password reset successful! Sign in with your new credentials.');
      setForgotMode(false);
      setForgotStep(1);
      setRegistering(false);
      setLoginForm(prev => ({ ...prev, email: forgotEmail, password: '' }));
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Failed to reset password. Please verify your 6-digit code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      const updatedUser = res.data.data;
      if (updatedUser) {
        localStorage.setItem('unified_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        if (updatedUser.status === 'APPROVED') {
          showToast('Your workspace approval has been granted! Logging in...', 'success');
          setTimeout(() => {
            fetchData();
          }, 100);
        } else {
          showToast('Status check complete. Your account is still awaiting administrator approval.', 'info');
        }
      }
    } catch (err) {
      if (!err.response) {
        showToast('Backend server is not reachable. Run: cd backend && npm run dev', 'error');
      } else {
        showToast(err.response?.data?.message || 'Failed to check status. Try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('unified_token');
    localStorage.removeItem('unified_user');
    AUTH_TOKEN = '';
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowAuth(false);
  };

  const handleConnect = async (provider, displayName) => {
    try {
      showToast(`⚡ Provisioning Universal Gateway Connection for ${displayName || provider}...`, 'info');
      const res = await api.post(`/integrations/${provider}/connect`, {
        accountUserId: `${provider}_workspace_account`,
        apiKey: `uc_tok_${provider}_${Date.now()}`
      });

      if (res.data.data?.status === 'PENDING_APPROVAL') {
        showToast('Connection request submitted for administrator approval.', 'info');
      } else {
        showToast(`🎉 ${displayName || provider} connected successfully via Universal API Engine!`, 'success');
      }
      fetchData();
    } catch (err) {
      showToast(`Connection failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const submitPlatformCredentials = async (e) => {
    e.preventDefault();
    if (!credentialModal) return;
    const { provider, displayName, accountUserId, apiKey, portalDomain } = credentialModal;
    try {
      showToast(`Submitting platform credentials for ${displayName}...`, 'info');
      const res = await api.post(`/integrations/${provider}/connect`, {
        accountUserId,
        apiKey,
        portalDomain,
      });

      if (res.data.data?.status === 'PENDING_APPROVAL') {
        showToast('Connection request submitted for administrator approval.', 'info');
      } else {
        showToast(`🎉 ${displayName} connected successfully with User ID (${accountUserId || 'Default Account'})!`, 'success');
      }
      setCredentialModal(null);
      fetchData();
    } catch (err) {
      showToast(`Connection failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const confirmDisconnect = (provider) => {
    setShowConfirmModal(provider);
  };

  const handleDisconnect = async () => {
    const provider = showConfirmModal;
    setShowConfirmModal(null);
    try {
      const res = await api.post(`/integrations/${provider}/disconnect`);
      if (res.data.data?.status === 'PENDING_APPROVAL') {
        showToast('Disconnect request submitted for administrator approval.', 'info');
      } else {
        showToast(`${provider.toUpperCase()} connection revoked.`);
      }
      fetchData();
    } catch (err) {
      showToast(`Failed to disconnect: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleSync = async (provider) => {
    setIsSyncing(prev => ({ ...prev, [provider]: true }));
    try {
      const r = await api.post(`/integrations/${provider}/sync`);
      showToast(`Sync complete! Mapped ${r.data.data.syncedCounts.contacts} contacts and ${r.data.data.syncedCounts.companies} companies.`);
      fetchData();
    } catch (err) {
      showToast('Sync failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSyncing(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleResolveApproval = async (id, resolution) => {
    try {
      await api.post(`/approvals/${id}/resolve`, { resolution });
      showToast(`Request resolved: ${resolution}`);
      fetchData();
    } catch (err) {
      showToast('Failed to resolve request: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      await api.post('/projects', { name: newProjectName, description: newProjectDesc });
      showToast('Project created successfully!');
      setNewProjectName('');
      setNewProjectDesc('');
      fetchData();
    } catch (err) {
      showToast('Failed to create project: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handlePlaygroundSend = async () => {
    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    const startTime = Date.now();
    try {
      const qParams = {};
      playgroundParams.forEach(p => { if (p.key) qParams[p.key] = p.value; });
      const queryStr = new URLSearchParams(qParams).toString();

      const headers = {};
      playgroundHeaders.forEach(h => { if (h.key) headers[h.key] = h.value; });

      const finalPath = playgroundEndpoint + (queryStr ? `?${queryStr}` : '');

      let res;
      if (playgroundMethod === 'GET') {
        res = await api.get(finalPath, { headers });
      } else if (playgroundMethod === 'POST') {
        const body = JSON.parse(playgroundBody);
        res = await api.post(playgroundEndpoint, body, { headers });
      } else if (playgroundMethod === 'PATCH') {
        const body = JSON.parse(playgroundBody);
        res = await api.patch(playgroundEndpoint, body, { headers });
      } else if (playgroundMethod === 'DELETE') {
        res = await api.delete(finalPath, { headers });
      }

      const latency = Date.now() - startTime;
      const sizeBytes = JSON.stringify(res.data).length;
      const sizeText = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(2)} KB` : `${sizeBytes} B`;

      setPlaygroundLatency(`${latency}ms`);
      setPlaygroundPayloadSize(sizeText);
      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data,
      });

      const historyItem = {
        method: playgroundMethod,
        endpoint: playgroundEndpoint,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: res.status,
        latency: `${latency}ms`,
      };
      setPlaygroundHistory(prev => [historyItem, ...prev.slice(0, 19)]);
    } catch (err) {
      const latency = Date.now() - startTime;
      setPlaygroundLatency(`${latency}ms`);
      setPlaygroundPayloadSize('N/A');
      setPlaygroundResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        data: err.response?.data || { message: err.message },
      });
    } finally {
      setPlaygroundLoading(false);
      fetchData();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ══════════════════════════════════════
  // REGISTER & LOGIN SCREEN
  // ══════════════════════════════════════
  if (!isLoggedIn) {
    if (!showAuth) {
      // LANDING PAGE RENDER
      return (
        <div style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at 50% 10%, #0f1c30 0%, #05070a 100%)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#c9d1d9',
          paddingBottom: '0px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative glass glow blobs */}
          <div style={{ position: 'absolute', top: '5%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(31,111,235,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(30px)' }} />

          {/* Landing Header with Glassmorphism */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 40px', maxWidth: '1280px', margin: '0 auto',
            borderBottom: '1px solid rgba(48,54,61,0.4)', backdropFilter: 'blur(16px)',
            position: 'sticky', top: 0, zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 0 15px rgba(31,111,235,0.4)' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ color: '#e6edf3', fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #8b949e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Universal API</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <a href="#features" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Features</a>
              <a href="#simulator" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Simulator</a>
              <button onClick={() => setShowAuth(true)} style={{
                background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
                color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px',
                fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(31,111,235,0.35)', transition: 'all 0.2s'
              }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(139,92,246,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(31,111,235,0.35)'; }}>
                Access Console
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '90px 40px 40px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <span style={{
              background: 'rgba(31,111,235,0.15)', color: '#58a6ff', padding: '6px 16px', borderRadius: '30px',
              fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(31,111,235,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block', marginBottom: '28px',
              boxShadow: '0 0 15px rgba(31,111,235,0.1)'
            }}>
              Now Live: Multi-Tenant Sandbox
            </span>
            <h1 style={{
              fontSize: '3.8rem', fontWeight: '900', color: '#e6edf3', lineHeight: '1.1',
              maxWidth: '900px', margin: '0 auto 24px', letterSpacing: '-0.03em'
            }}>
              The Unified Gateway for <span style={{ background: 'linear-gradient(120deg, #58a6ff 0%, #bc8cff 50%, #ff8c42 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SaaS Integrations</span>
            </h1>
            <p style={{
              fontSize: '1.2rem', color: '#8b949e', maxWidth: '700px', margin: '0 auto 40px',
              lineHeight: '1.6', fontWeight: '400'
            }}>
              Standardize, map, and query customer contacts, companies, and deals from HubSpot, Salesforce, and Pipedrive through a single robust, compliant API.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '70px' }}>
              <button onClick={() => setShowAuth(true)} style={{
                background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
                color: 'white', border: 'none', padding: '16px 32px', borderRadius: '10px',
                fontSize: '0.98rem', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(31,111,235,0.4)', display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'all 0.2s'
              }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(139,92,246,0.5)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(31,111,235,0.4)'; }}>
                Access Console <ArrowRight size={18} />
              </button>
              <a href="#simulator" style={{
                background: 'rgba(33,38,45,0.4)', color: '#c9d1d9', border: '1px solid rgba(48,54,61,0.8)',
                padding: '16px 32px', borderRadius: '10px', fontSize: '0.98rem', fontWeight: '800',
                cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'all 0.2s', backdropFilter: 'blur(8px)'
              }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(33,38,45,0.7)'; e.currentTarget.style.borderColor = '#8b949e'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(33,38,45,0.4)'; e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Try Normalizer Demo
              </a>
            </div>

            {/* Dynamic Counter Stats Row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px',
              maxWidth: '1100px', margin: '0 auto', padding: '48px 24px',
              background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(48,54,61,0.3)',
              borderRadius: '16px', backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <div>
                <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#58a6ff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  <CountUp end={42} suffix="M+" />
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Normalized Requests</span>
              </div>
              <div>
                <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#a78bfa', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  &lt; <CountUp end={15} suffix="ms" />
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Serialization Delay</span>
              </div>
              <div>
                <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#2ed573', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  <CountUp end={99.999} suffix="%" decimals={3} />
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gateway Uptime</span>
              </div>
              <div>
                <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ff8c42', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  <CountUp end={10} suffix="+ Roles" />
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#8b949e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RBAC Isolation Scopes</span>
              </div>
            </div>

            {/* Workflow & User Operating Guide Section */}
            <div id="workflow-guide" style={{ marginTop: '80px', padding: '0 20px', textAlign: 'center' }}>
              <span style={{
                background: 'rgba(46,213,115,0.12)', color: '#2ed573', padding: '6px 14px', borderRadius: '20px',
                fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(46,213,115,0.25)',
                textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block', marginBottom: '16px'
              }}>
                📖 Enterprise Operating Guide
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#e6edf3', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                How Companies &amp; CTOs Use Universal API
              </h2>
              <p style={{ color: '#8b949e', fontSize: '1rem', maxWidth: '680px', margin: '0 auto 48px', lineHeight: '1.6' }}>
                Follow this step-by-step workflow to connect your company's CRM platforms, submit platform User IDs into the encrypted OAuth vault, and track team progress inside the CTO ERP System.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', textAlign: 'left' }}>
                {/* Step 1 */}
                <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(31,111,235,0.15)', border: '1px solid rgba(31,111,235,0.3)', color: '#58a6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem', marginBottom: '18px' }}>1</div>
                  <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: '0 0 10px' }}>Workspace &amp; Role Setup</h3>
                  <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                    Register your organization workspace. Assign precise roles (CTO, CEO, Admin, Senior Developer, Client, Support) to enforce permission boundaries.
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem', marginBottom: '18px' }}>2</div>
                  <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: '0 0 10px' }}>Select Platform &amp; Submit User ID</h3>
                  <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                    In the Integration Marketplace, select CRM providers (HubSpot, Salesforce, Pipedrive, Zoho, Zapier). The CTO submits platform User IDs and API credentials into the secure vault.
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,140,66,0.15)', border: '1px solid rgba(255,140,66,0.3)', color: '#ff8c42', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem', marginBottom: '18px' }}>3</div>
                  <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: '0 0 10px' }}>Declarative Normalization &amp; Sync</h3>
                  <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                    The normalization engine automatically maps raw provider JSON payloads into unified, compliant schemas for Contacts, Companies, and Deals.
                  </p>
                </div>

                {/* Step 4 */}
                <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(46,213,115,0.15)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem', marginBottom: '18px' }}>4</div>
                  <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: '0 0 10px' }}>CTO Dynamic ERP &amp; Progress Track</h3>
                  <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                    The CTO tracks company performance index, engineer sprint velocity by people, client contract deliverables, and cloud connector cost allocations in real-time.
                  </p>
                </div>
              </div>

              {/* Executive Leadership & Company Head Value proposition */}
              <div style={{ marginTop: '48px', background: 'linear-gradient(135deg, rgba(31,111,235,0.06), rgba(139,92,246,0.06))', border: '1px solid rgba(56,139,253,0.25)', borderRadius: '16px', padding: '32px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ background: 'rgba(56,139,253,0.15)', color: '#58a6ff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>👑 Executive Leadership Guide</span>
                  <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.25rem', fontWeight: '800' }}>Platform Facilities &amp; Business Benefits for Company Heads</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#58a6ff', fontSize: '0.92rem', fontWeight: '700' }}>📊 Unified Cross-Platform Visibility</h4>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                      Eliminate data silos across HubSpot, Salesforce, Pipedrive, and Zoho. Company heads view unified revenue deals, customer contacts, and operational metrics in a single pane of glass.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#a78bfa', fontSize: '0.92rem', fontWeight: '700' }}>🛡️ Zero-Trust Enterprise Security</h4>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                      All platform credentials and OAuth secrets are locked in AES-256 encrypted vaults. Multi-tenant RBAC boundaries prevent unauthorized cross-platform data leaks.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#2ed573', fontSize: '0.92rem', fontWeight: '700' }}>📈 CTO Dynamic ERP Performance Tracker</h4>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                      Monitor engineering sprint progress, developer team output, client milestone approvals, and connector node costs in real-time.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#ff8c42', fontSize: '0.92rem', fontWeight: '700' }}>💰 Reduced Integration Overhead</h4>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                      Save hundreds of engineering hours by replacing custom 3rd-party API code with Universal API’s zero-maintenance single integration endpoint.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Normalization Live Interactive Simulator */}
          <section id="simulator" style={{ maxWidth: '1100px', margin: '80px auto 0', padding: '0 40px', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#e6edf3', margin: '0 0 12px', letterSpacing: '-0.01em' }}>Interactive Normalizer Sandbox</h2>
              <p style={{ color: '#8b949e', fontSize: '0.95rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.5' }}>
                Type or edit custom payloads in the raw editor panel on the left to see our dynamic schema mapper normalize CRM data instantly.
              </p>
            </div>

            <div style={{
              background: '#090d13', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '16px',
              overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}>
              {/* Simulator Header Tabs */}
              <div style={{ display: 'flex', background: 'rgba(15,20,30,0.85)', borderBottom: '1px solid rgba(48,54,61,0.8)', padding: '12px 24px', gap: '8px', alignItems: 'center' }}>
                {Object.keys(simPayloads).map(p => {
                  const active = simTab === p;
                  return (
                    <button key={p} type="button" onClick={() => setSimTab(p)} style={{
                      padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(31,111,235,0.18)' : 'transparent',
                      color: active ? '#58a6ff' : '#8b949e', fontWeight: '800', fontSize: '0.8rem',
                      border: active ? '1px solid rgba(31,111,235,0.3)' : '1px solid transparent',
                      transition: 'all 0.15s'
                    }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)} Template
                    </button>
                  );
                })}
                <span style={{ marginLeft: 'auto', background: 'rgba(56,139,253,0.12)', color: '#58a6ff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', border: '1px solid rgba(56,139,253,0.2)' }}>
                  Interactive Normalizer Engine v2.0
                </span>
              </div>

              {/* Code Editor Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1px', background: 'rgba(48,54,61,0.5)' }}>
                {/* Left Panel: Editable Raw */}
                <div style={{ padding: '24px', background: '#090d13', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                      <span style={{ color: '#8b949e', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Edit Raw JSON Inbound Payload</span>
                    </div>
                    <button
                      onClick={() => handleCopy(simCustomRaw)}
                      style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
                    >
                      <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    value={simCustomRaw}
                    onChange={(e) => handleNormalizeInput(e.target.value)}
                    style={{
                      margin: 0, padding: '16px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.6)',
                      borderRadius: '10px', fontSize: '0.78rem', fontFamily: 'Courier New, monospace', color: '#c9d1d9',
                      lineHeight: '1.6', width: '100%', height: '300px', resize: 'none', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#1f6feb'; e.currentTarget.style.boxShadow = '0 0 10px rgba(31,111,235,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(48,54,61,0.6)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <div style={{ marginTop: '12px', fontSize: '0.7rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={12} color="#1f6feb" /> Edit above fields to trigger real-time auto-mapping normalizer.
                  </div>
                </div>

                {/* Right Panel: Mapped Output */}
                <div style={{ padding: '24px', background: '#090d13', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                      <span style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Mapped Outbound Schema (Compliant Output)</span>
                    </div>
                    <button
                      onClick={() => handleCopy(simNormalized)}
                      style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
                    >
                      <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre style={{
                    margin: 0, padding: '16px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.6)',
                    borderRadius: '10px', overflowY: 'auto', fontSize: '0.78rem', fontFamily: 'Courier New, monospace', color: '#a78bfa',
                    lineHeight: '1.6', height: '300px', boxSizing: 'border-box'
                  }}>{simNormalized}</pre>
                  <div style={{ marginTop: '12px', fontSize: '0.7rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} color="#2ed573" /> Active maps: contacts, companies, deals.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" style={{ maxWidth: '1280px', margin: '90px auto 0', padding: '0 40px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div style={{
                background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
                padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(31,111,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(31,111,235,0.2)' }}>
                  <Shield size={20} color="#58a6ff" />
                </div>
                <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Tenant-Level Isolation</h3>
                <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                  Each organization is completely isolated. Data filters apply strict database-level boundaries, protecting client records from cross-leakage.
                </p>
              </div>

              <div style={{
                background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
                padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Cpu size={20} color="#a78bfa" />
                </div>
                <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Granular RBAC Middlewares</h3>
                <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                  Supports roles from CTO to Intern. API request scoping automatically maps feature lists based on user capabilities.
                </p>
              </div>

              <div style={{
                background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
                padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(38,184,96,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(38,184,96,0.2)' }}>
                  <Lock size={20} color="#2ed573" />
                </div>
                <h3 style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Centralized OAuth Vault</h3>
                <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                  AES-256 encrypted storage of OAuth credentials. Automated token rotation guarantees secure synchronization processes.
                </p>
              </div>
            </div>
          </section>

          {/* Live Activity Logs Shell Terminal */}
          <section style={{ maxWidth: '1100px', margin: '80px auto 0', padding: '0 40px', position: 'relative', zIndex: 2 }}>
            <div style={{
              background: '#05070a', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '16px',
              padding: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.65)', overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(48,54,61,0.4)', paddingBottom: '12px', marginBottom: '16px' }}>
                <Terminal size={18} color="#2ed573" />
                <span style={{ color: '#e6edf3', fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Live Gateway Event Stream (Mock Webhooks & Mapping Traces)</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ed573', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ color: '#8b949e', fontSize: '0.65rem', fontWeight: '700' }}>ONLINE</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'Courier New, monospace', fontSize: '0.78rem' }}>
                {liveLogs.map((logLine, idx) => {
                  const isSuccess = logLine.includes('SUCCESS');
                  const isWarn = logLine.includes('WARNING');
                  const color = isSuccess ? '#2ed573' : isWarn ? '#ff8c42' : '#58a6ff';
                  return (
                    <div key={idx} style={{ color: '#c9d1d9', opacity: Math.max(0.3, 1 - idx * 0.15), display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#8b949e' }}>&gt;</span>
                      <span>
                        {logLine.split(' ')[0]} <span style={{ color, fontWeight: '700' }}>{logLine.split(' ')[1]}</span> {logLine.split(' ').slice(2).join(' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Beautiful Glassmorphic Footer */}
          <footer style={{
            maxWidth: '1280px', margin: '120px auto 0', padding: '60px 40px 40px',
            borderTop: '1px solid rgba(48,54,61,0.5)', position: 'relative', zIndex: 2
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '40px', marginBottom: '60px', textAlign: 'left'
            }}>
              {/* Brand Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 10px rgba(31,111,235,0.3)' }}>
                    <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ color: '#e6edf3', fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.01em' }}>Universal API</span>
                </div>
                <p style={{ color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.6', margin: 0 }}>
                  A secure, enterprise-grade unified gateway for standardizing SaaS and CRM integrations. Write once, query always.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Product</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>API Gateway</a></li>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Scoping Engine</a></li>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Sync Webhooks</a></li>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Security Vault</a></li>
                </ul>
              </div>

              {/* Integrations Column */}
              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Native CRM Core</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>HubSpot Connector</a></li>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Salesforce adapter</a></li>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Pipedrive API</a></li>
                  <li><a href="#" style={{ color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>Developer Sandbox</a></li>
                </ul>
              </div>

              {/* Multi-Tenant Integrated Connectors */}
              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Integrations Suite</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <li><a href="#" style={{ color: '#58a6ff', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#58a6ff'}>Zoho CRM & Books</a></li>
                  <li><a href="#" style={{ color: '#58a6ff', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#58a6ff'}>Zapier Automated Flows</a></li>
                  <li><a href="#" style={{ color: '#58a6ff', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#58a6ff'}>Merge.dev Unified API</a></li>
                  <li><a href="#" style={{ color: '#58a6ff', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'} onMouseLeave={e => e.currentTarget.style.color = '#58a6ff'}>Unified.to Integration</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              borderTop: '1px solid rgba(48,54,61,0.3)', paddingTop: '30px', gap: '20px'
            }}>
              <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>
                © 2026 Universal CRM Gateway Corporation. All rights reserved.
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#58a6ff', fontSize: '0.74rem', border: '1px solid rgba(88,166,255,0.2)', padding: '4px 8px', borderRadius: '6px', background: 'rgba(88,166,255,0.05)' }}>
                  <Shield size={12} color="#58a6ff" />
                  AES-256-GCM Encrypted
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2ed573', fontSize: '0.74rem', border: '1px solid rgba(46,213,115,0.2)', padding: '4px 8px', borderRadius: '6px', background: 'rgba(46,213,115,0.05)' }}>
                  <Server size={12} color="#2ed573" />
                  Gateway Status: Stable
                </span>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    // AUTHENTICATION SCREEN - DYNAMIC & INFORMATIVE SPLIT LAYOUT
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'stretch',
        background: '#05070a',
        fontFamily: "'Inter', -apple-system, sans-serif",
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Left Side: Simplified Clean Panel */}
        <div style={{
          flex: '1', background: 'radial-gradient(ellipse at 70% 30%, #0d1c32 0%, #05070a 100%)',
          borderRight: '1px solid rgba(48,54,61,0.7)', padding: '60px 48px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          position: 'relative', overflow: 'hidden', textAlign: 'center'
        }}>
          {/* Decorative background blur element */}
          <div style={{ position: 'absolute', top: '15%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(31,111,235,0.08) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />

          {/* Back button pinned to top-left */}
          <button type="button" onClick={() => setShowAuth(false)} style={{
            position: 'absolute', top: '40px', left: '40px',
            background: 'rgba(33,38,45,0.3)', border: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', fontSize: '0.8rem', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', transition: 'all 0.15s', zIndex: 10
          }} onMouseEnter={e => { e.currentTarget.style.color = '#e6edf3'; e.currentTarget.style.background = 'rgba(33,38,45,0.6)'; e.currentTarget.style.borderColor = '#8b949e'; }} onMouseLeave={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.background = 'rgba(33,38,45,0.3)'; e.currentTarget.style.borderColor = 'rgba(48,54,61,0.5)'; }}>
            ← Back
          </button>

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '440px' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 0 30px rgba(31,111,235,0.35)', border: '1px solid rgba(31,111,235,0.2)', background: 'rgba(15,20,30,0.85)', padding: '10px', boxSizing: 'border-box' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{ color: '#e6edf3', fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em', margin: '10px 0 0', background: 'linear-gradient(to right, #ffffff, #8b949e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Universal API
            </h1>
            <p style={{ color: '#8b949e', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              The Unified Gateway for SaaS Integrations. Standardize, map, and query customer contacts, companies, and deals through a single robust, compliant API.
            </p>
          </div>

          <div style={{ position: 'absolute', bottom: '40px', color: '#8b949e', fontSize: '0.74rem', zIndex: 2 }}>
            © 2026 Universal CRM Gateway Corporation. All rights reserved.
          </div>
        </div>

        {/* Right Side: Form with Glassmorphism */}
        <div style={{
          flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px', boxSizing: 'border-box', background: '#07090e'
        }}>
          <div style={{
            width: '100%', maxWidth: registering ? '460px' : '400px', background: 'rgba(15,20,30,0.85)',
            backdropFilter: 'blur(30px)', border: '1px solid rgba(48,54,61,0.8)',
            borderRadius: '20px', padding: '40px', boxSizing: 'border-box',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '6px' }}>
              <h1 style={{ color: '#e6edf3', fontSize: '1.45rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>
                {forgotMode ? 'Reset Password' : registering ? 'Create Workspace' : 'Sign In to Console'}
              </h1>
              <p style={{ color: '#8b949e', fontSize: '0.82rem', margin: 0, textAlign: 'center', lineHeight: '1.4' }}>
                {forgotMode ? (forgotStep === 1 ? 'Request verification code to authorize password reset' : 'Enter the code and specify your new credentials') : registering ? 'Register your company and select your development role scope' : 'Enter your credential boundaries to fetch workspace permissions'}
              </p>
            </div>

            {/* Click-to-Autofill Quick demo login details inside the form container */}
            {!registering && !forgotMode && (
              <div
                onClick={handleQuickFill}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', background: 'rgba(31,111,235,0.08)',
                  border: '1px solid rgba(31,111,235,0.25)', borderRadius: '8px',
                  fontSize: '0.78rem', color: '#58a6ff', cursor: 'pointer',
                  marginBottom: '20px', width: '100%', boxSizing: 'border-box',
                  transition: 'all 0.15s', justifyContent: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(31,111,235,0.15)'; e.currentTarget.style.borderColor = '#58a6ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(31,111,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(31,111,235,0.25)'; }}
              >
                <Zap size={13} color="#58a6ff" />
                <span>Demo Admin? <strong>Click to Autofill Credentials</strong></span>
              </div>
            )}

            {forgotMode ? (
              forgotStep === 1 ? (
                <form onSubmit={handleRequestCode}>
                  <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="forgot-email" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Email</label>
                    <input id="forgot-email" type="email" placeholder="you@company.com"
                      value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      required style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                  </div>

                  {successMsg && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(46,160,67,0.1)', border: '1px solid rgba(46,160,67,0.2)' }}>
                      <span style={{ color: '#3fb950', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '600' }}>{successMsg}</span>
                    </div>
                  )}

                  {loginError && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.2)' }}>
                      <span style={{ color: '#f85149', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '600' }}>{loginError}</span>
                    </div>
                  )}

                  <button type="submit" disabled={forgotLoading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(31,111,235,0.2)', transition: 'transform 0.1s' }}>
                    {forgotLoading ? 'Processing...' : 'Send Verification Code'}
                  </button>

                  <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#8b949e' }}>
                    Remember your password?{' '}
                    <span onClick={() => { setForgotMode(false); setLoginError(''); setSuccessMsg(''); }} style={{ color: '#58a6ff', cursor: 'pointer', fontWeight: '600' }}>
                      Back to Login
                    </span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="reset-code" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Code</label>
                    <input id="reset-code" type="text" placeholder="Enter 6-digit code received via email" maxLength={6}
                      value={forgotCode} onChange={e => setForgotCode(e.target.value)}
                      required style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s', letterSpacing: '2px', textAlign: 'center', fontWeight: '800' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="reset-password" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                    <input id="reset-password" type="password" placeholder="Enter new password"
                      value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)}
                      required style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="reset-confirm-password" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm New Password</label>
                    <input id="reset-confirm-password" type="password" placeholder="Confirm new password"
                      value={forgotConfirmPassword} onChange={e => setForgotConfirmPassword(e.target.value)}
                      required style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                  </div>

                  {successMsg && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(46,160,67,0.1)', border: '1px solid rgba(46,160,67,0.2)' }}>
                      <span style={{ color: '#3fb950', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '600' }}>{successMsg}</span>
                    </div>
                  )}

                  {loginError && (
                    <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.2)' }}>
                      <span style={{ color: '#f85149', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '600' }}>{loginError}</span>
                    </div>
                  )}

                  <button type="submit" disabled={forgotLoading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(31,111,235,0.2)', transition: 'transform 0.1s' }}>
                    {forgotLoading ? 'Resetting...' : 'Verify Code & Update Password'}
                  </button>

                  <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#8b949e' }}>
                    Didn't receive code?{' '}
                    <span onClick={() => { setForgotStep(1); setLoginError(''); setSuccessMsg(''); }} style={{ color: '#58a6ff', cursor: 'pointer', fontWeight: '600' }}>
                      Resend Code / Change Email
                    </span>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={registering ? handleRegister : handleLogin}>
                {registering && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label htmlFor="login-name" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                      <input id="login-name" type="text" placeholder="John Doe"
                        value={loginForm.name} onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
                        required style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label htmlFor="login-org" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company / Organization Name</label>
                      <input id="login-org" type="text" placeholder="Acme Corp"
                        value={loginForm.organizationName} onChange={e => setLoginForm({ ...loginForm, organizationName: e.target.value })}
                        required={loginForm.role === 'CTO' || loginForm.role === 'Admin'}
                        style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="login-email" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Email</label>
                  <input id="login-email" type="email" placeholder="you@company.com"
                    value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    required style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                </div>

                <div style={{ marginBottom: registering ? '18px' : '22px', position: 'relative' }}>
                  <label htmlFor="login-password" style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="login-password" type={showPwd ? 'text' : 'password'} placeholder="••••••••••"
                      value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      required style={{ width: '100%', padding: '12px 40px 12px 16px', boxSizing: 'border-box', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'} />
                    <EyeToggle show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
                  </div>
                  {!registering && (
                    <div style={{ textAlign: 'right', marginTop: '6px' }}>
                      <span onClick={() => { setForgotMode(true); setForgotStep(1); setForgotEmail(loginForm.email); setLoginError(''); setSuccessMsg(''); }} style={{ color: '#58a6ff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '500' }}>Forgot Password?</span>
                    </div>
                  )}
                </div>

                {registering && (
                  <div style={{ marginBottom: '22px' }}>
                    <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Scope</label>
                    <select value={loginForm.role} onChange={e => { setLoginForm({ ...loginForm, role: e.target.value }); setPreviewRole(e.target.value); }}
                      style={{ width: '100%', padding: '12px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.84rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#1f6feb'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(48,54,61,0.8)'}>
                      {['CTO', 'Admin', 'Regional Head', 'Senior Developer', 'Support Engineer', 'Employee', 'Intern'].map(r => <option key={r} value={r} style={{ background: '#0f141c', color: '#e6edf3' }}>{r}</option>)}
                    </select>
                  </div>
                )}

                {successMsg && (
                  <div style={{
                    marginBottom: '16px', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(46,160,67,0.1)', border: '1px solid rgba(46,160,67,0.2)',
                  }}>
                    <span style={{ color: '#3fb950', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '600' }}>{successMsg}</span>
                  </div>
                )}

                {loginError && (
                  <div style={{
                    marginBottom: '16px', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.2)',
                  }}>
                    <span style={{ color: '#f85149', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: '600' }}>{loginError}</span>
                  </div>
                )}

                <button id="login-submit" type="submit" disabled={loginLoading} style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
                  color: 'white', fontSize: '0.9rem', fontWeight: '800', cursor: loginLoading ? 'wait' : 'pointer',
                  boxShadow: '0 8px 24px rgba(31,111,235,0.35)', transition: 'all 0.2s',
                }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(139,92,246,0.45)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(31,111,235,0.35)'; }}>
                  {loginLoading ? 'Authenticating...' : registering ? 'Register Workspace' : 'Access Console'}
                </button>

                <button type="button" onClick={() => { setRegistering(r => !r); setForgotMode(false); setLoginError(''); setSuccessMsg(''); }} style={{
                  background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.78rem', fontWeight: '600',
                  cursor: 'pointer', display: 'block', margin: '18px auto 0', textDecoration: 'none', transition: 'color 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'} onMouseLeave={e => e.currentTarget.style.color = '#58a6ff'}>
                  {registering ? 'Already registered? Sign in' : "Don't have an enterprise workspace? Register"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // PENDING APPROVAL BLOCKER SCREEN
  // ══════════════════════════════════════
  if (currentUser?.status === 'PENDING') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #0d1b2e 0%, #07090e 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif", padding: '24px'
      }}>
        <div style={{
          width: '100%', maxWidth: '460px', background: 'rgba(13,17,23,0.75)',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(48,54,61,0.7)',
          borderRadius: '16px', padding: '40px', boxSizing: 'border-box',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)', textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Lock size={28} color="#d29922" />
          </div>

          <h2 style={{ color: '#e6edf3', fontSize: '1.25rem', fontWeight: '800', margin: '0 0 10px' }}>Workspace Approval Pending</h2>

          <p style={{ color: '#8b949e', fontSize: '0.84rem', lineHeight: '1.6', margin: '0 0 24px' }}>
            Thanks for registering, <strong>{currentUser.name}</strong>! Your account under domain <code>{currentUser.email.split('@')[1]}</code> is pending approval from your organization's CTO or verified administrator.
          </p>

          <div style={{
            padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(48,54,61,0.3)',
            borderRadius: '8px', fontSize: '0.78rem', color: '#c9d1d9', marginBottom: '24px', textAlign: 'left'
          }}>
            <strong>Pending details:</strong>
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', color: '#8b949e' }}>
              <span>• Role: {currentUser.role}</span>
              <span>• Department: {currentUser.department}</span>
              <span>• Status: Awaiting Verification</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCheckStatus} style={{ flex: 1, padding: '10px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
              Check Status
            </button>
            <button onClick={handleLogout} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(248,81,73,0.3)', color: '#f85149', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // CORE ENTERPRISE NAVIGATION DRAWER SETUP
  // ══════════════════════════════════════
  const userPermissions = currentUser?.permissions || [];
  const hasAccess = (perm) => currentUser?.role === 'CTO' || currentUser?.role === 'Admin' || userPermissions.includes(perm);

  const getFilteredContacts = () => {
    if (!currentUser) return [];
    const role = currentUser.role;
    if (role === 'CTO' || role === 'Admin' || role === 'Support Engineer') {
      return contacts;
    }
    if (role === 'Regional Head') {
      return contacts.filter(c => c.provider === 'hubspot' || c.provider === 'salesforce');
    }
    if (role === 'Senior Developer' || role === 'Employee' || role === 'Intern') {
      return contacts.filter(c => c.provider === 'mock');
    }
    return [];
  };

  const getFilteredCompanies = () => {
    if (!currentUser) return [];
    const role = currentUser.role;
    if (role === 'CTO' || role === 'Admin' || role === 'Support Engineer') {
      return companies;
    }
    if (role === 'Regional Head') {
      return companies.filter(c => c.provider === 'hubspot' || c.provider === 'salesforce');
    }
    if (role === 'Senior Developer' || role === 'Employee' || role === 'Intern') {
      return companies.filter(c => c.provider === 'mock');
    }
    return [];
  };

  const getConsoleName = (role) => {
    switch (role) {
      case 'CTO': return 'Universal CRM Gateway (CTO Console)';
      case 'Admin': return 'Compliance Vault (Admin Console)';
      case 'Regional Head': return 'Regional Latency Monitor (Regional Head)';
      case 'Senior Developer': return 'SDK Developer Portal (Senior Developer)';
      case 'Support Engineer': return 'Diagnostic Hub (Support Console)';
      case 'Employee': return 'Employee Dashboard';
      case 'Intern': return 'Developer Documentation (Intern)';
      default: return 'Universal API';
    }
  };

  const getTabsForRole = (role) => {
    const allTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
      { id: 'cto-erp', label: 'CTO ERP Console', icon: <Layers size={15} /> },
      { id: 'doc-parser', label: 'AI Document Parser', icon: <FileText size={15} /> },
      { id: 'contacts', label: 'Contacts', icon: <User size={15} />, count: getFilteredContacts().length },
      { id: 'companies', label: 'Companies', icon: <Building2 size={15} />, count: getFilteredCompanies().length },
      { id: 'integrations', label: 'Integrations', icon: <Activity size={15} /> },
      { id: 'projects', label: 'Workspace Projects', icon: <Briefcase size={15} />, count: projects.length },
      { id: 'feature-matrix', label: 'Feature Matrix', icon: <Grid size={15} /> },
      { id: 'api-playground', label: 'API Playground', icon: <Play size={15} /> },
      { id: 'flow', label: 'End-to-End Flow', icon: <GitMerge size={15} /> },
      { id: 'architecture', label: 'Architecture', icon: <Cpu size={15} /> },
      { id: 'explorer', label: 'Normalization Explorer', icon: <Compass size={15} /> },
      { id: 'challenges', label: 'Technical Challenges', icon: <HelpCircle size={15} /> },
      { id: 'dx', label: 'Developer Experience', icon: <Code size={15} /> },
      { id: 'roadmap', label: 'Future Roadmap', icon: <Map size={15} /> },
      { id: 'team', label: 'Team & Ownership', icon: <Users size={15} /> },
      { id: 'enterprise', label: 'Enterprise Specs', icon: <Shield size={15} /> },
      { id: 'docs', label: 'Documentation', icon: <FileText size={15} /> },
      { id: 'logs', label: 'Request Logs', icon: <Terminal size={15} /> },
      { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
      { id: 'erp-inventory', label: 'ERP: Inventory', icon: <Layers size={15} /> },
      { id: 'erp-finance', label: 'ERP: Finance', icon: <BarChart3 size={15} /> },
      { id: 'erp-hr', label: 'ERP: Human Resources', icon: <Users size={15} /> },
      { id: 'erp-orders', label: 'ERP: Order Queue', icon: <Briefcase size={15} /> },
    ];

    const savedRoleTabIds = roleTabConfigs[role || 'Employee'] || ['dashboard', 'docs'];
    const allowedTabIds = Array.from(new Set([...savedRoleTabIds, 'doc-parser']));
    const filtered = allTabs.filter(t => allowedTabIds.includes(t.id));

    if (role === 'CTO' || role === 'Admin') {
      filtered.push({ id: 'config', label: 'Platform Config', icon: <Settings size={15} /> });
    }

    return filtered;
  };

  const TABS = getTabsForRole(currentUser?.role);

  const renderSidebarTab = (tab) => {
    if (tab.permission && !hasAccess(tab.permission)) return null;
    const active = activeTab === tab.id;
    return (
      <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
        style={{
          padding: '10px 14px', borderRadius: '8px', border: 'none', textAlign: 'left',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
          background: active ? 'linear-gradient(135deg, #1f6feb, #8b5cf6)' : 'transparent',
          color: active ? 'white' : '#8b949e', fontWeight: active ? '700' : '500',
          fontSize: '0.85rem', transition: 'all 0.15s', width: '100%'
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {tab.icon}
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
        {tab.count > 0 && (
          <span style={{
            padding: '1px 5px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700',
            background: active ? 'rgba(255,255,255,0.2)' : 'rgba(48,54,61,0.5)',
            color: active ? 'white' : '#8b949e',
          }}>{tab.count}</span>
        )}
      </button>
    );
  };

  const connectedCrmCount = providers.filter(p => p.status === 'Connected').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 15% 10%, #0d1b2e 0%, #0d1117 50%, #0a0e14 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(31,111,235,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* ══════════════════════════════════════
          TOP NAVBAR
         ══════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(48,54,61,0.6)', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{
            background: 'none', color: '#8b949e', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px',
            transition: 'background 0.2s', border: '1px solid rgba(48,54,61,0.5)'
          }}>
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '6px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ color: '#e6edf3', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '-0.01em' }}>{getConsoleName(currentUser?.role)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.74rem' }}>
            <span style={{ color: '#e6edf3', fontWeight: '700' }}>{currentUser?.name}</span>
            <span style={{ color: '#8b949e' }}>{currentUser?.role} ({currentUser?.department})</span>
          </div>

          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid rgba(248,81,73,0.3)',
            color: '#f85149', fontSize: '0.8rem', padding: '6px 14px', borderRadius: '6px',
            cursor: 'pointer', transition: 'all 0.15s', fontWeight: '600'
          }}>
            Logout
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          SLIDING SIDEBAR NAVIGATION DRAWER
         ══════════════════════════════════════ */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10,14,20,0.6)', backdropFilter: 'blur(4px)', zIndex: 999,
        }} />
      )}

      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '300px',
        background: '#0d1117', borderRight: '1px solid rgba(48,54,61,0.8)', zIndex: 1000,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box',
        boxShadow: isSidebarOpen ? '24px 0 80px rgba(0,0,0,0.8)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={22} color="#1f6feb" />
            <span style={{ color: '#e6edf3', fontSize: '0.95rem', fontWeight: '700' }}>Workspace Navigation</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          <div>
            <h5 style={{ color: '#484f58', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 10px' }}>Core Operations</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {TABS.filter(t => ['dashboard', 'doc-parser', 'contacts', 'companies', 'integrations', 'projects', 'logs', 'analytics', 'config'].includes(t.id)).map(renderSidebarTab)}
            </div>
          </div>
          <div>
            <h5 style={{ color: '#484f58', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 10px' }}>SaaS Console</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {TABS.filter(t => ['feature-matrix', 'api-playground', 'explorer', 'flow'].includes(t.id)).map(renderSidebarTab)}
            </div>
          </div>
          <div>
            <h5 style={{ color: '#484f58', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 10px' }}>Resources & Specs</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {TABS.filter(t => ['architecture', 'challenges', 'dx', 'roadmap', 'team', 'enterprise', 'docs'].includes(t.id)).map(renderSidebarTab)}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN BODY LAYOUT
         ══════════════════════════════════════ */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 32px 64px', position: 'relative', zIndex: 10 }}>

        {/* Dashboard Org Header */}
        <div style={{
          background: 'rgba(22,27,34,0.4)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex',
          flexDirection: 'column', gap: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(31,111,235,0.1)', border: '1px solid rgba(31,111,235,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Server size={17} color="#58a6ff" />
              </div>

              <div>
                <h2 style={{ margin: 0, color: '#e6edf3', fontSize: '1.05rem', fontWeight: '700' }}>
                  {activeTab === 'dashboard' && `${currentUser?.role} Console Dashboard`}
                  {activeTab === 'cto-erp' && 'CTO Dynamic ERP Console'}
                  {activeTab === 'doc-parser' && 'AI Enterprise Document Parser'}
                  {activeTab === 'contacts' && 'Unified Contacts'}
                  {activeTab === 'companies' && 'Unified Companies'}
                  {activeTab === 'integrations' && 'Integration Marketplace'}
                  {activeTab === 'projects' && 'Workspace Projects'}
                  {activeTab === 'feature-matrix' && 'Feature Matrix'}
                  {activeTab === 'api-playground' && 'API Playground'}
                  {activeTab === 'flow' && 'End-to-End Data Flow'}
                  {activeTab === 'architecture' && 'System Architecture'}
                  {activeTab === 'explorer' && 'API Normalization Explorer'}
                  {activeTab === 'challenges' && 'Technical Challenges & Resolutions'}
                  {activeTab === 'dx' && 'Developer Experience Portal'}
                  {activeTab === 'roadmap' && 'Future Product Roadmap'}
                  {activeTab === 'team' && 'Team & Module Ownership'}
                  {activeTab === 'enterprise' && 'Enterprise Readiness Specs'}
                  {activeTab === 'docs' && 'Project Documentation'}
                  {activeTab === 'logs' && 'API Request Logs'}
                  {activeTab === 'analytics' && 'System Analytics'}
                  {activeTab === 'config' && 'Platform Scoping & RBAC Policy'}
                </h2>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', marginTop: '2px' }}>
                  {activeTab === 'dashboard' && `Logged in as ${currentUser?.name}. Isolated scope: ${currentUser?.department} Department.`}
                  {activeTab === 'cto-erp' && 'Executive progress tracking of company velocity by people (team/workloads) and clients (CRM/SLA/milestones).'}
                  {activeTab === 'doc-parser' && 'Upload, parse, and extract structured entities, financial SLAs, tables, and terms from company files.'}
                  {activeTab === 'contacts' && 'Normalized contacts filtered strictly by organization boundary.'}
                  {activeTab === 'companies' && 'Normalized companies filtered strictly by organization boundary.'}
                  {activeTab === 'integrations' && 'Centralized OAuth Vault marketplace for 3rd-party connectors.'}
                  {activeTab === 'projects' && 'Isolated project workspaces assigned to developers.'}
                  {activeTab === 'feature-matrix' && 'Pillars of the Universal API Platform: Build, Integrate, Test, and Automate.'}
                  {activeTab === 'api-playground' && 'Postman-like request builder sandbox.'}
                  {activeTab === 'flow' && 'Visual mapping trace explaining real-time request lifecycle.'}
                  {activeTab === 'architecture' && 'Structural flow-topology of the Gateway, Sync Paths, and Async Workers.'}
                  {activeTab === 'explorer' && 'Demonstrating HubSpot, Salesforce, Pipedrive API schema vs. Normalized response.'}
                  {activeTab === 'challenges' && 'Hard technical challenges faced in multi-tenant environments.'}
                  {activeTab === 'dx' && 'SDK code examples and Quick Start reference guidelines.'}
                  {activeTab === 'roadmap' && 'Future vertical expansion roadmap specifications.'}
                  {activeTab === 'team' && 'Team roster, project responsibilities, and module owners.'}
                  {activeTab === 'enterprise' && 'Enterprise specifications metrics for security, isolation and compliance.'}
                  {activeTab === 'docs' && 'Engineering wiki, project overview, and specifications guidelines.'}
                  {activeTab === 'logs' && 'Live feed of HTTP requests processed by the API gateway.'}
                  {activeTab === 'analytics' && 'System request volume, latency, and integration usage metrics.'}
                  {activeTab === 'config' && 'Configure custom feature tab and data scoping visibility policies.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignSelf: 'center' }}>
              {activeTab === 'companies' && (
                <button onClick={() => {
                  setIsCompanyAdderOpen(!isCompanyAdderOpen);
                  setCompanySearchQuery('');
                  setCompanyForm({ name: '', website: '', industry: '', size: '', provider: 'mock' });
                }} style={{
                  padding: '8px 14px', borderRadius: '8px',
                  border: '1px solid rgba(88,166,255,0.3)', background: 'rgba(31,111,235,0.1)',
                  color: '#58a6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s'
                }}>
                  {isCompanyAdderOpen ? <X size={13} /> : <Building2 size={13} />}
                  {isCompanyAdderOpen ? 'Close Adder' : '＋ Add Company'}
                </button>
              )}

              <button id="refresh-btn" onClick={fetchData} disabled={loading} style={{
                padding: '8px 14px', borderRadius: '8px',
                border: '1px solid rgba(48,54,61,0.6)', background: 'rgba(33,38,45,0.5)',
                color: '#c9d1d9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.15s'
              }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Sync Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Backend down banner */}
        {backendDown && (
          <div style={{
            marginBottom: '24px', padding: '14px 18px', borderRadius: '12px',
            background: 'rgba(248,81,73,0.07)', border: '1px solid rgba(248,81,73,0.25)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <WifiOff size={16} color="#f85149" />
            <span style={{ color: '#f85149', fontSize: '0.86rem', lineHeight: 1.5 }}>
              Backend is offline. Open a terminal and run `npm run dev` to start dev servers.
            </span>
          </div>
        )}



        {/* ══════════════════════════════════════
            TAB PANEL RENDER SWITCH
           ══════════════════════════════════════ */}
        <div style={{
          background: 'rgba(13,17,23,0.3)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(48,54,61,0.5)', borderRadius: '16px',
          padding: '24px', minHeight: '400px', boxShadow: '0 12px 48px rgba(0,0,0,0.35)'
        }}>

          {loading && activeTab !== 'dashboard' && activeTab !== 'api-playground' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1f6feb" strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Synchronizing data…</span>
            </div>

          ) : fetchError && activeTab !== 'dashboard' && activeTab !== 'api-playground' ? (
            <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <AlertCircle size={22} color="#f85149" />
              <p style={{ color: '#8b949e', margin: 0, fontSize: '0.88rem' }}>{fetchError}</p>
              <button onClick={fetchData} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(248,81,73,0.3)', background: 'transparent', color: '#f85149', cursor: 'pointer', fontSize: '0.83rem', fontWeight: '600' }}>Try Again</button>
            </div>

          ) : activeTab === 'dashboard' ? (
            // ==========================================
            // 1. DYNAMIC DUAL-ROLES DASHBOARDS
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(31,111,235,0.04)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Scope role</span>
                  <h3 style={{ color: '#58a6ff', fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>{currentUser?.role}</h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Role-specific layouts enabled</span>
                </div>

                <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Company Workspace</span>
                  <h3 style={{ color: '#a78bfa', fontSize: '1.3rem', fontWeight: '800', margin: 0, textTransform: 'capitalize' }}>
                    {currentUser?.email.split('@')[1].split('.')[0]}
                  </h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Tenant Isolation Active</span>
                </div>

                <div style={{ background: 'rgba(38,184,96,0.04)', border: '1px solid rgba(38,184,96,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Integrations</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>{connectedCrmCount} Connected</h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Shared at organization scope</span>
                </div>

                <div style={{ background: 'rgba(255,193,7,0.04)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>User Status</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: 0 }}>{currentUser?.status}</h3>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Verified account</span>
                </div>
              </div>

              {/* Dynamic content segments based on role */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

                {/* A. CTO / Admin approvals panel */}
                {(currentUser?.role === 'CTO' || currentUser?.role === 'Admin') && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px', gridColumn: 'span 2' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={15} color="#58a6ff" /> Workspace Approvals Console ({approvals.length} pending)
                    </h4>

                    {approvals.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.4)', textAlign: 'left', color: '#8b949e' }}>
                              <th style={{ padding: '8px 12px' }}>Requester</th>
                              <th style={{ padding: '8px 12px' }}>Action</th>
                              <th style={{ padding: '8px 12px' }}>Target ID</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {approvals.map((reqItem) => (
                              <tr key={reqItem.id} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#e6edf3', fontWeight: '700' }}>{reqItem.requester?.name || 'Unknown'}</span>
                                    <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>{reqItem.requester?.email}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#a78bfa' }}>{reqItem.action}</td>
                                <td style={{ padding: '12px', color: '#8b949e' }}>{reqItem.targetId || '—'}</td>
                                <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                  <button onClick={() => handleResolveApproval(reqItem.id, 'APPROVED')} style={{ padding: '4px 10px', background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.25)', color: '#2ed573', borderRadius: '4px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700' }}>Approve</button>
                                  <button onClick={() => handleResolveApproval(reqItem.id, 'REJECTED')} style={{ padding: '4px 10px', background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)', color: '#f85149', borderRadius: '4px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: '700' }}>Reject</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e', border: '1px dashed rgba(48,54,61,0.3)', borderRadius: '8px' }}>
                        No pending integration, credential rotation, or registration requests in the queue.
                      </div>
                    )}
                  </div>
                )}

                {/* B. Regional Head regional widgets */}
                {currentUser?.role === 'Regional Head' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Regional monitoring</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#8b949e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                        <span>US-East latency</span>
                        <strong style={{ color: '#2ed573' }}>12ms</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                        <span>EU-Central latency</span>
                        <strong style={{ color: '#2ed573' }}>48ms</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                        <span>AP-South latency</span>
                        <strong style={{ color: '#d29922' }}>112ms</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. Engineering Manager status widgets */}
                {currentUser?.role === 'Engineering Manager' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Deployments & Builds</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                      <div style={{ padding: '8px', borderLeft: '2px solid #58a6ff', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ color: '#e6edf3', fontWeight: '700', display: 'block' }}>Production build #v1.4.2</span>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Deployed successfully 2h ago</span>
                      </div>
                      <div style={{ padding: '8px', borderLeft: '2px solid #2ed573', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ color: '#e6edf3', fontWeight: '700', display: 'block' }}>Staging connector build</span>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>Completed unit tests successfully</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. Team Lead sprint board simulator */}
                {currentUser?.role === 'Team Lead' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Sprint Progress Velocity</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '100px', padding: '10px 0' }}>
                      <div style={{ flex: 1, height: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#8b949e' }}>W1</span></div>
                      <div style={{ flex: 1, height: '65%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#8b949e' }}>W2</span></div>
                      <div style={{ flex: 1, height: '90%', background: 'linear-gradient(to top, #1f6feb, #8b5cf6)', borderRadius: '3px', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#e6edf3', fontWeight: '700' }}>W3</span></div>
                    </div>
                  </div>
                )}

                {/* E. Developer active projects */}
                {(currentUser?.role === 'Developer' || currentUser?.role === 'Senior Developer') && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Projects ({projects.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projects.map((proj) => (
                        <div key={proj.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(48,54,61,0.3)', borderRadius: '6px' }}>
                          <span style={{ color: '#e6edf3', fontWeight: '700', fontSize: '0.82rem', display: 'block' }}>{proj.name}</span>
                          <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>{proj.description || 'No description provided'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* F. QA tests statuses */}
                {currentUser?.role === 'QA Engineer' && (
                  <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>QA Test Suites</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9d1d9' }}>
                        <span>Adapter transformation tests</span>
                        <strong style={{ color: '#3fb950' }}>100% Passed</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c9d1d9' }}>
                        <span>Token refresh concurrency locks</span>
                        <strong style={{ color: '#3fb950' }}>100% Passed</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* General operational stats */}
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Workspace status</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(7,9,14,0.3)', borderRadius: '8px', border: '1px solid rgba(48,54,61,0.3)' }}>
                      <span style={{ color: '#c9d1d9', fontSize: '0.82rem', fontWeight: '600' }}>Tenant Data Isolation</span>
                      <span style={{ color: '#3fb950', fontSize: '0.78rem', fontWeight: '700' }}>Strict</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(7,9,14,0.3)', borderRadius: '8px', border: '1px solid rgba(48,54,61,0.3)' }}>
                      <span style={{ color: '#c9d1d9', fontSize: '0.82rem', fontWeight: '600' }}>Department Scoping</span>
                      <span style={{ color: '#58a6ff', fontSize: '0.78rem', fontWeight: '700' }}>Active ({currentUser?.department})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'contacts' ? (
            // ==========================================
            // CONTACTS
            // ==========================================
            (() => {
              const filtered = getFilteredContacts();
              const isScoped = currentUser?.role !== 'CTO' && currentUser?.role !== 'Admin';
              return (
                <div>
                  {isScoped && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', background: 'rgba(56,139,253,0.08)',
                      border: '1px solid rgba(56,139,253,0.2)', borderRadius: '8px',
                      marginBottom: '20px', color: '#58a6ff', fontSize: '0.82rem'
                    }}>
                      <Info size={15} />
                      <span><strong>Role-Scoped Data:</strong> As a <strong>{currentUser?.role}</strong>, you only have access to company contacts under your role boundaries.</span>
                    </div>
                  )}
                  {filtered.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                            {['#', 'Name', 'Email', 'Phone', 'Job Title', 'Provider', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((c, i) => (
                            <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.15s' }}>
                              <td style={{ padding: '14px 20px', color: '#484f58', fontSize: '0.82rem', fontWeight: '600' }}>{i + 1}</td>
                              <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.85rem', fontWeight: '700' }}>{c.name}</td>
                              <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.84rem' }}>{c.email || '—'}</td>
                              <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.84rem' }}>{c.phone || '—'}</td>
                              <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.82rem' }}>{c.jobTitle || '—'}</td>
                              <td style={{ padding: '14px 20px' }}>
                                <ProviderBadge provider={c.provider} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <button onClick={() => handleDeleteContact(c.id, c.provider)}
                                  style={{
                                    background: 'transparent', border: 'none', color: '#f85149',
                                    cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,81,73,0.15)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  title="Remove from Workspace"
                                >
                                  <X size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e', fontSize: '0.88rem', background: 'rgba(22,27,34,0.1)', border: '1px dashed rgba(48,54,61,0.3)', borderRadius: '8px' }}>
                      No scoped contacts visible. (Your role may have restricted read access).
                    </div>
                  )}
                </div>
              );
            })()

          ) : activeTab === 'companies' ? (
            // ==========================================
            // COMPANIES
            // ==========================================
            (() => {
              const filtered = getFilteredCompanies();
              const isScoped = currentUser?.role !== 'CTO' && currentUser?.role !== 'Admin';
              return (
                <div>
                  {isScoped && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', background: 'rgba(56,139,253,0.08)',
                      border: '1px solid rgba(56,139,253,0.2)', borderRadius: '8px',
                      marginBottom: '20px', color: '#58a6ff', fontSize: '0.82rem'
                    }}>
                      <Info size={15} />
                      <span><strong>Role-Scoped Data:</strong> As a <strong>{currentUser?.role}</strong>, you only have access to company accounts under your role boundaries.</span>
                    </div>
                  )}

                  {isCompanyAdderOpen && (
                    <div style={{
                      background: 'rgba(33,38,45,0.4)', border: '1px solid rgba(48,54,61,0.8)',
                      borderRadius: '12px', padding: '20px', marginBottom: '24px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={15} color="#58a6ff" /> Add Company Registry
                      </h4>

                      {/* Autocomplete Dropdown Search */}
                      <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Search Global Companies</label>
                        <input
                          type="text"
                          placeholder="Search worldwide databases (e.g. Apple, Netflix, Spotify)..."
                          value={companySearchQuery}
                          onChange={e => setCompanySearchQuery(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 14px', background: 'rgba(7,9,14,0.6)',
                            border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px',
                            color: '#e6edf3', fontSize: '0.82rem', outline: 'none'
                          }}
                        />
                        {companySearchQuery.trim() && (
                          (() => {
                            const matches = WORLDWIDE_COMPANIES.filter(co =>
                              co.name.toLowerCase().includes(companySearchQuery.toLowerCase())
                            );
                            if (matches.length === 0) return null;
                            return (
                              <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: '#161b22', border: '1px solid rgba(48,54,61,0.9)',
                                borderRadius: '8px', zIndex: 10, marginTop: '4px',
                                maxHeight: '180px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                              }}>
                                {matches.map((co, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setCompanyForm({
                                        name: co.name,
                                        website: co.website,
                                        industry: co.industry,
                                        size: co.size,
                                        provider: 'mock'
                                      });
                                      setCompanySearchQuery('');
                                    }}
                                    style={{
                                      padding: '10px 14px', color: '#c9d1d9', fontSize: '0.8rem',
                                      cursor: 'pointer', borderBottom: idx < matches.length - 1 ? '1px solid rgba(48,54,61,0.3)' : 'none',
                                      display: 'flex', justifyContent: 'space-between', transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <span style={{ fontWeight: '600' }}>{co.name}</span>
                                    <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>{co.industry} • {co.size}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()
                        )}
                      </div>

                      {/* Add Form fields */}
                      <form onSubmit={handleAddCompany} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Company Name *</label>
                          <input
                            type="text" required
                            value={companyForm.name}
                            onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                            placeholder="Enter company name"
                            style={{
                              width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.4)',
                              border: '1px solid rgba(48,54,61,0.6)', borderRadius: '6px',
                              color: '#c9d1d9', fontSize: '0.8rem', outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Website URL</label>
                          <input
                            type="text"
                            value={companyForm.website}
                            onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })}
                            placeholder="https://example.com"
                            style={{
                              width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.4)',
                              border: '1px solid rgba(48,54,61,0.6)', borderRadius: '6px',
                              color: '#c9d1d9', fontSize: '0.8rem', outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Industry</label>
                          <input
                            type="text"
                            value={companyForm.industry}
                            onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })}
                            placeholder="e.g. Technology"
                            style={{
                              width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.4)',
                              border: '1px solid rgba(48,54,61,0.6)', borderRadius: '6px',
                              color: '#c9d1d9', fontSize: '0.8rem', outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Employees Size</label>
                          <input
                            type="text"
                            value={companyForm.size}
                            onChange={e => setCompanyForm({ ...companyForm, size: e.target.value })}
                            placeholder="e.g. 5,000+"
                            style={{
                              width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.4)',
                              border: '1px solid rgba(48,54,61,0.6)', borderRadius: '6px',
                              color: '#c9d1d9', fontSize: '0.8rem', outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Provider Adapter</label>
                          <select
                            value={companyForm.provider}
                            onChange={e => setCompanyForm({ ...companyForm, provider: e.target.value })}
                            style={{
                              width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.4)',
                              border: '1px solid rgba(48,54,61,0.6)', borderRadius: '6px',
                              color: '#c9d1d9', fontSize: '0.8rem', outline: 'none'
                            }}
                          >
                            <option value="mock" style={{ background: '#0f141c' }}>Mock Workspace (Default)</option>
                            <option value="hubspot" style={{ background: '#0f141c' }}>HubSpot</option>
                            <option value="salesforce" style={{ background: '#0f141c' }}>Salesforce</option>
                            <option value="pipedrive" style={{ background: '#0f141c' }}>Pipedrive</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button
                            type="submit" disabled={isAddingCompany}
                            style={{
                              width: '100%', padding: '9px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
                              color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700',
                              fontSize: '0.8rem', cursor: 'pointer', transition: 'opacity 0.15s'
                            }}
                          >
                            {isAddingCompany ? 'Adding...' : '💾 Save Company'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {filtered.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(13,17,23,0.4)' }}>
                            {['#', 'Company Name', 'Website', 'Industry', 'Employees', 'Provider', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(48,54,61,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((c, i) => (
                            <tr key={c.id || i} style={{ borderBottom: '1px solid rgba(48,54,61,0.3)' }}>
                              <td style={{ padding: '14px 20px', color: '#484f58', fontSize: '0.82rem', fontWeight: '600' }}>{i + 1}</td>
                              <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.85rem', fontWeight: '700' }}>{c.name}</td>
                              <td style={{ padding: '14px 20px', color: '#58a6ff', fontSize: '0.82rem' }}>
                                {c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>{c.website.replace('https://', '')} ↗</a> : '—'}
                              </td>
                              <td style={{ padding: '14px 20px', color: '#c9d1d9', fontSize: '0.82rem' }}>{c.industry || '—'}</td>
                              <td style={{ padding: '14px 20px', color: '#8b949e', fontSize: '0.82rem' }}>{c.size || '—'}</td>
                              <td style={{ padding: '14px 20px' }}>
                                <ProviderBadge provider={c.provider} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <button onClick={() => handleDeleteCompany(c.id, c.provider)}
                                  style={{
                                    background: 'transparent', border: 'none', color: '#f85149',
                                    cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', borderRadius: '6px', transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,81,73,0.15)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  title="Remove from Workspace"
                                >
                                  <X size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e', fontSize: '0.88rem', background: 'rgba(22,27,34,0.1)', border: '1px dashed rgba(48,54,61,0.3)', borderRadius: '8px' }}>
                      No scoped companies visible. (Your role may have restricted read access).
                    </div>
                  )}
                </div>
              );
            })()

          ) : activeTab === 'doc-parser' ? (
            <DocumentParser showToast={showToast} />

          ) : activeTab === 'projects' ? (
            // ==========================================
            // PROJECTS
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {projects.map((proj) => (
                  <div key={proj.id} style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.94rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={16} color="#58a6ff" /> {proj.name}
                    </h4>
                    <p style={{ margin: '8px 0 12px', color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.4' }}>{proj.description || 'No description provided.'}</p>
                    <span style={{ fontSize: '0.72rem', color: '#58a6ff', background: 'rgba(88,166,255,0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(88,166,255,0.2)' }}>Assigned to User</span>
                  </div>
                ))}
              </div>

              {/* Create project form (CTO or Admin) */}
              {(currentUser?.role === 'CTO' || currentUser?.role === 'Admin') && (
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px', maxWidth: '480px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Create new project</h4>
                  <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#8b949e', fontSize: '0.78rem', marginBottom: '6px' }}>Project Name</label>
                      <input type="text" value={newProjectName} placeholder="e.g. Finance CRM sync" onChange={e => setNewProjectName(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '6px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#8b949e', fontSize: '0.78rem', marginBottom: '6px' }}>Description</label>
                      <input type="text" value={newProjectDesc} placeholder="Project scope" onChange={e => setNewProjectDesc(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'rgba(7,9,14,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '6px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                    </div>
                    <button type="submit" style={{ padding: '8px 16px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start' }}>Create</button>
                  </form>
                </div>
              )}
            </div>

          ) : activeTab === 'integrations' ? (
            // ==========================================
            // INTEGRATION MARKETPLACE
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(48,54,61,0.3)', paddingBottom: '10px', overflowX: 'auto' }}>
                {[
                  { id: 'all', label: 'All Verticals' },
                  { id: 'crm', label: 'CRM Platforms' },
                  { id: 'communication', label: 'Communication' },
                  { id: 'email', label: 'Email' },
                  { id: 'calendar', label: 'Calendar' },
                  { id: 'payments', label: 'Payments' },
                  { id: 'commerce', label: 'E-Commerce' },
                ].map(cat => (
                  <button key={cat.id} onClick={() => setMarketFilter(cat.id)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem',
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                    background: marketFilter === cat.id ? 'rgba(31,111,235,0.15)' : 'transparent',
                    color: marketFilter === cat.id ? '#58a6ff' : '#8b949e',
                    border: marketFilter === cat.id ? '1px solid rgba(31,111,235,0.3)' : '1px solid transparent',
                  }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {[
                  // ── CRM PLATFORMS ──
                  { provider: 'hubspot', name: 'HubSpot', cat: 'crm', desc: 'Sync contacts, companies, deals and lifecycle pipelines.' },
                  { provider: 'salesforce', name: 'Salesforce', cat: 'crm', desc: 'Sync Accounts, Contacts, Opportunities and enterprise pipelines.' },
                  { provider: 'pipedrive', name: 'Pipedrive', cat: 'crm', desc: 'Sync Persons, Organizations, and Sales pipelines.' },
                  { provider: 'zoho', name: 'Zoho CRM & ERP', cat: 'crm', desc: 'Sync Zoho CRM contacts/deals and Zoho Books ERP inventory ledger.' },
                  { provider: 'merge', name: 'Merge.dev', cat: 'crm', desc: 'Unified API wrapper proxying CRM, HRIS and ATS systems.' },
                  { provider: 'unifiedto', name: 'Unified.to', cat: 'crm', desc: 'Unified API gateway integrating 150+ CRM and HR systems.' },

                  // ── COMMUNICATION ──
                  { provider: 'zapier', name: 'Zapier Webhooks', cat: 'communication', desc: 'Trigger automated Zapier flows on new contacts, deals and orders sync.' },
                  { provider: 'slack', name: 'Slack Enterprise', cat: 'communication', desc: 'Real-time team notification webhooks and CRM deal alerts.' },

                  // ── EMAIL ──
                  { provider: 'gmail', name: 'Gmail & Google Workspace', cat: 'email', desc: 'Sync customer email threads, outreach logs, and automated replies.' },
                  { provider: 'outlook_mail', name: 'Microsoft Outlook Email', cat: 'email', desc: 'Enterprise Office 365 email sync and thread normalization.' },

                  // ── CALENDAR ──
                  { provider: 'google_calendar', name: 'Google Calendar API', cat: 'calendar', desc: 'Sync meeting schedules, sales demos, and calendar availability.' },
                  { provider: 'outlook_calendar', name: 'Outlook 365 Calendar', cat: 'calendar', desc: 'Enterprise Microsoft 365 calendar scheduling & event logs.' },

                  // ── PAYMENTS ──
                  { provider: 'razorpay', name: 'Razorpay Gateway', cat: 'payments', desc: 'Sync merchant payments, UPI transfers, subscriptions, and payout ledgers.' },
                  { provider: 'paypal', name: 'PayPal Enterprise', cat: 'payments', desc: 'Global transaction processing, merchant payouts, and subscription ledgers.' },
                  { provider: 'online_banking', name: 'Corporate Net Banking', cat: 'payments', desc: 'Sync IMPS/NEFT/RTGS wire transfers and corporate bank statements.' },

                  // ── E-COMMERCE ──
                  { provider: 'shopify', name: 'Shopify Enterprise', cat: 'commerce', desc: 'Sync customer profiles, e-commerce orders, and product catalogs.' },
                  { provider: 'flipkart', name: 'Flipkart Marketplace API', cat: 'commerce', desc: 'Sync Flipkart merchant orders, customer purchases, and inventory ledgers.' },
                  { provider: 'amazon', name: 'Amazon Selling Partner', cat: 'commerce', desc: 'Merchant fulfillment orders, FBA tracking, and inventory ledgers.' },

                  // ── DEVELOPER SANDBOX ──
                  { provider: 'mock', name: 'Developer Sandbox (Mock)', cat: 'crm', desc: 'Simulated static CRM data for rapid testing without credentials.' }
                ]
                  .filter(item => marketFilter === 'all' || marketFilter === item.cat)
                  .map(item => {
                    const pInfo = providers.find(p => p.provider === item.provider) || { status: 'Not Connected' };
                    const isConnected = pInfo.status === 'Connected';
                    const isMock = item.provider === 'mock';

                    return (
                      <div key={item.provider} style={{ background: 'rgba(22,27,34,0.4)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', fontWeight: '700' }}>{item.name}</h4>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: isConnected ? 'rgba(46,213,115,0.1)' : 'rgba(255,255,255,0.03)', color: isConnected ? '#2ed573' : '#8b949e', border: `1px solid ${isConnected ? 'rgba(46,213,115,0.2)' : 'rgba(48,54,61,0.3)'}` }}>
                              {isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.4' }}>{item.desc}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          {isMock ? (
                            <button disabled style={{ width: '100%', padding: '7px', background: 'rgba(33,38,45,0.5)', border: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'not-allowed' }}>Connected By Default</button>
                          ) : isConnected ? (
                            <>
                              <button onClick={() => handleSync(item.provider)} disabled={isSyncing[item.provider]} style={{ flex: 1, padding: '7px', background: '#21262d', border: '1px solid rgba(240,246,255,0.1)', color: '#c9d1d9', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                                {isSyncing[item.provider] ? 'Syncing...' : 'Sync Now'}
                              </button>
                              <button onClick={() => confirmDisconnect(item.provider)} style={{ padding: '7px 10px', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>Revoke</button>
                            </>
                          ) : (
                            <button onClick={() => handleConnect(item.provider, item.name)} style={{ width: '100%', padding: '7px', background: '#1f6feb', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}>
                              Connect {item.name.split(' ')[0]}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          ) : activeTab === 'feature-matrix' ? (
            // ==========================================
            // FEATURE MATRIX
            // ==========================================
            <div style={{ background: 'rgba(10,14,20,0.3)', border: '1px solid rgba(48,54,61,0.4)', borderRadius: '12px', padding: '24px' }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(48,54,61,0.3)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'build', label: '🛠️ Build (Schema Builder)', color: '#58a6ff' },
                  { id: 'integrate', label: '🔒 Integrate (AES Encryption)', color: '#a78bfa' },
                  { id: 'test', label: '🧪 Test (Mock Sandbox)', color: '#d29922' },
                  { id: 'automate', label: '⚡ Automate (Token Refresh)', color: '#2ed573' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setFmTab(tab.id)} style={{
                    padding: '10px 16px', border: 'none', borderRadius: '8px',
                    background: fmTab === tab.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: fmTab === tab.id ? tab.color : '#8b949e', cursor: 'pointer',
                    fontWeight: '700', fontSize: '0.84rem', transition: 'all 0.2s',
                    borderBottom: fmTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent'
                  }}>{tab.label}</button>
                ))}
              </div>

              {/* Tab Content */}
              <div>
                {/* BUILD TAB */}
                {fmTab === 'build' && (
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.94rem', fontWeight: '700' }}>Custom CRM Unified Schema Builder</h4>
                      <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.5' }}>
                        Design a custom endpoint schema on the fly. The platform will automatically map the fields and register the dynamic OpenAPI endpoints.
                      </p>
                      
                      <div>
                        <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Endpoint Name</label>
                        <div style={{ display: 'flex', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', alignItems: 'center', paddingLeft: '10px' }}>
                          <span style={{ color: '#484f58', fontSize: '0.8rem', fontFamily: 'monospace' }}>/api/v1/custom/</span>
                          <input type="text" value={fmBuildEndpoint} onChange={e => setFmBuildEndpoint(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#e6edf3', padding: '8px', fontSize: '0.82rem', outline: 'none', width: '100%', fontFamily: 'monospace' }} />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Schema Field Definition</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {fmBuildFields.map((field, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input type="text" value={field.name} placeholder="Field Name" onChange={e => {
                                const next = [...fmBuildFields];
                                next[idx].name = e.target.value;
                                setFmBuildFields(next);
                              }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                              <select value={field.type} onChange={e => {
                                const next = [...fmBuildFields];
                                next[idx].type = e.target.value;
                                setFmBuildFields(next);
                              }} style={{ padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }}>
                                {['string', 'number', 'boolean', 'array'].map(t => <option key={t} value={t} style={{ background: '#0f141c' }}>{t}</option>)}
                              </select>
                              <button onClick={() => setFmBuildFields(fmBuildFields.filter((_, i) => i !== idx))}
                                style={{ background: 'transparent', border: 'none', color: '#f85149', fontSize: '0.82rem', cursor: 'pointer' }}>Remove</button>
                            </div>
                          ))}
                          <button onClick={() => setFmBuildFields([...fmBuildFields, { name: 'new_field', type: 'string' }])}
                            style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '6px', color: '#c9d1d9', padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: '600' }}>+ Add Field</button>
                        </div>
                      </div>

                      <button onClick={() => {
                        const scaffold = {
                          endpoint: `/api/v1/custom/${fmBuildEndpoint}`,
                          registered: true,
                          schema: fmBuildFields.reduce((acc, f) => { acc[f.name] = f.type; return acc; }, {}),
                          dynamicRouterCode: `// Generated Router scaffolding for custom endpoint\nrouter.get('/custom/${fmBuildEndpoint}', async (req, res) => {\n  const data = await customResolver('${fmBuildEndpoint}');\n  res.json({ success: true, data });\n});`
                        };
                        setFmBuildOutput(JSON.stringify(scaffold, null, 2));
                        showToast('🛠️ API Scaffolding registered successfully!', 'success');
                      }} style={{ padding: '10px', background: '#1f6feb', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Generate API Scaffolding</button>
                    </div>

                    <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Generated OpenAPI Specs & Router Code</span>
                      <pre style={{
                        margin: 0, padding: '16px', background: 'rgba(7,9,14,0.6)',
                        border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px',
                        color: '#7ee787', fontSize: '0.78rem', fontFamily: 'monospace', overflowX: 'auto', minHeight: '260px'
                      }}>{fmBuildOutput || '// Click "Generate API Scaffolding" to view generated specs...'}</pre>
                    </div>
                  </div>
                )}

                {/* INTEGRATE TAB */}
                {fmTab === 'integrate' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.94rem', fontWeight: '700' }}>AES-256-GCM Symmetric DB Encryption Simulator</h4>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.5' }}>
                          We implement industry-grade database-level symmetric envelope encryption. Secure values like Access Tokens are encrypted before insertion and transparently decrypted on reads.
                        </p>

                        <div>
                          <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Token/Secret Value to Write</label>
                          <input type="text" value={fmEncryptValue} onChange={e => setFmEncryptValue(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.82rem', outline: 'none' }} />
                        </div>

                        <button onClick={handleFmEncrypt} disabled={fmEncLoading}
                          style={{ padding: '10px', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>
                          {fmEncLoading ? 'Encrypting...' : '🔒 Simulate AES Encryption Write'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <span style={{ display: 'block', color: '#e6edf3', fontSize: '0.74rem', fontWeight: '700', marginBottom: '4px' }}>🔒 Ciphertext in PostgreSQL (Encrypted on Write)</span>
                          <pre style={{
                            margin: 0, padding: '12px', background: 'rgba(248,81,73,0.02)',
                            border: '1px solid rgba(248,81,73,0.12)', borderRadius: '8px',
                            color: '#ff7b72', fontSize: '0.76rem', fontFamily: 'monospace', overflowX: 'auto', minHeight: '60px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                          }}>{fmCiphertext || 'Waiting for encryption simulation...'}</pre>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#e6edf3', fontSize: '0.74rem', fontWeight: '700', marginBottom: '4px' }}>🔑 Decrypted Value in App Context (Decrypted on Read)</span>
                          <pre style={{
                            margin: 0, padding: '12px', background: 'rgba(46,160,67,0.02)',
                            border: '1px solid rgba(46,160,67,0.12)', borderRadius: '8px',
                            color: '#7ee787', fontSize: '0.76rem', fontFamily: 'monospace', overflowX: 'auto', minHeight: '40px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                          }}>{fmDecrypted || 'Waiting for encryption simulation...'}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEST TAB */}
                {fmTab === 'test' && (
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.94rem', fontWeight: '700' }}>Mock API Server Sandbox Query</h4>
                      <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.5' }}>
                        Before connecting your live HubSpot or Salesforce accounts, test endpoints inside this mock sandbox environment. All query parameters, sorting, and schemas are strictly validated.
                      </p>

                      <div>
                        <label style={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>Select CRM Object Schema</label>
                        <select value={fmTestSchema} onChange={e => setFmTestSchema(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.82rem', fontWeight: '600', outline: 'none' }}>
                          <option value="contacts" style={{ background: '#0f141c' }}>Contacts Schema</option>
                          <option value="companies" style={{ background: '#0f141c' }}>Companies Schema</option>
                          <option value="deals" style={{ background: '#0f141c' }}>Deals Schema</option>
                        </select>
                      </div>

                      <button onClick={handleFmTestQuery} disabled={fmTestLoading}
                        style={{ padding: '10px', background: '#d29922', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>
                        {fmTestLoading ? 'Sending HTTP Request...' : '🧪 Run Mock API Query'}
                      </button>
                    </div>

                    <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Mock Server Terminal Output</span>
                      <pre style={{
                        margin: 0, padding: '16px', background: 'rgba(7,9,14,0.6)',
                        border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px',
                        color: '#7ee787', fontSize: '0.78rem', fontFamily: 'monospace', overflowX: 'auto', minHeight: '220px'
                      }}>{fmTestOutput || '// Output will print here...'}</pre>
                    </div>
                  </div>
                )}

                {/* AUTOMATE TAB */}
                {fmTab === 'automate' && (
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.94rem', fontWeight: '700' }}>OAuth Proactive Token Refresh Timeline</h4>
                      <p style={{ margin: 0, color: '#8b949e', fontSize: '0.78rem', lineHeight: '1.5' }}>
                        The platform proactively schedules token refresh checks. If a query returns a `401 Unauthorized` token expiry during a background worker sync, the gateway automatically rotates keys and retries the sync transparently.
                      </p>

                      <button onClick={handleFmRefreshSim} disabled={fmRefreshRunning}
                        style={{ padding: '10px', background: '#2ed573', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>
                        {fmRefreshRunning ? 'Simulation Running...' : '⚡ Run Token Refresh Simulation'}
                      </button>

                      {/* Visual Timeline Nodes */}
                      {fmRefreshRunning && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'rgba(46,213,115,0.05)', borderRadius: '8px', border: '1px solid rgba(46,213,115,0.15)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b949e' }}>
                            <span style={{ color: fmRefreshStep >= 1 ? '#58a6ff' : '#8b949e', fontWeight: fmRefreshStep === 1 ? '700' : '400' }}>💻 Client</span>
                            <span style={{ color: (fmRefreshStep === 2 || fmRefreshStep === 3) ? '#f85149' : (fmRefreshStep >= 4 ? '#2ed573' : '#8b949e'), fontWeight: '700' }}>🛡️ Gateway</span>
                            <span style={{ color: fmRefreshStep >= 4 ? '#2ed573' : '#8b949e', fontWeight: fmRefreshStep === 4 ? '700' : '400' }}>🗄️ Database</span>
                          </div>
                          <div style={{ height: '4px', background: '#30363d', borderRadius: '2px', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', height: '100%', background: '#2ed573', borderRadius: '2px',
                              width: `${(fmRefreshStep / 5) * 100}%`, transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Simulation Event Log</span>
                      <div style={{
                        margin: 0, padding: '16px', background: 'rgba(7,9,14,0.6)',
                        border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px',
                        minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '8px'
                      }}>
                        {fmRefreshTimeline.length > 0 ? fmRefreshTimeline.map((line, idx) => {
                          const isErr = line.includes('❌');
                          const isSuccess = line.includes('🎉') || line.includes('🔑');
                          const color = isErr ? '#ff7b72' : isSuccess ? '#7ee787' : '#c9d1d9';
                          return (
                            <div key={idx} style={{ color, fontSize: '0.78rem', fontFamily: 'monospace', lineHeight: '1.4' }}>
                              {line}
                            </div>
                          );
                        }) : (
                          <span style={{ color: '#8b949e', fontSize: '0.78rem', fontFamily: 'monospace' }}>// Click "Run Token Refresh Simulation" to start timeline trace...</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          ) : activeTab === 'api-playground' ? (
            // ==========================================
            // API PLAYGROUND (Postman Clone)
            // ==========================================
            <div style={{ display: 'flex', minHeight: '520px', background: 'rgba(10,14,20,0.4)', border: '1px solid rgba(48,54,61,0.4)', borderRadius: '12px', overflow: 'hidden', flexWrap: 'wrap' }}>
              {/* Left: History */}
              <div style={{ width: '220px', borderRight: '1px solid rgba(48,54,61,0.5)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                <h5 style={{ color: '#8b949e', margin: 0, fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>Request History</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
                  {playgroundHistory.map((hist, idx) => {
                    const color = hist.method === 'GET' ? '#58a6ff' : hist.method === 'POST' ? '#3fb950' : '#d29922';
                    return (
                      <button key={idx} onClick={() => {
                        setPlaygroundMethod(hist.method);
                        setPlaygroundEndpoint(hist.endpoint);
                        setPlaygroundResponse(null);
                      }} style={{
                        padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(48,54,61,0.3)',
                        background: 'rgba(255,255,255,0.01)', textAlign: 'left', cursor: 'pointer',
                        fontSize: '0.75rem', color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <span style={{ fontWeight: '800', color, fontSize: '0.62rem', width: '28px' }}>{hist.method}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hist.endpoint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Middle: Request Builder */}
              <div style={{ flex: 1.5, padding: '20px', borderRight: '1px solid rgba(48,54,61,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: '320px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={playgroundMethod} onChange={e => setPlaygroundMethod(e.target.value)}
                      style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', padding: '0 12px', fontSize: '0.82rem', fontWeight: '700', outline: 'none' }}>
                      {['GET', 'POST', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div style={{ display: 'flex', flex: 1, background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', alignItems: 'center', paddingLeft: '12px' }}>
                      <span style={{ color: '#484f58', fontSize: '0.82rem', fontFamily: 'monospace' }}>/api/v1</span>
                      <input type="text" value={playgroundEndpoint} onChange={e => setPlaygroundEndpoint(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#e6edf3', padding: '8px', fontSize: '0.85rem', outline: 'none', width: '100%', fontFamily: 'monospace' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(48,54,61,0.3)', paddingBottom: '8px' }}>
                    {[
                      { id: 'params', label: 'Params' },
                      { id: 'headers', label: 'Headers' },
                      { id: 'body', label: 'Body' },
                      { id: 'auth', label: 'Auth' },
                    ].map(sub => (
                      <button key={sub.id} onClick={() => setPlaygroundActiveTab(sub.id)} style={{
                        background: 'none', border: 'none', color: playgroundActiveTab === sub.id ? '#58a6ff' : '#8b949e',
                        fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer', padding: '4px 8px',
                        borderBottom: playgroundActiveTab === sub.id ? '2px solid #58a6ff' : '2px solid transparent'
                      }}>{sub.label}</button>
                    ))}
                  </div>

                  <div style={{ minHeight: '160px' }}>
                    {playgroundActiveTab === 'params' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '600' }}>Query String Parameters</span>
                        {playgroundParams.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={p.key} placeholder="Key" onChange={e => {
                              const next = [...playgroundParams];
                              next[idx].key = e.target.value;
                              setPlaygroundParams(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                            <input type="text" value={p.value} placeholder="Value" onChange={e => {
                              const next = [...playgroundParams];
                              next[idx].value = e.target.value;
                              setPlaygroundParams(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {playgroundActiveTab === 'headers' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '600' }}>HTTP Request Headers</span>
                        {playgroundHeaders.map((h, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={h.key} placeholder="Header Key" onChange={e => {
                              const next = [...playgroundHeaders];
                              next[idx].key = e.target.value;
                              setPlaygroundHeaders(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                            <input type="text" value={h.value} placeholder="Value" onChange={e => {
                              const next = [...playgroundHeaders];
                              next[idx].value = e.target.value;
                              setPlaygroundHeaders(next);
                            }} style={{ flex: 1, padding: '6px 10px', background: 'rgba(13,17,23,0.5)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '4px', color: '#c9d1d9', fontSize: '0.78rem', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {playgroundActiveTab === 'body' && (
                      <div>
                        <span style={{ color: '#8b949e', display: 'block', fontSize: '0.72rem', fontWeight: '600', marginBottom: '8px' }}>Raw JSON Payload</span>
                        <textarea value={playgroundBody} onChange={e => setPlaygroundBody(e.target.value)} rows={7}
                          style={{ width: '100%', padding: '10px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#7ee787', fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} />
                      </div>
                    )}

                    {playgroundActiveTab === 'auth' && (
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(48,54,61,0.3)', borderRadius: '8px' }}>
                        <span style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>JWT Bearer Token Auth</span>
                        <p style={{ margin: 0, color: '#8b949e', fontSize: '0.74rem', lineHeight: '1.4' }}>
                          Requests will automatically inject your user session JWT token in the <code>Authorization: Bearer</code> header.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handlePlaygroundSend} disabled={playgroundLoading} style={{
                  width: '100%', marginTop: '16px', padding: '11px',
                  background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
                  color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700',
                  fontSize: '0.85rem', cursor: playgroundLoading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(31,111,235,0.2)'
                }}>
                  <Play size={12} fill="white" />
                  {playgroundLoading ? 'Executing Request...' : 'Send Request'}
                </button>
              </div>

              {/* Right: Response Panel */}
              <div style={{ flex: 1.8, padding: '20px', display: 'flex', flexDirection: 'column', background: 'rgba(13,17,23,0.3)', justifyContent: 'space-between', minWidth: '320px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ color: '#8b949e', margin: 0, fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Response Console</h5>
                    {playgroundResponse && (
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#8b949e' }}>
                        <span>Time: <strong style={{ color: '#e6edf3' }}>{playgroundLatency}</strong></span>
                        <span>Size: <strong style={{ color: '#e6edf3' }}>{playgroundPayloadSize}</strong></span>
                        <button onClick={() => handleCopy(JSON.stringify(playgroundResponse.data, null, 2))} style={{
                          background: 'none', border: 'none', color: '#58a6ff', fontSize: '0.72rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                        }}>
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? 'Copied' : 'Copy Payload'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{
                    flex: 1, background: 'rgba(7,9,14,0.8)', border: '1px solid rgba(48,54,61,0.6)',
                    borderRadius: '8px', padding: '16px', overflowY: 'auto', maxHeight: '350px',
                    fontFamily: 'monospace', fontSize: '0.78rem', minHeight: '260px'
                  }}>
                    {playgroundResponse ? (
                      <div>
                        <div style={{ marginBottom: '12px', fontSize: '0.78rem', color: playgroundResponse.status < 400 ? '#3fb950' : '#f85149', fontWeight: '700' }}>
                          STATUS: {playgroundResponse.status} {playgroundResponse.statusText}
                        </div>
                        <pre style={{ margin: 0, color: '#e6edf3', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(playgroundResponse.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58' }}>
                        No execution completed.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'flow' ? (
            // ==========================================
            // END-TO-END FLOW
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ padding: '16px 20px', background: 'rgba(31,111,235,0.04)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px' }}>
                <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.5' }}>
                  Real-time visual pathway describing how an inbound payload is received by the <strong>Universal API Gateway</strong>, processed through tenant validations, parsed via declarative mappers, and forwarded to the upstream CRM.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0', alignItems: 'center', position: 'relative' }}>
                {[
                  { title: '1. Developer Client / SDK', desc: 'PATCH /v1/crm/contacts/{id}', icon: <Code size={18} color="#58a6ff" />, bg: 'rgba(31,111,235,0.06)', border: '#388bfd' },
                  { title: '2. Edge API Gateway', desc: 'Envoy Rate limiter, CORS check, JWT Auth', icon: <Server size={18} color="#a78bfa" />, bg: 'rgba(139,92,246,0.06)', border: '#8b5cf6' },
                  { title: '3. OAuth Secret Vault & Tenancy Guard', desc: 'Isolate workspace ID, decrypt envelope credentials key', icon: <Lock size={18} color="#2ed573" />, bg: 'rgba(38,184,96,0.06)', border: '#2ed573' },
                  { title: '4. Polymorphic Mapper Engine', desc: 'Read declarative JSON-to-JSON mapping files', icon: <Compass size={18} color="#d29922" />, bg: 'rgba(255,193,7,0.06)', border: '#d29922' },
                  { title: '5. Upstream CRM Provider', desc: 'Invoke HubSpot, Salesforce, or Pipedrive API', icon: <Globe size={18} color="#f85149" />, bg: 'rgba(248,81,73,0.06)', border: '#f85149' },
                  { title: '6. Normalized Response', desc: 'Append _raw_passthrough escape hatch payload', icon: <CheckSquare size={18} color="#58a6ff" />, bg: 'rgba(31,111,235,0.06)', border: '#388bfd' },
                ].map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <div style={{
                      width: '100%', maxWidth: '480px', background: step.bg, border: `1px solid ${step.border}3b`,
                      borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'relative'
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(10,14,20,0.6)',
                        border: `1px solid ${step.border}6b`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {step.icon}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.88rem', fontWeight: '700' }}>{step.title}</h4>
                        <span style={{ color: '#8b949e', fontSize: '0.76rem', fontFamily: 'monospace' }}>{step.desc}</span>
                      </div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', margin: '4px 0' }}>
                        <div style={{ width: '2px', height: '20px', background: 'linear-gradient(to bottom, rgba(56,139,253,0.6), rgba(139,92,246,0.6))' }} />
                        <ChevronRight size={14} color="#8b949e" style={{ transform: 'rotate(90deg)' }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

          ) : activeTab === 'architecture' ? (
            // ==========================================
            // SYSTEM ARCHITECTURE
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: '#58a6ff', margin: '0 0 12px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>Synchronous Data Path</h4>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(88,166,255,0.15)', color: '#58a6ff', fontWeight: '700' }}>Real-Time Proxy</span>
                  <p style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '12px' }}>
                    Standard API endpoint routing directly triggers synchronous proxying:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#c9d1d9', fontFamily: 'monospace', paddingLeft: '12px', borderLeft: '2px solid rgba(88,166,255,0.3)' }}>
                    <span>Inbound HTTP call</span>
                    <span>→ Decruit tenant OAuth tokens</span>
                    <span>→ Run polymorphic mapping template</span>
                    <span>→ Fetch raw response from CRM</span>
                    <span>→ Return JSON response</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ color: '#a78bfa', margin: '0 0 12px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>Asynchronous Sync Path</h4>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: '700' }}>Background Workers</span>
                  <p style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: '12px' }}>
                    For high-volume webhooks and scheduling, operations execute via Temporal background queues:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#c9d1d9', fontFamily: 'monospace', paddingLeft: '12px', borderLeft: '2px solid rgba(139,92,246,0.3)' }}>
                    <span>Ingest webhook event in Gateway</span>
                    <span>→ Push event to RabbitMQ/Redis</span>
                    <span>→ Hand off to background sync workers</span>
                    <span>→ Sync to local DB records</span>
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'explorer' ? (
            // ==========================================
            // API NORMALIZATION EXPLORER
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#8b949e', fontSize: '0.82rem', fontWeight: '600' }}>Select Target Connector:</span>
                <select value={explorerProvider} onChange={e => setExplorerProvider(e.target.value)}
                  style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', padding: '6px 12px', fontSize: '0.82rem', outline: 'none' }}>
                  <option value="hubspot">HubSpot</option>
                  <option value="salesforce">Salesforce</option>
                  <option value="pipedrive">Pipedrive</option>
                </select>

                <span style={{ color: '#8b949e', fontSize: '0.82rem', fontWeight: '600', marginLeft: '12px' }}>Data Model Vertical:</span>
                <select value={explorerModel} onChange={e => setExplorerModel(e.target.value)}
                  style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', padding: '6px 12px', fontSize: '0.82rem', outline: 'none' }}>
                  <option value="contact">Contact Schema</option>
                  <option value="company">Company Schema</option>
                  <option value="deal">Deal Schema</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Left: Raw */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Raw Upstream CRM Response
                  </span>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '400px' }}>
                    {explorerModel === 'contact' && explorerProvider === 'hubspot' && (
                      <pre style={{ margin: 0, color: '#ff8c42' }}>{`{
  "id": "hs_contact_101",
  "properties": {
    "firstname": "Sarah",
    "lastname": "Connor",
    "email": "sarah.connor@sky.net",
    "phone": "+1-555-0199",
    "jobtitle": "Structural Engineer"
  }
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'salesforce' && (
                      <pre style={{ margin: 0, color: '#29b6e8' }}>{`{
  "Id": "sf_contact_201",
  "FirstName": "Luke",
  "LastName": "Skywalker",
  "Email": "luke@tatooine.org",
  "Phone": "+1-555-0808"
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'pipedrive' && (
                      <pre style={{ margin: 0, color: '#2ed573' }}>{`{
  "id": 301,
  "name": "Anakin Skywalker",
  "email": [{ "value": "anakin@deathstar.com", "primary": true }]
}`}</pre>
                    )}
                  </div>
                </div>

                {/* Right: Normalized */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Normalized Response (Strict Mapped)
                  </span>
                  <div style={{ background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.6)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '400px' }}>
                    {explorerModel === 'contact' && explorerProvider === 'hubspot' && (
                      <pre style={{ margin: 0, color: '#a78bfa' }}>{`{
  "id": "some-local-uuid",
  "externalId": "hs_contact_101",
  "name": "Sarah Connor",
  "email": "sarah.connor@sky.net",
  "provider": "hubspot",
  "_raw_passthrough": {
    "id": "hs_contact_101",
    "properties": {
      "firstname": "Sarah",
      "lastname": "Connor"
    }
  }
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'salesforce' && (
                      <pre style={{ margin: 0, color: '#a78bfa' }}>{`{
  "id": "some-local-uuid",
  "externalId": "sf_contact_201",
  "name": "Luke Skywalker",
  "provider": "salesforce"
}`}</pre>
                    )}
                    {explorerModel === 'contact' && explorerProvider === 'pipedrive' && (
                      <pre style={{ margin: 0, color: '#a78bfa' }}>{`{
  "id": "some-local-uuid",
  "externalId": "301",
  "name": "Anakin Skywalker",
  "provider": "pipedrive"
}`}</pre>
                    )}
                  </div>
                </div>
              </div>
            </div>

          ) : activeTab === 'challenges' ? (
            // ==========================================
            // TECHNICAL CHALLENGES
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Tenant Data Isolation', problem: 'Ensuring that organization workspaces never leak data cross-tenant or allow unauthorized cross-company visibility.', solution: 'Enforced database-level filters based on organizationId and validated organization ID parameter claims inside signed JWT tokens.' },
                { title: 'OAuth Token Expiration', problem: 'Tokens expire asynchronously, disrupting background sync routines.', solution: 'Implemented database-level GCM envelope encryption combined with proactive background sweep loops to refresh tokens 15 minutes before expiration.' },
                { title: 'RBAC Authorization', problem: 'Lower roles accessing sensitive configuration settings, billing data, or project credentials.', solution: 'Built backend router decorators that authorize incoming calls based on strict JWT role permission checks.' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 12px', fontSize: '0.9rem', fontWeight: '700' }}>{c.title}</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#f85149', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>The Challenge</span>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem' }}>{c.problem}</p>
                  </div>
                  <div>
                    <span style={{ color: '#3fb950', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Resolution</span>
                    <p style={{ margin: 0, color: '#c9d1d9', fontSize: '0.8rem' }}>{c.solution}</p>
                  </div>
                </div>
              ))}
            </div>

          ) : activeTab === 'dx' ? (
            // ==========================================
            // DEVELOPER EXPERIENCE
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>NodeJS SDK Example</h4>
                  <pre style={{
                    margin: 0, padding: '14px', background: 'rgba(7,9,14,0.8)',
                    borderRadius: '8px', border: '1px solid rgba(48,54,61,0.5)',
                    color: '#7ee787', fontSize: '0.76rem', fontFamily: 'monospace', overflowX: 'auto'
                  }}>{`const { UniversalAPI } = require('universal-api-sdk');
const client = new UniversalAPI({ apiKey: 'your_api_token_here' });

async function run() {
  const contacts = await client.crm.getContacts({ limit: 20 });
  console.log(contacts[0]._raw_passthrough);
}
run();`}</pre>
                </div>

                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#e6edf3', margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>cURL REST Request</h4>
                  <pre style={{
                    margin: 0, padding: '14px', background: 'rgba(7,9,14,0.8)',
                    borderRadius: '8px', border: '1px solid rgba(48,54,61,0.5)',
                    color: '#f0883e', fontSize: '0.76rem', fontFamily: 'monospace', overflowX: 'auto'
                  }}>{`curl -X GET \\
  "http://localhost:3000/api/v1/contacts?limit=10" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`}</pre>
                </div>
              </div>
            </div>

          ) : activeTab === 'roadmap' ? (
            // ==========================================
            // ROADMAP
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {[
                  { phase: 'Phase 1: CRM Sync', desc: 'HubSpot, Salesforce, Pipedrive schemas mapped. Unified contact models.', status: 'Completed', color: '#3fb950' },
                  { phase: 'Phase 2: Multi-Tenancy', desc: 'Domain-based organization workspaces, pending users approvals, strict RBAC.', status: 'Completed', color: '#3fb950' },
                  { phase: 'Phase 3: Messaging', desc: 'Integrating communication vertical with Slack, Discord, and Teams.', status: 'In Development', color: '#58a6ff' },
                  { phase: 'Phase 4: Billing & Audit', desc: 'Enterprise audit logs history and workspaces billing modules.', status: 'Planned', color: '#8b949e' },
                ].map((ph, i) => (
                  <div key={i} style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: `${ph.color}15`, color: ph.color, fontWeight: '700', alignSelf: 'flex-start' }}>{ph.status}</span>
                    <h4 style={{ margin: '4px 0 0', color: '#e6edf3', fontSize: '0.9rem', fontWeight: '700' }}>{ph.phase}</h4>
                    <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem' }}>{ph.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          ) : activeTab === 'team' ? (
            // ==========================================
            // TEAM
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Girish', roles: ['System Architecture', 'Backend Core Development', 'RBAC & Tenancy middleware'] },
                { name: 'Swayamsuchee', roles: ['CRM Connectors integration', 'Declarative Mapping JSONs', 'Adapter Pipeline transformation'] },
                { name: 'Soujanya', roles: ['Webhook Ingestion listener', 'Stateful Sync queues', 'System Unit Testing'] },
                { name: 'Aditya', roles: ['Console Dashboard UI/UX', 'Platform documentation', 'Request logs visualizer'] },
              ].map((member, idx) => (
                <div key={idx} style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '0.98rem'
                    }}>{member.name.charAt(0)}</div>
                    <div>
                      <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '0.9rem', fontWeight: '700' }}>{member.name}</h4>
                      <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>Module Owner</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {member.roles.map((r, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#c9d1d9' }}>
                        • {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          ) : activeTab === 'enterprise' ? (
            // ==========================================
            // ENTERPRISE SPECS
            // ==========================================
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Zero-Persistence Proxy', desc: 'Request and response payloads flow directly through temporary memory buffers. Credentials, tokens, and PII are scrubbed and never persistent to local disks.' },
                { title: 'Symmetric Envelope Crypt', desc: 'Secure encryption keys isolate tenant tokens using application-level envelopes. Keys are isolated dynamically.' },
                { title: 'Edge Gateways', desc: 'Global Envoy router proxying endpoints with integrated concurrency limits, CORS compliance, and DDOS mitigation.' },
              ].map((ent, i) => (
                <div key={i} style={{ padding: '16px 20px', background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px' }}>
                  <h4 style={{ color: '#58a6ff', margin: '0 0 8px', fontSize: '0.88rem', fontWeight: '700' }}>{ent.title}</h4>
                  <p style={{ margin: 0, color: '#8b949e', fontSize: '0.8rem', lineHeight: '1.5' }}>{ent.desc}</p>
                </div>
              ))}
            </div>

          ) : activeTab === 'docs' ? (
            // ==========================================
            // DOCUMENTATION
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#c9d1d9', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>Project Overview</h4>
                <p style={{ margin: 0 }}>
                  The Universal API Platform abstracts fragmentation among multiple Customer Relationship Management (CRM) databases into a single, clean REST API endpoint structure. A developer integrates this platform once, and our backend polymorphic engines translate schemas for HubSpot, Salesforce, and Pipedrive adapters transparently.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#e6edf3', fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>Envelope Security Vault</h4>
                <p style={{ margin: 0 }}>
                  We implement database-level symmetric envelope encryption using the AES-256-GCM cipher format. Every access and refresh token saved to the database is encrypted on write and decrypted on read transparently using a secure process context variable.
                </p>
              </div>
            </div>

          ) : activeTab === 'logs' ? (
            // ==========================================
            // REQUEST LOGS (IDE-style Dynamic Codebase Redesign)
            // ==========================================
            (() => {
              const filteredLogs = logs.filter(log => {
                const matchesSearch = log.endpoint.toLowerCase().includes(logSearch.toLowerCase()) || 
                                     (log.errorMessage && log.errorMessage.toLowerCase().includes(logSearch.toLowerCase())) ||
                                     (log.ipAddress && log.ipAddress.includes(logSearch));
                const matchesMethod = logMethod === 'ALL' || log.method === logMethod;
                return matchesSearch && matchesMethod;
              });

              // Set default active log if none is selected
              const activeLog = logs.find(l => l.id === expandedLogId) || filteredLogs[0];

              // Group logs into folder paths
              const folders = {
                companies: [],
                contacts: [],
                auth: [],
                integrations: [],
                system: []
              };

              filteredLogs.forEach(log => {
                if (log.endpoint.includes('/companies')) folders.companies.push(log);
                else if (log.endpoint.includes('/contacts')) folders.contacts.push(log);
                else if (log.endpoint.includes('/auth') || log.endpoint.includes('/login') || log.endpoint.includes('/register')) folders.auth.push(log);
                else if (log.endpoint.includes('/integrations') || log.endpoint.includes('/sync')) folders.integrations.push(log);
                else folders.system.push(log);
              });

              // Helper for JSON syntax tokenizer
              const tokenizeJsonLine = (line) => {
                if (line.trim().startsWith('//')) {
                  return <span style={{ color: '#8b949e', fontStyle: 'italic' }}>{line}</span>;
                }
                const keyMatch = line.match(/^(\s*)"([^"]+)"\s*:/);
                if (keyMatch) {
                  const indent = keyMatch[1];
                  const keyName = keyMatch[2];
                  const rest = line.substring(keyMatch[0].length);
                  
                  let valueElement;
                  const cleanRest = rest.trim();
                  if (cleanRest.startsWith('"')) {
                    valueElement = <span style={{ color: '#ce9178' }}>{cleanRest}</span>;
                  } else if (cleanRest.startsWith('true') || cleanRest.startsWith('false')) {
                    valueElement = <span style={{ color: '#569cd6', fontWeight: '700' }}>{cleanRest}</span>;
                  } else if (cleanRest.startsWith('null')) {
                    valueElement = <span style={{ color: '#569cd6', fontStyle: 'italic' }}>{cleanRest}</span>;
                  } else if (/^-?\d+/.test(cleanRest)) {
                    valueElement = <span style={{ color: '#b5cea8' }}>{cleanRest}</span>;
                  } else {
                    valueElement = <span style={{ color: '#c9d1d9' }}>{rest}</span>;
                  }
                  
                  return (
                    <span>
                      {indent}
                      <span style={{ color: '#9cdcfe' }}>"{keyName}"</span>
                      <span style={{ color: '#c9d1d9' }}>:</span>
                      {valueElement}
                    </span>
                  );
                }
                if (line.includes('{') || line.includes('}') || line.includes('[') || line.includes(']')) {
                  return <span style={{ color: '#ffd700' }}>{line}</span>;
                }
                return <span>{line}</span>;
              };

              const renderEditorContent = (log) => {
                if (!log) {
                  return (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      height: '100%', color: '#8b949e', fontSize: '0.8rem', fontStyle: 'italic', gap: '8px'
                    }}>
                      <Code size={24} color="#484f58" />
                      <span>// Select a log file in the sidebar folder tree to explore...</span>
                    </div>
                  );
                }

                const doc = {
                  id: log.id,
                  timestamp: log.timestamp,
                  request: {
                    method: log.method,
                    endpoint: log.endpoint,
                    clientIp: log.ipAddress || '127.0.0.1',
                    userAgent: log.userAgent || 'Mozilla/5.0'
                  },
                  response: {
                    statusCode: log.statusCode,
                    latencyMs: log.responseTime,
                    success: log.statusCode < 400
                  },
                  ...(log.errorMessage ? { error: { message: log.errorMessage } } : {})
                };

                const commentHeader = [
                  `// ==================================================`,
                  `// UNIVERSAL CRM GATEWAY TELEMETRY TRACE`,
                  `// REQUEST: ${log.method} ${log.endpoint}`,
                  `// GATEWAY STATUS: ${log.statusCode} (${log.statusCode >= 400 ? 'FAILED' : 'OK'})`,
                  `// RESOLUTION TIMING: ${log.responseTime}ms`,
                  `// ==================================================`,
                  ``
                ];

                const jsonLines = JSON.stringify(doc, null, 2).split('\n');
                const allLines = [...commentHeader, ...jsonLines];

                return (
                  <div style={{
                    display: 'flex', flexDirection: 'column', flex: 1,
                    overflowY: 'auto', maxHeight: '520px', background: '#0d1117'
                  }}>
                    {allLines.map((line, idx) => (
                      <div key={idx} style={{ display: 'flex', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: '1.6' }}>
                        <span style={{
                          color: '#8b949e', width: '42px', minWidth: '42px', textAlign: 'right',
                          paddingRight: '12px', borderRight: '1px solid rgba(48,54,61,0.25)',
                          userSelect: 'none', marginRight: '12px'
                        }}>{idx + 1}</span>
                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{tokenizeJsonLine(line)}</span>
                      </div>
                    ))}
                  </div>
                );
              };

              const getLogFilename = (l) => {
                const parts = l.endpoint.split('/');
                const base = parts[parts.length - 1] || 'root';
                return `${l.method}_${base}_${l.id.slice(0, 4)}.json`;
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top Filters */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '12px', padding: '12px 16px',
                    background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="text" placeholder="Filter workspace files..." value={logSearch} onChange={e => setLogSearch(e.target.value)}
                        style={{ padding: '6px 10px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', fontSize: '0.78rem', width: '220px', outline: 'none' }} />
                      
                      <select value={logMethod} onChange={e => setLogMethod(e.target.value)}
                        style={{ padding: '6px 10px', background: 'rgba(7,9,14,0.6)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '6px', color: '#e6edf3', fontSize: '0.78rem', fontWeight: '600', outline: 'none' }}>
                        {['ALL', 'GET', 'POST', 'PATCH', 'DELETE'].map(m => <option key={m} value={m} style={{ background: '#0f141c' }}>{m} Files</option>)}
                      </select>
                    </div>

                    <span style={{ color: '#8b949e', fontSize: '0.74rem' }}>
                      Explorer contains <strong style={{ color: '#58a6ff' }}>{filteredLogs.length}</strong> dynamic files
                    </span>
                  </div>

                  {/* IDE Main Pane */}
                  <div style={{
                    display: 'flex', minHeight: '500px', background: '#0d1117',
                    border: '1px solid rgba(48,54,61,0.6)', borderRadius: '12px', overflow: 'hidden',
                    flexWrap: 'wrap'
                  }}>
                    {/* LEFT SIDEBAR: File Explorer */}
                    <div style={{
                      width: '240px', borderRight: '1px solid rgba(48,54,61,0.5)',
                      background: '#161b22', display: 'flex', flexDirection: 'column',
                      minWidth: '220px'
                    }}>
                      {/* Sidebar Header */}
                      <div style={{
                        padding: '10px 16px', borderBottom: '1px solid rgba(48,54,61,0.3)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ color: '#8b949e', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WORKSPACE LOGS Explorer</span>
                      </div>

                      {/* Directory Tree */}
                      <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '460px' }}>
                        {/* Folder loops */}
                        {Object.entries(folders).map(([folderName, items]) => {
                          if (items.length === 0) return null;
                          return (
                            <div key={folderName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{
                                color: '#e6edf3', fontSize: '0.76rem', fontWeight: '700',
                                display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px',
                                textTransform: 'lowercase', cursor: 'default'
                              }}>
                                <span style={{ color: '#d29922', fontSize: '0.9rem' }}>📂</span>
                                <span>{folderName}</span>
                                <span style={{ color: '#8b949e', fontSize: '0.65rem', fontWeight: '400', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto' }}>{items.length}</span>
                              </div>

                              {/* Files list */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px dashed rgba(48,54,61,0.4)', marginLeft: '10px', paddingLeft: '6px', marginTop: '2px' }}>
                                {items.map((log) => {
                                  const isSelected = activeLog?.id === log.id;
                                  const isErr = log.statusCode >= 400;
                                  const methodColor = log.method === 'GET' ? '#58a6ff' : log.method === 'POST' ? '#3fb950' : log.method === 'DELETE' ? '#f85149' : '#d29922';
                                  return (
                                    <button
                                      key={log.id}
                                      onClick={() => setExpandedLogId(log.id)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: isSelected ? 'rgba(56,139,253,0.15)' : 'transparent',
                                        border: 'none', borderRadius: '4px', textAlign: 'left',
                                        padding: '5px 8px', cursor: 'pointer', width: '100%',
                                        outline: 'none', transition: 'all 0.1s'
                                      }}
                                    >
                                      <span style={{ fontSize: '0.74rem', color: isSelected ? '#58a6ff' : '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'monospace' }}>
                                        📄 {getLogFilename(log)}
                                      </span>
                                      <span style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: isErr ? '#f85149' : '#3fb950',
                                        boxShadow: isErr ? '0 0 6px #f85149' : '0 0 6px #3fb950'
                                      }} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT PANE: Code Editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '320px' }}>
                      {/* Editor Tabs Header */}
                      <div style={{
                        height: '35px', background: '#161b22', borderBottom: '1px solid rgba(48,54,61,0.5)',
                        display: 'flex', alignItems: 'center'
                      }}>
                        {activeLog && (
                          <div style={{
                            padding: '0 16px', background: '#0d1117', height: '100%',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            borderTop: '2px solid #f78166', borderRight: '1px solid rgba(48,54,61,0.5)',
                            color: '#e6edf3', fontSize: '0.76rem', fontFamily: 'monospace'
                          }}>
                            <span style={{ color: activeLog.method === 'GET' ? '#58a6ff' : activeLog.method === 'POST' ? '#3fb950' : '#f78166' }}>
                              {activeLog.method}
                            </span>
                            <span>{getLogFilename(activeLog)}</span>
                          </div>
                        )}
                      </div>

                      {/* Editor Console */}
                      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                        {renderEditorContent(activeLog)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()


          ) : activeTab === 'analytics' ? (
            // ==========================================
            // ANALYTICS
            // ==========================================
            analytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(31,111,235,0.06)', border: '1px solid rgba(31,111,235,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Connected Providers</p>
                    <h3 style={{ color: '#58a6ff', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{analytics.activeConnectionsCount} <span style={{ fontSize: '0.8rem', color: '#484f58' }}>/ 4</span></h3>
                  </div>
                  <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Contacts Synced</p>
                    <h3 style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                      {Object.values(analytics.dataDistribution?.contacts || {}).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(38,184,96,0.06)', border: '1px solid rgba(38,184,96,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Companies Synced</p>
                    <h3 style={{ color: '#2ed573', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                      {Object.values(analytics.dataDistribution?.companies || {}).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#8b949e', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Deals Synced</p>
                    <h3 style={{ color: '#d29922', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                      {Object.values(analytics.dataDistribution?.deals || {}).reduce((a, b) => a + b, 0)}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  <div style={{ background: 'rgba(13,17,23,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>HTTP Methods & Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {Object.entries(analytics.requestsByMethod || {}).map(([method, count]) => {
                        const percent = Math.min(100, Math.max(5, (count / analytics.totalRequests) * 100));
                        const color = method === 'GET' ? '#58a6ff' : method === 'POST' ? '#3fb950' : '#d29922';
                        return (
                          <div key={method}>
                            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8b949e', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '700', color }}>{method}</span>
                              <span>{count} ({Math.round(percent)}%)</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(33,38,45,0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: color, width: `${percent}%`, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(13,17,23,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>Sync Data Volume</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {['mock', 'hubspot', 'salesforce', 'pipedrive'].map((prov) => {
                        const contactCount = analytics.dataDistribution?.contacts?.[prov] || 0;
                        const companyCount = analytics.dataDistribution?.companies?.[prov] || 0;
                        const dealCount = analytics.dataDistribution?.deals?.[prov] || 0;
                        const total = contactCount + companyCount + dealCount;
                        const color = PROVIDER_COLORS[prov]?.text || '#a78bfa';
                        return (
                          <div key={prov}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8b949e', marginBottom: '4px', textTransform: 'capitalize' }}>
                              <span style={{ fontWeight: '600', color: '#e6edf3' }}>{prov}</span>
                              <span>{contactCount} Cnt · {companyCount} Cos · {dealCount} Dls</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(33,38,45,0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: color, width: `${Math.min(100, Math.max(5, (total / 50) * 100))}%`, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : <div style={{ padding: '64px', textAlign: 'center', color: '#8b949e' }}>No analytics data loaded.</div>

          ) : activeTab === 'cto-erp' ? (
            // ==========================================
            // CTO DYNAMIC ERP CONSOLE VIEW
            // ==========================================
            <CtoErpConsoleView currentUser={currentUser} showToast={showToast} />

          ) : activeTab === 'erp-inventory' ? (
            // ==========================================
            // ERP INVENTORY VIEW
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Total SKU Products</span>
                  <h3 style={{ color: '#58a6ff', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>1,248 Items</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Warehouse Locations</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>3 Global Hubs</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Low Stock Alert</span>
                  <h3 style={{ color: '#f85149', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>14 SKUs</h3>
                </div>
              </div>
              <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '800' }}>Warehouse Inventory Stock Ledger</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.5)', paddingBottom: '8px', color: '#8b949e' }}>
                        <th style={{ padding: '10px' }}>SKU Code</th>
                        <th style={{ padding: '10px' }}>Item Name</th>
                        <th style={{ padding: '10px' }}>Warehouse</th>
                        <th style={{ padding: '10px' }}>In Stock</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sku: 'SKU-APP-091', name: 'Unified Connector License Key', loc: 'US-East (N. Virginia)', stock: '982', status: 'In Stock', color: '#2ed573' },
                        { sku: 'SKU-DB-881', name: 'Dedicated SSD Vault Block', loc: 'EU-West (Frankfurt)', stock: '24', status: 'Low Stock', color: '#d29922' },
                        { sku: 'SKU-NW-102', name: 'Global Edge Router Rack Unit', loc: 'AP-South (Mumbai)', stock: '0', status: 'Out of Stock', color: '#f85149' },
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                          <td style={{ padding: '12px 10px', color: '#58a6ff', fontWeight: '700', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td style={{ padding: '12px 10px', color: '#e6edf3' }}>{item.name}</td>
                          <td style={{ padding: '12px 10px', color: '#8b949e' }}>{item.loc}</td>
                          <td style={{ padding: '12px 10px', color: '#e6edf3', fontWeight: '700' }}>{item.stock}</td>
                          <td style={{ padding: '12px 10px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: `${item.color}15`, color: item.color, fontWeight: '700', fontSize: '0.72rem' }}>{item.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          ) : activeTab === 'erp-finance' ? (
            // ==========================================
            // ERP FINANCE VIEW
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Gross Revenue (Q3)</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>$248,500.00</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Operating Cost</span>
                  <h3 style={{ color: '#f85149', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>$94,200.00</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Net Profit Margin</span>
                  <h3 style={{ color: '#58a6ff', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>62.1%</h3>
                </div>
              </div>
              <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '800' }}>Recent Financial Ledgers & Invoices</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.5)', paddingBottom: '8px', color: '#8b949e' }}>
                        <th style={{ padding: '10px' }}>Invoice ID</th>
                        <th style={{ padding: '10px' }}>Client</th>
                        <th style={{ padding: '10px' }}>Billing Date</th>
                        <th style={{ padding: '10px' }}>Amount</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'INV-2026-901', client: 'Acme Dev Org', date: 'Jul 18, 2026', amt: '$12,000.00', status: 'Paid', color: '#2ed573' },
                        { id: 'INV-2026-902', client: 'TechCorp Inc', date: 'Jul 15, 2026', amt: '$4,500.00', status: 'Paid', color: '#2ed573' },
                        { id: 'INV-2026-903', client: 'Bharat Logistics', date: 'Jul 10, 2026', amt: '$3,800.00', status: 'Pending', color: '#d29922' },
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                          <td style={{ padding: '12px 10px', color: '#58a6ff', fontWeight: '700', fontFamily: 'monospace' }}>{item.id}</td>
                          <td style={{ padding: '12px 10px', color: '#e6edf3' }}>{item.client}</td>
                          <td style={{ padding: '12px 10px', color: '#8b949e' }}>{item.date}</td>
                          <td style={{ padding: '12px 10px', color: '#e6edf3', fontWeight: '700' }}>{item.amt}</td>
                          <td style={{ padding: '12px 10px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: `${item.color}15`, color: item.color, fontWeight: '700', fontSize: '0.72rem' }}>{item.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          ) : activeTab === 'erp-hr' ? (
            // ==========================================
            // ERP HUMAN RESOURCES VIEW
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Active Employees</span>
                  <h3 style={{ color: '#58a6ff', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>42 Members</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Hiring Pipelines</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>4 Open Roles</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Monthly Payroll</span>
                  <h3 style={{ color: '#a78bfa', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>$68,000.00</h3>
                </div>
              </div>
              <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '800' }}>Internal Employees Roster</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.5)', paddingBottom: '8px', color: '#8b949e' }}>
                        <th style={{ padding: '10px' }}>Name</th>
                        <th style={{ padding: '10px' }}>Role</th>
                        <th style={{ padding: '10px' }}>Department</th>
                        <th style={{ padding: '10px' }}>Office Hub</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Girish Kumar Samal', role: 'CTO', dept: 'Engineering', hub: 'Bhubaneswar, IN', status: 'Active', color: '#2ed573' },
                        { name: 'Swayamsuchee', role: 'Senior Developer', dept: 'Engineering', hub: 'Bhubaneswar, IN', status: 'Active', color: '#2ed573' },
                        { name: 'Aditya', role: 'Support Engineer', dept: 'Operations', hub: 'Bangalore, IN', status: 'On Leave', color: '#d29922' },
                      ].map((emp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                          <td style={{ padding: '12px 10px', color: '#e6edf3', fontWeight: '700' }}>{emp.name}</td>
                          <td style={{ padding: '12px 10px', color: '#8b949e' }}>{emp.role}</td>
                          <td style={{ padding: '12px 10px', color: '#c9d1d9' }}>{emp.dept}</td>
                          <td style={{ padding: '12px 10px', color: '#8b949e' }}>{emp.hub}</td>
                          <td style={{ padding: '12px 10px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: `${emp.color}15`, color: emp.color, fontWeight: '700', fontSize: '0.72rem' }}>{emp.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          ) : activeTab === 'erp-orders' ? (
            // ==========================================
            // ERP ORDER QUEUE VIEW
            // ==========================================
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Orders In Queue</span>
                  <h3 style={{ color: '#58a6ff', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>8 Active</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Shipped Today</span>
                  <h3 style={{ color: '#2ed573', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>32 Orders</h3>
                </div>
                <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ color: '#8b949e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase' }}>Return Requests</span>
                  <h3 style={{ color: '#f85149', fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0' }}>0 Requests</h3>
                </div>
              </div>
              <div style={{ background: 'rgba(22,27,34,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#e6edf3', margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '800' }}>Active Order Processing Line</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(48,54,61,0.5)', paddingBottom: '8px', color: '#8b949e' }}>
                        <th style={{ padding: '10px' }}>Order ID</th>
                        <th style={{ padding: '10px' }}>Item Details</th>
                        <th style={{ padding: '10px' }}>Shipping Carrier</th>
                        <th style={{ padding: '10px' }}>Destination</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'ORD-8812', item: 'SSD Block Unit Allocation x 4', carrier: 'FedEx Priority', dest: 'Berlin, DE', status: 'Processing', color: '#58a6ff' },
                        { id: 'ORD-8813', item: 'Universal API SDK license keys', carrier: 'Email API Delivery', dest: 'Seattle, US', status: 'Shipped', color: '#2ed573' },
                        { id: 'ORD-8814', item: '1U Edge Router Gateway Server', carrier: 'DHL Express', dest: 'Tokyo, JP', status: 'Pending Approval', color: '#d29922' },
                      ].map((emp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(48,54,61,0.2)' }}>
                          <td style={{ padding: '12px 10px', color: '#58a6ff', fontWeight: '700', fontFamily: 'monospace' }}>{emp.id}</td>
                          <td style={{ padding: '12px 10px', color: '#e6edf3' }}>{emp.item}</td>
                          <td style={{ padding: '12px 10px', color: '#8b949e' }}>{emp.carrier}</td>
                          <td style={{ padding: '12px 10px', color: '#c9d1d9' }}>{emp.dest}</td>
                          <td style={{ padding: '12px 10px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: `${emp.color}15`, color: emp.color, fontWeight: '700', fontSize: '0.72rem' }}>{emp.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          ) : activeTab === 'config' ? (
            // ==========================================
            // PLATFORM SCORING CONFIG
            // ==========================================
            (() => {
              const ALL_ROLES = ['CTO', 'Admin', 'Regional Head', 'Senior Developer', 'Support Engineer', 'Employee', 'Intern'];
              const ALL_TABS_LIST = [
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'contacts', label: 'Contacts' },
                { id: 'companies', label: 'Companies' },
                { id: 'integrations', label: 'Integrations' },
                { id: 'projects', label: 'Workspace Projects' },
                { id: 'feature-matrix', label: 'Feature Matrix' },
                { id: 'api-playground', label: 'API Playground' },
                { id: 'flow', label: 'End-to-End Flow' },
                { id: 'architecture', label: 'Architecture' },
                { id: 'explorer', label: 'Normalization Explorer' },
                { id: 'challenges', label: 'Technical Challenges' },
                { id: 'dx', label: 'Developer Experience' },
                { id: 'roadmap', label: 'Future Roadmap' },
                { id: 'team', label: 'Team & Ownership' },
                { id: 'enterprise', label: 'Enterprise Specs' },
                { id: 'docs', label: 'Documentation' },
                { id: 'logs', label: 'Request Logs' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'erp-inventory', label: 'ERP: Inventory' },
                { id: 'erp-finance', label: 'ERP: Finance' },
                { id: 'erp-hr', label: 'ERP: Human Resources' },
                { id: 'erp-orders', label: 'ERP: Order Queue' }
              ];

              const toggleTabForRole = (role, tabId) => {
                const current = roleTabConfigs[role] || [];
                const updated = current.includes(tabId)
                  ? current.filter(id => id !== tabId)
                  : [...current, tabId];
                setRoleTabConfigs({
                  ...roleTabConfigs,
                  [role]: updated
                });
              };

              const handleSaveConfig = () => {
                localStorage.setItem('unified_role_configs', JSON.stringify(roleTabConfigs));
                showToast('✅ Scoping matrix policy updated and applied successfully!');
              };

              return (
                <div style={{ background: 'rgba(13,17,23,0.3)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ color: '#e6edf3', fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>RBAC Scoping Matrix Policy</h3>
                      <p style={{ color: '#8b949e', fontSize: '0.78rem', margin: '4px 0 0' }}>Configure feature tab accessibility for each individual enterprise role scope.</p>
                    </div>
                    <button onClick={handleSaveConfig} style={{
                      padding: '8px 16px', background: 'linear-gradient(135deg, #1f6feb 0%, #8b5cf6 100%)',
                      border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer'
                    }}>
                      Save Scoping Policy
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid rgba(48,54,61,0.4)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(13,17,23,0.6)', borderBottom: '1px solid rgba(48,54,61,0.6)' }}>
                          <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: '700', width: '220px' }}>Sidebar Option</th>
                          {ALL_ROLES.map(role => (
                            <th key={role} style={{ padding: '12px 10px', color: '#8b949e', fontWeight: '700', textAlign: 'center', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{role}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ALL_TABS_LIST.map((t, idx) => (
                          <tr key={t.id} style={{
                            borderBottom: '1px solid rgba(48,54,61,0.3)',
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            transition: 'background 0.1s'
                          }}>
                            <td style={{ padding: '12px 16px', color: '#e6edf3', fontWeight: '600' }}>{t.label}</td>
                            {ALL_ROLES.map(role => {
                              const isChecked = (roleTabConfigs[role] || []).includes(t.id);
                              return (
                                <td key={role} style={{ padding: '12px 10px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleTabForRole(role, t.id)}
                                    style={{
                                      cursor: 'pointer',
                                      width: '15px',
                                      height: '15px',
                                      accentColor: '#1f6feb',
                                      background: 'rgba(7,9,14,0.6)',
                                      border: '1px solid rgba(48,54,61,0.8)'
                                    }}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()

          ) : null}
        </div>

        {/* Confirm Disconnect Modal */}
        {showConfirmModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,14,20,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ background: '#0d1117', border: '1px solid rgba(248,81,73,0.4)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '1rem', fontWeight: '700' }}>Revoke connection?</h4>
              <p style={{ margin: 0, color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                Are you sure you want to disconnect <strong>{showConfirmModal.toUpperCase()}</strong>? This will delete all local contacts and companies synced under this provider workspace.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowConfirmModal(null)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.5)', color: '#8b949e', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDisconnect} style={{ padding: '8px 16px', background: '#f85149', border: 'none', color: 'white', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Disconnect</button>
              </div>
            </div>
          </div>
        )}

        {/* Platform Credential Setup Modal (CTO & User Credentials Form) */}
        {credentialModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(5,7,10,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#161b22', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔐 Connect {credentialModal.displayName}
                </h3>
                <button onClick={() => setCredentialModal(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <p style={{ margin: '0 0 20px', color: '#8b949e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                Enter your company's <strong>{credentialModal.displayName}</strong> account User ID and API key. These credentials will be authorized and securely registered into the encrypted tenant vault.
              </p>
              <form onSubmit={submitPlatformCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#c9d1d9', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px' }}>Account / User ID *</label>
                  <input type="text" placeholder={`e.g. ${credentialModal.provider}_usr_${Math.floor(1000 + Math.random() * 9000)}`}
                    value={credentialModal.accountUserId} onChange={e => setCredentialModal({ ...credentialModal, accountUserId: e.target.value })}
                    required style={{ width: '100%', padding: '10px 14px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#c9d1d9', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px' }}>API Key / Secret Token *</label>
                  <input type="password" placeholder="pat-live-xxxxxxxx-xxxx"
                    value={credentialModal.apiKey} onChange={e => setCredentialModal({ ...credentialModal, apiKey: e.target.value })}
                    required style={{ width: '100%', padding: '10px 14px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: '0.75rem', marginBottom: '6px' }}>Portal Domain / URL (Optional)</label>
                  <input type="text" placeholder={`https://company.${credentialModal.provider}.com`}
                    value={credentialModal.portalDomain} onChange={e => setCredentialModal({ ...credentialModal, portalDomain: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(5,7,10,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '8px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setCredentialModal(null)} style={{ flex: 1, padding: '10px', background: 'rgba(33,38,45,0.6)', border: '1px solid rgba(48,54,61,0.8)', color: '#c9d1d9', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #1f6feb, #8b5cf6)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 16px rgba(31,111,235,0.3)' }}>Submit &amp; Connect</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: toast.type === 'success' ? '#1f6feb' : toast.type === 'info' ? '#8b5cf6' : '#f85149',
            color: 'white', padding: '12px 20px', borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: '0.84rem',
            fontWeight: '700', zIndex: 1002, display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle size={15} />
            {toast.message}
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '56px', textAlign: 'center', borderTop: '1px solid rgba(48,54,61,0.4)', paddingTop: '28px' }}>
          <p style={{ color: '#484f58', fontSize: '0.78rem', margin: 0 }}>
            Powered by Universal API · <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>API Docs ↗</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
