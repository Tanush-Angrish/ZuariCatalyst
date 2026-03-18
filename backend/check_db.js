const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const notifs = await prisma.notification.findMany();
  console.log('Total notifications:', notifs.length);
  notifs.slice(-5).forEach(n => console.log(n));
}
run().catch(console.error).finally(() => process.exit(0));
