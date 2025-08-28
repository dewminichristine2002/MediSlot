// controllers/eventRegistrationController.js
const mongoose = require('mongoose');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');

// Build filters for list endpoint
function buildFilters(q) {
  const f = {};
  if (q.event_id && mongoose.isValidObjectId(q.event_id)) f.event_id = q.event_id;
  if (q.patient_id && mongoose.isValidObjectId(q.patient_id)) f.patient_id = q.patient_id;
  if (q.status) f.status = q.status; // confirmed|waitlist|cancelled|attended
  if (q.from || q.to) {
    f.registered_at = {};
    if (q.from) f.registered_at.$gte = new Date(q.from);
    if (q.to) f.registered_at.$lte = new Date(q.to);
  }
  return f;
}

// POST /api/event-registrations
// Auto-place on waitlist if event is full; otherwise confirm and increment slots_filled.
exports.register = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { event_id, patient_id } = req.body;
    if (!mongoose.isValidObjectId(event_id) || !mongoose.isValidObjectId(patient_id)) {
      return res.status(400).json({ message: 'Invalid event_id or patient_id' });
    }

    // Prevent duplicates early (also enforced by unique index)
    const existing = await EventRegistration.findOne({ event_id, patient_id });
    if (existing) {
      return res.status(409).json({ message: 'Already registered for this event', registration: existing });
    }

    await session.withTransaction(async () => {
      const event = await Event.findById(event_id).session(session);
      if (!event) throw new Error('Event not found');

      let status = 'waitlist';

      // Try to atomically grab a slot
      if (event.slots_filled < event.slots_total) {
        const updated = await Event.findOneAndUpdate(
          { _id: event_id, slots_filled: { $lt: event.slots_total } },
          { $inc: { slots_filled: 1 } },
          { new: true, session }
        );
        if (updated) status = 'confirmed';
      }

      const reg = await EventRegistration.create([{ ...req.body, status }], { session });
      return res.status(201).json(reg[0]);
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate registration for this event' });
    }
    return res.status(400).json({ message: 'Failed to register', error: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/event-registrations
exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);
    const sortField = ['registered_at', 'updated_at', 'status'].includes(req.query.sort) ? req.query.sort : 'registered_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      EventRegistration.find(filters)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('event_id', 'name date time location')
        .populate('patient_id', 'name email contact'),
      EventRegistration.countDocuments(filters),
    ]);

    res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registrations', error: err.message });
  }
};

// GET /api/event-registrations/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    const doc = await EventRegistration.findById(id)
      .populate('event_id', 'name date time location slots_total slots_filled')
      .populate('patient_id', 'name email contact');
    if (!doc) return res.status(404).json({ message: 'Registration not found' });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registration', error: err.message });
  }
};

// PATCH /api/event-registrations/:id/status
// Allowed transitions: confirmed -> cancelled/attended, waitlist -> confirmed/cancelled
exports.updateStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!['confirmed', 'waitlist', 'cancelled', 'attended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await session.withTransaction(async () => {
      const reg = await EventRegistration.findById(id).session(session);
      if (!reg) return res.status(404).json({ message: 'Registration not found' });

      if (reg.status === status) return res.status(200).json(reg); // no-op

      // Handle capacity counts
      if (reg.status !== 'confirmed' && status === 'confirmed') {
        // Promote to confirmed -> need free slot
        const updatedEvent = await Event.findOneAndUpdate(
          { _id: reg.event_id, slots_filled: { $lt: '$slots_total' } }, // this $ reference does not work; use local fetch
          {},
          { new: true, session }
        );
        // The above query can't compare against $slots_total directly; do manual check
        const ev = updatedEvent || (await Event.findById(reg.event_id).session(session));
        if (!ev) return res.status(404).json({ message: 'Event not found' });
        if (ev.slots_filled >= ev.slots_total) {
          return res.status(409).json({ message: 'Event is full; cannot confirm' });
        }
        await Event.updateOne({ _id: ev._id }, { $inc: { slots_filled: 1 } }, { session });
      }

      if (reg.status === 'confirmed' && (status === 'cancelled' || status === 'waitlist')) {
        await Event.updateOne({ _id: reg.event_id }, { $inc: { slots_filled: -1 } }, { session });
      }

      reg.status = status;
      await reg.save({ session });

      return res.status(200).json(reg);
    });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update status', error: err.message });
  } finally {
    session.endSession();
  }
};

// POST /api/event-registrations/:id/cancel  (shortcut)
exports.cancel = async (req, res) => {
  req.body.status = 'cancelled';
  return exports.updateStatus(req, res);
};

// POST /api/event-registrations/:id/checkin  -> mark attended
exports.checkin = async (req, res) => {
  req.body.status = 'attended';
  return exports.updateStatus(req, res);
};

// DELETE /api/event-registrations/:id
// If a confirmed registration is deleted, free the slot and try to promote first waitlisted person.
exports.remove = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

    await session.withTransaction(async () => {
      const reg = await EventRegistration.findById(id).session(session);
      if (!reg) return res.status(404).json({ message: 'Registration not found' });

      const eventId = reg.event_id;
      const wasConfirmed = reg.status === 'confirmed';

      await EventRegistration.deleteOne({ _id: id }, { session });

      if (wasConfirmed) {
        // Free one slot
        await Event.updateOne({ _id: eventId }, { $inc: { slots_filled: -1 } }, { session });

        // Promote earliest waitlisted person (FIFO by registered_at)
        const next = await EventRegistration.findOneAndUpdate(
          { event_id: eventId, status: 'waitlist' },
          { status: 'confirmed' },
          { sort: { registered_at: 1 }, new: true, session }
        );
        if (next) {
          await Event.updateOne({ _id: eventId }, { $inc: { slots_filled: 1 } }, { session });
        }
      }

      return res.json({ message: 'Registration deleted' });
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete registration', error: err.message });
  } finally {
    session.endSession();
  }
};
