const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

// All upload endpoints require authentication
router.use(authMiddleware);


// Ensure upload directories exist
const fileDir = path.join(__dirname, '..', 'uploads', 'ideas', 'files');
const voiceDir = path.join(__dirname, '..', 'uploads', 'ideas', 'voice-notes');
fs.mkdirSync(fileDir, { recursive: true });
fs.mkdirSync(voiceDir, { recursive: true });

// Multer storage for files
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fileDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

// Multer storage for voice notes
const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, voiceDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + '.webm');
  }
});

const uploadFile = multer({
  storage: fileStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    // SVG is intentionally excluded: SVG files can contain embedded <script> tags
    // which execute in the browser when rendered, enabling stored XSS attacks.
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      console.log(`Upload rejected. Allowed: ${allowed}. Received: ${ext}`);
      cb(new Error(`File type not allowed: ${ext}`), false);
    }
  }
});

const uploadVoice = multer({
  storage: voiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST upload file
router.post('/file', uploadFile.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    name: req.file.originalname,
    url: `/uploads/ideas/files/${req.file.filename}`,
    type: 'file'
  });
});

// POST upload voice note
router.post('/voice', uploadVoice.single('voice'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No voice note uploaded' });
  res.json({
    name: `Voice Note - ${new Date().toLocaleString()}`,
    url: `/uploads/ideas/voice-notes/${req.file.filename}`,
    type: 'voice'
  });
});

module.exports = router;
