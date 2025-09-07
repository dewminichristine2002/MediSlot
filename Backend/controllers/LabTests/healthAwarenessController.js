const HealthAwareness = require("../../models/HealthAwareness.js");

// CRUD
exports.list = async (req, res) => {
  const q = {};
  if (req.query.region) q.region = req.query.region;
  if (req.query.category) q.category = req.query.category;
  const docs = await HealthAwareness.find(q).sort({ createdAt: -1 });
  res.json(docs);
};

exports.getOne = async (req, res) => {
  const doc = await HealthAwareness.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

exports.create = async (req, res) => {
  const doc = await HealthAwareness.create(req.body);
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const doc = await HealthAwareness.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

exports.remove = async (req, res) => {
  const doc = await HealthAwareness.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};
