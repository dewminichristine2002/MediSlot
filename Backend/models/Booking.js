// Backend/models/Booking.js
const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

/** Counter per (healthCenter, scheduledDate) → sequential appointment_no */
const counterSchema = new Schema(
  { key: { type: String, unique: true }, seq: { type: Number, default: 0 } },
  { collection: "counters" }
);
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

const bookingSchema = new Schema(
  {
    // == Foreign keys ==
    user: { type: Types.ObjectId, ref: "User", required: true }, // User_id
    healthCenter: { type: Types.ObjectId, ref: "HealthCenter", required: true }, // health_center_id
    centerTest: { type: Types.ObjectId, ref: "DiagnosticTest", required: true }, // Center_test_id (rename ref if teammate used a different model name)

    // == Patient details ==
    patientName: { type: String, required: true }, // Patient_name
    contactNumber: { type: String, required: true }, // Contact_number

    // == Slot ==
    scheduledDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    }, // YYYY-MM-DD
    scheduledTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    }, // HH:mm
    appointment_no: { type: Number, index: true }, // generated per center/day

    // == Payment ==
    payment: {
      method: {
        type: String,
        enum: ["pay_at_center", "online"],
        default: "pay_at_center",
      },
      status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
      amount: { type: Number, required: true, min: 0 }, // LKR used for this booking
    },

    // == Price snapshot ==
    price: { type: Number, required: true, min: 0 }, // list price at booking time
  },
  { timestamps: true } // createdAt, updatedAt
);

/** Prevent double-booking the same test slot at this center/date/time */
bookingSchema.index(
  { healthCenter: 1, centerTest: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true, name: "uniq_slot_per_test" }
);

/** appointment_no must be unique per center/day */
bookingSchema.index(
  { healthCenter: 1, scheduledDate: 1, appointment_no: 1 },
  { unique: true, sparse: true, name: "uniq_appt_no_per_center_day" }
);

/** Virtual: expose Booking_id-like alias */
bookingSchema.virtual("bookingId").get(function () {
  return this._id.toString();
});

/** Auto-assign appointment_no (1,2,3,…) per (center, day) */
bookingSchema.pre("validate", async function assignAppt(next) {
  try {
    if (this.isNew && this.appointment_no == null) {
      const key = `${this.healthCenter}:${this.scheduledDate}`;
      const c = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.appointment_no = c.seq;
    }
    next();
  } catch (e) {
    next(e);
  }
});

module.exports =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
