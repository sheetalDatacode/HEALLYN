const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getLeads,
  getLeadById,
  updateLeadStatus,
} = require('../../controllers/laboratory-controllers/laboratoryOrderController');

router.get('/', protect('laboratory'), getLeads);
router.get('/:id', protect('laboratory'), getLeadById);
router.patch('/:id/status', protect('laboratory'), updateLeadStatus);

module.exports = router;

