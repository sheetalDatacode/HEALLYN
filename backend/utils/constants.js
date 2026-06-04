const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  LABORATORY: 'laboratory',
  PHARMACY: 'pharmacy',
  NURSE: 'nurse',
  ADMIN: 'admin',
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TOKEN_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  VISITED: 'visited',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  NO_SHOW: 'no_show',
  RECALLED: 'recalled',
  CANCELLED: 'cancelled',
};

const CONSULTATION_STATUS = {
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TOKEN_EVENTS = {
  ISSUED: 'token:issued',
  CALLED: 'token:called',
  VISITED: 'token:visited',
  SKIPPED: 'token:skipped',
  RECALLED: 'token:recalled',
  ETA: 'token:eta:update',
  COMPLETED: 'token:completed',
  PRESCRIPTION_READY: 'prescription:ready',
};

const LAB_LEAD_STATUS = {
  NEW: 'new',
  ACCEPTED: 'accepted', // Lab accepted with availability and billing
  HOME_COLLECTION_REQUESTED: 'home_collection_requested',
  SAMPLE_COLLECTED: 'sample_collected',
  TEST_COMPLETED: 'test_completed',
  REPORT_UPLOADED: 'report_uploaded',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PHARMACY_LEAD_STATUS = {
  NEW: 'new',
  ACCEPTED: 'accepted', // Pharmacy accepted with availability and billing
  PATIENT_ARRIVED: 'patient_arrived',
  DELIVERY_REQUESTED: 'delivery_requested',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
};

// Commission rates for different provider roles
const DOCTOR_COMMISSION_RATE = Number(process.env.DOCTOR_COMMISSION_RATE || 0.1);
const LABORATORY_COMMISSION_RATE = Number(process.env.LABORATORY_COMMISSION_RATE || 0.1);
const PHARMACY_COMMISSION_RATE = Number(process.env.PHARMACY_COMMISSION_RATE || 0.1);
const NURSE_COMMISSION_RATE = Number(process.env.NURSE_COMMISSION_RATE || 0.2);

// Legacy: Keep COMMISSION_RATE for backward compatibility (defaults to doctor rate)
const COMMISSION_RATE = DOCTOR_COMMISSION_RATE;

// Helper function to get commission rate by provider role
const getCommissionRateByRole = (providerRole) => {
  try {
    const { getCommissionRate } = require('./commissionConfig');
    return getCommissionRate(providerRole);
  } catch (error) {
    switch (providerRole) {
      case ROLES.DOCTOR:
        return Number(process.env.DOCTOR_COMMISSION_RATE || 0.1);
      case ROLES.LABORATORY:
        return Number(process.env.LABORATORY_COMMISSION_RATE || 0.2);
      case ROLES.PHARMACY:
        return Number(process.env.PHARMACY_COMMISSION_RATE || 0.1);
      case ROLES.NURSE:
        return Number(process.env.NURSE_COMMISSION_RATE || 0.2);
      default:
        return 0.1;
    }
  }
};

const JOB_NAMES = {
  ETA_RECALCULATION: 'queue:eta:recalculate',
  AUTO_NOSHOW: 'queue:token:auto-noshow',
  NOTIFICATION_DISPATCH: 'notification:dispatch',
  PAYOUT_RECONCILIATION: 'payments:reconcile',
};

const PASSWORD_RESET_CONFIG = {
  OTP_LENGTH: 4,
  OTP_EXPIRY_MINUTES: Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10,
  MAX_ATTEMPTS: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5,
  RESET_TOKEN_EXPIRY_MINUTES: Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || 30,
};

module.exports = {
  ROLES,
  APPROVAL_STATUS,
  SESSION_STATUS,
  TOKEN_STATUS,
  CONSULTATION_STATUS,
  TOKEN_EVENTS,
  LAB_LEAD_STATUS,
  PHARMACY_LEAD_STATUS,
  WITHDRAWAL_STATUS,
  COMMISSION_RATE, // Legacy: kept for backward compatibility
  DOCTOR_COMMISSION_RATE,
  LABORATORY_COMMISSION_RATE,
  PHARMACY_COMMISSION_RATE,
  NURSE_COMMISSION_RATE,
  getCommissionRateByRole,
  JOB_NAMES,
  PASSWORD_RESET_CONFIG,
};


