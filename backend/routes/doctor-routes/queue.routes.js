const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getQueue,
  moveInQueue,
  skipPatient,
  updateQueueStatus,
  callNextPatient,
  pauseSession,
  resumeSession,
  getAppointmentETA,
  recallPatient,
  markNoShow,
} = require('../../controllers/doctor-controllers/doctorQueueController');

router.get('/', protect('doctor'), getQueue);
router.post('/call-next', protect('doctor'), callNextPatient);
router.post('/pause', protect('doctor'), pauseSession);
router.post('/resume', protect('doctor'), resumeSession);
router.get('/:appointmentId/eta', protect('doctor'), getAppointmentETA);
router.patch('/:appointmentId/move', protect('doctor'), moveInQueue);
router.patch('/:appointmentId/skip', protect('doctor'), skipPatient);
router.patch('/:appointmentId/recall', protect('doctor'), recallPatient);
router.patch('/:appointmentId/no-show', protect('doctor'), markNoShow);
router.patch('/:appointmentId/status', protect('doctor'), updateQueueStatus);

module.exports = router;

