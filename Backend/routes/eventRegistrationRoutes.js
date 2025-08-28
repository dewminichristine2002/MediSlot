// routes/eventRegistrationRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventRegistrationController');

// Create / List
router.post('/', ctrl.register);
router.get('/', ctrl.list);

// Read
router.get('/:id', ctrl.getById);

// Status updates
router.patch('/:id/status', ctrl.updateStatus);
router.post('/:id/cancel', ctrl.cancel);
router.post('/:id/checkin', ctrl.checkin);

// Delete
router.delete('/:id', ctrl.remove);

module.exports = router;
