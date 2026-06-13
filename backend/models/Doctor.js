const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { registerModel, ROLES } = require('../utils/getModelForRole');
const { APPROVAL_STATUS } = require('../utils/constants');

const doctorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, minlength: 8 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorCategory', required: true },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DoctorSubcategory' }],
    gender: { type: String,required: true, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    licenseNumber: { type: String, required: true, trim: true, unique: true },
    experienceYears: { type: Number, min: 0 },
    education: [{ institution: String, degree: String, year: Number }],
    qualification: { type: String, trim: true },
    languages: [{ type: String, trim: true }],
    consultationModes: [{ type: String, enum: ['in_person', 'call', 'audio', 'chat', 'video'] }],
    clinicDetails: {
      name: { type: String, trim: true },
      address: {
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
      },
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
            message: 'Clinic location coordinates must be [lng, lat].',
          },
        },
      },
      locationSource: {
        type: String,
        enum: ['manual', 'gps'],
      },
    },
    bio: { type: String, trim: true },
    consultationFee: { 
      type: Number, 
      min: 0,
      set: function(v) {
        // Preserve exact value without rounding
        if (v === null || v === undefined || v === '') return undefined;
        const num = typeof v === 'string' ? parseFloat(v) : v;
        return isNaN(num) ? undefined : num;
      }
    },
    averageConsultationMinutes: {
      type: Number,
      min: 5,
      max: 120,
      default: 20, // Default 20 minutes per consultation
    },
    availableTimings: [{ type: String, trim: true }],
    availability: [
      {
        day: { type: String, trim: true },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
      },
    ],
    blockedDates: [
      {
        date: { type: Date, required: true },
        reason: { type: String, trim: true, enum: ['holiday', 'leave', 'emergency', 'other'], default: 'other' },
        description: { type: String, trim: true },
        isRecurring: { type: Boolean, default: false },
        recurringPattern: {
          type: { type: String, enum: ['yearly', 'monthly', 'weekly'], trim: true },
          dayOfMonth: { type: Number, min: 1, max: 31 },
          month: { type: Number, min: 1, max: 12 },
          dayOfWeek: { type: Number, min: 0, max: 6 },
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    breakTimes: [
      {
        day: { type: String, trim: true },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
        isRecurring: { type: Boolean, default: true },
        specificDate: { type: Date },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    temporaryAvailability: [
      {
        date: { type: Date, required: true },
        slots: [
          {
            startTime: { type: String, trim: true, required: true },
            endTime: { type: String, trim: true, required: true },
          },
        ],
        reason: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    profileImage: { type: String, trim: true },
    digitalSignature: {
      imageUrl: { type: String, trim: true },
      uploadedAt: { type: Date },
    },
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
        consultation: { type: Boolean, default: true },
        prescription: { type: Boolean, default: true },
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

// Pre-save hook to remove invalid location objects (with only type but no coordinates)
doctorSchema.pre('save', function removeInvalidLocation(next) {
  if (this.clinicDetails && this.clinicDetails.location) {
    const loc = this.clinicDetails.location;
    if (!loc.coordinates || 
        !Array.isArray(loc.coordinates) || 
        loc.coordinates.length !== 2 ||
        !Number.isFinite(loc.coordinates[0]) ||
        !Number.isFinite(loc.coordinates[1])) {
      // Remove invalid location
      this.clinicDetails.location = undefined;
      if (this.clinicDetails.locationSource) {
        this.clinicDetails.locationSource = undefined;
      }
    }
  }
  next();
});

doctorSchema.pre('save', async function encryptPassword(next) {
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

doctorSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.index({ category: 1, status: 1 });
doctorSchema.index({ 'clinicDetails.location': '2dsphere' });

const Doctor = mongoose.model('Doctor', doctorSchema);

registerModel(ROLES.DOCTOR, Doctor);

module.exports = Doctor;


