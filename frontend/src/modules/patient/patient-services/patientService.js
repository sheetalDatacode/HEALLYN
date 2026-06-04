// Patient service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create patient-specific API client
const apiClient = new ApiClient('patient')

/**
 * Patient signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with patient and tokens
 */
export const signupPatient = async (signupData) => {
  try {
    const data = await apiClient.post('/patients/auth/signup', signupData)
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
    const data = await apiClient.post('/patients/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with patient and tokens
 */
export const loginPatient = async (credentials) => {
  try {
    const data = await apiClient.post('/patients/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store patient tokens after login/signup
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storePatientTokens = (tokens, remember = true) => {
  storeTokens('patient', tokens, remember)
}

/**
 * Clear patient tokens on logout
 */
export const clearPatientTokens = () => {
  clearTokens('patient')
}

/**
 * Get patient profile
 * @returns {Promise<object>} Patient profile data
 */
export const getPatientProfile = async () => {
  try {
    return await apiClient.get('/patients/auth/me')
  } catch (error) {
    console.error('Error fetching patient profile:', error)
    throw error
  }
}

/**
 * Update patient profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updatePatientProfile = async (profileData) => {
  try {
    return await apiClient.put('/patients/auth/me', profileData)
  } catch (error) {
    console.error('Error updating patient profile:', error)
    throw error
  }
}

/**
 * Patient logout
 * @returns {Promise<object>} Response data
 */
export const logoutPatient = async () => {
  try {
    // Call backend logout API to blacklist tokens
    await apiClient.post('/patients/auth/logout').catch((error) => {
      // Even if backend call fails, we still clear tokens on frontend
      console.error('Error calling logout API:', error)
    })

    // Clear all tokens from storage
    clearPatientTokens()

    return { success: true, message: 'Logout successful' }
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if there's an error
    clearPatientTokens()
    throw error
  }
}

/**
 * Get patient dashboard data
 * @returns {Promise<object>} Dashboard data
 */
export const getPatientDashboard = async () => {
  try {
    return await apiClient.get('/patients/dashboard')
  } catch (error) {
    console.error('Error fetching patient dashboard:', error)
    throw error
  }
}

/**
 * Get patient appointments list
 * @param {object} filters - Filter options (status, dateFrom, dateTo, etc.)
 * @returns {Promise<object>} Appointments data
 */
export const getPatientAppointments = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/appointments', filters)
  } catch (error) {
    console.error('Error fetching patient appointments:', error)
    throw error
  }
}

/**
 * Get upcoming appointments
 * @returns {Promise<object>} Upcoming appointments data
 */
export const getUpcomingAppointments = async () => {
  try {
    return await apiClient.get('/patients/appointments/upcoming')
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error)
    throw error
  }
}

/**
 * Book an appointment
 * @param {object} appointmentData - Appointment booking data
 * @returns {Promise<object>} Created appointment data
 */
export const bookAppointment = async (appointmentData) => {
  try {
    return await apiClient.post('/patients/appointments', appointmentData)
  } catch (error) {
    console.error('Error booking appointment:', error)
    throw error
  }
}

/**
 * Cancel an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} reason - Optional cancellation reason
 * @returns {Promise<object>} Cancellation response
 */
export const cancelAppointment = async (appointmentId, reason = '') => {
  try {
    return await apiClient.delete(`/patients/appointments/${appointmentId}`, { reason })
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    throw error
  }
}

/**
 * Reschedule an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {object} rescheduleData - Reschedule data (appointmentDate, time, reason)
 * @returns {Promise<object>} Rescheduled appointment data
 */
export const rescheduleAppointment = async (appointmentId, rescheduleData) => {
  try {
    return await apiClient.patch(`/patients/appointments/${appointmentId}/reschedule`, rescheduleData)
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    throw error
  }
}

/**
 * Create payment order for an appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object>} Payment order data
 */
export const createAppointmentPaymentOrder = async (appointmentId) => {
  try {
    return await apiClient.post(`/patients/appointments/${appointmentId}/payment/order`)
  } catch (error) {
    console.error('Error creating payment order:', error)
    throw error
  }
}

/**
 * Verify payment for an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {object} paymentData - Payment data (paymentId, orderId, signature, paymentMethod)
 * @returns {Promise<object>} Payment verification response
 */
export const verifyAppointmentPayment = async (appointmentId, paymentData) => {
  try {
    return await apiClient.post(`/patients/appointments/${appointmentId}/payment/verify`, paymentData)
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

/**
 * Update an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {object} updateData - Update data (reason, notes, etc.)
 * @returns {Promise<object>} Updated appointment data
 */
export const updateAppointment = async (appointmentId, updateData) => {
  try {
    return await apiClient.patch(`/patients/appointments/${appointmentId}`, updateData)
  } catch (error) {
    console.error('Error updating appointment:', error)
    throw error
  }
}

/**
 * Get patient orders
 * @param {object} filters - Filter options (status, type, etc.)
 * @returns {Promise<object>} Orders data
 */
export const getPatientOrders = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/orders', filters)
  } catch (error) {
    console.error('Error fetching patient orders:', error)
    throw error
  }
}

/**
 * Get patient order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Order data
 */
export const getPatientOrderById = async (orderId) => {
  try {
    return await apiClient.get(`/patients/orders/${orderId}`)
  } catch (error) {
    console.error('Error fetching patient order details:', error)
    throw error
  }
}

/**
 * Get patient prescriptions
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Prescriptions data
 */
export const getPatientPrescriptions = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/prescriptions', filters)
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error)
    throw error
  }
}

/**
 * Get patient transactions
 * @param {object} filters - Filter options (status, type, etc.)
 * @returns {Promise<object>} Transactions data
 */
export const getPatientTransactions = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/transactions', filters)
  } catch (error) {
    console.error('Error fetching patient transactions:', error)
    throw error
  }
}

/**
 * Get doctors for discovery
 * @param {object} filters - Filter options (search, specialty, city, state, rating, etc.)
 * @returns {Promise<object>} Doctors data
 */
export const getDiscoveryDoctors = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/doctors', filters)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    throw error
  }
}

/**
 * Get doctors (alias for getDiscoveryDoctors for backward compatibility)
 * @param {object} filters - Filter options (search, specialty, city, state, rating, etc.)
 * @returns {Promise<object>} Doctors data
 */
export const getDoctors = getDiscoveryDoctors

/**
 * Get nurses for discovery
 * @param {object} filters - Filter options (search, city, state, etc.)
 * @returns {Promise<object>} Nurses data
 */
export const getDiscoveryNurses = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/nurses', filters)
  } catch (error) {
    console.error('Error fetching nurses:', error)
    throw error
  }
}

/**
 * Get nurse by ID
 * @param {string} nurseId - Nurse ID
 * @returns {Promise<object>} Nurse data
 */
export const getNurseById = async (nurseId) => {
  try {
    return await apiClient.get(`/patients/nurses/${nurseId}`)
  } catch (error) {
    console.error('Error fetching nurse details:', error)
    throw error
  }
}

/**
 * Get doctor by ID
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<object>} Doctor data
 */
export const getDoctorById = async (doctorId) => {
  try {
    return await apiClient.get(`/patients/doctors/${doctorId}`)
  } catch (error) {
    console.error('Error fetching doctor details:', error)
    throw error
  }
}

/**
 * Check doctor slot availability for a specific date
 * @param {string} doctorId - Doctor ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<object>} Slot availability data
 */
export const checkDoctorSlotAvailability = async (doctorId, date) => {
  try {
    return await apiClient.get(`/patients/doctors/${doctorId}/slots`, { date })
  } catch (error) {
    console.error('Error checking doctor slot availability:', error)
    throw error
  }
}

/**
 * Get pharmacies for discovery
 * @param {object} filters - Filter options (search, deliveryOption, city, state, etc.)
 * @returns {Promise<object>} Pharmacies data
 */
export const getDiscoveryPharmacies = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacies', filters)
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    throw error
  }
}

/**
 * Get laboratories for discovery
 * @param {object} filters - Filter options (search, city, state, etc.)
 * @returns {Promise<object>} Laboratories data
 */
export const getDiscoveryLaboratories = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratories', filters)
  } catch (error) {
    console.error('Error fetching laboratories:', error)
    throw error
  }
}


/**
 * Get specialties
 * @returns {Promise<object>} Specialties data
 */
export const getSpecialties = async () => {
  try {
    return await apiClient.get('/patients/doctors/specialties')
  } catch (error) {
    console.error('Error fetching specialties:', error)
    throw error
  }
}

/**
 * Get locations (cities and states)
 * @returns {Promise<object>} Locations data with cities and states
 */
export const getLocations = async () => {
  try {
    return await apiClient.get('/patients/doctors/locations')
  } catch (error) {
    console.error('Error fetching locations:', error)
    throw error
  }
}

/**
 * Get patient reports
 * @param {object} filters - Filter options (status, etc.)
 * @returns {Promise<object>} Reports data
 */
export const getPatientReports = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/reports', filters)
  } catch (error) {
    console.error('Error fetching patient reports:', error)
    throw error
  }
}

/**
 * Share lab report with doctor
 * @param {string} reportId - Report ID
 * @param {string} doctorId - Doctor ID
 * @param {string} consultationId - Optional consultation ID
 * @returns {Promise<object>} Response data
 */
export const shareLabReport = async (reportId, doctorId, consultationId = null) => {
  try {
    return await apiClient.post(`/patients/reports/${reportId}/share`, {
      doctorId,
      consultationId,
    })
  } catch (error) {
    console.error('Error sharing lab report:', error)
    throw error
  }
}

/**
 * Get patient complete history (prescriptions, lab tests, appointments, orders)
 * @param {object} filters - Optional filters (page, limit)
 * @returns {Promise<object>} Complete history data
 */
export const getPatientHistory = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/history', filters)
  } catch (error) {
    console.error('Error fetching patient history:', error)
    throw error
  }
}

/**
 * Download report PDF
 * @param {string} reportId - Report ID
 * @returns {Promise<object>} Report PDF URL
 */
export const downloadReport = async (reportId) => {
  try {
    return await apiClient.get(`/patients/reports/${reportId}/download`)
  } catch (error) {
    console.error('Error downloading report:', error)
    throw error
  }
}

/**
 * Get patient requests
 * @param {object} filters - Filter options (status, type, etc.)
 * @returns {Promise<object>} Requests data
 */
export const getPatientRequests = async (filters = {}) => {
  try {
    return await apiClient.get('/patients/requests', filters)
  } catch (error) {
    console.error('Error fetching patient requests:', error)
    throw error
  }
}

/**
 * Get request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<object>} Request data
 */
export const getPatientRequestById = async (requestId) => {
  try {
    return await apiClient.get(`/patients/requests/${requestId}`)
  } catch (error) {
    console.error('Error fetching request details:', error)
    throw error
  }
}

/**
 * Get doctors by specialty
 * @param {string} specialtyId - Specialty ID
 * @param {object} filters - Optional filters (page, limit)
 * @returns {Promise<object>} Doctors data
 */
export const getSpecialtyDoctors = async (specialtyId, filters = {}) => {
  try {
    return await apiClient.get(`/patients/doctors/specialties/${specialtyId}/doctors`, filters)
  } catch (error) {
    console.error('Error fetching specialty doctors:', error)
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
    return await apiClient.post('/patients/support', ticketData)
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
    return await apiClient.get('/patients/support', filters)
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
    return await apiClient.get('/patients/support/history', filters)
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

    const data = await apiClient.upload('/patients/upload/profile-image', formData)
    return data
  } catch (error) {
    console.error('Error uploading profile image:', error)
    throw error
  }
}

/**
 * Create patient request (order medicine or book test visit)
 * @param {object} requestData - Request data (type, prescriptionId, visitType, patientAddress)
 * @returns {Promise<object>} Created request data
 */
export const createPatientRequest = async (requestData) => {
  try {
    return await apiClient.post('/patients/requests', requestData)
  } catch (error) {
    console.error('Error creating request:', error)
    throw error
  }
}

/**
 * Create payment order for a request
 * @param {string} requestId - Request ID
 * @returns {Promise<object>} Payment order data
 */
export const createRequestPaymentOrder = async (requestId) => {
  try {
    return await apiClient.post(`/patients/requests/${requestId}/payment/order`)
  } catch (error) {
    console.error('Error creating payment order:', error)
    throw error
  }
}

/**
 * Confirm payment for a request
 * @param {string} requestId - Request ID
 * @param {object} paymentData - Payment data (paymentId, paymentMethod, orderId, signature)
 * @returns {Promise<object>} Payment confirmation data
 */
export const confirmRequestPayment = async (requestId, paymentData) => {
  try {
    return await apiClient.post(`/patients/requests/${requestId}/payment`, paymentData)
  } catch (error) {
    console.error('Error confirming payment:', error)
    throw error
  }
}

/**
 * Cancel a patient request
 * @param {string} requestId - Request ID
 * @returns {Promise<object>} Cancellation response
 */
export const cancelPatientRequest = async (requestId) => {
  try {
    return await apiClient.delete(`/patients/requests/${requestId}`)
  } catch (error) {
    console.error('Error cancelling request:', error)
    throw error
  }
}

/**
 * Submit a review for a doctor
 * @param {object} reviewData - Review data (doctorId, appointmentId, rating, comment)
 * @returns {Promise<object>} Created review data
 */
export const submitReview = async (reviewData) => {
  try {
    return await apiClient.post('/patients/reviews', reviewData)
  } catch (error) {
    console.error('Error submitting review:', error)
    throw error
  }
}

/**
 * Get patient's reviews
 * @param {object} filters - Filter options (page, limit)
 * @returns {Promise<object>} Reviews data
 */
export const getPatientReviews = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)

    const queryString = queryParams.toString()
    return await apiClient.get(`/patients/reviews${queryString ? `?${queryString}` : ''}`)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    throw error
  }
}

