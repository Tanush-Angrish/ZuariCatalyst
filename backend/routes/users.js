const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, title: true, role: true, organization: true },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create single user
router.post('/', async (req, res) => {
  const { name, title, email, role, organization } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        title: title || '',
        email,
        role,
        organization: (role === 'Superadmin' || role === 'Central Team') ? null : (organization || ''),
        password: 'password'
      }
    });
    res.json({ id: user.id, name, title, email, role, organization });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// POST bulk create users
router.post('/bulk', async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'An array of users is required' });
  }

  const errors = [];
  const successes = [];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (!u.name || !u.email || !u.role) {
      errors.push({ row: i + 1, error: 'Missing name, email, or role' });
      continue;
    }

    try {
      const user = await prisma.user.create({
        data: {
          name: u.name,
          title: u.title || '',
          email: u.email,
          role: u.role,
          organization: (u.role === 'Superadmin' || u.role === 'Central Team') ? null : (u.organization || ''),
          password: 'password'
        }
      });
      successes.push({ id: user.id, email: user.email });
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

// PUT update user role
router.put('/:id/role', async (req, res) => {
  const { role } = req.body;
  const validRoles = ['Employee', 'Org Admin', 'Superadmin'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be: Employee, Org Admin, or Central Team (Superadmin)' });
  }

  // Map "Central Team" display name to stored "Superadmin" if needed
  const dbRole = role === 'Central Team' ? 'Superadmin' : role;

  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: dbRole === 'Superadmin' 
        ? { role: dbRole, organization: null } 
        : { role: dbRole }
    });
    res.json({ message: 'Role updated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// PUT update user details
router.put('/:id', async (req, res) => {
  const { name, title, email, role, organization } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const dbRole = role === 'Central Team' ? 'Superadmin' : role;

  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        title: title || '',
        email,
        role: dbRole,
        organization: dbRole === 'Superadmin' ? null : (organization || '')
      }
    });
    res.json({ message: 'User updated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    return res.status(500).json({ error: error.message });
  }
});

// DELETE user
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
