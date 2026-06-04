const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order_medicine', 'book_test_visit'],
      required: true,
      index: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      index: true,
    },
    prescription: {
      type: mongoose.Schema.Types.Mixed,
    },
    visitType: {
      type: String,
      enum: ['home', 'lab'],
    },
    patientName: {
      type: String,
      trim: true,
      required: true,
    },
    patientPhone: {
      type: String,
      trim: true,
      required: true,
    },
    patientEmail: {
      type: String,
      trim: true,
    },
    patientAddress: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    adminResponse: {
      pharmacy: {
        type: mongoose.Schema.Types.Mixed,
      },
      pharmacies: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Pharmacy',
        },
      ],
      lab: {
        type: mongoose.Schema.Types.Mixed,
      },
      labs: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Laboratory',
        },
      ],
      medicines: [
        {
          pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
          pharmacyName: { type: String, trim: true },
          name: { type: String, trim: true, required: true },
          dosage: { type: String, trim: true },
          quantity: { type: Number, min: 1, required: true },
          price: { type: Number, min: 0, required: true },
        },
      ],
      tests: [
        {
          labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory' },
          labName: { type: String, trim: true },
          testName: { type: String, trim: true, required: true },
          price: { type: Number, min: 0, required: true },
        },
      ],
      totalAmount: {
        type: Number,
        min: 0,
      },
      message: {
        type: String,
        trim: true,
      },
      responseDate: {
        type: Date,
      },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentConfirmed: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
requestSchema.index({ patientId: 1, createdAt: -1 });
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ type: 1, status: 1 });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;

