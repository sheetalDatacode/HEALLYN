const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../utils/constants');

const sessionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    sessionStartTime: {
      type: String,
      required: true,
      trim: true,
    },
    sessionEndTime: {
      type: String,
      required: true,
      trim: true,
    },
    maxTokens: {
      type: Number,
      min: 1,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
      index: true,
    },
    currentToken: {
      type: Number,
      default: 0,
      min: 0,
    },
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
      },
    ],
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    pausedAt: {
      type: Date,
    },
    pausedDuration: {
      type: Number,
      default: 0, // Total paused time in minutes
    },
    pauseHistory: [
      {
        pausedAt: { type: Date, required: true },
        resumedAt: { type: Date },
        duration: { type: Number, default: 0 }, // Duration in minutes
      },
    ],
    notes: {
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
sessionSchema.index({ doctorId: 1, date: 1 });
sessionSchema.index({ status: 1, date: 1 });
sessionSchema.index({ date: 1, status: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

