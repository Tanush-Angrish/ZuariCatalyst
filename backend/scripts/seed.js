const prisma = require('../db/prisma');

async function runSeed() {
  console.log('Seed check started');

  try {
    // 1. Scrub existing "Global" organizations to null
    const updatedGlobal = await prisma.user.updateMany({
      where: { organization: 'Global' },
      data: { organization: null }
    });
    if (updatedGlobal.count > 0) {
      console.log(`Updated ${updatedGlobal.count} users from 'Global' to null organization.`);
    }

    // 2. Ensure critical users exist
    const criticalUsers = [
      {
        name: 'Central Admin',
        email: 'central.admin@adventz.com',
        role: 'Superadmin',
        roles: JSON.stringify(['Superadmin', 'Org Admin', 'Employee']),
        organization: null,
        password: 'password',
        title: 'Central Administrator'
      },
      {
        name: 'Org Admin',
        email: 'org.admin@adventz.com',
        role: 'Org Admin',
        roles: JSON.stringify(['Org Admin', 'Employee']),
        organization: 'Simon',
        password: 'password',
        title: 'Organization Administrator'
      },
      {
        name: 'Demo Employee',
        email: 'employee@adventz.com',
        role: 'Employee',
        roles: JSON.stringify(['Employee']),
        organization: 'Simon',
        password: 'password',
        title: 'Staff'
      }
    ];

    for (const user of criticalUsers) {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        console.log(`${user.name} exists`);
        // If it's a central team user, ensure org is null in case it was set incorrectly earlier
        if (existing.role === 'Central Team' && existing.organization !== null) {
          await prisma.user.update({
            where: { email: existing.email },
            data: { organization: null }
          });
          console.log(`Forced ${user.name} organization to null`);
        }
      } else {
        await prisma.user.create({ data: user });
        console.log(`${user.name} created`);
      }
    }

    // 3. Template seeding — DISABLED (templates already exist in prod DB)
    // To re-enable, uncomment the block below.
    /*
    const { IDEA_TEMPLATES } = require('./template-seed-data');
    const masterTpl = IDEA_TEMPLATES.find(t => t.id === 'MASTER_TEMPLATE');
    const masterFieldIds = masterTpl ? masterTpl.fields.map(f => f.id) : [];

    for (const t of IDEA_TEMPLATES) {
      const existingTpl = await prisma.ideaTemplate.findUnique({ where: { id: t.id } });
      if (!existingTpl) {
        const fieldOrder = t.id === 'MASTER_TEMPLATE'
          ? masterFieldIds
          : [...masterFieldIds, ...t.fields.map(f => f.id).filter(id => !masterFieldIds.includes(id))];

        await prisma.ideaTemplate.create({
          data: {
            id: t.id,
            category: t.category,
            name: t.name,
            description: t.description || '',
            fields: JSON.stringify(t.fields),
            fieldOrder: JSON.stringify(fieldOrder)
          }
        });
        console.log(`Seeded missing template: ${t.name}`);
      }
    }
    console.log('Template seed check complete.');

    // 4. Category sync — DISABLED (categories already exist in prod DB)
    const allExistingTemplates = await prisma.ideaTemplate.findMany({
      where: { id: { not: 'MASTER_TEMPLATE' } },
      select: { category: true }
    });
    const categorySet = new Set([
      ...IDEA_TEMPLATES.filter(t => t.id !== 'MASTER_TEMPLATE').map(t => t.category),
      ...allExistingTemplates.map(t => t.category)
    ].filter(c => c && c.toUpperCase() !== 'GLOBAL'));

    for (const name of categorySet) {
      const normalized = name.trim().toUpperCase();
      const existing = await prisma.templateCategory.findUnique({ where: { name: normalized } });
      if (!existing) {
        await prisma.templateCategory.create({ data: { name: normalized } });
        console.log(`Seeded category: ${normalized}`);
      }
    }
    console.log('Category sync complete.');
    */

  } catch (error) {
    console.error('Seed execution failed:', error);
  }
}

module.exports = runSeed;
