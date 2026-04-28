const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

// All tour endpoints require authentication
router.use(authMiddleware);

// GET /api/tour/status — Get the current user's tour completion state
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const state = await prisma.tourState.findUnique({ where: { userId } });
    res.json({
      hasCompletedTour: state?.hasCompletedTour ?? false,
      completedAt: state?.completedAt ?? null,
      xpAwarded: state?.xpAwarded ?? false,
    });
  } catch (error) {
    console.error('[Tour] GET /status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tour/complete — Mark tour as completed and award 5 XP once
router.post('/complete', async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if XP was already awarded
    const existing = await prisma.tourState.findUnique({ where: { userId } });
    const alreadyAwarded = existing?.xpAwarded ?? false;

    // Upsert tour state — mark completed
    const updatedState = await prisma.tourState.upsert({
      where: { userId },
      create: { userId, hasCompletedTour: true, completedAt: new Date(), xpAwarded: true },
      update: { hasCompletedTour: true, completedAt: existing?.completedAt ?? new Date(), xpAwarded: true },
    });

    let xpGranted = 0;

    // Award 5 XP only once, only for Employees
    if (!alreadyAwarded) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role === 'Employee') {
        // Upsert UserPoint
        await prisma.userPoint.upsert({
          where: { userId },
          create: { userId, totalPoints: 5 },
          update: { totalPoints: { increment: 5 } },
        });

        // Insert PointLog — catch duplicate to avoid double-award
        try {
          await prisma.pointLog.create({
            data: { userId, actionType: 'tour_completed', points: 5, referenceId: null },
          });
          xpGranted = 5;
        } catch (dupError) {
          // Unique constraint violation = already logged, safe to ignore
          console.warn('[Tour] XP already logged, skipping:', dupError.message);
        }
      }
    }

    res.json({
      success: true,
      hasCompletedTour: updatedState.hasCompletedTour,
      completedAt: updatedState.completedAt,
      xpAwarded: updatedState.xpAwarded,
      xpGranted,
    });
  } catch (error) {
    console.error('[Tour] POST /complete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
