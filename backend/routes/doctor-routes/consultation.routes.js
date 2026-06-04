const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getConsultations,
  createConsultation,
  updateConsultation,
  getConsultationById,
  getAllConsultations,
  getAllMedicines,
  getAllTests,
} = require('../../controllers/doctor-controllers/doctorConsultationController');

router.get('/', protect('doctor'), getConsultations);
router.get('/all', protect('doctor'), getAllConsultations);
router.get('/medicines/all', protect('doctor'), getAllMedicines);
router.get('/tests/all', protect('doctor'), getAllTests);
router.post('/', protect('doctor'), createConsultation);
router.patch('/:id', protect('doctor'), updateConsultation);
router.get('/:id', protect('doctor'), getConsultationById);

module.exports = router;

