const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const ALLOWED_DOMAIN = '@adventz.com';
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Azure AD JWKS Client
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

/**
 * Signs a JWT with the user object and sets it as an httpOnly cookie.
 * The cookie is: httpOnly (JS can't read it), Secure in prod (HTTPS only),
 * SameSite=Lax (safe for same-origin + top-level nav), expires in 8h.
 */
function issueToken(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, organization: user.organization },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('auth_token', token, {
    httpOnly: true,                                           // invisible to JavaScript
    secure: process.env.NODE_ENV === 'production',           // HTTPS only in production
    sameSite: 'lax',                                         // safe for same-origin requests
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/'
  });
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Called by frontend on every page load to restore session from cookie.
// Returns the current user if the cookie is valid, 401 otherwise.
router.get('/me', (req, res) => {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('auth_token='));
  const token = match ? match.trim().slice('auth_token='.length) : null;

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      user: {
        id: decoded.id, email: decoded.email, name: decoded.name,
        role: decoded.role, organization: decoded.organization
      }
    });
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Clears the auth cookie. Frontend should clear its user state after this.
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Password login (legacy — will be removed once all users are on Outlook SSO)
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return res.status(403).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
  }

  try {
    const row = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!row) return res.status(404).json({ error: 'User not found. Contact your administrator.' });
    if (row.password !== password) return res.status(401).json({ error: 'Invalid password' });
    if (!row.role) return res.status(403).json({ error: 'No role assigned. Contact your administrator.' });

    const user = { id: row.id, email: row.email, name: row.name, title: row.title, role: row.role, organization: row.organization };
    issueToken(res, user);
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
});

// ─── POST /api/auth/ms-login ──────────────────────────────────────────────────
// Microsoft SSO login — verifies Azure AD token, issues our own JWT cookie
router.post('/ms-login', (req, res) => {
  const { idToken } = req.body;

  if (!idToken) return res.status(400).json({ error: 'Missing token' });

  jwt.verify(idToken, getKey, {
    audience: process.env.AZURE_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`
  }, async (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(401).json({ error: 'Invalid Microsoft token' });
    }

    const email = decoded.preferred_username || decoded.email;
    if (!email) return res.status(400).json({ error: 'Email claim missing from token' });

    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return res.status(403).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
    }

    try {
      const row = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

      if (!row) {
        return res.status(404).json({ error: 'Your Microsoft account does not have a registered profile in Zuari Catalyst. Contact Central Team.' });
      }
      if (!row.role) {
        return res.status(403).json({ error: 'No role assigned. Contact your administrator.' });
      }

      const user = { id: row.id, email: row.email, name: row.name, title: row.title, role: row.role, organization: row.organization };
      issueToken(res, user);
      res.json({ user });
    } catch (dbError) {
      console.error('SSO Database error:', dbError);
      return res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
  });
});

module.exports = router;
