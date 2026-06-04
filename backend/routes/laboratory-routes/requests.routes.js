const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getRequests,
  getRequestById,
} = require('../../controllers/laboratory-controllers/laboratoryRequestsController');

router.get('/', protect('laboratory'), getRequests);
router.get('/:id', protect('laboratory'), getRequestById);

module.exports = router;

