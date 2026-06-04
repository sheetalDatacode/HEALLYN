const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createSupportTicket,
  getSupportTickets,
  getSupportHistory,
} = require('../../controllers/laboratory-controllers/laboratorySupportController');

router.post('/', protect('laboratory'), createSupportTicket);
router.get('/', protect('laboratory'), getSupportTickets);
router.get('/history', protect('laboratory'), getSupportHistory);

module.exports = router;

