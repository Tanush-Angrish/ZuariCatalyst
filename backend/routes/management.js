const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ─── GET /api/management/dashboard ───────────────────────────────────────────
// Returns all data needed for the Management Dashboard in one round-trip.
// Supports filters: org, category, status, from, to
router.get('/dashboard', async (req, res) => {
  try {
    const { org, category, status, from, to } = req.query;

    // ── 1. Fetch all reference data in parallel ───────────────────────────────
    const [allUsers, allTemplates, allTourStates, allPointLogs] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          organization: true,
          role: true,
          roles: true,
          last_login_at: true,
        }
      }),
      prisma.ideaTemplate.findMany({ select: { name: true, category: true } }),
      prisma.tourState.findMany({ select: { userId: true, hasCompletedTour: true, xpAwarded: true } }),
      // ponytail: 'tour_completed' action = 5pts awarded = "logged in" in our definition
      prisma.pointLog.findMany({
        where: { actionType: 'tour_completed' },
        select: { userId: true }
      }),
    ]);

    // ── 2. Build lookup maps ──────────────────────────────────────────────────
    // Map template name → category (for tagging ideas)
    const templateCategoryMap = {};
    const categorySet = new Set();
    for (const t of allTemplates) {
      templateCategoryMap[t.name] = t.category || 'Other';
      if (t.category) categorySet.add(t.category);
    }

    // Set of userIds who completed the tour (= "logged in" in business terms)
    const tourCompletedUserIds = new Set(allPointLogs.map(p => p.userId));

    // ── 3. Build date filter ──────────────────────────────────────────────────
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    // ── 4. Fetch ideas with applied filters ───────────────────────────────────
    const ideaWhere = { status: { not: 'Draft' } };
    if (org) ideaWhere.author = { organization: org };
    if (status) ideaWhere.status = status;
    if (from || to) ideaWhere.createdAt = dateFilter;

    const rawIdeas = await prisma.idea.findMany({
      where: ideaWhere,
      select: {
        id: true,
        status: true,
        department: true,
        extraFields: true,
        authorId: true,
        createdAt: true,
        author: { select: { organization: true } }
      }
    });

    // ── 5. Apply category filter (client-side on fetched ideas, template-based) ─
    const ideas = rawIdeas.filter(idea => {
      if (!category) return true;
      let templateName = 'General';
      try {
        const extra = JSON.parse(idea.extraFields || '{}');
        templateName = extra._templateName || 'General';
      } catch {}
      const ideaCategory = templateCategoryMap[templateName] || 'Other';
      return ideaCategory === category;
    });

    // Tag each idea with its category
    const ideasWithCategory = ideas.map(idea => {
      let templateName = 'General';
      try {
        const extra = JSON.parse(idea.extraFields || '{}');
        templateName = extra._templateName || 'General';
      } catch {}
      return { ...idea, ideaCategory: templateCategoryMap[templateName] || 'Other' };
    });

    // ── 6. Build organization list + master org set ────────────────────────────
    // Use roles[] array (not active role field) so role-switched users are counted correctly.
    const orgSet = new Set();
    for (const u of allUsers) {
      if (u.organization) orgSet.add(u.organization);
    }
    const organizations = [...orgSet].sort();

    // Full set of all orgs in the system — used as targetOrgs when no org filter set
    const allOrgs = [...orgSet].sort();

    // ── 7. KPI cards ─────────────────────────────────────────────────────────
    const totalIdeas = ideasWithCategory.length;
    const underReviewCount = ideasWithCategory.filter(i => i.status === 'Pending Review' || i.status === 'Under Review').length;
    const approvedCount = ideasWithCategory.filter(i => i.status === 'Approved').length;
    const declinedCount = ideasWithCategory.filter(i => i.status === 'Rejected').length;

    // Employees participated = distinct authors who submitted ≥1 idea (in filtered set)
    const participatingAuthorIds = new Set(ideasWithCategory.map(i => i.authorId));
    const employeesParticipated = participatingAuthorIds.size;

    // Total employees = users whose primary role is Employee (or have Employee in roles)
    // and belong to matching org (if org filter active)
    const employeeUsers = allUsers.filter(u => {
      try {
        const roles = JSON.parse(u.roles || '[]');
        const isEmployee = roles.includes('Employee') && !roles.includes('Org Admin') && !roles.includes('Superadmin') && !roles.includes('Administrator') && !roles.includes('Management');
        if (!isEmployee) return false;
        if (org) return u.organization === org;
        return true;
      } catch { return false; }
    });
    const totalEmployees = employeeUsers.length;
    const participationRate = totalEmployees > 0
      ? Math.round((employeesParticipated / totalEmployees) * 100)
      : 0;

    // ── 8. Ideas by category ──────────────────────────────────────────────────
    const categoryCountMap = {};
    for (const idea of ideasWithCategory) {
      const cat = idea.ideaCategory;
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    }
    const byCategory = Object.entries(categoryCountMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // ── 9. Department performance ─────────────────────────────────────────────
    // Find Org Admin for each org (= HOD)
    const hodByOrg = {};
    for (const u of allUsers) {
      try {
        const roles = JSON.parse(u.roles || '[]');
        if (roles.includes('Org Admin') && u.organization) {
          hodByOrg[u.organization] = u.name;
        }
      } catch {}
    }

    // Employee count per org
    const empCountByOrg = {};
    for (const u of employeeUsers) {
      if (u.organization) {
        empCountByOrg[u.organization] = (empCountByOrg[u.organization] || 0) + 1;
      }
    }

    // Aggregate idea stats per org
    const deptStatsMap = {};
    for (const idea of ideasWithCategory) {
      const deptOrg = idea.author?.organization;
      if (!deptOrg) continue;
      if (!deptStatsMap[deptOrg]) {
        deptStatsMap[deptOrg] = { submitted: 0, underReview: 0, approved: 0, declined: 0, authorIds: new Set() };
      }
      deptStatsMap[deptOrg].submitted++;
      deptStatsMap[deptOrg].authorIds.add(idea.authorId);
      if (idea.status === 'Pending Review' || idea.status === 'Under Review') deptStatsMap[deptOrg].underReview++;
      if (idea.status === 'Approved') deptStatsMap[deptOrg].approved++;
      if (idea.status === 'Rejected') deptStatsMap[deptOrg].declined++;
    }

    // Build final dept performance rows — ALL orgs (or just filtered org)
    // HOD column shows '—' if no Org Admin is assigned to that department.
    const targetOrgs = org ? [org] : allOrgs;
    const departmentPerformance = targetOrgs.map(deptOrg => {
      const stats = deptStatsMap[deptOrg] || { submitted: 0, underReview: 0, approved: 0, declined: 0, authorIds: new Set() };
      const totalEmp = empCountByOrg[deptOrg] || 0;
      const participated = stats.authorIds.size;
      const rate = totalEmp > 0 ? Math.round((participated / totalEmp) * 100) : 0;
      return {
        dept: deptOrg,
        hod: hodByOrg[deptOrg] || '—',
        submitted: stats.submitted,
        underReview: stats.underReview,
        approved: stats.approved,
        declined: stats.declined,
        participationRate: rate,
        totalEmployees: totalEmp,
      };
    }).sort((a, b) => b.submitted - a.submitted);

    // ── 10. HOD Engagement table ──────────────────────────────────────────────
    // "Never Logged In" = never completed tour (not in tourCompletedUserIds) AND no ideas
    // "Logged In, No Idea" = completed tour (tourCompletedUserIds) but 0 ideas
    // "Not Logged In (10+ Days)" = last_login_at < 10 days ago (regardless of ideas)

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    // Set of authorIds in the unfiltered idea set (for engagement tracking we use all-time, not filtered)
    const allIdeaAuthors = new Set(
      (await prisma.idea.findMany({ where: { status: { not: 'Draft' } }, select: { authorId: true } }))
        .map(i => i.authorId)
    );

    // Build engagement per org
    const hodEngagement = targetOrgs.map(deptOrg => {
      const orgEmployees = allUsers.filter(u => {
        try {
          const roles = JSON.parse(u.roles || '[]');
          return u.organization === deptOrg && roles.includes('Employee') && !roles.includes('Org Admin') && !roles.includes('Superadmin') && !roles.includes('Administrator') && !roles.includes('Management');
        } catch { return false; }
      });

      let neverLoggedIn = 0;
      let loggedInNoIdea = 0;
      let notLoggedIn10Days = 0;

      for (const emp of orgEmployees) {
        const hasCompletedTour = tourCompletedUserIds.has(emp.id);
        const hasIdea = allIdeaAuthors.has(emp.id);
        const lastLogin = emp.last_login_at;

        if (!hasCompletedTour && !hasIdea) neverLoggedIn++;
        if (hasCompletedTour && !hasIdea) loggedInNoIdea++;
        if (!lastLogin || lastLogin < tenDaysAgo) notLoggedIn10Days++;
      }

      return {
        hod: hodByOrg[deptOrg] || '—',
        dept: deptOrg,
        totalEmployees: orgEmployees.length,
        neverLoggedIn,
        loggedInNoIdea,
        notLoggedIn10Days,
      };
    }).sort((a, b) => b.totalEmployees - a.totalEmployees);

    // ── 11. Return ────────────────────────────────────────────────────────────
    res.json({
      filters: {
        organizations,
        categories: [...categorySet].sort(),
        statuses: ['Pending Review', 'Under Review', 'Approved', 'Rejected'],
      },
      kpis: {
        totalIdeas,
        underReview: underReviewCount,
        approved: approvedCount,
        declined: declinedCount,
        employeesParticipated,
        participationRate,
      },
      byCategory,
      departmentPerformance,
      hodEngagement,
    });
  } catch (error) {
    console.error('[Management Dashboard]', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
