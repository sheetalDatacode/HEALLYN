const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getRequestOrders,
  getRequestOrderById,
  confirmRequestOrder,
  updateRequestOrderStatus,
} = require('../../controllers/pharmacy-controllers/pharmacyRequestOrderController');

router.get('/', protect('pharmacy'), getRequestOrders);
router.get('/:id', protect('pharmacy'), getRequestOrderById);
router.patch('/:id/confirm', protect('pharmacy'), confirmRequestOrder);
router.patch('/:id/status', protect('pharmacy'), updateRequestOrderStatus);

module.exports = router;

