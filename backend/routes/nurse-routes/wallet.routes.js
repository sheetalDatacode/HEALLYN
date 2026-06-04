const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { ROLES } = require('../../utils/constants');
const {
  getWalletBalance,
  getEarnings,
  getTransactions,
  getWithdrawals,
  requestWithdrawal,
} = require('../../controllers/nurse-controllers/nurseWalletController');

router.get('/balance', protect(ROLES.NURSE), getWalletBalance);
router.get('/earnings', protect(ROLES.NURSE), getEarnings);
router.get('/transactions', protect(ROLES.NURSE), getTransactions);
router.get('/withdrawals', protect(ROLES.NURSE), getWithdrawals);
router.post('/withdraw', protect(ROLES.NURSE), requestWithdrawal);

module.exports = router;
