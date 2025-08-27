const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    position: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: 'joined_at', updatedAt: 'updated_at' } }
);

WaitlistSchema.index({ event_id: 1, position: 1 }, { unique: true });
WaitlistSchema.index({ event_id: 1, patient_id: 1 }, { unique: true });

module.exports = mongoose.model('Waitlist', WaitlistSchema);
