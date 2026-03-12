const prisma = require('./prisma');

// Database.js is now fully migrated to Prisma.
// The raw sqlite3 connection is no longer used.

// If any file still imports database.js, they should import prisma instead.
// To ease transition, we export prisma.
module.exports = prisma;
