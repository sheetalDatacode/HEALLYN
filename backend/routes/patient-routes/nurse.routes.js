const express = require('express');
const router = express.Router();
const {
  getNurses,
  getNurseById,
} = require('../../controllers/patient-controllers/patientNurseController');

// Public routes (no auth required for discovery)
// Parameterized routes (must come after specific routes)
router.get('/:id', getNurseById);
router.get('/', getNurses);

module.exports = router;
