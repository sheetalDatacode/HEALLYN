const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getWalletBalance,
  getEarnings,
  getTransactions,
  getWithdrawals,
  requestWithdrawal,
} = require('../../controllers/laboratory-controllers/laboratoryWalletController');

router.get('/balance', protect('laboratory'), getWalletBalance);
router.get('/earnings', protect('laboratory'), getEarnings);
router.get('/transactions', protect('laboratory'), getTransactions);
router.get('/withdrawals', protect('laboratory'), getWithdrawals);
router.post('/withdraw', protect('laboratory'), requestWithdrawal);

module.exports = router;

