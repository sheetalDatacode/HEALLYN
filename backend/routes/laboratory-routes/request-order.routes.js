const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getRequestOrders,
  getRequestOrderById,
  confirmRequestOrder,
  generateBill,
  updateRequestOrderStatus,
} = require('../../controllers/laboratory-controllers/laboratoryRequestOrderController');

router.get('/', protect('laboratory'), getRequestOrders);
router.get('/:id', protect('laboratory'), getRequestOrderById);
router.patch('/:id/confirm', protect('laboratory'), confirmRequestOrder);
router.post('/:id/bill', protect('laboratory'), generateBill);
router.patch('/:id/status', protect('laboratory'), updateRequestOrderStatus);

module.exports = router;

