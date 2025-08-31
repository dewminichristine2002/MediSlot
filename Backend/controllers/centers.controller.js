const HealthCenter = require("../models/HealthCenter");
const CenterService = require("../models/CenterService");
const DiagnosticTest = require("../models/DiagnosticTest");

// GET /api/centers
// supports q (text), province, district, openNow
exports.listCenters = async (req, res) => {
  try {
    const { q, province, district, openNow } = req.query;

    const match = { isActive: true };
    if (province) match["address.province"] = province;
    if (district) match["address.district"] = district;

    let pipeline = [{ $match: match }];

    if (q) {
      pipeline.unshift({ $match: { $text: { $search: q } } });
    }

    // compute open/closed now from opening_time/closing_time (simple daily window)
    pipeline.push({
      $addFields: {
        isOpenNow: {
          $let: {
            vars: { now: { $dateToString: { format: "%H:%M", date: "$$NOW", timezone: "Asia/Colombo" } } },
            in: {
              $and: [
                { $lte: ["$opening_time", "$$now"] },
                { $lt: ["$$now", "$closing_time"] }
              ]
            }
          }
        }
      }
    });

    if (openNow === "true") pipeline.push({ $match: { isOpenNow: true } });

    const centers = await HealthCenter.aggregate(pipeline).limit(100);
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
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ["$distanceMeters", 1000] }, 2] }
        }
      }
    ]).limit(50);

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

// GET /api/centers/:id/tests  (tests available at a center)
exports.getCenterTests = async (req, res) => {
  try {
    const centerId = req.params.id;
    const services = await CenterService.aggregate([
      { $match: { health_center_id: HealthCenter.castObjectId ? HealthCenter.castObjectId(centerId) : require("mongoose").Types.ObjectId(centerId), isActive: true } },
      { $lookup: { from: "diagnostictests", localField: "test_id", foreignField: "_id", as: "test" } },
      { $unwind: "$test" },
      {
        $project: {
          _id: 0,
          test_id: "$test._id",
          name: "$test.name",
          category: "$test.category",
          price: { $ifNull: ["$price_override", "$test.price"] },
          is_available: "$test.is_available"
        }
      }
    ]);
    res.json(services);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch center tests" });
  }
};

// POST /api/centers  (admin create)
exports.createCenter = async (req, res) => {
  try {
    const doc = await HealthCenter.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// PUT /api/centers/:id  (admin update)
exports.updateCenter = async (req, res) => {
  try {
    const doc = await HealthCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Center not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
