const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
    },
    preparationInstructions: {
      type: String,
      trim: true,
    },
    reportTime: {
      type: String,
      trim: true,
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
  }
);

// Indexes
testSchema.index({ laboratoryId: 1, isActive: 1 });
testSchema.index({ name: 1 });
testSchema.index({ laboratoryId: 1, name: 1 });

const Test = mongoose.model('Test', testSchema);

module.exports = Test;

