const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getServices,
  addService,
  updateService,
  deleteService,
  toggleService,
} = require('../../controllers/pharmacy-controllers/pharmacyServiceController');

router.get('/', protect('pharmacy'), getServices);
router.post('/', protect('pharmacy'), addService);
router.patch('/:id', protect('pharmacy'), updateService);
router.delete('/:id', protect('pharmacy'), deleteService);
router.patch('/:id/toggle', protect('pharmacy'), toggleService);

module.exports = router;

