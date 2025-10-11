const mongoose = require("mongoose");
require("../models/Test");
const Booking = require("../models/Booking");
const CenterService = require("../models/CenterService");
const DiagnosticTest = require("../models/DiagnosticTest");
const { sendSMS, sendEmail } = require("../utils/notify");
const UserNotification = require("../models/UserNotification"); // ✅ new model import

/* ---------- utils ---------- */
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const isHHmm = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || "");

const bad = (res, msg, extra = {}) =>
  res.status(400).json({ error: msg, ...extra });

/** Collect test ids from any client shape */
function collectTestIds(body) {
  const set = new Set();
  if (Array.isArray(body.tests))
    body.tests.forEach((x) => x && set.add(String(x)));
  if (Array.isArray(body.items))
    body.items.forEach((it) => it?.centerTest && set.add(String(it.centerTest)));
  if (body.centerTest) set.add(String(body.centerTest));
  if (body.testId) set.add(String(body.testId));
  return [...set];
}

/* ---------- AVAILABILITY ---------- */
exports.getAvailability = async (_req, res) => {
  try {
    return res.json({ ok: true, times: [] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* ---------- CREATE BOOKING ---------- */
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return bad(res, "Unauthorized");

    const {
      healthCenter,
      scheduledDate,
      scheduledTime,
      patientName,
      contactNumber,
      payment,
      price,
    } = req.body;

    if (!mongoose.isValidObjectId(healthCenter))
      return bad(res, "healthCenter is required/invalid");
    if (!isISODate(scheduledDate))
      return bad(res, "scheduledDate must be YYYY-MM-DD");
    if (!isHHmm(scheduledTime)) return bad(res, "scheduledTime must be HH:mm");
    if (!patientName || !contactNumber)
      return bad(res, "patientName and contactNumber are required");

    // ---- collect IDs and validate against CenterService for THIS center
    const testIds = collectTestIds(req.body);
    if (!testIds.length) return bad(res, "No tests provided");

    // 1) assume ids are CenterService._id
    let centerRows = await CenterService.find({
      _id: { $in: testIds },
      health_center_id: healthCenter,
      isActive: true,
    })
      .populate("test_id", "name price")
      .lean();

    // 2) fallback to DiagnosticTest._id
    if (!centerRows.length) {
      centerRows = await CenterService.find({
        test_id: { $in: testIds },
        health_center_id: healthCenter,
        isActive: true,
      })
        .populate("test_id", "name price")
        .lean();
    }

    if (!centerRows.length)
      return bad(res, "Invalid test ids", { details: testIds });

    // Single-test flow → take the first
    const row = centerRows[0];

    const testDoc =
      row.test_id && typeof row.test_id === "object" ? row.test_id : null;
    const snapName = testDoc?.name || row.name || "Test";
    const snapPrice =
      typeof row.price_override === "number"
        ? row.price_override
        : typeof testDoc?.price === "number"
        ? testDoc.price
        : typeof price === "number"
        ? price
        : 0;

    const items = [{ centerTest: row._id, name: snapName, price: snapPrice }];
    const total = snapPrice;

    const pay = {
      method: payment?.method === "online" ? "online" : "pay_at_center",
      status: payment?.status === "paid" ? "paid" : "unpaid",
      amount: total,
      provider: payment?.provider,
      providerRef: payment?.providerRef,
    };

    const b = await Booking.create({
      user: userId,
      healthCenter,
      patientName,
      contactNumber,
      scheduledDate,
      scheduledTime,
      items,
      status: pay.status === "paid" ? "paid" : "confirmed",
      payment: pay,
      price: total,
    });

    /* ---------- ✅ Notification block ---------- */
    try {
      const smsMessage = `✅ Hi ${b.patientName}, your booking #${b.appointment_no} at ${b.healthCenter?.name || "your selected center"} on ${b.scheduledDate} at ${b.scheduledTime} is confirmed.`;

      if (b?.contactNumber) {
        await sendSMS(b.contactNumber, smsMessage);
      }

      // Store as in-app notification (safe)
      await UserNotification.create({
        user: b.user,
        contactNumber: b.contactNumber,
        title: "Booking Confirmed",
        message: smsMessage,
        type: "booking",
        booking: b._id,
        appointment_no: b.appointment_no,
      });

      // Optional email
      await sendEmail(
        null,
        "Booking confirmed",
        `Your booking ${b.appointment_no} is confirmed.`
      );
    } catch (notifyErr) {
      console.warn("Notification error:", notifyErr.message);
    }
    /* ---------- ✅ End notification block ---------- */

    return res.status(201).json(b);
  } catch (e) {
    console.error("createBooking", e);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ---------- MINE (frontend) ---------- */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const scope = req.query.scope || "upcoming";
    const today = new Date().toISOString().split("T")[0];

    const filter = { user: userId };
    if (scope === "upcoming") filter.scheduledDate = { $gte: today };
    else if (scope === "past") filter.scheduledDate = { $lt: today };

    const bookings = await Booking.find(filter)
      .populate("healthCenter", "name")
      .sort({ scheduledDate: -1 })
      .lean();

    res.json(bookings);
  } catch (err) {
    console.error("getMyBookings", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------- optional placeholders ---------- */
exports.cancelBooking = async (_req, res) =>
  res.status(405).json({ error: "Cancel not enabled" });
exports.rescheduleBooking = async (_req, res) =>
  res.status(405).json({ error: "Reschedule not enabled" });
