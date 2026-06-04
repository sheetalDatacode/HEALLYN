const LoginOtpToken = require('../models/LoginOtpToken');
const AdminSettings = require('../models/AdminSettings');
const WalletTransaction = require('../models/WalletTransaction');
const Patient = require('../models/Patient');
const { getModelForRole, ROLES } = require('../utils/getModelForRole');
const { PASSWORD_RESET_CONFIG, APPROVAL_STATUS } = require('../utils/constants');
const {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  addMinutes,
} = require('../utils/otpService');
const { sendMobileOtp } = require('./smsService');

const findUserByPhone = async (role, phone) => {
  const Model = getModelForRole(role);
  return Model.findOne({ phone });
};

const ensureRoleSupported = (role) => {
  const supportedRoles = [ROLES.PATIENT, ROLES.DOCTOR, ROLES.LABORATORY, ROLES.PHARMACY, ROLES.NURSE];
  if (!supportedRoles.includes(role)) {
    const error = new Error('Unsupported role for login OTP');
    error.status = 400;
    throw error;
  }
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // If it starts with 0, remove it
  if (cleaned.startsWith('0')) {
    return cleaned.substring(1);
  }
  return cleaned;
};

const requestLoginOtp = async ({ role, phone }) => {
  ensureRoleSupported(role);

  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 10) {
    const error = new Error('Invalid phone number');
    error.status = 400;
    throw error;
  }

  const user = await findUserByPhone(role, normalizedPhone);

  if (!user) {
    // Don't reveal if phone exists or not for security
    const error = new Error('Invalid phone number or account not found');
    error.status = 404;
    throw error;
  }

  // Check if account is active
  if (user.isActive === false) {
    const error = new Error('Account is inactive. Please contact support.');
    error.status = 403;
    throw error;
  }

  // Check if account is approved (for doctor, lab, pharmacy)
  if (user.status && user.status !== APPROVAL_STATUS.APPROVED) {
    const error = new Error('Account pending admin approval. Please wait for confirmation.');
    error.status = 403;
    throw error;
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await LoginOtpToken.findOneAndUpdate(
    { phone: normalizedPhone, role },
    {
      phone: normalizedPhone,
      role,
      otpHash,
      otpExpiresAt: addMinutes(PASSWORD_RESET_CONFIG.OTP_EXPIRY_MINUTES),
      attempts: 0,
      maxAttempts: PASSWORD_RESET_CONFIG.MAX_ATTEMPTS,
      verifiedAt: undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send OTP via SMS
  await sendMobileOtp({ phone: normalizedPhone, otp, role });

  return {
    message: 'OTP sent to registered mobile number.',
    phone: normalizedPhone, // Return normalized phone for frontend
  };
};

const verifyLoginOtp = async ({ role, phone, otp }) => {
  ensureRoleSupported(role);

  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 10) {
    const error = new Error('Invalid phone number');
    error.status = 400;
    throw error;
  }

  const record = await LoginOtpToken.findOne({ phone: normalizedPhone, role });

  if (!record) {
    const error = new Error('No login OTP request found. Please request a new OTP.');
    error.status = 404;
    throw error;
  }

  if (record.otpExpiresAt < new Date()) {
    await record.deleteOne();
    const error = new Error('OTP has expired. Please request a new one.');
    error.status = 410;
    throw error;
  }

  if (record.attempts >= record.maxAttempts) {
    await record.deleteOne();
    const error = new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    error.status = 429;
    throw error;
  }

  const isMatch = await verifyOtpHash(otp, record.otpHash);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const error = new Error('Invalid OTP. Please try again.');
    error.status = 400;
    throw error;
  }

  // Mark as verified
  record.verifiedAt = new Date();
  record.attempts = 0;
  await record.save();

  // Get user
  const user = await findUserByPhone(role, normalizedPhone);

  if (!user) {
    await record.deleteOne();
    const error = new Error('Account not found.');
    error.status = 404;
    throw error;
  }

  // Rewards Program: Credit first login/signup bonus & referral rewards
  if (role === ROLES.PATIENT && !user.lastLoginAt) {
    try {
      const settings = await AdminSettings.getSettings();
      const rewardsConfig = settings.rewardsSettings || { referralBonus: 200, loginBonus: 200 };
      const loginBonus = Number(rewardsConfig.loginBonus) || 200;

      // 1. Credit Login Bonus to the new user
      user.walletBalance = (user.walletBalance || 0) + loginBonus;

      // Create wallet transaction for the login bonus
      await WalletTransaction.create({
        userId: user._id,
        userType: 'patient',
        type: 'login_bonus',
        amount: loginBonus,
        balance: user.walletBalance,
        status: 'completed',
        description: 'Signup/First Login Bonus',
        referenceId: `LGN-BONUS-${user._id.toString().slice(-6)}`
      });

      // 2. Credit Referral Bonus to Referrer if applicable
      if (user.referredBy) {
        const referralBonus = Number(rewardsConfig.referralBonus) || 200;
        const referrer = await Patient.findById(user.referredBy);
        if (referrer) {
          referrer.walletBalance = (referrer.walletBalance || 0) + referralBonus;
          await referrer.save({ validateBeforeSave: false });

          // Create wallet transaction for the referral bonus
          await WalletTransaction.create({
            userId: referrer._id,
            userType: 'patient',
            type: 'referral_bonus',
            amount: referralBonus,
            balance: referrer.walletBalance,
            status: 'completed',
            description: `Referral Bonus for inviting ${user.firstName}`,
            referenceId: `REF-BONUS-${user._id.toString().slice(-6)}`
          });
        }
      }
    } catch (error) {
      console.error('Error processing signup rewards:', error.message);
    }
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Delete OTP record after successful verification
  await record.deleteOne();

  return {
    user,
    message: 'OTP verified successfully.',
  };
};

module.exports = {
  requestLoginOtp,
  verifyLoginOtp,
  normalizePhone,
};

