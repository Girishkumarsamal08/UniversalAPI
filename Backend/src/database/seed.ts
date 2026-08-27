// Database seed script — populates dev data with all roles & fresh initial state
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing old test data and seeding database...');

  // Reset existing tokens and logs for a clean fresh state
  await prisma.refreshToken.deleteMany({}).catch(() => {});
  await prisma.approvalRequest.deleteMany({}).catch(() => {});

  const passwordHash = await bcrypt.hash('UnifiedCRM2026!Secured', 12);

  // Seed demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-seed-001' },
    update: { name: 'Acme Global Enterprise' },
    create: {
      id: 'org-seed-001',
      name: 'Acme Global Enterprise',
      domain: 'unifiedcrm.io',
      ownerId: 'seed-user-cto',
    },
  });
  console.log(`✅ Organization ready: ${org.name}`);

  // Seed users for ALL roles
  const usersToSeed = [
    { id: 'seed-user-girish-main', name: 'Girish Kumar Samal', email: 'biswajitasamal8342@gmail.com', role: 'CTO', dept: 'Engineering' },
    { id: 'seed-user-cto', name: 'Girish Kumar Samal', email: 'cto@unifiedcrm.io', role: 'CTO', dept: 'Engineering' },
    { id: 'seed-user-ceo', name: 'Alexander Vance', email: 'ceo@unifiedcrm.io', role: 'CEO', dept: 'Executive' },
    { id: 'seed-user-admin', name: 'Admin User', email: 'admin@unifiedcrm.io', role: 'Admin', dept: 'Operations' },
    { id: 'seed-user-rhead', name: 'Marcus Brody', email: 'regional.head@unifiedcrm.io', role: 'Regional Head', dept: 'Strategy' },
    { id: 'seed-user-mgr', name: 'Sophia Martinez', email: 'manager@unifiedcrm.io', role: 'Manager', dept: 'Product Management' },
    { id: 'seed-user-sdev', name: 'Swayamsuchee Mohanty', email: 'senior.dev@unifiedcrm.io', role: 'Senior Developer', dept: 'Core Backend' },
    { id: 'seed-user-supp', name: 'Rohan Verma', email: 'support@unifiedcrm.io', role: 'Support Engineer', dept: 'Technical Support' },
    { id: 'seed-user-sales', name: 'David Miller', email: 'sales@unifiedcrm.io', role: 'Sales Lead', dept: 'Business Development' },
    { id: 'seed-user-client', name: 'Client Account Manager', email: 'client@unifiedcrm.io', role: 'Client', dept: 'Partner Relations' },
    { id: 'seed-user-emp', name: 'Jordan Hayes', email: 'employee@unifiedcrm.io', role: 'Employee', dept: 'Software Quality' },
    { id: 'seed-user-intern', name: 'Lucas Scott', email: 'intern@unifiedcrm.io', role: 'Intern', dept: 'Engineering' },
  ];

  for (const u of usersToSeed) {
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.dept,
        status: 'APPROVED',
        passwordHash,
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.dept,
        status: 'APPROVED',
        passwordHash,
      },
    });

    await prisma.orgMember.upsert({
      where: { userId_organizationId: { userId: dbUser.id, organizationId: org.id } },
      update: { role: u.role === 'CTO' || u.role === 'CEO' || u.role === 'Admin' ? 'owner' : 'member' },
      create: {
        userId: dbUser.id,
        organizationId: org.id,
        role: u.role === 'CTO' || u.role === 'CEO' || u.role === 'Admin' ? 'owner' : 'member',
      },
    });
    console.log(`✅ Seeded role account: ${u.role} (${u.email})`);
  }

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

  console.log('🎉 Database reseeded successfully with ALL roles!');
  console.log('\nDefault Password for all seeded accounts: UnifiedCRM2026!Secured');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
