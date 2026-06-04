const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { registerModel, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const laboratorySchema = new mongoose.Schema(
  {
    labName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, minlength: 8 },
    licenseNumber: { type: String, required: true, trim: true, unique: true },
    gstNumber: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], trim: true },
    bio: { type: String, trim: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          // Removed default - location is optional, only set if coordinates are provided
        },
        coordinates: {
          type: [Number],
          validate: {
            validator(value) {
              return Array.isArray(value) && value.length === 2;
            },
            message: 'Address location coordinates must be [lng, lat].',
          },
        },
      },
      locationSource: {
        type: String,
        enum: ['manual', 'gps'],
      },
    },
    testsOffered: [
      {
        testName: { type: String, trim: true },
        price: { type: Number, min: 0 },
        description: { type: String, trim: true },
      },
    ],
    timings: [{ type: String, trim: true }],
    contactPerson: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    documents: [{
      name: { type: String, required: true, trim: true },
      fileUrl: { type: String, required: true, trim: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    profileImage: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    operatingHours: {
      opening: { type: String, trim: true },
      closing: { type: String, trim: true },
      days: [{ type: String }],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    lastLoginAt: { type: Date },
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

// Pre-save hook to remove invalid location objects (with only type but no coordinates)
laboratorySchema.pre('save', function removeInvalidLocation(next) {
  if (this.address && this.address.location) {
    const loc = this.address.location;
    if (!loc.coordinates || 
        !Array.isArray(loc.coordinates) || 
        loc.coordinates.length !== 2 ||
        !Number.isFinite(loc.coordinates[0]) ||
        !Number.isFinite(loc.coordinates[1])) {
      // Remove invalid location
      this.address.location = undefined;
      if (this.address.locationSource) {
        this.address.locationSource = undefined;
      }
    }
  }
  next();
});

laboratorySchema.pre('save', async function encryptPassword(next) {
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

laboratorySchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

laboratorySchema.index({ status: 1, labName: 1 });
laboratorySchema.index({ 'address.location': '2dsphere' });

const Laboratory = mongoose.model('Laboratory', laboratorySchema);

registerModel(ROLES.LABORATORY, Laboratory);

module.exports = Laboratory;


