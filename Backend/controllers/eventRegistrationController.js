// controllers/eventRegistrationController.js
const mongoose = require('mongoose');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');

const isValidId = (id) => mongoose.isValidObjectId(id);

// ---------- helpers ----------
async function adjustEventSlots(eventId, fromStatus, toStatus, session) {
  const occupies = (s) => s === 'confirmed';
  if (occupies(fromStatus) === occupies(toStatus)) return;

  const inc = occupies(toStatus) ? 1 : -1;

  const updated = await Event.findByIdAndUpdate(
    eventId,
    { $inc: { slots_filled: inc } },
    { new: true, session }
  );

  if (!updated) {
    const e = new Error('Event not found when adjusting slots');
    e.http = 404;
    throw e;
  }

  if (updated.slots_filled < 0 || updated.slots_filled > updated.slots_total) {
    // revert to keep data consistent
    await Event.findByIdAndUpdate(eventId, { $inc: { slots_filled: -inc } }, { session });
    const e = new Error('Invalid slots state detected');
    e.http = 409;
    throw e;
  }
}

/**
 * Promote the oldest waitlisted registration to confirmed if capacity exists.
 * Returns the promoted registration document or null if none.
 */
async function promoteFromWaitlist(eventId, session) {
  // Check remaining capacity
  const event = await Event.findById(eventId).session(session);
  if (!event) return null;

  const remaining = Math.max(0, (event.slots_total || 0) - (event.slots_filled || 0));
  if (remaining <= 0) return null;

  // Pick the oldest waitlisted registration (FIFO by registered_at)
  const waitlisted = await EventRegistration.findOneAndUpdate(
    { event_id: eventId, status: 'waitlist' },
    { $set: { status: 'confirmed' } },
    {
      new: true,
      session,
      sort: { registered_at: 1 }, // oldest first
    }
  );

  if (!waitlisted) return null;

  // Consume a slot for the promoted person
  await adjustEventSlots(eventId, null, 'confirmed', session);

  return waitlisted;
}

/**
 * Compute waitlist position (1-based) for a waitlisted registration.
 * FIFO by registered_at, tie-broken by _id.
 */
async function computeWaitlistPosition(eventId, registeredAt, regId) {
  const ahead = await EventRegistration.countDocuments({
    event_id: eventId,
    status: 'waitlist',
    $or: [
      { registered_at: { $lt: registeredAt } },
      { registered_at: registeredAt, _id: { $lt: regId } }, // tie-breaker
    ],
  });
  return ahead + 1;
}

// ---------- create: self ----------
// POST /api/event-registrations/events/:eventId/register
exports.createForSelf = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const event_id = req.params.eventId;
    const patient_id = req.user?._id;

    if (!isValidId(event_id)) return res.status(400).json({ message: 'Invalid event_id' });
    if (!isValidId(patient_id)) return res.status(400).json({ message: 'Invalid patient_id' });

    const { name, nic, gender, age, contact, email, address, qr_code } = req.body;
    if (!name || !nic || age == null || !contact) {
      return res.status(400).json({ message: 'name, nic, age, contact are required' });
    }

    session.startTransaction();

    const event = await Event.findById(event_id).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Event not found' });
    }

    const finalStatus = event.slots_filled < event.slots_total ? 'confirmed' : 'waitlist';

    const [reg] = await EventRegistration.create([{
      event_id,
      patient_id,
      name, nic, gender, age, contact, email, address,
      qr_code: qr_code || '',
      status: finalStatus,
    }], { session });

    if (finalStatus === 'confirmed') {
      await adjustEventSlots(event_id, null, 'confirmed', session);
    }

    await session.commitTransaction();

    const saved = await EventRegistration.findById(reg._id);
    let payload = saved.toObject();
    if (saved.status === 'waitlist') {
      payload.waitlist_position = await computeWaitlistPosition(saved.event_id, saved.registered_at, saved._id);
    }
    return res.status(201).json(payload);
  } catch (err) {
    await session.abortTransaction();
    if (err?.code === 11000) return res.status(409).json({ message: 'Already registered for this event.' });
    const http = err.http || 500;
    return res.status(http).json({ message: err.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// ---------- create: admin ----------
// POST /api/event-registrations/events/:eventId/register/:patientId
exports.createForPatient = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const event_id = req.params.eventId;
    const patient_id = req.params.patientId;

    if (!isValidId(event_id)) return res.status(400).json({ message: 'Invalid event_id' });
    if (!isValidId(patient_id)) return res.status(400).json({ message: 'Invalid patient_id' });

    const { name, nic, gender, age, contact, email, address, qr_code, status } = req.body;
    if (!name || !nic || age == null || !contact) {
      return res.status(400).json({ message: 'name, nic, age, contact are required' });
    }

    session.startTransaction();

    const event = await Event.findById(event_id).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Event not found' });
    }

    let finalStatus = status;
    if (!finalStatus) {
      finalStatus = event.slots_filled < event.slots_total ? 'confirmed' : 'waitlist';
    }

    const [reg] = await EventRegistration.create([{
      event_id,
      patient_id,
      name, nic, gender, age, contact, email, address,
      qr_code: qr_code || '',
      status: finalStatus,
    }], { session });

    if (finalStatus === 'confirmed') {
      await adjustEventSlots(event_id, null, 'confirmed', session);
    }

    await session.commitTransaction();

    const saved = await EventRegistration.findById(reg._id);
    let payload = saved.toObject();
    if (saved.status === 'waitlist') {
      payload.waitlist_position = await computeWaitlistPosition(saved.event_id, saved.registered_at, saved._id);
    }
    return res.status(201).json(payload);
  } catch (err) {
    await session.abortTransaction();
    if (err?.code === 11000) return res.status(409).json({ message: 'Already registered for this event.' });
    const http = err.http || 500;
    return res.status(http).json({ message: err.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// ---------- CANCEL (auto-promote waitlist) ----------
// PATCH /api/event-registrations/:id/cancel
exports.cancelRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const reg = await EventRegistration.findById(req.params.id).session(session);
    if (!reg) { await session.abortTransaction(); return res.status(404).json({ message: 'Registration not found' }); }

    if (reg.status !== 'cancelled') {
      // Free slot if it was confirmed
      await adjustEventSlots(reg.event_id, reg.status, 'cancelled', session);

      reg.status = 'cancelled';
      await reg.save({ session });

      // Try to promote the oldest waitlisted
      await promoteFromWaitlist(reg.event_id, session);
    }

    await session.commitTransaction();
    return res.json(reg);
  } catch (err) {
    await session.abortTransaction();
    const http = err.http || 500;
    return res.status(http).json({ message: err.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// ---------- update status (auto-promote if freeing a slot) ----------
// PATCH /api/event-registrations/:id/status
// Body: { status: 'confirmed'|'waitlist'|'cancelled'|'attended' }
exports.updateStatus = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    if (!['confirmed', 'waitlist', 'cancelled', 'attended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    session.startTransaction();

    const reg = await EventRegistration.findById(req.params.id).session(session);
    if (!reg) { await session.abortTransaction(); return res.status(404).json({ message: 'Registration not found' }); }

    const prev = reg.status;
    reg.status = status;
    await reg.save({ session });

    // Adjust slots for this change
    await adjustEventSlots(reg.event_id, prev, status, session);

    // If we just freed a slot (prev was confirmed and new isn't), promote
    const prevOccupied = prev === 'confirmed';
    const nowOccupied = status === 'confirmed';
    if (prevOccupied && !nowOccupied) {
      await promoteFromWaitlist(reg.event_id, session);
    }

    await session.commitTransaction();
    res.json(reg);
  } catch (err) {
    await session.abortTransaction();
    const http = err.http || 500;
    res.status(http).json({ message: err.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// ---------- delete (free slot if confirmed, then promote) ----------
// DELETE /api/event-registrations/:id
exports.deleteRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const reg = await EventRegistration.findById(req.params.id).session(session);
    if (!reg) { await session.abortTransaction(); return res.status(404).json({ message: 'Registration not found' }); }

    const wasConfirmed = reg.status === 'confirmed';

    await EventRegistration.deleteOne({ _id: reg._id }).session(session);

    if (wasConfirmed) {
      // Free one slot and then promote if possible
      await adjustEventSlots(reg.event_id, 'confirmed', null, session);
      await promoteFromWaitlist(reg.event_id, session);
    }

    await session.commitTransaction();
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    await session.abortTransaction();
    const http = err.http || 500;
    res.status(http).json({ message: err.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// ---------- reads ----------
exports.getById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const reg = await EventRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Not found' });

    let payload = reg.toObject();
    if (reg.status === 'waitlist') {
      payload.waitlist_position = await computeWaitlistPosition(reg.event_id, reg.registered_at, reg._id);
    }
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/event-registrations?event_id=...&patient_id=...
exports.list = async (req, res) => {
  try {
    const f = {};
    if (req.query.event_id && isValidId(req.query.event_id)) f.event_id = req.query.event_id;
    if (req.query.patient_id && isValidId(req.query.patient_id)) f.patient_id = req.query.patient_id;

    const items = await EventRegistration.find(f).sort({ registered_at: 1 }); // ascending helps see queue

    const withPos = await Promise.all(items.map(async (doc) => {
      const o = doc.toObject();
      if (o.status === 'waitlist') {
        o.waitlist_position = await computeWaitlistPosition(o.event_id, o.registered_at, o._id);
      }
      return o;
    }));

    res.json(withPos);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---------- events by user (ADMIN + SELF) ----------
// GET /api/event-registrations/events-by-user/:userId
exports.listEventsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return res.status(400).json({ message: 'Invalid userId' });

    // Optional query params
    const page  = Math.max(parseInt(req.query.page  || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const statusFilter = (req.query.status || '').trim(); // confirmed | waitlist | cancelled | attended
    const when = (req.query.when || 'all').toLowerCase(); // upcoming | past | all
    const sortField = (req.query.sort || 'event.date');   // 'event.date' | 'registered_at'
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const regMatch = { patient_id: new mongoose.Types.ObjectId(userId) };
    if (['confirmed','waitlist','cancelled','attended'].includes(statusFilter)) {
      regMatch.status = statusFilter;
    }

    const now = new Date();
    const eventWhenMatch =
      when === 'upcoming' ? { 'event.date': { $gte: now } } :
      when === 'past'     ? { 'event.date': { $lt: now } } : {};

    const pipeline = [
      { $match: regMatch },
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      ...(Object.keys(eventWhenMatch).length ? [{ $match: eventWhenMatch }] : []),
      { $sort: { [sortField]: sortOrder } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                registration_id: '$_id',
                registration_status: '$status',
                registered_at: '$registered_at',
                qr_code: '$qr_code',
                event_id: '$event._id',
                event_name: '$event.name',
                event_date: '$event.date',
                event_time: '$event.time',
                event_location: '$event.location',
                slots_total: '$event.slots_total',
                slots_filled: '$event.slots_filled',
                slots_remaining: {
                  $max: [
                    { $subtract: ['$event.slots_total', '$event.slots_filled'] },
                    0
                  ]
                }
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ];

    const agg = await EventRegistration.aggregate(pipeline);
    const items = agg[0]?.items || [];
    const total = agg[0]?.total?.[0]?.count || 0;

    // Add waitlist_position for waitlisted registrations
    const itemsWithPos = await Promise.all(items.map(async (it) => {
      if (it.registration_status === 'waitlist') {
        const pos = await computeWaitlistPosition(
          it.event_id,
          new Date(it.registered_at),
          new mongoose.Types.ObjectId(it.registration_id)
        );
        return { ...it, waitlist_position: pos };
      }
      return it;
    }));

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items: itemsWithPos
    });
  } catch (err) {
    console.error('listEventsByUserId error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/event-registrations/events-by-user/me
exports.listMyEvents = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Reuse the admin handler with current user id
    req.params.userId = userId.toString();
    return exports.listEventsByUserId(req, res);
  } catch (err) {
    console.error('listMyEvents error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
