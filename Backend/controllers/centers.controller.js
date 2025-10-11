const mongoose = require("mongoose");
const HealthCenter = require("../models/HealthCenter");
const CenterService = require("../models/CenterService");

// Helper: compute open/closed now from opening/closing_time (simple daily window, Asia/Colombo)
function openNowDoc(openingField, closingField) {
  return {
    $let: {
      vars: { now: { $dateToString: { format: "%H:%M", date: "$$NOW", timezone: "Asia/Colombo" } } },
      in: { $and: [{ $lte: [openingField || "00:00", "$$now"] }, { $lt: ["$$now", closingField || "23:59"] }] }
    }
  };
}

// GET /api/centers?q=&province=&district=&openNow=true
exports.listCenters = async (req, res) => {
  try {
    const { q, province, district, openNow } = req.query;
    const match = { isActive: true };
    if (province) match["address.province"] = province;
    if (district) match["address.district"] = district;

    const pipeline = [{ $match: match }];
    if (q) pipeline.unshift({ $match: { $text: { $search: q } } });

    pipeline.push({ $addFields: { isOpenNow: openNowDoc("$opening_time", "$closing_time") } });
    if (openNow === "true") pipeline.push({ $match: { isOpenNow: true } });

    pipeline.push({
      $project: {
        name: 1, address: 1, contact: 1, email: 1, location: 1, services: 1,
        opening_time: 1, closing_time: 1, isOpenNow: 1
      }
    });

    const centers = await HealthCenter.aggregate(pipeline).limit(200);
    res.json(centers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list centers" });
  }
};

// GET /api/centers/nearby?lng=&lat=&maxKm=50
exports.nearbyCenters = async (req, res) => {
  try {
    const { lng, lat, maxKm = 50 } = req.query;
    if (lng == null || lat == null) return res.status(400).json({ error: "lng and lat are required" });

    const centers = await HealthCenter.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distanceMeters",
          maxDistance: Number(maxKm) * 1000,
          spherical: true,
          query: { isActive: true }
        }
      },
      { $addFields: { isOpenNow: openNowDoc("$opening_time", "$closing_time") } },
      { $addFields: { distanceKm: { $round: [{ $divide: ["$distanceMeters", 1000] }, 2] } } },
      {
        $project: {
          name: 1, address: 1, contact: 1, email: 1, location: 1, services: 1,
          opening_time: 1, closing_time: 1, isOpenNow: 1, distanceKm: 1
        }
      }
    ]).limit(100);

    res.json(centers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch nearby centers" });
  }
};

// GET /api/centers/:id
exports.getCenterById = async (req, res) => {
  try {
    const doc = await HealthCenter.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Center not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch center" });
  }
};

// ✅ GET /api/centers/:id/tests?lang=si
// Merge medical content from Test.js + per-center fields from CenterService
exports.getCenterTests = async (req, res) => {
  try {
    const centerId = new mongoose.Types.ObjectId(req.params.id);
    const lang = (req.query.lang || "").toLowerCase(); // "si" for Sinhala

    const rows = await CenterService.aggregate([
      { $match: { health_center_id: centerId, isActive: true } },
      {
        $lookup: {
          from: "tests",                 // collection for models/Test.js (canonical)
          localField: "test_id",
          foreignField: "_id",
          as: "test"
        }
      },
      { $unwind: "$test" },

      // Build base + localized (Sinhala) objects to overlay
      {
        $addFields: {
          _base: {
            name: "$test.name",
            what: "$test.what",
            why: "$test.why",
            preparation: "$test.preparation",
            during: "$test.during",
            after: "$test.after",
            checklist: "$test.checklist",
            mediaUrl: "$test.mediaUrl",
          },
          _si: {
            name: "$test.translations.si.name",
            what: "$test.translations.si.what",
            why: "$test.translations.si.why",
            preparation: "$test.translations.si.preparation",
            during: "$test.translations.si.during",
            after: "$test.translations.si.after",
            checklist: "$test.translations.si.checklist",
            mediaUrl: "$test.translations.si.mediaUrl",
          }
        }
      },

      // Overlay localized fields when lang=si, else use base
      {
        $project: {
          test_id: "$test._id",
          test_code: "$test.testId",
          category: "$test.category",

          name: { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.name", null ] }, "$_base.name" ] },
          what: { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.what", null ] }, "$_base.what" ] },
          why:  { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.why",  null ] }, "$_base.why"  ] },
          preparation: { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.preparation", null ] }, "$_base.preparation" ] },
          during:      { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.during",      null ] }, "$_base.during"      ] },
          after:       { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.after",       null ] }, "$_base.after"       ] },
          checklist:   { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.checklist",   null ] }, "$_base.checklist"   ] },
          mediaUrl:    { $ifNull: [ { $cond: [ { $eq: [lang, "si"] }, "$_si.mediaUrl",    null ] }, "$_base.mediaUrl"    ] },

          // Per-center fields
          price: "$price_override",
          capacity: 1,
          is_available: 1,
          daily_count: 1
        }
      },

      { $sort: { name: 1 } }
    ]);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch center tests" });
  }
};

// Admin: POST /api/centers
exports.createCenter = async (req, res) => {
  try {
    const doc = await HealthCenter.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Admin: PUT /api/centers/:id
exports.updateCenter = async (req, res) => {
  try {
    const doc = await HealthCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Center not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ GET /api/centers/names
exports.getHealthCenterNames = async (req, res) => {
  try {
    const centers = await HealthCenter.find(
      { isActive: true },
      {
        _id: 1,
        name: 1,
        "address.city": 1,
        "address.district": 1,
        "address.province": 1,
      }
    ).sort({ name: 1 });

    // Optional: skip nulls, clean format
    const formatted = centers.map((c) => ({
      _id: c._id,
      name: c.name,
      city: c.address?.city || "",
      district: c.address?.district || "",
      province: c.address?.province || "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getHealthCenterNames error:", err);
    res.status(500).json({ message: "Failed to fetch health centers" });
  }
};
