/**
 * clearIdeasForProduction.js
 *
 * Deletes ALL idea-related data (ideas, projects, upvotes, points, notifications)
 * to give a clean production slate.
 *
 * DOES NOT TOUCH:
 *   - users
 *   - idea_templates
 *   - template_access
 *   - template_categories
 *   - form_fields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting production cleanup — ideas only...\n');

  // 1. Upvotes (FK on ideaId — no cascade, must delete first)
  const upvotes = await prisma.upvote.deleteMany({});
  console.log(`✅ Deleted ${upvotes.count} upvotes`);

  // 2. Point logs (reference ideaId/projectId — no cascade)
  const pointLogs = await prisma.pointLog.deleteMany({});
  console.log(`✅ Deleted ${pointLogs.count} point log entries`);

  // 3. Reset all user points to 0 (keep the record, zero the score)
  const resetPoints = await prisma.userPoint.updateMany({
    data: { totalPoints: 0 },
  });
  console.log(`✅ Reset points for ${resetPoints.count} users → 0`);

  // 4. Notifications (reference ideaId/projectId via referenceId)
  const notifications = await prisma.notification.deleteMany({});
  console.log(`✅ Deleted ${notifications.count} notifications`);

  // 5. Project messages (cascade delete via projectId, but explicit is safer)
  const projectMessages = await prisma.projectMessage.deleteMany({});
  console.log(`✅ Deleted ${projectMessages.count} project messages`);

  // 6. Project steps (cascade delete via projectId, but explicit is safer)
  const projectSteps = await prisma.projectStep.deleteMany({});
  console.log(`✅ Deleted ${projectSteps.count} project steps`);

  // 7. Projects
  const projects = await prisma.project.deleteMany({});
  console.log(`✅ Deleted ${projects.count} projects`);

  // 8. Ideas (last, since projects/upvotes were FK-dependent on it)
  const ideas = await prisma.idea.deleteMany({});
  console.log(`✅ Deleted ${ideas.count} ideas`);

  console.log('\n🎉 Done! Database is clean and ready for production.');
  console.log('   Templates, users, form fields, and all config are untouched.');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
