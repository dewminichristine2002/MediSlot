// routes/freeEventsRoutes/labTestResultRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const ctrl = require('../../controllers/freeeventsController/labTestResultController');

// Multer storage to /uploads/reports
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads/reports'));
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// Optional file filter & size limit
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    // Allow PDFs + common image types
    const ok = /\.(pdf|png|jpe?g|webp|heic|gif|tiff)$/i.test(file.originalname);
    if (!ok) return cb(new Error('Only PDF or image files are allowed'));
    cb(null, true);
  },
});

// Create / Bulk (create supports multipart upload.single('file'))
router.post('/', upload.single('file'), ctrl.create);
router.post('/bulk', ctrl.bulkCreate);

// Read (list + by user + by id)
router.get('/', ctrl.list);
router.get('/user/:userId', ctrl.listByUser);
router.get('/:id', ctrl.getById);

// Update (allow replacing the file too)
router.patch('/:id', upload.single('file'), ctrl.update);

// Download (forces Content-Disposition)
router.get('/:id/download', ctrl.download);

// Delete
router.delete('/:id', ctrl.remove);

module.exports = router;
