const Appointment = require('../models/Appointment');
const Session = require('../models/Session');
const Doctor = require('../models/Doctor');
const { getISTTime } = require('../utils/timezoneUtils');

/**
 * Convert 12-hour format to 24-hour format for calculation
 */
const convert12HourTo24Hour = (time12) => {
  if (!time12) return '';
  
  // If already in 24-hour format (no AM/PM), return as is
  if (!time12.toString().includes('AM') && !time12.toString().includes('PM')) {
    return time12;
  }
  
  const timeStr = time12.toString().trim();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  
  if (!match) return time12;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Calculate time difference in minutes between two time strings
 * Handles both 12-hour (HH:MM AM/PM) and 24-hour (HH:MM) formats
 */
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  
  // Convert to 24-hour format if needed
  const time24 = convert12HourTo24Hour(timeString);
  
  // Extract hours and minutes
  const [hours, minutes] = time24.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    console.error(`❌ Invalid time format: ${timeString}`);
    return 0;
  }
  
  return hours * 60 + (minutes || 0);
};

/**
 * Calculate minutes between two time strings
 */
const getTimeDifference = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

/**
 * Calculate ETA for appointment based on queue position and session status
 * @param {String} appointmentId - Appointment ID
 * @returns {Object} ETA information
 */
const calculateAppointmentETA = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('sessionId')
    .populate('doctorId', 'averageConsultationMinutes');

  if (!appointment || !appointment.sessionId) {
    return null;
  }

  const session = appointment.sessionId;
  const doctor = appointment.doctorId;
  const avgConsultation = doctor.averageConsultationMinutes || 20;

  // Calculate patients ahead in queue
  const patientsAhead = Math.max(0, appointment.tokenNumber - session.currentToken - 1);

  // Calculate estimated wait time and call time based on CURRENT TIME (IST)
  // This ensures accurate ETA when doctor starts session late or calls patients
  // Use IST time for doctor session operations
  const now = getISTTime();
  
  // Determine base time for calculation
  // If session is live and patients are being called, use current time
  // Example: Session 2-5 PM, doctor starts at 3 PM, calls first at 3 PM
  // Next patient ETA = current time (3 PM) + consultation time
  let baseTime = now;
  
  if (session.status === 'live' && session.currentToken > 0) {
    // Session is live and patients are being called - use current time
    baseTime = now;
  } else if (session.startedAt && session.currentToken === 0) {
    // Session just started but no patients called yet
    baseTime = new Date(session.startedAt);
  } else if (session.startedAt) {
    // Fallback: use current time for accuracy
    baseTime = now;
  }
  
  // Calculate estimated call time: base time + consultation time
  // Include current patient being consulted: (tokenNumber - currentToken) × avgConsultation
  const consultationTimeForAhead = (appointment.tokenNumber - session.currentToken) * avgConsultation;
  let estimatedCallTime = new Date(baseTime);
  estimatedCallTime.setMinutes(estimatedCallTime.getMinutes() + consultationTimeForAhead);
  
  // Calculate wait time from now
  let estimatedWaitMinutes;
  if (estimatedCallTime <= now) {
    estimatedWaitMinutes = 0;
    estimatedCallTime = now;
  } else {
    estimatedWaitMinutes = Math.max(0, Math.floor((estimatedCallTime - now) / (1000 * 60)));
  }

  return {
    estimatedWaitMinutes,
    estimatedCallTime,
    patientsAhead,
    currentToken: session.currentToken,
    tokenNumber: appointment.tokenNumber,
    pausedAdjustment: 0,
  };
};

/**
 * Calculate ETA for all appointments in queue
 * @param {String} sessionId - Session ID
 * @returns {Array} Array of ETA objects for each appointment
 */
const calculateQueueETAs = async (sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('doctorId', 'averageConsultationMinutes');

  if (!session) return [];

  // Get all waiting appointments - include those with tokens so ETA continues to work
  // Include: scheduled, confirmed, waiting, and skipped (but exclude called/in-consultation/completed)
  // Skipped patients are still in queue but at last position
  const appointments = await Appointment.find({
    sessionId,
    status: { $in: ['scheduled', 'confirmed', 'waiting'] },
    queueStatus: { $in: ['waiting', 'skipped', null] },
  })
    .populate('patientId', 'firstName lastName')
    .sort({ tokenNumber: 1 });

  const doctor = session.doctorId;
  const avgConsultation = doctor.averageConsultationMinutes || 20;

  // No pause adjustment needed - time continues normally
  const pausedAdjustment = 0;

  // Use IST time for doctor session operations
  const now = getISTTime();
  
  // Determine base time for ETA calculation
  // If session is LIVE and patients have been called, use CURRENT TIME as base
  // This ensures ETA is calculated from when doctor actually starts calling patients
  // Example: Session 2-5 PM, doctor starts at 3 PM, calls first patient at 3 PM
  // Next patient ETA should be from 3 PM (current time), not 2 PM (session start)
  let baseTime = now;
  
  // Only use session.startedAt if no patients have been called yet
  // Once patients start being called, use current time for accurate ETA
  if (session.status === 'live' && session.currentToken > 0) {
    // Session is live and patients are being called - use current time
    baseTime = now;
  } else if (session.startedAt && session.currentToken === 0) {
    // Session just started but no patients called yet - use session start time
    baseTime = new Date(session.startedAt);
  } else if (session.startedAt) {
    // Fallback: use session start time but adjust based on current time
    baseTime = now;
  }

  return appointments.map(appointment => {
    // For skipped patients, calculate time based on session start time and token position
    // This ensures skipped patients get the correct time for their token, not based on queue position
    if (appointment.queueStatus === 'skipped') {
      // Calculate time based on session start time and token number
      const sessionStartMinutes = timeToMinutes(session.sessionStartTime);
      const tokenTimeMinutes = sessionStartMinutes + (appointment.tokenNumber - 1) * avgConsultation;
      
      // Convert to Date object for estimatedCallTime
      // Get session date
      const sessionDate = new Date(session.date);
      const tokenHour = Math.floor(tokenTimeMinutes / 60);
      const tokenMin = tokenTimeMinutes % 60;
      
      const estimatedCallTime = new Date(sessionDate);
      estimatedCallTime.setHours(tokenHour, tokenMin, 0, 0);
      
      // Calculate wait time from now
      let estimatedWaitMinutes;
      if (estimatedCallTime <= now) {
        estimatedWaitMinutes = 0;
      } else {
        estimatedWaitMinutes = Math.max(0, Math.floor((estimatedCallTime - now) / (1000 * 60)));
      }
      
      // Calculate patients ahead (all active patients before this token)
      const patientsAhead = Math.max(0, appointment.tokenNumber - session.currentToken - 1);
      
      return {
        appointmentId: appointment._id,
        patientId: appointment.patientId?._id,
        tokenNumber: appointment.tokenNumber,
        estimatedWaitMinutes,
        estimatedCallTime,
        patientsAhead,
      };
    }
    
    // For non-skipped patients, use the regular ETA calculation
    // Calculate patients ahead in queue
    // currentToken represents the token number of patient currently being called/consulted
    // patientsAhead = difference in token numbers - 1
    const patientsAhead = Math.max(0, appointment.tokenNumber - session.currentToken - 1);
    
    // Calculate ETA based on current time
    // Formula: current time + (patients ahead × average consultation time)
    // Important: patientsAhead already excludes the current patient being consulted
    // So we need to add consultation time for:
    // 1. Current patient being consulted (always 1 × avgConsultation)
    // 2. Patients ahead in queue (patientsAhead × avgConsultation)
    // Total = (1 + patientsAhead) × avgConsultation
    // But since patientsAhead = tokenNumber - currentToken - 1, we can simplify:
    // Total = (tokenNumber - currentToken) × avgConsultation
    
    const consultationTimeForAhead = (appointment.tokenNumber - session.currentToken) * avgConsultation;
    
    let estimatedCallTime = new Date(baseTime);
    estimatedCallTime.setMinutes(estimatedCallTime.getMinutes() + consultationTimeForAhead);
    
    // Calculate wait time in minutes from now
    let estimatedWaitMinutes;
    if (estimatedCallTime <= now) {
      // Patient should be called now (no wait)
      estimatedWaitMinutes = 0;
      estimatedCallTime = now;
    } else {
      // Calculate minutes from now until estimated call time
      estimatedWaitMinutes = Math.max(0, Math.floor((estimatedCallTime - now) / (1000 * 60)));
    }

    return {
      appointmentId: appointment._id,
      patientId: appointment.patientId?._id,
      tokenNumber: appointment.tokenNumber,
      estimatedWaitMinutes,
      estimatedCallTime,
      patientsAhead,
    };
  });
};

/**
 * Recalculate and update ETAs for all waiting appointments in a session
 * @param {String} sessionId - Session ID
 */
const recalculateSessionETAs = async (sessionId) => {
  const etas = await calculateQueueETAs(sessionId);
  return etas;
};

/**
 * Get available slots for a doctor on a specific date
 * @param {String} doctorId - Doctor ID
 * @param {Date} date - Date to check
 * @returns {Object} Available slots information
 */
const getAvailableSlots = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return { available: false, message: 'Doctor not found' };
  }

  // Get or create session for the date
  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);

  const Session = require('../models/Session');
  let session = await Session.findOne({
    doctorId,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  // If session doesn't exist, check if we can create one based on availability
  if (!session) {
    // Get day name (Monday, Tuesday, etc.)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];

    // Check doctor's availability for this day
    const dayAvailability = doctor.availability?.find(avail => avail.day === dayName);
    if (!dayAvailability) {
      return { available: false, message: 'Doctor not available on this day' };
    }

    // Check if date is blocked
    const isBlocked = doctor.blockedDates?.some(blocked => {
      const blockedDate = new Date(blocked.date);
      blockedDate.setHours(0, 0, 0, 0);
      return blockedDate.getTime() === sessionDate.getTime();
    });

    if (isBlocked) {
      return { available: false, message: 'Doctor has blocked this date' };
    }

    // Calculate max tokens based on availability
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    const duration = getTimeDifference(dayAvailability.startTime, dayAvailability.endTime);
    const maxTokens = Math.floor(duration / avgConsultation);

    return {
      available: true,
      maxTokens,
      availableSlots: maxTokens,
      sessionStartTime: dayAvailability.startTime,
      sessionEndTime: dayAvailability.endTime,
    };
  }

  // Session exists, calculate available slots
  const bookedSlots = session.currentToken || 0;
  const availableSlots = Math.max(0, session.maxTokens - bookedSlots);

  return {
    available: availableSlots > 0,
    maxTokens: session.maxTokens,
    bookedSlots,
    availableSlots,
    sessionStartTime: session.sessionStartTime,
    sessionEndTime: session.sessionEndTime,
    currentToken: session.currentToken,
  };
};

module.exports = {
  calculateAppointmentETA,
  calculateQueueETAs,
  recalculateSessionETAs,
  getAvailableSlots,
  timeToMinutes,
  getTimeDifference,
};

