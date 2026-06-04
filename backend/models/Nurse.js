const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { registerModel, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const nurseSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, minlength: 8 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    qualification: { type: String, required: true, trim: true },
    experienceYears: { type: Number, min: 0 },
    specialization: { type: String, trim: true },
    availability: {
      type: [String],
      default: [],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    fees: {
      type: Number,
      min: 0,
      set: function (v) {
        // Preserve exact value without rounding
        if (v === null || v === undefined || v === '') return undefined;
        const num = typeof v === 'string' ? parseFloat(v) : v;
        return isNaN(num) ? undefined : num;
      }
    },
    registrationNumber: { type: String, required: true, trim: true, unique: true },
    registrationCouncilName: { type: String, required: true, trim: true },
    address: {
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    bio: { type: String, trim: true },
    profileImage: { type: String, trim: true },
    documents: [{
      name: { type: String, required: true, trim: true },
      fileUrl: { type: String, required: true, trim: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    lastLoginAt: { type: Date },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      types: {
        appointment: { type: Boolean, default: true },
        booking: { type: Boolean, default: true },
        payment: { type: Boolean, default: true },
        review: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
      },
      quietHours: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: '22:00' },
        endTime: { type: String, default: '08:00' },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

nurseSchema.pre('save', async function encryptPassword(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

nurseSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

nurseSchema.index({ specialization: 1, status: 1 });
nurseSchema.index({ 'address.city': 1, status: 1 });

const Nurse = mongoose.model('Nurse', nurseSchema);

registerModel(ROLES.NURSE, Nurse);

module.exports = Nurse;

