const CenterService = require("../models/CenterService");
const HealthCenter = require("../models/HealthCenter");
const DiagnosticTest = require("../models/DiagnosticTest");

// GET /api/center-services/by-test?name=
exports.centersByTestName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: "name is required" });

    const pipeline = [
      { $lookup: { from: "diagnostictests", localField: "test_id", foreignField: "_id", as: "test" } },
      { $unwind: "$test" },
      { $match: { "test.name": { $regex: name, $options: "i" }, isActive: true, "test.is_available": true } },
      { $lookup: { from: "healthcenters", localField: "health_center_id", foreignField: "_id", as: "center" } },
      { $unwind: "$center" },
      { $match: { "center.isActive": true } },
      {
        $project: {
          _id: 0,
          center: { _id: "$center._id", name: "$center.name", district: "$center.address.district", province: "$center.address.province", location: "$center.location" },
          test: { _id: "$test._id", name: "$test.name", category: "$test.category" },
          price: { $ifNull: ["$price_override", "$test.price"] }
        }
      }
    ];

    const rows = await CenterService.aggregate(pipeline).limit(200);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch centers by test" });
  }
};

// POST /api/center-services  (admin attach a test to a center)
exports.attachTestToCenter = async (req, res) => {
  try {
    const doc = await CenterService.create(req.body); // needs health_center_id, test_id, optional price_override, capacity
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// PUT /api/center-services/:id  (admin update mapping)
exports.updateCenterService = async (req, res) => {
  try {
    const doc = await CenterService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "Mapping not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
