const { Schema, model, Types } = require("mongoose");

const diagnosticTestSchema = new Schema({
  center_test_id: { type: String, unique: true, sparse: true }, // your custom id
  name: { type: String, required: true, trim: true },
  category: { type: String, index: true },      // "Blood", "Dental", etc.
  price: Number,
  is_available: { type: Boolean, default: true },
  daily_count: Number,                           // approximate daily capacity (not slots)
  health_center_id: { type: Types.ObjectId, ref: "HealthCenter" }, // as per your spec
}, { timestamps: true });

diagnosticTestSchema.index({ name: "text", category: "text" });

module.exports = model("DiagnosticTest", diagnosticTestSchema); // diagnostictests
