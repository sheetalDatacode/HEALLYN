const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    dosage: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
medicineSchema.index({ pharmacyId: 1, isActive: 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ pharmacyId: 1, name: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;

