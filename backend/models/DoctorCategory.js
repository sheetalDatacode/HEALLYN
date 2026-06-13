const mongoose = require('mongoose');

const doctorCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: null,
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

const DoctorCategory = mongoose.model('DoctorCategory', doctorCategorySchema, 'doctor_categories_v2');

module.exports = DoctorCategory;
