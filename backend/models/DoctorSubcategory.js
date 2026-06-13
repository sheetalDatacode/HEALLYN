const mongoose = require('mongoose');

const doctorSubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorCategory',
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: true, // Typically true when created by admin, false when added dynamically by doctor
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    autoIndex: true, // Enable autoIndex for lookup performance
  }
);

// Ensure a subcategory name is unique within a category
doctorSubcategorySchema.index({ name: 1, category: 1 }, { unique: true });

const DoctorSubcategory = mongoose.model('DoctorSubcategory', doctorSubcategorySchema, 'doctor_subcategories_v2');

module.exports = DoctorSubcategory;
