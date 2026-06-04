const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const {
  createSupportTicket,
  getSupportTickets,
  getSupportHistory,
} = require('../../controllers/nurse-controllers/nurseSupportController');

router.post('/', protect(ROLES.NURSE), createSupportTicket);
router.get('/', protect(ROLES.NURSE), getSupportTickets);
router.get('/history', protect(ROLES.NURSE), getSupportHistory);

module.exports = router;
