const prisma = require('../db/prisma');

/**
 * Robust, idempotent point service.
 *
 * referenceId is always:
 *   - For idea_submitted  → idea.id
 *   - For idea_approved   → idea.id
 *   - For upvote_received → upvote.id  (stable unique ID per upvote row)
 *   - For project_completed → project row's numeric id (NOT the PROJ-XXXX string)
 *
 * The DB unique constraint on (userId, actionType, referenceId) prevents duplicates.
 */

/**
 * Award points. Fully idempotent — safe to call multiple times.
 * @param {number} userId
 * @param {string} actionType
 * @param {number} points  - positive to add, negative to remove
 * @param {number} referenceId
 */
async function awardPoints(userId, actionType, points, referenceId) {
  if (!userId || !actionType || points === 0 || !referenceId) return null;

  try {
    if (points > 0) {
      // ── ADD POINTS ────────────────────────────────────────────────────
      // Idempotency: skip if this exact (user, action, ref) already logged
      const existing = await prisma.pointLog.findUnique({
        where: { userId_actionType_referenceId: { userId, actionType, referenceId } }
      });
      if (existing) {
        console.log(`[Points] SKIP duplicate ${actionType} userId=${userId} ref=${referenceId}`);
        return null;
      }

      await prisma.$transaction([
        prisma.pointLog.create({ data: { userId, actionType, points, referenceId } }),
        prisma.userPoint.upsert({
          where: { userId },
          update: { totalPoints: { increment: points } },
          create: { userId, totalPoints: points }
        })
      ]);

      console.log(`[Points] +${points} to userId=${userId} (${actionType}, ref=${referenceId})`);
      return true;

    } else {
      // ── REMOVE POINTS ─────────────────────────────────────────────────
      // Only deduct if the original log entry actually exists
      const existing = await prisma.pointLog.findUnique({
        where: { userId_actionType_referenceId: { userId, actionType, referenceId } }
      });
      if (!existing) {
        console.log(`[Points] SKIP remove — no log found for ${actionType} userId=${userId} ref=${referenceId}`);
        return null;
      }

      const revertAmount = -existing.points; // always the inverse of what was given

      await prisma.$transaction([
        prisma.pointLog.delete({ where: { id: existing.id } }),
        prisma.userPoint.upsert({
          where: { userId },
          update: { totalPoints: { increment: revertAmount } },
          create: { userId, totalPoints: 0 }
        })
      ]);

      console.log(`[Points] ${revertAmount} to userId=${userId} (revoke ${actionType}, ref=${referenceId})`);
      return true;
    }
  } catch (error) {
    console.error(`[Points] Error:`, error.message);
    return null;
  }
}

/**
 * Recalculate a user's totalPoints from scratch from their point_logs.
 * Safe to call at any time — reads logs as source of truth.
 */
async function recalcUserPoints(userId) {
  const logs = await prisma.pointLog.findMany({ where: { userId } });
  const total = logs.reduce((sum, l) => sum + l.points, 0);
  await prisma.userPoint.upsert({
    where: { userId },
    update: { totalPoints: Math.max(0, total) },
    create: { userId, totalPoints: Math.max(0, total) }
  });
  return total;
}

module.exports = { awardPoints, recalcUserPoints };
