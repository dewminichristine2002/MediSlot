// controllers/LabTests/labTestController.js
const Test = require("../../models/Test.js");

// helper: merge localized fields over base with fallback
function localizeTest(doc, lang) {
  if (!lang) return doc;
  const t = (doc.translations && doc.translations[lang]) || {};
  return {
    ...doc,
    name: t.name || doc.name,
    category: t.category || doc.category,
    what: t.what || doc.what,
    why: t.why || doc.why,
    preparation: Array.isArray(t.preparation) && t.preparation.length ? t.preparation : doc.preparation,
    during: Array.isArray(t.during) && t.during.length ? t.during : doc.during,
    after: Array.isArray(t.after) && t.after.length ? t.after : doc.after,
    checklist: Array.isArray(t.checklist) && t.checklist.length ? t.checklist : doc.checklist,
    mediaUrl: t.mediaUrl || doc.mediaUrl,
  };
}

// GET /api/tests?category=Blood%20Test&lang=si&category_si=ලේ%20පරීක්ෂණය&q=cbc
exports.list = async (req, res) => {
  const { category, category_si, q, lang } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (category_si) filter["translations.si.category"] = category_si;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { "translations.si.name": { $regex: q, $options: "i" } },
    ];
  }

  const docs = await Test.find(filter).sort({ createdAt: -1 }).lean();
  res.json(lang ? docs.map(d => localizeTest(d, lang)) : docs);
};

// GET /api/tests/:id?lang=si
exports.getOne = async (req, res) => {
  const { lang } = req.query;
  const doc = await Test.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(lang ? localizeTest(doc, lang) : doc);
};

// POST /api/tests
exports.create = async (req, res) => {
  const doc = await Test.create(req.body);
  res.status(201).json(doc);
};

// PUT /api/tests/:id
exports.update = async (req, res) => {
  const doc = await Test.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};



// DELETE /api/tests/:id
exports.remove = async (req, res) => {
  const doc = await Test.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};

// GET /api/tests/categories
exports.categories = async (_req, res) => {
  const cats = await Test.distinct("category");
  res.json(cats.sort());
};
