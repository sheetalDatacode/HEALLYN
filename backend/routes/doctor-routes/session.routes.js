const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createSession,
  getSessions,
  updateSession,
  deleteSession,
} = require('../../controllers/doctor-controllers/doctorSessionController');

router.post('/', protect('doctor'), createSession);
router.get('/', protect('doctor'), getSessions);
router.patch('/:id', protect('doctor'), updateSession);
router.delete('/:id', protect('doctor'), deleteSession);

module.exports = router;

