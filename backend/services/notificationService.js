/**
 * notificationService.js
 *
 * Centralized service to create persistent Notification records in the database.
 * Notifications are strictly user-specific to prevent shared state.
 */

const prisma = require('../db/prisma');

/**
 * Internal helper to create the actual DB record
 */
async function _createNotification(userId, type, message, referenceId = null) {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type,
        message,
        referenceId: referenceId ? parseInt(referenceId) : null
      }
    });
  } catch (err) {
    console.error(`[NotificationService] Error creating notification for user ${userId}:`, err.message);
  }
}

/**
 * Notify all Superadmins (Central Team)
 * Filters by `roles` array containing 'Superadmin', not the mutable `role` column.
 * This ensures Central Team members who temporarily switched to Employee
 * still receive all Central Team notifications.
 */
async function notifyCentralTeam(type, message, referenceId = null) {
  try {
    const admins = await prisma.user.findMany({
      where: { roles: { contains: 'Superadmin' } },
      select: { id: true }
    });
    await Promise.all(admins.map(a => _createNotification(a.id, type, message, referenceId)));
  } catch (err) {
    console.error('[NotificationService] Error notifying Central Team:', err);
  }
}

/**
 * Notify all Org Admins of a specific organization
 * Filters by `roles` array containing 'Org Admin', not the mutable `role` column.
 * This ensures Org Admins who temporarily switched to Employee
 * still receive all Org Admin notifications.
 */
async function notifyOrgAdmins(organization, type, message, referenceId = null) {
  if (!organization) return;
  try {
    const admins = await prisma.user.findMany({
      where: { roles: { contains: 'Org Admin' }, organization },
      select: { id: true }
    });
    await Promise.all(admins.map(a => _createNotification(a.id, type, message, referenceId)));
  } catch (err) {
    console.error(`[NotificationService] Error notifying Org Admins for ${organization}:`, err);
  }
}

/**
 * Notify a specific user by ID
 */
async function notifyUser(userId, type, message, referenceId = null) {
  await _createNotification(userId, type, message, referenceId);
}

/**
 * Notify a list of users by ID
 */
async function notifyUsers(userIds, type, message, referenceId = null) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  await Promise.all(uniqueIds.map(id => _createNotification(id, type, message, referenceId)));
}

module.exports = {
  notifyCentralTeam,
  notifyOrgAdmins,
  notifyUser,
  notifyUsers
};
