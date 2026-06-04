import { Navigate, useLocation } from 'react-router-dom'
import { getAuthToken } from '../utils/apiClient'

/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Component to render if authenticated
 * @param {string} props.module - Module name (patient, doctor, pharmacy, laboratory, admin)
 * @param {string} props.redirectTo - Path to redirect if not authenticated (default: /{module}/login)
 */
const ProtectedRoute = ({ children, module, redirectTo = null }) => {
  const location = useLocation()
  
  // Check token synchronously on every render - this is critical for security
  const token = getAuthToken(module)
  
  // If no token, redirect to login immediately
  if (!token) {
    const loginPath = redirectTo || `/${module}/login`
    
    // Clear any stale tokens to ensure clean state
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${module}AuthToken`)
      localStorage.removeItem(`${module}AccessToken`)
      localStorage.removeItem(`${module}RefreshToken`)
      sessionStorage.removeItem(`${module}AuthToken`)
      sessionStorage.removeItem(`${module}AccessToken`)
      sessionStorage.removeItem(`${module}RefreshToken`)
    }
    
    // Redirect to login page
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  // If token exists, render the protected component
  return children
}

export default ProtectedRoute

