const asyncHandler = require('../../middleware/asyncHandler');
const Doctor = require('../../models/Doctor');

// GET /api/doctors/availability - Get availability schedule
exports.getAvailability = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const doctor = await Doctor.findById(id).select('availability availableTimings blockedDates breakTimes temporaryAvailability averageConsultationMinutes');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      availability: doctor.availability || [],
      availableTimings: doctor.availableTimings || [],
      blockedDates: doctor.blockedDates || [],
      breakTimes: doctor.breakTimes || [],
      temporaryAvailability: doctor.temporaryAvailability || [],
      averageConsultationMinutes: doctor.averageConsultationMinutes || 20,
    },
  });
});

// PATCH /api/doctors/availability - Update availability schedule
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { availability, availableTimings, blockedDates, breakTimes, temporaryAvailability, averageConsultationMinutes } = req.body;

  const updateData = {};
  if (availability !== undefined) updateData.availability = availability;
  if (availableTimings !== undefined) updateData.availableTimings = availableTimings;
  if (blockedDates !== undefined) updateData.blockedDates = blockedDates;
  if (breakTimes !== undefined) updateData.breakTimes = breakTimes;
  if (temporaryAvailability !== undefined) updateData.temporaryAvailability = temporaryAvailability;
  if (averageConsultationMinutes !== undefined) updateData.averageConsultationMinutes = averageConsultationMinutes;

  const doctor = await Doctor.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('availability availableTimings blockedDates breakTimes temporaryAvailability averageConsultationMinutes');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Availability updated successfully',
    data: {
      availability: doctor.availability || [],
      availableTimings: doctor.availableTimings || [],
      blockedDates: doctor.blockedDates || [],
      breakTimes: doctor.breakTimes || [],
      temporaryAvailability: doctor.temporaryAvailability || [],
      averageConsultationMinutes: doctor.averageConsultationMinutes || 20,
    },
  });
});

