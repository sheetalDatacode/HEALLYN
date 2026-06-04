import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoMedicalOutline,
  IoLanguageOutline,
  IoSchoolOutline,
  IoBriefcaseOutline,
  IoTimeOutline,
  IoCloudUploadOutline,
  IoCloseCircleOutline,
  IoEyeOutline,
} from 'react-icons/io5'
import {
  FaUserMd,
  FaPills,
  FaFlask,
  FaHeartbeat,
} from 'react-icons/fa'
import { useToast } from '../../../contexts/ToastContext'
import { signupPatient } from '../../patient/patient-services/patientService'
import { signupDoctor } from '../../doctor/doctor-services/doctorService'
import { signupPharmacy } from '../../pharmacy/pharmacy-services/pharmacyService'
import { signupLaboratory } from '../../laboratory/laboratory-services/laboratoryService'
import { signupNurse } from '../../nurse/nurse-services/nurseService'
import WebFooter from '../web-components/WebFooter'
import onboardingImage from '../../../assets/images/img4.png'
import healinnLogo from '../../../assets/images/logo.png'

const WebOnBoarding = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [selectedUserType, setSelectedUserType] = useState('patient') // 'patient' | 'doctor' | 'pharmacy' | 'laboratory' | 'nurse'
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs for user type buttons to measure positions for indicator
  const patientButtonRef = useRef(null)
  const doctorButtonRef = useRef(null)
  const pharmacyButtonRef = useRef(null)
  const laboratoryButtonRef = useRef(null)
  const nurseButtonRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // Patient signup state
  const initialPatientState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    termsAccepted: false,
  }
  const [patientData, setPatientData] = useState(initialPatientState)

  // Doctor signup state
  const initialDoctorState = {
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
    termsAccepted: false,
  }
  const [doctorData, setDoctorData] = useState(initialDoctorState)
  const [doctorDocuments, setDoctorDocuments] = useState([]) // Array of {file, preview, id}

  // Pharmacy signup state
  const initialPharmacyState = {
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
    termsAccepted: false,
  }
  const [pharmacyData, setPharmacyData] = useState(initialPharmacyState)
  const [pharmacyDocuments, setPharmacyDocuments] = useState([]) // Array of {file, preview, id}

  // Laboratory signup state
  const initialLaboratoryState = {
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
    termsAccepted: false,
  }
  const [laboratoryData, setLaboratoryData] = useState(initialLaboratoryState)
  const [laboratoryDocuments, setLaboratoryDocuments] = useState([]) // Array of {file, preview, id}

  // Nurse signup state
  const initialNurseState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    qualification: '',
    registrationNumber: '',
    registrationCouncilName: '',
    experienceYears: '',
    specialization: '',
    fees: '',
    bio: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    termsAccepted: false,
  }
  const [nurseData, setNurseData] = useState(initialNurseState)
  const [nurseDocuments, setNurseDocuments] = useState({
    nursingCertificate: null,
    registrationCertificate: null,
    profileImage: null,
  }) // Object with file, preview, name for each document type

  // Document upload handlers
  const handleDoctorDocumentUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    files.forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const newDoc = {
          id: Date.now() + Math.random(),
          file: file,
          preview: reader.result,
          name: file.name,
          type: file.type,
          size: file.size,
        }
        setDoctorDocuments((prev) => [...prev, newDoc])
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    e.target.value = ''
  }

  const removeDoctorDocument = (id) => {
    setDoctorDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handlePharmacyDocumentUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    files.forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const newDoc = {
          id: Date.now() + Math.random(),
          file: file,
          preview: reader.result,
          name: file.name,
          type: file.type,
          size: file.size,
        }
        setPharmacyDocuments((prev) => [...prev, newDoc])
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    e.target.value = ''
  }

  const removePharmacyDocument = (id) => {
    setPharmacyDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleLaboratoryDocumentUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    files.forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const newDoc = {
          id: Date.now() + Math.random(),
          file: file,
          preview: reader.result,
          name: file.name,
          type: file.type,
          size: file.size,
        }
        setLaboratoryDocuments((prev) => [...prev, newDoc])
      }
      reader.readAsDataURL(file)
    })
    
    // Reset input
    e.target.value = ''
  }

  const removeLaboratoryDocument = (id) => {
    setLaboratoryDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleNurseDocumentUpload = (e, documentType) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setNurseDocuments((prev) => ({
        ...prev,
        [documentType]: {
          file: file,
          preview: reader.result,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      }))
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ''
  }

  const removeNurseDocument = (documentType) => {
    setNurseDocuments((prev) => ({
      ...prev,
      [documentType]: null,
    }))
  }

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState(null)

  // Convert file to base64 for submission
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Scroll to top when component mounts or route changes
  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    
    // Also scroll the form container to top (for mobile/scrollable sections)
    const formContainer = document.querySelector('.overflow-y-auto')
    if (formContainer) {
      formContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location.pathname])

  // Update indicator position based on selected user type
  useEffect(() => {
    const updateIndicatorPosition = () => {
      const container = patientButtonRef.current?.parentElement
      if (!container) return

      const activeButtonRef =
        selectedUserType === 'patient'
          ? patientButtonRef
          : selectedUserType === 'doctor'
            ? doctorButtonRef
            : selectedUserType === 'pharmacy'
              ? pharmacyButtonRef
              : selectedUserType === 'laboratory'
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

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateIndicatorPosition)
    }, 0)

    window.addEventListener('resize', updateIndicatorPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateIndicatorPosition)
    }
  }, [selectedUserType])

  const STORAGE_KEY = 'heallyn_onboarding_data'

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (parsed.selectedUserType) setSelectedUserType(parsed.selectedUserType)
        if (parsed.patientData) setPatientData(prev => ({ ...prev, ...parsed.patientData }))
        if (parsed.doctorData) setDoctorData(prev => ({ ...prev, ...parsed.doctorData }))
        if (parsed.pharmacyData) setPharmacyData(prev => ({ ...prev, ...parsed.pharmacyData }))
        if (parsed.laboratoryData) setLaboratoryData(prev => ({ ...prev, ...parsed.laboratoryData }))
        if (parsed.nurseData) setNurseData(prev => ({ ...prev, ...parsed.nurseData }))
      } catch (e) {
        console.error('Failed to parse saved onboarding data', e)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  // Note: We don't save documents/files to localStorage to avoid quota issues and non-serializable data
  useEffect(() => {
    const dataToSave = {
      selectedUserType,
      patientData,
      doctorData,
      pharmacyData,
      laboratoryData,
      nurseData,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  }, [selectedUserType, patientData, doctorData, pharmacyData, laboratoryData, nurseData])

  const handleUserTypeChange = (userType) => {
    setSelectedUserType(userType)
    setIsSubmitting(false)
    // Reset documents when switching user types
    setDoctorDocuments([])
    setPharmacyDocuments([])
    setLaboratoryDocuments([])
    setNurseDocuments({
      nursingCertificate: null,
      registrationCertificate: null,
      profileImage: null,
    })
  }

  // Patient form handlers
  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target
    setPatientData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handlePatientSubmit = async (e) => {
    e.preventDefault()
    
    if (!patientData.termsAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        firstName: patientData.firstName,
        lastName: patientData.lastName || undefined,
        email: patientData.email,
        phone: patientData.phone,
      }

      const response = await signupPatient(payload)

      if (response.success) {
        toast.success('Registration successful! Redirecting to home...')
        // Clear saved form data on success
        localStorage.removeItem(STORAGE_KEY)
        setTimeout(() => {
          navigate('/patient/login')
        }, 1500)
      } else {
        toast.error(response.message || 'Registration failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Doctor helper functions
  const addEducationEntry = () => {
    setDoctorData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }],
    }))
  }

  const removeEducationEntry = (index) => {
    setDoctorData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const removeLanguage = (lang) => {
    setDoctorData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
    }))
  }

  // Doctor form handlers
  const handleDoctorChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'termsAccepted') {
      setDoctorData((prev) => ({
        ...prev,
        termsAccepted: checked,
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
      setDoctorData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    if (name.startsWith('clinicDetails.address.')) {
      const key = name.split('.')[2]
      setDoctorData((prev) => ({
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
      if (key === 'name') {
        setDoctorData((prev) => ({
          ...prev,
          clinicDetails: {
            ...prev.clinicDetails,
            name: value,
          },
        }))
      }
      return
    }

    if (name.startsWith('education.')) {
      const parts = name.split('.')
      const index = parseInt(parts[1])
      const field = parts[2]
      setDoctorData((prev) => {
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
      setDoctorData((prev) => {
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
      // This will be handled on Enter key in the input field
      return
    }

    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setDoctorData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }

    setDoctorData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleLanguageInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const langValue = e.target.value.trim()
      if (langValue && !doctorData.languages.includes(langValue)) {
        setDoctorData((prev) => ({
          ...prev,
          languages: [...prev.languages, langValue],
        }))
        e.target.value = ''
      }
    }
  }

  const handleDoctorSubmit = async (e) => {
    e.preventDefault()
    
    if (!doctorData.termsAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (!doctorData.firstName || !doctorData.email || !doctorData.phone || !doctorData.specialization || !doctorData.gender || !doctorData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (doctorData.firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(doctorData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    if (doctorData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert documents to base64
      const documentsBase64 = await Promise.all(
        doctorDocuments.map((doc) => fileToBase64(doc.file).then((base64) => ({
          name: doc.name,
          type: doc.type,
          data: base64,
        })))
      )

      const payload = {
        firstName: doctorData.firstName,
        lastName: doctorData.lastName || undefined,
        email: doctorData.email,
        phone: doctorData.phone,
        specialization: doctorData.specialization,
        gender: doctorData.gender,
        licenseNumber: doctorData.licenseNumber,
        experienceYears: doctorData.experienceYears ? Number(doctorData.experienceYears) : undefined,
        qualification: doctorData.qualification || undefined,
        bio: doctorData.bio || undefined,
        consultationFee: doctorData.consultationFee && doctorData.consultationFee !== '' 
          ? (() => {
              const feeStr = String(doctorData.consultationFee).trim()
              const feeNum = parseFloat(feeStr)
              
              return !isNaN(feeNum) && isFinite(feeNum) ? feeNum : undefined
            })()
          : undefined,
        languages: doctorData.languages.length > 0 ? doctorData.languages : undefined,
        consultationModes: doctorData.consultationModes.length > 0 ? doctorData.consultationModes : undefined,
        education: doctorData.education.filter((edu) => edu.institution || edu.degree || edu.year).length > 0
          ? doctorData.education.filter((edu) => edu.institution || edu.degree || edu.year)
          : undefined,
        clinicName: doctorData.clinicDetails.name || undefined,
        clinicAddress: Object.values(doctorData.clinicDetails.address).some((val) => val)
          ? doctorData.clinicDetails.address
          : undefined,
        documents: documentsBase64.length > 0 ? documentsBase64 : undefined,
      }

      const response = await signupDoctor(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval. Redirecting to home...')
        // Clear saved form data on success
        localStorage.removeItem(STORAGE_KEY)
        setTimeout(() => {
          navigate('/login?type=doctor')
        }, 1500)
      } else {
        toast.error(response.message || 'Registration failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Pharmacy form handlers
  const handlePharmacyChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'termsAccepted') {
      setPharmacyData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setPharmacyData((prev) => ({
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
      if (key === 'phone') {
        const numericValue = value.replace(/\D/g, '').slice(0, 10)
        setPharmacyData((prev) => ({
          ...prev,
          contactPerson: {
            ...prev.contactPerson,
            phone: numericValue,
          },
        }))
        return
      }
      setPharmacyData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [key]: value,
        },
      }))
      return
    }

    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setPharmacyData((prev) => ({
        ...prev,
        phone: numericValue,
      }))
      return
    }

    setPharmacyData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePharmacySubmit = async (e) => {
    e.preventDefault()
    
    if (!pharmacyData.termsAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (!pharmacyData.pharmacyName || !pharmacyData.email || !pharmacyData.phone || !pharmacyData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (pharmacyData.pharmacyName.trim().length < 2) {
      toast.error('Pharmacy name must be at least 2 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(pharmacyData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    if (pharmacyData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert documents to base64
      const documentsBase64 = await Promise.all(
        pharmacyDocuments.map((doc) => fileToBase64(doc.file).then((base64) => ({
          name: doc.name,
          type: doc.type,
          data: base64,
        })))
      )

      const payload = {
        pharmacyName: pharmacyData.pharmacyName,
        ownerName: pharmacyData.ownerName || undefined,
        email: pharmacyData.email,
        phone: pharmacyData.phone,
        licenseNumber: pharmacyData.licenseNumber,
        gstNumber: pharmacyData.gstNumber || undefined,
        address: Object.values(pharmacyData.address).some((val) => val) ? pharmacyData.address : undefined,
        timings: pharmacyData.timings ? [pharmacyData.timings] : undefined,
        contactPerson: Object.values(pharmacyData.contactPerson).some((val) => val) ? pharmacyData.contactPerson : undefined,
        documents: documentsBase64.length > 0 ? documentsBase64 : undefined,
      }

      const response = await signupPharmacy(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval. Redirecting to home...')
        // Clear saved form data on success
        localStorage.removeItem(STORAGE_KEY)
        setTimeout(() => {
          navigate('/login?type=pharmacy')
        }, 1500)
      } else {
        toast.error(response.message || 'Registration failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Laboratory form handlers
  const handleLaboratoryChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'termsAccepted') {
      setLaboratoryData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setLaboratoryData((prev) => ({
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
      if (key === 'phone') {
        const numericValue = value.replace(/\D/g, '').slice(0, 10)
        setLaboratoryData((prev) => ({
          ...prev,
          contactPerson: {
            ...prev.contactPerson,
            phone: numericValue,
          },
        }))
        return
      }
      setLaboratoryData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [key]: value,
        },
      }))
      return
    }

    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setLaboratoryData((prev) => ({
        ...prev,
        phone: numericValue,
      }))
      return
    }

    if (name.startsWith('operatingHours.')) {
      const key = name.split('.')[1]
      if (key === 'days') {
        const days = laboratoryData.operatingHours.days || []
        if (checked && !days.includes(value)) {
          setLaboratoryData((prev) => ({
            ...prev,
            operatingHours: {
              ...prev.operatingHours,
              days: [...days, value],
            },
          }))
        } else if (!checked && days.includes(value)) {
          setLaboratoryData((prev) => ({
            ...prev,
            operatingHours: {
              ...prev.operatingHours,
              days: days.filter((d) => d !== value),
            },
          }))
        }
        return
      }
      setLaboratoryData((prev) => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [key]: value,
        },
      }))
      return
    }

    setLaboratoryData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLaboratorySubmit = async (e) => {
    e.preventDefault()
    
    if (!laboratoryData.termsAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (!laboratoryData.labName || !laboratoryData.email || !laboratoryData.phone || !laboratoryData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (laboratoryData.labName.trim().length < 2) {
      toast.error('Laboratory name must be at least 2 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(laboratoryData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    if (laboratoryData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert documents to base64
      const documentsBase64 = await Promise.all(
        laboratoryDocuments.map((doc) => fileToBase64(doc.file).then((base64) => ({
          name: doc.name,
          type: doc.type,
          data: base64,
        })))
      )

      const payload = {
        labName: laboratoryData.labName,
        ownerName: laboratoryData.ownerName || undefined,
        email: laboratoryData.email,
        phone: laboratoryData.phone,
        licenseNumber: laboratoryData.licenseNumber,
        gstNumber: laboratoryData.gstNumber || undefined,
        address: Object.values(laboratoryData.address).some((val) => val) ? laboratoryData.address : undefined,
        testsOffered: laboratoryData.testsOffered || undefined,
        timings: laboratoryData.timings ? [laboratoryData.timings] : undefined,
        contactPerson: Object.values(laboratoryData.contactPerson).some((val) => val) ? laboratoryData.contactPerson : undefined,
        operatingHours: Object.values(laboratoryData.operatingHours).some((val) => Array.isArray(val) ? val.length > 0 : val)
          ? laboratoryData.operatingHours
          : undefined,
        documents: documentsBase64.length > 0 ? documentsBase64 : undefined,
      }

      const response = await signupLaboratory(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval. Redirecting to home...')
        // Clear saved form data on success
        localStorage.removeItem(STORAGE_KEY)
        setTimeout(() => {
          navigate('/login?type=laboratory')
        }, 1500)
      } else {
        toast.error(response.message || 'Registration failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Nurse form handlers
  const handleNurseChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'termsAccepted') {
      setNurseData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setNurseData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }))
      return
    }

    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setNurseData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }

    if (name === 'fees') {
      // Remove any non-numeric characters except decimal point
      const cleanedValue = value.replace(/[^\d.]/g, '')
      // Ensure only one decimal point
      const parts = cleanedValue.split('.')
      const finalValue = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0]
      setNurseData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    setNurseData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleNurseSubmit = async (e) => {
    e.preventDefault()
    
    if (!nurseData.termsAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (!nurseData.firstName || !nurseData.email || !nurseData.phone || !nurseData.qualification || !nurseData.registrationNumber || !nurseData.registrationCouncilName) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (nurseData.firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(nurseData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    if (nurseData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    if (!nurseData.address.line1 || !nurseData.address.city || !nurseData.address.state || !nurseData.address.postalCode) {
      toast.error('Please provide complete address (Line 1, City, State, and Postal Code)')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert documents to base64
      const documentsBase64 = []
      if (nurseDocuments.nursingCertificate) {
        const base64 = await fileToBase64(nurseDocuments.nursingCertificate.file)
        documentsBase64.push({
          name: nurseDocuments.nursingCertificate.name,
          type: nurseDocuments.nursingCertificate.type,
          data: base64,
        })
      }
      if (nurseDocuments.registrationCertificate) {
        const base64 = await fileToBase64(nurseDocuments.registrationCertificate.file)
        documentsBase64.push({
          name: nurseDocuments.registrationCertificate.name,
          type: nurseDocuments.registrationCertificate.type,
          data: base64,
        })
      }

      const payload = {
        firstName: nurseData.firstName,
        lastName: nurseData.lastName || undefined,
        email: nurseData.email,
        phone: nurseData.phone,
        gender: nurseData.gender || undefined,
        qualification: nurseData.qualification,
        registrationNumber: nurseData.registrationNumber,
        registrationCouncilName: nurseData.registrationCouncilName,
        experienceYears: nurseData.experienceYears ? Number(nurseData.experienceYears) : undefined,
        specialization: nurseData.specialization || undefined,
        fees: nurseData.fees && nurseData.fees !== '' 
          ? (() => {
              const feeStr = String(nurseData.fees).trim()
              const feeNum = parseFloat(feeStr)
              return !isNaN(feeNum) && isFinite(feeNum) ? feeNum : undefined
            })()
          : undefined,
        bio: nurseData.bio || undefined,
        address: {
          line1: nurseData.address.line1,
          city: nurseData.address.city,
          state: nurseData.address.state,
          postalCode: nurseData.address.postalCode,
          country: nurseData.address.country || 'India',
          line2: nurseData.address.line2 || undefined,
        },
        documents: documentsBase64.length > 0 ? documentsBase64 : undefined,
      }

      const response = await signupNurse(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval. Redirecting to home...')
        // Clear saved form data on success
        localStorage.removeItem(STORAGE_KEY)
        setTimeout(() => {
          navigate('/login?type=nurse')
        }, 1500)
      } else {
        toast.error(response.message || 'Registration failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row flex-1">
      {/* Left Side - Logo and Image (Sticky) */}
      <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 order-1 md:order-1 md:sticky md:top-0 md:h-screen md:overflow-hidden relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#11496c]/10 hover:bg-[#11496c]/20 text-[#11496c] transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#11496c]/30 z-10"
          aria-label="Back to home"
        >
          <IoArrowBackOutline className="h-5 w-5" />
          <span className="text-sm font-semibold hidden sm:inline">Back to Home</span>
        </button>
        
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <img
            src={healinnLogo}
            alt="Heallyn Logo"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </div>
        {/* Image */}
        <img
          src={onboardingImage}
          alt="Healthcare Onboarding"
          className="w-full max-w-xs md:max-w-lg h-auto object-contain"
        />
      </div>

      {/* Right Side - Form (Scrollable) */}
      <div className="w-full md:w-1/2 bg-[#11496c] flex items-start justify-center order-2 md:order-2 overflow-y-auto md:h-screen">
          <div className="w-full max-w-2xl px-6 sm:px-8 lg:px-12 py-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Join Heallyn
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Start your healthcare journey with us
            </p>
          </div>

          {/* User Type Selection */}
          <div className="mb-10">
            <div className="relative flex items-center gap-1 rounded-2xl bg-white/10 p-1.5 backdrop-blur-sm">
              {/* Sliding indicator */}
              <div
                className="absolute rounded-xl bg-white/20 backdrop-blur-md transition-all duration-300 ease-in-out"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  height: 'calc(100% - 12px)',
                  top: '6px',
                }}
              />
              <button
                ref={patientButtonRef}
                type="button"
                onClick={() => handleUserTypeChange('patient')}
                className={`relative z-10 flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold text-center transition ${
                  selectedUserType === 'patient'
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <IoPersonOutline className="text-base sm:text-lg" />
                  <span className="hidden sm:inline">Patient</span>
                </div>
              </button>
              <button
                ref={doctorButtonRef}
                type="button"
                onClick={() => handleUserTypeChange('doctor')}
                className={`relative z-10 flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold text-center transition ${
                  selectedUserType === 'doctor'
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaUserMd className="text-base sm:text-lg" />
                  <span className="hidden sm:inline">Doctor</span>
                </div>
              </button>
              <button
                ref={pharmacyButtonRef}
                type="button"
                onClick={() => handleUserTypeChange('pharmacy')}
                className={`relative z-10 flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold text-center transition ${
                  selectedUserType === 'pharmacy'
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaPills className="text-base sm:text-lg" />
                  <span className="hidden sm:inline">Pharmacy</span>
                </div>
              </button>
              <button
                ref={laboratoryButtonRef}
                type="button"
                onClick={() => handleUserTypeChange('laboratory')}
                className={`relative z-10 flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold text-center transition ${
                  selectedUserType === 'laboratory'
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaFlask className="text-base sm:text-lg" />
                  <span className="hidden sm:inline">Lab</span>
                </div>
              </button>
              <button
                ref={nurseButtonRef}
                type="button"
                onClick={() => handleUserTypeChange('nurse')}
                className={`relative z-10 flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold text-center transition ${
                  selectedUserType === 'nurse'
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaHeartbeat className="text-base sm:text-lg" />
                  <span className="hidden sm:inline">Nurse</span>
                </div>
              </button>
            </div>
          </div>

          {/* Forms */}
          <div>
            {selectedUserType === 'patient' && (
              <form onSubmit={handlePatientSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="patient-firstName" className="text-sm font-semibold text-white">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="patient-firstName"
                        name="firstName"
                        type="text"
                        value={patientData.firstName}
                        onChange={handlePatientChange}
                        required
                        placeholder="John"
                        maxLength={50}
                        minLength={2}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 shadow-sm outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="patient-lastName" className="text-sm font-semibold text-white">
                      Last Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="patient-lastName"
                        name="lastName"
                        type="text"
                        value={patientData.lastName}
                        onChange={handlePatientChange}
                        placeholder="Doe"
                        maxLength={50}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 shadow-sm outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="patient-email" className="text-sm font-semibold text-white">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="patient-email"
                        name="email"
                        type="email"
                        value={patientData.email}
                        onChange={handlePatientChange}
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        maxLength={100}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 shadow-sm outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="patient-phone" className="text-sm font-semibold text-white">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="patient-phone"
                        name="phone"
                        type="tel"
                        value={patientData.phone}
                        onChange={handlePatientChange}
                        autoComplete="tel"
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-base text-white placeholder-white/50 shadow-sm outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur-sm px-4 py-4 text-sm text-white/90">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={patientData.termsAccepted}
                    onChange={handlePatientChange}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                  />
                  <span>
                    I have read and agree to Heallyn's{' '}
                    <a href="/terms" className="font-semibold text-white underline hover:text-white/80">
                      terms of service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="font-semibold text-white underline hover:text-white/80">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !patientData.termsAccepted}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[#11496c] text-base font-semibold shadow-lg transition hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11496c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <IoArrowForwardOutline className="text-xl" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Doctor Form */}
            {selectedUserType === 'doctor' && (
              <form onSubmit={handleDoctorSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-firstName" className="text-sm font-semibold text-white">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="doctor-firstName"
                        name="firstName"
                        type="text"
                        value={doctorData.firstName}
                        onChange={handleDoctorChange}
                        required
                        placeholder="John"
                        maxLength={50}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-lastName" className="text-sm font-semibold text-white">
                      Last Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="doctor-lastName"
                        name="lastName"
                        type="text"
                        value={doctorData.lastName}
                        onChange={handleDoctorChange}
                        placeholder="Doe"
                        maxLength={50}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-email" className="text-sm font-semibold text-white">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="doctor-email"
                        name="email"
                        type="email"
                        value={doctorData.email}
                        onChange={handleDoctorChange}
                        required
                        placeholder="you@example.com"
                        maxLength={100}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-phone" className="text-sm font-semibold text-white">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="doctor-phone"
                        name="phone"
                        type="tel"
                        value={doctorData.phone}
                        onChange={handleDoctorChange}
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-specialization" className="text-sm font-semibold text-white">
                      Specialization <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMedicalOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="doctor-specialization"
                        name="specialization"
                        type="text"
                        value={doctorData.specialization}
                        onChange={handleDoctorChange}
                        required
                        placeholder="Cardiology, General Medicine, etc."
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-gender" className="text-sm font-semibold text-white">
                      Gender <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="doctor-gender"
                      name="gender"
                      value={doctorData.gender}
                      onChange={handleDoctorChange}
                      required
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    >
                      <option value="" className="text-slate-900">Select gender</option>
                      <option value="male" className="text-slate-900">Male</option>
                      <option value="female" className="text-slate-900">Female</option>
                      <option value="other" className="text-slate-900">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-licenseNumber" className="text-sm font-semibold text-white">
                      License Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoDocumentTextOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="doctor-licenseNumber"
                        name="licenseNumber"
                        type="text"
                        value={doctorData.licenseNumber}
                        onChange={handleDoctorChange}
                        required
                        placeholder="Enter medical license number"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-experienceYears" className="text-sm font-semibold text-white">
                      Experience (Years)
                    </label>
                    <input
                      id="doctor-experienceYears"
                      name="experienceYears"
                      type="number"
                      value={doctorData.experienceYears}
                      onChange={handleDoctorChange}
                      placeholder="5"
                      min="0"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="doctor-qualification" className="text-sm font-semibold text-white">
                      Qualification
                    </label>
                    <input
                      id="doctor-qualification"
                      name="qualification"
                      type="text"
                      value={doctorData.qualification}
                      onChange={handleDoctorChange}
                      placeholder="MBBS, MD, etc."
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="doctor-bio" className="text-sm font-semibold text-white">
                      Bio
                    </label>
                    <textarea
                      id="doctor-bio"
                      name="bio"
                      value={doctorData.bio}
                      onChange={handleDoctorChange}
                      rows="3"
                      placeholder="Tell us about your professional background..."
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="doctor-consultationFee" className="text-sm font-semibold text-white">
                      Consultation Fee (₹)
                    </label>
                    <input
                      id="doctor-consultationFee"
                      name="consultationFee"
                      type="number"
                      value={doctorData.consultationFee}
                      onChange={handleDoctorChange}
                      placeholder="500"
                      min="0"
                      step="1"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Languages */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="doctor-languages" className="text-sm font-semibold text-white">
                    Languages Spoken
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {doctorData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang)}
                          className="hover:text-white/70"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoLanguageOutline className="h-5 w-5 text-white" />
                      </span>
                    <input
                      id="doctor-languages"
                      name="languages"
                      type="text"
                      placeholder="Enter language and press Enter"
                      onKeyDown={handleLanguageInput}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Consultation Modes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-white mb-2">
                    Consultation Modes
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {['in_person', 'call', 'audio', 'chat', 'video'].map((mode) => (
                      <label key={mode} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition">
                        <input
                          type="checkbox"
                          name="consultationModes"
                          value={mode}
                          checked={doctorData.consultationModes.includes(mode)}
                          onChange={handleDoctorChange}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-white capitalize">{mode.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white">
                      Education
                    </label>
                    <button
                      type="button"
                      onClick={addEducationEntry}
                      disabled={isSubmitting}
                      className="text-xs font-semibold text-white/80 hover:text-white transition disabled:opacity-50"
                    >
                      + Add Education
                    </button>
                  </div>
                  <div className="space-y-3">
                    {doctorData.education.map((edu, index) => (
                      <div key={index} className="grid gap-3 sm:grid-cols-3 bg-white/5 p-3 rounded-xl">
                        <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoSchoolOutline className="h-4 w-4 text-white" />
                      </span>
                          <input
                            name={`education.${index}.institution`}
                            value={edu.institution}
                            onChange={handleDoctorChange}
                            placeholder="Institution"
                            disabled={isSubmitting}
                            className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 pl-10 text-xs text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                          />
                        </div>
                        <input
                          name={`education.${index}.degree`}
                          value={edu.degree}
                          onChange={handleDoctorChange}
                          placeholder="Degree"
                          disabled={isSubmitting}
                          className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                        />
                        <div className="flex gap-2">
                          <input
                            name={`education.${index}.year`}
                            type="number"
                            value={edu.year}
                            onChange={handleDoctorChange}
                            placeholder="Year"
                            disabled={isSubmitting}
                            className="flex-1 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                          />
                          {doctorData.education.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEducationEntry(index)}
                              disabled={isSubmitting}
                              className="px-3 text-red-400 hover:text-red-300 transition disabled:opacity-50"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinic Details */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoLocationOutline className="h-5 w-5" />
                    Clinic Details
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="clinicDetails.name" className="text-sm font-semibold text-white">
                      Clinic Name
                    </label>
                    <input
                      id="clinicDetails.name"
                      name="clinicDetails.name"
                      value={doctorData.clinicDetails.name}
                      onChange={handleDoctorChange}
                      placeholder="ABC Medical Clinic"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label htmlFor="clinicDetails.address.line1" className="text-sm font-semibold text-white">
                        Address Line 1
                      </label>
                      <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoLocationOutline className="h-5 w-5 text-white" />
                      </span>
                        <input
                          id="clinicDetails.address.line1"
                          name="clinicDetails.address.line1"
                          value={doctorData.clinicDetails.address.line1}
                          onChange={handleDoctorChange}
                          placeholder="123 Health Street"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <input
                      name="clinicDetails.address.line2"
                      value={doctorData.clinicDetails.address.line2}
                      onChange={handleDoctorChange}
                      placeholder="Address Line 2 (optional)"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="clinicDetails.address.city"
                      value={doctorData.clinicDetails.address.city}
                      onChange={handleDoctorChange}
                      placeholder="City"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="clinicDetails.address.state"
                      value={doctorData.clinicDetails.address.state}
                      onChange={handleDoctorChange}
                      placeholder="State"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="clinicDetails.address.postalCode"
                      value={doctorData.clinicDetails.address.postalCode}
                      onChange={handleDoctorChange}
                      placeholder="Postal Code"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="clinicDetails.address.country"
                      value={doctorData.clinicDetails.address.country}
                      onChange={handleDoctorChange}
                      placeholder="Country"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoDocumentTextOutline className="h-5 w-5" />
                    Upload Documents
                  </h3>
                  <p className="text-xs text-white/70">
                    Upload all relevant documents (Aadhar Card, PAN Card, Medical License, Certificates, etc.)
                  </p>
                  
                  {/* File Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      id="doctor-documents"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleDoctorDocumentUpload}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                    <label
                      htmlFor="doctor-documents"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isSubmitting
                          ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                          : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                      }`}
                    >
                      <IoCloudUploadOutline className="h-8 w-8 text-white/70 mb-2" />
                      <p className="text-sm font-medium text-white">
                        Click to upload documents
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        PDF, JPG, PNG, DOC (Max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Documents Preview */}
                  {doctorDocuments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/80">
                        Uploaded Documents ({doctorDocuments.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {doctorDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/10 border border-white/20"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <IoDocumentTextOutline className="h-5 w-5 text-white shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                                <p className="text-xs text-white/60">{(doc.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                                title="Preview"
                              >
                                <IoEyeOutline className="h-4 w-4 text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDoctorDocument(doc.id)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                                title="Remove"
                              >
                                <IoCloseCircleOutline className="h-4 w-4 text-red-300" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur-sm px-4 py-4 text-sm text-white/90">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={doctorData.termsAccepted}
                    onChange={handleDoctorChange}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                  />
                  <span>
                    I have read and agree to Heallyn's{' '}
                    <a href="/terms" className="font-semibold text-white underline hover:text-white/80">
                      terms of service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="font-semibold text-white underline hover:text-white/80">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !doctorData.termsAccepted}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[#11496c] text-base font-semibold shadow-lg transition hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11496c] disabled:cursor-not-allowed disabled:opacity-70"
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
                      Complete Registration
                      <IoArrowForwardOutline className="text-xl" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Pharmacy Form */}
            {selectedUserType === 'pharmacy' && (
              <form onSubmit={handlePharmacySubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="pharmacy-name" className="text-sm font-semibold text-white">
                      Pharmacy Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <FaPills className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="pharmacy-name"
                        name="pharmacyName"
                        type="text"
                        value={pharmacyData.pharmacyName}
                        onChange={handlePharmacyChange}
                        required
                        placeholder="ABC Pharmacy"
                        maxLength={100}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pharmacy-ownerName" className="text-sm font-semibold text-white">
                      Owner Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="pharmacy-ownerName"
                        name="ownerName"
                        type="text"
                        value={pharmacyData.ownerName}
                        onChange={handlePharmacyChange}
                        placeholder="John Doe"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pharmacy-email" className="text-sm font-semibold text-white">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="pharmacy-email"
                        name="email"
                        type="email"
                        value={pharmacyData.email}
                        onChange={handlePharmacyChange}
                        required
                        placeholder="pharmacy@example.com"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pharmacy-phone" className="text-sm font-semibold text-white">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="pharmacy-phone"
                        name="phone"
                        type="tel"
                        value={pharmacyData.phone}
                        onChange={handlePharmacyChange}
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pharmacy-licenseNumber" className="text-sm font-semibold text-white">
                      License Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoDocumentTextOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="pharmacy-licenseNumber"
                        name="licenseNumber"
                        type="text"
                        value={pharmacyData.licenseNumber}
                        onChange={handlePharmacyChange}
                        required
                        placeholder="Enter pharmacy license number"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pharmacy-gstNumber" className="text-sm font-semibold text-white">
                      GST Number
                    </label>
                    <input
                      id="pharmacy-gstNumber"
                      name="gstNumber"
                      type="text"
                      value={pharmacyData.gstNumber}
                      onChange={handlePharmacyChange}
                      placeholder="GST123456789"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="pharmacy-timings" className="text-sm font-semibold text-white">
                      Operating Timings
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoTimeOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="pharmacy-timings"
                        name="timings"
                        type="text"
                        value={pharmacyData.timings}
                        onChange={handlePharmacyChange}
                        placeholder="9:00 AM - 9:00 PM"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoLocationOutline className="h-5 w-5" />
                    Address
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label htmlFor="pharmacy-address.line1" className="text-sm font-semibold text-white">
                        Address Line 1
                      </label>
                      <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoLocationOutline className="h-5 w-5 text-white" />
                      </span>
                        <input
                          id="pharmacy-address.line1"
                          name="address.line1"
                          value={pharmacyData.address.line1}
                          onChange={handlePharmacyChange}
                          placeholder="123 Pharmacy Street"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <input
                      name="address.line2"
                      value={pharmacyData.address.line2}
                      onChange={handlePharmacyChange}
                      placeholder="Address Line 2 (optional)"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.city"
                      value={pharmacyData.address.city}
                      onChange={handlePharmacyChange}
                      placeholder="City"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.state"
                      value={pharmacyData.address.state}
                      onChange={handlePharmacyChange}
                      placeholder="State"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.postalCode"
                      value={pharmacyData.address.postalCode}
                      onChange={handlePharmacyChange}
                      placeholder="Postal Code"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.country"
                      value={pharmacyData.address.country}
                      onChange={handlePharmacyChange}
                      placeholder="Country"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoPersonOutline className="h-5 w-5" />
                    Contact Person
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      name="contactPerson.name"
                      value={pharmacyData.contactPerson.name}
                      onChange={handlePharmacyChange}
                      placeholder="Name"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        name="contactPerson.phone"
                        type="tel"
                        value={pharmacyData.contactPerson.phone}
                        onChange={handlePharmacyChange}
                        placeholder="Phone"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                    <div className="relative sm:col-span-2">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        name="contactPerson.email"
                        type="email"
                        value={pharmacyData.contactPerson.email}
                        onChange={handlePharmacyChange}
                        placeholder="Email"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoDocumentTextOutline className="h-5 w-5" />
                    Upload Documents
                  </h3>
                  <p className="text-xs text-white/70">
                    Upload all relevant documents (Aadhar Card, PAN Card, Pharmacy License, GST Certificate, etc.)
                  </p>
                  
                  {/* File Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      id="pharmacy-documents"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handlePharmacyDocumentUpload}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                    <label
                      htmlFor="pharmacy-documents"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isSubmitting
                          ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                          : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                      }`}
                    >
                      <IoCloudUploadOutline className="h-8 w-8 text-white/70 mb-2" />
                      <p className="text-sm font-medium text-white">
                        Click to upload documents
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        PDF, JPG, PNG, DOC (Max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Documents Preview */}
                  {pharmacyDocuments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/80">
                        Uploaded Documents ({pharmacyDocuments.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {pharmacyDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/10 border border-white/20"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <IoDocumentTextOutline className="h-5 w-5 text-white shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                                <p className="text-xs text-white/60">{(doc.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                                title="Preview"
                              >
                                <IoEyeOutline className="h-4 w-4 text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removePharmacyDocument(doc.id)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                                title="Remove"
                              >
                                <IoCloseCircleOutline className="h-4 w-4 text-red-300" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur-sm px-4 py-4 text-sm text-white/90">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={pharmacyData.termsAccepted}
                    onChange={handlePharmacyChange}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                  />
                  <span>
                    I have read and agree to Heallyn's{' '}
                    <a href="/terms" className="font-semibold text-white underline hover:text-white/80">
                      terms of service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="font-semibold text-white underline hover:text-white/80">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !pharmacyData.termsAccepted}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[#11496c] text-base font-semibold shadow-lg transition hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11496c] disabled:cursor-not-allowed disabled:opacity-70"
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
                      Complete Registration
                      <IoArrowForwardOutline className="text-xl" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Laboratory Form */}
            {selectedUserType === 'laboratory' && (
              <form onSubmit={handleLaboratorySubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="lab-name" className="text-sm font-semibold text-white">
                      Laboratory Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <FaFlask className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="lab-name"
                        name="labName"
                        type="text"
                        value={laboratoryData.labName}
                        onChange={handleLaboratoryChange}
                        required
                        placeholder="ABC Diagnostic Laboratory"
                        maxLength={100}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lab-ownerName" className="text-sm font-semibold text-white">
                      Owner Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="lab-ownerName"
                        name="ownerName"
                        type="text"
                        value={laboratoryData.ownerName}
                        onChange={handleLaboratoryChange}
                        placeholder="John Doe"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lab-email" className="text-sm font-semibold text-white">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="lab-email"
                        name="email"
                        type="email"
                        value={laboratoryData.email}
                        onChange={handleLaboratoryChange}
                        required
                        placeholder="lab@example.com"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lab-phone" className="text-sm font-semibold text-white">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="lab-phone"
                        name="phone"
                        type="tel"
                        value={laboratoryData.phone}
                        onChange={handleLaboratoryChange}
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lab-licenseNumber" className="text-sm font-semibold text-white">
                      License Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoDocumentTextOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="lab-licenseNumber"
                        name="licenseNumber"
                        type="text"
                        value={laboratoryData.licenseNumber}
                        onChange={handleLaboratoryChange}
                        required
                        placeholder="Enter laboratory license number"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lab-gstNumber" className="text-sm font-semibold text-white">
                      GST Number
                    </label>
                    <input
                      id="lab-gstNumber"
                      name="gstNumber"
                      type="text"
                      value={laboratoryData.gstNumber}
                      onChange={handleLaboratoryChange}
                      placeholder="GST123456789"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="lab-testsOffered" className="text-sm font-semibold text-white">
                      Tests Offered
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <FaFlask className="h-5 w-5 text-white" />
                      </span>
                      <textarea
                        id="lab-testsOffered"
                        name="testsOffered"
                        value={laboratoryData.testsOffered}
                        onChange={handleLaboratoryChange}
                        placeholder="List the tests your laboratory offers (e.g., Blood Test, X-Ray, MRI, etc.)"
                        disabled={isSubmitting}
                        rows={3}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="lab-timings" className="text-sm font-semibold text-white">
                      Operating Timings
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoTimeOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="lab-timings"
                        name="timings"
                        type="text"
                        value={laboratoryData.timings}
                        onChange={handleLaboratoryChange}
                        placeholder="9:00 AM - 9:00 PM"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="operatingHours.opening" className="text-sm font-semibold text-white">
                      Opening Time
                    </label>
                    <input
                      id="operatingHours.opening"
                      name="operatingHours.opening"
                      value={laboratoryData.operatingHours.opening}
                      onChange={handleLaboratoryChange}
                      placeholder="9:00 AM"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="operatingHours.closing" className="text-sm font-semibold text-white">
                      Closing Time
                    </label>
                    <input
                      id="operatingHours.closing"
                      name="operatingHours.closing"
                      value={laboratoryData.operatingHours.closing}
                      onChange={handleLaboratoryChange}
                      placeholder="9:00 PM"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold text-white mb-2">
                      Operating Days
                    </label>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label key={day} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition">
                          <input
                            type="checkbox"
                            name="operatingHours.days"
                            value={day}
                            checked={laboratoryData.operatingHours.days.includes(day)}
                            onChange={handleLaboratoryChange}
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-white">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoLocationOutline className="h-5 w-5" />
                    Address
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label htmlFor="lab-address.line1" className="text-sm font-semibold text-white">
                        Address Line 1
                      </label>
                      <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoLocationOutline className="h-5 w-5 text-white" />
                      </span>
                        <input
                          id="lab-address.line1"
                          name="address.line1"
                          value={laboratoryData.address.line1}
                          onChange={handleLaboratoryChange}
                          placeholder="123 Lab Street"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <input
                      name="address.line2"
                      value={laboratoryData.address.line2}
                      onChange={handleLaboratoryChange}
                      placeholder="Address Line 2 (optional)"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.city"
                      value={laboratoryData.address.city}
                      onChange={handleLaboratoryChange}
                      placeholder="City"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.state"
                      value={laboratoryData.address.state}
                      onChange={handleLaboratoryChange}
                      placeholder="State"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.postalCode"
                      value={laboratoryData.address.postalCode}
                      onChange={handleLaboratoryChange}
                      placeholder="Postal Code"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.country"
                      value={laboratoryData.address.country}
                      onChange={handleLaboratoryChange}
                      placeholder="Country"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoPersonOutline className="h-5 w-5" />
                    Contact Person
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      name="contactPerson.name"
                      value={laboratoryData.contactPerson.name}
                      onChange={handleLaboratoryChange}
                      placeholder="Name"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        name="contactPerson.phone"
                        type="tel"
                        value={laboratoryData.contactPerson.phone}
                        onChange={handleLaboratoryChange}
                        placeholder="Phone"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                    <div className="relative sm:col-span-2">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        name="contactPerson.email"
                        type="email"
                        value={laboratoryData.contactPerson.email}
                        onChange={handleLaboratoryChange}
                        placeholder="Email"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoDocumentTextOutline className="h-5 w-5" />
                    Upload Documents
                  </h3>
                  <p className="text-xs text-white/70">
                    Upload all relevant documents (Aadhar Card, PAN Card, Laboratory License, Accreditation Certificates, etc.)
                  </p>
                  
                  {/* File Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      id="laboratory-documents"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleLaboratoryDocumentUpload}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                    <label
                      htmlFor="laboratory-documents"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isSubmitting
                          ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                          : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                      }`}
                    >
                      <IoCloudUploadOutline className="h-8 w-8 text-white/70 mb-2" />
                      <p className="text-sm font-medium text-white">
                        Click to upload documents
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        PDF, JPG, PNG, DOC (Max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Documents Preview */}
                  {laboratoryDocuments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/80">
                        Uploaded Documents ({laboratoryDocuments.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {laboratoryDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/10 border border-white/20"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <IoDocumentTextOutline className="h-5 w-5 text-white shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                                <p className="text-xs text-white/60">{(doc.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                                title="Preview"
                              >
                                <IoEyeOutline className="h-4 w-4 text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeLaboratoryDocument(doc.id)}
                                disabled={isSubmitting}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                                title="Remove"
                              >
                                <IoCloseCircleOutline className="h-4 w-4 text-red-300" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur-sm px-4 py-4 text-sm text-white/90">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={laboratoryData.termsAccepted}
                    onChange={handleLaboratoryChange}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                  />
                  <span>
                    I have read and agree to Heallyn's{' '}
                    <a href="/terms" className="font-semibold text-white underline hover:text-white/80">
                      terms of service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="font-semibold text-white underline hover:text-white/80">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !laboratoryData.termsAccepted}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[#11496c] text-base font-semibold shadow-lg transition hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11496c] disabled:cursor-not-allowed disabled:opacity-70"
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
                      Complete Registration
                      <IoArrowForwardOutline className="text-xl" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Nurse Form */}
            {selectedUserType === 'nurse' && (
              <form onSubmit={handleNurseSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-firstName" className="text-sm font-semibold text-white">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-firstName"
                        name="firstName"
                        type="text"
                        value={nurseData.firstName}
                        onChange={handleNurseChange}
                        required
                        placeholder="John"
                        maxLength={50}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-lastName" className="text-sm font-semibold text-white">
                      Last Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoPersonOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-lastName"
                        name="lastName"
                        type="text"
                        value={nurseData.lastName}
                        onChange={handleNurseChange}
                        placeholder="Doe"
                        maxLength={50}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-email" className="text-sm font-semibold text-white">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMailOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-email"
                        name="email"
                        type="email"
                        value={nurseData.email}
                        onChange={handleNurseChange}
                        required
                        placeholder="nurse@example.com"
                        maxLength={100}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-phone" className="text-sm font-semibold text-white">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoCallOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-phone"
                        name="phone"
                        type="tel"
                        value={nurseData.phone}
                        onChange={handleNurseChange}
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        inputMode="numeric"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-gender" className="text-sm font-semibold text-white">
                      Gender
                    </label>
                    <select
                      id="nurse-gender"
                      name="gender"
                      value={nurseData.gender}
                      onChange={handleNurseChange}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    >
                      <option value="" className="text-slate-900">Select gender</option>
                      <option value="male" className="text-slate-900">Male</option>
                      <option value="female" className="text-slate-900">Female</option>
                      <option value="other" className="text-slate-900">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-qualification" className="text-sm font-semibold text-white">
                      Qualification <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoSchoolOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-qualification"
                        name="qualification"
                        type="text"
                        value={nurseData.qualification}
                        onChange={handleNurseChange}
                        required
                        placeholder="GNM, B.Sc Nursing, etc."
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-registrationNumber" className="text-sm font-semibold text-white">
                      Registration Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoDocumentTextOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-registrationNumber"
                        name="registrationNumber"
                        type="text"
                        value={nurseData.registrationNumber}
                        onChange={handleNurseChange}
                        required
                        placeholder="Enter nursing registration number"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-registrationCouncilName" className="text-sm font-semibold text-white">
                      Registration Council Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="nurse-registrationCouncilName"
                      name="registrationCouncilName"
                      type="text"
                      value={nurseData.registrationCouncilName}
                      onChange={handleNurseChange}
                      required
                      placeholder="Indian Nursing Council, etc."
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-experienceYears" className="text-sm font-semibold text-white">
                      Experience (Years)
                    </label>
                    <input
                      id="nurse-experienceYears"
                      name="experienceYears"
                      type="number"
                      value={nurseData.experienceYears}
                      onChange={handleNurseChange}
                      placeholder="5"
                      min="0"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-specialization" className="text-sm font-semibold text-white">
                      Specialization
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <IoMedicalOutline className="h-5 w-5 text-white" />
                      </span>
                      <input
                        id="nurse-specialization"
                        name="specialization"
                        type="text"
                        value={nurseData.specialization}
                        onChange={handleNurseChange}
                        placeholder="Critical Care, Pediatric, etc."
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nurse-fees" className="text-sm font-semibold text-white">
                      Service Fee (₹)
                    </label>
                    <input
                      id="nurse-fees"
                      name="fees"
                      type="number"
                      value={nurseData.fees}
                      onChange={handleNurseChange}
                      placeholder="500"
                      min="0"
                      step="1"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="nurse-bio" className="text-sm font-semibold text-white">
                      Bio
                    </label>
                    <textarea
                      id="nurse-bio"
                      name="bio"
                      value={nurseData.bio}
                      onChange={handleNurseChange}
                      rows="3"
                      placeholder="Tell us about your professional background..."
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoLocationOutline className="h-5 w-5" />
                    Address <span className="text-red-400">*</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label htmlFor="nurse-address.line1" className="text-sm font-semibold text-white">
                        Address Line 1 <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                          <IoLocationOutline className="h-5 w-5 text-white" />
                        </span>
                        <input
                          id="nurse-address.line1"
                          name="address.line1"
                          value={nurseData.address.line1}
                          onChange={handleNurseChange}
                          required
                          placeholder="123 Health Street"
                          disabled={isSubmitting}
                          className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <input
                      name="address.line2"
                      value={nurseData.address.line2}
                      onChange={handleNurseChange}
                      placeholder="Address Line 2 (optional)"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.city"
                      value={nurseData.address.city}
                      onChange={handleNurseChange}
                      required
                      placeholder="City"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.state"
                      value={nurseData.address.state}
                      onChange={handleNurseChange}
                      required
                      placeholder="State"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.postalCode"
                      value={nurseData.address.postalCode}
                      onChange={handleNurseChange}
                      required
                      placeholder="Postal Code"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                    <input
                      name="address.country"
                      value={nurseData.address.country}
                      onChange={handleNurseChange}
                      placeholder="Country"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Documents Upload */}
                <div className="border-t border-white/20 pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <IoDocumentTextOutline className="h-5 w-5" />
                    Upload Documents
                  </h3>
                  <p className="text-xs text-white/70">
                    Upload your nursing certificate and registration certificate (PDF, JPG, PNG, DOC - Max 10MB each)
                  </p>
                  
                  {/* Nursing Certificate */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/80">Nursing Certificate</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="nurse-nursingCertificate"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleNurseDocumentUpload(e, 'nursingCertificate')}
                        disabled={isSubmitting}
                        className="hidden"
                      />
                      <label
                        htmlFor="nurse-nursingCertificate"
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          isSubmitting
                            ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                            : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                        }`}
                      >
                        <IoCloudUploadOutline className="h-6 w-6 text-white/70 mb-1" />
                        <p className="text-xs font-medium text-white">Click to upload</p>
                      </label>
                    </div>
                    {nurseDocuments.nursingCertificate && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/10 border border-white/20">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <IoDocumentTextOutline className="h-4 w-4 text-white shrink-0" />
                          <p className="text-xs font-medium text-white truncate">{nurseDocuments.nursingCertificate.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNurseDocument('nursingCertificate')}
                          disabled={isSubmitting}
                          className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                        >
                          <IoCloseCircleOutline className="h-4 w-4 text-red-300" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Registration Certificate */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/80">Registration Certificate</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="nurse-registrationCertificate"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleNurseDocumentUpload(e, 'registrationCertificate')}
                        disabled={isSubmitting}
                        className="hidden"
                      />
                      <label
                        htmlFor="nurse-registrationCertificate"
                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          isSubmitting
                            ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                            : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                        }`}
                      >
                        <IoCloudUploadOutline className="h-6 w-6 text-white/70 mb-1" />
                        <p className="text-xs font-medium text-white">Click to upload</p>
                      </label>
                    </div>
                    {nurseDocuments.registrationCertificate && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/10 border border-white/20">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <IoDocumentTextOutline className="h-4 w-4 text-white shrink-0" />
                          <p className="text-xs font-medium text-white truncate">{nurseDocuments.registrationCertificate.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNurseDocument('registrationCertificate')}
                          disabled={isSubmitting}
                          className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition disabled:opacity-50"
                        >
                          <IoCloseCircleOutline className="h-4 w-4 text-red-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur-sm px-4 py-4 text-sm text-white/90">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={nurseData.termsAccepted}
                    onChange={handleNurseChange}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-[#11496c] focus:ring-white/20 disabled:cursor-not-allowed"
                  />
                  <span>
                    I have read and agree to Heallyn's{' '}
                    <a href="/terms" className="font-semibold text-white underline hover:text-white/80">
                      terms of service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="font-semibold text-white underline hover:text-white/80">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !nurseData.termsAccepted}
                  className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[#11496c] text-base font-semibold shadow-lg transition hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11496c] disabled:cursor-not-allowed disabled:opacity-70"
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
                      Complete Registration
                      <IoArrowForwardOutline className="text-xl" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/70 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => {
                  if (selectedUserType === 'patient') {
                    navigate('/patient/login')
                  } else {
                    navigate(`/login?type=${selectedUserType}`)
                  }
                }}
                className="font-semibold text-white underline hover:text-white/80 transition"
              >
                Go to Login
              </button>
            </p>
          </div>
        </div>
      </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 truncate flex-1 mr-4">
                {previewDoc.name}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition"
                aria-label="Close preview"
              >
                <IoCloseCircleOutline className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {previewDoc.type.startsWith('image/') ? (
                <img
                  src={previewDoc.preview}
                  alt={previewDoc.name}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                  <IoDocumentTextOutline className="h-20 w-20 text-[#11496c] mb-4" />
                  <p className="text-lg font-semibold text-slate-900 mb-2">{previewDoc.name}</p>
                  <p className="text-sm text-slate-600 mb-6">{(previewDoc.size / 1024).toFixed(2)} KB</p>
                  <a
                    href={previewDoc.preview}
                    download={previewDoc.name}
                    className="px-6 py-3 bg-[#11496c] text-white rounded-xl font-semibold hover:bg-[#0d3a54] transition flex items-center gap-2"
                  >
                    <IoDocumentTextOutline className="h-5 w-5" />
                    Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <WebFooter />
    </div>
  )
}

export default WebOnBoarding

