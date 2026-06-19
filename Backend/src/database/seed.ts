// Database seed script — populates dev data

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('Password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@unifiedcrm.io' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@unifiedcrm.io',
      passwordHash,
    },
  });
  console.log(`✅ User created: ${user.email}`);

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-seed-001' },
    update: {},
    create: {
      id: 'org-seed-001',
      name: 'Demo Organization',
      ownerId: user.id,
    },
  });
  console.log(`✅ Organization created: ${org.name}`);

  // Create org membership
  await prisma.orgMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'owner',
    },
  });

  // Seed mock contacts
  const contacts = [
    { name: 'John Doe', email: 'john.doe@example.com', phone: '+1-555-0101', jobTitle: 'CEO', provider: 'mock', externalId: 'mock-c-001' },
    { name: 'Jane Smith', email: 'jane.smith@techcorp.com', phone: '+1-555-0102', jobTitle: 'CTO', provider: 'hubspot', externalId: 'hs-c-001' },
    { name: 'Bob Johnson', email: 'bob.j@salesforce.io', phone: '+1-555-0103', jobTitle: 'VP Sales', provider: 'salesforce', externalId: 'sf-c-001' },
    { name: 'Alice Brown', email: 'alice@pipedrive.com', phone: '+1-555-0104', jobTitle: 'Account Manager', provider: 'pipedrive', externalId: 'pd-c-001' },
    { name: 'Charlie Wilson', email: 'charlie@example.org', phone: '+1-555-0105', jobTitle: 'Developer', provider: 'mock', externalId: 'mock-c-002' },
  ];

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { externalId_provider_organizationId: { externalId: contact.externalId, provider: contact.provider, organizationId: org.id } },
      update: {},
      create: { ...contact, organizationId: org.id },
    });
  }
  console.log(`✅ ${contacts.length} contacts seeded`);

  // Seed mock companies
  const companies = [
    { name: 'TechCorp Inc', website: 'https://techcorp.com', industry: 'Technology', size: '100-500', provider: 'mock', externalId: 'mock-co-001' },
    { name: 'HubSpot Partners', website: 'https://hubspot-partners.com', industry: 'Marketing', size: '50-100', provider: 'hubspot', externalId: 'hs-co-001' },
    { name: 'Salesforce Enterprise', website: 'https://enterprise.sf.com', industry: 'CRM', size: '1000+', provider: 'salesforce', externalId: 'sf-co-001' },
    { name: 'Pipedrive Deals', website: 'https://pipedrivedeals.io', industry: 'Sales', size: '10-50', provider: 'pipedrive', externalId: 'pd-co-001' },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { externalId_provider_organizationId: { externalId: company.externalId, provider: company.provider, organizationId: org.id } },
      update: {},
      create: { ...company, organizationId: org.id },
    });
  }
  console.log(`✅ ${companies.length} companies seeded`);

  console.log('🎉 Database seeded successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: admin@unifiedcrm.io');
  console.log('  Password: Password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
