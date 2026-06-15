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
 * Derives the full roles array from the primary role.
 * Org Admin and Central Team (Superadmin) automatically also have Employee access.
 */
function deriveRoles(primaryRole) {
  if (primaryRole === 'Org Admin') return ['Org Admin', 'Employee'];
  if (primaryRole === 'Superadmin') return ['Superadmin', 'Employee'];
  return ['Employee'];
}

/**
 * Given a roles array, returns the highest-privilege role.
 * Hierarchy: Superadmin > Org Admin > Employee
 *
 * Used ONLY on fresh logins (/login, /ms-login) so that a user who
 * switched roles and then closed the browser always comes back at
 * their highest-privilege level next time they log in.
 *
 * NOT used on /me — /me respects whatever role is currently active
 * so that in-session role switching continues to work.
 */
function primaryRoleFromRoles(rolesArr) {
  if (!Array.isArray(rolesArr) || rolesArr.length === 0) return 'Employee';
  if (rolesArr.includes('Superadmin')) return 'Superadmin';
  if (rolesArr.includes('Org Admin'))  return 'Org Admin';
  return 'Employee';
}

/**
 * Gets or initializes the roles array for a user.
 * If roles is empty "[]" (legacy user), auto-populate from the primary role.
 */
async function ensureRoles(user) {
  let roles = [];
  try {
    roles = JSON.parse(user.roles || '[]');
  } catch { roles = []; }

  if (roles.length === 0) {
    // Auto-derive for existing/legacy users
    roles = deriveRoles(user.role);
    // Persist so future calls are fast
    await prisma.user.update({
      where: { id: user.id },
      data: { roles: JSON.stringify(roles) }
    }).catch(() => {}); // Fail silently
  }

  return roles;
}

/**
 * Signs a JWT with the user object and sets it as an httpOnly cookie.
 */
function issueToken(res, user) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles,
      organization: user.organization,
      title: user.title,
      mobileNumber: user.mobileNumber,
      employeeId: user.employeeId,
      profilePhotoUrl: user.profilePhotoUrl,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/'
  });
}

/**
 * Builds the standard user payload shape for the frontend.
 * `activeRole` is the role to embed — callers decide whether to use
 * the DB's current role (session restore) or the primary role (fresh login).
 */
function buildUserPayload(row, roles, activeRole) {
  return {
    id:              row.id,
    email:           row.email,
    name:            row.name,
    title:           row.title || '',
    role:            activeRole,
    roles,
    organization:    row.organization,
    mobileNumber:    row.mobile_number || null,
    employeeId:      row.employee_id || null,
    profilePhotoUrl: row.profile_photo_url || null,
  };
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Session restore — called on every page load via AuthContext.
// Respects the current active role in the DB so in-session role switches
// (Superadmin ↔ Employee, Org Admin ↔ Employee) keep working.
// Does NOT reset to primary role — that only happens on fresh login.
router.get('/me', async (req, res) => {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('auth_token='));
  const token = match ? match.trim().slice('auth_token='.length) : null;

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data to pick up profile photo / name changes etc.
    const row = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, email: true, name: true, title: true, role: true, roles: true,
        organization: true, mobile_number: true, employee_id: true, profile_photo_url: true
      }
    });

    if (!row) return res.status(401).json({ error: 'User not found' });

    const roles = await ensureRoles(row);

    // Use whatever role is currently stored in the DB.
    // This is the active (possibly switched) role — we must not override it here
    // or role switching breaks: switchRole() sets the DB then calls /me to refresh.
    const user = buildUserPayload(row, roles, row.role);

    // Re-issue token so cookie lifetime extends and role is baked in fresh
    issueToken(res, user);
    res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Fresh login — always resets active role to the user's primary (highest-privilege)
// role. This means a Superadmin who switched to Employee and closed the browser
// will always come back as Superadmin when they log in again.
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return res.status(403).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
  }

  try {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true, email: true, name: true, title: true, role: true, roles: true,
        organization: true, mobile_number: true, employee_id: true, profile_photo_url: true, password: true
      }
    });

    if (!row) return res.status(404).json({ error: 'User not found. Contact your administrator.' });
    if (row.password !== password) return res.status(401).json({ error: 'Invalid password' });
    if (!row.role) return res.status(403).json({ error: 'No role assigned. Contact your administrator.' });

    const roles = await ensureRoles(row);

    // ── Fresh login: restore to primary role ──────────────────────────────
    // If a previous session left the DB role as 'Employee' (from a role switch),
    // reset it to the correct primary role now so the user lands at Superadmin/Org Admin.
    const primaryRole = primaryRoleFromRoles(roles);
    if (row.role !== primaryRole) {
      await prisma.user.update({
        where: { id: row.id },
        data:  { role: primaryRole }
      }).catch(() => {});
      row.role = primaryRole; // reflect locally before building payload
    }

    const user = buildUserPayload(row, roles, primaryRole);
    issueToken(res, user);
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
});

// ─── POST /api/auth/ms-login ──────────────────────────────────────────────────
// Microsoft SSO login — same primary-role-reset logic as /login.
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
      const row = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true, email: true, name: true, title: true, role: true, roles: true,
          organization: true, mobile_number: true, employee_id: true, profile_photo_url: true
        }
      });

      if (!row) {
        return res.status(404).json({ error: 'Your Microsoft account does not have a registered profile in Zuari Catalyst. Contact Central Team.' });
      }
      if (!row.role) {
        return res.status(403).json({ error: 'No role assigned. Contact your administrator.' });
      }

      const roles = await ensureRoles(row);

      // ── Fresh SSO login: restore to primary role ──────────────────────
      const primaryRole = primaryRoleFromRoles(roles);
      if (row.role !== primaryRole) {
        await prisma.user.update({
          where: { id: row.id },
          data:  { role: primaryRole }
        }).catch(() => {});
        row.role = primaryRole;
      }

      const user = buildUserPayload(row, roles, primaryRole);
      issueToken(res, user);
      res.json({ user });
    } catch (dbError) {
      console.error('SSO Database error:', dbError);
      return res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
  });
});

module.exports = router;
