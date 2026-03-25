const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { generateIdeaInsights, generateFormAutofill } = require('../services/geminiService');
const { awardPoints } = require('../services/pointService');
const {
  sendIdeaSubmittedEmail,
  sendIdeaAssignedEmail,
  sendIdeaApprovedEmail,
  sendIdeaRejectedEmail
} = require('../services/emailService');
const {
  notifyCentralTeam,
  notifyOrgAdmins,
  notifyUser,
  notifyUsers
} = require('../services/notificationService');

// Helper: get all Central Team (Superadmin) emails
async function getCentralTeamEmails() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'Superadmin' },
      select: { email: true }
    });
    return admins.map(a => a.email).filter(Boolean);
  } catch { return []; }
}

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

// GET pending ideas (For Superadmin — Tab 1: Ideas to Review)
router.get('/pending', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'Pending Review' },
      include: { author: { select: { name: true, organization: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ ...idea, authorName: idea.author.name, authorOrganization: idea.author.organization }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all assigned ideas for Central Team — Tab 2: Assigned to Org Admin
router.get('/central/assigned', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'Assigned to Org Admin' },
      include: {
        author: { select: { name: true, organization: true } },
        assignedTo: { select: { id: true, name: true, organization: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({
      ...idea,
      authorName: idea.author.name,
      authorOrganization: idea.author.organization,
      assignedToName: idea.assignedTo?.name || 'Unknown',
      assignedToOrg: idea.assignedTo?.organization || '—'
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET approved ideas for Central Team — Tab 3: Approved by Me (with project IDs)
router.get('/central/approved', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'Approved' },
      include: { author: { select: { name: true, organization: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Attach project info
    const ideaIds = ideas.map(i => i.id);
    const projects = await prisma.project.findMany({
      where: { ideaId: { in: ideaIds } },
      select: { ideaId: true, projectId: true, status: true }
    });
    const projectMap = {};
    projects.forEach(p => { projectMap[p.ideaId] = p; });

    const formatted = ideas.map(idea => ({
      ...idea,
      authorName: idea.author.name,
      authorOrganization: idea.author.organization,
      project: projectMap[idea.id] || null
    }));
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
  const { title, description, department, expectedImpact, supportingLink, authorId, extraFields, files } = req.body;
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
        files: JSON.stringify(files || []),
        authorId: parseInt(authorId),
        status: 'Pending Review'
      }
    });

    // AI Processing - Background (don't block the response)
    console.log(`[AI-Queue] Triggering AI processing for idea ID: ${idea.id}`);
    generateIdeaInsights({ title, description, proposedSolution: extraFields?.proposedSolution || '' })
      .then(async (insights) => {
        if (insights) {
          console.log(`[AI-Queue] Updating idea ID: ${idea.id} with insights`);
          await prisma.idea.update({
            where: { id: idea.id },
            data: {
              aiSummary: insights.summary,
              aiTags: JSON.stringify(insights.tags)
            }
          });
          console.log(`[AI-Queue] Idea ID: ${idea.id} successfully updated with AI insights`);
        } else {
          console.warn(`[AI-Queue] No insights generated for idea ID: ${idea.id}`);
        }
      })
      .catch(err => console.error(`[AI-Queue] Error in background AI processing for ID: ${idea.id}:`, err));

    // Award +10 points for idea submission
    awardPoints(parseInt(authorId), 'idea_submitted', 10, idea.id);

    res.json({ id: idea.id, status: idea.status });

    // DB Notifications & Email
    const author = await prisma.user.findUnique({ where: { id: parseInt(authorId) }, select: { name: true, organization: true } });
    
    // Notify in app
    notifyOrgAdmins(author?.organization, 'idea', `New idea submitted by ${author?.name}: ${title}`, idea.id);
    notifyCentralTeam('idea', `New idea submitted by ${author?.name}: ${title}`, idea.id);
    
    // Email Central Team
    const centralEmails = await getCentralTeamEmails();
    if (centralEmails.length > 0 && author) {
      sendIdeaSubmittedEmail({
        toEmails: centralEmails,
        ideaTitle: title,
        submittedBy: author.name,
        organization: author.organization || 'Unknown'
      }).catch(console.error);
    }
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
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: { 
        assignedToId: parseInt(assignedToId),
        status: 'Assigned to Org Admin'
      },
      include: { author: { select: { name: true, organization: true } } }
    });
    res.json({ message: 'Idea assigned successfully' });

    // Email Org Admin + Central Team in background
    const [orgAdmin, centralEmails] = await Promise.all([
      prisma.user.findUnique({ where: { id: parseInt(assignedToId) }, select: { name: true, email: true } }),
      getCentralTeamEmails()
    ]);

    // DB Notifications
    notifyUser(updatedIdea.authorId, 'idea', `Your idea '${updatedIdea.title}' has been assigned to an Org Admin for review.`, ideaId);
    notifyUser(parseInt(assignedToId), 'idea', `You have been assigned to review idea: ${updatedIdea.title}`, ideaId);
    notifyCentralTeam('idea', `Idea '${updatedIdea.title}' assigned to ${orgAdmin?.name}`, ideaId);

    // Email Org Admin + Central Team in background
    const toEmails = [...new Set([orgAdmin?.email, ...centralEmails].filter(Boolean))];
    if (toEmails.length > 0 && orgAdmin) {
      sendIdeaAssignedEmail({
        toEmails,
        ideaTitle: updatedIdea.title,
        assignedToName: orgAdmin.name,
        submittedBy: updatedIdea.author.name,
        organization: updatedIdea.author.organization || 'Unknown'
      }).catch(console.error);
    }
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT update status (Org Admin approve/reject)
router.put('/:id/status', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const { status, rejectionReason } = req.body; // 'Approved' or 'Rejected'
  
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        status,
        ...(status === 'Rejected' ? { rejectionReason: rejectionReason.trim() } : {})
      },
      include: { author: { select: { name: true, organization: true } } }
    });

    // Auto-create project when approved (if not already existing)
    if (status === 'Approved') {
      const existingProject = await prisma.project.findUnique({ where: { ideaId } });
      if (!existingProject) {
        // Generate PROJ-XXXX id
        const count = await prisma.project.count();
        const projectId = `PROJ-${String(count + 1).padStart(4, '0')}`;

        await prisma.project.create({
          data: {
            projectId,
            ideaId,
            orgId: idea.author.organization || 'Unknown',
            createdById: idea.authorId,
            title: idea.title,
            aiSummary: idea.aiSummary || null,
            status: 'Initiated'
          }
        });
        console.log(`[Projects] Auto-created project ${projectId} for idea ${ideaId}`);

        // Award +50 points for idea→project conversion
        awardPoints(idea.authorId, 'idea_approved', 50, ideaId);

        // DB Notifications
        notifyUser(idea.authorId, 'idea', `Your idea '${idea.title}' was APPROVED. A project (${projectId}) has been created.`, ideaId);
        notifyCentralTeam('idea', `Idea '${idea.title}' approved. Project ${projectId} created.`, ideaId);

        // Email author + Central Team about approval in background
        const [author, centralEmails] = await Promise.all([
          prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } }),
          getCentralTeamEmails()
        ]);
        const approvedRecipients = [...new Set([author?.email, ...centralEmails].filter(Boolean))];
        if (approvedRecipients.length > 0) {
          sendIdeaApprovedEmail({
            toEmails: approvedRecipients,
            ideaTitle: idea.title,
            authorName: author?.name || 'User',
            projectId
          }).catch(console.error);
        }
      }
    } else if (status === 'Rejected') {
      const reason = rejectionReason.trim();
      // DB Notifications
      notifyUser(idea.authorId, 'idea', `Your idea '${idea.title}' has been REJECTED. Reason: ${reason}`, ideaId);
      notifyCentralTeam('idea', `Idea '${idea.title}' was rejected. Reason: ${reason}`, ideaId);

      // Email author + Central Team about rejection
      const [author, centralEmails] = await Promise.all([
        prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } }),
        getCentralTeamEmails()
      ]);
      const rejectedRecipients = [...new Set([author?.email, ...centralEmails].filter(Boolean))];
      if (rejectedRecipients.length > 0) {
        sendIdeaRejectedEmail({
          toEmails: rejectedRecipients,
          ideaTitle: idea.title,
          authorName: author?.name || 'User',
          rejectionReason: reason
        }).catch(console.error);
      }
    }

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


// POST autofill form fields using Gemini AI
router.post('/autofill', async (req, res) => {
  const { description, fields } = req.body;
  if (!description || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'description and fields[] are required' });
  }
  try {
    const result = await generateFormAutofill({ description, fields });
    // Partial result is fine — return what we have (even null → empty object)
    res.json({ fields: result || {} });
  } catch (error) {
    console.error('[Autofill] Error:', error.message);
    res.json({ fields: {} }); // Never fail — return empty if error
  }
});

// ─── UPVOTE SYSTEM ────────────────────────────────────────────────────────────

// POST /api/ideas/:id/upvote — Toggle upvote
router.post('/:id/upvote', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const uid = parseInt(userId);

  try {
    // Get the idea to find author
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { authorId: true } });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    // Block self-upvote
    if (idea.authorId === uid) {
      return res.status(403).json({ error: 'Cannot upvote your own idea' });
    }

    // Check if already upvoted
    const existing = await prisma.upvote.findUnique({
      where: { ideaId_userId: { ideaId, userId: uid } }
    });

    if (existing) {
      // ── REMOVE UPVOTE ─────────────────────────────────────────────────
      // Revoke points FIRST using the upvote.id while it still exists
      await awardPoints(idea.authorId, 'upvote_received', -5, existing.id);
      // Then delete the upvote row
      await prisma.upvote.delete({ where: { id: existing.id } });

      const count = await prisma.upvote.count({ where: { ideaId } });
      return res.json({ upvoted: false, count });
    } else {
      // ── ADD UPVOTE ────────────────────────────────────────────────────
      const newUpvote = await prisma.upvote.create({ data: { ideaId, userId: uid } });
      await awardPoints(idea.authorId, 'upvote_received', 5, newUpvote.id);

      const count = await prisma.upvote.count({ where: { ideaId } });
      return res.json({ upvoted: true, count });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /api/ideas/:id/upvotes — Get upvote count + user status
router.get('/:id/upvotes', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const userId = req.query.userId ? parseInt(req.query.userId) : null;

  try {
    const count = await prisma.upvote.count({ where: { ideaId } });
    let upvoted = false;
    if (userId) {
      const existing = await prisma.upvote.findUnique({
        where: { ideaId_userId: { ideaId, userId } }
      });
      upvoted = !!existing;
    }
    res.json({ count, upvoted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
