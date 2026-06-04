const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getPatients,
  getPatientById,
  getPatientOrders,
  getPatientStatistics,
} = require('../../controllers/laboratory-controllers/laboratoryPatientController');

router.get('/', protect('laboratory'), getPatients);
router.get('/statistics', protect('laboratory'), getPatientStatistics);
router.get('/:id', protect('laboratory'), getPatientById);
router.get('/:id/orders', protect('laboratory'), getPatientOrders);

module.exports = router;

