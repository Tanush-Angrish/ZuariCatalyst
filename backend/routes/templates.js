const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// ─── Template Access (must come BEFORE /:id routes) ────────────────────────

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

  if (!Array.isArray(mapping)) {
    return res.status(400).json({ error: 'mapping must be an array' });
  }

  try {
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

// ─── Template CRUD ─────────────────────────────────────────────────────────

// GET all templates (Unified response)
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.ideaTemplate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const masterTpl = templates.find(t => t.id === 'MASTER_TEMPLATE');
    if (masterTpl) {
      console.log('API: Master Template found with ID:', masterTpl.id);
    } else {
      console.warn('API: MASTER_TEMPLATE NOT FOUND in database!');
    }

    const masterFields = masterTpl ? JSON.parse(masterTpl.fields || '[]') : [];

    const specificTemplates = templates
      .filter(t => t.id !== 'MASTER_TEMPLATE')
      .map(t => ({
        ...t,
        fields: [...masterFields, ...JSON.parse(t.fields || '[]')]
      }));

    console.log(`API: Returning 1 master and ${specificTemplates.length} templates`);
    res.json({
      master: masterTpl ? { ...masterTpl, fields: masterFields } : null,
      templates: specificTemplates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create template
router.post('/', async (req, res) => {
  const { category, name, description, fields } = req.body;
  if (!category || !name) {
    return res.status(400).json({ error: 'category and name are required' });
  }
  try {
    const template = await prisma.ideaTemplate.create({
      data: {
        category,
        name,
        description: description || '',
        fields: JSON.stringify(fields || [])
      }
    });
    res.json({ ...template, fields: JSON.parse(template.fields) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update template
router.put('/:id', async (req, res) => {
  const { category, name, description, fields } = req.body;
  try {
    const template = await prisma.ideaTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(category && { category }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(fields && { fields: JSON.stringify(fields) })
      }
    });
    res.json({ ...template, fields: JSON.parse(template.fields) });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    res.status(500).json({ error: error.message });
  }
});

// DELETE template
router.delete('/:id', async (req, res) => {
  try {
    await prisma.ideaTemplate.delete({ where: { id: req.params.id } });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
