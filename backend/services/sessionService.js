const Session = require('../models/Session');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { SESSION_STATUS } = require('../utils/constants');
const { timeToMinutes, getTimeDifference } = require('./etaService');
const { getISTTime, getISTDate, getISTTimeInMinutes, getISTHourMinute, parseDateInIST } = require('../utils/timezoneUtils');

/**
 * Get day name from date
 */
const getDayName = (date) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = date.getDay();
  return dayNames[dayIndex];
};

/**
 * Normalize day name for matching (handles different formats)
 */
const normalizeDayName = (dayName) => {
  if (!dayName) return null;
  const day = dayName.trim();
  const dayMap = {
    'sun': 'Sunday',
    'mon': 'Monday',
    'tue': 'Tuesday',
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sunday': 'Sunday',
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
  };
  return dayMap[day.toLowerCase()] || day;
};

/**
 * Check if date is blocked
 */
const isDateBlocked = (doctor, date) => {
  if (!doctor.blockedDates || doctor.blockedDates.length === 0) {
    return false;
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return doctor.blockedDates.some(blocked => {
    const blockedDate = new Date(blocked.date);
    blockedDate.setHours(0, 0, 0, 0);
    return blockedDate.getTime() === checkDate.getTime();
  });
};

/**
 * Get availability for a specific date
 */
const getAvailabilityForDate = (doctor, date) => {
  // Ensure date is a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.error('❌ Invalid date provided to getAvailabilityForDate:', date);
    return null;
  }
  
  const dayName = getDayName(dateObj);
  

  // Check temporary availability first
  if (doctor.temporaryAvailability && doctor.temporaryAvailability.length > 0) {
    const tempAvail = doctor.temporaryAvailability.find(avail => {
      const availDate = new Date(avail.date);
      availDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === checkDate.getTime();
    });

    if (tempAvail && tempAvail.slots && tempAvail.slots.length > 0) {
      // Use first slot for now (can be extended to handle multiple slots)
      return {
        startTime: tempAvail.slots[0].startTime,
        endTime: tempAvail.slots[0].endTime,
      };
    }
  }

  // Check regular availability
  // Normalize day names for matching (handle different formats)
  const normalizedDayName = normalizeDayName(dayName);
  const dayAvailability = doctor.availability?.find(avail => {
    const availDay = normalizeDayName(avail.day);
    return availDay === normalizedDayName;
  });
  
  if (dayAvailability) {
    
    return {
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    };
  }

  
  return null;
};

/**
 * Create or get session for a doctor on a specific date
 * Automatically creates session based on doctor's availability
 */
const getOrCreateSession = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  // Handle date - parse in IST timezone to ensure consistent date handling regardless of server timezone
  let sessionDate;
  try {
    if (date) {
      sessionDate = parseDateInIST(date);
    } else {
      sessionDate = getISTDate(); // Use current IST date if no date provided
    }
  } catch (error) {
    throw new Error(`Invalid date format: ${date} - ${error.message}`);
  }
  
  sessionDate.setHours(0, 0, 0, 0);
  const sessionEndDate = new Date(sessionDate);
  sessionEndDate.setHours(23, 59, 59, 999);
  
  const dayName = getDayName(sessionDate);
  

  // Check if session already exists
  let session = await Session.findOne({
    doctorId,
    date: { $gte: sessionDate, $lt: sessionEndDate },
  });

  // If session exists and is cancelled, throw error (don't allow booking on cancelled session)
  if (session && session.status === SESSION_STATUS.CANCELLED) {
    throw new Error('Session was cancelled for this date. Please select a different date.');
  }

  if (session) {
    // If session exists, verify it matches current doctor availability
    // If doctor's availability or consultation time changed, update the session
    const availability = getAvailabilityForDate(doctor, sessionDate);
    if (availability) {
      // Get fresh doctor data to ensure we have latest averageConsultationMinutes
      const freshDoctor = await Doctor.findById(doctorId).select('averageConsultationMinutes');
      const avgConsultation = freshDoctor?.averageConsultationMinutes || doctor.averageConsultationMinutes || 20;
      
      const duration = getTimeDifference(availability.startTime, availability.endTime);
      if (duration <= 0) {
        throw new Error(`Invalid session duration: ${availability.startTime} to ${availability.endTime}`);
      }
      
      const calculatedMaxTokens = Math.max(1, Math.floor(duration / avgConsultation));
      
      
      
      // Always update session to match current doctor availability (force sync)
      if (session.sessionStartTime !== availability.startTime || 
          session.sessionEndTime !== availability.endTime ||
          session.maxTokens !== calculatedMaxTokens) {
        
        
        session.sessionStartTime = availability.startTime;
        session.sessionEndTime = availability.endTime;
        session.maxTokens = calculatedMaxTokens;
        // Don't reset currentToken if there are already bookings
        await session.save();
      } else {
        
      }
    } else {
      
    }
    return session;
  }

  // Check if date is blocked
  if (isDateBlocked(doctor, sessionDate)) {
    throw new Error('Doctor has blocked this date');
  }

  // Get availability for this date
  const availability = getAvailabilityForDate(doctor, sessionDate);
  if (!availability) {
    console.error(`❌ No availability found for doctor ${doctorId} on ${dayName} (${sessionDate.toISOString().split('T')[0]})`);
    console.error(`Doctor availability:`, doctor.availability?.map(a => ({ day: a.day, startTime: a.startTime, endTime: a.endTime })) || 'No availability set');
    throw new Error(`Doctor not available on ${dayName}. Please check doctor's availability settings.`);
  }

  // Validate availability times
  if (!availability.startTime || !availability.endTime) {
    console.error(`❌ Invalid availability times for doctor ${doctorId}:`, {
      startTime: availability.startTime,
      endTime: availability.endTime,
    });
    throw new Error('Doctor availability times are not properly configured');
  }
  
  

  // Calculate max tokens based on availability and average consultation time
  // Get fresh doctor data to ensure we have latest averageConsultationMinutes
  const freshDoctor = await Doctor.findById(doctorId).select('averageConsultationMinutes');
  const avgConsultation = freshDoctor?.averageConsultationMinutes || doctor.averageConsultationMinutes || 20;
  
  if (avgConsultation <= 0) {
    throw new Error('Doctor average consultation time must be greater than 0');
  }

  const duration = getTimeDifference(availability.startTime, availability.endTime);
  if (duration <= 0) {
    throw new Error(`Invalid session duration: ${availability.startTime} to ${availability.endTime}`);
  }

  const maxTokens = Math.max(1, Math.floor(duration / avgConsultation));

  // Debug log for session creation with detailed calculation
  

  // Create new session with error handling
  try {
    session = await Session.create({
      doctorId,
      date: sessionDate,
      sessionStartTime: availability.startTime,
      sessionEndTime: availability.endTime,
      maxTokens,
      status: SESSION_STATUS.SCHEDULED,
      currentToken: 0,
    });
    
    
    
    return session;
  } catch (error) {
    console.error(`❌ Error creating session:`, {
      error: error.message,
      stack: error.stack,
      doctorId,
      date: sessionDate,
      sessionStartTime: availability.startTime,
      sessionEndTime: availability.endTime,
      maxTokens,
    });
    throw new Error(`Failed to create session: ${error.message}`);
  }
};

/**
 * Check if slots are available for booking
 * For same-day bookings, excludes past time slots based on current time
 */
const checkSlotAvailability = async (doctorId, date) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return {
        available: false,
        message: 'Doctor not found',
      };
    }

    // First, check if there's a cancelled session for this date
    let parsedDate;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();
      parsedDate = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
    } else {
      parsedDate = new Date(date);
      parsedDate.setHours(0, 0, 0, 0);
    }
    
    const sessionDateStart = new Date(parsedDate);
    sessionDateStart.setHours(0, 0, 0, 0);
    const sessionDateEnd = new Date(parsedDate);
    sessionDateEnd.setHours(23, 59, 59, 999);
    
    // Check if there's a cancelled or completed session for this date
    const cancelledOrCompletedSession = await Session.findOne({
      doctorId,
      date: { $gte: sessionDateStart, $lt: sessionDateEnd },
      status: { $in: [SESSION_STATUS.CANCELLED, SESSION_STATUS.COMPLETED] },
    });
    
    if (cancelledOrCompletedSession) {
      const isCancelled = cancelledOrCompletedSession.status === SESSION_STATUS.CANCELLED;
      const isCompleted = cancelledOrCompletedSession.status === SESSION_STATUS.COMPLETED;
      
      return {
        available: false,
        message: isCancelled 
          ? 'Session was cancelled for this date. Please select a different date.'
          : 'Session has ended for this date. No new appointments can be booked.',
        totalSlots: cancelledOrCompletedSession.maxTokens || 0,
        bookedSlots: 0,
        availableSlots: 0,
        isCancelled: isCancelled,
        isCompleted: isCompleted,
      };
    }

    const session = await getOrCreateSession(doctorId, date);
    const avgConsultation = doctor.averageConsultationMinutes || 20;
    
    // Check if booking is for today (same day)
    // Use IST time for doctor session operations
    const today = getISTDate();
    
    const isSameDay = parsedDate.getTime() === today.getTime();
    
    let effectiveMaxTokens = session.maxTokens;
    let pastSlotsCount = 0;
    let effectiveStartTime = session.sessionStartTime;
    
    // Check if session end time has passed - flag it but allow bookings for call/video
    // In-person bookings will be rejected in createAppointment controller
    let isSessionEnded = false;
    if (isSameDay) {
      // Use IST time for doctor session operations
      const { hour: currentHour, minute: currentMinute } = getISTHourMinute();
      const currentTimeMinutes = getISTTimeInMinutes();
      
      const sessionEndMinutes = timeToMinutes(session.sessionEndTime);
      
      // If session end time has passed, set flag but continue (allow call/video bookings)
      if (sessionEndMinutes !== null && currentTimeMinutes >= sessionEndMinutes) {
        isSessionEnded = true;
      }
      
      // If same day booking, calculate available slots from current time
      // Reuse now, currentTimeMinutes, and sessionEndMinutes variables from above
      
      // Convert session start time to minutes
      const sessionStartMinutes = timeToMinutes(session.sessionStartTime);
      // sessionEndMinutes already declared above, reuse it
      
      // If current time is past session start time, exclude past slots
      if (currentTimeMinutes > sessionStartMinutes && currentTimeMinutes < sessionEndMinutes) {
        // Calculate how many slots have passed
        const elapsedMinutes = currentTimeMinutes - sessionStartMinutes;
        pastSlotsCount = Math.floor(elapsedMinutes / avgConsultation);
        
        // Calculate effective max tokens from current time to end time
        const remainingMinutes = sessionEndMinutes - currentTimeMinutes;
        effectiveMaxTokens = Math.max(1, Math.floor(remainingMinutes / avgConsultation));
        
        // Calculate effective start time (next available slot time)
        // Next slot starts at: sessionStart + (pastSlotsCount + 1) * avgConsultation
        const nextSlotMinutes = sessionStartMinutes + (pastSlotsCount + 1) * avgConsultation;
        const nextSlotHour = Math.floor(nextSlotMinutes / 60);
        const nextSlotMin = nextSlotMinutes % 60;
        
        // Convert to 12-hour format for display
        let displayHour = nextSlotHour;
        let period = 'AM';
        if (nextSlotHour >= 12) {
          period = 'PM';
          if (nextSlotHour > 12) {
            displayHour = nextSlotHour - 12;
          }
        } else if (nextSlotHour === 0) {
          displayHour = 12;
        }
        effectiveStartTime = `${displayHour}:${nextSlotMin.toString().padStart(2, '0')} ${period}`;
        
        
      }
    }
    
    // Get actual booked appointments count (not just currentToken)
    // Count ALL appointments with token numbers assigned (including called, in-consultation, completed, etc.)
    // This ensures accurate token calculation even when patients are in consultation or completed
    // IMPORTANT: Completed appointments also have token numbers, so they must be counted
    // Only cancelled appointments should be excluded as they don't occupy token slots
    const Appointment = require('../models/Appointment');
    const actualBookedCount = await Appointment.countDocuments({
      sessionId: session._id,
      paymentStatus: 'paid', // Only count paid appointments
      tokenNumber: { $ne: null }, // Only count appointments that have token numbers assigned
      status: { 
        $ne: 'cancelled' // Only exclude cancelled appointments (include completed, scheduled, called, in-consultation, etc.)
      },
    });
    
    // Use actual booked count instead of currentToken for accurate slot calculation
    // This count includes all appointments with tokens: scheduled, confirmed, called, in-consultation, in_progress, waiting, completed
    const bookedSlots = actualBookedCount;
    
    // For same-day bookings, adjust available slots calculation
    const availableSlots = isSameDay && pastSlotsCount > 0
      ? Math.max(0, effectiveMaxTokens - Math.max(0, bookedSlots - pastSlotsCount))
      : Math.max(0, session.maxTokens - bookedSlots);
    
    // CRITICAL: Calculate nextToken the same way as in booking flow
    // Use MAX token number (excluding cancelled) + 1, then skip cancelled tokens
    // This ensures the displayed token matches what patient will actually get
    let nextToken = null;
    if (availableSlots > 0) {
      // Find MAX token from all non-cancelled paid appointments
      const maxTokenResult = await Appointment.aggregate([
        {
          $match: {
            sessionId: session._id,
            paymentStatus: 'paid',
            tokenNumber: { $ne: null },
            status: { $nin: ['cancelled', 'cancelled_by_session'] },
          },
        },
        {
          $group: {
            _id: null,
            maxToken: { $max: '$tokenNumber' },
          },
        },
      ]);
      
      const maxTokenNumber = maxTokenResult.length > 0 && maxTokenResult[0].maxToken ? maxTokenResult[0].maxToken : 0;
      let calculatedNextToken = maxTokenNumber + 1;
      
      // Get all cancelled token numbers to skip them
      const cancelledAppointments = await Appointment.find({
        sessionId: session._id,
        status: { $in: ['cancelled', 'cancelled_by_session'] },
        tokenNumber: { $ne: null },
      }).select('tokenNumber');
      
      const cancelledTokenNumbers = new Set(cancelledAppointments.map(apt => apt.tokenNumber));
      
      // Skip cancelled tokens
      while (cancelledTokenNumbers.has(calculatedNextToken) && calculatedNextToken <= session.maxTokens) {
        calculatedNextToken++;
      }
      
      // Ensure we don't exceed maxTokens
      if (calculatedNextToken <= session.maxTokens) {
        nextToken = calculatedNextToken;
      }
    }

    // Debug log to verify calculation
    

    return {
      available: availableSlots > 0,
      totalSlots: isSameDay && pastSlotsCount > 0 ? effectiveMaxTokens : session.maxTokens,
      bookedSlots,
      availableSlots,
      nextToken, // CRITICAL: Next token number that will be assigned (excluding cancelled tokens)
      sessionId: session._id,
      sessionStartTime: isSameDay && pastSlotsCount > 0 ? effectiveStartTime : session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
      avgConsultationMinutes: avgConsultation,
      isSameDay,
      pastSlotsCount,
      isSessionEnded,
    };
  } catch (error) {
    console.error(`❌ Error checking slot availability for ${date}:`, error);
    return {
      available: false,
      message: error.message,
    };
  }
};

/**
 * Pause session
 */
const pauseSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.isPaused) {
    throw new Error('Session is already paused');
  }

  if (session.status !== SESSION_STATUS.LIVE) {
    throw new Error('Can only pause live sessions');
  }

  session.isPaused = true;
  // Use IST time for doctor session operations
  session.pausedAt = getISTTime();
  session.status = SESSION_STATUS.PAUSED;
  await session.save();

  return session;
};

/**
 * Resume session
 */
const resumeSession = async (sessionId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.isPaused) {
    throw new Error('Session is not paused');
  }

  if (!session.pausedAt) {
    throw new Error('Invalid pause state');
  }

  // Calculate pause duration using IST time
  const pauseEndTime = getISTTime();
  const pauseDuration = Math.floor((pauseEndTime - new Date(session.pausedAt)) / (1000 * 60));

  // Add to pause history
  if (!session.pauseHistory) {
    session.pauseHistory = [];
  }
  session.pauseHistory.push({
    pausedAt: session.pausedAt,
    resumedAt: pauseEndTime,
    duration: pauseDuration,
  });

  // Update total paused duration
  session.pausedDuration = (session.pausedDuration || 0) + pauseDuration;

  // Resume session
  session.isPaused = false;
  session.pausedAt = null;
  session.status = SESSION_STATUS.LIVE;
  await session.save();

  return session;
};

/**
 * Call next patient (increment current token)
 * @param {String} sessionId - Session ID
 * @param {String} appointmentId - Optional: Specific appointment ID to call (if provided, calls that appointment instead of next in queue)
 */
const callNextPatient = async (sessionId, appointmentId = null) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.isPaused) {
    throw new Error('Cannot call next patient while session is paused');
  }

  let nextAppointment;

  // If specific appointmentId is provided, call that appointment
  if (appointmentId) {
    nextAppointment = await Appointment.findOne({
      _id: appointmentId,
      sessionId,
      status: { $in: ['scheduled', 'confirmed', 'waiting'] },
    });

    if (!nextAppointment) {
      throw new Error('Appointment not found or already called');
    }
  } else {
    // Otherwise, get next appointment in queue (tokenNumber > currentToken)
    nextAppointment = await Appointment.findOne({
      sessionId,
      tokenNumber: { $gt: session.currentToken || 0 },
      status: { $in: ['scheduled', 'confirmed', 'waiting'] },
    }).sort({ tokenNumber: 1 });

    if (!nextAppointment) {
      throw new Error('No more patients in queue');
    }
  }

  // Update session current token to this appointment's token number
  session.currentToken = nextAppointment.tokenNumber;
  
  // If session is scheduled, make it live
  if (session.status === SESSION_STATUS.SCHEDULED) {
    session.status = SESSION_STATUS.LIVE;
    if (!session.startedAt) {
      // Use IST time for doctor session operations
      session.startedAt = getISTTime();
    }
  }

  await session.save();

  // Update appointment status to 'called'
  nextAppointment.status = 'called';
  nextAppointment.queueStatus = 'called';
  
  // DO NOT reset recallCount when patient is called again
  // recallCount should persist across calls - it only increments when Recall is clicked
  // This ensures the 2-recall limit is enforced properly
  // The recallCount will only be reset if explicitly needed (e.g., new appointment cycle)
  
  await nextAppointment.save();

  return {
    session,
    appointment: nextAppointment,
  };
};

/**
 * Automatically end sessions that have passed their end time
 * This function checks all live sessions and ends them if current time >= session end time
 */
const autoEndExpiredSessions = async () => {
  try {
    const Session = require('../models/Session');
    const { SESSION_STATUS } = require('../utils/constants');
    const { recalculateSessionETAs } = require('./etaService');
    const { getIO } = require('../config/socket');
    const { createNotification } = require('./notificationService');
    const Appointment = require('../models/Appointment');
    
    // Use IST time for doctor session operations
    const now = getISTTime();
    const today = getISTDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all live sessions for today
    const liveSessions = await Session.find({
      status: SESSION_STATUS.LIVE,
      date: { $gte: today, $lt: tomorrow },
    }).populate('doctorId', 'firstName lastName');
    
    let endedCount = 0;
    
    for (const session of liveSessions) {
      // Convert session end time to minutes for comparison using the imported timeToMinutes function
      const sessionEndMinutes = timeToMinutes(session.sessionEndTime);
      // Use IST time for doctor session operations
      const currentMinutes = getISTTimeInMinutes();
      
      // Check if session end time has passed
      if (sessionEndMinutes !== null && currentMinutes >= sessionEndMinutes) {
        // Check if there are any pending appointments (waiting, called, in-consultation, etc.)
        // Only end session if all appointments are completed/cancelled/no-show
        const pendingAppointments = await Appointment.find({
          sessionId: session._id,
          status: { $in: ['scheduled', 'confirmed', 'waiting', 'called', 'in-consultation', 'in_progress'] },
        });
        
        // If there are pending appointments, don't auto-end session
        // Let doctor continue with existing patients
        if (pendingAppointments.length > 0) {
          
          
          // Recalculate ETAs for waiting patients (they can still be seen after session end time)
          try {
            const etas = await recalculateSessionETAs(session._id);
            const io = getIO();
            
            // Send ETA updates to all waiting patients
            for (const eta of etas) {
              if (eta.patientId) {
                io.to(`patient-${eta.patientId}`).emit('token:eta:update', {
                  appointmentId: eta.appointmentId,
                  estimatedWaitMinutes: eta.estimatedWaitMinutes,
                  estimatedCallTime: eta.estimatedCallTime,
                  patientsAhead: eta.patientsAhead,
                  tokenNumber: eta.tokenNumber,
                });
              }
            }
          } catch (error) {
            console.error(`Error recalculating ETAs for session ${session._id}:`, error);
          }
          
          // Don't end session - continue to next iteration
          continue;
        }
        
        // No pending appointments - safe to end session
        session.status = SESSION_STATUS.COMPLETED;
        // Use IST time for doctor session operations
        session.endedAt = getISTTime();
        await session.save();
        
        endedCount++;
        
        // Notify doctor that session has ended
        try {
          const io = getIO();
          
          // Notify doctor - REMOVED: Doctors don't need session ended notifications
          // Only patients receive these notifications
          // if (session.doctorId) {
          //   await createNotification({
          //     userId: session.doctorId._id || session.doctorId,
          //     userType: 'doctor',
          //     type: 'session',
          //     title: 'Session Ended',
          //     message: 'Your session has automatically ended as all patients have been seen.',
          //     data: {
          //       sessionId: session._id.toString(),
          //       eventType: 'completed',
          //       status: SESSION_STATUS.COMPLETED,
          //     },
          //     priority: 'medium',
          //     actionUrl: '/doctor/patients',
          //     icon: 'session',
          //   }).catch((error) => console.error('Error creating doctor notification:', error));
          // }
          
          // Emit to doctor (keep socket event for real-time updates)
          if (session.doctorId) {
            io.to(`doctor-${session.doctorId._id || session.doctorId}`).emit('session:updated', {
              session: await Session.findById(session._id),
            });
          }
          
          
        } catch (error) {
          console.error(`Error processing auto-end for session ${session._id}:`, error);
        }
      }
    }
    
    if (endedCount > 0) {
      
    }
    
    return endedCount;
  } catch (error) {
    console.error('Error in autoEndExpiredSessions:', error);
    return 0;
  }
};

module.exports = {
  getOrCreateSession,
  checkSlotAvailability,
  pauseSession,
  resumeSession,
  callNextPatient,
  getAvailabilityForDate,
  isDateBlocked,
  autoEndExpiredSessions,
};

