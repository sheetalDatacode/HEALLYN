const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    tokenType: { type: String, required: true, enum: ['access', 'refresh'] },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    blacklistedAt: { type: Date, default: Date.now },
    reason: { type: String, enum: ['logout', 'refresh', 'security', 'manual'], default: 'logout' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TTL index to automatically delete expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for faster lookups
tokenBlacklistSchema.index({ userId: 1, role: 1, tokenType: 1 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

