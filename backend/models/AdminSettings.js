const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema(
  {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    autoVerifyDoctors: {
      type: Boolean,
      default: false,
    },
    autoVerifyPharmacies: {
      type: Boolean,
      default: false,
    },
    autoVerifyLaboratories: {
      type: Boolean,
      default: false,
    },
    requireTwoFactor: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      trim: true,
    },
    platformSettings: {
      name: { type: String, trim: true, default: 'Healiinn' },
      logo: { type: String, trim: true },
      primaryColor: { type: String, trim: true },
      secondaryColor: { type: String, trim: true },
      contactEmail: { type: String, trim: true },
      contactPhone: { type: String, trim: true },
      supportEmail: { type: String, trim: true },
    },
    paymentSettings: {
      razorpayKeyId: { type: String, trim: true },
      razorpayKeySecret: { type: String, trim: true },
      commissionRate: {
        doctor: { type: Number, default: 0.1 },
        pharmacy: { type: Number, default: 0.1 },
        laboratory: { type: Number, default: 0.2 },
        nurse: { type: Number, default: 0.2 },
      },
    },
    notificationSettings: {
      appointmentReminder: { type: Boolean, default: true },
      orderStatusUpdate: { type: Boolean, default: true },
      paymentConfirmation: { type: Boolean, default: true },
      prescriptionReady: { type: Boolean, default: true },
      reportReady: { type: Boolean, default: true },
    },
    rewardsSettings: {
      referralBonus: { type: Number, default: 200 },
      loginBonus: { type: Number, default: 200 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure only one settings document exists
adminSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

module.exports = AdminSettings;

