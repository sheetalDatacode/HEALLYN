const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../../controllers/pharmacy-controllers/pharmacyMedicineController');

router.get('/', protect('pharmacy'), getMedicines);
router.post('/', protect('pharmacy'), addMedicine);
router.patch('/:id', protect('pharmacy'), updateMedicine);
router.delete('/:id', protect('pharmacy'), deleteMedicine);

module.exports = router;

