// controllers/labTestResultController.js
const mongoose = require('mongoose');
const LabTestResult = require('../../models/LabTestResult');

// Build filters for list endpoint
function buildFilters(q) {
  const f = {};
  if (q.user_id && mongoose.isValidObjectId(q.user_id)) f.user_id = q.user_id;
  if (q.q) f.testOrEvent_name = { $regex: q.q.trim(), $options: 'i' }; // case-insensitive
  if (q.from || q.to) {
    f.uploaded_at = {};
    if (q.from) f.uploaded_at.$gte = new Date(q.from);
    if (q.to) f.uploaded_at.$lte = new Date(q.to);
  }
  return f;
}

// POST /api/lab-tests
exports.create = async (req, res) => {
  try {
    // If you later use multer, populate file_path from req.file.path or req.file.location
    const doc = await LabTestResult.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create lab test result', error: err.message });
  }
};

// GET /api/lab-tests
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);

    // sort by uploaded_at desc by default
    const allowed = new Set(['uploaded_at', 'testOrEvent_name']);
    const sortField = allowed.has(req.query.sort) ? req.query.sort : 'uploaded_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      LabTestResult.find(filters).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
      LabTestResult.countDocuments(filters),
    ]);

    return res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch lab test results', error: err.message });
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
    return res.status(500).json({ message: 'Failed to fetch lab test result', error: err.message });
  }
};

// PATCH /api/lab-tests/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const update = req.body; // e.g., { testOrEvent_name, file_path }
    const doc = await LabTestResult.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: 'Lab test result not found' });

    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update lab test result', error: err.message });
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
    return res.status(500).json({ message: 'Failed to delete lab test result', error: err.message });
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

// Optional: bulk insert array of results
// POST /api/lab-tests/bulk
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
      writeErrors: err?.writeErrors?.map(w => w.errmsg) || [],
    });
  }
};
