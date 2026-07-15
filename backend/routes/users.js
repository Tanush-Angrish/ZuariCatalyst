const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

// All user management endpoints require authentication
router.use(authMiddleware);

// ─── Role Helpers ─────────────────────────────────────────────────────────────

const DISPLAY_ROLES = ['Employee', 'Org Admin', 'Central Team', 'Administrator'];

/**
 * Normalize Excel role values to DB role values.
 * Excel may use: OrgAdmin, Employee, Org Admin, org_admin, employee etc.
 */
function normalizeExcelRole(raw) {
  if (!raw) return 'Employee';
  const r = String(raw).trim().toLowerCase().replace(/[\s_-]/g, '');
  if (r === 'orgadmin' || r === 'orgAdmin') return 'Org Admin';
  if (r === 'centralteam' || r === 'superadmin' || r === 'admin') return 'Superadmin';
  if (r === 'administrator') return 'Administrator';
  return 'Employee';
}

/**
 * Map display role to DB role.
 */
function toDbRole(displayRole) {
  if (displayRole === 'Central Team') return 'Superadmin';
  if (displayRole === 'Administrator') return 'Administrator';
  return displayRole; // 'Employee' | 'Org Admin'
}

/**
 * Derives the full roles array from the primary DB role.
 * Org Admin and Central Team (Superadmin) automatically also have Employee access.
 */
function deriveRoles(primaryDbRole) {
  if (primaryDbRole === 'Administrator') return ['Administrator', 'Employee'];
  if (primaryDbRole === 'Org Admin') return ['Org Admin', 'Employee'];
  if (primaryDbRole === 'Superadmin') return ['Superadmin', 'Employee'];
  return ['Employee'];
}


// ─── GET /api/users — All users ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, title: true, role: true, roles: true,
        organization: true, mobile_number: true, employee_id: true, profile_photo_url: true
      },
      orderBy: { id: 'asc' }
    });
    // Shape camelCase for frontend
    const shaped = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      title: u.title,
      role: u.role,
      roles: (() => { try { return JSON.parse(u.roles || '[]'); } catch { return []; } })(),
      organization: u.organization,
      mobileNumber: u.mobile_number,
      employeeId: u.employee_id,
      profilePhotoUrl: u.profile_photo_url,
    }));
    res.json(shaped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/users — Create single user ────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, title, email, role, organization, mobileNumber, employeeId } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const dbRole = toDbRole(role);
  const roles = deriveRoles(dbRole);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        title: title || '',
        email: email.toLowerCase().trim(),
        role: dbRole,
        roles: JSON.stringify(roles),
        organization: (dbRole === 'Superadmin' || dbRole === 'Administrator') ? null : (organization || ''),
        mobile_number: mobileNumber ? String(mobileNumber).trim() : null,
        employee_id: employeeId ? String(employeeId).trim() : null
      }
    });
    res.json({ id: user.id, name, title, email: user.email, role: dbRole, roles, organization });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/users/bulk — Bulk create users ────────────────────────────────
router.post('/bulk', async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'An array of users is required' });
  }

  const errors = [];
  const successes = [];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (!u.name || !u.email) {
      errors.push({ row: i + 1, error: 'Missing name or email' });
      continue;
    }

    const dbRole = normalizeExcelRole(u.role);

    // Block Central Team and Administrator from bulk upload
    if (dbRole === 'Superadmin' || dbRole === 'Administrator') {
      errors.push({ row: i + 1, email: u.email, error: 'Central Team or Administrator users cannot be added via bulk upload. Add them from the UI.' });
      continue;
    }

    const roles = deriveRoles(dbRole);

    try {
      const user = await prisma.user.create({
        data: {
          name: String(u.name).trim(),
          title: u.title ? String(u.title).trim() : '',
          email: String(u.email).toLowerCase().trim(),
          role: dbRole,
          roles: JSON.stringify(roles),
          organization: u.organization ? String(u.organization).trim() : '',
          mobile_number: u.mobileNumber ? String(u.mobileNumber).trim() : null,
          employee_id: u.employeeId ? String(u.employeeId).trim() : null
        }
      });
      successes.push({ id: user.id, email: user.email, role: dbRole });
    } catch (error) {
      errors.push({
        row: i + 1,
        email: u.email,
        error: error.code === 'P2002' ? 'Duplicate email' : error.message
      });
    }
  }

  res.json({ successes: successes.length, errors });
});

// ─── PUT /api/users/:id/active-role — Switch active role (role toggle) ────────
router.put('/:id/active-role', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  if (!role) return res.status(400).json({ error: 'role is required' });

  // Verify the user actually has this role in their roles array
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  let rolesArr = [];
  try { rolesArr = JSON.parse(user.roles || '[]'); } catch { rolesArr = []; }

  const dbRole = toDbRole(role);
  if (!rolesArr.includes(dbRole)) {
    return res.status(403).json({ error: `User does not have the role: ${role}` });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: dbRole }
    });
    res.json({ message: 'Active role updated', role: dbRole });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/users/:id/profile-photo — Update profile photo URL ─────────────
router.put('/:id/profile-photo', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { url } = req.body;

  // Only allow users to update their own photo (or admins)
  if (req.user.id !== userId && req.user.role !== 'Superadmin' && req.user.role !== 'Administrator') {
    return res.status(403).json({ error: 'You can only update your own profile photo.' });
  }

  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { profile_photo_url: url }
    });
    res.json({ message: 'Profile photo updated', url });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/users/:id/role — Update user role (admin action) ───────────────
router.put('/:id/role', async (req, res) => {
  const { role } = req.body;
  const validRoles = ['Employee', 'Org Admin', 'Central Team', 'Superadmin', 'Administrator'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const dbRole = toDbRole(role);
  const roles = deriveRoles(dbRole);

  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: (dbRole === 'Superadmin' || dbRole === 'Administrator')
        ? { role: dbRole, roles: JSON.stringify(roles), organization: null }
        : { role: dbRole, roles: JSON.stringify(roles) }
    });
    res.json({ message: 'Role updated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/users/:id — Update user details ────────────────────────────────
router.put('/:id', async (req, res) => {
  const { name, title, email, role, organization, mobileNumber, employeeId } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const dbRole = toDbRole(role);
  const roles = deriveRoles(dbRole);

  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        title: title || '',
        email: email.toLowerCase().trim(),
        role: dbRole,
        roles: JSON.stringify(roles),
        organization: (dbRole === 'Superadmin' || dbRole === 'Administrator') ? null : (organization || ''),
        mobile_number: mobileNumber ? String(mobileNumber).trim() : null,
        employee_id: employeeId ? String(employeeId).trim() : null,
      }
    });
    res.json({ message: 'User updated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/users/org-admin-overview — Org grouped with admins ─────────────
// Returns all distinct organizations and, for each, the list of users whose
// roles array contains "Org Admin" (i.e. has the org_admin role).
// Also returns all users per org so the assign modal can show them.
router.get('/org-admin-overview', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, roles: true,
        organization: true, employee_id: true, profile_photo_url: true, title: true,
      },
      where: { organization: { not: null } },
      orderBy: { name: 'asc' },
    });

    // Build org → { orgAdmins, members } map
    const orgMap = {};
    for (const u of users) {
      const org = (u.organization || '').trim();
      if (!org) continue;

      let rolesArr = [];
      try { rolesArr = JSON.parse(u.roles || '[]'); } catch { rolesArr = []; }

      const isOrgAdmin = rolesArr.includes('Org Admin');

      if (!orgMap[org]) orgMap[org] = { name: org, orgAdmins: [], members: [] };

      const shaped = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        roles: rolesArr,
        organization: u.organization,
        employeeId: u.employee_id,
        profilePhotoUrl: u.profile_photo_url,
        title: u.title,
        isOrgAdmin,
      };

      orgMap[org].members.push(shaped);
      if (isOrgAdmin) orgMap[org].orgAdmins.push(shaped);
    }

    // Sort orgs alphabetically
    const result = Object.values(orgMap).sort((a, b) => a.name.localeCompare(b.name));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/users/:id/assign-org-admin — Grant Org Admin role ───────────────
// Adds "Org Admin" to the user's roles array. Employee role is preserved.
// Primary role (role column) is updated to "Org Admin" so dashboard routes correctly.
router.put('/:id/assign-org-admin', async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, roles: true, organization: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    let rolesArr = [];
    try { rolesArr = JSON.parse(user.roles || '[]'); } catch { rolesArr = []; }

    // Add Org Admin if not already present; always keep Employee
    if (!rolesArr.includes('Org Admin')) rolesArr.push('Org Admin');
    if (!rolesArr.includes('Employee')) rolesArr.push('Employee');

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'Org Admin',  // primary active role
        roles: JSON.stringify(rolesArr),
      },
    });

    res.json({ message: 'Org Admin role assigned', roles: rolesArr });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/users/:id/remove-org-admin — Revoke Org Admin role ─────────────
// Removes "Org Admin" from the user's roles array. Employee role is preserved.
router.put('/:id/remove-org-admin', async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, roles: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    let rolesArr = [];
    try { rolesArr = JSON.parse(user.roles || '[]'); } catch { rolesArr = []; }

    rolesArr = rolesArr.filter(r => r !== 'Org Admin');
    if (!rolesArr.includes('Employee')) rolesArr.push('Employee');

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'Employee',
        roles: JSON.stringify(rolesArr),
      },
    });

    res.json({ message: 'Org Admin role removed', roles: rolesArr });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /api/users/:id — Delete user ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
