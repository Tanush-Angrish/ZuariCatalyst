const express = require('express');
const router = express.Router();
const db = require('../db/database');

const ALLOWED_DOMAIN = '@adventz.com';

// Login Route - validates domain, email, and password
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Domain validation
  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return res.status(403).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'User not found. Contact your administrator.' });
    }

    // Password validation
    if (row.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Role check
    if (!row.role) {
      return res.status(403).json({ error: 'No role assigned. Contact your administrator.' });
    }

    res.json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        title: row.title,
        role: row.role,
        organization: row.organization
      }
    });
  });
});

module.exports = router;
