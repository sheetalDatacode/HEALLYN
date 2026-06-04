import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoCallOutline,
  IoPersonOutline,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoMedicalOutline,
  IoSchoolOutline,
  IoLanguageOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoVideocamOutline,
  IoCloseOutline,
  IoAddOutline,
  IoSearchOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import {
  requestLoginOtp as requestDoctorOtp,
  loginDoctor,
  signupDoctor,
  storeDoctorTokens,
} from '../doctor-services/doctorService'
import {
  requestLoginOtp as requestPharmacyOtp,
  loginPharmacy,
  signupPharmacy,
  storePharmacyTokens,
} from '../../pharmacy/pharmacy-services/pharmacyService'
import {
  requestLoginOtp as requestLaboratoryOtp,
  loginLaboratory,
  signupLaboratory,
  storeLaboratoryTokens,
} from '../../laboratory/laboratory-services/laboratoryService'
import {
  requestLoginOtp as requestNurseOtp,
  loginNurse,
  signupNurse,
  storeNurseTokens,
} from '../../nurse/nurse-services/nurseService'
import LoginForm from '../../shared/login-components/LoginForm'
import DoctorSignupForm from '../doctor-components/login/DoctorSignupForm'
import PharmacySignupForm from '../../pharmacy/pharmacy-components/login/PharmacySignupForm'
import LaboratorySignupForm from '../../laboratory/laboratory-components/login/LaboratorySignupForm'
import NurseSignupForm from '../../nurse/nurse-components/login/NurseSignupForm'
const DoctorLogin = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Determine initial module based on URL query param or path
  const getInitialModule = () => {
    const typeParam = searchParams.get('type')
    if (typeParam && ['doctor', 'pharmacy', 'laboratory', 'nurse'].includes(typeParam)) {
      return typeParam
    }

    const path = location.pathname
    if (path.includes('/pharmacy')) return 'pharmacy'
    if (path.includes('/laboratory')) return 'laboratory'
    if (path.includes('/nurse')) return 'nurse'
    return 'doctor' // default
  }

  const [selectedModule, setSelectedModule] = useState(getInitialModule()) // 'doctor' | 'pharmacy' | 'laboratory' | 'nurse'
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  // Update selected module when URL or query params change
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam && ['doctor', 'pharmacy', 'laboratory', 'nurse'].includes(typeParam)) {
      setSelectedModule(typeParam)
    } else {
      const path = location.pathname
      if (path.includes('/pharmacy')) {
        setSelectedModule('pharmacy')
      } else if (path.includes('/laboratory')) {
        setSelectedModule('laboratory')
      } else if (path.includes('/nurse')) {
        setSelectedModule('nurse')
      } else {
        setSelectedModule('doctor')
      }
    }
  }, [location.pathname, searchParams])

  // OTP-based login data states for each module
  const [doctorLoginData, setDoctorLoginData] = useState({ phone: '', otp: '', remember: true })
  const [pharmacyLoginData, setPharmacyLoginData] = useState({ phone: '', otp: '', remember: true })
  const [laboratoryLoginData, setLaboratoryLoginData] = useState({ phone: '', otp: '', remember: true })
  const [nurseLoginData, setNurseLoginData] = useState({ phone: '', otp: '', remember: true })

  // OTP flow states
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  // Signup step state (applies to all modules)
  const [signupStep, setSignupStep] = useState(1)
  // Dynamic total steps: 4 for nurse, 3 for others
  const totalSignupSteps = selectedModule === 'nurse' ? 4 : 3


  // Refs for module buttons to measure their positions and widths
  const doctorButtonRef = useRef(null)
  const pharmacyButtonRef = useRef(null)
  const laboratoryButtonRef = useRef(null)
  const nurseButtonRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // OTP input refs
  const otpInputRefs = useRef([])

  // Specialization dropdown state (for doctor)
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)
  const [specializationSearchTerm, setSpecializationSearchTerm] = useState('')
  const [availableSpecializations, setAvailableSpecializations] = useState([])
  const specializationInputRef = useRef(null)
  const specializationDropdownRef = useRef(null)



  // Doctor signup state
  const initialDoctorSignupState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    gender: '',
    licenseNumber: '',
    experienceYears: '',
    qualification: '',
    bio: '',
    consultationFee: '',
    languages: [],
    consultationModes: [],
    education: [{ institution: '', degree: '', year: '' }],
    clinicDetails: {
      name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
    documents: [],
    termsAccepted: false,
  }
  const [doctorSignupData, setDoctorSignupData] = useState(initialDoctorSignupState)

  // Pharmacy signup state
  const initialPharmacySignupState = {
    pharmacyName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    timings: '',
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    documents: [],
    termsAccepted: false,
  }
  const [pharmacySignupData, setPharmacySignupData] = useState(initialPharmacySignupState)

  // Laboratory signup state
  const initialLaboratorySignupState = {
    labName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    testsOffered: '',
    timings: '',
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    operatingHours: {
      opening: '',
      closing: '',
      days: [],
    },
    documents: [],
    termsAccepted: false,
  }
  const [laboratorySignupData, setLaboratorySignupData] = useState(initialLaboratorySignupState)

  // Nurse signup state
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
    specialization: 'Home Care Nurse', // Default to Home Care Nurse
    fees: '',
    registrationNumber: '',
    registrationCouncilName: '',
    documents: [],
    termsAccepted: false,
  }
  const [nurseSignupData, setNurseSignupData] = useState(initialNurseSignupState)

  const isLogin = mode === 'login'

  // Get current login data based on selected module
  const getCurrentLoginData = () => {
    if (selectedModule === 'doctor') return doctorLoginData
    if (selectedModule === 'pharmacy') return pharmacyLoginData
    if (selectedModule === 'laboratory') return laboratoryLoginData
    if (selectedModule === 'nurse') return nurseLoginData
    return doctorLoginData // fallback
  }

  const setCurrentLoginData = (data) => {
    if (selectedModule === 'doctor') setDoctorLoginData(data)
    else if (selectedModule === 'pharmacy') setPharmacyLoginData(data)
    else if (selectedModule === 'laboratory') setLaboratoryLoginData(data)
    else if (selectedModule === 'nurse') setNurseLoginData(data)
  }

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  // Update indicator position and width based on selected button
  useEffect(() => {
    const updateIndicatorPosition = () => {
      const container = doctorButtonRef.current?.parentElement
      if (!container) return

      const activeButtonRef =
        selectedModule === 'doctor'
          ? doctorButtonRef
          : selectedModule === 'pharmacy'
            ? pharmacyButtonRef
            : selectedModule === 'laboratory'
              ? laboratoryButtonRef
              : nurseButtonRef

      const activeButton = activeButtonRef.current
      if (!activeButton) return

      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      })
    }

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateIndicatorPosition)
    }, 0)

    // Update on window resize
    window.addEventListener('resize', updateIndicatorPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateIndicatorPosition)
    }
  }, [selectedModule])



  const handleModuleChange = (module) => {
    setSelectedModule(module)
    // Update query param if on the consolidated login route
    if (location.pathname === '/login') {
      setSearchParams({ type: module })
    }
    setIsSubmitting(false)
    setOtpSent(false)
    setOtpTimer(0)
    setSignupStep(1)
    // Reset OTP for all modules
    setDoctorLoginData({ phone: '', otp: '', remember: true })
    setPharmacyLoginData({ phone: '', otp: '', remember: true })
    setLaboratoryLoginData({ phone: '', otp: '', remember: true })
    setNurseLoginData({ phone: '', otp: '', remember: true })
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setIsSubmitting(false)
    setOtpSent(false)
    setOtpTimer(0)
    setSignupStep(1)
  }

  // Get current signup data based on selected module
  const getCurrentSignupData = () => {
    if (selectedModule === 'doctor') return doctorSignupData
    if (selectedModule === 'pharmacy') return pharmacySignupData
    if (selectedModule === 'laboratory') return laboratorySignupData
    if (selectedModule === 'nurse') return nurseSignupData
    return null
  }

  // Handle next step in signup
  const handleNextStep = () => {
    const currentData = getCurrentSignupData()
    if (!currentData) return

    // Validate current step before proceeding
    if (signupStep === 1) {
      // Step 1 validation - Basic info (varies by module)
      if (selectedModule === 'doctor') {
        if (!currentData.firstName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
      } else if (selectedModule === 'pharmacy') {
        if (!currentData.pharmacyName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
      } else if (selectedModule === 'laboratory') {
        if (!currentData.labName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
      } else if (selectedModule === 'nurse') {
        if (!currentData.fullName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(currentData.email.trim())) {
          toast.error('Please enter a valid email address')
          return
        }
        // Validate phone
        if (currentData.phone.length !== 10) {
          toast.error('Please enter a valid 10-digit mobile number')
          return
        }
      }
    } else if (signupStep === 2 && selectedModule === 'nurse') {
      // Step 2 validation - Address details
      if (!currentData.address.line1 || !currentData.address.city || !currentData.address.state || !currentData.address.postalCode) {
        toast.error('Please fill in all address fields in Step 2')
        return
      }
    } else if (signupStep === 3 && selectedModule === 'nurse') {
      // Step 3 validation - Professional details
      if (!currentData.qualification || !currentData.registrationNumber || !currentData.registrationCouncilName) {
        toast.error('Please fill in all required professional details in Step 3')
        return
      }
    }

    if (signupStep < totalSignupSteps) {
      setSignupStep(signupStep + 1)
    }
  }

  // Handle previous step in signup
  const handlePreviousStep = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1)
    }
  }

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    const currentData = getCurrentLoginData()
    // Restrict phone to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setCurrentLoginData({
        ...currentData,
        [name]: numericValue,
      })
      return
    }
    setCurrentLoginData({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const currentData = getCurrentLoginData()
    const otpArray = (currentData.otp || '').split('').slice(0, 4)
    otpArray[index] = value.slice(-1) // Take only last character
    const newOtp = otpArray.join('').padEnd(4, ' ').slice(0, 4).replace(/\s/g, '')

    setCurrentLoginData({
      ...currentData,
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
      const currentData = getCurrentLoginData()
      setCurrentLoginData({
        ...currentData,
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
    const loginData = getCurrentLoginData()

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = loginData.phone.replace(/\D/g, '')

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid mobile number')
      return
    }

    setIsSendingOtp(true)

    try {
      let response
      if (selectedModule === 'doctor') {
        response = await requestDoctorOtp(cleanPhone)
      } else if (selectedModule === 'pharmacy') {
        response = await requestPharmacyOtp(cleanPhone)
      } else if (selectedModule === 'laboratory') {
        response = await requestLaboratoryOtp(cleanPhone)
      } else if (selectedModule === 'nurse') {
        response = await requestNurseOtp(cleanPhone)
      }

      if (response && response.success) {
        setOtpSent(true)
        setOtpTimer(60) // 60 seconds timer
        // Update phone in state with cleaned version
        setCurrentLoginData({ ...loginData, phone: cleanPhone })
        toast.success('OTP sent to your mobile number')
      } else {
        toast.error(response?.message || 'Failed to send OTP. Please try again.')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Resend OTP function
  const handleResendOtp = () => {
    setOtpTimer(0)
    setOtpSent(false)
    const currentData = getCurrentLoginData()
    setCurrentLoginData({ ...currentData, otp: '' })
    handleSendOtp()
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || isSendingOtp) return

    const loginData = getCurrentLoginData()

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
      // Dashboard routes for each module
      const dashboardRoutes = {
        doctor: '/doctor/dashboard',
        pharmacy: '/pharmacy/dashboard',
        laboratory: '/laboratory/dashboard',
        nurse: '/nurse/dashboard',
      }

      let response
      if (selectedModule === 'doctor') {
        response = await loginDoctor({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storeDoctorTokens(response.data.tokens, loginData.remember)
        }
      } else if (selectedModule === 'pharmacy') {
        response = await loginPharmacy({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storePharmacyTokens(response.data.tokens, loginData.remember)
        }
      } else if (selectedModule === 'laboratory') {
        response = await loginLaboratory({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storeLaboratoryTokens(response.data.tokens, loginData.remember)
        }
      } else if (selectedModule === 'nurse') {
        response = await loginNurse({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storeNurseTokens(response.data.tokens, loginData.remember)
        }
      }

      if (response && response.success && response.data?.tokens) {
        toast.success('Login successful! Redirecting...')
        setTimeout(() => {
          navigate(dashboardRoutes[selectedModule], { replace: true })
        }, 500)
      } else {
        toast.error(response?.message || 'Login failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      // Check if it's an approval error
      if (error.message && error.message.includes('approval')) {
        toast.error(error.message)
      } else {
        toast.error(error.message || 'An error occurred. Please try again.')
      }
      setIsSubmitting(false)
    }
  }

  const handleDoctorSignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setDoctorSignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('clinicDetails.address.')) {
      const key = name.split('.')[2]
      setDoctorSignupData((prev) => ({
        ...prev,
        clinicDetails: {
          ...prev.clinicDetails,
          address: {
            ...prev.clinicDetails.address,
            [key]: value,
          },
        },
      }))
      return
    }

    if (name.startsWith('clinicDetails.')) {
      const key = name.split('.')[1]
      setDoctorSignupData((prev) => ({
        ...prev,
        clinicDetails: {
          ...prev.clinicDetails,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('education.')) {
      const parts = name.split('.')
      const index = parseInt(parts[1])
      const field = parts[2]
      setDoctorSignupData((prev) => {
        const newEducation = [...prev.education]
        newEducation[index] = {
          ...newEducation[index],
          [field]: value,
        }
        return {
          ...prev,
          education: newEducation,
        }
      })
      return
    }

    if (name === 'consultationModes') {
      setDoctorSignupData((prev) => {
        const modes = prev.consultationModes || []
        if (checked && !modes.includes(value)) {
          return { ...prev, consultationModes: [...modes, value] }
        } else if (!checked && modes.includes(value)) {
          return { ...prev, consultationModes: modes.filter((m) => m !== value) }
        }
        return prev
      })
      return
    }

    if (name === 'languages') {
      const langValue = value.trim()
      if (langValue && !doctorSignupData.languages.includes(langValue)) {
        setDoctorSignupData((prev) => ({
          ...prev,
          languages: [...prev.languages, langValue],
        }))
      }
      return
    }

    // Handle specialization with dropdown
    if (name === 'specialization') {
      setDoctorSignupData((prev) => ({
        ...prev,
        specialization: value,
      }))
      // Update search term to match what user is typing
      setSpecializationSearchTerm(value)
      // Show dropdown if there's a search term or if specializations are available
      if (value.trim() || availableSpecializations.length > 0) {
        setShowSpecializationDropdown(true)
      } else {
        setShowSpecializationDropdown(false)
      }
      return
    }

    // Restrict phone to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setDoctorSignupData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }

    // Handle consultationFee - preserve exact value as string to avoid precision loss
    if (name === 'consultationFee') {
      // Remove any non-numeric characters except decimal point
      const cleanedValue = value.replace(/[^\d.]/g, '')
      // Ensure only one decimal point
      const parts = cleanedValue.split('.')
      const finalValue = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0]
      setDoctorSignupData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    setDoctorSignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const addEducationEntry = () => {
    setDoctorSignupData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }],
    }))
  }

  const removeEducationEntry = (index) => {
    setDoctorSignupData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const removeLanguage = (lang) => {
    setDoctorSignupData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
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

  const handleDocumentUpload = async (event, userType) => {
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
    let currentDocsCount = 0
    if (userType === 'doctor') currentDocsCount = doctorSignupData.documents.length
    else if (userType === 'pharmacy') currentDocsCount = pharmacySignupData.documents.length
    else if (userType === 'laboratory') currentDocsCount = laboratorySignupData.documents.length
    else if (userType === 'nurse') currentDocsCount = nurseSignupData.documents?.length || 0

    if (currentDocsCount + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} documents allowed. Please remove some documents first.`)
      return
    }

    // Convert files to base64
    try {
      const base64Files = await Promise.all(files.map(convertFileToBase64))

      if (userType === 'doctor') {
        setDoctorSignupData((prev) => ({
          ...prev,
          documents: [...prev.documents, ...base64Files]
        }))
      } else if (userType === 'pharmacy') {
        setPharmacySignupData((prev) => ({
          ...prev,
          documents: [...prev.documents, ...base64Files]
        }))
      } else if (userType === 'laboratory') {
        setLaboratorySignupData((prev) => ({
          ...prev,
          documents: [...prev.documents, ...base64Files]
        }))
      } else if (userType === 'nurse') {
        setNurseSignupData((prev) => ({
          ...prev,
          documents: [...(prev.documents || []), ...base64Files]
        }))
      }
    } catch (error) {
      console.error('Error converting files to base64:', error)
      toast.error('Failed to process files. Please try again.')
    }

    // Reset input
    event.target.value = ''
  }

  const removeDocument = (index, userType) => {
    if (userType === 'doctor') {
      setDoctorSignupData((prev) => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }))
    } else if (userType === 'pharmacy') {
      setPharmacySignupData((prev) => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }))
    } else if (userType === 'laboratory') {
      setLaboratorySignupData((prev) => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }))
    } else if (userType === 'nurse') {
      setNurseSignupData((prev) => ({
        ...prev,
        documents: (prev.documents || []).filter((_, i) => i !== index)
      }))
    }
  }

  const handleDoctorSignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!doctorSignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    if (!doctorSignupData.firstName || !doctorSignupData.email || !doctorSignupData.phone || !doctorSignupData.specialization || !doctorSignupData.gender || !doctorSignupData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate firstName
    if (doctorSignupData.firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(doctorSignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (doctorSignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        firstName: doctorSignupData.firstName,
        lastName: doctorSignupData.lastName || '',
        email: doctorSignupData.email,
        phone: doctorSignupData.phone,
        specialization: doctorSignupData.specialization,
        gender: doctorSignupData.gender,
        licenseNumber: doctorSignupData.licenseNumber,
        experienceYears: doctorSignupData.experienceYears ? Number(doctorSignupData.experienceYears) : undefined,
        qualification: doctorSignupData.qualification || undefined,
        bio: doctorSignupData.bio || undefined,
        consultationFee: doctorSignupData.consultationFee && doctorSignupData.consultationFee !== ''
          ? (() => {
            const feeStr = String(doctorSignupData.consultationFee).trim()
            const feeNum = parseFloat(feeStr)
            
            return !isNaN(feeNum) && isFinite(feeNum) ? feeNum : undefined
          })()
          : undefined,
        languages: doctorSignupData.languages.length > 0 ? doctorSignupData.languages : undefined,
        consultationModes: doctorSignupData.consultationModes.length > 0 ? doctorSignupData.consultationModes : undefined,
        education: doctorSignupData.education.filter((edu) => edu.institution || edu.degree || edu.year).length > 0
          ? doctorSignupData.education.filter((edu) => edu.institution || edu.degree || edu.year)
          : undefined,
        clinicName: doctorSignupData.clinicDetails.name || undefined,
        clinicAddress: Object.values(doctorSignupData.clinicDetails.address).some((val) => val)
          ? doctorSignupData.clinicDetails.address
          : undefined,
        documents: doctorSignupData.documents.length > 0 ? doctorSignupData.documents : undefined,
      }

      const response = await signupDoctor(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setDoctorSignupData(initialDoctorSignupState)
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

  const handlePharmacySignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setPharmacySignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setPharmacySignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('contactPerson.')) {
      const key = name.split('.')[1]
      setPharmacySignupData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [key]: value,
        },
      }))
      return
    }


    // Restrict phone fields to 10 digits only
    if (name === 'phone' || name === 'contactPerson.phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setPharmacySignupData((prev) => {
        if (name === 'phone') {
          return {
            ...prev,
            phone: numericValue,
          }
        }
        if (name.startsWith('contactPerson.')) {
          const key = name.split('.')[1]
          return {
            ...prev,
            contactPerson: {
              ...prev.contactPerson,
              [key]: numericValue,
            },
          }
        }
        return prev
      })
      return
    }

    setPharmacySignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handlePharmacySignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!pharmacySignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    if (!pharmacySignupData.pharmacyName || !pharmacySignupData.email || !pharmacySignupData.phone || !pharmacySignupData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate pharmacyName
    if (pharmacySignupData.pharmacyName.trim().length < 2) {
      toast.error('Pharmacy name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(pharmacySignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (pharmacySignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        pharmacyName: pharmacySignupData.pharmacyName,
        ownerName: pharmacySignupData.ownerName || undefined,
        email: pharmacySignupData.email,
        phone: pharmacySignupData.phone,
        licenseNumber: pharmacySignupData.licenseNumber,
        gstNumber: pharmacySignupData.gstNumber || undefined,
        address: Object.values(pharmacySignupData.address).some((val) => val) ? pharmacySignupData.address : undefined,
        timings: pharmacySignupData.timings ? [pharmacySignupData.timings] : undefined,
        contactPerson: Object.values(pharmacySignupData.contactPerson).some((val) => val) ? pharmacySignupData.contactPerson : undefined,
        documents: pharmacySignupData.documents.length > 0 ? pharmacySignupData.documents : undefined,
      }

      const response = await signupPharmacy(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setPharmacySignupData(initialPharmacySignupState)
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

  const handleLaboratorySignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setLaboratorySignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setLaboratorySignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('contactPerson.')) {
      const key = name.split('.')[1]
      setLaboratorySignupData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('operatingHours.')) {
      const key = name.split('.')[1]
      if (key === 'days') {
        const days = laboratorySignupData.operatingHours.days || []
        if (checked && !days.includes(value)) {
          setLaboratorySignupData((prev) => ({
            ...prev,
            operatingHours: {
              ...prev.operatingHours,
              days: [...days, value],
            },
          }))
        } else if (!checked && days.includes(value)) {
          setLaboratorySignupData((prev) => ({
            ...prev,
            operatingHours: {
              ...prev.operatingHours,
              days: days.filter((d) => d !== value),
            },
          }))
        }
        return
      }
      setLaboratorySignupData((prev) => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [key]: value,
        },
      }))
      return
    }


    // Restrict phone fields to 10 digits only
    if (name === 'phone' || name === 'contactPerson.phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setLaboratorySignupData((prev) => {
        if (name === 'phone') {
          return {
            ...prev,
            phone: numericValue,
          }
        }
        if (name.startsWith('contactPerson.')) {
          const key = name.split('.')[1]
          return {
            ...prev,
            contactPerson: {
              ...prev.contactPerson,
              [key]: numericValue,
            },
          }
        }
        return prev
      })
      return
    }

    // Limit text fields (allow spaces while typing, only limit length)
    if (name === 'labName' || name === 'ownerName') {
      const limitedValue = value.slice(0, 100)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }))
      return
    }

    // Limit email
    if (name === 'email') {
      const trimmedValue = value.trim().slice(0, 100)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit license number
    if (name === 'licenseNumber') {
      const trimmedValue = value.trim().slice(0, 50)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit GST number
    if (name === 'gstNumber') {
      const trimmedValue = value.trim().slice(0, 50)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    setLaboratorySignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleNurseSignupChange = (event) => {
    const { name, value, type, checked, files } = event.target

    // Handle file uploads - now using generic documents array
    if (type === 'file' && files && files.length > 0) {
      handleDocumentUpload(event, 'nurse')
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
      let limitedValue = value

      // Apply length limits based on field type
      if (key === 'line1') {
        limitedValue = value.slice(0, 200) // Address line can be longer
      } else if (key === 'city' || key === 'state') {
        limitedValue = value.slice(0, 100) // City and state names
      } else if (key === 'postalCode') {
        // Already handled separately below
        limitedValue = value
      } else if (key === 'country') {
        limitedValue = value.slice(0, 100)
      }

      setNurseSignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: limitedValue,
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

    // Handle specialization (now a simple select)
    if (name === 'specialization') {
      setNurseSignupData((prev) => ({
        ...prev,
        specialization: value,
      }))
      return
    }

    // Limit text fields
    if (name === 'fullName' || name === 'qualification' || name === 'registrationCouncilName') {
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

    // Limit postal code (6 digits only)
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

    // Limit experience years (0-50 years)
    if (name === 'experienceYears') {
      const numericValue = value.replace(/\D/g, '').slice(0, 2)
      const numValue = numericValue ? parseInt(numericValue, 10) : ''
      // Ensure value is between 0 and 50
      const finalValue = (numValue !== '' && !isNaN(numValue))
        ? (numValue > 50 ? '50' : (numValue < 0 ? '0' : String(numValue)))
        : numericValue
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    // Handle fees - preserve exact value as string to avoid precision loss
    if (name === 'fees') {
      // Remove any non-numeric characters except decimal point
      const cleanedValue = value.replace(/[^\d.]/g, '')
      // Ensure only one decimal point
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

  const handleLaboratorySignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!laboratorySignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    if (!laboratorySignupData.labName || !laboratorySignupData.email || !laboratorySignupData.phone || !laboratorySignupData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate labName
    if (laboratorySignupData.labName.trim().length < 2) {
      toast.error('Laboratory name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(laboratorySignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (laboratorySignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        labName: laboratorySignupData.labName,
        ownerName: laboratorySignupData.ownerName || undefined,
        email: laboratorySignupData.email,
        phone: laboratorySignupData.phone,
        licenseNumber: laboratorySignupData.licenseNumber,
        gstNumber: laboratorySignupData.gstNumber || undefined,
        address: Object.values(laboratorySignupData.address).some((val) => val) ? laboratorySignupData.address : undefined,
        timings: laboratorySignupData.timings ? [laboratorySignupData.timings] : undefined,
        contactPerson: Object.values(laboratorySignupData.contactPerson).some((val) => val) ? laboratorySignupData.contactPerson : undefined,
        operatingHours: Object.values(laboratorySignupData.operatingHours).some((val) => Array.isArray(val) ? val.length > 0 : val)
          ? laboratorySignupData.operatingHours
          : undefined,
        documents: laboratorySignupData.documents.length > 0 ? laboratorySignupData.documents : undefined,
      }

      const response = await signupLaboratory(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setLaboratorySignupData(initialLaboratorySignupState)
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

    // Validate experience years if provided
    if (nurseSignupData.experienceYears && nurseSignupData.experienceYears !== '') {
      const expYears = parseInt(nurseSignupData.experienceYears, 10)
      if (isNaN(expYears) || expYears < 0 || expYears > 50) {
        toast.error('Experience years must be between 0 and 50')
        return
      }
    }

    // Validate fees if provided
    if (nurseSignupData.fees && nurseSignupData.fees !== '') {
      const feesValue = parseFloat(nurseSignupData.fees)
      if (isNaN(feesValue) || feesValue < 0 || feesValue > 999999) {
        toast.error('Fees must be between ₹0 and ₹999999')
        return
      }
    }

    // Validate address fields length
    if (nurseSignupData.address.line1.trim().length < 5) {
      toast.error('Address line 1 must be at least 5 characters')
      return
    }
    if (nurseSignupData.address.city.trim().length < 2) {
      toast.error('City name must be at least 2 characters')
      return
    }
    if (nurseSignupData.address.state.trim().length < 2) {
      toast.error('State name must be at least 2 characters')
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
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isLogin
                ? `Sign in to your ${selectedModule} account to continue.`
                : `Join Heallyn as a ${selectedModule} to get started.`}
            </p>
          </div>

          {/* Login/Signup Mode Toggle */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full max-w-xs">
              {/* Sliding background indicator */}
              <motion.div
                layoutId="loginSignupToggle"
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
                className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${isLogin
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
                className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${!isLogin
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

          {/* Module Selection Toggle */}
          <div className="mb-8 flex items-center justify-center">
            <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full">
              {/* Sliding background indicator */}
              <motion.div
                layoutId="moduleToggle"
                className="absolute rounded-xl bg-[#11496c] shadow-md shadow-[#11496c]/15"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  height: 'calc(100% - 0.75rem)',
                  top: '0.375rem',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.button
                ref={doctorButtonRef}
                type="button"
                onClick={() => handleModuleChange('doctor')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'doctor'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Doctor
              </motion.button>
              <motion.button
                ref={pharmacyButtonRef}
                type="button"
                onClick={() => handleModuleChange('pharmacy')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'pharmacy'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Pharmacy
              </motion.button>
              <motion.button
                ref={laboratoryButtonRef}
                type="button"
                onClick={() => handleModuleChange('laboratory')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'laboratory'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Laboratory
              </motion.button>
              <motion.button
                ref={nurseButtonRef}
                type="button"
                onClick={() => handleModuleChange('nurse')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'nurse'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Nurse
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <LoginForm
                selectedModule={selectedModule}
                getCurrentLoginData={getCurrentLoginData}
                handleLoginChange={handleLoginChange}
                otpSent={otpSent}
                otpInputRefs={otpInputRefs}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                handleOtpPaste={handleOtpPaste}
                otpTimer={otpTimer}
                handleResendOtp={handleResendOtp}
                setOtpSent={setOtpSent}
                setOtpTimer={setOtpTimer}
                setCurrentLoginData={setCurrentLoginData}
                isSubmitting={isSubmitting}
                isSendingOtp={isSendingOtp}
                handleLoginSubmit={handleLoginSubmit}
                handleModeChange={handleModeChange}
              />
            ) : selectedModule === 'doctor' ? (
              <DoctorSignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handleDoctorSignupSubmit={handleDoctorSignupSubmit}
                doctorSignupData={doctorSignupData}
                setDoctorSignupData={setDoctorSignupData}
                handleDoctorSignupChange={handleDoctorSignupChange}
                showSpecializationDropdown={showSpecializationDropdown}
                setShowSpecializationDropdown={setShowSpecializationDropdown}
                specializationDropdownRef={specializationDropdownRef}
                specializationSearchTerm={specializationSearchTerm}
                setSpecializationSearchTerm={setSpecializationSearchTerm}
                availableSpecializations={availableSpecializations}
                filteredSpecializations={filteredSpecializations}
                specializationInputRef={specializationInputRef}
                addEducationEntry={addEducationEntry}
                removeEducationEntry={removeEducationEntry}
                removeLanguage={removeLanguage}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
              />
            ) : selectedModule === 'pharmacy' ? (
              <PharmacySignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handlePharmacySignupSubmit={handlePharmacySignupSubmit}
                pharmacySignupData={pharmacySignupData}
                handlePharmacySignupChange={handlePharmacySignupChange}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
                addOperatingHour={addOperatingHour}
                removeOperatingHour={removeOperatingHour}
                handleOperatingHourChange={handleOperatingHourChange}
              />
            ) : selectedModule === 'laboratory' ? (
              <LaboratorySignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handleLaboratorySignupSubmit={handleLaboratorySignupSubmit}
                laboratorySignupData={laboratorySignupData}
                handleLaboratorySignupChange={handleLaboratorySignupChange}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
              />
            ) : selectedModule === 'nurse' ? (
              <NurseSignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handleNurseSignupSubmit={handleNurseSignupSubmit}
                nurseSignupData={nurseSignupData}
                handleNurseSignupChange={handleNurseSignupChange}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/95 backdrop-blur mt-auto">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-4 text-center text-xs text-slate-500">
          <span>Secure access powered by Heallyn</span>
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

export default DoctorLogin

