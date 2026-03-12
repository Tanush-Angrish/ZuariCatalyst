const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening legacy SQLite database:', err.message);
    process.exit(1);
  }
});

async function migrateData() {
  console.log('Starting data migration from SQLite to PostgreSQL...');

  try {
    // 1. Migrate Users
    console.log('Fetching Users from SQLite...');
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });

    console.log(`Found ${users.length} users. Migrating to PostgreSQL...`);
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {}, // Don't update if exists during migration to prevent overwriting
        create: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          title: user.title,
          password: user.password,
          organization: user.organization
        }
      });
    }
    console.log('Users migrated successfully.');

    // 2. Migrate Ideas
    console.log('Fetching Ideas from SQLite...');
    const ideas = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM ideas", [], (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });

    console.log(`Found ${ideas.length} ideas. Migrating to PostgreSQL...`);
    for (const idea of ideas) {
      // Ensure foreign keys exist. If a user was deleted in sqlite but idea remains, skip or assign to missing. 
      // Assuming all FKs are valid in current state.
      await prisma.idea.upsert({
        where: { id: idea.id },
        update: {},
        create: {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          department: idea.department,
          expectedImpact: idea.expectedImpact,
          supportingLink: idea.supportingLink,
          extraFields: idea.extraFields || "{}",
          status: idea.status,
          createdAt: new Date(idea.createdAt),
          authorId: idea.authorId,
          assignedToId: idea.assignedToId
        }
      });
    }
    console.log('Ideas migrated successfully.');

    // 3. Migrate Form Fields
    console.log('Fetching Form Fields from SQLite...');
    const formFields = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM form_fields", [], (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });

    console.log(`Found ${formFields.length} form fields. Migrating to PostgreSQL...`);
    for (const field of formFields) {
      await prisma.formField.upsert({
        where: { id: field.id },
        update: {},
        create: {
          id: field.id,
          formType: field.formType,
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          fieldType: field.fieldType,
          required: field.required === 1,
          sortOrder: field.sortOrder,
          options: field.options || "[]",
          isSystem: field.isSystem === 1
        }
      });
    }
    console.log('Form Fields migrated successfully.');

    // Update PostgreSQL sequences
    console.log('Updating PostgreSQL primary key sequences to prevent conflicts...');
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id)+1 FROM users), 1), false);`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('ideas', 'id'), COALESCE((SELECT MAX(id)+1 FROM ideas), 1), false);`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('form_fields', 'id'), COALESCE((SELECT MAX(id)+1 FROM form_fields), 1), false);`);
    
    console.log('Data migration complete! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    db.close();
  }
}

migrateData();
