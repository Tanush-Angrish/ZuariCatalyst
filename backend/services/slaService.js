/**
 * slaService.js
 *
 * SLA-based workflow automation for Zuari Catalyst idea approvals.
 *
 * SLA window: 3 days at every stage.
 *
 * Stage flow:
 *   submitted          → pending_central      (3 days for Central Admin)
 *   no action          → under_review_central (auto-escalate, 3 more days)
 *   no action          → Auto Approve
 *
 *   assigned to Org Admin → pending_org_admin      (3 days for Org Admin)
 *   no action             → under_review_org_admin (auto-escalate, 3 more days)
 *   no action             → Auto Approve
 *
 * The background scheduler calls runSLAChecks() every 30 minutes.
 * Each check is idempotent — safe to run multiple times.
 */

const prisma = require('../db/prisma');
const { notifyCentralTeam, notifyUser, notifyOrgAdmins } = require('./notificationService');
const { sendEmail } = require('./emailService');

const SLA_DAYS = 3;
const SLA_MS   = SLA_DAYS * 24 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a Date SLA_DAYS from now */
function slaDeadlineFromNow() {
  return new Date(Date.now() + SLA_MS);
}

/** Fetch all Central Team emails (by roles array) */
async function getCentralEmails() {
  try {
    const users = await prisma.user.findMany({
      where: { roles: { contains: 'Superadmin' } },
      select: { email: true },
    });
    return users.map(u => u.email).filter(Boolean);
  } catch { return []; }
}

/** Fetch all Org Admin emails for a given org (by roles array) */
async function getOrgAdminEmails(organization) {
  if (!organization) return [];
  try {
    const users = await prisma.user.findMany({
      where: { roles: { contains: 'Org Admin' }, organization },
      select: { email: true },
    });
    return users.map(u => u.email).filter(Boolean);
  } catch { return []; }
}

/** Reusable HTML email builder for SLA notifications */
function slaEmailHtml({ heading, bodyHtml }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden}
  .hdr{background:#003580;padding:20px 28px}.hdr h1{color:#fff;margin:0;font-size:18px;font-weight:700}
  .hdr p{color:#a8c4f0;margin:4px 0 0;font-size:12px}
  .bod{padding:24px 28px}.bod p{color:#374151;font-size:14px;line-height:1.6;margin:0 0 14px}
  .box{background:#f8fafc;border-left:4px solid #003580;border-radius:0 6px 6px 0;padding:12px 16px;margin:14px 0;font-size:13px}
  .warn{background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:12px 16px;margin:14px 0;font-size:13px;color:#92400e}
  .btn{display:inline-block;background:#003580;color:#fff!important;text-decoration:none;padding:10px 22px;border-radius:6px;font-weight:600;font-size:14px;margin-top:14px}
  .ftr{padding:14px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:11px;color:#9ca3af;text-align:center}
</style></head>
<body><div class="wrap">
  <div class="hdr"><h1>💡 Zuari Catalyst</h1><p>Idea Management &amp; Innovation Platform</p></div>
  <div class="bod">
    <p><strong>${heading}</strong></p>
    ${bodyHtml}
    <div class="warn">⏱ <strong>SLA Notice:</strong> Action must be taken within ${SLA_DAYS} days, otherwise the request will auto-escalate or auto-approve to the next stage.</div>
    <div style="text-align:center;margin-top:20px">
      <a href="${process.env.APP_URL || 'https://catalyst.zuarione.com'}" class="btn">Open Zuari Catalyst</a>
    </div>
  </div>
  <div class="ftr">This is an automated SLA notification from Zuari Catalyst. Do not reply.</div>
</div></body></html>`;
}

// ─── Public: set SLA when stage changes ──────────────────────────────────────

/**
 * Call this whenever an idea enters a new SLA-tracked stage.
 * stage: "pending_central" | "under_review_central" | "pending_org_admin" | "under_review_org_admin"
 */
async function setSLA(ideaId, stage) {
  try {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { slaDeadline: slaDeadlineFromNow(), slaStage: stage },
    });
    console.log(`[SLA] Set stage="${stage}" for idea ${ideaId}, deadline=${slaDeadlineFromNow().toISOString()}`);
  } catch (err) {
    console.error(`[SLA] Failed to set SLA for idea ${ideaId}:`, err.message);
  }
}

/**
 * Clear SLA when idea reaches a terminal state (Approved / Rejected).
 */
async function clearSLA(ideaId) {
  try {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { slaDeadline: null, slaStage: null },
    });
  } catch (err) {
    console.error(`[SLA] Failed to clear SLA for idea ${ideaId}:`, err.message);
  }
}

// ─── Auto-approve helper (shared by both central and org-admin paths) ─────────

async function autoApprove(idea, approvedByRole) {
  try {
    // Find a Central Team user to credit as approver
    const approver = await prisma.user.findFirst({
      where: { roles: { contains: approvedByRole === 'central' ? 'Superadmin' : 'Org Admin' } },
      select: { id: true },
    });

    // Check if a project already exists (idempotency)
    const existing = await prisma.project.findUnique({ where: { ideaId: idea.id } });
    if (existing) {
      console.log(`[SLA] Idea ${idea.id} already has a project — skipping auto-approve.`);
      await clearSLA(idea.id);
      return;
    }

    const count     = await prisma.project.count();
    const projectId = `PROJ-${String(count + 1).padStart(4, '0')}`;

    await prisma.$transaction([
      prisma.idea.update({
        where: { id: idea.id },
        data: {
          status:          'Approved',
          approvedByUserId: approver?.id ?? null,
          approvedByRole:  approvedByRole,
          slaDeadline:     null,
          slaStage:        null,
        },
      }),
      prisma.project.create({
        data: {
          projectId,
          ideaId:      idea.id,
          orgId:       idea.author?.organization || 'Unknown',
          createdById: idea.authorId,
          title:       idea.title,
          aiSummary:   idea.aiSummary || null,
          status:      'Initiated',
        },
      }),
    ]);

    // Award points
    const { awardPoints } = require('./pointService');
    await awardPoints(idea.authorId, 'idea_approved', 150, idea.id).catch(() => {});

    console.log(`[SLA] Auto-approved idea ${idea.id} → project ${projectId}`);

    // Notify author
    const authorInfo = await prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } });
    notifyUser(idea.authorId, 'idea', `Your idea "${idea.title}" was Auto-Approved (SLA expired). Project ${projectId} created!`, idea.id).catch(() => {});
    notifyCentralTeam('idea', `[SLA Auto-Approve] Idea "${idea.title}" auto-approved. Project ${projectId} created.`, idea.id).catch(() => {});

    // Email author
    if (authorInfo?.email) {
      sendEmail({
        to: authorInfo.email,
        subject: `[Zuari Catalyst] 🎉 Your Idea was Auto-Approved — ${idea.title}`,
        html: slaEmailHtml({
          heading: `Your idea has been Auto-Approved!`,
          bodyHtml: `
            <p>Hello ${authorInfo.name},</p>
            <p>Your idea <strong>"${idea.title}"</strong> has been <strong style="color:#16a34a">automatically approved</strong> as the review SLA expired without a decision.</p>
            <div class="box">
              <div><strong>Project ID:</strong> ${projectId}</div>
              <div><strong>Status:</strong> Approved ✓</div>
            </div>
            <p>Log in to Zuari Catalyst to view your project and start collaborating with your team.</p>`,
        }),
        eventType: 'sla_auto_approve',
      }).catch(() => {});
    }

    // Email Central Team
    const centralEmails = await getCentralEmails();
    if (centralEmails.length) {
      sendEmail({
        to: centralEmails,
        subject: `[Zuari Catalyst] [SLA Auto-Approve] "${idea.title}" auto-approved`,
        html: slaEmailHtml({
          heading: 'Idea Auto-Approved due to SLA expiry',
          bodyHtml: `
            <p>The following idea was <strong>automatically approved</strong> because no action was taken within the ${SLA_DAYS}-day SLA window.</p>
            <div class="box">
              <div><strong>Idea:</strong> ${idea.title}</div>
              <div><strong>Author:</strong> ${idea.author?.name}</div>
              <div><strong>Project ID:</strong> ${projectId}</div>
            </div>`,
        }),
        eventType: 'sla_auto_approve_central',
      }).catch(() => {});
    }
  } catch (err) {
    console.error(`[SLA] Auto-approve failed for idea ${idea.id}:`, err.message);
  }
}

// ─── Auto-escalate: Pending Review → Under Review (Central) ──────────────────

async function escalatePendingToCentralReview(idea) {
  try {
    await prisma.idea.update({
      where: { id: idea.id },
      data: {
        status:      'Under Review',
        slaDeadline: slaDeadlineFromNow(),
        slaStage:    'under_review_central',
      },
    });

    console.log(`[SLA] Auto-escalated idea ${idea.id} → Under Review (Central)`);

    notifyCentralTeam('idea',
      `[SLA Auto-Escalate] Idea "${idea.title}" moved to Under Review automatically (SLA expired).`,
      idea.id,
    ).catch(() => {});

    const authorInfo = await prisma.user.findUnique({ where: { id: idea.authorId }, select: { name: true, email: true } });
    notifyUser(idea.authorId, 'idea',
      `Your idea "${idea.title}" was moved to Under Review (SLA auto-escalation). A decision will follow within ${SLA_DAYS} days.`,
      idea.id,
    ).catch(() => {});

    const centralEmails = await getCentralEmails();
    if (centralEmails.length) {
      sendEmail({
        to: centralEmails,
        subject: `[Zuari Catalyst] [SLA Escalation] "${idea.title}" moved to Under Review`,
        html: slaEmailHtml({
          heading: 'Idea auto-escalated to Under Review',
          bodyHtml: `
            <p>The following idea was <strong>automatically moved to Under Review</strong> because no action was taken within the ${SLA_DAYS}-day SLA window.</p>
            <div class="box">
              <div><strong>Idea:</strong> ${idea.title}</div>
              <div><strong>Author:</strong> ${idea.author?.name}</div>
              <div><strong>Organization:</strong> ${idea.author?.organization}</div>
            </div>
            <p>Please review and take action (Approve / Reject) within the next ${SLA_DAYS} days.</p>`,
        }),
        eventType: 'sla_escalate_central',
      }).catch(() => {});
    }

    // Also email author
    if (authorInfo?.email) {
      sendEmail({
        to: authorInfo.email,
        subject: `[Zuari Catalyst] Your Idea is Under Review — ${idea.title}`,
        html: slaEmailHtml({
          heading: `Your idea is now Under Review`,
          bodyHtml: `
            <p>Hello ${authorInfo.name},</p>
            <p>Your idea <strong>"${idea.title}"</strong> has been automatically moved to <strong>Under Review</strong>.</p>
            <p>The review team will make a final decision within ${SLA_DAYS} days. If no action is taken, your idea will be auto-approved.</p>`,
        }),
        eventType: 'sla_escalate_author',
      }).catch(() => {});
    }
  } catch (err) {
    console.error(`[SLA] Escalation (pending→central-review) failed for idea ${idea.id}:`, err.message);
  }
}

// ─── Auto-escalate: Assigned to Org Admin → Under Review (Org Admin) ─────────

async function escalatePendingOrgToOrgReview(idea) {
  try {
    await prisma.idea.update({
      where: { id: idea.id },
      data: {
        status:      'Under Review',
        slaDeadline: slaDeadlineFromNow(),
        slaStage:    'under_review_org_admin',
      },
    });

    console.log(`[SLA] Auto-escalated idea ${idea.id} → Under Review (Org Admin)`);

    // Notify assigned Org Admin
    if (idea.assignedToId) {
      notifyUser(idea.assignedToId, 'idea',
        `[SLA] Idea "${idea.title}" escalated to Under Review. Please approve or reject within ${SLA_DAYS} days.`,
        idea.id,
      ).catch(() => {});
    }
    notifyCentralTeam('idea',
      `[SLA Auto-Escalate] Idea "${idea.title}" assigned to Org Admin moved to Under Review (SLA expired).`,
      idea.id,
    ).catch(() => {});

    const orgAdminEmails = await getOrgAdminEmails(idea.author?.organization);
    const centralEmails  = await getCentralEmails();
    const toEmails       = [...new Set([...orgAdminEmails, ...centralEmails])];

    if (toEmails.length) {
      sendEmail({
        to: toEmails,
        subject: `[Zuari Catalyst] [SLA Escalation] "${idea.title}" moved to Under Review (Org Admin)`,
        html: slaEmailHtml({
          heading: 'Idea auto-escalated to Under Review (Org Admin)',
          bodyHtml: `
            <p>The following idea was automatically moved to <strong>Under Review</strong> because the Org Admin did not take action within ${SLA_DAYS} days.</p>
            <div class="box">
              <div><strong>Idea:</strong> ${idea.title}</div>
              <div><strong>Author:</strong> ${idea.author?.name}</div>
              <div><strong>Organization:</strong> ${idea.author?.organization}</div>
            </div>
            <p>Please review and take action (Approve / Reject) within the next ${SLA_DAYS} days.</p>`,
        }),
        eventType: 'sla_escalate_org_admin',
      }).catch(() => {});
    }
  } catch (err) {
    console.error(`[SLA] Escalation (org-pending→org-review) failed for idea ${idea.id}:`, err.message);
  }
}

// ─── Main background check — runs every 30 minutes ───────────────────────────

async function runSLAChecks() {
  const now = new Date();
  console.log(`[SLA] Running SLA checks at ${now.toISOString()}`);

  try {
    // Fetch all ideas that have an active SLA deadline in the past
    const overdueIdeas = await prisma.idea.findMany({
      where: {
        slaDeadline: { lte: now },
        slaStage:    { not: null },
      },
      include: {
        author: { select: { id: true, name: true, email: true, organization: true } },
      },
    });

    if (overdueIdeas.length === 0) {
      console.log('[SLA] No overdue ideas found.');
      return;
    }

    console.log(`[SLA] Found ${overdueIdeas.length} overdue idea(s).`);

    for (const idea of overdueIdeas) {
      const stage = idea.slaStage;

      if (stage === 'pending_central') {
        // Central Admin missed 3-day window → escalate to Under Review
        await escalatePendingToCentralReview(idea);

      } else if (stage === 'under_review_central') {
        // Central Admin missed Under Review window → Auto Approve
        await autoApprove(idea, 'central');

      } else if (stage === 'pending_org_admin') {
        // Org Admin missed 3-day window → escalate to Under Review (Org Admin)
        await escalatePendingOrgToOrgReview(idea);

      } else if (stage === 'under_review_org_admin') {
        // Org Admin missed Under Review window → Auto Approve
        await autoApprove(idea, 'admin');
      }
    }

    console.log('[SLA] SLA check complete.');
  } catch (err) {
    console.error('[SLA] runSLAChecks failed:', err.message);
  }
}

// ─── SLA reminder: warns 24 hours before deadline ────────────────────────────
// Called separately every hour — sends a warning if deadline is within 24h

async function runSLAReminders() {
  const now         = new Date();
  const in24h       = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const nearingDeadline = await prisma.idea.findMany({
      where: {
        slaDeadline: { gt: now, lte: in24h },
        slaStage:    { not: null },
      },
      include: {
        author: { select: { name: true, organization: true } },
      },
    });

    for (const idea of nearingDeadline) {
      const hoursLeft = Math.max(0, Math.round((new Date(idea.slaDeadline) - now) / 3600000));
      const stageLabel =
        idea.slaStage === 'pending_central'        ? 'Central Admin review'        :
        idea.slaStage === 'under_review_central'   ? 'Central Admin final decision' :
        idea.slaStage === 'pending_org_admin'      ? 'Org Admin review'             :
        idea.slaStage === 'under_review_org_admin' ? 'Org Admin final decision'     : 'review';

      // Notify relevant party
      if (idea.slaStage?.includes('central')) {
        notifyCentralTeam('idea',
          `⏰ SLA Warning: Idea "${idea.title}" — ${hoursLeft}h remaining for ${stageLabel}. Auto-action will trigger soon.`,
          idea.id,
        ).catch(() => {});

        const centralEmails = await getCentralEmails();
        if (centralEmails.length) {
          sendEmail({
            to: centralEmails,
            subject: `[Zuari Catalyst] ⏰ SLA Warning: ${hoursLeft}h left to review "${idea.title}"`,
            html: slaEmailHtml({
              heading: `SLA Warning — ${hoursLeft} hour(s) remaining`,
              bodyHtml: `
                <p>The following idea is approaching its SLA deadline and requires <strong>${stageLabel}</strong> action.</p>
                <div class="box">
                  <div><strong>Idea:</strong> ${idea.title}</div>
                  <div><strong>Author:</strong> ${idea.author?.name}</div>
                  <div><strong>Hours Remaining:</strong> ${hoursLeft}h</div>
                </div>
                <p>If no action is taken within ${hoursLeft} hour(s), the system will automatically escalate or approve this idea.</p>`,
            }),
            eventType: 'sla_warning',
          }).catch(() => {});
        }
      } else if (idea.slaStage?.includes('org_admin') && idea.author?.organization) {
        notifyOrgAdmins(idea.author.organization, 'idea',
          `⏰ SLA Warning: Idea "${idea.title}" — ${hoursLeft}h remaining for ${stageLabel}.`,
          idea.id,
        ).catch(() => {});

        const orgEmails = await getOrgAdminEmails(idea.author.organization);
        if (orgEmails.length) {
          sendEmail({
            to: orgEmails,
            subject: `[Zuari Catalyst] ⏰ SLA Warning: ${hoursLeft}h left to review "${idea.title}"`,
            html: slaEmailHtml({
              heading: `SLA Warning — ${hoursLeft} hour(s) remaining`,
              bodyHtml: `
                <p>The following idea requires your action (${stageLabel}) within <strong>${hoursLeft} hour(s)</strong>.</p>
                <div class="box">
                  <div><strong>Idea:</strong> ${idea.title}</div>
                  <div><strong>Author:</strong> ${idea.author?.name}</div>
                  <div><strong>Organization:</strong> ${idea.author?.organization}</div>
                  <div><strong>Hours Remaining:</strong> ${hoursLeft}h</div>
                </div>`,
            }),
            eventType: 'sla_warning_org',
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[SLA] runSLAReminders failed:', err.message);
  }
}

module.exports = { setSLA, clearSLA, runSLAChecks, runSLAReminders, SLA_DAYS };
