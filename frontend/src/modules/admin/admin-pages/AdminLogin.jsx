import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loginAdmin, storeAdminTokens } from '../admin-services/adminService'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'

const AdminLogin = () => {
  const navigate = useNavigate()
  const toast = useToast()
  
  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: true })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginErrors, setLoginErrors] = useState({})

  // Check if user is already authenticated - redirect to dashboard
  const token = getAuthToken('admin')
  if (token) {
    return <Navigate to="/admin/dashboard" replace />
  }

  // Login handlers
  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (loginErrors[name]) {
      setLoginErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateLogin = () => {
    const newErrors = {}
    if (!loginData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!loginData.password) {
      newErrors.password = 'Password is required'
    } else if (loginData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    setLoginErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (!validateLogin()) return

    setIsLoggingIn(true)
    try {
      const data = await loginAdmin({
        email: loginData.email,
        password: loginData.password,
      })

      // Store tokens and profile
      if (data.success && data.data?.tokens) {
        storeAdminTokens(data.data.tokens, loginData.remember)
        
        // Store admin profile
        if (data.data.admin) {
          const storage = loginData.remember ? localStorage : sessionStorage
          storage.setItem('adminProfile', JSON.stringify(data.data.admin))
        }
      }

      toast.success('Login successful! Redirecting to dashboard...')
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true })
      }, 500)
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'An error occurred. Please try again.'
      toast.error(errorMessage)
      setLoginErrors({ submit: errorMessage })
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-y-auto">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[rgba(17,73,108,0.08)] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[rgba(17,73,108,0.06)] blur-3xl" />
      </div>

      {/* Main Content - Centered on mobile */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-6 min-h-screen">
        {/* Form Section - Centered with max width */}
        <div className="w-full max-w-md mx-auto">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src={healinnLogo}
                alt="Heallyn"
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sign in to your admin account to continue.
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col gap-4 sm:gap-5"
            onSubmit={handleLoginSubmit}
          >
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                  <IoMailOutline className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  autoComplete="email"
                  required
                  placeholder="admin@heallyn.com"
                  className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                    loginErrors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : ''
                  }`}
                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                />
              </div>
              {loginErrors.email && (
                <p className="text-xs text-red-600 font-medium">{loginErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                  <IoLockClosedOutline className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={handleLoginChange}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 ${
                    loginErrors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : ''
                  }`}
                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <IoEyeOffOutline className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <IoEyeOutline className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-xs text-red-600 font-medium">{loginErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={loginData.remember}
                  onChange={handleLoginChange}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                />
                Remember me
              </label>
              <button
                type="button"
                className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition text-xs"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Error */}
            {loginErrors.submit && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-100">
                {loginErrors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0d3a52] focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <IoArrowForwardOutline className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </motion.form>

          {/* Security Notice */}
          <div className="mt-8 flex items-start gap-3 rounded-xl bg-blue-50/50 border border-blue-100/50 p-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <IoShieldCheckmarkOutline className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 mb-0.5">Secure Admin Area</h4>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                This portal is for authorized personnel only. All access attempts are monitored and logged.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLogin
