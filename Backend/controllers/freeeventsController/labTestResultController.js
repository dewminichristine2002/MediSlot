// controllers/freeeventsController/labTestResultController.js
const mongoose = require('mongoose');
const LabTestResult = require('../../models/LabTestResult');
const fs = require('fs');
const path = require('path');

// Build filters for list endpoint
function buildFilters(q) {
  const f = {};
  if (q.user_id && mongoose.isValidObjectId(q.user_id)) f.user_id = q.user_id;
  if (q.q) f.testOrEvent_name = { $regex: q.q.trim(), $options: 'i' };
  if (q.from || q.to) {
    f.uploaded_at = {};
    if (q.from) f.uploaded_at.$gte = new Date(q.from);
    if (q.to) f.uploaded_at.$lte = new Date(q.to);
  }
  return f;
}

// POST /api/lab-tests  (supports multipart form-data via multer.single('file'))
exports.create = async (req, res) => {
  try {
    const body = { ...req.body };

    if (req.file) {
      // Stored as an API-relative path so frontend can make absolute with base URL
      body.file_path = `/uploads/reports/${req.file.filename}`;
    }

    if (!body.user_id || !mongoose.isValidObjectId(body.user_id)) {
      return res.status(400).json({ message: 'Invalid or missing user_id' });
    }
    if (!body.testOrEvent_name) {
      return res.status(400).json({ message: 'testOrEvent_name is required' });
    }
    if (!body.file_path) {
      return res.status(400).json({
        message: 'file is required (multipart) or file_path must be provided',
      });
    }

    const doc = await LabTestResult.create(body);
    return res.status(201).json(doc);
  } catch (err) {
    return res
      .status(400)
      .json({ message: 'Failed to create lab test result', error: err.message });
  }
};

// GET /api/lab-tests
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);

    const allowed = new Set(['uploaded_at', 'testOrEvent_name']);
    const sortField = allowed.has(req.query.sort) ? req.query.sort : 'uploaded_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      LabTestResult.find(filters).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
      LabTestResult.countDocuments(filters),
    ]);

    return res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch lab test results', error: err.message });
  }
};

// GET /api/lab-tests/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const doc = await LabTestResult.findById(id);
    if (!doc) return res.status(404).json({ message: 'Lab test result not found' });
    return res.json(doc);
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch lab test result', error: err.message });
  }
};

// PATCH /api/lab-tests/:id  (supports multipart form-data to replace file)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const update = { ...req.body };
    if (req.file) {
      update.file_path = `/uploads/reports/${req.file.filename}`;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const doc = await LabTestResult.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: 'Lab test result not found' });

    return res.json(doc);
  } catch (err) {
    return res
      .status(400)
      .json({ message: 'Failed to update lab test result', error: err.message });
  }
};

// DELETE /api/lab-tests/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const del = await LabTestResult.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Lab test result not found' });

    return res.json({ message: 'Lab test result deleted' });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to delete lab test result', error: err.message });
  }
};

// GET /api/lab-tests/user/:userId (latest first)
exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid userId' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      LabTestResult.find({ user_id: userId }).sort({ uploaded_at: -1 }).skip(skip).limit(limit),
      LabTestResult.countDocuments({ user_id: userId }),
    ]);

    return res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch by user', error: err.message });
  }
};

// GET /api/lab-tests/:id/download  (force download or redirect if remote URL)
exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const doc = await LabTestResult.findById(id);
    if (!doc) return res.status(404).json({ message: 'Lab test result not found' });

    // If file_path is an absolute URL (S3, etc.), redirect to it
    if (doc.file_path && /^https?:\/\//i.test(doc.file_path)) {
      return res.redirect(doc.file_path);
    }

    // Resolve local file path
    const relative = (doc.file_path || '').replace(/^\//, ''); // remove leading slash
    const absPath = path.join(__dirname, '../../', relative);

    if (!relative || !fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Use a nice filename for the user
    const base = (doc.testOrEvent_name || 'report').replace(/[^\w\-]+/g, '_');
    const ext = path.extname(absPath) || '.pdf';
    const downloadName = `${base}${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.download(absPath, downloadName);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to download report', error: err.message });
  }
};

// Optional: POST /api/lab-tests/bulk
exports.bulkCreate = async (req, res) => {
  try {
    const docs = Array.isArray(req.body) ? req.body : [];
    if (!docs.length) return res.status(400).json({ message: 'Provide an array of lab test results' });

    const inserted = await LabTestResult.insertMany(docs, { ordered: false });
    return res.status(201).json({ insertedCount: inserted.length, inserted });
  } catch (err) {
    return res.status(207).json({
      message: 'Bulk insert completed with some errors',
      error: err.message,
      writeErrors: err?.writeErrors?.map((w) => w.errmsg) || [],
    });
  }
};
