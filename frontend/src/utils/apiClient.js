/**
 * Base API Client for making HTTP requests
 * This is a reusable utility that can be used by all modules
 * 
 * Usage:
 * import apiClient from '@/utils/apiClient'
 * const response = await apiClient.post('/admin/auth/login', data)
 */

// Get API base URL from environment variable
// For development: http://localhost:5000/api
// For production: https://your-backend-domain.com/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

/**
 * Get authentication token from storage
 * @param {string} module - Module name (admin, patient, doctor, etc.)
 * @returns {string|null} Auth token or null
 */
const getAuthToken = (module = 'admin') => {
  // Try localStorage first, then sessionStorage
  // Check all possible token keys
  return (
    localStorage.getItem(`${module}AuthToken`) ||
    localStorage.getItem(`${module}AccessToken`) ||
    sessionStorage.getItem(`${module}AuthToken`) ||
    sessionStorage.getItem(`${module}AccessToken`) ||
    null
  )
}

/**
 * Get refresh token from storage
 * @param {string} module - Module name
 * @returns {string|null} Refresh token or null
 */
const getRefreshToken = (module = 'admin') => {
  return (
    localStorage.getItem(`${module}RefreshToken`) ||
    sessionStorage.getItem(`${module}RefreshToken`) ||
    null
  )
}

/**
 * Get auth headers for API requests
 * @param {string} module - Module name
 * @param {object} additionalHeaders - Additional headers to include
 * @returns {object} Headers object
 */
const getAuthHeaders = (module = 'admin', additionalHeaders = {}) => {
  const token = getAuthToken(module)
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...additionalHeaders,
  }
}

/**
 * Store tokens in storage
 * @param {string} module - Module name
 * @param {object} tokens - Tokens object with accessToken and refreshToken
 * @param {boolean} remember - Whether to use localStorage (true) or sessionStorage (false)
 */
const storeTokens = (module, tokens, remember = true) => {
  const storage = remember ? localStorage : sessionStorage
  if (tokens.accessToken) {
    storage.setItem(`${module}AuthToken`, tokens.accessToken)
    storage.setItem(`${module}AccessToken`, tokens.accessToken)
  }
  if (tokens.refreshToken) {
    storage.setItem(`${module}RefreshToken`, tokens.refreshToken)
  }
}

/**
 * Clear tokens from storage
 * @param {string} module - Module name
 */
const clearTokens = (module = 'admin') => {
  localStorage.removeItem(`${module}AuthToken`)
  localStorage.removeItem(`${module}AccessToken`)
  localStorage.removeItem(`${module}RefreshToken`)
  sessionStorage.removeItem(`${module}AuthToken`)
  sessionStorage.removeItem(`${module}AccessToken`)
  sessionStorage.removeItem(`${module}RefreshToken`)
}

/**
 * Map module name to API endpoint path
 * @param {string} module - Module name (patient, doctor, etc.)
 * @returns {string} API endpoint path (patients, doctors, etc.)
 */
const getModuleApiPath = (module) => {
  const moduleMap = {
    'patient': 'patients',
    'doctor': 'doctors',
    'pharmacy': 'pharmacies',
    'laboratory': 'laboratories',
    'nurse': 'nurses',
    'admin': 'admin',
  }
  return moduleMap[module] || module
}

/**
 * Refresh access token using refresh token
 * @param {string} module - Module name
 * @returns {Promise<object>} New tokens
 */
const refreshAccessToken = async (module = 'admin') => {
  const refreshToken = getRefreshToken(module)

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const apiPath = getModuleApiPath(module)

  try {
    const response = await fetch(`${API_BASE_URL}/${apiPath}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()

    if (data.success && data.data) {
      // Store new tokens
      const remember = !!localStorage.getItem(`${module}AuthToken`)
      storeTokens(module, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }, remember)

      return data.data
    }

    throw new Error('Invalid refresh response')
  } catch (error) {
    // Clear tokens on refresh failure
    clearTokens(module)
    throw error
  }
}

/**
 * Make API request with automatic token refresh on 401
 * @param {string} endpoint - API endpoint (e.g., '/admin/auth/login')
 * @param {object} options - Fetch options (can include signal for AbortController)
 * @param {string} module - Module name for token management
 * @returns {Promise<Response>} Fetch response
 */
const apiRequest = async (endpoint, options = {}, module = 'admin') => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  // Check if this is a public auth endpoint (login/signup) that shouldn't require token
  const isAuthEndpoint = endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/login/otp') ||
    endpoint.includes('/auth/request-otp') ||
    endpoint.includes('/auth/signup') ||
    endpoint.includes('/auth/forgot-password') ||
    endpoint.includes('/auth/verify-otp') ||
    endpoint.includes('/auth/reset-password') ||
    endpoint.includes('/auth/check-exists')

  // Check if this is a public discovery endpoint (doctors, pharmacies, laboratories, specialties)
  // NOTE: Only patient-facing discovery endpoints are public, admin endpoints require auth
  const isPublicDiscoveryEndpoint = (endpoint.includes('/patients/doctors') ||
    endpoint.includes('/patients/specialties') ||
    endpoint.includes('/patients/pharmacies') ||
    endpoint.includes('/patients/laboratories') ||
    endpoint.includes('/specialties')) &&
    !endpoint.includes('/admin/')

  // For protected endpoints (not auth or public discovery), check token before making request
  if (!isAuthEndpoint && !isPublicDiscoveryEndpoint) {
    const token = getAuthToken(module)
    if (!token) {
      // No token, clear any stale tokens and redirect immediately
      clearTokens(module)
      const loginPath = module === 'admin' ? '/admin/login' : `/${module}/login`
      if (window.location.pathname !== loginPath && !window.location.pathname.includes('/login')) {
        window.location.href = loginPath
      }
      throw new Error('Authentication token missing. Please login again.')
    }
  }

  // Check if body is FormData
  const isFormData = options.body instanceof FormData
  
  // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
  let headers = {};
  if (isAuthEndpoint || isPublicDiscoveryEndpoint) {
    if (!isFormData) {
      headers = { 'Content-Type': 'application/json', ...options.headers };
    } else {
      headers = { ...options.headers };
    }
  } else {
    const authHeaders = getAuthHeaders(module, {});
    if (!isFormData) {
      headers = { ...authHeaders, ...options.headers };
    } else {
      // For FormData, don't include Content-Type in auth headers
      headers = { ...authHeaders, ...options.headers };
      delete headers['Content-Type'];
    }
  }
  
  const config = {
    method: options.method || 'GET',
    headers: headers,
    body: options.body, // Explicitly set body
    signal: options.signal, // Support AbortController signal
  }

  try {
    let response = await fetch(url, config)

    // Handle 429 Too Many Requests with retry logic
    if (response.status === 429) {
      // Get retry-after header if available, otherwise use exponential backoff
      const retryAfter = response.headers.get('Retry-After')
      let delay = 1000 // Start with 1 second
      
      if (retryAfter) {
        delay = parseInt(retryAfter) * 1000
      } else {
        // Exponential backoff: 1s, 2s, 4s (max 3 retries)
        delay = 1000
      }
      
      // Wait before retrying (only retry once to avoid infinite loops)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Retry the request once
      if (!config.signal?.aborted) {
        response = await fetch(url, config)
      } else {
        throw new DOMException('Request aborted', 'AbortError')
      }
    }

    // If 401 Unauthorized
    if (response.status === 401) {
      // For auth endpoints (login/signup), 401 means invalid credentials, not missing token
      // For public discovery endpoints, 401 shouldn't happen, but if it does, return response
      // Just return the response so the caller can handle the error message from backend
      if (isAuthEndpoint || isPublicDiscoveryEndpoint) {
        return response
      }

      // For protected endpoints, handle token refresh/redirect
      // If we have a refresh token, try to refresh
      if (getRefreshToken(module)) {
        try {
          await refreshAccessToken(module)
          // Retry original request with new token
          config.headers = getAuthHeaders(module, options.headers)
          // Preserve signal for retry
          response = await fetch(url, config)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens(module)
          if (window.location.pathname !== `/${module}/login`) {
            window.location.href = `/${module}/login`
          }
          throw new Error('Session expired. Please login again.')
        }
      } else {
        // No refresh token, user is logged out - clear tokens and redirect
        clearTokens(module)
        const loginPath = module === 'admin' ? '/admin/login' : `/${module}/login`
        // Only redirect if not already on login page
        if (window.location.pathname !== loginPath && !window.location.pathname.includes('/login')) {
          // Use setTimeout to allow error to be thrown first, then redirect
          setTimeout(() => {
            window.location.href = loginPath
          }, 100)
        }
        throw new Error('Authentication token missing. Please login again.')
      }
    }

    return response
  } catch (error) {
    // Don't log or throw errors for aborted requests (user navigated away)
    if (error.name === 'AbortError') {
      throw error
    }
    console.error(`API Request Error [${module}]:`, error)
    throw error
  }
}

/**
 * API Client class
 */
class ApiClient {
  constructor(module = 'admin') {
    this.module = module
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @param {AbortSignal} signal - Optional AbortSignal for request cancellation
   * @returns {Promise<object>} Response data
   */
  async get(endpoint, params = {}, signal = null) {
    // Filter out undefined, null, and empty string values
    const cleanParams = {}
    Object.keys(params).forEach(key => {
      const value = params[key]
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value
      }
    })
    const queryString = new URLSearchParams(cleanParams).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint

     // Debug log
     // Debug log

    try {
      const response = await apiRequest(url, { method: 'GET', signal }, this.module)

     // Debug log

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ API Error [${this.module}]:`, errorData) // Debug log
      
      // For 429 errors, provide a more helpful message
      if (response.status === 429) {
        throw new Error(errorData.message || 'Too many requests. Please wait a moment and try again.')
      }
      
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }

      const jsonData = await response.json()
       // Debug log
      return jsonData
    } catch (error) {
      // Don't log or throw errors for aborted requests
      if (error.name === 'AbortError') {
        throw error
      }
      throw error
    }
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async post(endpoint, data = {}) {
    const response = await apiRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      this.module
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async put(endpoint, data = {}) {
    // Check if data is FormData
    const isFormData = data instanceof FormData
    
    const response = await apiRequest(
      endpoint,
      {
        method: 'PUT',
        body: isFormData ? data : JSON.stringify(data),
      },
      this.module
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async patch(endpoint, data = {}) {
    const response = await apiRequest(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      this.module
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<object>} Response data
   */
  async delete(endpoint) {
    const response = await apiRequest(endpoint, { method: 'DELETE' }, this.module)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Upload file (multipart/form-data)
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData with file
   * @returns {Promise<object>} Response data
   */
  async upload(endpoint, formData) {
    const token = getAuthToken(this.module)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
    const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      })
    } catch (fetchError) {
      // Handle network errors (connection refused, etc.)
      if (fetchError.message?.includes('Failed to fetch') ||
        fetchError.message?.includes('NetworkError') ||
        fetchError.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5001.')
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`)
    }

    return await response.json()
  }
}

// Export default instance for admin
const apiClient = new ApiClient('admin')

// Export class for creating module-specific instances
export { ApiClient, storeTokens, clearTokens, getAuthToken, getRefreshToken }

/**
 * Get full URL for a static file path
 * @param {string} path - Relative file path (e.g., /uploads/...)
 * @returns {string} Full URL
 */
export const getFileUrl = (path) => {
  if (!path) return ''
  
  let cleanPath = path
  if (path.startsWith('http://localhost:') || path.startsWith('http://127.0.0.1:')) {
    const match = path.match(/https?:\/\/[^\/]+(\/.*)/)
    if (match && match[1]) {
      cleanPath = match[1]
    }
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (path.startsWith('blob:')) return path

  // Clean path
  const cleanedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`

  // Get base URL from API_BASE_URL logic
  // If API_BASE_URL ends with /api, remove it to get server root
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const rootBase = apiBase.replace(/\/api\/?$/, '')

  return `${rootBase}${cleanedPath}`
}

export default apiClient

