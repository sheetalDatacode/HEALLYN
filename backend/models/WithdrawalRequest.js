const mongoose = require('mongoose');
const { WITHDRAWAL_STATUS } = require('../utils/constants');

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['doctor', 'pharmacy', 'laboratory', 'nurse'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payoutMethod: {
      type: {
        type: String,
        enum: ['bank_transfer', 'upi', 'paytm'],
        required: true,
      },
      details: {
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, trim: true },
        bankName: { type: String, trim: true },
        accountHolderName: { type: String, trim: true },
        upiId: { type: String, trim: true },
        paytmNumber: { type: String, trim: true },
      },
    },
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
    },
    payoutReference: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
withdrawalRequestSchema.index({ userId: 1, userType: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;

