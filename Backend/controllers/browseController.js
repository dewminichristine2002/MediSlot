const { Types, isValidObjectId } = require('mongoose');
const HealthCenter   = require('../models/HealthCenter');
const DiagnosticTest = require('../models/DiagnosticTest');
const CenterService  = require('../models/CenterService');
const Booking        = require('../models/Booking');

const ymd = d => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

exports.listCenters = async (_req, res) => {
  const centers = await HealthCenter.find({ isActive: true })
    .select('_id name address.city address.district')
    .sort({ 'address.district': 1, name: 1 })
    .lean();
  res.json(centers);
};

exports.listTestsForCenter = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid center id' });

  const tests = await DiagnosticTest.find({ health_center_id: id, is_available: { $ne: false } })
    .select('_id name price category')
    .lean();

  // apply CenterService price overrides if present
  const svc = await CenterService.find({
    health_center_id: id, test_id: { $in: tests.map(t => t._id) }, isActive: true
  }).select('test_id price_override').lean();

  const override = Object.fromEntries(svc.map(s => [String(s.test_id), s.price_override]));
  res.json(tests.map(t => ({ ...t, price: Number(override[String(t._id)] ?? t.price ?? 0) })));
};

exports.listSlotsForTest = async (req, res) => {
  const { id } = req.params;   // test id
  const { center, date } = req.query;
  if (!isValidObjectId(id) || !isValidObjectId(center)) return res.status(400).json({ error: 'Invalid id' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date format' });

  const test = await DiagnosticTest.findById(id).lean();
  if (!test) return res.status(404).json({ error: 'Test not found' });
  if (String(test.health_center_id) !== String(center)) return res.status(404).json({ error: 'Test not in this center' });

  const slot = (test.availableSlots || []).find(s => ymd(s.date) === date);
  const times = (slot?.times || []).map(t => t.start);

  const list = [];
  for (const time of times) {
    const cap = (slot?.times.find(x => x.start === time)?.capacity) ?? (test.daily_count ?? 10);
    const agg = await Booking.aggregate([
      { $match: { healthCenter: new Types.ObjectId(center), scheduledDate: date, scheduledTime: time } },
      { $unwind: '$items' },
      { $match: { 'items.centerTest': new Types.ObjectId(id) } },
      { $count: 'used' }
    ]);
    const used = agg[0]?.used || 0;
    list.push({ time, remaining: Math.max(0, cap - used) });
  }
  res.json(list);
};
