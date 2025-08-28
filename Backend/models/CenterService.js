const { Schema, model, Types } = require("mongoose");

const centerServiceSchema = new Schema({
  service_id: { type: String, unique: true, sparse: true }, // your custom id
  health_center_id: { type: Types.ObjectId, ref: "HealthCenter", required: true, index: true },
  test_id: { type: Types.ObjectId, ref: "DiagnosticTest", required: true, index: true },
  price_override: Number,
  capacity: Number,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

centerServiceSchema.index({ health_center_id: 1, test_id: 1 }, { unique: true });

module.exports = model("CenterService", centerServiceSchema); // centerservices
