const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require('../../controllers/pharmacy-controllers/pharmacyOrderController');

router.get('/', protect('pharmacy'), getOrders);
router.get('/:id', protect('pharmacy'), getOrderById);
router.patch('/:id/status', protect('pharmacy'), updateOrderStatus);

module.exports = router;

