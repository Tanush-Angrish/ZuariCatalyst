const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authMiddleware = require('../middleware/auth');

// All notification endpoints require authentication
router.use(authMiddleware);


// GET /api/notifications/:userId — Fetch notifications for user
router.get('/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent for performance
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/:id/read — Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Notification not found' });
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/user/:userId/read-all — Mark all as read for user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: parseInt(req.params.userId),
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id — Delete a single notification
router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Notification not found' });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/user/:userId — Clear all notifications for user
router.delete('/user/:userId', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: parseInt(req.params.userId) }
    });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
