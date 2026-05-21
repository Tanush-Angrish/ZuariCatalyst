const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const ideas = await prisma.idea.findMany();
    console.log(`Ideas count: ${ideas.length}`);
    if (ideas.length > 0) {
      console.log('Sample idea:', ideas[0]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
