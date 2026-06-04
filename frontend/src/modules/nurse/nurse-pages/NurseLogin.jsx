import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoArrowForwardOutline,
  IoCallOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoSchoolOutline,
  IoCloseOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import {
  requestLoginOtp,
  loginNurse,
  signupNurse,
  storeNurseTokens,
} from '../nurse-services/nurseService'

const initialNurseSignupState = {
  fullName: '',
  email: '',
  phone: '',
  address: {
    line1: '',
    city: '',
    state: '',
    postalCode: '',
  },
  qualification: '',
  experienceYears: '',
  specialization: '',
  fees: '',
  registrationNumber: '',
  registrationCouncilName: '',
  documents: [],
  termsAccepted: false,
}

const NurseLogin = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState('login')
  const [loginData, setLoginData] = useState({ phone: '', otp: '', remember: true })
  
  // OTP flow states
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  
  // Signup step state
  const [signupStep, setSignupStep] = useState(1)
  const totalSignupSteps = 4
  const [nurseSignupData, setNurseSignupData] = useState(initialNurseSignupState)
  
  // OTP input refs
  const otpInputRefs = useRef([])

  const isLogin = mode === 'login'
  
  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setIsSubmitting(false)
    setOtpSent(false)
    setOtpTimer(0)
    setSignupStep(1)
    setNurseSignupData(initialNurseSignupState)
    setLoginData({ phone: '', otp: '', remember: true })
  }
  
  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    // Restrict phone to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setLoginData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  
  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const otpArray = (loginData.otp || '').split('').slice(0, 4)
    otpArray[index] = value.slice(-1) // Take only last character
    const newOtp = otpArray.join('').padEnd(4, ' ').slice(0, 4).replace(/\s/g, '')
    
    setLoginData({
      ...loginData,
      otp: newOtp,
    })
    
    // Auto-focus next input
    if (value && index < 3 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus()
    }
  }
  
  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      setLoginData({
        ...loginData,
        otp: pastedData,
      })
      // Focus last input
      if (otpInputRefs.current[3]) {
        otpInputRefs.current[3].focus()
      }
    }
  }
  
  // Handle OTP key down (backspace navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }
  
  // Send OTP function
  const handleSendOtp = async () => {
    if (!loginData.phone || loginData.phone.length < 10) {
      toast.error('Please enter a valid mobile number')
      return
    }
    
    setIsSendingOtp(true)
    
    try {
      const response = await requestLoginOtp(loginData.phone)
      if (response.success) {
        setOtpSent(true)
        setOtpTimer(60) // 60 seconds timer
        toast.success('OTP sent to your mobile number')
      } else {
        toast.error(response.message || 'Failed to send OTP. Please try again.')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error(error.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }
  
  // Resend OTP function
  const handleResendOtp = () => {
    setOtpTimer(0)
    setOtpSent(false)
    setLoginData({ ...loginData, otp: '' })
    handleSendOtp()
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || isSendingOtp) return
    
    // If OTP not sent, send it first
    if (!otpSent) {
      await handleSendOtp()
      return
    }
    
    // Verify OTP
    if (!loginData.otp || loginData.otp.length !== 4) {
      toast.error('Please enter the 4-digit OTP')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await loginNurse({
        phone: loginData.phone,
        otp: loginData.otp,
      })

      if (response.success && response.data?.tokens) {
        storeNurseTokens(response.data.tokens, loginData.remember)
        toast.success('Login successful! Redirecting...')
        setTimeout(() => {
          navigate('/nurse/dashboard', { replace: true })
        }, 500)
      } else {
        // Check if it's an approval status error
        if (response.message && (response.message.includes('pending') || response.message.includes('approval'))) {
          toast.error(response.message)
        } else {
          toast.error(response.message || 'Login failed. Please try again.')
        }
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      // Check if it's an approval error
      if (error.message && (error.message.includes('pending') || error.message.includes('approval'))) {
        toast.error(error.message)
      } else {
        toast.error(error.message || 'An error occurred. Please try again.')
      }
      setIsSubmitting(false)
    }
  }

  const handleNurseSignupChange = (event) => {
    const { name, value, type, checked, files } = event.target

    // Handle file uploads
    if (type === 'file' && files && files.length > 0) {
      handleDocumentUpload(event)
      return
    }

    if (name === 'termsAccepted') {
      setNurseSignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setNurseSignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }))
      return
    }

    // Restrict phone fields to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setNurseSignupData((prev) => ({
        ...prev,
        phone: numericValue,
      }))
      return
    }

    // Limit text fields
    if (name === 'fullName' || name === 'qualification' || name === 'specialization' || name === 'registrationCouncilName') {
      const limitedValue = value.slice(0, 100)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }))
      return
    }

    // Limit email
    if (name === 'email') {
      const trimmedValue = value.trim().slice(0, 100)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit registration number
    if (name === 'registrationNumber') {
      const trimmedValue = value.trim().slice(0, 50)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit postal code
    if (name === 'postalCode' || name === 'address.postalCode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6)
      setNurseSignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          postalCode: numericValue,
        },
      }))
      return
    }

    // Limit experience years
    if (name === 'experienceYears') {
      const numericValue = value.replace(/\D/g, '').slice(0, 2)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }

    // Handle fees
    if (name === 'fees') {
      const cleanedValue = value.replace(/[^\d.]/g, '')
      const parts = cleanedValue.split('.')
      const finalValue = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0]
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    setNurseSignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Document upload helper functions
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve({
        name: file.name,
        data: reader.result,
        type: file.type
      })
      reader.onerror = reject
    })
  }

  const handleDocumentUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate files
    const maxSize = 5 * 1024 * 1024 // 5MB
    const maxFiles = 10

    for (const file of files) {
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file. Only PDF files are allowed.`)
        continue
      }

      // Check file size
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`)
        continue
      }
    }

    // Check total files limit
    if (nurseSignupData.documents.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} documents allowed. Please remove some documents first.`)
      return
    }

    // Convert files to base64
    try {
      const base64Files = await Promise.all(files.map(convertFileToBase64))
      setNurseSignupData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...base64Files]
      }))
    } catch (error) {
      console.error('Error converting files to base64:', error)
      toast.error('Failed to process files. Please try again.')
    }

    // Reset input
    event.target.value = ''
  }

  const removeDocument = (index) => {
    setNurseSignupData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const handleNextStep = () => {
    if (signupStep === 1) {
      // Validate Step 1
      if (!nurseSignupData.fullName || !nurseSignupData.email || !nurseSignupData.phone) {
        toast.error('Please fill in all required fields.')
        return
      }
      if (nurseSignupData.fullName.trim().length < 2) {
        toast.error('Full name must be at least 2 characters')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(nurseSignupData.email.trim())) {
        toast.error('Please enter a valid email address')
        return
      }
      if (nurseSignupData.phone.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number')
        return
      }
    } else if (signupStep === 2) {
      // Validate Step 2
      if (!nurseSignupData.address.line1 || !nurseSignupData.address.city || !nurseSignupData.address.state || !nurseSignupData.address.postalCode) {
        toast.error('Please fill in all address fields.')
        return
      }
      if (nurseSignupData.address.postalCode.length !== 6) {
        toast.error('Please enter a valid 6-digit pincode')
        return
      }
    } else if (signupStep === 3) {
      // Validate Step 3
      if (!nurseSignupData.qualification || !nurseSignupData.registrationNumber || !nurseSignupData.registrationCouncilName) {
        toast.error('Please fill in all required professional details.')
        return
      }
    }
    
    if (signupStep < totalSignupSteps) {
      setSignupStep(signupStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1)
    }
  }

  const handleNurseSignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!nurseSignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    // Validate all required fields
    if (!nurseSignupData.fullName || !nurseSignupData.email || !nurseSignupData.phone) {
      toast.error('Please fill in all required fields in Step 1.')
      return
    }

    if (!nurseSignupData.address.line1 || !nurseSignupData.address.city || !nurseSignupData.address.state || !nurseSignupData.address.postalCode) {
      toast.error('Please fill in all address fields in Step 2.')
      return
    }

    if (!nurseSignupData.qualification || !nurseSignupData.registrationNumber || !nurseSignupData.registrationCouncilName) {
      toast.error('Please fill in all required professional details in Step 3.')
      return
    }

    // Validate fullName
    if (nurseSignupData.fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(nurseSignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (nurseSignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    // Validate postal code
    if (nurseSignupData.address.postalCode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        fullName: nurseSignupData.fullName,
        email: nurseSignupData.email,
        phone: nurseSignupData.phone,
        address: nurseSignupData.address,
        qualification: nurseSignupData.qualification,
        experienceYears: nurseSignupData.experienceYears ? Number(nurseSignupData.experienceYears) : undefined,
        specialization: nurseSignupData.specialization || undefined,
        fees: nurseSignupData.fees && nurseSignupData.fees !== ''
          ? (() => {
              const feeStr = String(nurseSignupData.fees).trim()
              const feeNum = parseFloat(feeStr)
              return !isNaN(feeNum) && isFinite(feeNum) ? feeNum : undefined
            })()
          : undefined,
        registrationNumber: nurseSignupData.registrationNumber,
        registrationCouncilName: nurseSignupData.registrationCouncilName,
        documents: nurseSignupData.documents && nurseSignupData.documents.length > 0 ? nurseSignupData.documents : undefined,
      }

      const response = await signupNurse(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setNurseSignupData(initialNurseSignupState)
        setSignupStep(1)
        setMode('login')
      } else {
        toast.error(response.message || 'Signup failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[rgba(17,73,108,0.08)] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[rgba(17,73,108,0.06)] blur-3xl" />
      </div>

      {/* Main Content - Centered on mobile */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        {/* Form Section - Centered with max width */}
        <div className="w-full max-w-md mx-auto">
            {/* Title */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {isLogin ? 'Welcome Back, Nurse' : 'Nurse Registration'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {isLogin
                  ? 'Sign in to access your bookings, transactions, and profile.'
                  : 'Join Heallyn to provide quality nursing care services.'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-8 flex items-center justify-center">
              <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full max-w-xs">
                {/* Sliding background indicator */}
                <motion.div
                  layoutId="nurseLoginSignupToggle"
                  className="absolute rounded-xl bg-[#11496c] shadow-md shadow-[#11496c]/15"
                  style={{
                    left: isLogin ? '0.375rem' : 'calc(50% + 0.1875rem)',
                    width: 'calc(50% - 0.5625rem)',
                    height: 'calc(100% - 0.75rem)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${
                    isLogin
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${
                    !isLogin
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Sign Up
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex flex-col gap-5 sm:gap-6"
                  onSubmit={handleLoginSubmit}
                >
                {/* Mobile Number Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-phone" className="text-sm font-semibold text-slate-700">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                      id="login-phone"
                      name="phone"
                      type="tel"
                      value={loginData.phone}
                      onChange={handleLoginChange}
                      autoComplete="tel"
                      required
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      disabled={otpSent}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                  </div>
                </div>

                {/* OTP Input Section - Show after OTP is sent */}
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <label className="text-sm font-semibold text-slate-700">
                      Enter OTP
                    </label>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={loginData.otp[index] || ''}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-12 text-center text-lg font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {otpTimer > 0 ? (
                          `Resend OTP in ${otpTimer}s`
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                          >
                            Resend OTP
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false)
                          setOtpTimer(0)
                          setLoginData({ ...loginData, otp: '' })
                        }}
                        className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                      >
                        Change Number
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Remember me checkbox */}
                <div className="flex items-center gap-2 text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={loginData.remember}
                      onChange={handleLoginChange}
                      className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSendingOtp}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                >
                  {isSubmitting ? (
                    otpSent ? 'Verifying...' : 'Sending OTP...'
                  ) : isSendingOtp ? (
                    'Sending OTP...'
                  ) : otpSent ? (
                    <>
                      Verify OTP
                      <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Send OTP
                      <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-600">
                  New to Heallyn?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Create an account
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${
                            signupStep === step
                              ? 'bg-[#11496c] text-white scale-110 shadow-md shadow-[#11496c]/30'
                              : signupStep > step
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {signupStep > step ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        {step < 4 && (
                          <div
                            className={`h-1.5 w-8 sm:w-12 rounded-full transition-all duration-300 ${
                              signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Step {signupStep} of {totalSignupSteps}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {signupStep === 1 && 'Basic Details'}
                      {signupStep === 2 && 'Address Details'}
                      {signupStep === 3 && 'Professional Details'}
                      {signupStep === 4 && 'Document Uploads'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleNurseSignupSubmit} className="flex flex-col gap-5 sm:gap-6" encType="multipart/form-data">
                {/* Step 1: Basic Details */}
                {signupStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">🧑‍⚕️ Basic Details</h3>
                      <p className="text-xs text-slate-500">Let's start with your essential details</p>
                    </div>
                {/* Basic Information */}
                <section className="grid gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-fullName" className="text-sm font-semibold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                        <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <input
                        id="nurse-fullName"
                        name="fullName"
                        type="text"
                        value={nurseSignupData.fullName}
                        onChange={handleNurseSignupChange}
                        required
                        placeholder="Enter your full name"
                        minLength={2}
                        maxLength={100}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-email" className="text-sm font-semibold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                        <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <input
                        id="nurse-email"
                        name="email"
                        type="email"
                        value={nurseSignupData.email}
                        onChange={handleNurseSignupChange}
                        required
                        placeholder="you@example.com"
                        maxLength={100}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-phone" className="text-sm font-semibold text-slate-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                        <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <input
                        id="nurse-phone"
                        name="phone"
                        type="tel"
                        value={nurseSignupData.phone}
                        onChange={handleNurseSignupChange}
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        inputMode="numeric"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                      />
                    </div>
                  </div>
                </section>
                  </motion.div>
                )}

                {/* Step 2: Address Details */}
                {signupStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">📍 Address Details</h3>
                      <p className="text-xs text-slate-500">Enter your complete address</p>
                    </div>
                {/* Address */}
                <section className="grid gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-address.line1" className="text-sm font-semibold text-slate-700">
                      Complete Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                        <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <input
                        id="nurse-address.line1"
                        name="address.line1"
                        value={nurseSignupData.address.line1}
                        onChange={handleNurseSignupChange}
                        required
                        placeholder="Street address, building name, etc."
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-address.city" className="text-sm font-semibold text-slate-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nurse-address.city"
                      name="address.city"
                      value={nurseSignupData.address.city}
                      onChange={handleNurseSignupChange}
                      required
                      placeholder="Mumbai"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-address.state" className="text-sm font-semibold text-slate-700">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nurse-address.state"
                      name="address.state"
                      value={nurseSignupData.address.state}
                      onChange={handleNurseSignupChange}
                      required
                      placeholder="Maharashtra"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-address.postalCode" className="text-sm font-semibold text-slate-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nurse-address.postalCode"
                      name="address.postalCode"
                      type="text"
                      value={nurseSignupData.address.postalCode}
                      onChange={handleNurseSignupChange}
                      required
                      placeholder="400001"
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                </section>
                  </motion.div>
                )}

                {/* Step 3: Professional Details */}
                {signupStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">🎓 Professional Details</h3>
                      <p className="text-xs text-slate-500">VERY IMPORTANT for admin verification</p>
                    </div>
                {/* Professional Details */}
                <section className="grid gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-qualification" className="text-sm font-semibold text-slate-700">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                        <IoSchoolOutline className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <input
                        id="nurse-qualification"
                        name="qualification"
                        type="text"
                        value={nurseSignupData.qualification}
                        onChange={handleNurseSignupChange}
                        required
                        placeholder="GNM, B.Sc Nursing, ANM, D.Pharm, etc."
                        maxLength={100}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-experienceYears" className="text-sm font-semibold text-slate-700">
                      Experience (in years)
                    </label>
                    <input
                      id="nurse-experienceYears"
                      name="experienceYears"
                      type="number"
                      value={nurseSignupData.experienceYears}
                      onChange={handleNurseSignupChange}
                      min="0"
                      placeholder="5"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-specialization" className="text-sm font-semibold text-slate-700">
                      Specialization (if any)
                    </label>
                    <input
                      id="nurse-specialization"
                      name="specialization"
                      type="text"
                      value={nurseSignupData.specialization}
                      onChange={handleNurseSignupChange}
                      placeholder="ICU, OT, Emergency, Pediatrics, etc."
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-fees" className="text-sm font-semibold text-slate-700">
                      Fees (₹)
                    </label>
                    <input
                      id="nurse-fees"
                      name="fees"
                      type="number"
                      min="0"
                      step="1"
                      value={nurseSignupData.fees}
                      onChange={handleNurseSignupChange}
                      placeholder="500"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-registrationNumber" className="text-sm font-semibold text-slate-700">
                      Registration Number / License Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                        <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <input
                        id="nurse-registrationNumber"
                        name="registrationNumber"
                        type="text"
                        value={nurseSignupData.registrationNumber}
                        onChange={handleNurseSignupChange}
                        required
                        placeholder="Enter your registration/license number"
                        maxLength={50}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-registrationCouncilName" className="text-sm font-semibold text-slate-700">
                      Registration Council/Board Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nurse-registrationCouncilName"
                      name="registrationCouncilName"
                      type="text"
                      value={nurseSignupData.registrationCouncilName}
                      onChange={handleNurseSignupChange}
                      required
                      placeholder="e.g., Indian Nursing Council, State Nursing Council"
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                    />
                  </div>
                </section>
                  </motion.div>
                )}

                {/* Step 4: Document Uploads & Terms */}
                {signupStep === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">📄 Document Uploads</h3>
                      <p className="text-xs text-slate-500">Proof Verification - Upload your certificates</p>
                    </div>
                {/* Document Uploads */}
                <section>
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                      Upload Documents (PDF)
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Upload your professional documents for verification (Nursing Certificate, Registration Certificate, etc.)
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleDocumentUpload}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                      />
                      <p className="text-xs text-slate-500">
                        Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                      </p>
                    </div>
                    {nurseSignupData.documents && nurseSignupData.documents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">
                          Uploaded Documents ({nurseSignupData.documents.length}/10):
                        </p>
                        <div className="space-y-2">
                          {nurseSignupData.documents.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] flex-shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="ml-2 text-red-500 hover:text-red-700 transition flex-shrink-0"
                                aria-label={`Remove ${doc.name}`}
                              >
                                <IoCloseOutline className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Terms */}
                <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={nurseSignupData.termsAccepted}
                    onChange={handleNurseSignupChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                  />
                  <span>
                    I have read and agree to Heallyn's{' '}
                    <Link to="/terms" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                      terms of service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                      privacy policy
                    </Link>
                    .
                  </span>
                </label>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col gap-3 mt-8">
                  <div className="flex gap-3">
                    {signupStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2"
                      >
                        Previous
                      </button>
                    )}
                    {signupStep < totalSignupSteps ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${
                          signupStep > 1 ? 'flex-1' : 'w-full'
                        }`}
                        style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                      >
                        Next
                        <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting || !nurseSignupData.termsAccepted}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                          signupStep > 1 ? 'flex-1' : 'w-full'
                        }`}
                        style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            Complete Signup
                            <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                </form>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Sign in instead
                  </button>
                </p>
              </motion.div>
            )}
            </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/95 backdrop-blur mt-auto">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-4 text-center text-xs text-slate-500">
          <span>Secure nurse access powered by Heallyn</span>
          <span>
            Need help? Contact{' '}
            <Link to="/support" className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition">
              support
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

export default NurseLogin
