const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const ALLOWED_DOMAIN = '@adventz.com';

// Azure AD JWKS Client
const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/7b00a15b-93dc-4b6a-8bce-06909dcecf35/discovery/v2.0/keys'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Login Route - validates domain, email, and password
router.post('/login', async (req, res) => {
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

  try {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
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
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Microsoft SSO Login Route
router.post('/ms-login', (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Missing token' });
  }

  // Verify token signature against Azure AD public keys
  jwt.verify(idToken, getKey, {
    audience: '15a5c8f7-6848-46df-8b1c-500a906cab56',
    issuer: 'https://login.microsoftonline.com/7b00a15b-93dc-4b6a-8bce-06909dcecf35/v2.0'
  }, async (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(401).json({ error: 'Invalid Microsoft token' });
    }

    // Extract reliable email claim (often preferred_username in v2 tokens)
    const email = decoded.preferred_username || decoded.email;

    if (!email) {
      return res.status(400).json({ error: 'Email claim missing from token' });
    }

    // Domain validation
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return res.status(403).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
    }

    try {
      // Find matching user in database to pull roles
      const row = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      if (!row) {
        return res.status(404).json({ error: 'Your Microsoft account does not have a registered profile in Zuari Hive. Contact Central Team.' });
      }

      if (!row.role) {
        return res.status(403).json({ error: 'No role assigned. Contact your administrator.' });
      }

      // Login successful
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
    } catch (dbError) {
      console.error('SSO Database error:', dbError);
      return res.status(500).json({ error: 'Database error during SSO' });
    }
  });
});

module.exports = router;
