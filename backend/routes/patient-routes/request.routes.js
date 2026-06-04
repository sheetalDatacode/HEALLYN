const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createRequest,
  getRequests,
  getRequestById,
  createRequestPaymentOrder,
  confirmPayment,
  cancelRequest,
} = require('../../controllers/patient-controllers/patientRequestController');

router.post('/', protect('patient'), createRequest);
router.get('/', protect('patient'), getRequests);
router.get('/:id', protect('patient'), getRequestById);
router.post('/:id/payment/order', protect('patient'), createRequestPaymentOrder);
router.post('/:id/payment', protect('patient'), confirmPayment);
router.delete('/:id', protect('patient'), cancelRequest);

module.exports = router;

