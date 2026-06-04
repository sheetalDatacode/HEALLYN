const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getPatients,
  getPatientById,
  getPatientStatistics,
} = require('../../controllers/pharmacy-controllers/pharmacyPatientController');

router.get('/', protect('pharmacy'), getPatients);
router.get('/statistics', protect('pharmacy'), getPatientStatistics);
router.get('/:id', protect('pharmacy'), getPatientById);

module.exports = router;

