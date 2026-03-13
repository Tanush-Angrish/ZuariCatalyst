const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ideasRoutes = require('./routes/ideas');
const usersRoutes = require('./routes/users');
const formFieldsRoutes = require('./routes/form-fields');
const templatesRoutes = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/form-fields', formFieldsRoutes);
app.use('/api/templates', templatesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zuari Hive MVP Backend Running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
