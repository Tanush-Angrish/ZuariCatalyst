const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { generateProjectPlan } = require('../services/geminiService');
const { awardPoints } = require('../services/pointService');
const { sendMentionEmail } = require('../services/emailService');
const {
  notifyCentralTeam,
  notifyOrgAdmins,
  notifyUser,
  notifyUsers
} = require('../services/notificationService');
const authMiddleware = require('../middleware/auth');

// All project endpoints require authentication
router.use(authMiddleware);


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

// ─── Visibility helper ─────────────────────────────────────────────────────
function buildProjectFilter(userId, role, organization) {
  if (role === 'Superadmin') return {}; // Central team sees everything
  if (role === 'Org Admin') return { orgId: organization };
  if (role === 'Employee') return {
    OR: [
      { createdById: userId },      // their own project
      { orgId: organization }       // same org
    ]
  };
  return { createdById: -1 }; // no access
}

// ─── GET /api/projects ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { userId, role, organization } = req.query;
  if (!userId || !role) return res.status(400).json({ error: 'userId and role are required' });

  try {
    const where = buildProjectFilter(parseInt(userId), role, organization || '');
    const projects = await prisma.project.findMany({
      where,
      include: {
        steps: true,
        // Join idea to get submitter + approver names
        idea: {
          select: {
            author: { select: { name: true } },
            approvedBy: { select: { name: true } },
            approvedByRole: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Flatten idea attribution fields onto project
    const formatted = projects.map(p => ({
      ...p,
      submittedByName: p.idea?.author?.name || null,
      approvedByName: p.idea?.approvedBy?.name || null,
      approvedByRole: p.idea?.approvedByRole || null,
      idea: undefined  // don't expose entire idea object
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/projects/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        steps: { orderBy: { id: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        idea: {
          select: {
            author: { select: { name: true } },
            approvedBy: { select: { name: true } },
            approvedByRole: true
          }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const formatted = {
      ...project,
      submittedByName: project.idea?.author?.name || null,
      approvedByName: project.idea?.approvedBy?.name || null,
      approvedByRole: project.idea?.approvedByRole || null,
      idea: undefined
    };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/projects/:id/status ─────────────────────────────────────────
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Initiated', 'In Progress', 'On Hold', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Valid: ' + validStatuses.join(', ') });
  }
  try {
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json(project);

    // DB Notifications
    notifyUser(project.createdById, 'project', `Project '${project.title}' status changed to ${status}.`, project.id);
    notifyOrgAdmins(project.orgId, 'project', `Project '${project.title}' status changed to ${status}.`, project.id);
    notifyCentralTeam('project', `Project '${project.title}' status changed to ${status}.`, project.id);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Project not found' });
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/projects/:id/deadline ───────────────────────────────────────
router.put('/:id/deadline', async (req, res) => {
  const { deadline } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: { deadline: deadline ? new Date(deadline) : null }
    });
    res.json(project);

    // DB Notifications
    const dt = deadline ? new Date(deadline).toLocaleDateString() : 'None';
    notifyUser(project.createdById, 'project', `Project '${project.title}' deadline updated to ${dt}.`, project.id);
    notifyOrgAdmins(project.orgId, 'project', `Project '${project.title}' deadline updated to ${dt}.`, project.id);
    notifyCentralTeam('project', `Project '${project.title}' deadline updated to ${dt}.`, project.id);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Project not found' });
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/projects/:id/steps ─────────────────────────────────────────
router.post('/:id/steps', async (req, res) => {
  const { description, status, deadline, dependencyStepId } = req.body;
  const projectId = parseInt(req.params.id);

  if (!description) return res.status(400).json({ error: 'Description is required' });

  try {
    // 1. Validate custom dependency 
    if (dependencyStepId) {
      const dep = await prisma.projectStep.findUnique({ where: { id: parseInt(dependencyStepId) } });
      if (!dep || dep.projectId !== projectId) {
        return res.status(400).json({ error: 'Invalid dependency step selected.' });
      }
      if ((status === 'Completed' || status === 'In Progress') && dep.status !== 'Completed') {
        return res.status(400).json({ error: 'Cannot start or complete this step until its dependency is marked Completed.' });
      }
    }

    // 2. Validate Sequential Deadline (ensure this step's deadline >= last step's deadline)
    if (deadline) {
      const lastStep = await prisma.projectStep.findFirst({
        where: { projectId },
        orderBy: { id: 'desc' }
      });
      if (lastStep && lastStep.deadline && new Date(deadline) < new Date(lastStep.deadline)) {
        return res.status(400).json({ error: 'Deadline must be after the preceding step\'s deadline.' });
      }
    }

    const step = await prisma.projectStep.create({
      data: {
        projectId,
        description,
        status: status || 'Pending',
        deadline: deadline ? new Date(deadline) : null,
        dependencyStepId: dependencyStepId ? parseInt(dependencyStepId) : null
      }
    });
    res.json(step);

    // DB Notifications
    const project = await prisma.project.findUnique({ where: { id: parseInt(req.params.id) } });
    if (project) {
      notifyUser(project.createdById, 'project', `New step added to project '${project.title}'.`, project.id);
      notifyOrgAdmins(project.orgId, 'project', `New step added to project '${project.title}'.`, project.id);
      notifyCentralTeam('project', `New step added to project '${project.title}'.`, project.id);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/projects/:id/steps/:stepId ──────────────────────────────────
router.put('/:id/steps/:stepId', async (req, res) => {
  const { description, status, deadline, dependencyStepId } = req.body;
  const stepId = parseInt(req.params.stepId);
  const projectId = parseInt(req.params.id);

  try {
    const existingStep = await prisma.projectStep.findUnique({ where: { id: stepId } });
    if (!existingStep) return res.status(404).json({ error: 'Step not found' });

    // Determine values to validate
    const finalDepId = dependencyStepId !== undefined ? (dependencyStepId ? parseInt(dependencyStepId) : null) : existingStep.dependencyStepId;
    const finalStatus = status !== undefined ? status : existingStep.status;
    const finalDeadline = deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingStep.deadline;

    // 1. Dependency Validation
    if (finalDepId) {
      if (finalDepId === stepId) return res.status(400).json({ error: 'A step cannot depend on itself.' });
      const dep = await prisma.projectStep.findUnique({ where: { id: finalDepId } });
      if (!dep || dep.projectId !== projectId) return res.status(400).json({ error: 'Invalid dependency step selected.' });
      
      if ((finalStatus === 'Completed' || finalStatus === 'In Progress') && dep.status !== 'Completed') {
        return res.status(400).json({ error: `Cannot mark as ${finalStatus} until dependent step '${dep.description.substring(0, 15)}...' is Completed.` });
      }
    }

    // 2. Sequential Deadline Validation (ensure it's not earlier than a preceding step)
    if (finalDeadline) {
      const prevStep = await prisma.projectStep.findFirst({
        where: { projectId, id: { lt: stepId } },
        orderBy: { id: 'desc' }
      });
      if (prevStep && prevStep.deadline && finalDeadline < new Date(prevStep.deadline)) {
        return res.status(400).json({ error: 'Deadline must be equal to or after the preceding step\'s deadline.' });
      }
    }

    const step = await prisma.projectStep.update({
      where: { id: stepId },
      data: {
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: finalDeadline }),
        ...(dependencyStepId !== undefined && { dependencyStepId: finalDepId })
      }
    });
    res.json(step);

    // DB Notifications (if status changed)
    if (status !== undefined) {
      const project = await prisma.project.findUnique({ where: { id: parseInt(req.params.id) } });
      if (project) {
        notifyUser(project.createdById, 'project', `Step in '${project.title}' marked as ${status}.`, project.id);
        notifyOrgAdmins(project.orgId, 'project', `Step in '${project.title}' marked as ${status}.`, project.id);
        notifyCentralTeam('project', `Step in '${project.title}' marked as ${status}.`, project.id);
      }
    }
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Step not found' });
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /api/projects/:id/steps/all ───────────────────────────────────
// MUST be declared BEFORE /:id/steps/:stepId — otherwise Express treats 'all' as a stepId
router.delete('/:id/steps/all', async (req, res) => {
  try {
    await prisma.projectStep.deleteMany({ where: { projectId: parseInt(req.params.id) } });
    res.json({ message: 'All steps deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /api/projects/:id/steps/:stepId ───────────────────────────────
router.delete('/:id/steps/:stepId', async (req, res) => {
  try {
    await prisma.projectStep.delete({ where: { id: parseInt(req.params.stepId) } });
    res.json({ message: 'Step deleted' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Step not found' });
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/projects/:id/steps/bulk ────────────────────────────────────
// Save multiple steps at once and optionally finalize (lock AI)
router.post('/:id/steps/bulk', async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { steps, finalize } = req.body; // finalize: boolean

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'steps array is required' });
  }

  // Pre-flight validation: sequential deadlines
  let lastValidDeadline = null;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.deadline) {
      const currentDl = new Date(s.deadline);
      if (lastValidDeadline && currentDl < lastValidDeadline) {
        return res.status(400).json({ error: `Sequential deadline error: Step ${i+1}'s deadline cannot be earlier than previous steps.` });
      }
      lastValidDeadline = currentDl;
    }
  }

  try {
    const created = await prisma.$transaction(
      steps.map(s => prisma.projectStep.create({
        data: {
          projectId,
          description: s.description,
          status: s.status || 'Pending',
          deadline: s.deadline ? new Date(s.deadline) : null,
          dependencyStepId: s.dependencyStepId ? parseInt(s.dependencyStepId) : null
        }
      }))
    );
    if (finalize) {
      await prisma.project.update({ where: { id: projectId }, data: { isStepsFinalized: true } });
    }
    res.json({ steps: created, isStepsFinalized: !!finalize });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ─── PUT /api/projects/:id/finalize-steps ─────────────────────────────────
// Permanently lock AI step generation for this project
router.put('/:id/finalize-steps', async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: { isStepsFinalized: true }
    });
    res.json({ isStepsFinalized: project.isStepsFinalized });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Project not found' });
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/projects/:id/messages ───────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await prisma.projectMessage.findMany({
      where: { projectId: parseInt(req.params.id) },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/projects/:id/messages ──────────────────────────────────────
router.post('/:id/messages', async (req, res) => {
  const { senderId, senderName, message, mentionedUserIds } = req.body;
  if (!senderId || !message) return res.status(400).json({ error: 'senderId and message required' });

  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const newMessage = await prisma.projectMessage.create({
      data: {
        projectId: parseInt(req.params.id),
        senderId: parseInt(senderId),
        senderName,
        message,
        mentionedUsers: JSON.stringify(mentionedUserIds || [])
      }
    });

    // 1. Send DB Notifications to EVERYONE else in the project Chat
    // To avoid spamming, let's just send DB notifications to people explicitly mentioned.
    // Wait, the project chat is relatively quiet. Let's just notify everyone if there's a new message?
    // User requested: "Chat: No email unless @mentioned", "Project Updates: Notify Employee, Org Admin, Central Team."
    // Let's notify participants in DB, but email ONLY mentioned.
    notifyUser(project.createdById, 'project', `New message in '${project.title}' from ${senderName}`, project.id);
    notifyOrgAdmins(project.orgId, 'project', `New message in '${project.title}' from ${senderName}`, project.id);
    notifyCentralTeam('project', `New message in '${project.title}' from ${senderName}`, project.id);

    // 2. Mention Handling: DB Notification (type 'mention') + Email (ONLY to target)
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { id: { in: mentionedUserIds.map(id => parseInt(id)) } },
        select: { id: true, name: true, email: true }
      });

      for (const u of mentionedUsers) {
        // Explicit mention DB record
        notifyUser(u.id, 'mention', `${senderName} mentioned you in '${project.title}'`, project.id);

        // ONLY email the target, NOT the Central Team (per user feedback)
        sendMentionEmail({
          toEmails: [u.email], // Only the mentioned user
          mentionedName: u.name,
          senderName,
          projectTitle: project.title,
          projectId: project.projectId,
          messageExcerpt: message.length > 300 ? message.slice(0, 300) + '…' : message
        }).catch(console.error);
      }
    }

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/projects/:id/gemini-plan ───────────────────────────────────
router.post('/:id/gemini-plan', async (req, res) => {
  const { title, problemDescription, proposedSolution } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const plan = await generateProjectPlan({ title, problemDescription, proposedSolution });
    if (!plan) return res.status(500).json({ error: 'Gemini could not generate a plan. Check API key.' });
    res.json({ steps: plan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/projects/:id/participants ───────────────────────────────────
// Returns list of users involved: creator + org admins in this org + superadmins
router.get('/:id/participants', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const participants = await prisma.user.findMany({
      where: {
        OR: [
          { id: project.createdById },
          { role: 'Org Admin', organization: project.orgId },
          { role: 'Superadmin' }
        ]
      },
      select: { id: true, name: true, role: true, email: true }
    });
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
