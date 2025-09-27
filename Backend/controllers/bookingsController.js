// Backend/controllers/bookingsController.js
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const CenterService = require('../models/CenterService');     // center-test rows
const DiagnosticTest = require('../models/DiagnosticTest');   // for fallback name/price
const { sendSMS, sendEmail } = require('../utils/notify');

/* ---------- utils ---------- */
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const isHHmm   = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');

const bad = (res, msg, extra = {}) => res.status(400).json({ error: msg, ...extra });

/** Collect test ids from any client shape */
function collectTestIds(body) {
  const set = new Set();
  if (Array.isArray(body.tests)) body.tests.forEach((x) => x && set.add(String(x)));
  if (Array.isArray(body.items)) body.items.forEach((it) => it?.centerTest && set.add(String(it.centerTest)));
  if (body.centerTest) set.add(String(body.centerTest));
  if (body.testId) set.add(String(body.testId));
  return [...set];
}

/* ---------- AVAILABILITY (top-level export, not inside another fn) ---------- */
exports.getAvailability = async (_req, res) => {
  try {
    // Return whatever your app expects; harmless default for now.
    return res.json({ ok: true, times: [] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

/* ---------- CREATE (single-test flow) ---------- */
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return bad(res, 'Unauthorized');

    const {
      healthCenter,
      scheduledDate,
      scheduledTime,
      patientName,
      contactNumber,
      payment,
      price,
    } = req.body;

    if (!mongoose.isValidObjectId(healthCenter)) return bad(res, 'healthCenter is required/invalid');
    if (!isISODate(scheduledDate))               return bad(res, 'scheduledDate must be YYYY-MM-DD');
    if (!isHHmm(scheduledTime))                  return bad(res, 'scheduledTime must be HH:mm');
    if (!patientName || !contactNumber)          return bad(res, 'patientName and contactNumber are required');

    // ---- collect IDs and validate against CenterService for THIS center
    const testIds = collectTestIds(req.body);
    if (!testIds.length) return bad(res, 'No tests provided');

    // 1) assume ids are CenterService._id (center-test ids)
    let centerRows = await CenterService.find({
      _id: { $in: testIds },
      health_center_id: healthCenter,
      isActive: true,
    })
      .populate('test_id', 'name price')
      .lean();

    // 2) if none matched, assume ids are DiagnosticTest._id
    if (!centerRows.length) {
      centerRows = await CenterService.find({
        test_id: { $in: testIds },
        health_center_id: healthCenter,
        isActive: true,
      })
        .populate('test_id', 'name price')
        .lean();
    }

    if (!centerRows.length) return bad(res, 'Invalid test ids', { details: testIds });

    // Single-test flow → take the first
    const row = centerRows[0];

    // Snapshot name/price
    const testDoc  = row.test_id && typeof row.test_id === 'object' ? row.test_id : null;
    const snapName = testDoc?.name || row.name || 'Test';
    const snapPrice =
      typeof row.price_override === 'number' ? row.price_override :
      typeof testDoc?.price     === 'number' ? testDoc.price :
      typeof price              === 'number' ? price : 0;

    const items = [{ centerTest: row._id, name: snapName, price: snapPrice }];
    const total = snapPrice;

    const pay = {
      method:  payment?.method === 'online' ? 'online' : 'pay_at_center',
      status:  payment?.status === 'paid'   ? 'paid'   : 'unpaid',
      amount:  total,
      provider:    payment?.provider,
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
      status: pay.status === 'paid' ? 'paid' : 'confirmed',
      payment: pay,
      price: total,
    });

    try {
      if (b?.contactNumber) {
        await sendSMS(b.contactNumber, `Booking confirmed #${b.appointment_no} on ${b.scheduledDate}.`);
      }
      await sendEmail(null, 'Booking confirmed', `Your booking ${b._id} is confirmed.`);
    } catch {}

    return res.status(201).json(b);
  } catch (e) {
    console.error('createBooking', e);
    return res.status(500).json({ error: 'Server error' });
  }
};

/* ---------- MINE ---------- */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return bad(res, 'Unauthorized');

    const items = await Booking.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.json({ items });
  } catch (e) {
    console.error('getMyBookings', e);
    return res.status(500).json({ error: 'Server error' });
  }
};

/* ---------- optional placeholders ---------- */
exports.cancelBooking = async (_req, res) => res.status(405).json({ error: 'Cancel not enabled' });
exports.rescheduleBooking = async (_req, res) => res.status(405).json({ error: 'Reschedule not enabled' });
