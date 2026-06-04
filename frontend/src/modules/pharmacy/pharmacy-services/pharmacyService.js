// Pharmacy service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create pharmacy-specific API client
const apiClient = new ApiClient('pharmacy')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

/**
 * Get authentication token from storage
 */
const getAuthToken = () => {
  return localStorage.getItem('pharmacyAuthToken') || sessionStorage.getItem('pharmacyAuthToken')
}

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

/**
 * Fetch pharmacies list
 */
export const fetchPharmacies = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.deliveryOption) queryParams.append('deliveryOption', filters.deliveryOption)
    if (filters.radius) queryParams.append('radius', filters.radius)
    if (filters.approvedOnly) queryParams.append('approvedOnly', filters.approvedOnly)

    const response = await fetch(`${API_BASE_URL}/pharmacies?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch pharmacies: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    throw error
  }
}

/**
 * Get pharmacy details by ID
 */
export const getPharmacyById = async (pharmacyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacies/${pharmacyId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch pharmacy: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching pharmacy:', error)
    throw error
  }
}

/**
 * Get pharmacy orders/leads
 */
export const getPharmacyOrders = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/orders', filters)
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

/**
 * Get pharmacy request orders
 */
export const getPharmacyRequestOrders = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/request-orders', filters)
  } catch (error) {
    console.error('Error fetching request orders:', error)
    throw error
  }
}

/**
 * Get pharmacy request order by ID
 */
export const getPharmacyRequestOrderById = async (orderId) => {
  try {
    return await apiClient.get(`/pharmacy/request-orders/${orderId}`)
  } catch (error) {
    console.error('Error fetching request order:', error)
    throw error
  }
}

/**
 * Confirm pharmacy request order
 */
export const confirmPharmacyRequestOrder = async (orderId) => {
  try {
    return await apiClient.patch(`/pharmacy/request-orders/${orderId}/confirm`)
  } catch (error) {
    console.error('Error confirming request order:', error)
    throw error
  }
}

/**
 * Update pharmacy request order status
 */
export const updatePharmacyRequestOrderStatus = async (orderId, status) => {
  try {
    return await apiClient.patch(`/pharmacy/request-orders/${orderId}/status`, { status })
  } catch (error) {
    console.error('Error updating request order status:', error)
    throw error
  }
}

/**
 * Get pharmacy medicines
 */
export const getPharmacyMedicines = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/medicines', filters)
  } catch (error) {
    console.error('Error fetching medicines:', error)
    throw error
  }
}

/**
 * Add pharmacy medicine
 */
export const addPharmacyMedicine = async (medicineData) => {
  try {
    return await apiClient.post('/pharmacy/medicines', medicineData)
  } catch (error) {
    console.error('Error adding medicine:', error)
    throw error
  }
}

/**
 * Update pharmacy medicine
 */
export const updatePharmacyMedicine = async (medicineId, medicineData) => {
  try {
    return await apiClient.patch(`/pharmacy/medicines/${medicineId}`, medicineData)
  } catch (error) {
    console.error('Error updating medicine:', error)
    throw error
  }
}

/**
 * Delete pharmacy medicine
 */
export const deletePharmacyMedicine = async (medicineId) => {
  try {
    return await apiClient.delete(`/pharmacy/medicines/${medicineId}`)
  } catch (error) {
    console.error('Error deleting medicine:', error)
    throw error
  }
}

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    return await apiClient.patch(`/pharmacy/orders/${orderId}/status`, { status })
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

/**
 * Get pharmacy wallet balance
 * @returns {Promise<object>} Wallet balance data
 */
export const getPharmacyWalletBalance = async () => {
  try {
    return await apiClient.get('/pharmacy/wallet/balance')
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    throw error
  }
}

/**
 * Get pharmacy wallet earnings
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Earnings data
 */
export const getPharmacyWalletEarnings = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/wallet/earnings', filters)
  } catch (error) {
    console.error('Error fetching wallet earnings:', error)
    throw error
  }
}

/**
 * Get pharmacy wallet transactions
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Transactions data
 */
export const getPharmacyWalletTransactions = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/wallet/transactions', filters)
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    throw error
  }
}

/**
 * Get pharmacy withdrawals
 * @param {object} filters - Filter options (status, page, limit)
 * @returns {Promise<object>} Withdrawals data
 */
export const getPharmacyWithdrawals = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/wallet/withdrawals', filters)
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    throw error
  }
}

/**
 * Request withdrawal
 * @param {object} withdrawalData - Withdrawal request data
 * @returns {Promise<object>} Created withdrawal request data
 */
export const requestPharmacyWithdrawal = async (withdrawalData) => {
  try {
    return await apiClient.post('/pharmacy/wallet/withdraw', withdrawalData)
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
    return await apiClient.post('/pharmacy/support', ticketData)
  } catch (error) {
    console.error('Error creating support ticket:', error)
    throw error
  }
}

/**
 * Get support tickets
 * @param {object} filters - Optional filters (status, priority, page, limit)
 * @returns {Promise<object>} Support tickets data
 */
export const getSupportTickets = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/support', filters)
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
    return await apiClient.get('/pharmacy/support/history', filters)
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

    const data = await apiClient.upload('/pharmacy/upload/profile-image', formData)
    return data
  } catch (error) {
    console.error('Error uploading profile image:', error)
    throw error
  }
}

/**
 * Get pharmacy patients
 */
export const getPharmacyPatients = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.page) queryParams.append('page', filters.page)

    const response = await fetch(`${API_BASE_URL}/pharmacy/patients?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching patients:', error)
    throw error
  }
}

/**
 * Get pharmacy patient statistics
 */
export const getPharmacyPatientStatistics = async () => {
  try {
    return await apiClient.get('/pharmacy/patients/statistics')
  } catch (error) {
    console.error('Error fetching patient statistics:', error)
    throw error
  }
}

/**
 * Get pharmacy services
 */
export const getPharmacyServices = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/services', filters)
  } catch (error) {
    console.error('Error fetching pharmacy services:', error)
    throw error
  }
}

/**
 * Add pharmacy service
 */
export const addPharmacyService = async (serviceData) => {
  try {
    return await apiClient.post('/pharmacy/services', serviceData)
  } catch (error) {
    console.error('Error adding pharmacy service:', error)
    throw error
  }
}

/**
 * Update pharmacy service
 */
export const updatePharmacyService = async (serviceId, serviceData) => {
  try {
    return await apiClient.patch(`/pharmacy/services/${serviceId}`, serviceData)
  } catch (error) {
    console.error('Error updating pharmacy service:', error)
    throw error
  }
}

/**
 * Delete pharmacy service
 */
export const deletePharmacyService = async (serviceId) => {
  try {
    return await apiClient.delete(`/pharmacy/services/${serviceId}`)
  } catch (error) {
    console.error('Error deleting pharmacy service:', error)
    throw error
  }
}

/**
 * Toggle pharmacy service availability
 */
export const togglePharmacyService = async (serviceId) => {
  try {
    return await apiClient.patch(`/pharmacy/services/${serviceId}/toggle`)
  } catch (error) {
    console.error('Error toggling pharmacy service:', error)
    throw error
  }
}

/**
 * Get pharmacy prescriptions
 */
export const getPharmacyPrescriptions = async (filters = {}) => {
  try {
    return await apiClient.get('/pharmacy/prescriptions', filters)
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    throw error
  }
}

/**
 * Pharmacy signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with pharmacy
 */
export const signupPharmacy = async (signupData) => {
  try {
    const data = await apiClient.post('/pharmacies/auth/signup', signupData)
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
    const data = await apiClient.post('/pharmacies/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with pharmacy and tokens
 */
export const loginPharmacy = async (credentials) => {
  try {
    const data = await apiClient.post('/pharmacies/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store pharmacy tokens after login
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storePharmacyTokens = (tokens, remember = true) => {
  storeTokens('pharmacy', tokens, remember)
}

/**
 * Clear pharmacy tokens on logout
 */
export const clearPharmacyTokens = () => {
  clearTokens('pharmacy')
}

/**
 * Get pharmacy profile
 * @returns {Promise<object>} Pharmacy profile data
 */
export const getPharmacyProfile = async () => {
  try {
    return await apiClient.get('/pharmacies/auth/me')
  } catch (error) {
    console.error('Error fetching pharmacy profile:', error)
    throw error
  }
}

/**
 * Update pharmacy profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updatePharmacyProfile = async (profileData) => {
  try {
    return await apiClient.put('/pharmacies/auth/me', profileData)
  } catch (error) {
    console.error('Error updating pharmacy profile:', error)
    throw error
  }
}

/**
 * Pharmacy logout
 * @returns {Promise<object>} Response data
 */
export const logoutPharmacy = async () => {
  try {
    // Call backend logout API to blacklist tokens
    await apiClient.post('/pharmacies/auth/logout').catch((error) => {
      // Even if backend call fails, we still clear tokens on frontend
      console.error('Error calling logout API:', error)
    })

    // Clear all tokens from storage
    clearPharmacyTokens()

    return { success: true, message: 'Logout successful' }
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if there's an error
    clearPharmacyTokens()
    throw error
  }
}


/**
 * Get pharmacy dashboard data
 * @returns {Promise<object>} Dashboard data
 */
export const getPharmacyDashboard = async () => {
  try {
    return await apiClient.get('/pharmacy/dashboard/stats')
  } catch (error) {
    console.error('Error fetching pharmacy dashboard:', error)
    throw error
  }
}

export default {
  fetchPharmacies,
  getPharmacyById,
  getPharmacyOrders,
  updateOrderStatus,
  getPharmacyPatients,
  loginPharmacy,
}


























