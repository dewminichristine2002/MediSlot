// routes/eventLabnotificationRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/freeeventsController/eventLabNotificationController');

// Generic notification
router.get('/', ctrl.list);

// Lab results
router.post('/lab-result-ready', ctrl.createLabResultReady);

// Events
router.post('/event/published', ctrl.createEventPublished);
router.post('/event/updated', ctrl.createEventUpdated);


module.exports = router;
