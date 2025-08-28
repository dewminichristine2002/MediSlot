// routes/eventPatientRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventPatientController');

// CRUD
router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/by-nic/:nic', ctrl.getByNIC);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Optional bulk
router.post('/bulk', ctrl.bulkCreate);

module.exports = router;
