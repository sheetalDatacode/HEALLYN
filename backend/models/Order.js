const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: function (doc) {
        if (doc && doc.providerType) {
          if (doc.providerType === 'laboratory') return 'Laboratory'
          if (doc.providerType === 'pharmacy') return 'Pharmacy'
        }
        return 'Pharmacy' // Fallback to a valid model instead of non-existent 'User'
      }
    },
    providerType: {
      type: String,
      enum: ['pharmacy', 'laboratory'],
      required: true,
      index: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      index: true,
    },
    items: [
      {
        name: { type: String, trim: true, required: true },
        quantity: { type: Number, min: 1, required: true },
        price: { type: Number, min: 0, required: true },
        total: { type: Number, min: 0 },
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
      },
    ],
    totalAmount: {
      type: Number,
      min: 0,
      required: true,
    },
    status: {
      type: String,
      enum: [
        // Common statuses
        'pending', 'accepted', 'processing', 'ready', 'delivered', 'cancelled', 'completed',
        // Lab visit flow statuses
        'visit_time', 'sample_collected', 'being_tested', 'reports_being_generated', 'test_successful', 'reports_updated',
        // Pharmacy order flow statuses
        'prescription_received', 'medicine_collected', 'packed', 'ready_to_be_picked', 'picked_up'
      ],
      default: 'pending',
      index: true,
    },
    deliveryOption: {
      type: String,
      enum: ['home_delivery', 'pickup'],
      default: 'pickup',
    },
    deliveryAddress: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cash', 'upi', 'card'],
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    notes: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
orderSchema.index({ providerId: 1, providerType: 1, status: 1 });
orderSchema.index({ patientId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

