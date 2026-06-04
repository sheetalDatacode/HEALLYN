const express = require('express');
const {
  registerNurse,
  loginNurse,
  requestLoginOtp,
  getNurseProfile,
  updateNurseProfile,
  logoutNurse,
  refreshToken,
  getNurseById,
} = require('../../controllers/nurse-controllers/nurseAuthController');
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const { authRateLimiter, otpRateLimiter } = require('../../middleware/rateLimiter');
const { sanitizeInput } = require('../../middleware/validationMiddleware');
const { upload } = require('../../middleware/uploadMiddleware');

const router = express.Router();

// Apply rate limiting and input sanitization to auth endpoints
router.post('/signup', sanitizeInput, authRateLimiter, upload.fields([
  { name: 'nursingCertificate', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
]), registerNurse);
router.post('/login/otp', sanitizeInput, otpRateLimiter, requestLoginOtp);
router.post('/login', sanitizeInput, authRateLimiter, loginNurse);

router.post('/refresh-token', sanitizeInput, refreshToken);
router.get('/me', protect(ROLES.NURSE), getNurseProfile);
router.put('/me', protect(ROLES.NURSE), sanitizeInput, upload.fields([
  { name: 'nursingCertificate', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
]), updateNurseProfile);
router.post('/logout', protect(ROLES.NURSE), logoutNurse);
router.get('/profile/:id', protect([ROLES.NURSE, ROLES.ADMIN]), getNurseById);

module.exports = router;

