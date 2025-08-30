// HealthAwareness.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const HealthAwarenessSchema = new Schema({
  title: String,                       // Title of alert/article
  summary: String,                     // Short description
  type: { type: String, enum: ["article", "video"] },
  mediaUrl: String,                    // Link/file for video or article
  category: String,                    // e.g. "Dengue", "Flu"
  region: String,                      // e.g. "Islandwide", "Gampaha"
  severity: { type: String, enum: ["high","medium","info"] },
  activeFrom: Date,
  activeTo: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin" }
}, { timestamps: true });

export default model("HealthAwareness", HealthAwarenessSchema);
