const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    medications: [
      {
        name: { type: String, trim: true, required: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true },
        duration: { type: String, trim: true },
        instructions: { type: String, trim: true },
        quantity: { type: Number, min: 0 },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    pdfFileUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    expiryDate: {
      type: Date,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
        sharedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;

