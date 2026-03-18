const { notifyCentralTeam } = require('./services/notificationService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('Testing notification generation...');
  await notifyCentralTeam('idea', 'TEST NOTIFICATION', 999);
  
  const notifs = await prisma.notification.findMany();
  console.log('Total notifications:', notifs.length);
  console.log(notifs);
}

runTest().catch(console.error).finally(() => process.exit(0));
