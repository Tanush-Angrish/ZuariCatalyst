const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');
const { generateIdeaInsights, generateFormAutofill, suggestTemplate } = require('../services/geminiService');
const { awardPoints } = require('../services/pointService');

// All idea endpoints require authentication
router.use(authMiddleware);

const {
  sendIdeaSubmittedEmail,
  sendIdeaStatusChangeEmail
} = require('../services/emailService');
const {
  notifyCentralTeam,
  notifyOrgAdmins,
  notifyUser,
  notifyUsers
} = require('../services/notificationService');
const { setSLA, clearSLA } = require('../services/slaService');

// Helper: get all Central Team (Superadmin) emails
// Filters by `roles` array, not active `role`, so switched users still receive emails.
async function getCentralTeamEmails() {
  try {
    const admins = await prisma.user.findMany({
      where: { roles: { contains: 'Superadmin' } },
      select: { email: true }
    });
    return admins.map(a => a.email).filter(Boolean);
  } catch { return []; }
}

// GET all ideas (For testing or general review)
router.get('/', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: { not: 'Draft' } },
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
    const targetUserId = parseInt(req.params.userId);
    const whereClause = { authorId: targetUserId };
    
    // Only the creator can see their own Drafts
    if (req.user.id !== targetUserId) {
      whereClause.status = { not: 'Draft' };
    }

    const ideas = await prisma.idea.findMany({
      where: whereClause,
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
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ ...idea, authorName: idea.author.name, authorOrganization: idea.author.organization, authorTitle: idea.author.title, authorMobile: idea.author.mobile_number, authorEmployeeId: idea.author.employee_id, authorPhotoUrl: idea.author.profile_photo_url }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all assigned ideas for Central Team — Tab 2: Assigned to Org Admin
router.get('/central/assigned', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { 
        assignedToId: { not: null },
        status: { not: 'Draft' }
      },
      include: {
        author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } },
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

// GET Central Team's Under Review queue (not delegated)
router.get('/central/under-review', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'Under Review', assignedToId: null },
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const formatted = ideas.map(idea => ({ ...idea, authorName: idea.author.name, authorOrganization: idea.author.organization, authorTitle: idea.author.title, authorMobile: idea.author.mobile_number, authorEmployeeId: idea.author.employee_id, authorPhotoUrl: idea.author.profile_photo_url }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET approved ideas for Central Team — Tab 3: Approved by Me (ONLY ideas approved by Central Team)
router.get('/central/approved', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: {
        status: 'Approved',
        approvedByRole: 'central'   // STRICT: only Central Team approvals
      },
      include: {
        author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } },
        approvedBy: { select: { id: true, name: true, role: true } }
      },
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
      approvedByName: idea.approvedBy?.name || null,
      approvedByRoleLabel: 'Central Team',
      project: projectMap[idea.id] || null
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ideas approved by Org Admin — Tab 4: Approved by Admin
router.get('/central/approved-by-admin', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: {
        status: 'Approved',
        approvedByRole: 'admin'     // STRICT: only Org Admin approvals
      },
      include: {
        author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } },
        approvedBy: { select: { id: true, name: true, role: true } }
      },
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
      approvedByName: idea.approvedBy?.name || 'Unknown Admin',
      approvedByRoleLabel: 'Org Admin',
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
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } },
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

// GET assigned ideas that are Under Review (For Org Admin)
router.get('/assigned/:userId/under-review', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { 
        assignedToId: parseInt(req.params.userId),
        status: 'Under Review' 
      },
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } },
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

// GET assigned ideas that have been processed (Approved/Rejected) (For Org Admin)
router.get('/assigned/:userId/processed', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { 
        assignedToId: parseInt(req.params.userId),
        status: { in: ['Approved', 'Rejected'] } 
      },
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Attach project info for Approved ideas
    const ideaIds = ideas.filter(i => i.status === 'Approved').map(i => i.id);
    let projectMap = {};
    if (ideaIds.length > 0) {
      const projects = await prisma.project.findMany({
        where: { ideaId: { in: ideaIds } },
        select: { ideaId: true, projectId: true, status: true }
      });
      projects.forEach(p => { projectMap[p.ideaId] = p; });
    }

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

// GET team ideas (For Org Admin)
router.get('/team/:organization', async (req, res) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { 
        author: {
          organization: req.params.organization
        },
        status: { not: 'Draft' }
      },
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } },
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

// GET submission limits for current month (Employee)
router.get('/limits/:userId', async (req, res) => {
  try {
    const authorId = parseInt(req.params.userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const submittedCount = await prisma.idea.count({
      where: {
        authorId,
        createdAt: { gte: startOfMonth },
        status: { not: 'Draft' }
      }
    });

    const draftCount = await prisma.idea.count({
      where: {
        authorId,
        status: 'Draft'
      }
    });

    res.json({ submittedCount, draftCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit new idea (Employee)
router.post('/', async (req, res) => {
  const { title, description, department, expectedImpact, supportingLink, authorId, extraFields, files, isDraft } = req.body;
  if (!title || !description || !department || !expectedImpact || !authorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const aid = parseInt(authorId);

    // Enforce limits
    if (isDraft) {
      const draftCount = await prisma.idea.count({
        where: { authorId: aid, status: 'Draft' }
      });
      if (draftCount >= 5) {
        return res.status(400).json({ error: 'Draft limit reached. You can only have up to 5 drafts at a time.' });
      }
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const submittedCount = await prisma.idea.count({
        where: { authorId: aid, createdAt: { gte: startOfMonth }, status: { not: 'Draft' } }
      });
      if (submittedCount >= 3) {
        return res.status(400).json({ error: 'Monthly limit reached. You can only submit 3 ideas per month.' });
      }
    }
    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        department,
        expectedImpact,
        supportingLink,
        extraFields: JSON.stringify(extraFields || {}),
        files: JSON.stringify(files || []),
        authorId: aid,
        status: isDraft ? 'Draft' : 'Pending Review'
      }
    });

    if (isDraft) {
      return res.json({ id: idea.id, status: idea.status, isDraft: true });
    }

    // Set initial SLA for Central Admin
    setSLA(idea.id, 'pending_central');

    // AI Processing - Background (don't block the response)
    // Build a rich content string from ALL text fields in extraFields so that
    // Gemini gets the full idea content regardless of which template was used.
    const enrichedDescription = (() => {
      const parts = [];
      if (description && description !== `Submitted via ${req.body.extraFields?._templateName || ''}`) {
        parts.push(description);
      }
      const ef = extraFields || {};
      const TEXT_SKIP = new Set(['_templateId', '_templateName', 'referenceLink', 'supportingLink']);
      Object.entries(ef).forEach(([k, v]) => {
        if (!TEXT_SKIP.has(k) && typeof v === 'string' && v.trim()) {
          parts.push(`${k}: ${v.trim()}`);
        }
      });
      return parts.join('\n\n') || description;
    })();

    console.log(`[AI-Queue] Triggering AI processing for idea ID: ${idea.id}`);
    generateIdeaInsights({ title, description: enrichedDescription, proposedSolution: extraFields?.proposedSolution || '' })
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

    // Points logic:
    // - First idea ever (all-time): award ONLY +50 bonus (skip the regular 10pts)
    // - All subsequent ideas: award regular +10 pts
    const totalSubmitted = await prisma.idea.count({
      where: { authorId: aid, status: { not: 'Draft' } }
    });
    const isFirstIdea = totalSubmitted === 1;
    if (isFirstIdea) {
      // First idea: only 50 pts — no 10 pt award
      awardPoints(aid, 'first_idea_bonus', 50, idea.id);
      console.log(`[Points] First-idea bonus +50 awarded to userId=${aid} (no regular 10pts)`);
    } else {
      // Subsequent ideas: regular 10 pts
      awardPoints(aid, 'idea_submitted', 10, idea.id);
    }

    res.json({ id: idea.id, status: idea.status, isFirstIdea });

    // DB Notifications & Email
    const author = await prisma.user.findUnique({ where: { id: parseInt(authorId) }, select: { name: true, organization: true } });
    
    // Notify in app
    notifyOrgAdmins(author?.organization, 'idea', `New idea submitted by ${author?.name}: ${title}`, idea.id);
    notifyCentralTeam('idea', `New idea submitted by ${author?.name}: ${title}`, idea.id);
    
    // Email Central Team + Org Admins (strict rules)
    if (author) {
      const centralEmails = await getCentralTeamEmails();
      // Filter org admins by roles array (not active role) so switched users get emails
      const orgAdmins = await prisma.user.findMany({
        where: { roles: { contains: 'Org Admin' }, organization: author.organization },
        select: { email: true }
      });
      const orgEmails = orgAdmins.map(a => a.email).filter(Boolean);
      const toEmails = [...new Set([...centralEmails, ...orgEmails])];

      if (toEmails.length > 0) {
        sendIdeaSubmittedEmail({
          toEmails,
          ideaTitle: title,
          submittedBy: author.name,
          organization: author.organization || 'Unknown'
        }).catch(console.error);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update an existing idea (primarily for drafts)
router.put('/:id', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const { title, description, department, expectedImpact, supportingLink, extraFields, files, isDraft } = req.body;
  
  if (!title || !description || !department || !expectedImpact) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingIdea = await prisma.idea.findUnique({
      where: { id: ideaId }
    });

    if (!existingIdea) return res.status(404).json({ error: 'Idea not found' });
    if (existingIdea.authorId !== req.user.id && req.user.role !== 'Superadmin') {
      return res.status(403).json({ error: 'Not authorized to edit this idea' });
    }
    if (existingIdea.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft ideas can be edited directly via this endpoint.' });
    }

    // Limits check
    if (isDraft) {
      // It's still a draft, verify they haven't somehow exceeded 5 drafts (shouldn't happen on update, but safe)
      const draftCount = await prisma.idea.count({
        where: { authorId: existingIdea.authorId, status: 'Draft', id: { not: ideaId } }
      });
      if (draftCount >= 5) {
        return res.status(400).json({ error: 'Draft limit reached. You can only have up to 5 drafts at a time.' });
      }
    } else {
      // Submitting the draft
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const submittedCount = await prisma.idea.count({
        where: { authorId: existingIdea.authorId, createdAt: { gte: startOfMonth }, status: { not: 'Draft' } }
      });
      if (submittedCount >= 3) {
        return res.status(400).json({ error: 'Monthly limit reached. You can only submit 3 ideas per month.' });
      }
    }

    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        title,
        description,
        department,
        expectedImpact,
        supportingLink,
        extraFields: JSON.stringify(extraFields || {}),
        files: JSON.stringify(files || []),
        status: isDraft ? 'Draft' : 'Pending Review'
      }
    });

    if (isDraft) {
      return res.json({ id: updatedIdea.id, status: updatedIdea.status, isDraft: true });
    }

    // --- Transitioning from Draft to Submitted ---
    
    // Set initial SLA for Central Admin
    setSLA(updatedIdea.id, 'pending_central');

    // AI Processing - Background (don't block the response)
    const enrichedDescription = (() => {
      const parts = [];
      if (description && description !== `Submitted via ${req.body.extraFields?._templateName || ''}`) {
        parts.push(description);
      }
      const ef = extraFields || {};
      const TEXT_SKIP = new Set(['_templateId', '_templateName', 'referenceLink', 'supportingLink']);
      Object.entries(ef).forEach(([k, v]) => {
        if (!TEXT_SKIP.has(k) && typeof v === 'string' && v.trim()) {
          parts.push(`${k}: ${v.trim()}`);
        }
      });
      return parts.join('\n\n') || description;
    })();

    console.log(`[AI-Queue] Triggering AI processing for idea ID: ${updatedIdea.id}`);
    generateIdeaInsights({ title, description: enrichedDescription, proposedSolution: extraFields?.proposedSolution || '' })
      .then(async (insights) => {
        if (insights) {
          console.log(`[AI-Queue] Updating idea ID: ${updatedIdea.id} with insights`);
          await prisma.idea.update({
            where: { id: updatedIdea.id },
            data: {
              aiSummary: insights.summary,
              aiTags: JSON.stringify(insights.tags)
            }
          });
          console.log(`[AI-Queue] Idea ID: ${updatedIdea.id} successfully updated with AI insights`);
        } else {
          console.warn(`[AI-Queue] No insights generated for idea ID: ${updatedIdea.id}`);
        }
      })
      .catch(err => console.error(`[AI-Queue] Error in background AI processing for ID: ${updatedIdea.id}:`, err));

    // Points logic
    const totalSubmitted = await prisma.idea.count({
      where: { authorId: existingIdea.authorId, status: { not: 'Draft' } }
    });
    const isFirstIdea = totalSubmitted === 1;
    if (isFirstIdea) {
      awardPoints(existingIdea.authorId, 'first_idea_bonus', 50, updatedIdea.id);
      console.log(`[Points] First-idea bonus +50 awarded to userId=${existingIdea.authorId} (no regular 10pts)`);
    } else {
      awardPoints(existingIdea.authorId, 'idea_submitted', 10, updatedIdea.id);
    }

    res.json({ id: updatedIdea.id, status: updatedIdea.status, isFirstIdea });

    // DB Notifications & Email
    const author = await prisma.user.findUnique({ where: { id: existingIdea.authorId }, select: { name: true, organization: true } });
    
    // Notify in app
    notifyOrgAdmins(author?.organization, 'idea', `New idea submitted by ${author?.name}: ${title}`, updatedIdea.id);
    notifyCentralTeam('idea', `New idea submitted by ${author?.name}: ${title}`, updatedIdea.id);
    
    // Email Central Team + Org Admins
    if (author) {
      const centralEmails = await getCentralTeamEmails();
      const orgAdmins = await prisma.user.findMany({
        where: { roles: { contains: 'Org Admin' }, organization: author.organization },
        select: { email: true }
      });
      const orgEmails = orgAdmins.map(a => a.email).filter(Boolean);
      const toEmails = [...new Set([...centralEmails, ...orgEmails])];

      if (toEmails.length > 0) {
        sendIdeaSubmittedEmail({
          toEmails,
          ideaTitle: title,
          submittedBy: author.name,
          organization: author.organization || 'Unknown'
        }).catch(console.error);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT submit a draft idea
router.put('/:id/submit-draft', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  
  try {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } } });
    if (!idea || idea.status !== 'Draft') {
      return res.status(400).json({ error: 'This idea is not a draft or does not exist.' });
    }

    // Enforce limits
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const submittedCount = await prisma.idea.count({
      where: { authorId: idea.authorId, createdAt: { gte: startOfMonth }, status: { not: 'Draft' } }
    });
    
    if (submittedCount >= 3) {
      return res.status(400).json({ error: 'Monthly limit reached. You can only submit 3 ideas per month.' });
    }

    // Submit it
    const updated = await prisma.idea.update({
      where: { id: ideaId },
      data: { status: 'Pending Review' }
    });

    // Start SLA for Central Admin
    setSLA(updated.id, 'pending_central');

    // Extract proposed solution for AI
    let proposedSolution = '';
    let enrichedDescriptionDraft = updated.description || '';
    try {
      const extra = JSON.parse(idea.extraFields || '{}');
      proposedSolution = extra.proposedSolution || '';

      // Build a rich description from ALL text fields in extraFields
      const TEXT_SKIP = new Set(['_templateId', '_templateName', 'referenceLink', 'supportingLink']);
      const parts = [];
      if (updated.description && !updated.description.startsWith('Submitted via ')) {
        parts.push(updated.description);
      }
      Object.entries(extra).forEach(([k, v]) => {
        if (!TEXT_SKIP.has(k) && typeof v === 'string' && v.trim()) {
          parts.push(`${k}: ${v.trim()}`);
        }
      });
      if (parts.length > 0) enrichedDescriptionDraft = parts.join('\n\n');
    } catch(e) {}

    // AI Processing - Background
    console.log(`[AI-Queue] Triggering AI processing for idea ID: ${updated.id}`);
    generateIdeaInsights({ title: updated.title, description: enrichedDescriptionDraft, proposedSolution })
      .then(async (insights) => {
        if (insights) {
          console.log(`[AI-Queue] Updating idea ID: ${updated.id} with insights`);
          await prisma.idea.update({
            where: { id: updated.id },
            data: {
              aiSummary: insights.summary,
              aiTags: JSON.stringify(insights.tags)
            }
          });
          console.log(`[AI-Queue] Idea ID: ${updated.id} successfully updated with AI insights`);
        }
      })
      .catch(err => console.error(`[AI-Queue] Error in background AI processing for ID: ${updated.id}:`, err));

    // Points logic:
    // - First idea ever (all-time): award ONLY +50 bonus (skip the regular 10pts)
    // - All subsequent ideas: award regular +10 pts
    const totalSubmittedDraft = await prisma.idea.count({
      where: { authorId: idea.authorId, status: { not: 'Draft' } }
    });
    const isFirstIdeaDraft = totalSubmittedDraft === 1;
    if (isFirstIdeaDraft) {
      // First idea: only 50 pts — no 10 pt award
      awardPoints(idea.authorId, 'first_idea_bonus', 50, idea.id);
      console.log(`[Points] First-idea bonus +50 awarded to userId=${idea.authorId} (via draft submit, no regular 10pts)`);
    } else {
      // Subsequent ideas: regular 10 pts
      awardPoints(idea.authorId, 'idea_submitted', 10, idea.id);
    }

    res.json({ message: 'Draft submitted successfully', status: 'Pending Review', isFirstIdea: isFirstIdeaDraft });

    // DB Notifications & Email
    const author = idea.author;
    notifyOrgAdmins(author?.organization, 'idea', `New idea submitted by ${author?.name}: ${updated.title}`, updated.id);
    notifyCentralTeam('idea', `New idea submitted by ${author?.name}: ${updated.title}`, updated.id);
    
    if (author) {
      const centralEmails = await getCentralTeamEmails();
      // Filter org admins by roles array (not active role) so switched users get emails
      const orgAdmins = await prisma.user.findMany({
        where: { roles: { contains: 'Org Admin' }, organization: author.organization },
        select: { email: true }
      });
      const orgEmails = orgAdmins.map(a => a.email).filter(Boolean);
      const toEmails = [...new Set([...centralEmails, ...orgEmails])];

      if (toEmails.length > 0) {
        sendIdeaSubmittedEmail({
          toEmails,
          ideaTitle: updated.title,
          submittedBy: author.name,
          organization: author.organization || 'Unknown'
        }).catch(console.error);
      }
    }
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
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
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } }
    });

    // Pass SLA to Org Admin
    setSLA(ideaId, 'pending_org_admin');
    
    res.json({ message: 'Idea assigned successfully' });

    // Fetch Org Admin details for email/notification
    const orgAdmin = await prisma.user.findUnique({ 
      where: { id: parseInt(assignedToId) }, 
      select: { name: true, email: true } 
    });

    // DB Notifications
    notifyUser(updatedIdea.authorId, 'idea', `Your idea '${updatedIdea.title}' has been assigned to an Org Admin for review.`, ideaId);
    notifyUser(parseInt(assignedToId), 'idea', `You have been assigned to review idea: ${updatedIdea.title}.`, ideaId);
    notifyCentralTeam('idea', `Idea '${updatedIdea.title}' assigned to ${orgAdmin?.name}`, ideaId);

    // Email Org Admin logic successfully removed (as per strict email constraints)
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT put idea Under Review (Central Team or Org Admin)
router.put('/:id/under-review', async (req, res) => {
  const ideaId = parseInt(req.params.id);

  try {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: { status: 'Under Review' },
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } }
    });

    // Advance SLA to the under_review stage (depends on who owns it)
    const slaStage = idea.assignedToId ? 'under_review_org_admin' : 'under_review_central';
    setSLA(ideaId, slaStage);

    res.json({ message: 'Idea is now Under Review' });

    notifyUser(idea.authorId, 'idea', `Your idea '${idea.title}' is now Under Review.`, ideaId);
    notifyCentralTeam('idea', `Idea '${idea.title}' moved to Under Review.`, ideaId);
    awardPoints(idea.authorId, 'idea_under_review', 15, ideaId);

    // Strict Rule: Employee Email ONLY
    const authorDoc = await prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } });
    if (authorDoc && authorDoc.email) {
      sendIdeaStatusChangeEmail({
        toEmail: authorDoc.email,
        ideaTitle: idea.title,
        authorName: authorDoc.name,
        newStatus: 'Under Review'
      }).catch(console.error);
    }
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT update status — ONLY valid from 'Under Review' state
router.put('/:id/status', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  const { status, rejectionReason, approvalRemarks, approvedById, approvedByRole } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Only Rejection requires a reason
  if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return res.status(400).json({ error: 'A reason is required when rejecting an idea.' });
  }

  // Approval requires remarks between 10 and 150 characters
  if (status === 'Approved') {
    if (!approvalRemarks || approvalRemarks.trim().length < 10 || approvalRemarks.trim().length > 150) {
      return res.status(400).json({ error: 'Please provide remarks between 10 and 150 characters to proceed.' });
    }
  }

  try {
    // Enforce logic: can only approve if idea is currently Under Review
    const current = await prisma.idea.findUnique({ where: { id: ideaId }, select: { status: true } });
    if (!current) return res.status(404).json({ error: 'Idea not found' });
    
    // Approval needs Under Review
    if (status === 'Approved' && current.status !== 'Under Review') {
      return res.status(400).json({ error: 'An idea must be Under Review before it can be Approved.' });
    }
    
    // Do not allow re-approving or re-rejecting if it already is
    if (status === 'Rejected' && ['Approved', 'Rejected'].includes(current.status)) {
      return res.status(400).json({ error: 'Idea is already Approved or Rejected.' });
    }

    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        status,
        rejectionReason: (rejectionReason || '').trim(),
        ...(status === 'Approved' ? { approvalRemarks: (approvalRemarks || '').trim() } : {}),
        ...(status === 'Approved' && approvedById ? {
          approvedByUserId: parseInt(approvedById),
          approvedByRole: approvedByRole || 'admin'
        } : {})
      },
      include: { author: { select: { name: true, title: true, organization: true, mobile_number: true, employee_id: true, profile_photo_url: true } } }
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

        // Award +150 points for idea→project conversion
        awardPoints(idea.authorId, 'idea_approved', 150, ideaId);

        // DB Notifications
        notifyUser(idea.authorId, 'idea', `Your idea '${idea.title}' was APPROVED. A project (${projectId}) has been created.`, ideaId);
        notifyCentralTeam('idea', `Idea '${idea.title}' approved. Project ${projectId} created.`, ideaId);

        // Email author ONLY (Strict Rules)
        const authorInfo = await prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } });
        if (authorInfo && authorInfo.email) {
          sendIdeaStatusChangeEmail({
            toEmail: authorInfo.email,
            ideaTitle: idea.title,
            authorName: authorInfo.name,
            newStatus: 'Approved',
            projectId
          }).catch(console.error);
        }
      }
    } else if (status === 'Rejected') {
      const reason = (rejectionReason || '').trim();
      // DB Notifications
      notifyUser(idea.authorId, 'idea', `Your idea '${idea.title}' has been REJECTED. Reason: ${reason}`, ideaId);
      notifyCentralTeam('idea', `Idea '${idea.title}' was rejected. Reason: ${reason}`, ideaId);

      // Email author ONLY (Strict Rules)
      const authorInfo = await prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } });
      if (authorInfo && authorInfo.email) {
        sendIdeaStatusChangeEmail({
          toEmail: authorInfo.email,
          ideaTitle: idea.title,
          authorName: authorInfo.name,
          newStatus: 'Rejected',
          reason
        }).catch(console.error);
      }
    }

    // Terminal state — clear SLA
    clearSLA(ideaId);

    res.json({ message: `Idea marked as ${status}` });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Idea not found' });
    res.status(500).json({ error: error.message });
  }
});

// GET org admins (For Select Dropdown)
// Uses roles array so Org Admins who temporarily switched to Employee are still visible.
router.get('/orgadmins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { roles: { contains: 'Org Admin' } },
      select: { id: true, name: true, organization: true }
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/ideas/:id/regenerate-summary — Re-run AI summary for a specific idea
// Useful to backfill missing summaries without resubmitting.
router.post('/:id/regenerate-summary', async (req, res) => {
  const ideaId = parseInt(req.params.id);
  try {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    // Build enriched description from all text fields in extraFields
    let enriched = idea.description || '';
    try {
      const extra = JSON.parse(idea.extraFields || '{}');
      const TEXT_SKIP = new Set(['_templateId', '_templateName', 'referenceLink', 'supportingLink']);
      const parts = [];
      if (idea.description && !idea.description.startsWith('Submitted via ')) parts.push(idea.description);
      Object.entries(extra).forEach(([k, v]) => {
        if (!TEXT_SKIP.has(k) && typeof v === 'string' && v.trim()) {
          parts.push(`${k}: ${v.trim()}`);
        }
      });
      if (parts.length > 0) enriched = parts.join('\n\n');
    } catch(e) {}

    // Respond immediately — process in background
    res.json({ message: 'AI summary generation triggered.' });

    generateIdeaInsights({ title: idea.title, description: enriched, proposedSolution: '' })
      .then(async (insights) => {
        if (insights) {
          await prisma.idea.update({
            where: { id: ideaId },
            data: { aiSummary: insights.summary, aiTags: JSON.stringify(insights.tags) }
          });
          console.log(`[AI-Queue] Regenerated summary for idea ID: ${ideaId}`);
        }
      })
      .catch(err => console.error(`[AI-Queue] Regenerate failed for ID ${ideaId}:`, err));
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
    if (!result) {
      return res.json({ en: {}, hi: {} });
    }
    // New shape: { en: {...}, hi: {...} }
    if (result.en && typeof result.en === 'object') {
      return res.json({ en: result.en, hi: result.hi || {} });
    }
    // Legacy fallback: flat object returned — treat as English
    return res.json({ en: result, hi: {} });
  } catch (error) {
    console.error('[Autofill] Error:', error.message);
    res.json({ en: {}, hi: {} }); // Never fail — return empty if error
  }
});

// POST suggest template based on description
router.post('/suggest-template', async (req, res) => {
  const { description, templates } = req.body;
  if (!description || !Array.isArray(templates)) {
    return res.status(400).json({ error: 'description and templates array are required' });
  }
  
  const CONFIDENCE_THRESHOLD = 0.6;
  
  try {
    const suggestion = await suggestTemplate(description, templates);
    
    // Evaluate suggestion
    let finalTemplateId = null;
    if (
      suggestion.templateId && 
      suggestion.confidence >= CONFIDENCE_THRESHOLD && 
      templates.some(t => t.id === suggestion.templateId)
    ) {
      finalTemplateId = suggestion.templateId;
    }
    
    // Fallback logic
    if (!finalTemplateId) {
      console.log(`[SuggestTemplate] No confident match (id=${suggestion.templateId}, conf=${suggestion.confidence}). Attempting fallback...`);
      const fallbackTemplate = await prisma.ideaTemplate.findFirst({
        where: { isFallback: true }
      });
      
      if (fallbackTemplate) {
        finalTemplateId = fallbackTemplate.id;
      } else {
        return res.status(404).json({ error: 'NO_FALLBACK', message: 'No matching template found and no fallback template is configured.' });
      }
    }

    res.json({ templateId: finalTemplateId });
  } catch (error) {
    if (error.message === 'AUTH_ERROR') {
      console.error('[SuggestTemplate] Auth Error:', error.message);
      return res.status(503).json({ error: 'AUTH_ERROR', message: 'AI service unavailable' });
    }
    if (error.message === 'PARSE_ERROR') {
      console.error('[SuggestTemplate] Parse Error:', error.message);
      return res.status(502).json({ error: 'PARSE_ERROR', message: 'Malformed AI response' });
    }
    if (error.message === 'NETWORK_ERROR') {
      console.error('[SuggestTemplate] Network Error:', error.message);
      return res.status(503).json({ error: 'NETWORK_ERROR', message: 'Could not reach AI service' });
    }
    
    console.error('[SuggestTemplate] Unhandled Error:', error.message);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to suggest template' });
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
      return res.status(400).json({ error: 'You have already upvoted this idea. Upvotes are permanent.' });
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
