const path = require("path");
const HealthAwareness = require("../../models/HealthAwareness.js");

// Build an image URL/path from multer file (served via /uploads)
function pickImageUrl(req) {
  if (req.file) {
    return "/uploads/" + req.file.filename; // static served path
  }
  if (req.body.imageUrl) {
    return req.body.imageUrl; // accept direct URL when no file uploaded
  }
  return undefined;
}

// CRUD
exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.region) q.region = req.query.region;
    if (req.query.category) q.category = req.query.category;
    const docs = await HealthAwareness.find(q).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await HealthAwareness.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      summary: req.body.summary,
      description: req.body.description,
      type: req.body.type,
      mediaUrl: req.body.mediaUrl,
      category: req.body.category,
      region: req.body.region,
      severity: req.body.severity,
      activeFrom: req.body.activeFrom, // Mongoose will cast if ISO string
      activeTo: req.body.activeTo,
      createdBy: req.body.createdBy,
    };

    const img = pickImageUrl(req);
    if (img) payload.imageUrl = img;

    const doc = await HealthAwareness.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };

    // If a new file uploaded, overwrite imageUrl. If none, keep existing.
    const img = pickImageUrl(req);
    if (img) payload.imageUrl = img;

    const doc = await HealthAwareness.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const doc = await HealthAwareness.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
