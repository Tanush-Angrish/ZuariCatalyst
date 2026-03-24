const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// GET /api/points/leaderboard — Top 10 users by points
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await prisma.userPoint.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 10,
      include: {
        user: {
          select: { id: true, name: true, organization: true, role: true }
        }
      }
    });

    const result = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.user.name,
      organization: entry.user.organization || '—',
      role: entry.user.role,
      totalPoints: entry.totalPoints
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/points/user/:userId — Single user's points + recent logs
router.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const userPoint = await prisma.userPoint.findUnique({
      where: { userId }
    });

    const recentLogs = await prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      totalPoints: userPoint?.totalPoints || 0,
      logs: recentLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
