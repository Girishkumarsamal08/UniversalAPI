// Provider Registry — Resolves the correct adapter for a given provider name

import { CRMProvider } from './crm.provider.interface';
import { MockAdapter } from './mock.adapter';
import { HubSpotAdapter } from './hubspot.adapter';
import { SalesforceAdapter } from './salesforce.adapter';
import { PipedriveAdapter } from './pipedrive.adapter';
import { ZohoAdapter } from './zoho.adapter';
import { SlackAdapter } from './slack.adapter';
import { TeamsAdapter } from './teams.adapter';
import { GmailAdapter } from './gmail.adapter';
import { OutlookAdapter } from './outlook.adapter';
import { GoogleCalendarAdapter } from './google-calendar.adapter';
import { OutlookCalendarAdapter } from './outlook-calendar.adapter';
import { CalendlyAdapter } from './calendly.adapter';
import { NotionAdapter } from './notion.adapter';
import prisma from '../database/prisma.client';

export const getProviderAdapter = async (
  providerName: string,
  userId: string
): Promise<CRMProvider> => {
  const p = (providerName || 'mock').toLowerCase();

  if (p === 'mock') {
    return new MockAdapter();
  }

  try {
    // Look up OAuth token from DB
    const connection = await prisma.integration.findUnique({
      where: {
        userId_provider: { userId, provider: p },
      },
    });

    const token = connection?.accessToken || '';

    switch (p) {
      case 'hubspot':
        return new HubSpotAdapter(token);
      case 'salesforce':
        return new SalesforceAdapter(token);
      case 'pipedrive':
        return new PipedriveAdapter(token);
      case 'zoho':
        return new ZohoAdapter(token);
      case 'slack':
        return new SlackAdapter(token);
      case 'teams':
        return new TeamsAdapter(token);
      case 'gmail':
        return new GmailAdapter(token);
      case 'outlook_mail':
        return new OutlookAdapter(token);
      case 'google_calendar':
        return new GoogleCalendarAdapter(token);
      case 'outlook_calendar':
        return new OutlookCalendarAdapter(token);
      case 'calendly':
        return new CalendlyAdapter(token);
      case 'notion':
        return new NotionAdapter(token);
    }
  } catch (err) {
    // DB or lookup error fallback
  }

  // Graceful fallback adapter so no route crashes
  return new MockAdapter();
};

export const SUPPORTED_PROVIDERS = [
  'hubspot',
  'salesforce',
  'pipedrive',
  'zoho',
  'slack',
  'teams',
  'gmail',
  'outlook_mail',
  'google_calendar',
  'outlook_calendar',
  'calendly',
  'notion',
  'mock',
] as const;
