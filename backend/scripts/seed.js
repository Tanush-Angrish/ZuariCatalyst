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
        role: 'Central Team',
        organization: null,
        password: 'password',
        title: 'Central Administrator'
      },
      {
        name: 'Org Admin',
        email: 'org.admin@adventz.com',
        role: 'Org Admin',
        organization: 'Simon',
        password: 'password',
        title: 'Organization Administrator'
      },
      {
        name: 'Demo Employee',
        email: 'employee@adventz.com',
        role: 'Employee',
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

    // 3. Seed hardcoded templates into IdeaTemplate table (one-time migration)
    const templateCount = await prisma.ideaTemplate.count();
    if (templateCount === 0) {
      console.log('No templates in DB — seeding from hardcoded definitions...');
      const { IDEA_TEMPLATES } = require('./template-seed-data');
      for (const t of IDEA_TEMPLATES) {
        await prisma.ideaTemplate.create({
          data: {
            id: t.id,
            category: t.category,
            name: t.name,
            description: t.description || '',
            fields: JSON.stringify(t.fields)
          }
        });
      }
      console.log(`Seeded ${IDEA_TEMPLATES.length} templates into database.`);
    } else {
      console.log(`Templates already in DB (${templateCount} found), skipping seed.`);
    }
  } catch (error) {
    console.error('Seed execution failed:', error);
  }
}

module.exports = runSeed;
