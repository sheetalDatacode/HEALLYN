// Laboratory service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create laboratory-specific API client
const apiClient = new ApiClient('laboratory')

/**
 * Laboratory signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with laboratory
 */
export const signupLaboratory = async (signupData) => {
  try {
    const data = await apiClient.post('/laboratories/auth/signup', signupData)
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
    const data = await apiClient.post('/laboratories/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with laboratory and tokens
 */
export const loginLaboratory = async (credentials) => {
  try {
    const data = await apiClient.post('/laboratories/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store laboratory tokens after login
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storeLaboratoryTokens = (tokens, remember = true) => {
  storeTokens('laboratory', tokens, remember)
}

/**
 * Clear laboratory tokens on logout
 */
export const clearLaboratoryTokens = () => {
  clearTokens('laboratory')
}

/**
 * Get laboratory profile
 * @returns {Promise<object>} Laboratory profile data
 */
export const getLaboratoryProfile = async () => {
  try {
    const response = await apiClient.get('/laboratories/auth/me')
    // Ensure response has expected format
    if (response && !response.success && response.data) {
      return { success: true, data: response.data }
    }
    return response
  } catch (error) {
    console.error('Error fetching laboratory profile:', error)
    // Return error in a format the component can handle
    return {
      success: false,
      message: error.message || 'Failed to fetch profile',
      error: error
    }
  }
}

/**
 * Update laboratory profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updateLaboratoryProfile = async (profileData) => {
  try {
    // Backend uses PUT for /laboratories/auth/me
    return await apiClient.put('/laboratories/auth/me', profileData)
  } catch (error) {
    console.error('Error updating laboratory profile:', error)
    // Return error in a format the component can handle
    return {
      success: false,
      message: error.message || 'Failed to update profile',
      error: error
    }
  }
}

/**
 * Laboratory logout
 * @returns {Promise<object>} Response data
 */
export const logoutLaboratory = async () => {
  try {
    // Call backend logout API to blacklist tokens
    await apiClient.post('/laboratories/auth/logout').catch((error) => {
      // Even if backend call fails, we still clear tokens on frontend
      console.error('Error calling logout API:', error)
    })

    // Clear all tokens from storage
    clearLaboratoryTokens()

    return { success: true, message: 'Logout successful' }
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if there's an error
    clearLaboratoryTokens()
    throw error
  }
}

/**
 * Get laboratory dashboard data
 * @returns {Promise<object>} Dashboard data
 */
export const getLaboratoryDashboard = async () => {
  try {
    return await apiClient.get('/laboratory/dashboard/stats')
  } catch (error) {
    console.error('Error fetching laboratory dashboard:', error)
    throw error
  }
}

/**
 * Get laboratory orders/leads
 * @param {object} filters - Filter options (status, date, etc.)
 * @returns {Promise<object>} Orders data
 */
export const getLaboratoryOrders = async (filters = {}) => {
  try {
    return await apiClient.get('/labs/leads', filters)
  } catch (error) {
    console.error('Error fetching laboratory orders:', error)
    throw error
  }
}

/**
 * Get laboratory available tests
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Tests data
 */
export const getLaboratoryTests = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/tests', filters)
  } catch (error) {
    console.error('Error fetching laboratory tests:', error)
    throw error
  }
}

/**
 * Add laboratory test
 * @param {object} testData - Test data
 * @returns {Promise<object>} Created test data
 */
export const addLaboratoryTest = async (testData) => {
  try {
    return await apiClient.post('/laboratory/tests', testData)
  } catch (error) {
    console.error('Error adding test:', error)
    throw error
  }
}

/**
 * Update laboratory test
 * @param {string} testId - Test ID
 * @param {object} testData - Test data
 * @returns {Promise<object>} Updated test data
 */
export const updateLaboratoryTest = async (testId, testData) => {
  try {
    return await apiClient.patch(`/laboratory/tests/${testId}`, testData)
  } catch (error) {
    console.error('Error updating test:', error)
    throw error
  }
}

/**
 * Delete laboratory test
 * @param {string} testId - Test ID
 * @returns {Promise<object>} Deletion result
 */
export const deleteLaboratoryTest = async (testId) => {
  try {
    return await apiClient.delete(`/laboratory/tests/${testId}`)
  } catch (error) {
    console.error('Error deleting test:', error)
    throw error
  }
}

/**
 * Get laboratory patients
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Patients data
 */
export const getLaboratoryPatients = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/patients', filters)
  } catch (error) {
    console.error('Error fetching laboratory patients:', error)
    throw error
  }
}

/**
 * Get laboratory request orders
 * @param {object} filters - Filter options (status, page, limit)
 * @returns {Promise<object>} Request orders data
 */
export const getLaboratoryRequestOrders = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/request-orders', filters)
  } catch (error) {
    console.error('Error fetching laboratory request orders:', error)
    throw error
  }
}

/**
 * Get laboratory request order by ID
 * @param {string} requestId - Request order ID
 * @returns {Promise<object>} Request order data
 */
export const getLaboratoryRequestOrderById = async (requestId) => {
  try {
    return await apiClient.get(`/laboratory/request-orders/${requestId}`)
  } catch (error) {
    console.error('Error fetching laboratory request order:', error)
    throw error
  }
}

/**
 * Accept/Confirm laboratory request order
 * @param {string} requestId - Request order ID
 * @returns {Promise<object>} Confirmed order data
 */
export const confirmLaboratoryRequestOrder = async (requestId) => {
  try {
    return await apiClient.patch(`/laboratory/request-orders/${requestId}/confirm`)
  } catch (error) {
    console.error('Error confirming laboratory request order:', error)
    throw error
  }
}

/**
 * Generate bill for laboratory request order
 * @param {string} requestId - Request order ID
 * @param {object} billData - Bill data (testAmount, deliveryCharge, additionalCharges)
 * @returns {Promise<object>} Generated bill data
 */
export const generateLaboratoryBill = async (requestId, billData) => {
  try {
    return await apiClient.post(`/laboratory/request-orders/${requestId}/bill`, billData)
  } catch (error) {
    console.error('Error generating laboratory bill:', error)
    throw error
  }
}

/**
 * Update laboratory request order status
 * @param {string} requestId - Request order ID
 * @param {string} status - New status (accepted, rejected, completed, etc.)
 * @returns {Promise<object>} Updated order data
 */
export const updateLaboratoryRequestOrderStatus = async (requestId, status) => {
  try {
    return await apiClient.patch(`/laboratory/request-orders/${requestId}/status`, { status })
  } catch (error) {
    console.error('Error updating laboratory request order status:', error)
    throw error
  }
}

/**
 * Update laboratory order status
 * @param {string} orderId - Order ID
 * @param {object} updateData - Update data (status, etc.)
 * @returns {Promise<object>} Updated order data
 */
export const updateLaboratoryOrder = async (orderId, updateData) => {
  try {
    // Use /labs/leads/:id/status for updating orders (since getLaboratoryOrders uses /labs/leads)
    return await apiClient.patch(`/labs/leads/${orderId}/status`, updateData)
  } catch (error) {
    // If 404/Not Found, try specific request orders endpoint as fallback
    // This handles cases where the order is actually a request order but exposed via leads
    const isNotFound = error.message && (
      error.message.includes('404') ||
      error.message.toLowerCase().includes('not found') ||
      error.message.toLowerCase().includes('order not found')
    )

    if (isNotFound && updateData && updateData.status) {
      
      return await updateLaboratoryRequestOrderStatus(orderId, updateData.status)
    }

    console.error('Error updating laboratory order:', error)
    throw error
  }
}

/**
 * Get laboratory wallet balance
 * @returns {Promise<object>} Wallet balance data
 */
export const getLaboratoryWalletBalance = async () => {
  try {
    return await apiClient.get('/laboratory/wallet/balance')
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    throw error
  }
}

/**
 * Get laboratory wallet earnings
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Earnings data
 */
export const getLaboratoryWalletEarnings = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/wallet/earnings', filters)
  } catch (error) {
    console.error('Error fetching wallet earnings:', error)
    throw error
  }
}

/**
 * Get laboratory wallet transactions
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Transactions data
 */
export const getLaboratoryWalletTransactions = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/wallet/transactions', filters)
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    throw error
  }
}

/**
 * Get laboratory withdrawals
 * @param {object} filters - Optional filters (status, page, limit)
 * @returns {Promise<object>} Withdrawals data
 */
export const getLaboratoryWithdrawals = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/wallet/withdrawals', filters)
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
export const requestLaboratoryWithdrawal = async (withdrawalData) => {
  try {
    return await apiClient.post('/laboratory/wallet/withdraw', withdrawalData)
  } catch (error) {
    console.error('Error requesting withdrawal:', error)
    throw error
  }
}

/**
 * Get laboratory reports
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Reports data
 */
export const getLaboratoryReports = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/reports', filters)
  } catch (error) {
    console.error('Error fetching laboratory reports:', error)
    throw error
  }
}

/**
 * Create laboratory report
 * @param {object} reportData - Report data (orderId, testName, results, notes)
 * @returns {Promise<object>} Created report data
 */
export const createLaboratoryReport = async (reportData, pdfFile = null) => {
  try {
    // If PDF file is provided, upload it first, then create report with URL
    let pdfFileUrl = null
    if (pdfFile) {
      const uploadResponse = await uploadLaboratoryReport(pdfFile)
      if (uploadResponse.success && uploadResponse.data?.url) {
        pdfFileUrl = uploadResponse.data.url
      }
    }

    // Create report with PDF URL or file data
    const formData = new FormData()
    formData.append('orderId', reportData.orderId)
    formData.append('testName', reportData.testName || 'Lab Test Report')
    formData.append('results', JSON.stringify(reportData.results || []))
    formData.append('notes', reportData.notes || '')
    if (pdfFile && !pdfFileUrl) {
      // If file not uploaded separately, send it with report creation
      formData.append('pdf', pdfFile)
    } else if (pdfFileUrl) {
      formData.append('pdfFileUrl', pdfFileUrl)
    }

    return await apiClient.upload('/laboratory/reports', formData)
  } catch (error) {
    console.error('Error creating laboratory report:', error)
    throw error
  }
}

/**
 * Share laboratory report with patient and admin
 * @param {string} reportId - Report ID
 * @returns {Promise<object>} Response data
 */
export const shareLaboratoryReport = async (reportId) => {
  try {
    // Update report status to shared
    return await apiClient.patch(`/laboratory/reports/${reportId}`, {
      status: 'shared',
    })
  } catch (error) {
    console.error('Error sharing laboratory report:', error)
    throw error
  }
}

/**
 * Get laboratory requests
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Requests data
 */
export const getLaboratoryRequests = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/requests', filters)
  } catch (error) {
    console.error('Error fetching laboratory requests:', error)
    throw error
  }
}

/**
 * Get laboratory request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<object>} Request data
 */
export const getLaboratoryRequestById = async (requestId) => {
  try {
    return await apiClient.get(`/laboratory/requests/${requestId}`)
  } catch (error) {
    console.error('Error fetching laboratory request:', error)
    throw error
  }
}

/**
 * Get support tickets
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Support tickets data
 */
export const getSupportTickets = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/support', filters)
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
    return await apiClient.get('/laboratory/support/history', filters)
  } catch (error) {
    console.error('Error fetching support history:', error)
    throw error
  }
}

/**
 * Create support ticket
 * @param {object} ticketData - Support ticket data
 * @returns {Promise<object>} Created ticket data
 */
export const createSupportTicket = async (ticketData) => {
  try {
    return await apiClient.post('/laboratory/support', ticketData)
  } catch (error) {
    console.error('Error creating support ticket:', error)
    throw error
  }
}

/**
 * Get patient statistics
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Patient statistics data
 */
export const getPatientStatistics = async (filters = {}) => {
  try {
    return await apiClient.get('/laboratory/patients/statistics', filters)
  } catch (error) {
    console.error('Error fetching patient statistics:', error)
    throw error
  }
}

/**
 * Get patient orders
 * @param {string} patientId - Patient ID
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Patient orders data
 */
export const getPatientOrders = async (patientId, filters = {}) => {
  try {
    return await apiClient.get(`/laboratory/patients/${patientId}/orders`, filters)
  } catch (error) {
    console.error('Error fetching patient orders:', error)
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
    return await apiClient.get(`/laboratory/patients/${patientId}`)
  } catch (error) {
    console.error('Error fetching patient:', error)
    throw error
  }
}

/**
 * Upload profile image
 * @param {File} file - Image file
 * @returns {Promise<object>} Response data with URL
 */
export const uploadLaboratoryProfileImage = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const data = await apiClient.upload('/laboratory/upload/profile-image', formData)
    return data
  } catch (error) {
    console.error('Error uploading profile image:', error)
    throw error
  }
}

/**
 * Upload lab report (PDF)
 * @param {File} file - PDF file
 * @returns {Promise<object>} Response data with URL
 */
export const uploadLaboratoryReport = async (file) => {
  try {
    const formData = new FormData()
    formData.append('pdf', file)

    const data = await apiClient.upload('/laboratory/upload/report', formData)
    return data
  } catch (error) {
    console.error('Error uploading report:', error)
    throw error
  }
}


