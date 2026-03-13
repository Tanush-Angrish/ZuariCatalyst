const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// GET all template access records
router.get('/access', async (req, res) => {
  try {
    const accessRecords = await prisma.templateAccess.findMany();
    res.json(accessRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET unique organizations from Users table
router.get('/organizations', async (req, res) => {
  try {
    // Note: Prisma distinct doesn't support grouping in the same way for simple lists sometimes, 
    // so we can use findMany with distinct and select to get a unique list of non-null organizations.
    const orgs = await prisma.user.findMany({
      where: {
        organization: { 
          not: null, 
          notIn: ['', 'Global'] 
        }
      },
      select: { organization: true },
      distinct: ['organization'],
      orderBy: { organization: 'asc' }
    });
    
    const orgList = orgs.map(o => o.organization);
    res.json(orgList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT bulk update template access records
router.put('/access', async (req, res) => {
  const { mapping } = req.body; 
  // mapping should be an array of: { templateId: string, organization: string, hasAccess: boolean }

  if (!Array.isArray(mapping)) {
    return res.status(400).json({ error: 'mapping must be an array' });
  }

  try {
    // We execute upserts in a transaction to safely handle the unique constraint
    await prisma.$transaction(
      mapping.map(({ templateId, organization, hasAccess }) => 
        prisma.templateAccess.upsert({
          where: {
            templateId_organization: {
              templateId,
              organization
            }
          },
          update: { hasAccess },
          create: { templateId, organization, hasAccess }
        })
      )
    );
    res.json({ message: 'Template access updated successfully' });
  } catch (error) {
    console.error('Template Access Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
