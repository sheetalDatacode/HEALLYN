// Admin service utilities for API calls
import apiClient, { storeTokens, clearTokens } from '../../../utils/apiClient'

/**
 * Admin login
 * @param {object} credentials - Login credentials (email, password)
 * @returns {Promise<object>} Response data with admin and tokens
 */
export const loginAdmin = async (credentials) => {
  try {
    const data = await apiClient.post('/admin/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store admin tokens after login/signup
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storeAdminTokens = (tokens, remember = true) => {
  storeTokens('admin', tokens, remember)
}

/**
 * Clear admin tokens on logout
 */
export const clearAdminTokens = () => {
  clearTokens('admin')
}

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    return await apiClient.get('/admin/dashboard/stats')
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

/**
 * Get chart data for dashboard (revenue, user growth, consultations)
 */
export const getDashboardChartData = async () => {
  try {
    return await apiClient.get('/admin/dashboard/charts')
  } catch (error) {
    console.error('Error fetching dashboard chart data:', error)
    throw error
  }
}

/**
 * Get all users with filters
 */
export const getUsers = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/users', filters)
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    return await apiClient.get(`/admin/users/${userId}`)
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

/**
 * Update user status
 */
export const updateUserStatus = async (userId, status) => {
  try {
    return await apiClient.patch(`/admin/users/${userId}/status`, { status })
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
}

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  try {
    return await apiClient.delete(`/admin/users/${userId}`)
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Get all doctors with filters
 */
export const getDoctors = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/doctors', filters)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    throw error
  }
}

/**
 * Get doctor by ID
 */
export const getDoctorById = async (doctorId) => {
  try {
    return await apiClient.get(`/admin/doctors/${doctorId}`)
  } catch (error) {
    console.error('Error fetching doctor:', error)
    throw error
  }
}

/**
 * Verify doctor
 */
export const verifyDoctor = async (doctorId, verificationData = {}) => {
  try {
    return await apiClient.patch(`/admin/doctors/${doctorId}/verify`, verificationData)
  } catch (error) {
    console.error('Error verifying doctor:', error)
    throw error
  }
}

/**
 * Reject doctor verification
 */
export const rejectDoctor = async (doctorId, reason) => {
  try {
    return await apiClient.patch(`/admin/doctors/${doctorId}/reject`, { reason })
  } catch (error) {
    console.error('Error rejecting doctor:', error)
    throw error
  }
}

/**
 * Get all pharmacies with filters
 */
export const getPharmacies = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/pharmacies', filters)
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    throw error
  }
}

/**
 * Get pharmacy by ID
 */
export const getPharmacyById = async (pharmacyId) => {
  try {
    return await apiClient.get(`/admin/pharmacies/${pharmacyId}`)
  } catch (error) {
    console.error('Error fetching pharmacy:', error)
    throw error
  }
}

/**
 * Verify pharmacy
 */
export const verifyPharmacy = async (pharmacyId, verificationData = {}) => {
  try {
    return await apiClient.patch(`/admin/pharmacies/${pharmacyId}/verify`, verificationData)
  } catch (error) {
    console.error('Error verifying pharmacy:', error)
    throw error
  }
}

/**
 * Reject pharmacy verification
 */
export const rejectPharmacy = async (pharmacyId, reason) => {
  try {
    return await apiClient.patch(`/admin/pharmacies/${pharmacyId}/reject`, { reason })
  } catch (error) {
    console.error('Error rejecting pharmacy:', error)
    throw error
  }
}

/**
 * Get all nurses with filters
 */
export const getNurses = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/nurses', filters)
  } catch (error) {
    console.error('Error fetching nurses:', error)
    throw error
  }
}

/**
 * Get nurse by ID
 */
export const getNurseById = async (nurseId) => {
  try {
    return await apiClient.get(`/admin/nurses/${nurseId}`)
  } catch (error) {
    console.error('Error fetching nurse:', error)
    throw error
  }
}

/**
 * Verify nurse
 */
export const verifyNurse = async (nurseId, verificationData = {}) => {
  try {
    return await apiClient.patch(`/admin/nurses/${nurseId}/verify`, verificationData)
  } catch (error) {
    console.error('Error verifying nurse:', error)
    throw error
  }
}

/**
 * Reject nurse verification
 */
export const rejectNurse = async (nurseId, reason) => {
  try {
    return await apiClient.patch(`/admin/nurses/${nurseId}/reject`, { reason })
  } catch (error) {
    console.error('Error rejecting nurse:', error)
    throw error
  }
}

/**
 * Get all laboratories with filters
 */
export const getLaboratories = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/laboratories', filters)
  } catch (error) {
    console.error('Error fetching laboratories:', error)
    throw error
  }
}

/**
 * Get laboratory by ID
 */
export const getLaboratoryById = async (laboratoryId) => {
  try {
    return await apiClient.get(`/admin/laboratories/${laboratoryId}`)
  } catch (error) {
    console.error('Error fetching laboratory:', error)
    throw error
  }
}

/**
 * Verify laboratory
 */
export const verifyLaboratory = async (laboratoryId, verificationData = {}) => {
  try {
    return await apiClient.patch(`/admin/laboratories/${laboratoryId}/verify`, verificationData)
  } catch (error) {
    console.error('Error verifying laboratory:', error)
    throw error
  }
}

/**
 * Reject laboratory verification
 */
export const rejectLaboratory = async (laboratoryId, reason) => {
  try {
    return await apiClient.patch(`/admin/laboratories/${laboratoryId}/reject`, { reason })
  } catch (error) {
    console.error('Error rejecting laboratory:', error)
    throw error
  }
}

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const params = limit ? { limit } : {}
    return await apiClient.get('/admin/dashboard/activities', params)
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    throw error
  }
}

/**
 * Get pending verifications
 */
export const getPendingVerifications = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/verifications/pending', filters)
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
    throw error
  }
}

/**
 * Get admin profile
 */
export const getAdminProfile = async () => {
  try {
    return await apiClient.get('/admin/auth/me')
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    throw error
  }
}

/**
 * Update admin profile
 */
export const updateAdminProfile = async (profileData) => {
  try {
    return await apiClient.put('/admin/auth/me', profileData)
  } catch (error) {
    console.error('Error updating admin profile:', error)
    throw error
  }
}

/**
 * Update admin password
 */
export const updateAdminPassword = async (passwordData) => {
  try {
    return await apiClient.patch('/admin/auth/me/password', passwordData)
  } catch (error) {
    console.error('Error updating password:', error)
    throw error
  }
}

/**
 * Get admin settings
 */
export const getAdminSettings = async () => {
  try {
    return await apiClient.get('/admin/settings')
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    throw error
  }
}

/**
 * Update admin settings
 */
export const updateAdminSettings = async (settings) => {
  try {
    return await apiClient.patch('/admin/settings', settings)
  } catch (error) {
    console.error('Error updating admin settings:', error)
    throw error
  }
}

/**
 * Logout admin
 */
export const logoutAdmin = async () => {
  try {
    await apiClient.post('/admin/auth/logout')
    // Clear tokens from storage
    clearAdminTokens()
    return { success: true, message: 'Logout successful' }
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if API call fails
    clearAdminTokens()
    throw error
  }
}

/**
 * Forgot password - Request OTP
 * @param {string} email - Email address
 * @returns {Promise<object>} Response data
 */
export const forgotPassword = async (email) => {
  try {
    return await apiClient.post('/admin/auth/forgot-password', { email })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    throw error
  }
}

/**
 * Verify password reset OTP
 * @param {object} data - { email, otp }
 * @returns {Promise<object>} Response data
 */
export const verifyPasswordOtp = async (data) => {
  try {
    return await apiClient.post('/admin/auth/verify-otp', data)
  } catch (error) {
    console.error('Error verifying OTP:', error)
    throw error
  }
}

/**
 * Reset password
 * @param {object} data - { email, otp, newPassword }
 * @returns {Promise<object>} Response data
 */
export const resetPassword = async (data) => {
  try {
    return await apiClient.post('/admin/auth/reset-password', data)
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

/**
 * Get revenue overview
 * @param {string} period - 'today', 'week', 'month', 'year', or 'all'
 */
export const getRevenueOverview = async (period = 'all') => {
  try {
    return await apiClient.get(`/admin/revenue?period=${period}`)
  } catch (error) {
    console.error('Error fetching revenue overview:', error)
    throw error
  }
}

/**
 * Get provider revenue details
 * @param {string} type - 'doctor', 'lab', or 'pharmacy'
 * @param {string} period - 'today', 'week', 'month', 'year', or 'all'
 */
export const getProviderRevenue = async (type, period = 'all') => {
  try {
    return await apiClient.get(`/admin/revenue/providers/${type}?period=${period}`)
  } catch (error) {
    console.error('Error fetching provider revenue:', error)
    throw error
  }
}

/**
 * Get admin wallet overview
 */
export const getAdminWalletOverview = async (period = 'all') => {
  try {
    return await apiClient.get('/admin/wallet/overview', {
      params: { period }
    })
  } catch (error) {
    console.error('Error fetching wallet overview:', error)
    throw error
  }
}

/**
 * Get provider summaries (doctors, pharmacies, laboratories)
 */
export const getProviderSummaries = async (role = null, period = 'all') => {
  try {
    const params = {}
    if (role) params.role = role
    if (period) params.period = period
    return await apiClient.get('/admin/wallet/providers', { params })
  } catch (error) {
    console.error('Error fetching provider summaries:', error)
    throw error
  }
}

/**
 * Get withdrawal requests
 */
export const getWithdrawals = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.role) queryParams.append('role', filters.role)
    return await apiClient.get('/admin/wallet/withdrawals', filters)
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    throw error
  }
}

/**
 * Update withdrawal status
 */
export const updateWithdrawalStatus = async (withdrawalId, status, adminNote = null, payoutReference = null) => {
  try {
    const updateData = { status }
    if (adminNote) updateData.adminNote = adminNote
    if (payoutReference) updateData.payoutReference = payoutReference
    if (typeof status === 'object') {
      // If status is an object, merge it
      Object.assign(updateData, status)
    }
    return await apiClient.patch(`/admin/wallet/withdrawals/${withdrawalId}`, updateData)
  } catch (error) {
    console.error('Error updating withdrawal status:', error)
    throw error
  }
}

/**
 * Get admin wallet balance
 * @returns {Promise<object>} Wallet balance data
 */
export const getAdminWalletBalance = async () => {
  try {
    return await apiClient.get('/admin/wallet/balance')
  } catch (error) {
    console.error('Error fetching admin wallet balance:', error)
    throw error
  }
}

/**
 * Get admin wallet transactions
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Transactions data
 */
export const getAdminWalletTransactions = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/wallet/transactions', filters)
  } catch (error) {
    console.error('Error fetching admin wallet transactions:', error)
    throw error
  }
}

/**
 * Get admin appointments
 * @param {object} filters - Filter options (status, dateFrom, dateTo, etc.)
 * @returns {Promise<object>} Appointments data
 */
export const getAdminAppointments = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/appointments', filters)
  } catch (error) {
    console.error('Error fetching admin appointments:', error)
    throw error
  }
}

/**
 * Get admin appointment by ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object>} Appointment data
 */
export const getAdminAppointmentById = async (appointmentId) => {
  try {
    return await apiClient.get(`/admin/appointments/${appointmentId}`)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    throw error
  }
}

/**
 * Update admin appointment
 * @param {string} appointmentId - Appointment ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated appointment data
 */
export const updateAdminAppointment = async (appointmentId, updateData) => {
  try {
    return await apiClient.patch(`/admin/appointments/${appointmentId}`, updateData)
  } catch (error) {
    console.error('Error updating appointment:', error)
    throw error
  }
}

/**
 * Cancel admin appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object>} Response data
 */
export const cancelAdminAppointment = async (appointmentId) => {
  try {
    return await apiClient.delete(`/admin/appointments/${appointmentId}`)
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    throw error
  }
}

/**
 * Get admin orders
 * @param {object} filters - Filter options (status, type, dateFrom, dateTo, etc.)
 * @returns {Promise<object>} Orders data
 */
export const getAdminOrders = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/orders', filters)
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    throw error
  }
}

/**
 * Get admin order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Order data
 */
export const getAdminOrderById = async (orderId) => {
  try {
    return await apiClient.get(`/admin/orders/${orderId}`)
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

/**
 * Update admin order
 * @param {string} orderId - Order ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated order data
 */
export const updateAdminOrder = async (orderId, updateData) => {
  try {
    return await apiClient.patch(`/admin/orders/${orderId}`, updateData)
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

/**
 * Get admin requests
 * @param {object} filters - Filter options (status, type, etc.)
 * @returns {Promise<object>} Requests data
 */
export const getAdminRequests = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/requests', filters)
  } catch (error) {
    console.error('Error fetching admin requests:', error)
    throw error
  }
}

/**
 * Get admin request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<object>} Request data
 */
export const getAdminRequestById = async (requestId) => {
  try {
    return await apiClient.get(`/admin/requests/${requestId}`)
  } catch (error) {
    console.error('Error fetching request:', error)
    throw error
  }
}

/**
 * Accept admin request
 * @param {string} requestId - Request ID
 * @returns {Promise<object>} Response data
 */
export const acceptAdminRequest = async (requestId) => {
  try {
    return await apiClient.post(`/admin/requests/${requestId}/accept`)
  } catch (error) {
    console.error('Error accepting request:', error)
    throw error
  }
}

/**
 * Respond to admin request
 * @param {string} requestId - Request ID
 * @param {object} responseData - Response data
 * @returns {Promise<object>} Response data
 */
export const respondToAdminRequest = async (requestId, responseData) => {
  try {
    return await apiClient.post(`/admin/requests/${requestId}/respond`, responseData)
  } catch (error) {
    console.error('Error responding to request:', error)
    throw error
  }
}

/**
 * Cancel admin request
 * @param {string} requestId - Request ID
 * @param {string} reason - Cancel reason
 * @returns {Promise<object>} Response data
 */
export const cancelAdminRequest = async (requestId, reason) => {
  try {
    return await apiClient.post(`/admin/requests/${requestId}/cancel`, { reason })
  } catch (error) {
    console.error('Error cancelling request:', error)
    throw error
  }
}

/**
 * Get support tickets
 * @param {object} filters - Filter options (status, priority, userType, page, limit)
 * @returns {Promise<object>} Support tickets data
 */
export const getSupportTickets = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/support', filters)
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    throw error
  }
}

/**
 * Get support ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<object>} Support ticket data
 */
export const getSupportTicketById = async (ticketId) => {
  try {
    return await apiClient.get(`/admin/support/${ticketId}`)
  } catch (error) {
    console.error('Error fetching support ticket:', error)
    throw error
  }
}

/**
 * Respond to support ticket
 * @param {string} ticketId - Ticket ID
 * @param {object} responseData - Response data (message, attachments)
 * @returns {Promise<object>} Response data
 */
export const respondToSupportTicket = async (ticketId, responseData) => {
  try {
    return await apiClient.post(`/admin/support/${ticketId}/respond`, responseData)
  } catch (error) {
    console.error('Error responding to support ticket:', error)
    throw error
  }
}

/**
 * Update support ticket status
 * @param {string} ticketId - Ticket ID
 * @param {string} status - New status (open, in_progress, resolved, closed)
 * @param {string} adminNote - Optional admin note
 * @returns {Promise<object>} Response data
 */
export const updateSupportTicketStatus = async (ticketId, status, adminNote = '') => {
  try {
    return await apiClient.patch(`/admin/support/${ticketId}/status`, { status, adminNote })
  } catch (error) {
    console.error('Error updating support ticket status:', error)
    throw error
  }
}

/**
 * Get pharmacy medicines
 * @param {object} filters - Filter options (pharmacy, search, page, limit)
 * @returns {Promise<object>} Pharmacy medicines data
 */
export const getPharmacyMedicines = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/pharmacy-medicines', filters)
  } catch (error) {
    console.error('Error fetching pharmacy medicines:', error)
    throw error
  }
}

/**
 * Get pharmacy medicine by ID
 * @param {string} medicineId - Medicine ID
 * @returns {Promise<object>} Medicine data
 */
export const getPharmacyMedicineById = async (medicineId) => {
  try {
    return await apiClient.get(`/admin/pharmacy-medicines/${medicineId}`)
  } catch (error) {
    console.error('Error fetching pharmacy medicine:', error)
    throw error
  }
}

/**
 * Update pharmacy medicine
 * @param {string} medicineId - Medicine ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated medicine data
 */
export const updatePharmacyMedicine = async (medicineId, updateData) => {
  try {
    return await apiClient.patch(`/admin/pharmacy-medicines/${medicineId}`, updateData)
  } catch (error) {
    console.error('Error updating pharmacy medicine:', error)
    throw error
  }
}

/**
 * Get pharmacy inventory
 * @param {object} filters - Filter options (search, page, limit)
 * @param {AbortSignal} signal - Optional AbortSignal for request cancellation
 * @returns {Promise<object>} Pharmacy inventory data
 */
export const getPharmacyInventory = async (filters = {}, signal = null) => {
  try {
    return await apiClient.get('/admin/inventory/pharmacies', filters, signal)
  } catch (error) {
    // Don't log or throw errors for aborted requests
    if (error.name === 'AbortError') {
      throw error
    }
    console.error('Error fetching pharmacy inventory:', error)
    throw error
  }
}

/**
 * Get laboratory inventory
 * @param {object} filters - Filter options (search, page, limit)
 * @param {AbortSignal} signal - Optional AbortSignal for request cancellation
 * @returns {Promise<object>} Laboratory inventory data
 */
export const getLaboratoryInventory = async (filters = {}, signal = null) => {
  try {
    return await apiClient.get('/admin/inventory/laboratories', filters, signal)
  } catch (error) {
    // Don't log or throw errors for aborted requests
    if (error.name === 'AbortError') {
      throw error
    }
    console.error('Error fetching laboratory inventory:', error)
    throw error
  }
}

/**
 * Get pharmacy medicines by pharmacy ID
 * @param {string} pharmacyId - Pharmacy ID
 * @param {object} filters - Filter options (page, limit)
 * @param {AbortSignal} signal - Optional AbortSignal for request cancellation
 * @returns {Promise<object>} Pharmacy medicines data
 */
export const getPharmacyMedicinesByPharmacy = async (pharmacyId, filters = {}, signal = null) => {
  try {
    return await apiClient.get(`/admin/inventory/pharmacies/${pharmacyId}`, filters, signal)
  } catch (error) {
    // Don't log or throw errors for aborted requests
    if (error.name === 'AbortError') {
      throw error
    }
    console.error('Error fetching pharmacy medicines:', error)
    throw error
  }
}

/**
 * Get laboratory tests by laboratory ID
 * @param {string} laboratoryId - Laboratory ID
 * @param {object} filters - Filter options (page, limit)
 * @param {AbortSignal} signal - Optional AbortSignal for request cancellation
 * @returns {Promise<object>} Laboratory tests data
 */
export const getLaboratoryTestsByLaboratory = async (laboratoryId, filters = {}, signal = null) => {
  try {
    return await apiClient.get(`/admin/inventory/laboratories/${laboratoryId}`, filters, signal)
  } catch (error) {
    // Don't log or throw errors for aborted requests
    if (error.name === 'AbortError') {
      throw error
    }
    console.error('Error fetching laboratory tests:', error)
    throw error
  }
}

/**
 * Get all blogs
 */
export const getBlogs = async (filters = {}) => {
  try {
    return await apiClient.get('/admin/blogs', filters)
  } catch (error) {
    console.error('Error fetching blogs:', error)
    throw error
  }
}

/**
 * Get blog by ID
 */
export const getBlogById = async (blogId) => {
  try {
    return await apiClient.get(`/admin/blogs/${blogId}`)
  } catch (error) {
    console.error('Error fetching blog:', error)
    throw error
  }
}

/**
 * Create a new blog
 */
export const createBlog = async (blogData) => {
  try {
    return await apiClient.post('/admin/blogs', blogData)
  } catch (error) {
    console.error('Error creating blog:', error)
    throw error
  }
}

/**
 * Update an existing blog
 */
export const updateBlog = async (blogId, blogData) => {
  try {
    return await apiClient.put(`/admin/blogs/${blogId}`, blogData)
  } catch (error) {
    console.error('Error updating blog:', error)
    throw error
  }
}

/**
 * Delete a blog
 */
export const deleteBlog = async (blogId) => {
  try {
    return await apiClient.delete(`/admin/blogs/${blogId}`)
  } catch (error) {
    console.error('Error deleting blog:', error)
    throw error
  }
}

export default {
  loginAdmin,
  storeAdminTokens,
  clearAdminTokens,
  getDashboardStats,
  getDashboardChartData,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
  getPharmacies,
  getPharmacyById,
  verifyPharmacy,
  rejectPharmacy,
  getNurses,
  getNurseById,
  verifyNurse,
  rejectNurse,
  getLaboratories,
  getLaboratoryById,
  verifyLaboratory,
  rejectLaboratory,
  getRecentActivities,
  getPendingVerifications,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  getAdminSettings,
  updateAdminSettings,
  logoutAdmin,
  forgotPassword,
  verifyPasswordOtp,
  resetPassword,
  getAdminWalletOverview,
  getProviderSummaries,
  getWithdrawals,
  updateWithdrawalStatus,
  getRevenueOverview,
  getAdminAppointments,
  getAdminAppointmentById,
  updateAdminAppointment,
  cancelAdminAppointment,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrder,
  getAdminRequests,
  getAdminRequestById,
  acceptAdminRequest,
  respondToAdminRequest,
  cancelAdminRequest,
  getSupportTickets,
  getSupportTicketById,
  respondToSupportTicket,
  updateSupportTicketStatus,
  getPharmacyMedicines,
  getPharmacyMedicineById,
  updatePharmacyMedicine,
  getPharmacyInventory,
  getLaboratoryInventory,
  getPharmacyMedicinesByPharmacy,
  getLaboratoryTestsByLaboratory,
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
}

