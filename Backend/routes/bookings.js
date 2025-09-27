// Backend/routes/bookings.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/bookingsController'); // <-- your file name

router.get('/availability', protect, ctrl.getAvailability);
router.post('/', protect, ctrl.createBooking);
router.get('/my', protect, ctrl.getMyBookings);

module.exports = router;
