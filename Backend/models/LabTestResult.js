const mongoose = require('mongoose');

const LabTestResultSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    testOrEvent_name: { type: String, required: true, trim: true },
    file_path: { type: String, required: true }, // path or URL to uploaded report
    uploaded_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

LabTestResultSchema.index({ user_id: 1, uploaded_at: -1 });

module.exports = mongoose.model('LabTestResult', LabTestResultSchema);
