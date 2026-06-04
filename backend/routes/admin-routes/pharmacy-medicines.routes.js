const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getPharmacyMedicines,
  getPharmacyMedicineById,
  updatePharmacyMedicine,
} = require('../../controllers/admin-controllers/adminPharmacyMedicineController');

router.get('/', protect('admin'), authorize('admin'), getPharmacyMedicines);
router.get('/:id', protect('admin'), authorize('admin'), getPharmacyMedicineById);
router.patch('/:id', protect('admin'), authorize('admin'), updatePharmacyMedicine);

module.exports = router;

