const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const email = 'tanush.angrish@adventz.com';
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await prisma.user.update({
        where: { email },
        data: {
          role: 'Administrator',
          roles: JSON.stringify(['Administrator', 'Superadmin', 'Org Admin', 'Employee']),
          employee_id: '00001',
          title: 'full satck dev',
          mobile_number: '7710341386'
        }
      });
      console.log('Successfully updated local user to Administrator');
    } else {
      await prisma.user.create({
        data: {
          email,
          name: 'Tanush Angrish',
          role: 'Administrator',
          roles: JSON.stringify(['Administrator', 'Superadmin', 'Org Admin', 'Employee']),
          employee_id: '00001',
          title: 'full satck dev',
          mobile_number: '7710341386'
        }
      });
      console.log('Successfully created local user as Administrator');
    }
  } catch (err) {
    console.error('Failed to run patch:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
