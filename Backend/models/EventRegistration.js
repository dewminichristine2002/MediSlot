const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['confirmed', 'waitlist', 'cancelled', 'attended'],
      default: 'confirmed',
      index: true,
    },
    qr_code: { type: String, default: '' }, // can store string or file path/URL
  },
  { timestamps: { createdAt: 'registered_at', updatedAt: 'updated_at' } }
);

// one patient should not have duplicate active registrations for same event
RegistrationSchema.index({ event_id: 1, patient_id: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
