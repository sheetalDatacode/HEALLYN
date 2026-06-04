const mongoose = require('mongoose');

const pharmacyServiceSchema = new mongoose.Schema(
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
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['prescription', 'consultation', 'delivery'],
      default: 'prescription',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: String,
      trim: true,
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    deliveryOptions: [
      {
        type: String,
        enum: ['pickup', 'delivery'],
      },
    ],
    serviceRadius: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
pharmacyServiceSchema.index({ pharmacyId: 1, available: 1 });
pharmacyServiceSchema.index({ category: 1 });

const PharmacyService = mongoose.model('PharmacyService', pharmacyServiceSchema);

module.exports = PharmacyService;

