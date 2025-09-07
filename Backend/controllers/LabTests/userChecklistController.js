const UserChecklist = require("../../models/UserChecklist.js");
const Test = require("../../models/Test.js");

// Create from Test’s checklist
exports.createFromTest = async (req, res) => {
  const { userId, testId } = req.body;
  if (!userId || !testId) {
    return res.status(400).json({ message: "userId and testId required" });
  }

  const test = await Test.findOne({ testId }); // uses your testId field
  if (!test) return res.status(404).json({ message: "Test not found" });

  const items = (test.checklist || []).map(i => ({
    key: i.key,
    label: i.label,
    isMandatory: !!i.isMandatory,
    value: false,
  }));

  const total = items.length;

  // upsert: one per user+test
  const doc = await UserChecklist.findOneAndUpdate(
    { userId, testId },
    { userId, testId, items, totalCount: total, completedCount: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(doc);
};

// List for a user (optional filter by testId)
exports.listForUser = async (req, res) => {
  const { userId, testId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });
  const q = { userId };
  if (testId) q.testId = testId;
  const docs = await UserChecklist.find(q).sort({ updatedAt: -1 });
  res.json(docs);
};

exports.getOne = async (req, res) => {
  const doc = await UserChecklist.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

// Toggle one checklist item by key
exports.toggleItem = async (req, res) => {
  const { id, key } = { id: req.params.id, key: req.params.key };
  const { value } = req.body; // true/false
  const doc = await UserChecklist.findById(id);
  if (!doc) return res.status(404).json({ message: "Not found" });

  let completed = 0;
  doc.items = doc.items.map(it => {
    if (it.key === key) it.value = !!value;
    if (it.value) completed++;
    return it;
  });
  doc.completedCount = completed;
  await doc.save();
  res.json(doc);
};

// Reset all items to false
exports.resetAll = async (req, res) => {
  const doc = await UserChecklist.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  doc.items = doc.items.map(it => ({ ...it.toObject(), value: false }));
  doc.completedCount = 0;
  await doc.save();
  res.json(doc);
};

// Delete a checklist
exports.remove = async (req, res) => {
  const doc = await UserChecklist.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};
