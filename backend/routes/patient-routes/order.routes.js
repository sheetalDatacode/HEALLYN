const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getOrders,
  getOrderById,
  createOrder,
} = require('../../controllers/patient-controllers/patientOrderController');

router.get('/', protect('patient'), getOrders);
router.get('/:id', protect('patient'), getOrderById);
router.post('/', protect('patient'), createOrder);

module.exports = router;

