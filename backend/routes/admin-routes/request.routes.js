const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getRequests,
  getRequestById,
  acceptRequest,
  respondToRequest,
  cancelRequest,
  updateRequestStatus,
} = require('../../controllers/admin-controllers/adminRequestController');

router.get('/', protect('admin'), authorize('admin'), getRequests);
router.get('/:id', protect('admin'), authorize('admin'), getRequestById);
router.post('/:id/accept', protect('admin'), authorize('admin'), acceptRequest);
router.post('/:id/respond', protect('admin'), authorize('admin'), respondToRequest);
router.post('/:id/cancel', protect('admin'), authorize('admin'), cancelRequest);
router.patch('/:id/status', protect('admin'), authorize('admin'), updateRequestStatus);

module.exports = router;

