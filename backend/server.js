const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const usersRoutes = require('./routes/users');
const formFieldsRoutes = require('./routes/form-fields');
const templatesRoutes = require('./routes/templates');
const uploadRoutes = require('./routes/upload');
const projectsRoutes = require('./routes/projects');
const notificationsRoutes = require('./routes/notifications');
const pointsRoutes = require('./routes/points');
const tourRoutes = require('./routes/tour');
const { sendTestEmail } = require('./services/emailService');
const runSeed = require('./scripts/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable gzip compression for API responses and static files
app.use(compression());

// Setup rate limiting to protect the server
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3000, // Increased limit for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 5 minutes.' }
});

// ─── CORS Configuration ──────────────────────────────────────────────────────
// Restrict to known origins only. credentials:true is required so the browser
// sends the httpOnly auth_token cookie on cross-origin requests (dev only —
// in production, frontend and API share the same domain via Nginx).
const ALLOWED_ORIGINS = [
  'https://catalyst.zuarione.com',
  'https://staging.catalyst.zuarione.com',
  'http://localhost:5173',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow same-origin requests (origin is undefined) and any listed origin
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' is not allowed`));
  },
  credentials: true, // Required for cookies to be sent cross-origin
}));
app.use(express.json({ limit: '2mb' }));


// Apply rate limiting exclusively to API routes
app.use('/api', apiLimiter);

// Serve uploaded files statically with 7-day browser cache
// Files use unique timestamped names and are never overwritten — safe to cache immutably
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true
}));

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
app.use('/api/tour', tourRoutes);

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

// ── Unified server: serve the built React frontend ────────────────────────
// When running via `npm run serve`, the frontend is built into frontend/dist.
// Express serves those static files and falls back to index.html for React Router.
// This makes the app work from a single URL on any network (local, same-network, AWS).
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
const frontendDistExists = require('fs').existsSync(path.join(FRONTEND_DIST, 'index.html'));

if (frontendDistExists) {
  app.use(express.static(FRONTEND_DIST));
  // Express 5 catch-all: named wildcard is required (bare '*' is not valid in Express 5)
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
  console.log('[Server] Serving built frontend from frontend/dist');
} else {
  console.log('[Server] No frontend/dist found — run "npm run serve" from root to build. Running API-only mode.');
}


// ─── Scheduled Background Jobs ────────────────────────────────────────────────
// The SLA engine uses these intervals to auto-escalate/approve ideas and send warnings.
const { runSLAChecks, runSLAReminders } = require('./services/slaService');

setInterval(() => {
  runSLAChecks().catch(err => console.error('[Cron] SLA Check error:', err));
}, 30 * 60 * 1000); // 30 mins

setInterval(() => {
  runSLAReminders().catch(err => console.error('[Cron] SLA Reminder error:', err));
}, 60 * 60 * 1000); // 1 hour

// Run once on startup (wait 5s so db is ready)
setTimeout(() => {
  runSLAChecks().catch(() => {});
  runSLAReminders().catch(() => {});
}, 5000);

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
