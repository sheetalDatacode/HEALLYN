const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getOrders,
  getOrderById,
  updateOrder,
} = require('../../controllers/admin-controllers/adminOrderController');

router.get('/', protect('admin'), authorize('admin'), getOrders);
router.get('/:id', protect('admin'), authorize('admin'), getOrderById);
router.patch('/:id', protect('admin'), authorize('admin'), updateOrder);

module.exports = router;

