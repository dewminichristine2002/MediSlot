// controllers/eventPatientController.js
const mongoose = require('mongoose');
const EventPatient = require('../models/EventPatient');

// Build filters from query
function buildFilters(query) {
  const f = {};

  if (query.nic) f.nic = query.nic.trim();
  if (query.gender) f.gender = query.gender; // Male/Female
  if (query.patient_id && mongoose.isValidObjectId(query.patient_id)) {
    f.patient_id = query.patient_id;
  }
  if (query.q) f.$text = { $search: query.q };

  // Age range: ?age_min=10&age_max=60
  if (query.age_min || query.age_max) {
    f.age = {};
    if (query.age_min) f.age.$gte = Number(query.age_min);
    if (query.age_max) f.age.$lte = Number(query.age_max);
  }

  return f;
}

// POST /api/event-patients
exports.create = async (req, res) => {
  try {
    const doc = await EventPatient.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    // Handle unique NIC violation nicely
    if (err?.code === 11000 && err?.keyPattern?.nic) {
      return res.status(409).json({ message: 'NIC already exists' });
    }
    return res.status(400).json({ message: 'Failed to create event patient', error: err.message });
  }
};

// GET /api/event-patients
// Supports q (text), nic, gender, patient_id, age range, pagination
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);

    // Sort by name asc by default, or created_at desc if ?sort=created_at&order=desc
    const allowed = new Set(['name', 'created_at', 'age']);
    const sortField = allowed.has(req.query.sort) ? req.query.sort : 'name';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    const [items, total] = await Promise.all([
      EventPatient.find(filters).sort(sort).skip(skip).limit(limit),
      EventPatient.countDocuments(filters),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
};

// GET /api/event-patients/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const doc = await EventPatient.findById(id);
    if (!doc) return res.status(404).json({ message: 'Event patient not found' });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch patient', error: err.message });
  }
};

// GET /api/event-patients/by-nic/:nic
exports.getByNIC = async (req, res) => {
  try {
    const nic = (req.params.nic || '').trim();
    if (!nic) return res.status(400).json({ message: 'NIC is required' });

    const doc = await EventPatient.findOne({ nic });
    if (!doc) return res.status(404).json({ message: 'Event patient not found' });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch by NIC', error: err.message });
  }
};

// PATCH /api/event-patients/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const update = req.body;

    // Prevent changing NIC to an existing one
    if (update.nic) {
      const exists = await EventPatient.findOne({ nic: update.nic, _id: { $ne: id } }).lean();
      if (exists) return res.status(409).json({ message: 'NIC already exists' });
    }

    const doc = await EventPatient.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: 'Event patient not found' });

    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update patient', error: err.message });
  }
};

// DELETE /api/event-patients/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const del = await EventPatient.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ message: 'Event patient not found' });

    return res.json({ message: 'Event patient deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete patient', error: err.message });
  }
};

// Optional: bulk import
// POST /api/event-patients/bulk
exports.bulkCreate = async (req, res) => {
  try {
    const docs = Array.isArray(req.body) ? req.body : [];
    if (!docs.length) return res.status(400).json({ message: 'Provide an array of patients' });

    const inserted = await EventPatient.insertMany(docs, { ordered: false });
    return res.status(201).json({ insertedCount: inserted.length, inserted });
  } catch (err) {
    // ordered:false may return partial success with writeErrors
    return res.status(207).json({
      message: 'Bulk insert completed with some errors',
      error: err.message,
      writeErrors: err?.writeErrors?.map(w => w.errmsg) || [],
    });
  }
};
