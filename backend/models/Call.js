const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => uuidv4(),
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'accepted', 'ended', 'missed', 'declined'],
      default: 'initiated',
      index: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for efficient queries
callSchema.index({ appointmentId: 1, status: 1 });
callSchema.index({ doctorId: 1, createdAt: -1 });
callSchema.index({ patientId: 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });

// Method to calculate duration when call ends
callSchema.methods.endCall = function() {
  this.endTime = new Date();
  if (this.startTime) {
    this.durationSeconds = Math.floor((this.endTime - this.startTime) / 1000);
  }
  this.status = 'ended';
  return this.save();
};

const Call = mongoose.model('Call', callSchema);

module.exports = Call;

