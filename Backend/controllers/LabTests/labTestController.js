// controllers/LabTests/labTestController.js
const Test = require("../../models/Test.js");

// GET /api/tests?category=Blood%20Test
exports.list = async (req, res) => {
  const { category, q } = req.query;
  const filter = {};
  if (category) filter.category = category;

  // optional name search (?q=glucose)
  if (q) filter.name = { $regex: q, $options: "i" };

  const docs = await Test.find(filter).sort({ createdAt: -1 });
  res.json(docs);
};

// GET /api/tests/:id
exports.getOne = async (req, res) => {
  const doc = await Test.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

// POST /api/tests
exports.create = async (req, res) => {
  const doc = await Test.create(req.body);
  res.status(201).json(doc);
};

// PUT /api/tests/:id
exports.update = async (req, res) => {
  const doc = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

// DELETE /api/tests/:id
exports.remove = async (req, res) => {
  const doc = await Test.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};

// NEW: GET /api/tests/categories → ["Blood Test","Urine Test","Imaging",...]
exports.categories = async (_req, res) => {
  const cats = await Test.distinct("category");
  res.json(cats.sort());
};
