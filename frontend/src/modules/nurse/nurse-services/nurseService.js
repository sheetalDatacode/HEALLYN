import { ApiClient } from '../../../utils/apiClient'

// Create nurse-specific API client
const apiClient = new ApiClient('nurse')

/**
 * Request OTP for nurse login
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const requestLoginOtp = async (phone) => {
  try {
    const response = await apiClient.post('/nurses/auth/login/otp', { phone })
    return response
  } catch (error) {
    console.error('Error requesting OTP:', error)
    return {
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
    }
  }
}

/**
 * Login nurse with OTP
 * @param {Object} credentials - { phone, otp }
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const loginNurse = async (credentials) => {
  try {
    const response = await apiClient.post('/nurses/auth/login', credentials)
    return response
  } catch (error) {
    console.error('Error logging in:', error)
    return {
      success: false,
      message: error.message || 'Login failed. Please check your credentials.',
    }
  }
}

/**
 * Signup new nurse
 * @param {Object} signupData - Nurse signup data
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const signupNurse = async (signupData) => {
  try {
    const response = await apiClient.post('/nurses/auth/signup', signupData)
    return response
  } catch (error) {
    console.error('Error signing up:', error)
    return {
      success: false,
      message: error.message || 'Signup failed. Please try again.',
    }
  }
}

/**
 * Store nurse tokens in storage
 * @param {Object} tokens - { accessToken, refreshToken }
 * @param {boolean} remember - Whether to use localStorage or sessionStorage
 */
export const storeNurseTokens = (tokens, remember = true) => {
  const storage = remember ? localStorage : sessionStorage
  if (tokens.accessToken) {
    storage.setItem('nurseAccessToken', tokens.accessToken)
  }
  if (tokens.refreshToken) {
    storage.setItem('nurseRefreshToken', tokens.refreshToken)
  }
  if (tokens.token) {
    storage.setItem('nurseAuthToken', tokens.token)
  }
}

/**
 * Clear nurse tokens from storage
 */
export const clearNurseTokens = () => {
  localStorage.removeItem('nurseAuthToken')
  localStorage.removeItem('nurseAccessToken')
  localStorage.removeItem('nurseRefreshToken')
  sessionStorage.removeItem('nurseAuthToken')
  sessionStorage.removeItem('nurseAccessToken')
  sessionStorage.removeItem('nurseRefreshToken')
}

/**
 * Get nurse profile
 * @returns {Promise<object>} Nurse profile data
 */
export const getNurseProfile = async () => {
  try {
    return await apiClient.get('/nurses/auth/me')
  } catch (error) {
    console.error('Error fetching nurse profile:', error)
    throw error
  }
}

/**
 * Update nurse profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updateNurseProfile = async (profileData) => {
  try {
    return await apiClient.put('/nurses/auth/me', profileData)
  } catch (error) {
    console.error('Error updating nurse profile:', error)
    throw error
  }
}

/**
 * Logout nurse
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const logoutNurse = async () => {
  try {
    await apiClient.post('/nurses/auth/logout')
    clearNurseTokens()
    return { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Error logging out:', error)
    clearNurseTokens()
    return { success: true, message: 'Logged out successfully' }
  }
}

/**
 * Get nurse bookings with pagination
 * @param {Object} params - { page, limit, period, search }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getNurseBookings = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/bookings', params)
    return response
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch bookings.',
    }
  }
}

/**
 * Get nurse transactions with pagination
 * @param {Object} params - { page, limit, type }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getNurseTransactions = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/transactions', params)
    return response
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch transactions.',
    }
  }
}

/**
 * Get nurse wallet balance
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getNurseWalletBalance = async () => {
  try {
    const response = await apiClient.get('/nurses/wallet/balance')
    return response
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch wallet balance.',
    }
  }
}

/**
 * Get nurse wallet transactions with pagination
 * @param {Object} params - { page, limit }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getNurseWalletTransactions = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/wallet/transactions', params)
    return response
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch wallet transactions.',
    }
  }
}

/**
 * Get nurse wallet earnings with pagination
 * @param {Object} params - { page, limit, filter }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getNurseWalletEarnings = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/wallet/earnings', params)
    return response
  } catch (error) {
    console.error('Error fetching wallet earnings:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch wallet earnings.',
    }
  }
}

/**
 * Get nurse withdrawal history with pagination
 * @param {Object} params - { page, limit }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getNurseWithdrawalHistory = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/wallet/withdrawals', params)
    return response
  } catch (error) {
    console.error('Error fetching withdrawal history:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch withdrawal history.',
    }
  }
}

/**
 * Request withdrawal
 * @param {Object} withdrawalData - { amount, paymentMethod, ... }
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const requestNurseWithdrawal = async (withdrawalData) => {
  try {
    const response = await apiClient.post('/nurses/wallet/withdraw', withdrawalData)
    return response
  } catch (error) {
    console.error('Error requesting withdrawal:', error)
    return {
      success: false,
      message: error.message || 'Failed to request withdrawal.',
    }
  }
}

/**
 * Get support tickets with pagination
 * @param {Object} params - { page, limit }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getSupportTickets = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/support', params)
    return response
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch support tickets.',
    }
  }
}

/**
 * Get support history with pagination
 * @param {Object} params - { page, limit }
 * @returns {Promise<{success: boolean, data?: any}>}
 */
export const getSupportHistory = async (params = {}) => {
  try {
    const response = await apiClient.get('/nurses/support/history', params)
    return response
  } catch (error) {
    console.error('Error fetching support history:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch support history.',
    }
  }
}

/**
 * Create support ticket
 * @param {Object} ticketData - { subject, message, priority }
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
export const createSupportTicket = async (ticketData) => {
  try {
    const response = await apiClient.post('/nurses/support', ticketData)
    return response
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return {
      success: false,
      message: error.message || 'Failed to create support ticket.',
    }
  }
}

