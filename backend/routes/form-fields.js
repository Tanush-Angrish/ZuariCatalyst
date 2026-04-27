const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

// All form-field endpoints require authentication
router.use(authMiddleware);


// GET form fields by form type ('user' or 'idea')
router.get('/:formType', async (req, res) => {
  const { formType } = req.params;

  if (!['user', 'idea'].includes(formType)) {
    return res.status(400).json({ error: 'formType must be "user" or "idea"' });
  }

  try {
    const fields = await prisma.formField.findMany({
      where: { formType },
      orderBy: { sortOrder: 'asc' }
    });
    // Parse options from string to JSON array for frontend
    const formatted = fields.map(f => ({
      ...f,
      options: JSON.parse(f.options || '[]')
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new field
router.post('/', async (req, res) => {
  const { formType, fieldName, fieldLabel, fieldType, required, sortOrder, options } = req.body;

  if (!formType || !fieldName || !fieldLabel || !fieldType) {
    return res.status(400).json({ error: 'formType, fieldName, fieldLabel, and fieldType are required' });
  }

  try {
    const field = await prisma.formField.create({
      data: {
        formType,
        fieldName,
        fieldLabel,
        fieldType,
        required: !!required,
        sortOrder: sortOrder || 999,
        options: JSON.stringify(options || []),
        isSystem: false
      }
    });
    res.json({ id: field.id, fieldName, fieldLabel, fieldType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a field
router.put('/:id', async (req, res) => {
  const { fieldLabel, fieldType, required, options } = req.body;

  if (!fieldLabel || !fieldType) {
    return res.status(400).json({ error: 'fieldLabel and fieldType are required' });
  }

  try {
    await prisma.formField.update({
      where: { id: parseInt(req.params.id) },
      data: {
        fieldLabel,
        fieldType,
        required: !!required,
        options: JSON.stringify(options || [])
      }
    });
    res.json({ message: 'Field updated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Field not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT reorder fields
router.put('/reorder/:formType', async (req, res) => {
  const { fieldOrder } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(fieldOrder)) {
    return res.status(400).json({ error: 'fieldOrder array required' });
  }

  try {
    // Prisma transaction for batch updating sort orders
    await prisma.$transaction(
      fieldOrder.map((item) =>
        prisma.formField.update({
          where: { id: parseInt(item.id) },
          data: { sortOrder: item.sortOrder }
        })
      )
    );
    res.json({ message: 'Reorder complete' });
  } catch (error) {
    res.status(500).json({ error: 'Some updates failed', details: error.message });
  }
});

// DELETE a field (only non-system fields)
router.delete('/:id', async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    const field = await prisma.formField.findUnique({ where: { id: fieldId } });
    
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (field.isSystem) return res.status(403).json({ error: 'System fields cannot be deleted' });

    await prisma.formField.delete({ where: { id: fieldId } });
    res.json({ message: 'Field deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
