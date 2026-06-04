const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getTests,
  addTest,
  updateTest,
  deleteTest,
} = require('../../controllers/laboratory-controllers/laboratoryTestController');

router.get('/', protect('laboratory'), getTests);
router.post('/', protect('laboratory'), addTest);
router.patch('/:id', protect('laboratory'), updateTest);
router.delete('/:id', protect('laboratory'), deleteTest);

module.exports = router;

