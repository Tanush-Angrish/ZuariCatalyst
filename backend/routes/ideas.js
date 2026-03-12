const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all ideas (For testing or general review)
router.get('/', (req, res) => {
  const query = `
    SELECT ideas.*, users.name as authorName 
    FROM ideas 
    JOIN users ON ideas.authorId = users.id
    ORDER BY ideas.createdAt DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET community hub ideas (Approved only)
router.get('/projects', (req, res) => {
  const query = `
    SELECT ideas.*, users.name as authorName 
    FROM ideas 
    JOIN users ON ideas.authorId = users.id
    WHERE ideas.status = 'Approved'
    ORDER BY ideas.createdAt DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET ideas for specific employee
router.get('/my-ideas/:userId', (req, res) => {
  const query = `
    SELECT * FROM ideas 
    WHERE authorId = ? 
    ORDER BY createdAt DESC
  `;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET pending ideas (For Superadmin)
router.get('/pending', (req, res) => {
  const query = `
    SELECT ideas.*, users.name as authorName 
    FROM ideas 
    JOIN users ON ideas.authorId = users.id
    WHERE ideas.status = 'Pending Review'
    ORDER BY ideas.createdAt DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET assigned ideas (For Org Admin)
router.get('/assigned/:userId', (req, res) => {
  const query = `
    SELECT ideas.*, users.name as authorName, users.organization as authorOrganization
    FROM ideas 
    JOIN users ON ideas.authorId = users.id
    WHERE ideas.assignedToId = ? AND ideas.status = 'Assigned to Org Admin'
    ORDER BY ideas.createdAt DESC
  `;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET team ideas (For Org Admin)
router.get('/team/:organization', (req, res) => {
  const query = `
    SELECT ideas.*, users.name as authorName, users.organization as authorOrganization
    FROM ideas 
    JOIN users ON ideas.authorId = users.id
    WHERE users.organization = ?
    ORDER BY ideas.createdAt DESC
  `;
  db.all(query, [req.params.organization], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST submit new idea (Employee)
router.post('/', (req, res) => {
  const { title, description, department, expectedImpact, supportingLink, authorId, extraFields } = req.body;
  if (!title || !description || !department || !expectedImpact || !authorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO ideas (title, description, department, expectedImpact, supportingLink, authorId, extraFields)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [title, description, department, expectedImpact, supportingLink, authorId, JSON.stringify(extraFields || {})], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, status: 'Pending Review' });
  });
});

// PUT assign idea (Superadmin)
router.put('/:id/assign', (req, res) => {
  const ideaId = req.params.id;
  const { assignedToId } = req.body;
  
  if (!assignedToId) {
    return res.status(400).json({ error: 'Org Admin ID to assign is required' });
  }

  const query = `
    UPDATE ideas 
    SET assignedToId = ?, status = 'Assigned to Org Admin' 
    WHERE id = ?
  `;
  db.run(query, [assignedToId, ideaId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Idea not found' });
    res.json({ message: 'Idea assigned successfully' });
  });
});

// PUT update status (Org Admin approve/reject)
router.put('/:id/status', (req, res) => {
  const ideaId = req.params.id;
  const { status } = req.body; // 'Approved' or 'Rejected'
  
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const query = `
    UPDATE ideas 
    SET status = ? 
    WHERE id = ?
  `;
  db.run(query, [status, ideaId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Idea not found' });
    res.json({ message: `Idea marked as ${status}` });
  });
});

// GET org admins (For Select Dropdown)
router.get('/orgadmins', (req, res) => {
  db.all("SELECT id, name FROM users WHERE role = 'Org Admin'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
