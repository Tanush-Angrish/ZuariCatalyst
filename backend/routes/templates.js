const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { generateTemplateFromPrompt } = require('../services/geminiService');

// ─── Helper: Apply field order ──────────────────────────────────────────────
// Given a combined list of fields and an ordered array of field IDs,
// return fields sorted to match fieldOrder. Any fields not in fieldOrder
// are appended at the end in their original order.
function applyFieldOrder(fields, fieldOrder) {
  if (!fieldOrder || fieldOrder.length === 0) return fields;
  const orderMap = {};
  fieldOrder.forEach((id, i) => { orderMap[id] = i; });
  const inOrder = [];
  const notInOrder = [];
  fields.forEach(f => {
    if (orderMap[f.id] !== undefined) {
      inOrder.push({ field: f, idx: orderMap[f.id] });
    } else {
      notInOrder.push(f);
    }
  });
  inOrder.sort((a, b) => a.idx - b.idx);
  return [...inOrder.map(x => x.field), ...notInOrder];
}

// ─── Template Access (must come BEFORE /:id routes) ─────────────────────────

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
    res.json(orgs.map(o => o.organization));
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
          where: { templateId_organization: { templateId, organization } },
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

// ─── Template CRUD ────────────────────────────────────────────────────────────

// GET all templates (Unified response)
// Returns master template and all specific templates with fields in configured order
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.ideaTemplate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const masterTpl = templates.find(t => t.id === 'MASTER_TEMPLATE');
    if (masterTpl) {
      console.log('API: Master Template found:', masterTpl.id);
    } else {
      console.warn('API: MASTER_TEMPLATE NOT FOUND in database!');
    }

    const masterFields = masterTpl ? JSON.parse(masterTpl.fields || '[]') : [];

    const specificTemplates = templates
      .filter(t => t.id !== 'MASTER_TEMPLATE')
      .map(t => {
        const templateFields = JSON.parse(t.fields || '[]');
        const templateFieldOrder = JSON.parse(t.fieldOrder || '[]');
        const templateFieldIds = new Set(templateFields.map(f => f.id));

        // Merge: global fields not already in template + template-specific fields
        const uniqueMasterFields = masterFields.filter(f => !templateFieldIds.has(f.id));
        const combined = [...uniqueMasterFields, ...templateFields];

        // Apply saved field order if available
        const ordered = applyFieldOrder(combined, templateFieldOrder);
        return { ...t, fields: ordered, fieldOrder: templateFieldOrder };
      });

    console.log(`API: Returning 1 master and ${specificTemplates.length} templates`);
    res.json({
      master: masterTpl
        ? { ...masterTpl, fields: masterFields, fieldOrder: JSON.parse(masterTpl.fieldOrder || '[]') }
        : null,
      templates: specificTemplates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create template
// Auto-includes all current global fields in fieldOrder (globals first)
router.post('/', async (req, res) => {
  const { category, name, description, fields, fieldOrder } = req.body;
  if (!category || !name) {
    return res.status(400).json({ error: 'category and name are required' });
  }
  try {
    // If no fieldOrder provided, default to [globalFieldIds..., templateFieldIds...]
    let resolvedOrder = fieldOrder;
    if (!resolvedOrder || resolvedOrder.length === 0) {
      const masterTpl = await prisma.ideaTemplate.findUnique({ where: { id: 'MASTER_TEMPLATE' } });
      const masterFields = masterTpl ? JSON.parse(masterTpl.fields || '[]') : [];
      const templateFieldIds = (fields || []).map(f => f.id);
      const masterFieldIds = masterFields.map(f => f.id);
      // Global first, then template-specific (no duplicates)
      const uniqueTemplateIds = templateFieldIds.filter(id => !masterFieldIds.includes(id));
      resolvedOrder = [...masterFieldIds, ...uniqueTemplateIds];
    }

    const template = await prisma.ideaTemplate.create({
      data: {
        category,
        name,
        description: description || '',
        fields: JSON.stringify(fields || []),
        fieldOrder: JSON.stringify(resolvedOrder)
      }
    });
    res.json({
      ...template,
      fields: JSON.parse(template.fields),
      fieldOrder: JSON.parse(template.fieldOrder)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update template (including fieldOrder)
router.put('/:id', async (req, res) => {
  const { category, name, description, fields, fieldOrder } = req.body;
  const templateId = req.params.id;

  try {
    // ── Special handling for Master Template updates ──────────────────────────
    if (templateId === 'MASTER_TEMPLATE') {
      // Find old master fields to diff against
      const existingMaster = await prisma.ideaTemplate.findUnique({ where: { id: 'MASTER_TEMPLATE' } });
      const oldFields = existingMaster ? JSON.parse(existingMaster.fields || '[]') : [];
      const newFields = fields || [];

      const oldIds = new Set(oldFields.map(f => f.id));
      const newIds = new Set(newFields.map(f => f.id));

      // Which IDs were removed or added?
      const removedIds = [...oldIds].filter(id => !newIds.has(id));
      const addedIds = [...newIds].filter(id => !oldIds.has(id));

      // Update master template
      const updatedMaster = await prisma.ideaTemplate.update({
        where: { id: 'MASTER_TEMPLATE' },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          fields: JSON.stringify(newFields)
        }
      });

      // Propagate field order changes to all other templates
      if (removedIds.length > 0 || addedIds.length > 0) {
        const allTemplates = await prisma.ideaTemplate.findMany({
          where: { id: { not: 'MASTER_TEMPLATE' } }
        });

        await prisma.$transaction(
          allTemplates.map(t => {
            let order = JSON.parse(t.fieldOrder || '[]');
            // Remove deleted global fields from order
            if (removedIds.length > 0) {
              order = order.filter(id => !removedIds.includes(id));
            }
            // Add newly added global fields at the beginning (before template-specific fields)
            if (addedIds.length > 0) {
              // Prepend new global field IDs that aren't already there
              const existingSet = new Set(order);
              const toAdd = addedIds.filter(id => !existingSet.has(id));
              // Add at the front (before any template-specific fields)
              const templateSpecificIds = order.filter(id => !newIds.has(id));
              const globalIds = [...newIds].filter(id => order.includes(id) || toAdd.includes(id));
              order = [...globalIds.filter(id => !removedIds.includes(id)), ...templateSpecificIds];
            }
            return prisma.ideaTemplate.update({
              where: { id: t.id },
              data: { fieldOrder: JSON.stringify(order) }
            });
          })
        );
      }

      return res.json({
        ...updatedMaster,
        fields: JSON.parse(updatedMaster.fields),
        fieldOrder: JSON.parse(updatedMaster.fieldOrder || '[]')
      });
    }

    // ── Normal template update ────────────────────────────────────────────────
    const updateData = {
      ...(category && { category }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(fields !== undefined && { fields: JSON.stringify(fields) }),
      ...(fieldOrder !== undefined && { fieldOrder: JSON.stringify(fieldOrder) })
    };

    const template = await prisma.ideaTemplate.update({
      where: { id: templateId },
      data: updateData
    });

    res.json({
      ...template,
      fields: JSON.parse(template.fields),
      fieldOrder: JSON.parse(template.fieldOrder || '[]')
    });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT update only the field order for a template (lightweight drag-and-drop save)
router.put('/:id/field-order', async (req, res) => {
  const { fieldOrder } = req.body;
  if (!Array.isArray(fieldOrder)) {
    return res.status(400).json({ error: 'fieldOrder must be an array' });
  }
  try {
    const template = await prisma.ideaTemplate.update({
      where: { id: req.params.id },
      data: { fieldOrder: JSON.stringify(fieldOrder) }
    });
    res.json({
      ...template,
      fields: JSON.parse(template.fields),
      fieldOrder: JSON.parse(template.fieldOrder)
    });
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

// ─── AI Template Generation ──────────────────────────────────────────────────

// POST /api/templates/generate — Generate template fields from a prompt (Superadmin only)
router.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  try {
    const result = await generateTemplateFromPrompt(prompt.trim());
    if (!result) {
      return res.status(500).json({ error: 'AI could not generate a template. Try a more detailed prompt.' });
    }
    res.json(result);
  } catch (error) {
    console.error('[Templates] AI generation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Template Categories CRUD ─────────────────────────────────────────────────

// GET /api/templates/categories — list all categories
router.get('/categories', async (req, res) => {
  try {
    const cats = await prisma.templateCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(cats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/templates/categories — create category
router.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const normalized = name.trim().toUpperCase();
  try {
    const cat = await prisma.templateCategory.create({ data: { name: normalized } });
    res.json(cat);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/templates/categories/:id — rename category
router.put('/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const normalized = name.trim().toUpperCase();
  try {
    // Read old name FIRST
    const existing = await prisma.templateCategory.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });
    const oldName = existing.name;

    // Update the category record
    const cat = await prisma.templateCategory.update({ where: { id }, data: { name: normalized } });

    // Propagate rename to all templates that use the old category name
    await prisma.ideaTemplate.updateMany({ where: { category: oldName }, data: { category: normalized } });

    res.json(cat);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Category name already exists' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Category not found' });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/templates/categories/:id — delete category
router.delete('/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.templateCategory.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Category not found' });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

