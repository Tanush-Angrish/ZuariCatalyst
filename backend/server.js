const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const usersRoutes = require('./routes/users');
const formFieldsRoutes = require('./routes/form-fields');
const templatesRoutes = require('./routes/templates');
const uploadRoutes = require('./routes/upload');
const projectsRoutes = require('./routes/projects');
const notificationsRoutes = require('./routes/notifications');
const pointsRoutes = require('./routes/points');
const { sendTestEmail } = require('./services/emailService');
const runSeed = require('./scripts/seed');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/form-fields', formFieldsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/points', pointsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zuari Catalyst Backend Running' });
});

// POST /api/test-email — verify Outlook email config
app.post('/api/test-email', async (req, res) => {
  const { toEmail, subject, message } = req.body;
  if (!toEmail || !subject || !message) {
    return res.status(400).json({ error: 'toEmail, subject, and message are required' });
  }
  try {
    const sent = await sendTestEmail({ toEmail, subject, message });
    if (sent) {
      res.json({ success: true, message: `Test email sent to ${toEmail}` });
    } else {
      res.status(500).json({ success: false, message: 'Email not sent — check EMAIL_USER and EMAIL_PASS in .env' });
    }
  } catch (err) {
    console.error('[Test-Email]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run seed and then start server
runSeed().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('SERVER ERROR EVENT:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please kill the process using it.`);
    }
    process.exit(1);
  });

}).catch(err => {
  console.error("Failed to start server due to seed error:", err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

process.on('exit', (code) => {
  console.log(`PROCESS EXITING WITH CODE: ${code}`);
  if (code === 0) {
    console.trace('Exit 0 trace:');
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  process.exit(0);
});
