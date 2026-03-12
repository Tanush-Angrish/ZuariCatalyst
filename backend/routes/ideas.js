const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// GET all ideas (For testing or general review)
router.get('/', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ ...idea, authorName: idea.author.name }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET community hub ideas (Approved only)
router.get('/projects', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'Approved' },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ ...idea, authorName: idea.author.name }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ideas for specific employee
router.get('/my-ideas/:userId', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { authorId: parseInt(req.params.userId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET pending ideas (For Superadmin)
router.get('/pending', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'Pending Review' },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ ...idea, authorName: idea.author.name }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET assigned ideas (For Org Admin)
router.get('/assigned/:userId', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { 
        assignedToId: parseInt(req.params.userId),
        status: 'Assigned to Org Admin' 
      },
      include: { author: { select: { name: true, organization: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ 
      ...idea, 
      authorName: idea.author.name, 
      authorOrganization: idea.author.organization 
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET team ideas (For Org Admin)
router.get('/team/:organization', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { 
        author: {
          organization: req.params.organization
        }
      },
      include: { author: { select: { name: true, organization: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ 
      ...idea, 
      authorName: idea.author.name, 
      authorOrganization: idea.author.organization 
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit new idea (Employee)
router.post('/', async (req, res) => {
  const { title, description, department, expectedImpact, supportingLink, authorId, extraFields } = req.body;
  if (!title || !description || !department || !expectedImpact || !authorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        department,
        expectedImpact,
        supportingLink,
        extraFields: JSON.stringify(extraFields || {}),
        authorId: parseInt(authorId),
        status: 'Pending Review'
      }
    });
    res.json({ id: idea.id, status: idea.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT assign idea (Superadmin)
router.put('/:id/assign', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const { assignedToId } = req.body;
  
  if (!assignedToId) {
    return res.status(400).json({ error: 'Org Admin ID to assign is required' });
  }

  try {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { 
        assignedToId: parseInt(assignedToId),
        status: 'Assigned to Org Admin'
      }
    });
    res.json({ message: 'Idea assigned successfully' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT update status (Org Admin approve/reject)
router.put('/:id/status', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const { status } = req.body; // 'Approved' or 'Rejected'
  
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { status }
    });
    res.json({ message: `Idea marked as ${status}` });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
    res.status(500).json({ error: error.message });
  }
});

// GET org admins (For Select Dropdown)
router.get('/orgadmins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'Org Admin' },
      select: { id: true, name: true }
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
