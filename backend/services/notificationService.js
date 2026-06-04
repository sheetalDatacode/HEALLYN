const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const {
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
} = require('./emailService');
const AdminSettings = require('../models/AdminSettings');

/**
 * Send email notification for any notification
 * @param {Object} params - Email notification parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userType - User type (patient, doctor, pharmacy, laboratory, admin)
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.user - User object with email (optional, will fetch if not provided)
 */
const sendNotificationEmail = async ({ userId, userType, title, message, user = null }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  
  try {
    let userEmail = null;
    let userName = 'User';
    
    // If user object is provided, use it
    if (user && user.email) {
      userEmail = user.email;
      userName = user.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'User';
    } else {
      // Otherwise, fetch user based on userType
      let UserModel;
      switch (userType) {
        case 'patient':
          UserModel = require('../models/Patient');
          break;
        case 'doctor':
          UserModel = require('../models/Doctor');
          break;
        case 'pharmacy':
          UserModel = require('../models/Pharmacy');
          break;
        case 'laboratory':
          UserModel = require('../models/Laboratory');
          break;
        case 'admin':
          UserModel = require('../models/Admin');
          break;
        default:
          return null;
      }
      
      const userData = await UserModel.findById(userId).select('email firstName lastName');
      if (!userData || !userData.email) return null;
      
      userEmail = userData.email;
      userName = userData.firstName 
        ? `${userData.firstName} ${userData.lastName || ''}`.trim()
        : 'User';
    }
    
    if (!userEmail) return null;
    
    // Send email with notification content
    return sendEmail({
      to: userEmail,
      subject: `${title} | Healiinn`,
      text: `Hello ${userName},\n\n${message}\n\nThank you,\nTeam Healiinn`,
      html: `<p>Hello ${userName},</p><p>${message}</p><p>Thank you,<br/>Team Healiinn</p>`,
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return null;
  }
};

/**
 * Create and send notification
 * @param {Object} params - Notification parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userType - User type (patient, doctor, pharmacy, laboratory, admin)
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.data - Additional data
 * @param {String} params.priority - Priority level (low, medium, high, urgent)
 * @param {String} params.actionUrl - URL to navigate on click
 * @param {String} params.icon - Icon name
 * @param {Boolean} params.emitSocket - Whether to emit Socket.IO event (default: true)
 * @param {Boolean} params.sendEmail - Whether to send email notification (default: true)
 * @param {Object} params.user - User object with email (optional, will fetch if not provided)
 */
const createNotification = async ({
  userId,
  userType,
  type,
  title,
  message,
  data = {},
  priority = 'medium',
  actionUrl = null,
  icon = null,
  emitSocket = true,
  sendEmail = true,
  user = null,
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      userType,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
      icon,
    });

    // Send email notification if enabled
    if (sendEmail) {
      sendNotificationEmail({ userId, userType, title, message, user })
        .catch((error) => console.error('Error sending notification email:', error));
    }

    // Emit Socket.IO event if enabled
    if (emitSocket) {
      try {
        const io = getIO();
        io.to(`${userType}-${userId}`).emit('notification:new', {
          notification: notification.toObject(),
        });
      } catch (error) {
        console.error('Socket.IO error in createNotification:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Helper function to format appointment date
 */
const formatAppointmentDate = (date) => {
  if (!date) return 'N/A';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Helper function to extract appointment date from appointment object
 */
const getAppointmentDate = (appointment) => {
  if (appointment.appointmentDate) {
    return appointment.appointmentDate;
  }
  if (appointment.sessionId && appointment.sessionId.date) {
    return appointment.sessionId.date;
  }
  return null;
};

/**
 * Create notification for appointment events
 */
const createAppointmentNotification = async ({ userId, userType, appointment, eventType, doctor, patient, sendEmail = true }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      if (userType === 'doctor') {
        // Only handle 'created' for doctors - include patient name and date
        const appointmentDate = getAppointmentDate(appointment);
        const formattedDate = formatAppointmentDate(appointmentDate);
        
        title = 'New Appointment Booking';
        if (patient) {
          const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
          message = `New appointment booked by ${patientName} for ${formattedDate}${appointment.tokenNumber ? ` (Token: ${appointment.tokenNumber})` : ''}`;
        } else {
          message = `New appointment booked for ${formattedDate}`;
        }
        actionUrl = '/doctor/patients';
      } else {
        title = 'New Appointment';
        message = patient
          ? `Appointment booked with ${patient.firstName} ${patient.lastName || ''}`
          : 'New appointment has been booked';
        actionUrl = '/patient/appointments';
      }
      break;
    case 'cancelled':
      // Doctors don't receive cancelled notifications (only patients)
      if (userType === 'doctor') {
        return null; // Skip notification for doctors
      }
      title = 'Appointment Cancelled';
      message = doctor
        ? `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been cancelled`
        : 'Appointment has been cancelled';
      actionUrl = '/patient/appointments';
      break;
    case 'rescheduled':
      if (userType === 'doctor') {
        // Only handle 'rescheduled' for doctors - include patient name and both old/new dates
        const appointmentDate = getAppointmentDate(appointment);
        const formattedNewDate = formatAppointmentDate(appointmentDate);
        
        title = 'Appointment Rescheduled';
        if (patient) {
          const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
          
          // Try to extract old date from rescheduleReason if available
          let formattedOldDate = null;
          if (appointment.rescheduleReason) {
            // rescheduleReason format: "Rescheduled from [oldDate] to [newDate]" or "Appointment rebooked after cancellation. New date: [newDate]"
            const reasonMatch = appointment.rescheduleReason.match(/Rescheduled from (.+?) to/);
            if (reasonMatch && reasonMatch[1]) {
              try {
                // Parse the old date from the reschedule reason
                const oldDateStr = reasonMatch[1].trim();
                const oldDateObj = new Date(oldDateStr);
                if (!isNaN(oldDateObj.getTime())) {
                  formattedOldDate = formatAppointmentDate(oldDateObj);
                }
              } catch (error) {
                // If parsing fails, ignore and just show new date
                console.error('Error parsing old date from rescheduleReason:', error);
              }
            }
          }
          
          if (formattedOldDate) {
            message = `Appointment rescheduled by ${patientName} from ${formattedOldDate} to ${formattedNewDate}`;
          } else {
            message = `Appointment rescheduled by ${patientName} for ${formattedNewDate}`;
          }
        } else {
          message = `Appointment rescheduled for ${formattedNewDate}`;
        }
        actionUrl = '/doctor/patients';
      } else {
        title = 'Appointment Rescheduled';
        message = doctor
          ? `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been rescheduled`
          : 'Appointment has been rescheduled';
        actionUrl = '/patient/appointments';
      }
      break;
    case 'payment_confirmed':
      // Doctors don't receive payment_confirmed notifications (only patients)
      if (userType === 'doctor') {
        return null; // Skip notification for doctors
      }
      title = 'Payment Confirmed';
      message = `Payment of ₹${appointment.fee || 0} confirmed for your appointment`;
      actionUrl = '/patient/appointments';
      break;
    case 'token_called':
      // Doctors don't receive token_called notifications (only patients)
      if (userType === 'doctor') {
        return null; // Skip notification for doctors
      }
      title = 'Your Turn';
      message = `Token ${appointment.tokenNumber} has been called. Please proceed to consultation room.`;
      actionUrl = '/patient/appointments';
      break;
    case 'token_recalled':
      // Doctors don't receive token_recalled notifications (only patients)
      if (userType === 'doctor') {
        return null; // Skip notification for doctors
      }
      title = 'Token Recalled';
      message = `Your token ${appointment.tokenNumber} has been recalled. Please wait for your turn.`;
      actionUrl = '/patient/appointments';
      break;
    case 'completed':
      // Doctors don't receive completed notifications (only patients)
      if (userType === 'doctor') {
        return null; // Skip notification for doctors
      }
      title = 'Consultation Completed';
      message = doctor
        ? `Your consultation with Dr. ${doctor.firstName} ${doctor.lastName || ''} has been completed`
        : 'Consultation has been completed';
      actionUrl = '/patient/appointments';
      break;
    default:
      // Doctors don't receive default appointment update notifications
      if (userType === 'doctor') {
        return null; // Skip notification for doctors
      }
      title = 'Appointment Update';
      message = 'Your appointment has been updated';
      actionUrl = '/patient/appointments';
  }

  // Get user data for email
  let user = null;
  if (sendEmail) {
    if (userType === 'patient') {
      if (patient) {
        user = patient;
      } else {
        try {
          const Patient = require('../models/Patient');
          user = await Patient.findById(userId).select('email firstName lastName');
        } catch (error) {
          console.error('Error fetching patient for email:', error);
        }
      }
    } else if (userType === 'doctor') {
      if (doctor) {
        user = doctor;
      } else {
        try {
          const Doctor = require('../models/Doctor');
          user = await Doctor.findById(userId).select('email firstName lastName');
        } catch (error) {
          console.error('Error fetching doctor for email:', error);
        }
      }
    }
  }

  // Include appointment date in data for doctor notifications
  const appointmentDate = getAppointmentDate(appointment);
  const notificationData = {
    appointmentId: appointment._id || appointment.id,
    eventType,
    tokenNumber: appointment.tokenNumber,
  };
  
  // Add date information for doctor notifications
  if (userType === 'doctor' && (eventType === 'created' || eventType === 'rescheduled')) {
    notificationData.appointmentDate = appointmentDate;
    notificationData.formattedDate = formatAppointmentDate(appointmentDate);
    if (eventType === 'rescheduled' && appointment.rescheduleReason) {
      notificationData.rescheduleReason = appointment.rescheduleReason;
      // Try to extract old date from rescheduleReason for better display
      const reasonMatch = appointment.rescheduleReason.match(/Rescheduled from (.+?) to/);
      if (reasonMatch && reasonMatch[1]) {
        try {
          const oldDateObj = new Date(reasonMatch[1].trim());
          if (!isNaN(oldDateObj.getTime())) {
            notificationData.oldAppointmentDate = oldDateObj;
            notificationData.formattedOldDate = formatAppointmentDate(oldDateObj);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
  }

  return createNotification({
    userId,
    userType,
    type: 'appointment',
    title,
    message,
    data: notificationData,
    priority: eventType === 'token_called' ? 'urgent' : 'medium',
    actionUrl,
    icon: 'appointment',
    sendEmail,
    user,
  });
};

/**
 * Create notification for prescription events
 */
const createPrescriptionNotification = async ({ userId, userType, prescription, doctor, patient }) => {
  const title = 'New Prescription';
  const doctorName = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';
  const message = userType === 'patient'
    ? `Prescription received from ${doctorName}`
    : `Prescription created for ${patient.firstName} ${patient.lastName || ''}`;
  
  // Get patient data for email if userType is patient
  let user = null;
  if (userType === 'patient' && patient) {
    user = patient;
  }
  
  return createNotification({
    userId,
    userType,
    type: 'prescription',
    title,
    message,
    data: {
      prescriptionId: prescription._id || prescription.id,
      consultationId: prescription.consultationId,
      doctorName,
    },
    priority: 'high',
    actionUrl: userType === 'patient' ? '/patient/prescriptions' : '/doctor/consultations',
    icon: 'prescription',
    sendEmail: userType === 'patient', // Send email to patients
    user,
  });
};

/**
 * Create notification for wallet events
 */
const createWalletNotification = async ({ userId, userType, amount, eventType, withdrawal = null, sendEmail = false }) => {
  let title, message, priority, actionUrl;

  switch (eventType) {
    case 'credited':
      title = 'Wallet Credited';
      message = `₹${amount} has been credited to your wallet`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'payment_received':
      title = 'Payment Received';
      message = `₹${amount} has been credited to your wallet from patient payment`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_requested':
      title = 'Withdrawal Requested';
      message = `Withdrawal request of ₹${amount} has been submitted`;
      priority = 'medium';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_approved':
      title = 'Withdrawal Approved';
      const adminNameApproved = withdrawal?.adminName || 'Admin';
      const withdrawalIdApproved = withdrawal?._id || withdrawal?.id || 'N/A';
      let approvedMessage = `Your withdrawal request of ₹${amount} has been approved by ${adminNameApproved}`;
      if (withdrawal?.adminNote) {
        approvedMessage += `. Admin Note: ${withdrawal.adminNote}`;
      }
      approvedMessage += `. Withdrawal ID: ${withdrawalIdApproved}`;
      message = approvedMessage;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_paid':
      title = 'Payment Processed';
      const adminNamePaid = withdrawal?.adminName || 'Admin';
      const withdrawalIdPaid = withdrawal?._id || withdrawal?.id || 'N/A';
      const payoutMethod = withdrawal?.payoutMethod?.type || withdrawal?.payoutMethod || 'N/A';
      let paidMessage = `Your withdrawal request of ₹${amount} has been processed and payment has been sent by ${adminNamePaid}`;
      if (withdrawal?.payoutReference) {
        paidMessage += `. Payout Reference: ${withdrawal.payoutReference}`;
      }
      paidMessage += `. Payment Method: ${payoutMethod}`;
      paidMessage += `. Withdrawal ID: ${withdrawalIdPaid}`;
      message = paidMessage;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    case 'withdrawal_rejected':
      title = 'Withdrawal Rejected';
      const adminNameRejected = withdrawal?.adminName || 'admin';
      message = `Your withdrawal request of ₹${amount} has been rejected by ${adminNameRejected}${withdrawal?.rejectionReason ? `. Reason: ${withdrawal.rejectionReason}` : ''}`;
      priority = 'high';
      actionUrl = userType === 'doctor' ? '/doctor/wallet' : userType === 'pharmacy' ? '/pharmacy/wallet' : userType === 'laboratory' ? '/laboratory/wallet' : '/doctor/wallet';
      break;
    default:
      title = 'Wallet Update';
      message = 'Your wallet has been updated';
      priority = 'medium';
      actionUrl = '/doctor/wallet';
  }

  // Build comprehensive data object for withdrawal notifications
  const walletNotificationData = {
    amount,
    eventType,
    withdrawalId: withdrawal?._id || withdrawal?.id,
  };
  
  // Add additional details for withdrawal events
  if (withdrawal) {
    if (withdrawal.payoutReference) {
      walletNotificationData.payoutReference = withdrawal.payoutReference;
    }
    if (withdrawal.rejectionReason) {
      walletNotificationData.rejectionReason = withdrawal.rejectionReason;
    }
    if (withdrawal.adminName) {
      walletNotificationData.adminName = withdrawal.adminName;
    }
    if (withdrawal.adminNote) {
      walletNotificationData.adminNote = withdrawal.adminNote;
    }
    if (withdrawal.payoutMethod) {
      walletNotificationData.payoutMethod = withdrawal.payoutMethod;
    }
    if (eventType === 'withdrawal_paid' && withdrawal.processedAt) {
      walletNotificationData.processedAt = withdrawal.processedAt;
    }
  }

  return createNotification({
    userId,
    userType,
    type: 'wallet',
    title,
    message,
    data: walletNotificationData,
    priority,
    actionUrl,
    icon: 'wallet',
    sendEmail, // Only send email if explicitly requested (for withdrawal approved/paid)
  });
};

/**
 * Create notification for order events
 */
const createOrderNotification = async ({ userId, userType, order, eventType, pharmacy, laboratory, patient, status }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Order';
      message = patient
        ? `New order from ${patient.firstName} ${patient.lastName || ''}`
        : 'Your order has been placed';
      actionUrl = userType === 'patient' ? '/patient/orders' : userType === 'pharmacy' ? '/pharmacy/orders' : '/laboratory/orders';
      break;
    case 'confirmed':
      title = 'Order Confirmed';
      message = pharmacy
        ? 'Your order has been confirmed by Pharmacy'
        : laboratory
        ? 'Your order has been confirmed by Lab'
        : 'Order has been confirmed';
      actionUrl = '/patient/orders';
      break;
    case 'status_updated':
      // Handle new lab visit flow statuses and pharmacy order statuses
      const statusMessages = {
        // Lab visit flow statuses
        visit_time: 'You can now visit the lab',
        sample_collected: 'Your sample has been collected by Lab',
        being_tested: 'Your test is being processed by Lab',
        reports_being_generated: 'Your reports are being generated by Lab',
        test_successful: 'Your test has been completed successfully by Lab',
        reports_updated: 'Your test reports are ready from Lab',
        // Pharmacy order flow statuses
        prescription_received: 'Your prescription has been received by Pharmacy',
        medicine_collected: 'Medicines are being collected by Pharmacy',
        packed: 'Your order has been packed by Pharmacy',
        ready_to_be_picked: 'Your order is ready to be picked',
        picked_up: 'Your order has been picked up',
        delivered: 'Your order has been delivered',
      };
      title = status === 'reports_updated' ? 'Reports Ready' : 'Order Status Updated';
      message = statusMessages[status] || (pharmacy
        ? 'Your order status has been updated by Pharmacy'
        : laboratory
        ? 'Order status updated by Lab'
        : 'Your order status has been updated');
      actionUrl = '/patient/orders';
      break;
    case 'completed':
      title = 'Order Completed';
      message = pharmacy
        ? 'Your order has been completed by Pharmacy'
        : laboratory
        ? 'Your test report is ready from Lab'
        : 'Order has been completed';
      actionUrl = '/patient/orders';
      break;
    case 'cancelled':
      title = 'Order Cancelled';
      message = 'Your order has been cancelled';
      actionUrl = '/patient/orders';
      break;
    default:
      title = 'Order Update';
      message = 'Your order has been updated';
      actionUrl = '/patient/orders';
  }

  return createNotification({
    userId,
    userType,
    type: 'order',
    title,
    message,
    data: {
      orderId: order._id || order.id,
      eventType,
    },
    priority: eventType === 'completed' ? 'high' : 'medium',
    actionUrl,
    icon: 'order',
  });
};

/**
 * Create notification for request events
 */
const createRequestNotification = async ({ userId, userType, request, eventType, admin, pharmacy, laboratory, patient }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'created':
      title = 'New Request';
      message = 'New request has been submitted';
      actionUrl = userType === 'patient' ? '/patient/requests' : '/admin/requests';
      break;
    case 'responded':
      title = 'Request Response';
      message = admin
        ? 'Admin has responded to your request'
        : 'Request has been responded';
      actionUrl = '/patient/requests';
      break;
    case 'assigned':
      if (userType === 'pharmacy') {
        // Pharmacy notification when admin assigns request
        const patientName = patient?.firstName && patient?.lastName
          ? `${patient.firstName} ${patient.lastName}`
          : patient?.firstName || request?.patientId?.firstName || 'Patient';
        const requestAmount = request?.adminResponse?.totalAmount || request?.totalAmount || 0;
        title = 'New Order Request';
        message = `New order request from ${patientName}${requestAmount > 0 ? ` (₹${requestAmount})` : ''}. Please check your request orders.`;
        actionUrl = '/pharmacy/request-orders';
      } else if (userType === 'laboratory') {
        title = 'Request Assigned';
        message = 'Request has been assigned';
        actionUrl = '/laboratory/orders';
      } else {
        title = 'Request Assigned';
        message = 'Request has been assigned';
        actionUrl = '/pharmacy/orders';
      }
      break;
    case 'payment_received':
      if (userType === 'pharmacy') {
        // Pharmacy notification when patient payment is confirmed
        const patientName = patient?.firstName && patient?.lastName
          ? `${patient.firstName} ${patient.lastName}`
          : patient?.firstName || request?.patientId?.firstName || request?.patientId?.name || 'Patient';
        const requestAmount = request?.adminResponse?.totalAmount || request?.totalAmount || 0;
        const requestId = request?._id || request?.id || 'N/A';
        title = 'Payment Received - New Order';
        message = `Payment of ₹${requestAmount} received from ${patientName} for order request (Request ID: ${requestId}). Please check your request orders.`;
        actionUrl = '/pharmacy/request-orders';
      } else if (userType === 'laboratory') {
        // Laboratory notification when patient payment is confirmed
        const patientName = patient?.firstName && patient?.lastName
          ? `${patient.firstName} ${patient.lastName}`
          : patient?.firstName || request?.patientId?.firstName || request?.patientId?.name || 'Patient';
        const requestAmount = request?.adminResponse?.totalAmount || request?.totalAmount || 0;
        const requestId = request?._id || request?.id || 'N/A';
        title = 'Payment Received - New Test Booking';
        message = `Payment of ₹${requestAmount} received from ${patientName} for test booking request (Request ID: ${requestId}). Please check your request orders.`;
        actionUrl = '/laboratory/request-orders';
      } else {
        title = 'Payment Received';
        message = 'Payment has been received for your request';
        actionUrl = '/patient/requests';
      }
      break;
    case 'confirmed':
      title = 'Request Confirmed';
      message = 'Your request has been confirmed';
      actionUrl = '/patient/requests';
      break;
    default:
      title = 'Request Update';
      message = 'Your request has been updated';
      actionUrl = '/patient/requests';
  }

  // Get patient data for email if not provided and userType is patient
  let user = null;
  if (userType === 'patient' && patient) {
    user = patient;
  } else if (userType === 'patient' && request?.patientId) {
    try {
      const Patient = require('../models/Patient');
      const patientData = await Patient.findById(request.patientId).select('email firstName lastName');
      if (patientData) user = patientData;
    } catch (error) {
      console.error('Error fetching patient for email:', error);
    }
  }

  return createNotification({
    userId,
    userType,
    type: 'request',
    title,
    message,
    data: {
      requestId: request._id || request.id,
      eventType,
      patientId: patient?._id || request?.patientId?._id || request?.patientId,
      amount: request?.adminResponse?.totalAmount || request?.totalAmount || 0,
    },
    priority: 'high',
    actionUrl,
    icon: 'request',
    sendEmail: userType === 'patient', // Send email for patient notifications
    user,
  });
};

/**
 * Create notification for report events
 */
const createReportNotification = async ({ userId, userType, report, laboratory, patient }) => {
  const title = 'Test Report Ready';
  const message = userType === 'patient'
    ? 'Test report is ready from Lab'
    : `Test report created for ${patient.firstName} ${patient.lastName || ''}`;
  
  return createNotification({
    userId,
    userType,
    type: 'report',
    title,
    message,
    data: {
      reportId: report._id || report.id,
      orderId: report.orderId,
    },
    priority: 'high',
    actionUrl: userType === 'patient' ? '/patient/reports' : '/laboratory/patients',
    icon: 'report',
  });
};

/**
 * Create notification for admin events
 */
const createAdminNotification = async ({ userId, userType, eventType, data, actionUrl: customActionUrl }) => {
  let title, message, actionUrl, priority = 'medium';

  switch (eventType) {
    case 'payment_received':
      title = 'Payment Received';
      message = `Payment of ₹${data.amount || 0} received from patient`;
      actionUrl = customActionUrl || '/admin/wallet';
      priority = 'high';
      break;
    case 'withdrawal_requested':
      // Enhanced message with provider details
      const providerName = data.providerName || 'Provider';
      const providerType = data.providerType || 'provider';
      const providerTypeLabel = providerType === 'doctor' ? 'Doctor' : providerType === 'pharmacy' ? 'Pharmacy' : providerType === 'laboratory' ? 'Laboratory' : 'Provider';
      const payoutMethodType = data.payoutMethod?.type || data.payoutMethod || 'N/A';
      title = 'Withdrawal Request';
      message = `New withdrawal request of ₹${data.amount || 0} from ${providerTypeLabel} ${providerName} via ${payoutMethodType}`;
      actionUrl = customActionUrl || '/admin/wallet';
      priority = 'high';
      break;
    case 'request_created':
      // Enhanced message with patient and request details
      const patientName = data.patientName || 'Patient';
      const requestTypeLabel = data.requestTypeLabel || data.requestType || 'Request';
      title = 'New Patient Request';
      message = `New ${requestTypeLabel} request from ${patientName}${data.patientPhone ? ` (${data.patientPhone})` : ''}`;
      actionUrl = customActionUrl || '/admin/requests';
      priority = 'medium';
      break;
    case 'request_confirmed':
      title = 'Request Confirmed';
      message = 'Patient request has been confirmed';
      actionUrl = customActionUrl || '/admin/requests';
      break;
    default:
      title = 'System Update';
      message = 'System update received';
      actionUrl = customActionUrl || '/admin/dashboard';
  }

  return createNotification({
    userId,
    userType,
    type: eventType === 'payment_received' || eventType === 'withdrawal_requested' ? 'wallet' : 'request',
    title,
    message,
    data,
    priority,
    actionUrl,
    icon: 'system',
  });
};

/**
 * Create notification for session/queue events
 */
const createSessionNotification = async ({ userId, userType, session, eventType }) => {
  let title, message, actionUrl;

  switch (eventType) {
    case 'started':
      title = 'Session Started';
      message = 'Your session has started';
      actionUrl = '/doctor/patients';
      break;
    case 'paused':
      title = 'Session Paused';
      message = 'Your session has been paused';
      actionUrl = '/doctor/patients';
      break;
    case 'resumed':
      title = 'Session Resumed';
      message = 'Your session has been resumed';
      actionUrl = '/doctor/patients';
      break;
    case 'cancelled':
      title = 'Session Cancelled';
      message = 'Your session has been cancelled';
      actionUrl = '/doctor/patients';
      break;
    case 'queue_updated':
      title = 'Queue Updated';
      message = 'Patient queue has been updated';
      actionUrl = '/doctor/patients';
      break;
    default:
      title = 'Session Update';
      message = 'Your session has been updated';
      actionUrl = '/doctor/patients';
  }

  return createNotification({
    userId,
    userType,
    type: 'session',
    title,
    message,
    data: {
      sessionId: session._id || session.id,
      eventType,
    },
    priority: 'medium',
    actionUrl,
    icon: 'session',
  });
};

/**
 * Check if email notifications are enabled globally
 */
const isEmailNotificationsEnabled = async () => {
  try {
    const settings = await AdminSettings.findOne();
    return settings?.emailNotifications !== false; // Default to true if not set
  } catch (error) {
    console.error('Error checking email notification settings:', error);
    return true; // Default to enabled on error
  }
};

/**
 * Send appointment confirmation email to patient
 */
const sendAppointmentConfirmationEmail = async ({ patient, doctor, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const appointmentDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const appointmentTime = appointment.time || '';

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  return sendEmail({
    to: patient.email,
    subject: `Appointment Confirmed - ${doctorName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour appointment has been confirmed:\n\nDoctor: ${doctorName}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your appointment has been confirmed:</p><ul><li><strong>Doctor:</strong> ${doctorName}</li><li><strong>Date:</strong> ${appointmentDate}</li><li><strong>Time:</strong> ${appointmentTime}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send appointment notification to doctor
 */
const sendDoctorAppointmentNotification = async ({ doctor, patient, appointment, eventType = 'created' }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!doctor?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  
  const appointmentDate = appointment.appointmentDate || appointment.sessionId?.date;
  const formattedDate = appointmentDate
    ? new Date(appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Handle reschedule emails with old and new dates
  if (eventType === 'rescheduled' && appointment.rescheduleReason) {
    let oldDateText = '';
    const reasonMatch = appointment.rescheduleReason.match(/Rescheduled from (.+?) to/);
    if (reasonMatch && reasonMatch[1]) {
      try {
        const oldDateObj = new Date(reasonMatch[1].trim());
        if (!isNaN(oldDateObj.getTime())) {
          oldDateText = oldDateObj.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    if (oldDateText) {
      return sendEmail({
        to: doctor.email,
        subject: `Appointment Rescheduled - ${patientName} | Healiinn`,
        text: `Hello Dr. ${doctor.firstName || 'Doctor'},\n\nAn appointment has been rescheduled:\n\nPatient: ${patientName}\nPrevious Date: ${oldDateText}\nNew Date: ${formattedDate}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
        html: `<p>Hello Dr. ${doctor.firstName || 'Doctor'},</p><p>An appointment has been rescheduled:</p><ul><li><strong>Patient:</strong> ${patientName}</li><li><strong>Previous Date:</strong> ${oldDateText}</li><li><strong>New Date:</strong> ${formattedDate}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
      });
    }
  }

  // Default: new appointment email
  return sendEmail({
    to: doctor.email,
    subject: `New Appointment - ${patientName} | Healiinn`,
    text: `Hello Dr. ${doctor.firstName || 'Doctor'},\n\nYou have a new appointment:\n\nPatient: ${patientName}\nDate: ${formattedDate}\nToken Number: ${appointment.tokenNumber || 'N/A'}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello Dr. ${doctor.firstName || 'Doctor'},</p><p>You have a new appointment:</p><ul><li><strong>Patient:</strong> ${patientName}</li><li><strong>Date:</strong> ${formattedDate}</li><li><strong>Token Number:</strong> ${appointment.tokenNumber || 'N/A'}</li></ul><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send appointment cancellation email
 */
const sendAppointmentCancellationEmail = async ({ patient, doctor, appointment }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : 'Doctor';

  const reason = appointment.cancellationReason || 'Session cancelled by doctor';
  const rescheduleMessage = reason.includes('Session cancelled') 
    ? 'The session for this date has been cancelled. You can reschedule your appointment for a different date from the app.'
    : 'You can reschedule your appointment from the app.';

  return sendEmail({
    to: patient.email,
    subject: `Appointment Cancelled - ${doctorName} | Healiinn`,
    text: `Hello ${patientName},\n\nYour appointment with ${doctorName} has been cancelled.\n\nReason: ${reason}\n\n${rescheduleMessage}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your appointment with <strong>${doctorName}</strong> has been cancelled.</p><p><strong>Reason:</strong> ${reason}</p><p>${rescheduleMessage}</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send lab report ready email
 */
const sendLabReportReadyEmail = async ({ patient, laboratory, report, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: patient.email,
    subject: `Test Report Ready | Healiinn`,
    text: `Hello ${patientName},\n\nYour test report is ready from Lab. You can view and download it from the app.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your test report is ready from <strong>Lab</strong>. You can view and download it from the app.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdateEmail = async ({ patient, pharmacy, laboratory, order, status }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  const statusMessages = {
    confirmed: 'has been confirmed',
    processing: 'is being processed',
    ready: 'is ready for pickup/delivery',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
    // Lab visit flow statuses
    visit_time: 'you can now visit the lab',
    sample_collected: 'sample has been collected',
    being_tested: 'is being tested',
    reports_being_generated: 'reports are being generated',
    test_successful: 'test has been completed successfully',
    reports_updated: 'reports are ready',
    // Pharmacy order flow statuses
    prescription_received: 'prescription has been received',
    medicine_collected: 'medicines are being collected',
    packed: 'order has been packed',
    ready_to_be_picked: 'order is ready to be picked',
    picked_up: 'order has been picked up',
    delivered: 'order has been delivered',
  };

  const message = statusMessages[status] || 'has been updated';

  // For pharmacy orders, don't include "by Pharmacy" in the message (generic message)
  // For lab orders, include "by Lab" in the message
  const providerText = pharmacy ? '' : laboratory ? ' by Lab' : '';
  const emailText = `Hello ${patientName},\n\nYour order ${message}${providerText}.\n\nOrder ID: ${order._id || order.id}\nStatus: ${status}\n\nThank you,\nTeam Healiinn`;
  
  const providerHtml = pharmacy ? '' : laboratory ? ' by <strong>Lab</strong>' : '';
  const emailHtml = `<p>Hello ${patientName},</p><p>Your order ${message}${providerHtml}.</p><ul><li><strong>Order ID:</strong> ${order._id || order.id}</li><li><strong>Status:</strong> ${status}</li></ul><p>Thank you,<br/>Team Healiinn</p>`;

  return sendEmail({
    to: patient.email,
    subject: `Order Update | Healiinn`,
    text: emailText,
    html: emailHtml,
  });
};

/**
 * Send payment confirmation email
 * Accepts either:
 * - { patient, amount, orderId, appointmentId } (direct values)
 * - { patient, transaction, order } (objects to extract from)
 */
const sendPaymentConfirmationEmail = async ({ patient, amount, orderId, appointmentId, transaction, order }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!patient?.email) return null;

  // Extract values from transaction/order objects if provided
  let paymentAmount = amount;
  let referenceId = orderId || appointmentId || 'N/A';
  
  if (transaction) {
    // Extract amount from transaction
    if (!paymentAmount && transaction.amount) {
      paymentAmount = transaction.amount;
    }
    // Extract reference ID from transaction
    if (transaction.referenceId) {
      referenceId = transaction.referenceId;
    } else if (transaction._id) {
      referenceId = transaction._id.toString();
    } else if (transaction.id) {
      referenceId = transaction.id.toString();
    }
    // Extract appointmentId from transaction if available
    if (!appointmentId && transaction.appointmentId) {
      appointmentId = transaction.appointmentId;
      if (typeof appointmentId === 'object' && appointmentId._id) {
        referenceId = appointmentId._id.toString();
      } else if (typeof appointmentId === 'string') {
        referenceId = appointmentId;
      }
    }
  }
  
  if (order) {
    // Extract order ID from order object
    if (order._id) {
      referenceId = order._id.toString();
    } else if (order.id) {
      referenceId = order.id.toString();
    }
  }
  
  // Fallback: if still no amount, try to get from transaction metadata
  if (!paymentAmount && transaction?.metadata?.totalAmount) {
    paymentAmount = transaction.metadata.totalAmount;
  }
  
  // Ensure amount is a number and format it
  if (paymentAmount === undefined || paymentAmount === null) {
    console.error('Payment amount is undefined in sendPaymentConfirmationEmail:', {
      amount,
      transaction: transaction ? {
        amount: transaction.amount,
        metadata: transaction.metadata,
      } : null,
    });
    paymentAmount = 0; // Fallback to 0 if still undefined
  }
  
  // Format reference ID
  if (referenceId === 'N/A' && appointmentId) {
    if (typeof appointmentId === 'object' && appointmentId._id) {
      referenceId = appointmentId._id.toString();
    } else if (typeof appointmentId === 'string') {
      referenceId = appointmentId;
    }
  }

  const patientName = patient.firstName
    ? `${patient.firstName} ${patient.lastName || ''}`.trim()
    : 'Patient';

  return sendEmail({
    to: patient.email,
    subject: `Payment Confirmed - ₹${paymentAmount} | Healiinn`,
    text: `Hello ${patientName},\n\nYour payment of ₹${paymentAmount} has been confirmed.\n\nReference ID: ${referenceId}\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${patientName},</p><p>Your payment of <strong>₹${paymentAmount}</strong> has been confirmed.</p><p><strong>Reference ID:</strong> ${referenceId}</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send support ticket notification email to user
 */
const sendSupportTicketNotification = async ({ user, ticket, userType, isResponse = false }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  
  let userEmail = '';
  let userName = '';
  
  // Extract email and name based on user type
  if (userType === 'patient') {
    userEmail = user?.email || '';
    userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Patient';
  } else if (userType === 'doctor') {
    userEmail = user?.email || '';
    userName = user?.firstName && user?.lastName
      ? `Dr. ${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Doctor';
  } else if (userType === 'pharmacy') {
    userEmail = user?.email || '';
    userName = user?.pharmacyName || user?.ownerName || user?.email || 'Pharmacy';
  } else if (userType === 'laboratory') {
    userEmail = user?.email || '';
    userName = user?.labName || user?.ownerName || user?.email || 'Laboratory';
  }
  
  if (!userEmail) return null;
  
  const ticketSubject = ticket.subject || 'Support Request';
  const ticketMessage = ticket.message || '';
  const adminNote = ticket.adminNote || '';
  const latestResponse = ticket.responses && ticket.responses.length > 0 
    ? ticket.responses[ticket.responses.length - 1] 
    : null;
  
  if (isResponse && latestResponse) {
    // Admin responded to ticket
    const ticketId = ticket._id || ticket.id;
    
    // Short format for pharmacy and laboratory
    if (userType === 'pharmacy' || userType === 'laboratory') {
      const responsePreview = latestResponse.message.length > 100 
        ? `${latestResponse.message.substring(0, 100)}...` 
        : latestResponse.message;
      
      const shortText = `Hello ${userName},\n\nAdmin responded to your ticket: "${ticketSubject}"\n\nResponse: ${responsePreview}${adminNote ? `\n\nNote: ${adminNote}` : ''}\n\nTicket ID: ${ticketId}\n\nThank you,\nTeam Healiinn`;
      
      const shortHtml = `<p>Hello ${userName},</p><p>Admin responded to your ticket: "<strong>${ticketSubject}</strong>"</p><p><strong>Response:</strong> ${responsePreview}</p>${adminNote ? `<p><strong>Note:</strong> ${adminNote}</p>` : ''}<p><strong>Ticket ID:</strong> ${ticketId}</p><p>Thank you,<br/>Team Healiinn</p>`;
      
      return sendEmail({
        to: userEmail,
        subject: `Support Response - ${ticketSubject} | Healiinn`,
        text: shortText,
        html: shortHtml,
      });
    }
    
    // Full format for patient and doctor
    const responseText = adminNote 
      ? `Admin Response:\n${latestResponse.message}\n\nAdmin Note:\n${adminNote}`
      : `Admin Response:\n${latestResponse.message}`;
    const responseHtml = adminNote
      ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Response:</strong></p><p>${latestResponse.message}</p></div><div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Note:</strong></p><p>${adminNote}</p></div>`
      : `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Response:</strong></p><p>${latestResponse.message}</p></div>`;
    
    return sendEmail({
      to: userEmail,
      subject: `Response to Your Support Ticket - ${ticketSubject} | Healiinn`,
      text: `Hello ${userName},\n\nAdmin has responded to your support ticket:\n\nSubject: ${ticketSubject}\n\n${responseText}\n\nYou can view the full conversation in the app.\n\nThank you,\nTeam Healiinn`,
      html: `<p>Hello ${userName},</p><p>Admin has responded to your support ticket:</p><p><strong>Subject:</strong> ${ticketSubject}</p>${responseHtml}<p>You can view the full conversation in the app.</p><p>Thank you,<br/>Team Healiinn</p>`,
    });
  } else {
    // Status update or ticket created confirmation
    const statusLabel = ticket.status === 'resolved' ? 'Resolved' 
      : ticket.status === 'closed' ? 'Closed'
      : ticket.status === 'in_progress' ? 'In Progress'
      : 'Open';
    
    const noteText = adminNote ? `\n\nAdmin Note:\n${adminNote}` : '';
    const noteHtml = adminNote 
      ? `<div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;"><p><strong>Admin Note:</strong></p><p>${adminNote}</p></div>`
      : '';
    
    if (adminNote) {
      // Status update with admin note
      const ticketId = ticket._id || ticket.id;
      
      // Short format for pharmacy and laboratory
      if (userType === 'pharmacy' || userType === 'laboratory') {
        const shortText = `Hello ${userName},\n\nTicket "${ticketSubject}" status: ${statusLabel}${adminNote ? `\n\nNote: ${adminNote}` : ''}\n\nTicket ID: ${ticketId}\n\nThank you,\nTeam Healiinn`;
        const shortHtml = `<p>Hello ${userName},</p><p>Ticket "<strong>${ticketSubject}</strong>" status: <strong>${statusLabel}</strong>${adminNote ? `</p><p><strong>Note:</strong> ${adminNote}` : ''}</p><p><strong>Ticket ID:</strong> ${ticketId}</p><p>Thank you,<br/>Team Healiinn</p>`;
        
        return sendEmail({
          to: userEmail,
          subject: `Support Ticket ${statusLabel} - ${ticketSubject} | Healiinn`,
          text: shortText,
          html: shortHtml,
        });
      }
      
      // Full format for patient and doctor
      return sendEmail({
        to: userEmail,
        subject: `Support Ticket ${statusLabel} - ${ticketSubject} | Healiinn`,
        text: `Hello ${userName},\n\nYour support ticket status has been updated:\n\nSubject: ${ticketSubject}\nStatus: ${statusLabel}${noteText}\n\nTicket ID: ${ticket._id || ticket.id}\n\nThank you,\nTeam Healiinn`,
        html: `<p>Hello ${userName},</p><p>Your support ticket status has been updated:</p><ul><li><strong>Subject:</strong> ${ticketSubject}</li><li><strong>Status:</strong> ${statusLabel}</li><li><strong>Ticket ID:</strong> ${ticket._id || ticket.id}</li></ul>${noteHtml}<p>Thank you,<br/>Team Healiinn</p>`,
      });
    } else {
      // Ticket created confirmation
      return sendEmail({
        to: userEmail,
        subject: `Support Ticket Created - ${ticketSubject} | Healiinn`,
        text: `Hello ${userName},\n\nYour support ticket has been created successfully:\n\nSubject: ${ticketSubject}\nMessage: ${ticketMessage}\n\nTicket ID: ${ticket._id || ticket.id}\nStatus: ${ticket.status || 'Open'}\n\nWe'll get back to you soon.\n\nThank you,\nTeam Healiinn`,
        html: `<p>Hello ${userName},</p><p>Your support ticket has been created successfully:</p><ul><li><strong>Subject:</strong> ${ticketSubject}</li><li><strong>Message:</strong> ${ticketMessage}</li><li><strong>Ticket ID:</strong> ${ticket._id || ticket.id}</li><li><strong>Status:</strong> ${ticket.status || 'Open'}</li></ul><p>We'll get back to you soon.</p><p>Thank you,<br/>Team Healiinn</p>`,
      });
    }
  }
};

/**
 * Send withdrawal request confirmation email to provider (pharmacy/lab/doctor)
 */
const sendWithdrawalRequestNotification = async ({ provider, withdrawal, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  let providerName = '';
  if (providerType === 'pharmacy') {
    providerName = provider.pharmacyName || provider.ownerName || provider.email || 'Pharmacy';
  } else if (providerType === 'laboratory') {
    providerName = provider.labName || provider.ownerName || provider.email || 'Laboratory';
  } else if (providerType === 'doctor') {
    providerName = provider.firstName && provider.lastName
      ? `Dr. ${provider.firstName} ${provider.lastName}`.trim()
      : provider.email || 'Doctor';
  } else {
    providerName = provider.email || 'Provider';
  }

  const withdrawalAmount = withdrawal.amount || 0;
  const withdrawalId = withdrawal._id || withdrawal.id;
  const payoutMethodType = withdrawal.payoutMethod?.type || 'N/A';

  return sendEmail({
    to: provider.email,
    subject: `Withdrawal Request Submitted - ₹${withdrawalAmount} | Healiinn`,
    text: `Hello ${providerName},\n\nYour withdrawal request has been submitted successfully.\n\nWithdrawal Details:\n- Amount: ₹${withdrawalAmount}\n- Withdrawal ID: ${withdrawalId}\n- Payment Method: ${payoutMethodType}\n- Status: Pending\n\nYour request is under review. You will be notified once it's processed.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${providerName},</p><p>Your withdrawal request has been submitted successfully.</p><ul><li><strong>Amount:</strong> ₹${withdrawalAmount}</li><li><strong>Withdrawal ID:</strong> ${withdrawalId}</li><li><strong>Payment Method:</strong> ${payoutMethodType}</li><li><strong>Status:</strong> Pending</li></ul><p>Your request is under review. You will be notified once it's processed.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Send withdrawal status update email to provider (pharmacy/lab/doctor)
 */
const sendWithdrawalStatusUpdateEmail = async ({ provider, withdrawal, providerType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!provider?.email) return null;

  let providerName = '';
  if (providerType === 'pharmacy') {
    providerName = provider.pharmacyName || provider.ownerName || provider.email || 'Pharmacy';
  } else if (providerType === 'laboratory') {
    providerName = provider.labName || provider.ownerName || provider.email || 'Laboratory';
  } else if (providerType === 'doctor') {
    providerName = provider.firstName && provider.lastName
      ? `Dr. ${provider.firstName} ${provider.lastName}`.trim()
      : provider.email || 'Doctor';
  } else {
    providerName = provider.email || 'Provider';
  }

  const withdrawalAmount = withdrawal.amount || 0;
  const withdrawalStatus = withdrawal.status || 'pending';
  const payoutReference = withdrawal.payoutReference || '';
  const rejectionReason = withdrawal.rejectionReason || '';
  const payoutMethod = withdrawal.payoutMethod || {};
  const payoutMethodType = payoutMethod.type || payoutMethod || 'N/A';
  const payoutMethodDetails = payoutMethod.details || {};

  let subject = '';
  let message = '';
  let htmlMessage = '';

  const adminName = withdrawal?.adminName || 'Admin';
  const adminNote = withdrawal?.adminNote || '';
  const withdrawalId = withdrawal._id || withdrawal.id || 'N/A';

  // Format payout method details for display
  let payoutDetailsText = '';
  let payoutDetailsHtml = '';
  if (payoutMethodType !== 'N/A' && payoutMethodDetails) {
    if (payoutMethodType === 'bank_transfer') {
      payoutDetailsText = `\nAccount Number: ${payoutMethodDetails.accountNumber || 'N/A'}\nIFSC Code: ${payoutMethodDetails.ifscCode || 'N/A'}\nBank Name: ${payoutMethodDetails.bankName || 'N/A'}\nAccount Holder: ${payoutMethodDetails.accountHolderName || 'N/A'}`;
      payoutDetailsHtml = `<ul><li><strong>Account Number:</strong> ${payoutMethodDetails.accountNumber || 'N/A'}</li><li><strong>IFSC Code:</strong> ${payoutMethodDetails.ifscCode || 'N/A'}</li><li><strong>Bank Name:</strong> ${payoutMethodDetails.bankName || 'N/A'}</li><li><strong>Account Holder:</strong> ${payoutMethodDetails.accountHolderName || 'N/A'}</li></ul>`;
    } else if (payoutMethodType === 'upi') {
      payoutDetailsText = `\nUPI ID: ${payoutMethodDetails.upiId || 'N/A'}`;
      payoutDetailsHtml = `<p><strong>UPI ID:</strong> ${payoutMethodDetails.upiId || 'N/A'}</p>`;
    } else if (payoutMethodType === 'paytm') {
      payoutDetailsText = `\nPaytm Number: ${payoutMethodDetails.paytmNumber || 'N/A'}`;
      payoutDetailsHtml = `<p><strong>Paytm Number:</strong> ${payoutMethodDetails.paytmNumber || 'N/A'}</p>`;
    }
  }

  switch (withdrawalStatus) {
    case 'approved':
      subject = `Withdrawal Request Approved - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request has been approved by ${adminName}.\n\nWithdrawal Details:\n- Amount: ₹${withdrawalAmount}\n- Withdrawal ID: ${withdrawalId}\n- Status: Approved${adminNote ? `\n- Admin Note: ${adminNote}` : ''}\n\nPayment will be processed shortly.\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request has been approved by <strong>${adminName}</strong>.</p><ul><li><strong>Amount:</strong> ₹${withdrawalAmount}</li><li><strong>Withdrawal ID:</strong> ${withdrawalId}</li><li><strong>Status:</strong> Approved</li>${adminNote ? `<li><strong>Admin Note:</strong> ${adminNote}</li>` : ''}</ul><p>Payment will be processed shortly.</p><p>Thank you,<br/>Team Healiinn</p>`;
      break;
    case 'paid':
      subject = `Withdrawal Payment Processed - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request has been processed and payment has been sent by ${adminName}.\n\nPayment Details:\n- Amount: ₹${withdrawalAmount}\n- Withdrawal ID: ${withdrawalId}${payoutReference ? `\n- Payout Reference: ${payoutReference}` : ''}\n- Payment Method: ${payoutMethodType}${payoutDetailsText}\n- Status: Paid\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request has been processed and payment has been sent by <strong>${adminName}</strong>.</p><ul><li><strong>Amount:</strong> ₹${withdrawalAmount}</li><li><strong>Withdrawal ID:</strong> ${withdrawalId}</li>${payoutReference ? `<li><strong>Payout Reference:</strong> ${payoutReference}</li>` : ''}<li><strong>Payment Method:</strong> ${payoutMethodType}</li><li><strong>Status:</strong> Paid</li></ul>${payoutDetailsHtml ? payoutDetailsHtml : ''}<p>Thank you,<br/>Team Healiinn</p>`;
      break;
    case 'rejected':
      subject = `Withdrawal Request Rejected - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request has been rejected by ${adminName}.\n\nWithdrawal Details:\n- Amount: ₹${withdrawalAmount}\n- Withdrawal ID: ${withdrawalId}${rejectionReason ? `\n- Reason: ${rejectionReason}` : ''}\n- Status: Rejected\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request has been rejected by <strong>${adminName}</strong>.</p><ul><li><strong>Amount:</strong> ₹${withdrawalAmount}</li><li><strong>Withdrawal ID:</strong> ${withdrawalId}</li>${rejectionReason ? `<li><strong>Reason:</strong> ${rejectionReason}</li>` : ''}<li><strong>Status:</strong> Rejected</li></ul><p>Thank you,<br/>Team Healiinn</p>`;
      break;
    default:
      subject = `Withdrawal Status Update - ₹${withdrawalAmount} | Healiinn`;
      message = `Hello ${providerName},\n\nYour withdrawal request status has been updated.\n\nWithdrawal Details:\n- Amount: ₹${withdrawalAmount}\n- Withdrawal ID: ${withdrawalId}\n- Status: ${withdrawalStatus}\n\nThank you,\nTeam Healiinn`;
      htmlMessage = `<p>Hello ${providerName},</p><p>Your withdrawal request status has been updated.</p><ul><li><strong>Amount:</strong> ₹${withdrawalAmount}</li><li><strong>Withdrawal ID:</strong> ${withdrawalId}</li><li><strong>Status:</strong> ${withdrawalStatus}</li></ul><p>Thank you,<br/>Team Healiinn</p>`;
  }

  return sendEmail({
    to: provider.email,
    subject,
    text: message,
    html: htmlMessage,
  });
};

/**
 * Send support ticket notification email to admin
 */
const sendAdminSupportTicketNotification = async ({ admin, ticket, user, userType }) => {
  if (!(await isEmailNotificationsEnabled())) return null;
  if (!admin?.email) return null;
  
  let userName = '';
  if (userType === 'patient') {
    userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Patient';
  } else if (userType === 'doctor') {
    userName = user?.firstName && user?.lastName
      ? `Dr. ${user.firstName} ${user.lastName}`.trim()
      : user?.email || 'Doctor';
  } else if (userType === 'pharmacy') {
    userName = user?.pharmacyName || user?.ownerName || user?.email || 'Pharmacy';
  } else if (userType === 'laboratory') {
    userName = user?.labName || user?.ownerName || user?.email || 'Laboratory';
  }
  
  const ticketSubject = ticket.subject || 'Support Request';
  const ticketMessage = ticket.message || '';
  
  return sendEmail({
    to: admin.email,
    subject: `New Support Ticket from ${userName} | Healiinn`,
    text: `Hello ${admin.name || 'Admin'},\n\nA new support ticket has been created:\n\nUser: ${userName} (${userType})\nSubject: ${ticketSubject}\nMessage: ${ticketMessage}\n\nTicket ID: ${ticket._id || ticket.id}\nPriority: ${ticket.priority || 'Medium'}\n\nPlease review and respond in the admin panel.\n\nThank you,\nTeam Healiinn`,
    html: `<p>Hello ${admin.name || 'Admin'},</p><p>A new support ticket has been created:</p><ul><li><strong>User:</strong> ${userName} (${userType})</li><li><strong>Subject:</strong> ${ticketSubject}</li><li><strong>Message:</strong> ${ticketMessage}</li><li><strong>Ticket ID:</strong> ${ticket._id || ticket.id}</li><li><strong>Priority:</strong> ${ticket.priority || 'Medium'}</li></ul><p>Please review and respond in the admin panel.</p><p>Thank you,<br/>Team Healiinn</p>`,
  });
};

/**
 * Create admin notification for support ticket
 * @param {Object} params
 * @param {String} params.adminId - Admin ID
 * @param {Object} params.ticket - Support ticket object
 * @param {Object} params.user - User who created ticket (patient/doctor/pharmacy/lab)
 * @param {String} params.userType - User type (patient/doctor/pharmacy/laboratory)
 */
const createAdminSupportTicketNotification = async ({ adminId, ticket, user, userType }) => {
  let userName = '';
  let userTypeLabel = '';
  
  // Extract name and type label based on user type
  if (userType === 'patient') {
    userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.firstName || user?.email || 'Patient';
    userTypeLabel = 'Patient';
  } else if (userType === 'doctor') {
    userName = user?.firstName && user?.lastName
      ? `Dr. ${user.firstName} ${user.lastName}`.trim()
      : user?.firstName ? `Dr. ${user.firstName}` : user?.email || 'Doctor';
    userTypeLabel = 'Doctor';
  } else if (userType === 'pharmacy') {
    userName = user?.pharmacyName || user?.ownerName || user?.email || 'Pharmacy';
    userTypeLabel = 'Pharmacy';
  } else if (userType === 'laboratory') {
    userName = user?.labName || user?.ownerName || user?.email || 'Laboratory';
    userTypeLabel = 'Laboratory';
  }
  
  const ticketSubject = ticket.subject || 'Support Request';
  const title = 'New Support Ticket';
  const message = `New support ticket from ${userTypeLabel} ${userName}: ${ticketSubject}`;
  
  return createNotification({
    userId: adminId,
    userType: 'admin',
    type: 'support',
    title,
    message,
    data: {
      ticketId: ticket._id || ticket.id,
      userId: user?._id || user?.id,
      userType,
      userName,
      userTypeLabel,
      subject: ticketSubject,
      priority: ticket.priority || 'medium',
      message: ticket.message || '',
    },
    priority: ticket.priority === 'high' || ticket.priority === 'urgent' ? 'high' : 'medium',
    actionUrl: `/admin/support/${ticket._id || ticket.id}`,
    icon: 'support',
    sendEmail: false, // Email already sent via sendAdminSupportTicketNotification
    emitSocket: true,
  });
};

/**
 * Create support ticket notification (in-app)
 */
const createSupportTicketNotification = async ({ userId, userType, ticket, eventType }) => {
  let title, message, actionUrl;
  
  const ticketSubject = ticket.subject || 'Support Request';
  const modulePath = userType === 'patient' ? 'patient' 
    : userType === 'doctor' ? 'doctor'
    : userType === 'pharmacy' ? 'pharmacy'
    : userType === 'laboratory' ? 'laboratory' : '';
  
  const adminNote = ticket.adminNote || '';
  
  switch (eventType) {
    case 'created':
      title = 'Support Ticket Created';
      message = `Your support ticket "${ticketSubject}" has been created successfully.`;
      actionUrl = `/${modulePath}/support`;
      break;
    case 'responded':
      title = 'Response Received';
      // Short format for pharmacy and laboratory
      if (userType === 'pharmacy' || userType === 'laboratory') {
        message = adminNote 
          ? `Admin responded to "${ticketSubject}". ${adminNote}`
          : `Admin responded to "${ticketSubject}".`;
      } else {
        message = adminNote 
          ? `Admin has responded to your support ticket "${ticketSubject}". Note: ${adminNote}`
          : `Admin has responded to your support ticket "${ticketSubject}".`;
      }
      actionUrl = `/${modulePath}/support`;
      break;
    case 'status_updated':
      const statusLabel = ticket.status === 'resolved' ? 'Resolved' 
        : ticket.status === 'closed' ? 'Closed'
        : ticket.status === 'in_progress' ? 'In Progress'
        : 'Updated';
      title = `Ticket ${statusLabel}`;
      // Short format for pharmacy and laboratory
      if (userType === 'pharmacy' || userType === 'laboratory') {
        message = adminNote
          ? `Ticket "${ticketSubject}" ${statusLabel.toLowerCase()}. ${adminNote}`
          : `Ticket "${ticketSubject}" ${statusLabel.toLowerCase()}.`;
      } else {
        message = adminNote
          ? `Your support ticket "${ticketSubject}" has been ${statusLabel.toLowerCase()}. Admin Note: ${adminNote}`
          : `Your support ticket "${ticketSubject}" has been ${statusLabel.toLowerCase()}.`;
      }
      actionUrl = `/${modulePath}/support`;
      break;
    default:
      title = 'Support Ticket Update';
      // Short format for pharmacy and laboratory
      if (userType === 'pharmacy' || userType === 'laboratory') {
        message = adminNote
          ? `Ticket "${ticketSubject}" updated. ${adminNote}`
          : `Ticket "${ticketSubject}" updated.`;
      } else {
        message = adminNote
          ? `Your support ticket "${ticketSubject}" has been updated. Admin Note: ${adminNote}`
          : `Your support ticket "${ticketSubject}" has been updated.`;
      }
      actionUrl = `/${modulePath}/support`;
  }
  
  return createNotification({
    userId,
    userType,
    type: 'support', // Use 'support' as per Notification model enum
    title,
    message,
    data: {
      ticketId: ticket._id || ticket.id,
      ticketSubject,
      eventType,
    },
    priority: ticket.priority === 'urgent' ? 'urgent' : ticket.priority === 'high' ? 'high' : 'medium',
    actionUrl,
    icon: 'support',
  });
};

module.exports = {
  createNotification,
  createAppointmentNotification,
  createPrescriptionNotification,
  createWalletNotification,
  createOrderNotification,
  createRequestNotification,
  createReportNotification,
  createAdminNotification,
  createSessionNotification,
  // Email notification functions
  sendNotificationEmail,
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  sendAppointmentCancellationEmail,
  sendLabReportReadyEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  sendWithdrawalRequestNotification,
  sendWithdrawalStatusUpdateEmail,
  // Re-export email service functions
  sendEmail,
  sendRoleApprovalEmail,
  sendSignupAcknowledgementEmail,
  sendPasswordResetOtpEmail,
  sendAppointmentReminderEmail,
  sendPrescriptionEmail,
  // Support ticket notifications
  sendSupportTicketNotification,
  sendAdminSupportTicketNotification,
  createSupportTicketNotification,
  createAdminSupportTicketNotification,
};
