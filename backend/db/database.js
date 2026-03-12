const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL,
          name TEXT NOT NULL,
          title TEXT DEFAULT '',
          password TEXT DEFAULT 'password',
          organization TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS ideas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          department TEXT NOT NULL,
          expectedImpact TEXT NOT NULL,
          supportingLink TEXT,
          extraFields TEXT DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'Pending Review',
          authorId INTEGER NOT NULL,
          assignedToId INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(authorId) REFERENCES users(id),
          FOREIGN KEY(assignedToId) REFERENCES users(id)
        )
      `);

      // Dynamic form fields configuration table
      db.run(`
        CREATE TABLE IF NOT EXISTS form_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          formType TEXT NOT NULL,
          fieldName TEXT NOT NULL,
          fieldLabel TEXT NOT NULL,
          fieldType TEXT NOT NULL DEFAULT 'text',
          required INTEGER NOT NULL DEFAULT 0,
          sortOrder INTEGER NOT NULL DEFAULT 0,
          options TEXT DEFAULT '[]',
          isSystem INTEGER NOT NULL DEFAULT 0
        )
      `);

      // Migrate existing tables: add new columns if they don't exist
      db.run(`ALTER TABLE users ADD COLUMN title TEXT DEFAULT ''`, () => {});
      db.run(`ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'password'`, () => {});
      db.run(`ALTER TABLE ideas ADD COLUMN extraFields TEXT DEFAULT '{}'`, () => {});

      // Seed demo users if empty
      db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (!err && row.count === 0) {
          console.log('Seeding demo users for Simon and Sugar organizations...');
          
          // Central Team
          db.run(`INSERT INTO users (email, role, name, title, organization) VALUES ('central@adventz.com', 'Superadmin', 'Central Team', 'Administrator', 'Global')`);
          
          // Org Admins
          db.run(`INSERT INTO users (email, role, name, title, organization) VALUES ('simon.admin@adventz.com', 'Org Admin', 'Simon Admin', 'Regional Manager', 'Simon')`);
          db.run(`INSERT INTO users (email, role, name, title, organization) VALUES ('sugar.admin@adventz.com', 'Org Admin', 'Sugar Admin', 'Regional Manager', 'Sugar')`);
          
          // Employees
          db.run(`INSERT INTO users (email, role, name, title, organization) VALUES ('simon.emp@adventz.com', 'Employee', 'Simon Employee', 'Engineer', 'Simon')`);
          db.run(`INSERT INTO users (email, role, name, title, organization) VALUES ('sugar.emp@adventz.com', 'Employee', 'Sugar Employee', 'Analyst', 'Sugar')`);
        }
      });

      // Seed default form fields if empty
      db.get("SELECT COUNT(*) as count FROM form_fields", (err, row) => {
        if (!err && row.count === 0) {
          console.log('Seeding default form field definitions...');

          // User form fields (system)
          const userFields = [
            ['user', 'name', 'Name', 'text', 1, 1, '[]', 1],
            ['user', 'title', 'Title', 'text', 0, 2, '[]', 1],
            ['user', 'email', 'Email', 'text', 1, 3, '[]', 1],
            ['user', 'role', 'Role', 'select', 1, 4, '["Employee","Org Admin","Central Team"]', 1],
          ];

          // Idea form fields (system)
          const ideaFields = [
            ['idea', 'title', 'Idea Title', 'text', 1, 1, '[]', 1],
            ['idea', 'department', 'Department', 'text', 1, 2, '[]', 1],
            ['idea', 'description', 'Description', 'textarea', 1, 3, '[]', 1],
            ['idea', 'expectedImpact', 'Expected Impact', 'textarea', 1, 4, '[]', 1],
            ['idea', 'supportingLink', 'Supporting Link', 'url', 0, 5, '[]', 1],
          ];

          const stmt = db.prepare(`INSERT INTO form_fields (formType, fieldName, fieldLabel, fieldType, required, sortOrder, options, isSystem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
          userFields.forEach(f => stmt.run(f));
          ideaFields.forEach(f => stmt.run(f));
          stmt.finalize();
        }
      });
    });
  }
});

module.exports = db;
