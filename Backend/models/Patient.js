const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nic: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
    age: { type: Number, min: 0, max: 120, required: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

PatientSchema.index({ nic: 1 }, { unique: true });
PatientSchema.index({ name: 'text', email: 'text', address: 'text' });

module.exports = mongoose.model('Patient', PatientSchema);
