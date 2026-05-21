const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

// All points/leaderboard endpoints require authentication
router.use(authMiddleware);

// ─── Shared eligibility filter ────────────────────────────────────────────────
// A user is eligible for the leaderboard if they have 'Employee' anywhere in
// their `roles` JSON array — regardless of which role is currently *active*.
// This means Org Admins and Central Team who also have the Employee role are
// consistently included, no matter what role they logged in with today.
//
// Because `roles` is stored as a JSON string (e.g. '["Employee","Org Admin"]'),
// Prisma's `string_contains` does a simple substring check — safe here because
// no other role name contains the word "Employee" as a substring.
const EMPLOYEE_ELIGIBLE = {
  user: {
    roles: { contains: 'Employee' },
  },
};

// Tie-break rule: equal points → lower userId wins
// (lower userId = created/registered earlier in the system, so they
//  were the first person to reach that points total)
const ORDER_BY = [
  { totalPoints: 'desc' },
  { userId: 'asc' },       // tie-break: first to reach the score wins
];

// ─── GET /api/points/leaderboard — Global top-50 ────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await prisma.userPoint.findMany({
      where: EMPLOYEE_ELIGIBLE,
      orderBy: ORDER_BY,
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, organization: true, role: true, roles: true, profile_photo_url: true }
        }
      }
    });

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user.name,
      organization: entry.user.organization || '—',
      role: entry.user.role,
      profilePhotoUrl: entry.user.profile_photo_url || null,
      totalPoints: entry.totalPoints,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/points/org-leaderboard — Org-scoped leaderboard ───────────────
// ?org=Distillery  → only users in that org
// (no ?org param)  → all orgs, same ordering as /leaderboard
router.get('/org-leaderboard', async (req, res) => {
  try {
    const orgFilter = req.query.org ? String(req.query.org).trim() : null;

    const where = {
      user: {
        ...EMPLOYEE_ELIGIBLE.user,
        ...(orgFilter ? { organization: orgFilter } : {}),
      },
    };

    const leaderboard = await prisma.userPoint.findMany({
      where,
      orderBy: ORDER_BY,
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, organization: true, role: true, roles: true, profile_photo_url: true }
        }
      }
    });

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user.name,
      organization: entry.user.organization || '—',
      role: entry.user.role,
      profilePhotoUrl: entry.user.profile_photo_url || null,
      totalPoints: entry.totalPoints,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/points/all-orgs-leaderboard — All orgs ranked in one shot ──────
// Returns an array of { org, entries[] } sorted by org name.
// Entries within each org are ranked 1…N by points, same tie-break as above.
// Visible to everyone — used by the department-wise section shown to all roles.
router.get('/all-orgs-leaderboard', async (req, res) => {
  try {
    const all = await prisma.userPoint.findMany({
      where: EMPLOYEE_ELIGIBLE,
      orderBy: ORDER_BY,
      include: {
        user: {
          select: { id: true, name: true, organization: true, role: true, roles: true, profile_photo_url: true }
        }
      }
    });

    // Group by organization
    const orgMap = {};
    for (const entry of all) {
      const org = entry.user.organization || '—';
      if (!orgMap[org]) orgMap[org] = [];
      orgMap[org].push({
        userId:        entry.userId,
        name:          entry.user.name,
        organization:  org,
        profilePhotoUrl: entry.user.profile_photo_url || null,
        totalPoints:   entry.totalPoints,
      });
    }

    // Entries are already globally sorted; re-rank within each org
    const result = Object.keys(orgMap).sort().map(org => ({
      org,
      entries: orgMap[org].map((e, i) => ({ ...e, rank: i + 1 })),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ─── GET /api/points/user/:userId — Single user's points + recent logs ────────
// Returns points for any user who has the Employee role in their roles array,
// regardless of their current active role.
router.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roles: true },
    });

    // Eligible if Employee is anywhere in the roles array
    let rolesArr = [];
    try { rolesArr = JSON.parse(user?.roles || '[]'); } catch { rolesArr = []; }
    const isEligible = rolesArr.includes('Employee');

    if (!user || !isEligible) {
      return res.json({ totalPoints: 0, logs: [] });
    }

    const userPoint = await prisma.userPoint.findUnique({ where: { userId } });

    const recentLogs = await prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      totalPoints: userPoint?.totalPoints || 0,
      logs: recentLogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
