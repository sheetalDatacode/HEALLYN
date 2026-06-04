const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    testName: {
      type: String,
      trim: true,
      required: true,
    },
    results: [
      {
        parameter: { type: String, trim: true, required: true },
        value: { type: String, trim: true, required: true },
        unit: { type: String, trim: true },
        normalRange: { type: String, trim: true },
        status: {
          type: String,
          enum: ['normal', 'abnormal', 'critical'],
          default: 'normal',
        },
      },
    ],
    pdfFileUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    notes: {
      type: String,
      trim: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Doctor',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        consultationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Consultation',
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
labReportSchema.index({ patientId: 1, createdAt: -1 });
labReportSchema.index({ laboratoryId: 1, createdAt: -1 });
labReportSchema.index({ status: 1 });

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport;

