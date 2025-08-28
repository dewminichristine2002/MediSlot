const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventRegistrationController');
const { protect, requireRole } = require('../middleware/auth');

// Create
router.post('/events/:eventId/register', protect, ctrl.createForSelf);
router.post('/events/:eventId/register/:patientId', protect, requireRole('admin'), ctrl.createForPatient);

// Reads
router.get('/:id', protect, ctrl.getById);
router.get('/', protect, ctrl.list);

// Update status
router.patch('/:id/status', protect, requireRole('admin'), ctrl.updateStatus);

// Cancel (owner or admin? if only admin, keep requireRole)
router.patch('/:id/cancel', protect, requireRole('patient'), ctrl.cancelRegistration);

// Delete
router.delete('/:id', protect, requireRole('admin'), ctrl.deleteRegistration);

// Self: my events
router.get('/events-by-user/me', protect, ctrl.listMyEvents);

// Admin: events for a specific user
router.get('/events-by-user/:userId', protect, requireRole('admin'), ctrl.listEventsByUserId);



module.exports = router;
