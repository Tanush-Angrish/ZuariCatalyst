/**
 * backfillPoints.js
 *
 * SAFE, DETERMINISTIC backfill for the Catalyst Scoring System.
 *
 * Steps:
 *  1. Clear all point_logs and user_points (clean slate)
 *  2. Re-award +10 for every idea submitted
 *  3. Re-award +50 for every idea that was Approved (has an associated project)
 *  4. Re-award +5 per valid upvote received by each idea author
 *  5. Re-award +100 for every project that is Completed
 *  6. Recalculate totals
 *
 * Run: node backfillPoints.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Catalyst Points Backfill ===\n');

  // ── 1. CLEAN SLATE ────────────────────────────────────────────────────────
  console.log('Step 1: Clearing existing point_logs and user_points...');
  await prisma.pointLog.deleteMany({});
  await prisma.userPoint.deleteMany({});
  console.log('  ✓ Cleared\n');

  // ── 2. IDEA SUBMISSIONS (+10) ─────────────────────────────────────────────
  console.log('Step 2: Awarding +10 per idea submitted...');
  const ideas = await prisma.idea.findMany({ select: { id: true, authorId: true, status: true } });
  let ideaCount = 0;
  for (const idea of ideas) {
    await prisma.pointLog.create({
      data: { userId: idea.authorId, actionType: 'idea_submitted', points: 10, referenceId: idea.id }
    });
    ideaCount++;
  }
  console.log(`  ✓ ${ideaCount} idea submissions logged\n`);

  // ── 3. IDEA APPROVED (+50) ────────────────────────────────────────────────
  console.log('Step 3: Awarding +50 per idea approved (has associated project)...');
  const projects = await prisma.project.findMany({
    select: { id: true, ideaId: true, createdById: true, status: true, steps: { select: { status: true } } }
  });
  let approvedCount = 0;
  for (const project of projects) {
    // Only award if the idea has a project (meaning it was approved)
    if (project.ideaId) {
      // Check for duplicate (idea might have been in both submission AND approval)
      const dup = await prisma.pointLog.findUnique({
        where: {
          userId_actionType_referenceId: {
            userId: project.createdById,
            actionType: 'idea_approved',
            referenceId: project.ideaId
          }
        }
      });
      if (!dup) {
        await prisma.pointLog.create({
          data: { userId: project.createdById, actionType: 'idea_approved', points: 50, referenceId: project.ideaId }
        });
        approvedCount++;
      }
    }
  }
  console.log(`  ✓ ${approvedCount} idea approvals logged\n`);

  // ── 4. UPVOTES RECEIVED (+5 each) ─────────────────────────────────────────
  console.log('Step 4: Awarding +5 per valid upvote received...');
  const upvotes = await prisma.upvote.findMany({ select: { id: true, ideaId: true } });
  let upvoteCount = 0;
  for (const upvote of upvotes) {
    const idea = await prisma.idea.findUnique({ where: { id: upvote.ideaId }, select: { authorId: true } });
    if (!idea) continue;
    await prisma.pointLog.create({
      data: { userId: idea.authorId, actionType: 'upvote_received', points: 5, referenceId: upvote.id }
    });
    upvoteCount++;
  }
  console.log(`  ✓ ${upvoteCount} upvote points logged\n`);

  // ── 5. PROJECT COMPLETED (+100) ───────────────────────────────────────────
  console.log('Step 5: Awarding +100 per completed project...');
  let completedCount = 0;
  for (const project of projects) {
    const isCompleted = project.status === 'Completed';
    if (isCompleted) {
      await prisma.pointLog.create({
        data: { userId: project.createdById, actionType: 'project_completed', points: 100, referenceId: project.id }
      });
      completedCount++;
    }
  }
  console.log(`  ✓ ${completedCount} completed projects logged\n`);

  // ── 6. COMPUTE TOTALS ─────────────────────────────────────────────────────
  console.log('Step 6: Computing user totals from point_logs...');
  const allLogs = await prisma.pointLog.findMany();

  // Group by userId
  const totals = {};
  for (const log of allLogs) {
    totals[log.userId] = (totals[log.userId] || 0) + log.points;
  }

  for (const [userIdStr, total] of Object.entries(totals)) {
    const userId = parseInt(userIdStr);
    await prisma.userPoint.upsert({
      where: { userId },
      update: { totalPoints: Math.max(0, total) },
      create: { userId, totalPoints: Math.max(0, total) }
    });
  }

  console.log('  ✓ Totals written\n');

  // ── REPORT ────────────────────────────────────────────────────────────────
  const finalPts = await prisma.userPoint.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { totalPoints: 'desc' }
  });
  console.log('=== Final Leaderboard ===');
  finalPts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.user?.name || 'User ' + p.userId}: ${p.totalPoints} pts`);
  });
  console.log('\n✅ Backfill complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
