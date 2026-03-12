const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all users
router.get('/', (req, res) => {
  db.all('SELECT id, email, name, title, role, organization FROM users ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create single user
router.post('/', (req, res) => {
  const { name, title, email, role, organization } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const query = `INSERT INTO users (name, title, email, role, organization, password) VALUES (?, ?, ?, ?, ?, 'password')`;
  db.run(query, [name, title || '', email, role, organization || ''], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, title, email, role, organization });
  });
});

// POST bulk create users
router.post('/bulk', (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'An array of users is required' });
  }

  const errors = [];
  const successes = [];
  let processed = 0;

  const query = `INSERT INTO users (name, title, email, role, organization, password) VALUES (?, ?, ?, ?, ?, 'password')`;

  users.forEach((u, idx) => {
    if (!u.name || !u.email || !u.role) {
      errors.push({ row: idx + 1, error: 'Missing name, email, or role' });
      processed++;
      if (processed === users.length) {
        return res.json({ successes: successes.length, errors });
      }
      return;
    }

    db.run(query, [u.name, u.title || '', u.email, u.role, u.organization || ''], function(err) {
      processed++;
      if (err) {
        errors.push({ row: idx + 1, email: u.email, error: err.message.includes('UNIQUE') ? 'Duplicate email' : err.message });
      } else {
        successes.push({ id: this.lastID, email: u.email });
      }

      if (processed === users.length) {
        res.json({ successes: successes.length, errors });
      }
    });
  });
});

// PUT update user role
router.put('/:id/role', (req, res) => {
  const { role } = req.body;
  const validRoles = ['Employee', 'Org Admin', 'Superadmin'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be: Employee, Org Admin, or Central Team (Superadmin)' });
  }

  // Map "Central Team" display name to stored "Superadmin" if needed
  const dbRole = role === 'Central Team' ? 'Superadmin' : role;

  db.run('UPDATE users SET role = ? WHERE id = ?', [dbRole, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated' });
  });
});

// PUT update user details
router.put('/:id', (req, res) => {
  const { name, title, email, role, organization } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const dbRole = role === 'Central Team' ? 'Superadmin' : role;

  db.run(
    'UPDATE users SET name = ?, title = ?, email = ?, role = ?, organization = ? WHERE id = ?',
    [name, title || '', email, dbRole, organization || '', req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User updated' });
    }
  );
});

// DELETE user
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  });
});

module.exports = router;
