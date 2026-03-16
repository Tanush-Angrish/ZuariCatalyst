const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const usersRoutes = require('./routes/users');
const formFieldsRoutes = require('./routes/form-fields');
const templatesRoutes = require('./routes/templates');
const uploadRoutes = require('./routes/upload');
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zuari Catalyst Backend Running' });
});

// Run seed and then start server
runSeed().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server due to seed error:", err);
});
