// Doctor service utilities for API calls
import { ApiClient, storeTokens, clearTokens, getRefreshToken } from '../../../utils/apiClient'

// Create doctor-specific API client
const apiClient = new ApiClient('doctor')

/**
 * Doctor signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with doctor
 */
export const signupDoctor = async (signupData) => {
  try {
    const data = await apiClient.post('/doctors/auth/signup', signupData)
    return data
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

/**
 * Request login OTP
 * @param {string} phone - Phone number
 * @returns {Promise<object>} Response data
 */
export const requestLoginOtp = async (phone) => {
  try {
    const data = await apiClient.post('/doctors/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with doctor and tokens
 */
export const loginDoctor = async (credentials) => {
  try {
    const data = await apiClient.post('/doctors/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store doctor tokens after login
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storeDoctorTokens = (tokens, remember = true) => {
  storeTokens('doctor', tokens, remember)
}

/**
 * Clear doctor tokens on logout
 */
export const clearDoctorTokens = () => {
  clearTokens('doctor')
}

/**
 * Get doctor profile
 * @returns {Promise<object>} Doctor profile data
 */
export const getDoctorProfile = async () => {
  try {
    return await apiClient.get('/doctors/auth/me')
  } catch (error) {
    console.error('Error fetching doctor profile:', error)
    throw error
  }
}

/**
 * Update doctor profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updateDoctorProfile = async (profileData) => {
  try {
    return await apiClient.put('/doctors/auth/me', profileData)
  } catch (error) {
    console.error('Error updating doctor profile:', error)
    throw error
  }
}

/**
 * Doctor logout
 * @returns {Promise<object>} Response data
 */
export const logoutDoctor = async () => {
  try {
    // Get refresh token before clearing
    const refreshToken = getRefreshToken('doctor')
    
    // Call backend logout API to blacklist tokens
    await apiClient.post('/doctors/auth/logout', {
      refreshToken: refreshToken || null
    }).catch((error) => {
      // Even if backend call fails, we still clear tokens on frontend
      console.error('Error calling logout API:', error)
    })
    
    // Clear all tokens from storage
    clearDoctorTokens()
    
    return { success: true, message: 'Logout successful' }
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if there's an error
    clearDoctorTokens()
    throw error
  }
}

/**
 * Get doctor dashboard data
 * @returns {Promise<object>} Dashboard data
 */
export const getDoctorDashboard = async () => {
  try {
    return await apiClient.get('/doctors/dashboard/stats')
  } catch (error) {
    console.error('Error fetching doctor dashboard:', error)
    throw error
  }
}

/**
 * Get doctor appointments
 * @param {object} filters - Filter options (status, date, etc.)
 * @returns {Promise<object>} Appointments data
 */
export const getDoctorAppointments = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/appointments', filters)
  } catch (error) {
    console.error('Error fetching doctor appointments:', error)
    throw error
  }
}

/**
 * Get doctor queue (today's appointments)
 * @param {string} date - Date in YYYY-MM-DD format (optional)
 * @returns {Promise<object>} Queue data
 */
export const getDoctorQueue = async (date) => {
  try {
    const params = date ? { date } : {}
    return await apiClient.get('/doctors/queue', params)
  } catch (error) {
    console.error('Error fetching doctor queue:', error)
    throw error
  }
}

/**
 * Call next patient in queue
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Next patient data
 */
export const callNextPatient = async (sessionId, appointmentId = null) => {
  try {
    return await apiClient.post('/doctors/queue/call-next', { 
      sessionId,
      ...(appointmentId && { appointmentId }) // Only include appointmentId if provided
    })
  } catch (error) {
    console.error('Error calling next patient:', error)
    throw error
  }
}

/**
 * Skip a patient in queue
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object>} Response data
 */
export const skipPatient = async (appointmentId) => {
  try {
    return await apiClient.patch(`/doctors/queue/${appointmentId}/skip`)
  } catch (error) {
    console.error('Error skipping patient:', error)
    throw error
  }
}

/**
 * Re-call a patient (move from skipped/no-show back to waiting)
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object>} Response data
 */
export const recallPatient = async (appointmentId) => {
  try {
    return await apiClient.patch(`/doctors/queue/${appointmentId}/recall`)
  } catch (error) {
    console.error('Error recalling patient:', error)
    throw error
  }
}

/**
 * Update queue status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - Status (waiting, in-consultation, completed, no-show)
 * @returns {Promise<object>} Updated appointment data
 */
export const updateQueueStatus = async (appointmentId, status) => {
  try {
    return await apiClient.patch(`/doctors/queue/${appointmentId}/status`, { status })
  } catch (error) {
    console.error('Error updating queue status:', error)
    throw error
  }
}

/**
 * Mark patient as no-show (cancels appointment)
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object>} Cancelled appointment data
 */
export const markNoShow = async (appointmentId) => {
  try {
    return await apiClient.patch(`/doctors/queue/${appointmentId}/no-show`)
  } catch (error) {
    console.error('Error marking no-show:', error)
    throw error
  }
}

/**
 * Pause session
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Session data
 */
export const pauseSession = async (sessionId) => {
  try {
    return await apiClient.post('/doctors/queue/pause', { sessionId })
  } catch (error) {
    console.error('Error pausing session:', error)
    throw error
  }
}

/**
 * Resume session
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Session data
 */
export const resumeSession = async (sessionId) => {
  try {
    return await apiClient.post('/doctors/queue/resume', { sessionId })
  } catch (error) {
    console.error('Error resuming session:', error)
    throw error
  }
}

/**
 * Update session status
 * @param {string} sessionId - Session ID
 * @param {object} updateData - Update data (status, etc.)
 * @returns {Promise<object>} Updated session data
 */
export const updateSession = async (sessionId, updateData) => {
  try {
    return await apiClient.patch(`/doctors/sessions/${sessionId}`, updateData)
  } catch (error) {
    console.error('Error updating session:', error)
    throw error
  }
}

/**
 * Cancel session and all appointments
 * @param {string} sessionId - Session ID
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<object>} Cancelled session data
 */
export const cancelSession = async (sessionId, reason) => {
  try {
    return await apiClient.delete(`/doctors/sessions/${sessionId}`, { reason })
  } catch (error) {
    console.error('Error cancelling session:', error)
    throw error
  }
}

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {object} updateData - Update data (status, cancelReason, etc.)
 * @returns {Promise<object>} Updated appointment data
 */
export const updateDoctorAppointment = async (appointmentId, updateData) => {
  try {
    return await apiClient.patch(`/doctors/appointments/${appointmentId}`, updateData)
  } catch (error) {
    console.error('Error updating appointment:', error)
    throw error
  }
}

/**
 * Cancel appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} cancelReason - Reason for cancellation
 * @returns {Promise<object>} Cancelled appointment data
 */
export const cancelDoctorAppointment = async (appointmentId, cancelReason) => {
  try {
    return await apiClient.patch(`/doctors/appointments/${appointmentId}`, {
      status: 'cancelled',
      cancelReason,
      cancelledBy: 'doctor',
      cancelledAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error canceling appointment:', error)
    throw error
  }
}

/**
 * Reschedule appointment
 * @param {string} appointmentId - Appointment ID
 * @param {object} rescheduleData - Reschedule data (appointmentDate, time, reason)
 * @returns {Promise<object>} Rescheduled appointment data
 */
export const rescheduleDoctorAppointment = async (appointmentId, rescheduleData) => {
  try {
    return await apiClient.patch(`/doctors/appointments/${appointmentId}/reschedule`, rescheduleData)
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    throw error
  }
}

/**
 * Get doctor patients list
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Patients data
 */
export const getDoctorPatients = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/patients/all', filters)
  } catch (error) {
    console.error('Error fetching doctor patients:', error)
    throw error
  }
}

/**
 * Get patient by ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<object>} Patient data
 */
export const getPatientById = async (patientId) => {
  try {
    return await apiClient.get(`/doctors/patients/${patientId}`)
  } catch (error) {
    console.error('Error fetching patient:', error)
    throw error
  }
}

/**
 * Get patient history
 * @param {string} patientId - Patient ID
 * @returns {Promise<object>} Patient history data
 */
export const getPatientHistory = async (patientId) => {
  try {
    return await apiClient.get(`/doctors/patients/${patientId}/history`)
  } catch (error) {
    console.error('Error fetching patient history:', error)
    throw error
  }
}

/**
 * Get patient queue (today's appointments)
 * @returns {Promise<object>} Queue data
 */
export const getPatientQueue = async (date = null) => {
  try {
    // If no date provided, use today's date in YYYY-MM-DD format
    let url = '/doctors/patients/queue'
    if (date) {
      url += `?date=${date}`
    } else {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`
      url += `?date=${todayStr}`
    }
    return await apiClient.get(url)
  } catch (error) {
    console.error('Error fetching patient queue:', error)
    throw error
  }
}

/**
 * Get doctor consultations (today's consultations)
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Consultations data
 */
export const getDoctorConsultations = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/consultations', filters)
  } catch (error) {
    console.error('Error fetching doctor consultations:', error)
    throw error
  }
}

/**
 * Get all doctor consultations
 * @param {object} filters - Filter options
 * @returns {Promise<object>} All consultations data
 */
export const getAllDoctorConsultations = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/consultations/all', filters)
  } catch (error) {
    console.error('Error fetching all doctor consultations:', error)
    throw error
  }
}

/**
 * Get consultation by ID
 * @param {string} consultationId - Consultation ID
 * @returns {Promise<object>} Consultation data
 */
export const getConsultationById = async (consultationId) => {
  try {
    return await apiClient.get(`/doctors/consultations/${consultationId}`)
  } catch (error) {
    console.error('Error fetching consultation:', error)
    throw error
  }
}

/**
 * Create consultation
 * @param {object} consultationData - Consultation data
 * @returns {Promise<object>} Created consultation data
 */
export const createConsultation = async (consultationData) => {
  try {
    return await apiClient.post('/doctors/consultations', consultationData)
  } catch (error) {
    console.error('Error creating consultation:', error)
    throw error
  }
}

/**
 * Update consultation
 * @param {string} consultationId - Consultation ID
 * @param {object} consultationData - Updated consultation data
 * @returns {Promise<object>} Updated consultation data
 */
export const updateConsultation = async (consultationId, consultationData) => {
  try {
    return await apiClient.patch(`/doctors/consultations/${consultationId}`, consultationData)
  } catch (error) {
    console.error('Error updating consultation:', error)
    throw error
  }
}

/**
 * Get doctor wallet balance
 * @returns {Promise<object>} Wallet balance data
 */
export const getDoctorWalletBalance = async () => {
  try {
    return await apiClient.get('/doctors/wallet/balance')
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    throw error
  }
}

/**
 * Get doctor wallet earnings
 * @param {object} filters - Filter options (period, etc.)
 * @returns {Promise<object>} Earnings data
 */
export const getDoctorWalletEarnings = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/wallet/earnings', filters)
  } catch (error) {
    console.error('Error fetching wallet earnings:', error)
    throw error
  }
}

/**
 * Get doctor wallet transactions
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Transactions data
 */
export const getDoctorWalletTransactions = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/wallet/transactions', filters)
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    throw error
  }
}

/**
 * Get doctor withdrawal requests
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Withdrawal requests data
 */
export const getDoctorWithdrawals = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/wallet/withdrawals', filters)
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    throw error
  }
}

/**
 * Request withdrawal
 * @param {object} withdrawalData - Withdrawal request data (amount, bankAccount, etc.)
 * @returns {Promise<object>} Created withdrawal request data
 */
export const requestWithdrawal = async (withdrawalData) => {
  try {
    return await apiClient.post('/doctors/wallet/withdraw', withdrawalData)
  } catch (error) {
    console.error('Error requesting withdrawal:', error)
    throw error
  }
}

/**
 * Create support ticket
 * @param {object} ticketData - Support ticket data (subject, message, priority)
 * @returns {Promise<object>} Created ticket data
 */
export const createSupportTicket = async (ticketData) => {
  try {
    return await apiClient.post('/doctors/support', ticketData)
  } catch (error) {
    console.error('Error creating support ticket:', error)
    throw error
  }
}

/**
 * Get support tickets
 * @param {object} filters - Optional filters (status, page, limit)
 * @returns {Promise<object>} Support tickets data
 */
export const getSupportTickets = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/support', filters)
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    throw error
  }
}

/**
 * Get support history
 * @param {object} filters - Optional filters (page, limit)
 * @returns {Promise<object>} Support history data
 */
export const getSupportHistory = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/support/history', filters)
  } catch (error) {
    console.error('Error fetching support history:', error)
    throw error
  }
}

/**
 * Upload profile image
 * @param {File} file - Image file
 * @returns {Promise<object>} Response data with URL
 */
export const uploadProfileImage = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const data = await apiClient.upload('/doctors/upload/profile-image', formData)
    return data
  } catch (error) {
    console.error('Error uploading profile image:', error)
    throw error
  }
}

/**
 * Upload digital signature
 * @param {File} file - Image file
 * @returns {Promise<object>} Response data with URL
 */
export const uploadSignature = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const data = await apiClient.upload('/doctors/upload/signature', formData)
    return data
  } catch (error) {
    console.error('Error uploading signature:', error)
    throw error
  }
}

/**
 * Create prescription
 * @param {object} prescriptionData - Prescription data
 * @returns {Promise<object>} Created prescription data
 */
export const createPrescription = async (prescriptionData) => {
  try {
    return await apiClient.post('/doctors/prescriptions', prescriptionData)
  } catch (error) {
    console.error('Error creating prescription:', error)
    throw error
  }
}

/**
 * Get prescriptions
 * @param {object} filters - Filter options (patientId, consultationId, etc.)
 * @returns {Promise<object>} Prescriptions data
 */
export const getPrescriptions = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/prescriptions', filters)
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    throw error
  }
}

/**
 * Get prescription by ID
 * @param {string} prescriptionId - Prescription ID
 * @returns {Promise<object>} Prescription data
 */
export const getPrescriptionById = async (prescriptionId) => {
  try {
    return await apiClient.get(`/doctors/prescriptions/${prescriptionId}`)
  } catch (error) {
    console.error('Error fetching prescription:', error)
    throw error
  }
}

/**
 * Get all medicines from all pharmacies
 * @param {object} filters - Filter options (search, page, limit)
 * @returns {Promise<object>} Medicines data
 */
export const getAllMedicines = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/consultations/medicines/all', filters)
  } catch (error) {
    console.error('Error fetching all medicines:', error)
    throw error
  }
}

/**
 * Get all lab tests from all laboratories
 * @param {object} filters - Filter options (search, page, limit)
 * @returns {Promise<object>} Tests data
 */
export const getAllTests = async (filters = {}) => {
  try {
    return await apiClient.get('/doctors/consultations/tests/all', filters)
  } catch (error) {
    console.error('Error fetching all tests:', error)
    throw error
  }
}


