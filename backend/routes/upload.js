const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const authMiddleware = require('../middleware/auth');

// All upload endpoints require authentication
router.use(authMiddleware);


// Ensure upload directories exist
const fileDir = path.join(__dirname, '..', 'uploads', 'ideas', 'files');
const voiceDir = path.join(__dirname, '..', 'uploads', 'ideas', 'voice-notes');
const profileDir = path.join(__dirname, '..', 'uploads', 'profiles');
fs.mkdirSync(fileDir, { recursive: true });
fs.mkdirSync(voiceDir, { recursive: true });
fs.mkdirSync(profileDir, { recursive: true });

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

// Multer memory storage for profile photos (we'll process with sharp before saving)
const profileStorage = multer.memoryStorage();

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

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB input (we compress down)
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeAllowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(ext) && mimeAllowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) are allowed for profile photos'), false);
    }
  }
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

// POST upload profile photo — compressed to 400x400 JPEG at 80% quality
router.post('/profile-photo', uploadProfile.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

  try {
    const filename = `profile-${req.user.id}-${Date.now()}.jpg`;
    const outputPath = path.join(profileDir, filename);

    // Compress: resize to max 400x400, convert to JPEG 80% quality
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',      // crop to fill the square
        position: 'centre' // center the crop
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(outputPath);

    const url = `/uploads/profiles/${filename}`;
    res.json({ url });
  } catch (err) {
    console.error('[Profile Photo Upload] Error:', err.message);
    res.status(500).json({ error: 'Failed to process photo. Please try again.' });
  }
});

module.exports = router;
