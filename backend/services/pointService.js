const prisma = require('../db/prisma');

/**
 * Award (or revoke) points for a user action.
 * Idempotent for positive awards (skips if duplicate action+reference exists).
 * For upvote_received, negative points are allowed (revoke).
 */
async function awardPoints(userId, actionType, points, referenceId = null) {
  try {
    // For positive awards, check idempotency (skip duplicates)
    if (points > 0 && referenceId) {
      const existing = await prisma.pointLog.findUnique({
        where: {
          userId_actionType_referenceId: {
            userId,
            actionType,
            referenceId
          }
        }
      });
      if (existing) {
        console.log(`[Points] Skipping duplicate: ${actionType} for user ${userId}, ref ${referenceId}`);
        return null;
      }
    }

    // For negative points (upvote removal), delete the original log entry
    if (points < 0 && referenceId) {
      await prisma.pointLog.deleteMany({
        where: { userId, actionType, referenceId }
      });
    } else {
      // Create log entry
      await prisma.pointLog.create({
        data: { userId, actionType, points, referenceId }
      });
    }

    // Upsert total points
    await prisma.userPoint.upsert({
      where: { userId },
      update: { totalPoints: { increment: points } },
      create: { userId, totalPoints: Math.max(0, points) }
    });

    console.log(`[Points] ${points > 0 ? '+' : ''}${points} to user ${userId} (${actionType})`);
    return true;
  } catch (error) {
    console.error(`[Points] Error awarding points:`, error.message);
    return null;
  }
}

module.exports = { awardPoints };
