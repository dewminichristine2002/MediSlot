// routes/labTestResultRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/labTestResultController');

// Create / Bulk
router.post('/', ctrl.create);
router.post('/bulk', ctrl.bulkCreate);

// Read (list + by user + by id)
router.get('/', ctrl.list);
router.get('/user/:userId', ctrl.listByUser);
router.get('/:id', ctrl.getById);

// Update
router.patch('/:id', ctrl.update);

// Delete
router.delete('/:id', ctrl.remove);

module.exports = router;
