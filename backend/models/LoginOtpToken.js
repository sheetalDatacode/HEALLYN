const mongoose = require('mongoose');

const loginOtpTokenSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

loginOtpTokenSchema.index({ phone: 1, role: 1 }, { unique: true });
loginOtpTokenSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { verifiedAt: { $exists: false } } });

module.exports = mongoose.model('LoginOtpToken', loginOtpTokenSchema);

