const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET form fields by form type ('user' or 'idea')
router.get('/:formType', (req, res) => {
  const { formType } = req.params;

  if (!['user', 'idea'].includes(formType)) {
    return res.status(400).json({ error: 'formType must be "user" or "idea"' });
  }

  db.all(
    'SELECT * FROM form_fields WHERE formType = ? ORDER BY sortOrder ASC',
    [formType],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      // Parse options JSON
      const fields = rows.map(r => ({
        ...r,
        options: JSON.parse(r.options || '[]'),
        required: r.required === 1,
        isSystem: r.isSystem === 1
      }));
      res.json(fields);
    }
  );
});

// POST add new field
router.post('/', (req, res) => {
  const { formType, fieldName, fieldLabel, fieldType, required, sortOrder, options } = req.body;

  if (!formType || !fieldName || !fieldLabel || !fieldType) {
    return res.status(400).json({ error: 'formType, fieldName, fieldLabel, and fieldType are required' });
  }

  const query = `INSERT INTO form_fields (formType, fieldName, fieldLabel, fieldType, required, sortOrder, options, isSystem) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;
  db.run(
    query,
    [formType, fieldName, fieldLabel, fieldType, required ? 1 : 0, sortOrder || 999, JSON.stringify(options || [])],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, fieldName, fieldLabel, fieldType });
    }
  );
});

// PUT update a field
router.put('/:id', (req, res) => {
  const { fieldLabel, fieldType, required, options } = req.body;

  if (!fieldLabel || !fieldType) {
    return res.status(400).json({ error: 'fieldLabel and fieldType are required' });
  }

  db.run(
    'UPDATE form_fields SET fieldLabel = ?, fieldType = ?, required = ?, options = ? WHERE id = ?',
    [fieldLabel, fieldType, required ? 1 : 0, JSON.stringify(options || []), req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Field not found' });
      res.json({ message: 'Field updated' });
    }
  );
});

// PUT reorder fields
router.put('/reorder/:formType', (req, res) => {
  const { fieldOrder } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(fieldOrder)) {
    return res.status(400).json({ error: 'fieldOrder array required' });
  }

  let processed = 0;
  let hadError = false;

  fieldOrder.forEach(({ id, sortOrder }) => {
    db.run('UPDATE form_fields SET sortOrder = ? WHERE id = ?', [sortOrder, id], (err) => {
      processed++;
      if (err) hadError = true;
      if (processed === fieldOrder.length) {
        if (hadError) return res.status(500).json({ error: 'Some updates failed' });
        res.json({ message: 'Reorder complete' });
      }
    });
  });
});

// DELETE a field (only non-system fields)
router.delete('/:id', (req, res) => {
  db.get('SELECT isSystem FROM form_fields WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Field not found' });
    if (row.isSystem === 1) return res.status(403).json({ error: 'System fields cannot be deleted' });

    db.run('DELETE FROM form_fields WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Field deleted' });
    });
  });
});

module.exports = router;
