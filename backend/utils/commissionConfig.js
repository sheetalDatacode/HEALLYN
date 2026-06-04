/**
 * Commission Configuration Utility
 * Reads commission rates from environment variables with database settings fallback
 */
const AdminSettings = require('../models/AdminSettings');

// In-memory cache for fast, synchronous access to active commission rates
const commissionRates = {
  doctor: parseFloat(process.env.DOCTOR_COMMISSION_RATE) || 0.1,      // Default 10%
  pharmacy: parseFloat(process.env.PHARMACY_COMMISSION_RATE) || 0.1,    // Default 10%
  laboratory: parseFloat(process.env.LABORATORY_COMMISSION_RATE) || 0.2,  // Default 20%
  nurse: parseFloat(process.env.NURSE_COMMISSION_RATE) || 0.2,       // Default 20%
};

/**
 * Initialize commission rates from AdminSettings database document
 */
const initCommissionRates = async () => {
  try {
    const settings = await AdminSettings.getSettings();
    if (settings && settings.paymentSettings && settings.paymentSettings.commissionRate) {
      const rateObj = settings.paymentSettings.commissionRate;
      if (rateObj.doctor !== undefined) commissionRates.doctor = rateObj.doctor;
      if (rateObj.pharmacy !== undefined) commissionRates.pharmacy = rateObj.pharmacy;
      if (rateObj.laboratory !== undefined) commissionRates.laboratory = rateObj.laboratory;
      if (rateObj.nurse !== undefined) commissionRates.nurse = rateObj.nurse;
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize commission rates from DB:', error.message);
  }
};

/**
 * Update the in-memory commission rates cache when admin updates settings
 * @param {object} newRates - New rates from DB
 */
const updateCommissionRatesCache = (newRates) => {
  if (!newRates) return;
  if (newRates.doctor !== undefined) commissionRates.doctor = newRates.doctor;
  if (newRates.pharmacy !== undefined) commissionRates.pharmacy = newRates.pharmacy;
  if (newRates.laboratory !== undefined) commissionRates.laboratory = newRates.laboratory;
  if (newRates.nurse !== undefined) commissionRates.nurse = newRates.nurse;
  
};

/**
 * Get commission rate for a provider type
 * @param {string} providerType - 'doctor', 'pharmacy', 'laboratory', or 'nurse'
 * @returns {number} Commission rate as decimal (e.g., 0.1 = 10%)
 */
const getCommissionRate = (providerType) => {
  const normalizedType = providerType ? providerType.toLowerCase() : '';
  const rate = commissionRates[normalizedType] !== undefined ? commissionRates[normalizedType] : 0.1;
  return rate;
};

/**
 * Calculate provider earning after commission
 * @param {number} totalAmount - Total amount
 * @param {string} providerType - 'doctor', 'pharmacy', 'laboratory', or 'nurse'
 * @returns {object} { earning, commission }
 */
const calculateProviderEarning = (totalAmount, providerType) => {
  const commissionRate = getCommissionRate(providerType);
  const commission = totalAmount * commissionRate;
  const earning = totalAmount - commission;
  
  return {
    earning,
    commission,
    commissionRate,
  };
};

module.exports = {
  getCommissionRate,
  calculateProviderEarning,
  initCommissionRates,
  updateCommissionRatesCache,
};
