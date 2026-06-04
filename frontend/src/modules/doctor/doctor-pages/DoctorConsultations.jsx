import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useToast } from '../../../contexts/ToastContext'
import { getDoctorConsultations, getAllDoctorConsultations, getConsultationById, createConsultation, updateConsultation, getPatientById, getPatientHistory, createPrescription, getPrescriptions, getPatientQueue, getAllMedicines, getAllTests } from '../doctor-services/doctorService'
import { getSocket } from '../../../utils/socketClient'
import ConsultationSidebar from '../doctor-components/ConsultationSidebar'
import ConsultationHeader from '../doctor-components/ConsultationHeader'
import ConsultationTabs from '../doctor-components/ConsultationTabs'
import VitalsTab from '../doctor-components/VitalsTab'
import PrescriptionTab from '../doctor-components/PrescriptionTab'
import PatientHistoryTab from '../doctor-components/PatientHistoryTab'
import {
  IoDocumentTextOutline,
  IoSearchOutline,
  IoChevronDownOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoFlaskOutline,
  IoAddOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoDownloadOutline,
  IoAttachOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoBodyOutline,
  IoThermometerOutline,
  IoPulseOutline,
  IoWaterOutline,
  IoPrintOutline,
  IoEyeOutline,
  IoArrowBackOutline,
  IoCreateOutline,
  IoVideocamOutline,
  IoMailOutline,
  IoCallOutline,
} from 'react-icons/io5'

// Get doctor info from localStorage (set when doctor saves profile)
const getDoctorInfo = () => {
  try {
    const savedProfile = localStorage.getItem('doctorProfile')
    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      
      
      
      // Get signature - check multiple possible paths
      let signature = ''
      if (profile.digitalSignature?.imageUrl) {
        signature = profile.digitalSignature.imageUrl
      } else if (profile.digitalSignature) {
        // If it's a string directly
        signature = typeof profile.digitalSignature === 'string' ? profile.digitalSignature : ''
      }
      
      return {
        name: `${profile.firstName || 'Dr.'} ${profile.lastName || ''}`.trim() || profile.name || 'Dr. Unknown',
        qualification: profile.qualification || 'MBBS',
        licenseNumber: profile.licenseNumber || 'N/A',
        clinicName: profile.clinicDetails?.name || profile.clinicName || 'Clinic',
        clinicAddress: profile.clinicDetails?.address 
          ? `${profile.clinicDetails.address.line1 || ''}${profile.clinicDetails.address.line2 ? ', ' + profile.clinicDetails.address.line2 : ''}, ${profile.clinicDetails.address.city || ''}, ${profile.clinicDetails.address.state || ''} - ${profile.clinicDetails.address.postalCode || ''}`
          : profile.clinicAddress || '',
        phone: profile.phone || profile.contactNumber || '',
        email: profile.email || '',
        specialization: profile.specialization || 'General Physician',
        digitalSignature: signature,
      }
    }
  } catch (error) {
    console.error('Error loading doctor profile:', error)
  }
  
  // Default fallback
  return {
    name: 'Dr. Sarah Mitchell',
    qualification: 'MBBS, MD (Cardiology)',
    licenseNumber: 'MD-12345',
    clinicName: 'Heart Care Clinic',
    clinicAddress: '123 Medical Center Drive, Suite 200, New York, NY 10001',
    phone: '+1-555-123-4567',
    email: 'sarah.mitchell@example.com',
    specialization: 'General Physician',
    digitalSignature: '',
  }
}

// Mock data removed - using API data now

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const getTypeIcon = (mode) => {
  switch (mode) {
    case 'in_person':
      return IoPersonOutline
    case 'call':
    case 'audio':
      return IoCallOutline
    case 'chat':
      return IoMailOutline
    case 'video':
      return IoVideocamOutline
    default:
      return IoPersonOutline
  }
}

const getModeLabel = (mode) => {
  switch (mode) {
    case 'in_person':
      return 'In-Person'
    case 'video':
      return 'Video Call'
    default:
      return mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : 'In-Person'
  }
}

const DoctorConsultations = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') || 'all'
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
  const [loadingConsultations, setLoadingConsultations] = useState(false)
  const [consultationsError, setConsultationsError] = useState(null)
          
          // Helper function to calculate age from dateOfBirth
  const calculateAge = useCallback((dateOfBirth) => {
            if (!dateOfBirth) return null
    try {
            const birthDate = new Date(dateOfBirth)
      if (isNaN(birthDate.getTime())) return null
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            return age
    } catch (error) {
      console.error('Error calculating age:', error)
      return null
          }
  }, [])

  // Helper function to transform consultation data from API
  const transformConsultationData = useCallback((cons) => {
            const patientDateOfBirth = cons.patientId?.dateOfBirth
            const calculatedAge = patientDateOfBirth ? calculateAge(patientDateOfBirth) : (cons.patientId?.age || cons.age || null)
    
    // Format patient address properly
    let formattedAddress = 'Not provided'
    
    // Debug: Log address data
    if (cons.patientId?.address) {
      
    }
    
    if (cons.patientId?.address) {
      const address = cons.patientId.address
      // Check if address object has any non-empty values
      const hasAddressData = address && typeof address === 'object' && (
        address.line1 || 
        address.line2 || 
        address.city || 
        address.state || 
        address.postalCode || 
        address.country
      )
      
      if (hasAddressData) {
        const addressParts = [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
          address.country
        ].filter(part => part && typeof part === 'string' && part.trim() !== '')
        
        if (addressParts.length > 0) {
          formattedAddress = addressParts.join(', ')
        }
      }
    } else if (cons.patientAddress && typeof cons.patientAddress === 'string' && cons.patientAddress.trim() !== '') {
      formattedAddress = cons.patientAddress
    }
            
            return {
              id: cons._id || cons.id,
              _id: cons._id || cons.id,
              patientId: cons.patientId?._id || cons.patientId?.id || cons.patientId || 'pat-unknown',
              patientName: cons.patientId?.firstName && cons.patientId?.lastName
                ? `${cons.patientId.firstName} ${cons.patientId.lastName}`
                : cons.patientId?.name || cons.patientName || 'Unknown Patient',
              age: calculatedAge,
              gender: cons.patientId?.gender || cons.gender || 'male',
      appointmentTime: (() => {
        if (cons.appointmentId?.appointmentDate) {
          const dateStr = typeof cons.appointmentId.appointmentDate === 'string' 
            ? cons.appointmentId.appointmentDate.split('T')[0]
            : cons.appointmentId.appointmentDate instanceof Date
            ? cons.appointmentId.appointmentDate.toISOString().split('T')[0]
            : null
          if (dateStr) {
            return `${dateStr}T${cons.appointmentId.time || '00:00'}`
          }
        }
        if (cons.appointmentTime) return cons.appointmentTime
        if (cons.consultationDate) {
          const dateStr = typeof cons.consultationDate === 'string'
            ? cons.consultationDate.split('T')[0]
            : cons.consultationDate instanceof Date
            ? cons.consultationDate.toISOString().split('T')[0]
            : null
          if (dateStr) return `${dateStr}T00:00`
        }
        return new Date().toISOString()
      })(),
      appointmentDate: (() => {
        const dateValue = cons.appointmentId?.appointmentDate || cons.appointmentDate || cons.consultationDate
        if (!dateValue) return null
        if (typeof dateValue === 'string') {
          return dateValue.split('T')[0]
        }
        if (dateValue instanceof Date) {
          if (isNaN(dateValue.getTime())) return null
          return dateValue.toISOString().split('T')[0]
        }
        return null
      })(),
              appointmentType: cons.appointmentId?.appointmentType || cons.appointmentType || 'New',
              consultationMode: cons.appointmentId?.consultationMode || cons.consultationMode || 'in_person',
              status: cons.status || 'pending',
              reason: cons.chiefComplaint || cons.reason || 'Consultation',
              patientImage: cons.patientId?.profileImage || cons.patientId?.image || cons.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(cons.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
              patientPhone: cons.patientId?.phone || cons.patientPhone || '',
              patientEmail: cons.patientId?.email || cons.patientEmail || '',
      patientAddress: formattedAddress,
              diagnosis: cons.diagnosis || '',
              vitals: cons.vitals || {},
              medications: cons.medications || [],
              investigations: cons.investigations || [],
              advice: cons.advice || cons.notes || '',
              attachments: cons.attachments || [],
              originalData: cons,
            }
  }, [calculateAge])

  // Fetch consultations from API
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoadingConsultations(true)
        setConsultationsError(null)
        const response = await getDoctorConsultations()
        
        if (response.success && response.data) {
          const consultationsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.consultations || response.data.items || []
          
          // Transform API data to match component structure
          const transformed = consultationsData.map(transformConsultationData)
          
          // Remove duplicates based on consultation ID or patient ID + status
          const uniqueConsultations = transformed.reduce((acc, current) => {
            // Check if consultation with same ID already exists
            const existsById = acc.find(c => (c.id || c._id) === (current.id || current._id))
            if (existsById) {
              return acc // Skip duplicate
            }
            
            // Check if consultation with same patient ID and status already exists (for in-progress consultations)
            if (current.status === 'in-progress' || current.status === 'called') {
              const currentPatientId = current.patientId?._id || current.patientId
              const existsByPatient = acc.find(c => {
                const cPatientId = c.patientId?._id || c.patientId
                return cPatientId?.toString() === currentPatientId?.toString() && 
                       (c.status === 'in-progress' || c.status === 'called')
              })
              if (existsByPatient) {
                return acc // Skip duplicate
              }
            }
            
            acc.push(current)
            return acc
          }, [])
          
          // Set consultations from API data only (without duplicates)
          setConsultations(uniqueConsultations)
        }
      } catch (err) {
        console.error('Error fetching consultations:', err)
        // Check if it's a connection error
        const isConnectionError = err.message?.includes('Failed to fetch') || 
                                  err.message?.includes('ERR_CONNECTION_REFUSED') ||
                                  err.message?.includes('NetworkError') ||
                                  err instanceof TypeError && err.message === 'Failed to fetch'
        
        if (isConnectionError) {
          setConsultationsError('Unable to connect to server. Please check if the backend server is running.')
        } else {
          setConsultationsError(err.message || 'Failed to load consultations')
        }
        // Don't show toast here as it might be too frequent
      } finally {
        setLoadingConsultations(false)
      }
    }
    
    // Only fetch if not viewing from all consultations page
    if (!location.state?.loadSavedData) {
      fetchConsultations()
      // Refresh every 30 seconds
      const interval = setInterval(fetchConsultations, 30000)
      return () => clearInterval(interval)
    }
  }, [location.state?.loadSavedData])
  
  // Consultations state - loaded from API only
  const [consultations, setConsultations] = useState([])
  
  // Filter consultations based on URL parameter
  const filteredConsultations = useMemo(() => {
    let filtered = consultations
    
    if (filterParam === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Get today's date string in YYYY-MM-DD format for comparison
      const todayDateStr = today.toISOString().split('T')[0]
      
      filtered = consultations.filter((consultation) => {
        // Priority 1: Use appointmentDate (YYYY-MM-DD format) - this is updated after reschedule
        if (consultation.appointmentDate) {
          const aptDateStr = consultation.appointmentDate.split('T')[0]
          return aptDateStr === todayDateStr
        }
        
        // Priority 2: Extract date from appointmentTime
        if (consultation.appointmentTime) {
          try {
        const appointmentDate = new Date(consultation.appointmentTime)
            if (isNaN(appointmentDate.getTime())) return false
            
            // Normalize to start of day for comparison
            appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate >= today && appointmentDate < tomorrow
          } catch (error) {
            console.error('Error parsing appointmentTime:', error, consultation.appointmentTime)
            return false
          }
        }
        
        return false
      })
    } else if (filterParam === 'pending') {
      filtered = consultations.filter((consultation) => 
        consultation.status === 'waiting' || consultation.status === 'pending'
      )
    }
    
    // Sort by status: in-progress/called first, then completed
    return filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return 0
    })
  }, [consultations, filterParam])
  
  // Check if consultation is passed via navigation state
  const passedConsultation = location.state?.selectedConsultation
  
  const [selectedConsultation, setSelectedConsultation] = useState(() => {
    // First check if consultation is passed via navigation state (from all consultations page or called patient)
    if (location.state?.selectedConsultation) {
      // If loadSavedData flag is set, we're viewing from all consultations - don't check session
      if (location.state?.loadSavedData) {
        return location.state.selectedConsultation
      }
      // Otherwise, check if session is active (for called patients)
      try {
        const session = localStorage.getItem('doctorCurrentSession')
        if (!session) {
          // No active session, but if consultation is passed, still show it
          return location.state.selectedConsultation
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
      return location.state.selectedConsultation
    }
    
    // If no passed consultation, load from localStorage ONLY if session is active
    // This prevents showing consultations when there's no active session
    try {
      const saved = localStorage.getItem('doctorSelectedConsultation')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only load if it's an active consultation (not completed)
        if (parsed.status === 'in-progress' || parsed.status === 'called') {
          // Check session is active - if not, don't load consultation
          const session = localStorage.getItem('doctorCurrentSession')
          if (session) {
            try {
              const sessionData = JSON.parse(session)
              // Only load if session is active
              if (sessionData.status === 'active' || sessionData.status === 'live') {
                
                return parsed
              } else {
                // Session not active, clear consultation
                
                localStorage.removeItem('doctorSelectedConsultation')
                return null
              }
            } catch (sessionError) {
              // Invalid session data, clear consultation
              
              localStorage.removeItem('doctorSelectedConsultation')
              return null
            }
          } else {
            // No session, clear consultation
            
            localStorage.removeItem('doctorSelectedConsultation')
            return null
          }
        } else {
          // Consultation is completed, clear it
          localStorage.removeItem('doctorSelectedConsultation')
          return null
        }
      }
    } catch (error) {
      console.error('Error loading selected consultation from localStorage:', error)
      // Clear invalid data
      localStorage.removeItem('doctorSelectedConsultation')
    }
    
    // If no passed consultation and no saved consultation, check for active session
    try {
      const session = localStorage.getItem('doctorCurrentSession')
      if (!session) {
        // No active session, clear consultation data
        localStorage.removeItem('doctorSelectedConsultation')
        localStorage.removeItem('doctorConsultations')
        return null
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
    
    // Don't auto-select from filteredConsultations - only show if explicitly called
    return null
  })
  
  // Save consultations to localStorage whenever they change
  useEffect(() => {
    try {
      // Save all consultations (only called patients, no mock data)
      if (consultations.length > 0) {
        localStorage.setItem('doctorConsultations', JSON.stringify(consultations))
      } else {
        localStorage.removeItem('doctorConsultations')
      }
    } catch (error) {
      console.error('Error saving consultations to localStorage:', error)
    }
  }, [consultations])
  
  // Save selectedConsultation to localStorage for persistence
  useEffect(() => {
    try {
      if (selectedConsultation) {
        // Only save if it's an active consultation (not completed)
        if (selectedConsultation.status === 'in-progress' || selectedConsultation.status === 'called') {
          localStorage.setItem('doctorSelectedConsultation', JSON.stringify(selectedConsultation))
        } else {
          // Remove from localStorage if completed
          localStorage.removeItem('doctorSelectedConsultation')
        }
      } else {
        localStorage.removeItem('doctorSelectedConsultation')
      }
    } catch (error) {
      console.error('Error saving selected consultation to localStorage:', error)
    }
  }, [selectedConsultation])
  
  // IMPORTANT: Ensure selectedConsultation is in consultations list when loaded from localStorage
  // This prevents the "empty consultation" flash when navigating back
  useEffect(() => {
    if (selectedConsultation && !location.state?.loadSavedData) {
      // Check if selectedConsultation is already in consultations list
      const exists = consultations.find((c) => {
        // Check by ID first (most reliable)
        if ((c.id || c._id) === (selectedConsultation.id || selectedConsultation._id)) {
          return true
        }
        // Also check by patient ID and status to avoid duplicates
        const cPatientId = c.patientId?._id || c.patientId
        const selectedPatientId = selectedConsultation.patientId?._id || selectedConsultation.patientId
        return cPatientId?.toString() === selectedPatientId?.toString() && 
               c.status === selectedConsultation.status &&
               (c.status === 'in-progress' || c.status === 'called')
      })
      
      if (!exists) {
        // Add selectedConsultation to consultations list immediately
        // This ensures it shows up right away when navigating back
        
        setConsultations((prev) => {
          // Check again to avoid duplicates (by ID and by patient+status)
          const alreadyExists = prev.find((c) => {
            // Check by ID
            if ((c.id || c._id) === (selectedConsultation.id || selectedConsultation._id)) {
              return true
            }
            // Check by patient ID and status
            const cPatientId = c.patientId?._id || c.patientId
            const selectedPatientId = selectedConsultation.patientId?._id || selectedConsultation.patientId
            return cPatientId?.toString() === selectedPatientId?.toString() && 
                   c.status === selectedConsultation.status &&
                   (c.status === 'in-progress' || c.status === 'called')
          })
          if (alreadyExists) {
            return prev
          }
          // Add at the beginning to show active consultations first
          return [selectedConsultation, ...prev]
        })
      }
    }
  }, [selectedConsultation, consultations, location.state?.loadSavedData])

  // Add passed consultation to consultations list and set as selected
  // Track if vitals have been manually edited to prevent auto-reset
  const [vitalsEdited, setVitalsEdited] = useState(false)
  const isRestoringRef = useRef(false) // Prevent multiple simultaneous restorations
  const lastRestoredPatientIdRef = useRef(null) // Track last restored patient to prevent unnecessary restorations
  const isConsultationActiveRef = useRef(false) // Track if doctor is actively working on consultation
  const isManuallySelectedRef = useRef(false) // Track if consultation was manually selected by doctor (clicked on)
  
  useEffect(() => {
    if (passedConsultation) {
      // Create a mutable copy of passedConsultation
      let updatedConsultation = { ...passedConsultation }
      
      // Load saved prescription data if loadSavedData flag is set
      if (location.state?.loadSavedData && passedConsultation.id) {
        const loadSavedData = async () => {
        try {
          // Load prescription from API using consultation ID
          const consultationResponse = await getConsultationById(passedConsultation.id)
          if (consultationResponse.success && consultationResponse.data) {
            const consultation = consultationResponse.data
            
            // Transform consultation data to get updated patient info (age, email, address)
            const transformedConsultation = transformConsultationData(consultation)
            
            // Load prescription data from consultation
            // Only load if user hasn't manually edited vitals
            if (consultation.medications && consultation.medications.length > 0) {
              // Load prescription data into form
                setDiagnosis(consultation.diagnosis || '')
                setSymptoms(consultation.symptoms || '')
                setMedications(consultation.medications || [])
                setInvestigations(consultation.investigations || [])
                setAdvice(consultation.advice || '')
                setFollowUpDate(consultation.followUpDate || '')
                // Only set vitals if they haven't been manually edited
                // This prevents overwriting user input while they're typing
                if (!vitalsEdited) {
                  if (consultation.vitals && Object.keys(consultation.vitals).length > 0) {
                    setVitals(consultation.vitals)
                  } else {
                    setVitals({
                      bloodPressure: { systolic: '', diastolic: '' },
                      temperature: '',
                      pulse: '',
                      respiratoryRate: '',
                      oxygenSaturation: '',
                      weight: '',
                      height: '',
                      bmi: '',
                    })
                  }
                }
            }
            
            // Update consultation with fresh patient data and prescription data
            // IMPORTANT: Preserve appointmentId from passedConsultation or get from consultation
            updatedConsultation = {
              ...transformedConsultation,
              // Preserve appointmentId if it exists in passedConsultation
              appointmentId: passedConsultation.appointmentId || consultation.appointmentId?._id || consultation.appointmentId || updatedConsultation.appointmentId,
              appointmentIdObj: passedConsultation.appointmentIdObj || (consultation.appointmentId ? { _id: consultation.appointmentId._id || consultation.appointmentId } : undefined) || updatedConsultation.appointmentIdObj,
              // Preserve originalData if it exists
              originalData: passedConsultation.originalData || consultation.appointmentId || updatedConsultation.originalData,
                  diagnosis: consultation.diagnosis || updatedConsultation.diagnosis || '',
                  symptoms: consultation.symptoms || updatedConsultation.symptoms || '',
                  vitals: consultation.vitals || updatedConsultation.vitals || {},
                  medications: consultation.medications || updatedConsultation.medications || [],
                  investigations: consultation.investigations || updatedConsultation.investigations || [],
                  advice: consultation.advice || updatedConsultation.advice || '',
                  followUpDate: consultation.followUpDate || updatedConsultation.followUpDate || '',
            }
          }
        } catch (error) {
          console.error('Error loading saved prescription data:', error)
        }
        }
        loadSavedData()
      }
      
      setConsultations((prev) => {
        // Check if consultation already exists
        const exists = prev.find((c) => c.id === updatedConsultation.id || c.patientId === updatedConsultation.patientId)
        if (!exists) {
          // Add new consultation at the beginning
          return [updatedConsultation, ...prev]
        }
        // Update existing consultation with passed data (but preserve status if it was completed)
        return prev.map((c) => {
          if (c.id === updatedConsultation.id || c.patientId === updatedConsultation.patientId) {
            // If existing consultation is completed, don't overwrite with in-progress
            if (c.status === 'completed') {
              return c
            }
            return updatedConsultation
          }
          return c
        })
      })
      setSelectedConsultation(updatedConsultation)
      
      // Load shared prescriptions from consultation data (if patient shared them during booking)
      if (updatedConsultation.sharedPrescriptions && updatedConsultation.sharedPrescriptions.length > 0) {
        // Shared prescriptions are already in consultation data
        
      }
      
      // Load patient history from API
      if (passedConsultation.patientId) {
        const loadPatientHistory = async () => {
        try {
          // Extract patient ID - handle both string and object
          const patientId = typeof passedConsultation.patientId === 'object' 
            ? (passedConsultation.patientId._id || passedConsultation.patientId.id || passedConsultation.patientId)
            : passedConsultation.patientId
          const historyResponse = await getPatientHistory(patientId)
          if (historyResponse.success && historyResponse.data) {
            // Patient history will be used in history tab
            // If viewing from all consultations page, show history tab
            if (location.state?.loadSavedData) {
              setActiveTab('history')
            }
          }
        } catch (error) {
          console.error('Error loading patient history:', error)
        }
        }
        loadPatientHistory()
      }
      
      // Clear the navigation state after using it
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [passedConsultation, location.state?.loadSavedData, transformConsultationData]) // Run when passedConsultation changes
  
  // Consultations are managed via API - no localStorage session checks needed
  
  // Update selected consultation when filter changes (but only if consultation was passed)
  useEffect(() => {
    // Don't override if we just set it from passed consultation
    if (passedConsultation && selectedConsultation?.id === passedConsultation.id) {
      return
    }
    
    // IMPORTANT: Don't clear selectedConsultation when switching tabs or filters
    // Only clear when explicitly needed (e.g., next patient is called)
    // Keep consultation selected even if filter changes or consultations list is empty
    // This prevents consultation page from disappearing when doctor switches tabs
  }, [filteredConsultations, filterParam, passedConsultation])
  
  // Reset vitalsEdited flag and load vitals when consultation changes (only if not manually edited)
  useEffect(() => {
    if (selectedConsultation?.id) {
      // Only reset if this is a different consultation (check by ID)
      const currentConsultationId = selectedConsultation.id
      const lastConsultationId = lastRestoredPatientIdRef.current
      
      // CRITICAL: Don't reset vitals if doctor is actively working on consultation
      // Check BOTH flags to ensure we don't reset while user is typing
      if (isConsultationActiveRef.current || vitalsEdited) {
        
        return // Don't reset anything if doctor is working
      }
      
      // Only reset vitals if consultation actually changed (different patient or new consultation)
      // AND user is not actively editing vitals
      if (currentConsultationId !== lastConsultationId) {
        
      // Reset edit flag when switching consultations (new consultation selected)
      setVitalsEdited(false)
        lastRestoredPatientIdRef.current = currentConsultationId
        // Reset active consultation flag when switching to new consultation
        isConsultationActiveRef.current = false
      
      // Load vitals from selected consultation if available
      if (selectedConsultation.vitals && Object.keys(selectedConsultation.vitals).length > 0) {
        setVitals(selectedConsultation.vitals)
      } else {
        // Reset to empty if no vitals in consultation
        setVitals({
          bloodPressure: { systolic: '', diastolic: '' },
          temperature: '',
          pulse: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          weight: '',
          height: '',
          bmi: '',
        })
      }
      } else {
        // Same consultation ID - don't reset vitals even if object reference changed
        
    }
    }
  }, [selectedConsultation?.id]) // Only run when consultation ID changes, NOT when object reference changes
  
  // Setup socket listener for patient call events and restore consultation state from appointment status
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    
    const restoreConsultationFromAppointmentStatus = async () => {
      // Prevent multiple simultaneous restorations
      if (isRestoringRef.current) {
        
        return
      }
      
      // IMPORTANT: Don't restore if doctor is actively working on consultation
      if (isConsultationActiveRef.current || vitalsEdited) {
        
        return
      }
      
      try {
        isRestoringRef.current = true
        
        // Check if there's an active session
        const sessionStr = localStorage.getItem('doctorCurrentSession')
        if (!sessionStr) {
          isRestoringRef.current = false
          return
        }
        
        const session = JSON.parse(sessionStr)
        
        // Get today's appointments to check for called patients
        const today = new Date().toISOString().split('T')[0]
        const queueResponse = await getPatientQueue(today)
        
        if (queueResponse.success && queueResponse.data?.appointments) {
          const appointments = queueResponse.data.appointments
          
          // Find appointment with status 'called', 'in-consultation', or 'in_progress'
          const calledAppointment = appointments.find(apt => 
            apt.status === 'called' || 
            apt.status === 'in-consultation' || 
            apt.status === 'in_progress'
          )
          
          // IMPORTANT: Always verify consultation state, even if already loaded from localStorage
          // If there's a called appointment but no selected consultation, restore it
          // If there's a selected consultation but appointment is no longer called, clear it
          if (calledAppointment) {
            // Check if current selected consultation matches the called appointment
            const currentPatientId = selectedConsultation?.patientId?._id || selectedConsultation?.patientId
            const calledPatientId = calledAppointment.patientId?._id || calledAppointment.patientId
            
            // If no selected consultation OR selected consultation doesn't match called appointment, restore
            // BUT: Don't restore if user is actively editing vitals (preserve their work)
            if ((!selectedConsultation || currentPatientId?.toString() !== calledPatientId?.toString()) && !vitalsEdited) {
            // Fetch complete patient data including email and address
            let fullPatientData = null
            try {
              const patientId = calledAppointment.patientId?._id || calledAppointment.patientId
              if (patientId) {
                const patientResponse = await getPatientById(patientId)
                if (patientResponse.success && patientResponse.data) {
                  fullPatientData = patientResponse.data
                  
                }
              }
            } catch (error) {
              console.error('Error fetching patient data:', error)
            }
            
            // Format patient address
            let formattedAddress = 'Not provided'
            if (fullPatientData?.address) {
              const address = fullPatientData.address
              if (typeof address === 'object') {
                const addressParts = []
                if (address.line1) addressParts.push(address.line1)
                if (address.line2) addressParts.push(address.line2)
                if (address.city) addressParts.push(address.city)
                if (address.state) addressParts.push(address.state)
                if (address.pincode || address.postalCode) addressParts.push(address.pincode || address.postalCode)
                formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided'
              } else if (typeof address === 'string' && address.trim() !== '') {
                formattedAddress = address
              }
            }
            
            // Calculate age from date of birth if available
            let patientAge = calledAppointment.age || calledAppointment.patientId?.age || 0
            if (fullPatientData?.dateOfBirth) {
              try {
                const dob = new Date(fullPatientData.dateOfBirth)
                const today = new Date()
                let age = today.getFullYear() - dob.getFullYear()
                const monthDiff = today.getMonth() - dob.getMonth()
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                  age--
                }
                if (age > 0) patientAge = age
              } catch (e) {
                console.error('Error calculating age:', e)
              }
            }
            
            // Create consultation data from appointment with real patient data
            // Preserve existing vitals if user was editing - use current vitals state
            const existingVitals = vitalsEdited 
              ? vitalsRef.current // Use current vitals state from ref to preserve what user is typing
              : (selectedConsultation?.vitals || {})
            
            const consultationData = {
              id: `cons-${calledAppointment._id || calledAppointment.id}-${Date.now()}`,
              patientId: calledAppointment.patientId?._id || calledAppointment.patientId,
              // IMPORTANT: Store appointmentId so it can be used later for saving vitals
              appointmentId: calledAppointment._id || calledAppointment.id,
              appointmentIdObj: { _id: calledAppointment._id || calledAppointment.id },
              patientName: fullPatientData?.firstName && fullPatientData?.lastName
                ? `${fullPatientData.firstName} ${fullPatientData.lastName}`
                : (calledAppointment.patientId?.firstName && calledAppointment.patientId?.lastName
                  ? `${calledAppointment.patientId.firstName} ${calledAppointment.patientId.lastName}`
                  : calledAppointment.patientName || 'Patient'),
              age: patientAge,
              gender: fullPatientData?.gender || calledAppointment.patientId?.gender || calledAppointment.gender || 'M',
              appointmentTime: calledAppointment.appointmentDate || new Date().toISOString(),
              appointmentType: calledAppointment.appointmentType || 'Follow-up',
              status: 'in-progress',
              reason: calledAppointment.reason || 'Consultation',
              patientImage: fullPatientData?.profileImage || calledAppointment.patientId?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(calledAppointment.patientName || 'Patient')}&background=11496c&color=fff&size=160`,
              patientPhone: fullPatientData?.phone || calledAppointment.patientId?.phone || '',
              patientEmail: fullPatientData?.email || calledAppointment.patientId?.email || '',
              patientAddress: formattedAddress,
              diagnosis: selectedConsultation?.diagnosis || '',
              symptoms: selectedConsultation?.symptoms || '',
              vitals: existingVitals, // Preserve existing vitals if editing
              medications: selectedConsultation?.medications || [],
              investigations: selectedConsultation?.investigations || [],
              advice: selectedConsultation?.advice || '',
              followUpDate: selectedConsultation?.followUpDate || '',
              attachments: selectedConsultation?.attachments || [],
              sessionId: session._id || session.id,
              sessionDate: session.date,
              calledAt: new Date().toISOString(),
              // Store original appointment data for reference
              originalData: calledAppointment,
            }
            
            // If user is editing vitals for same patient, preserve current vitals state
            const currentPatientId = selectedConsultation?.patientId?._id || selectedConsultation?.patientId
            const newPatientId = consultationData.patientId?._id || consultationData.patientId
            const isSamePatient = currentPatientId?.toString() === newPatientId?.toString()
            
            if (vitalsEdited && isSamePatient) {
              // User is editing - preserve current vitals state
              consultationData.vitals = vitalsRef.current
              
            }
            
            setConsultations((prev) => {
              const exists = prev.find((c) => c.patientId === consultationData.patientId)
              if (!exists) {
                return [consultationData, ...prev]
              }
              return prev.map((c) => 
                c.patientId === consultationData.patientId 
                  ? (c.status === 'completed' ? c : consultationData)
                  : c
              )
            })
              
              // IMPORTANT: Only update selectedConsultation if user is NOT actively editing
              // If editing, preserve current consultation state to prevent vitals reset
              if (!isConsultationActiveRef.current && !vitalsEdited) {
              setSelectedConsultation(consultationData)
                // Update last restored patient ID
                lastRestoredPatientIdRef.current = consultationData.id
              
              } else {
                
              }
            } else if (vitalsEdited) {
              // User is editing vitals - don't restore, preserve their work
              
            } else {
              // Selected consultation matches called appointment - verify it's still valid
              
            }
          } else if (selectedConsultation) {
            // No called appointment but we have a selected consultation
            // IMPORTANT: Don't clear consultation if doctor is actively working on it OR manually selected it
            if (isConsultationActiveRef.current || vitalsEdited || isManuallySelectedRef.current) {
              
              return // Don't check or clear consultation while doctor is working or manually selected it
            }
            
            // Check if the selected consultation's appointment is still active
            const currentPatientId = selectedConsultation?.patientId?._id || selectedConsultation?.patientId
            const appointment = appointments.find(apt => {
              const aptPatientId = apt.patientId?._id || apt.patientId
              return aptPatientId?.toString() === currentPatientId?.toString()
            })
            
            // If appointment is completed or cancelled, clear the consultation
            // BUT only if doctor is not actively working on it AND not manually selected
            if (appointment && (appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'cancelled_by_session')) {
              
              setSelectedConsultation(null)
              localStorage.removeItem('doctorSelectedConsultation')
              lastRestoredPatientIdRef.current = null
              isManuallySelectedRef.current = false
            } else if (!appointment) {
              // Appointment not found in queue - might be from different session or doctor clicked on consultation
              // IMPORTANT: Keep consultation if doctor manually selected it (clicked on it)
              // Only clear when next patient is explicitly called
              // Don't clear just because appointment is not in current queue
              
            }
          }
        }
      } catch (error) {
        console.error('Error restoring consultation from appointment status:', error)
      } finally {
        isRestoringRef.current = false
      }
    }
    
    // Restore on mount - but don't block if consultation is already loaded from localStorage
    // This ensures consultation shows immediately while verification happens in background
    // Only restore if doctor is not actively working on consultation
    if (!selectedConsultation) {
      // Only restore if no consultation is already loaded (from localStorage or navigation state)
      if (!isConsultationActiveRef.current && !vitalsEdited) {
      restoreConsultationFromAppointmentStatus()
      }
    } else {
      // Consultation is already loaded, but verify it's still valid in background
      // Only verify if doctor is not actively working to prevent flickering
      if (!isConsultationActiveRef.current && !vitalsEdited) {
        // Delay verification to avoid blocking initial render
        setTimeout(() => {
      restoreConsultationFromAppointmentStatus()
        }, 1000) // Wait 1 second after mount
      }
    }
    
    // Listen for queue:next:called event (when patient is called via callNextPatient)
    const handleQueueNextCalled = async (data) => {
      if (data?.appointment) {
        // IMPORTANT: If consultation was manually selected, only clear it if a DIFFERENT patient is being called
        const newPatientId = data.appointment.patientId?._id || data.appointment.patientId
        const currentPatientId = selectedConsultation?.patientId?._id || selectedConsultation?.patientId
        
        // If same patient is being called again, don't clear manually selected consultation
        if (isManuallySelectedRef.current && newPatientId?.toString() === currentPatientId?.toString()) {
          
          return
        }
        
        // If different patient is being called, clear the manually selected flag and proceed
        if (isManuallySelectedRef.current && newPatientId?.toString() !== currentPatientId?.toString()) {
          
          isManuallySelectedRef.current = false
        }
        
        // Prevent restoration if doctor is actively working on consultation
        if (isConsultationActiveRef.current || vitalsEdited) {
          
          return
        }
        
        
        
        // Prevent multiple simultaneous restorations
        if (isRestoringRef.current) {
          
          return
        }
        
        isRestoringRef.current = true
        
        try {
        // Create consultation data from appointment
        const appointment = data.appointment
        const session = data.session
        
          const sessionStr = localStorage.getItem('doctorCurrentSession')
          const currentSession = sessionStr ? JSON.parse(sessionStr) : session
          
          // Fetch complete patient data including email and address
          let fullPatientData = null
          try {
            const patientId = appointment.patientId?._id || appointment.patientId
            if (patientId) {
              const patientResponse = await getPatientById(patientId)
              if (patientResponse.success && patientResponse.data) {
                fullPatientData = patientResponse.data
                
              }
            }
          } catch (error) {
            console.error('Error fetching patient data:', error)
          }
          
          // Format patient address
          let formattedAddress = 'Not provided'
          if (fullPatientData?.address) {
            const address = fullPatientData.address
            if (typeof address === 'object') {
              const addressParts = []
              if (address.line1) addressParts.push(address.line1)
              if (address.line2) addressParts.push(address.line2)
              if (address.city) addressParts.push(address.city)
              if (address.state) addressParts.push(address.state)
              if (address.pincode || address.postalCode) addressParts.push(address.pincode || address.postalCode)
              formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided'
            } else if (typeof address === 'string' && address.trim() !== '') {
              formattedAddress = address
            }
          }
          
          // Calculate age from date of birth if available
          let patientAge = appointment.age || appointment.patientId?.age || 0
          if (fullPatientData?.dateOfBirth) {
            try {
              const dob = new Date(fullPatientData.dateOfBirth)
              const today = new Date()
              let age = today.getFullYear() - dob.getFullYear()
              const monthDiff = today.getMonth() - dob.getMonth()
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--
              }
              if (age > 0) patientAge = age
            } catch (e) {
              console.error('Error calculating age:', e)
            }
          }
          
          // Preserve existing consultation data if same patient
          const currentPatientId = selectedConsultation?.patientId?._id || selectedConsultation?.patientId
          const newPatientId = appointment.patientId?._id || appointment.patientId
          const isSamePatient = currentPatientId?.toString() === newPatientId?.toString()
          
          // Preserve existing form data if same patient and user was editing
          // Use current vitals state instead of selectedConsultation.vitals to preserve what user is typing
          const existingVitals = (isSamePatient && vitalsEdited) 
            ? vitalsRef.current // Use current vitals state from ref
            : (selectedConsultation?.vitals || {})
          
          const consultationData = {
            id: `cons-${appointment._id || appointment.id}-${Date.now()}`,
            patientId: appointment.patientId?._id || appointment.patientId,
            // IMPORTANT: Store appointmentId so it can be used later for saving vitals
            appointmentId: appointment._id || appointment.id,
            appointmentIdObj: { _id: appointment._id || appointment.id },
            patientName: fullPatientData?.firstName && fullPatientData?.lastName
              ? `${fullPatientData.firstName} ${fullPatientData.lastName}`
              : (appointment.patientId?.firstName && appointment.patientId?.lastName
                ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
                : appointment.patientName || 'Patient'),
            age: patientAge,
            gender: fullPatientData?.gender || appointment.patientId?.gender || appointment.gender || 'M',
            appointmentTime: appointment.appointmentDate || new Date().toISOString(),
            appointmentType: appointment.appointmentType || 'Follow-up',
            status: 'in-progress',
            reason: appointment.reason || 'Consultation',
            patientImage: fullPatientData?.profileImage || appointment.patientId?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName || 'Patient')}&background=11496c&color=fff&size=160`,
            patientPhone: fullPatientData?.phone || appointment.patientId?.phone || '',
            patientEmail: fullPatientData?.email || appointment.patientId?.email || '',
            patientAddress: formattedAddress,
            diagnosis: (isSamePatient ? selectedConsultation?.diagnosis : '') || '',
            symptoms: (isSamePatient ? selectedConsultation?.symptoms : '') || '',
            vitals: existingVitals, // Preserve if same patient and editing
            medications: (isSamePatient ? selectedConsultation?.medications : []) || [],
            investigations: (isSamePatient ? selectedConsultation?.investigations : []) || [],
            advice: (isSamePatient ? selectedConsultation?.advice : '') || '',
            followUpDate: (isSamePatient ? selectedConsultation?.followUpDate : '') || '',
            attachments: (isSamePatient ? selectedConsultation?.attachments : []) || [],
            sessionId: currentSession._id || currentSession.id,
            sessionDate: currentSession.date || currentSession.sessionDate,
            calledAt: new Date().toISOString(),
            // Store original appointment data for reference
            originalData: appointment,
          }
          
          setConsultations((prev) => {
            const exists = prev.find((c) => 
              (c.patientId === consultationData.patientId || c.id === consultationData.id) &&
              c.status !== 'completed'
            )
            if (!exists) {
              return [consultationData, ...prev]
            }
            return prev.map((c) => 
              (c.patientId === consultationData.patientId || c.id === consultationData.id) && c.status !== 'completed'
                ? consultationData
                : c
            )
          })
          
          // IMPORTANT: Only update selectedConsultation if user is NOT actively editing
          // If editing, preserve current consultation state to prevent vitals reset
          if (!isConsultationActiveRef.current && !vitalsEdited) {
            // Only update selectedConsultation if user is not actively editing vitals
            // If editing, preserve current vitals state in the consultation data
            if (vitalsEdited && isSamePatient) {
              // User is editing - preserve current vitals state
              consultationData.vitals = vitalsRef.current
              
            }
            
            // Reset manually selected flag when new patient is called
            isManuallySelectedRef.current = false
            
          setSelectedConsultation(consultationData)
            // Update last restored patient ID
            lastRestoredPatientIdRef.current = consultationData.id
          
          // Save to localStorage
          localStorage.setItem('doctorSelectedConsultation', JSON.stringify(consultationData))
          
          } else {
            
          }
        } catch (error) {
          console.error('Error handling queue:next:called:', error)
          // Fallback: restore from appointment status
          await restoreConsultationFromAppointmentStatus()
        } finally {
          isRestoringRef.current = false
        }
      }
    }
    
    // Listen for queue:updated event
    const handleQueueUpdated = async (data) => {
      if (data?.appointmentId || data?.appointment) {
        
        
        // IMPORTANT: Only restore if this is for a NEW patient being called
        // Don't restore if doctor is already viewing a consultation (manually selected)
        // Only restore when next patient is explicitly called via queue:next:called
        // This prevents consultation from disappearing when doctor clicks on it
        
        // Check if the updated appointment is for a different patient
        const updatedAppointmentId = data.appointmentId || data.appointment?._id || data.appointment?.id
        const currentAppointmentId = selectedConsultation?.appointmentId?._id || selectedConsultation?.appointmentId || selectedConsultation?.originalData?._id || selectedConsultation?.originalData?.id
        
        // If it's the same appointment, don't restore (doctor is already viewing it)
        if (updatedAppointmentId && currentAppointmentId && updatedAppointmentId.toString() === currentAppointmentId.toString()) {
          
          return
        }
        
        // Only restore if not currently editing consultation to prevent flickering
        // Add a small delay to debounce rapid events
        if (!isConsultationActiveRef.current && !vitalsEdited && !isRestoringRef.current) {
          setTimeout(async () => {
        await restoreConsultationFromAppointmentStatus()
          }, 500) // Debounce by 500ms
        } else {
          
        }
      }
    }
    
    socket.on('queue:updated', handleQueueUpdated)
    socket.on('queue:next:called', handleQueueNextCalled)
    
    return () => {
      socket.off('queue:updated', handleQueueUpdated)
      socket.off('queue:next:called', handleQueueNextCalled)
    }
  }, [selectedConsultation, vitalsEdited]) // Use vitalsRef.current instead of vitals in dependency
  
  const [activeTab, setActiveTab] = useState('vitals') // vitals, prescription, history, saved
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [showAddInvestigation, setShowAddInvestigation] = useState(false)
  
  // Saved prescriptions - loaded from consultation data or patient history
  const [savedPrescriptions, setSavedPrescriptions] = useState([])
  
  // Load prescriptions when patient is selected
  useEffect(() => {
    const loadPrescriptions = async () => {
      if (!selectedConsultation?.patientId) {
        setSavedPrescriptions([])
        return
      }

      try {
        // Fetch prescriptions for the current doctor
        const response = await getPrescriptions({})
        
        if (response.success && response.data) {
          const prescriptionsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.prescriptions || []
          
          // Filter prescriptions for current patient and transform data
          const patientId = selectedConsultation.patientId?._id || selectedConsultation.patientId
          const filteredPrescriptions = prescriptionsData
            .filter(presc => {
              const prescPatientId = presc.patientId?._id || presc.patientId?.id || presc.patientId
              return prescPatientId?.toString() === patientId?.toString()
            })
            .map(presc => ({
              id: presc._id || presc.id,
              _id: presc._id || presc.id,
              consultationId: presc.consultationId?._id || presc.consultationId || presc.consultationId,
              patientId: presc.patientId?._id || presc.patientId?.id || presc.patientId,
              patientName: presc.patientId?.firstName && presc.patientId?.lastName
                ? `${presc.patientId.firstName} ${presc.patientId.lastName}`
                : selectedConsultation.patientName || 'Patient',
              patientImage: presc.patientId?.profileImage || selectedConsultation.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConsultation.patientName || 'Patient')}&background=11496c&color=fff&size=160`,
              patientPhone: presc.patientId?.phone || selectedConsultation.patientPhone || '',
              patientEmail: presc.patientId?.email || selectedConsultation.patientEmail || '',
              patientAddress: presc.patientId?.address || selectedConsultation.patientAddress || '',
              // Get diagnosis, symptoms, investigations from consultationId
              diagnosis: presc.consultationId?.diagnosis || presc.diagnosis || '',
              symptoms: presc.consultationId?.symptoms || presc.symptoms || '',
              medications: presc.medications || presc.medicines || [],
              investigations: presc.consultationId?.investigations || presc.investigations || [],
              advice: presc.consultationId?.advice || presc.notes || presc.advice || '',
              followUpDate: presc.consultationId?.followUpDate || presc.expiryDate || presc.followUpDate || '',
              date: presc.createdAt ? new Date(presc.createdAt).toISOString() : new Date().toISOString(),
              savedAt: presc.createdAt ? new Date(presc.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              status: presc.status || 'active',
              pdfFileUrl: presc.pdfFileUrl || null,
              originalData: presc,
            }))
          
          setSavedPrescriptions(filteredPrescriptions)
          
        } else {
          setSavedPrescriptions([])
        }
      } catch (error) {
        console.error('Error loading prescriptions:', error)
        setSavedPrescriptions([])
      }
    }

    loadPrescriptions()
  }, [selectedConsultation?.patientId])
  
  const [viewingPrescription, setViewingPrescription] = useState(null)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState(null)
  const [sharedLabReports, setSharedLabReports] = useState([])
  const [showReportViewer, setShowReportViewer] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  // Function to load shared lab reports from API
  const loadSharedLabReports = async (patientId, doctorId) => {
    try {
      // Extract patient ID - handle both string and object
      const patientIdString = typeof patientId === 'object' 
        ? (patientId._id || patientId.id || patientId)
        : patientId
      // Fetch patient history which includes shared lab reports
      const { getPatientHistory } = await import('../doctor-services/doctorService')
      const response = await getPatientHistory(patientIdString)
      
      if (response.success && response.data) {
        // Get shared lab reports from patient history
        const sharedReports = response.data.sharedLabReports || []
      
        // Transform reports to match component structure
        const transformedReports = sharedReports.map(report => ({
          id: report._id || report.id,
          _id: report._id || report.id,
          testName: report.testName || report.test?.name || 'Lab Test',
          labName: report.laboratoryId?.labName || report.labName || 'Laboratory',
          date: report.createdAt || report.date || new Date().toISOString().split('T')[0],
          status: report.status || 'ready',
          pdfFileUrl: report.pdfFileUrl || null,
          downloadUrl: report.pdfFileUrl || '#',
          pdfFileName: report.pdfFileName || `${report.testName || 'Report'}_${new Date(report.createdAt || Date.now()).toISOString().split('T')[0]}.pdf`,
          originalData: report,
        }))
        
        setSharedLabReports(transformedReports)
      } else {
        setSharedLabReports([])
        // If patient not found and consultation was from localStorage, clear it
        if (response.message?.includes('Patient not found') || response.message?.includes('no appointments')) {
          const saved = localStorage.getItem('doctorSelectedConsultation')
          if (saved) {
            
            localStorage.removeItem('doctorSelectedConsultation')
            setSelectedConsultation(null)
            setConsultations((prev) => prev.filter(c => {
              const cPatientId = typeof c.patientId === 'object' 
                ? (c.patientId._id || c.patientId.id || c.patientId)
                : c.patientId
              return cPatientId?.toString() !== patientIdString?.toString()
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error loading shared lab reports:', error)
      setSharedLabReports([])
      // If error is "Patient not found" and consultation was from localStorage, clear it
      if (error.message?.includes('Patient not found') || error.message?.includes('no appointments')) {
        const saved = localStorage.getItem('doctorSelectedConsultation')
        if (saved) {
          
          localStorage.removeItem('doctorSelectedConsultation')
          setSelectedConsultation(null)
          const patientIdString = typeof patientId === 'object' 
            ? (patientId._id || patientId.id || patientId)
            : patientId
          setConsultations((prev) => prev.filter(c => {
            const cPatientId = typeof c.patientId === 'object' 
              ? (c.patientId._id || c.patientId.id || c.patientId)
              : c.patientId
            return cPatientId?.toString() !== patientIdString?.toString()
          }))
        }
      }
    }
  }

  // Download lab report PDF (same as patient implementation)
  const handleDownloadLabReport = async (report) => {
    const pdfUrl = report.pdfFileUrl || report.downloadUrl
    if (!pdfUrl || pdfUrl === '#') {
      toast.info('PDF report is not available yet. The lab will share the report PDF once it is ready.')
      return
    }

    try {
      // Check if we have stored PDF in localStorage (from previous download)
      const storedPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
      const storedPdf = storedPdfs[report.id]
      
      if (storedPdf && storedPdf.base64Data) {
        // Use stored PDF if available
        const link = document.createElement('a')
        link.href = storedPdf.base64Data
        link.download = storedPdf.pdfFileName || report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // Check if URL is from same origin or is a data URL
      const isSameOrigin = pdfUrl.startsWith(window.location.origin) || pdfUrl.startsWith('/')
      const isDataUrl = pdfUrl.startsWith('data:')
      
      if (isDataUrl) {
        // Direct download for data URLs
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // Only try fetch for same-origin URLs to avoid CORS errors
      if (isSameOrigin) {
        try {
          const response = await fetch(pdfUrl, {
            method: 'GET',
          })
          
          if (response.ok) {
            const blob = await response.blob()
            
            // Create a blob URL for download
            const blobUrl = URL.createObjectURL(blob)
            
            // Create download link
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up blob URL
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl)
            }, 100)
            
            // Store PDF in localStorage for offline access
            try {
              const reader = new FileReader()
              reader.onloadend = () => {
                const base64Data = reader.result
                const updatedStoredPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
                updatedStoredPdfs[report.id] = {
                  pdfFileUrl: pdfUrl,
                  pdfFileName: report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`,
                  base64Data: base64Data,
                  downloadedAt: new Date().toISOString(),
                }
                localStorage.setItem('doctorLabReportPdfs', JSON.stringify(updatedStoredPdfs))
              }
              reader.readAsDataURL(blob)
            } catch (storageError) {
              console.error('Error storing PDF:', storageError)
            }
            return
          }
        } catch (fetchError) {
          // Silently handle fetch errors for same-origin (shouldn't happen but handle gracefully)
          console.warn('Fetch failed for same-origin URL')
        }
      }
      
      // For external URLs (cross-origin), don't try fetch (will cause CORS error)
      // Just open in new tab - browser will handle download if server allows
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // Last resort: open in new tab
      window.open(pdfUrl, '_blank')
    }
  }

  // View lab report PDF (open in new tab like patient)
  const handleViewLabReport = (report) => {
    // Check for PDF URL (check multiple possible fields)
    const pdfUrl = report.pdfFileUrl || report.downloadUrl || report.reportFileUrl
    
    // If PDF URL is available and not a placeholder
    if (pdfUrl && pdfUrl !== '#' && pdfUrl.trim() !== '' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
      // Open the lab-uploaded PDF in a new tab (same as patient implementation)
      window.open(pdfUrl, '_blank')
    } else {
      // Fallback: show modal if PDF not available
      
      
      
      setSelectedReport(report)
      setShowReportViewer(true)
    }
  }

  // Load shared reports when consultation is selected
  useEffect(() => {
    if (selectedConsultation?.patientId) {
      loadSharedLabReports(selectedConsultation.patientId, selectedConsultation.doctorId)
    } else {
      setSharedLabReports([])
    }
  }, [selectedConsultation?.patientId, selectedConsultation?.doctorId])

  // Verify consultation exists in database when loaded from localStorage
  // If patient history API fails, clear localStorage and hide consultation
  useEffect(() => {
    const verifyConsultation = async () => {
      // Only verify if consultation was loaded from localStorage (not from navigation state)
      if (!selectedConsultation || location.state?.selectedConsultation) {
        return // Don't verify if it came from navigation state
      }

      // Check if this consultation was loaded from localStorage
      const saved = localStorage.getItem('doctorSelectedConsultation')
      if (!saved) {
        return // Not from localStorage
      }

      const patientId = typeof selectedConsultation.patientId === 'object' 
        ? (selectedConsultation.patientId._id || selectedConsultation.patientId.id || selectedConsultation.patientId)
        : selectedConsultation.patientId

      if (!patientId) {
        return
      }

      // Verify by trying to fetch patient history
      // If it fails with 404, the consultation doesn't exist in database
      try {
        const historyResponse = await getPatientHistory(patientId)
        if (!historyResponse.success) {
          // Consultation doesn't exist, clear localStorage and hide consultation
          
          localStorage.removeItem('doctorSelectedConsultation')
          setSelectedConsultation(null)
          setConsultations((prev) => prev.filter(c => {
            const cPatientId = typeof c.patientId === 'object' 
              ? (c.patientId._id || c.patientId.id || c.patientId)
              : c.patientId
            return cPatientId?.toString() !== patientId?.toString()
          }))
        }
      } catch (error) {
        // If error is 404 or "Patient not found", clear localStorage
        if (error.message?.includes('Patient not found') || error.message?.includes('404')) {
          
          localStorage.removeItem('doctorSelectedConsultation')
          setSelectedConsultation(null)
          setConsultations((prev) => prev.filter(c => {
            const cPatientId = typeof c.patientId === 'object' 
              ? (c.patientId._id || c.patientId.id || c.patientId)
              : c.patientId
            return cPatientId?.toString() !== patientId?.toString()
          }))
        }
      }
    }

    // Add a small delay to avoid race conditions with other API calls
    const timeoutId = setTimeout(() => {
      verifyConsultation()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [selectedConsultation, location.state?.selectedConsultation])

  // Get doctor info once and store in state to avoid multiple calls
  const [doctorInfo, setDoctorInfo] = useState(() => getDoctorInfo())

  // Update doctor info when component mounts or when needed
  useEffect(() => {
    setDoctorInfo(getDoctorInfo())
  }, [])

  // Prescriptions are saved via API when consultation is updated - no localStorage needed

  // Form states
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bmi: '',
  })
  
  // Keep ref to current vitals state for use in socket handlers (declared after vitals state)
  const vitalsRef = useRef(vitals)
  
  // Keep vitalsRef updated with current vitals state for use in socket handlers
  useEffect(() => {
    vitalsRef.current = vitals
  }, [vitals])

  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [medications, setMedications] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [advice, setAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  
  // Track if consultation form is being actively edited (any field)
  // IMPORTANT: This runs on every field change to mark consultation as active
  useEffect(() => {
    // If any form field has content, mark consultation as active IMMEDIATELY
    const hasContent = diagnosis || symptoms || (medications && medications.length > 0) || 
                       (investigations && investigations.length > 0) || advice || followUpDate ||
                       vitals.temperature || vitals.pulse || vitals.respiratoryRate || 
                       vitals.oxygenSaturation || vitals.weight || vitals.height ||
                       vitals.bloodPressure?.systolic || vitals.bloodPressure?.diastolic
    
    // Set active flag IMMEDIATELY when any content is detected
    // This prevents other useEffects from resetting values
    isConsultationActiveRef.current = hasContent || vitalsEdited
    
    // Also save consultation state to localStorage when form is being edited
    if (selectedConsultation && isConsultationActiveRef.current) {
      const updatedConsultation = {
        ...selectedConsultation,
        diagnosis,
        symptoms,
        medications,
        investigations,
        advice,
        followUpDate,
        vitals: vitalsRef.current || vitals
      }
      try {
        localStorage.setItem('doctorSelectedConsultation', JSON.stringify(updatedConsultation))
      } catch (error) {
        console.error('Error saving consultation state:', error)
      }
    }
  }, [diagnosis, symptoms, medications, investigations, advice, followUpDate, vitals, vitalsEdited, selectedConsultation])
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  })
  
  // Medicine dropdown state
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('')
  const [availableMedicines, setAvailableMedicines] = useState([])
  
  // Load medicines from all pharmacies
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const response = await getAllMedicines({ limit: 1000 })
        if (response.success && response.data) {
          const medicines = response.data.items || []
          setAvailableMedicines(medicines)
        }
      } catch (error) {
        console.error('Error loading medicines:', error)
        setAvailableMedicines([])
      }
    }
    loadMedicines()
  }, [])
  
  // Filter medicines based on search term
  const filteredMedicines = useMemo(() => {
    if (!medicineSearchTerm.trim()) {
      return availableMedicines
    }
    const search = medicineSearchTerm.toLowerCase()
    return availableMedicines.filter(med => 
      med.name.toLowerCase().includes(search) ||
      med.dosage.toLowerCase().includes(search) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(search))
    )
  }, [availableMedicines, medicineSearchTerm])
  
  // Handle medicine selection
  const handleMedicineSelect = (medicine) => {
    setNewMedication({
      ...newMedication,
      name: medicine.name,
      dosage: medicine.dosage || '', // Auto-fill dosage if available
    })
    setShowMedicineDropdown(false)
    setMedicineSearchTerm('')
  }
  
  // Handle manual medicine name input
  const handleMedicineNameChange = (value) => {
    setNewMedication({ ...newMedication, name: value })
    setMedicineSearchTerm(value)
    // Show dropdown if there's a search term or if medicines are available
    if (value.trim() || availableMedicines.length > 0) {
      setShowMedicineDropdown(true)
    } else {
      setShowMedicineDropdown(false)
    }
  }
  const [newInvestigation, setNewInvestigation] = useState({
    name: '',
    notes: '',
  })
  
  // Test dropdown state
  const [showTestDropdown, setShowTestDropdown] = useState(false)
  const [testSearchTerm, setTestSearchTerm] = useState('')
  const [availableTests, setAvailableTests] = useState([])
  
  // Load tests from all laboratories
  useEffect(() => {
    const loadTests = async () => {
      try {
        const response = await getAllTests({ limit: 1000 })
        if (response.success && response.data) {
          const tests = response.data.items || []
          setAvailableTests(tests)
        }
      } catch (error) {
        console.error('Error loading tests:', error)
        setAvailableTests([])
      }
    }
    loadTests()
  }, [])
  
  // Filter tests based on search term
  const filteredTests = useMemo(() => {
    if (!testSearchTerm.trim()) {
      return availableTests
    }
    const search = testSearchTerm.toLowerCase()
    return availableTests.filter(test => 
      test.name.toLowerCase().includes(search) ||
      (test.category && test.category.toLowerCase().includes(search))
    )
  }, [availableTests, testSearchTerm])
  
  // Handle test selection
  const handleTestSelect = (test) => {
    setNewInvestigation({
      ...newInvestigation,
      name: test.name,
    })
    setShowTestDropdown(false)
    setTestSearchTerm('')
  }
  
  // Handle manual test name input
  const handleTestNameChange = (value) => {
    setNewInvestigation({ ...newInvestigation, name: value })
    setTestSearchTerm(value)
    // Show dropdown if there's a search term or if tests are available
    if (value.trim() || availableTests.length > 0) {
      setShowTestDropdown(true)
    } else {
      setShowTestDropdown(false)
    }
  }
  
  const [attachments, setAttachments] = useState([])

  // Patient history - loaded from API
  const [patientHistory, setPatientHistory] = useState(null)
  
  // Load patient history when consultation is selected
  useEffect(() => {
    const loadPatientHistory = async () => {
      if (selectedConsultation?.patientId) {
        try {
          // Extract patient ID - handle both string and object
          const patientId = typeof selectedConsultation.patientId === 'object' 
            ? (selectedConsultation.patientId._id || selectedConsultation.patientId.id || selectedConsultation.patientId)
            : selectedConsultation.patientId
          const historyResponse = await getPatientHistory(patientId)
          if (historyResponse.success && historyResponse.data) {
            setPatientHistory(historyResponse.data)
          } else {
            setPatientHistory(null)
            // If patient not found and consultation was from localStorage, clear it
            if (historyResponse.message?.includes('Patient not found') || historyResponse.message?.includes('no appointments')) {
              const saved = localStorage.getItem('doctorSelectedConsultation')
              if (saved) {
                
                localStorage.removeItem('doctorSelectedConsultation')
                setSelectedConsultation(null)
                setConsultations((prev) => prev.filter(c => {
                  const cPatientId = typeof c.patientId === 'object' 
                    ? (c.patientId._id || c.patientId.id || c.patientId)
                    : c.patientId
                  return cPatientId?.toString() !== patientId?.toString()
                }))
              }
            }
          }
        } catch (error) {
          console.error('Error loading patient history:', error)
          setPatientHistory(null)
          // If error is "Patient not found" and consultation was from localStorage, clear it
          if (error.message?.includes('Patient not found') || error.message?.includes('no appointments')) {
            const saved = localStorage.getItem('doctorSelectedConsultation')
            if (saved) {
              
              localStorage.removeItem('doctorSelectedConsultation')
              setSelectedConsultation(null)
              const patientId = typeof selectedConsultation.patientId === 'object' 
                ? (selectedConsultation.patientId._id || selectedConsultation.patientId.id || selectedConsultation.patientId)
                : selectedConsultation.patientId
              setConsultations((prev) => prev.filter(c => {
                const cPatientId = typeof c.patientId === 'object' 
                  ? (c.patientId._id || c.patientId.id || c.patientId)
                  : c.patientId
                return cPatientId?.toString() !== patientId?.toString()
              }))
            }
          }
        }
      } else {
        setPatientHistory(null)
      }
    }
    
    loadPatientHistory()
  }, [selectedConsultation?.patientId])

  const handleCalculateBMI = () => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = parseFloat(vitals.height) / 100
      const weightInKg = parseFloat(vitals.weight)
      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
      setVitals({ ...vitals, bmi })
    }
  }

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      setMedications([...medications, { ...newMedication, id: Date.now() }])
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
      setShowAddMedication(false)
      setShowMedicineDropdown(false)
      setMedicineSearchTerm('')
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMedicineDropdown && !event.target.closest('.medicine-dropdown-container')) {
        setShowMedicineDropdown(false)
      }
    }
    
    if (showMedicineDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMedicineDropdown])
  
  // Reset medicine dropdown when modal closes
  useEffect(() => {
    if (!showAddMedication) {
      setShowMedicineDropdown(false)
      setMedicineSearchTerm('')
    }
  }, [showAddMedication])

  const handleRemoveMedication = (id) => {
    setMedications(medications.filter((med) => med.id !== id))
  }

  const handleAddInvestigation = () => {
    if (newInvestigation.name) {
      setInvestigations([...investigations, { ...newInvestigation, id: Date.now() }])
      setNewInvestigation({ name: '', notes: '' })
      setShowAddInvestigation(false)
      setShowTestDropdown(false)
      setTestSearchTerm('')
    }
  }
  
  // Close test dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTestDropdown && !event.target.closest('.test-dropdown-container')) {
        setShowTestDropdown(false)
      }
    }
    
    if (showTestDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showTestDropdown])
  
  // Reset test dropdown when modal closes
  useEffect(() => {
    if (!showAddInvestigation) {
      setShowTestDropdown(false)
      setTestSearchTerm('')
    }
  }, [showAddInvestigation])

  const handleRemoveInvestigation = (id) => {
    setInvestigations(investigations.filter((inv) => inv.id !== id))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }))
    setAttachments([...attachments, ...newAttachments])
  }

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter((att) => att.id !== id))
  }

  const generatePDF = (prescriptionData) => {
    const doctorInfo = getDoctorInfo()
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 4
    })

    // Contact Information (Left: Phone, Right: Email)
    yPos += 1
    doc.setFontSize(8)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
    yPos += 5

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Doctor Information (Left) and Patient Information (Right)
    const infoStartY = yPos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    let patientYPos = yPos
    doc.text(`Name: ${prescriptionData.patientName}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    doc.text(`Age: ${selectedConsultation?.age || 'N/A'} years`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    doc.text(`Gender: ${selectedConsultation?.gender || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    
    // Add patient phone and address if available
    if (prescriptionData.patientPhone || selectedConsultation?.patientPhone) {
      doc.text(`Phone: ${prescriptionData.patientPhone || selectedConsultation?.patientPhone || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
      patientYPos += 4
    }
    if (prescriptionData.patientAddress || selectedConsultation?.patientAddress) {
      let addressText = '';
      const address = prescriptionData.patientAddress || selectedConsultation?.patientAddress;
      
      if (typeof address === 'string') {
        addressText = address;
      } else if (typeof address === 'object' && address !== null) {
        // Build address string from object
        const addressParts = [];
        if (address.line1) addressParts.push(address.line1);
        if (address.line2) addressParts.push(address.line2);
        if (address.city) addressParts.push(address.city);
        if (address.state) addressParts.push(address.state);
        if (address.pincode || address.postalCode) {
          addressParts.push(address.pincode || address.postalCode);
        }
        addressText = addressParts.join(', ').trim();
      } else {
        addressText = 'N/A';
      }
      
      if (addressText && addressText !== '[object Object]' && addressText !== 'N/A') {
      const addressLines = doc.splitTextToSize(`Address: ${addressText}`, pageWidth / 2 - margin)
      addressLines.forEach((line, index) => {
        doc.text(line, pageWidth - margin, patientYPos + (index * 4), { align: 'right' })
      })
      patientYPos += (addressLines.length - 1) * 4
      }
    }

    // Set yPos to the maximum of doctor info end or patient info end
    yPos = Math.max(yPos + 12, patientYPos) + 3

    // Diagnosis Section with Light Blue Background Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 6
    
    // Light blue rounded box for diagnosis
    const diagnosisHeight = 8
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 4, yPos + 2)
    yPos += diagnosisHeight + 4

    // Symptoms Section with Green Bullet Points
    if (prescriptionData.symptoms) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const symptomLines = prescriptionData.symptoms.split('\n').filter(line => line.trim())
      symptomLines.forEach((symptom) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(symptom.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Medications Section with Numbered Cards (Light Gray Background)
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6
      
      prescriptionData.medications.forEach((med, idx) => {
        // Check if we need a new page (with more space check)
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }
        
        // Medication card with light gray background
        const cardHeight = 22
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner)
        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })
        
        // Medication name (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)
        
        // Medication details in 2 columns (left and right)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7
        
        // Left column
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 4)
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    // Get investigations from prescriptionData or consultationId
    const investigations = prescriptionData.investigations || prescriptionData.consultationId?.investigations || [];
    if (investigations && investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      investigations.forEach((inv) => {
        // Light purple box for each test
        // Handle both frontend format (name) and backend format (testName)
        const invName = typeof inv === 'string' 
          ? inv 
          : (inv.name || inv.testName || 'Investigation');
        const invNotes = typeof inv === 'object' ? (inv.notes || '') : '';
        const testBoxHeight = invNotes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(invName, margin + 4, yPos + 2)
        
        if (invNotes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(invNotes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section - Dark text like medications
    if (prescriptionData.advice) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0) // Dark black color like medications
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
        doc.text(advice.trim(), margin, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpDate) {
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    // Calculate space needed for signature - ensure everything fits on one page
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Add digital signature image if available
    if (doctorInfo.digitalSignature && doctorInfo.digitalSignature.trim() !== '') {
      try {
        
        
        // Check if it's a base64 data URL
        let imageData = doctorInfo.digitalSignature.trim()
        
        // Determine image format from data URL
        let imageFormat = 'PNG'
        if (imageData.includes('data:image/jpeg') || imageData.includes('data:image/jpg')) {
          imageFormat = 'JPEG'
        } else if (imageData.includes('data:image/png')) {
          imageFormat = 'PNG'
        } else if (imageData.includes('data:image/')) {
          // Extract format from data URL
          const match = imageData.match(/data:image\/(\w+);/)
          if (match) {
            imageFormat = match[1].toUpperCase()
          }
        }
        
        // Add signature image above the signature line (width: 50, height: 20)
        // Position it above the line
        doc.addImage(imageData, imageFormat, signatureX, signatureY - 18, 50, 20)
        
      } catch (error) {
        console.error('Error adding signature image to PDF:', error)
        // Fallback to line if image fails
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(signatureX, signatureY, signatureX + 50, signatureY)
      }
    } else {
      
      // Draw a line for signature if no image
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    }
    
    // Doctor name and designation below signature (centered under signature area)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Save PDF
    const fileName = `Prescription_${prescriptionData.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const handleDownloadPrescription = (prescription) => {
    generatePDF(prescription)
  }

  const handleEditPrescription = (prescription) => {
    // Load prescription data into form
    setDiagnosis(prescription.diagnosis || '')
    setSymptoms(prescription.symptoms || '')
    setMedications(prescription.medications || [])
    setInvestigations(prescription.investigations || [])
    setAdvice(prescription.advice || '')
    setFollowUpDate(prescription.followUpDate || '')
    setVitals(prescription.vitals || {
      bloodPressure: { systolic: '', diastolic: '' },
      temperature: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      bmi: '',
    })
    
    // Set editing mode
    setEditingPrescriptionId(prescription.id)
    
    // Get consultation ID from prescription
    const consultationId = prescription.consultationId?._id || prescription.consultationId || prescription.originalData?.consultationId?._id || prescription.originalData?.consultationId
    
    // If consultation ID exists, try to load the consultation or set it in selectedConsultation
    if (consultationId) {
      // Try to find the consultation in the consultations list
      const foundConsultation = consultations.find(cons => {
        const consId = cons._id || cons.id
        return consId?.toString() === consultationId.toString()
      })
      
      if (foundConsultation) {
        // Set selected consultation so save function can find it
        setSelectedConsultation(foundConsultation)
      } else {
        // If consultation not found in list, create a minimal consultation object
        // This ensures handleSavePrescription can find the consultation ID
        setSelectedConsultation(prev => ({
          ...prev,
          id: consultationId,
          _id: consultationId,
          consultationId: consultationId,
          patientId: prescription.patientId || prev?.patientId,
          patientName: prescription.patientName || prev?.patientName,
        }))
      }
    }
    
    // Switch to prescription tab
    setActiveTab('prescription')
    
    // Scroll to prescription form
    setTimeout(() => {
      const prescriptionSection = document.querySelector('[data-prescription-section]')
      if (prescriptionSection) {
        prescriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleViewPrescriptionPDF = (prescriptionData) => {
    const doctorInfo = getDoctorInfo()
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Heallyn (Above Clinic Name) - Reduced size to match patient view
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Heallyn', pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    
    // Clinic Name in Teal (Below Heallyn) - Reduced size
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Clinic Address (Centered) - Convert object to string if needed
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    let clinicAddressRaw = doctorInfo.clinicAddress
    let clinicAddress = 'Address not provided'
    
    if (clinicAddressRaw) {
      if (typeof clinicAddressRaw === 'string') {
        clinicAddress = clinicAddressRaw
      } else if (typeof clinicAddressRaw === 'object' && clinicAddressRaw !== null) {
        // Convert address object to string
        const addressParts = []
        if (clinicAddressRaw.line1) addressParts.push(clinicAddressRaw.line1)
        if (clinicAddressRaw.line2) addressParts.push(clinicAddressRaw.line2)
        if (clinicAddressRaw.city) addressParts.push(clinicAddressRaw.city)
        if (clinicAddressRaw.state) addressParts.push(clinicAddressRaw.state)
        if (clinicAddressRaw.postalCode || clinicAddressRaw.pincode) {
          addressParts.push(clinicAddressRaw.postalCode || clinicAddressRaw.pincode)
        }
        if (clinicAddressRaw.country) addressParts.push(clinicAddressRaw.country)
        clinicAddress = addressParts.join(', ').trim() || 'Address not provided'
      }
    }
    
    const addressLines = doc.splitTextToSize(clinicAddress, pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 3
    })

    // Contact Information (Left: Phone, Right: Email) - Compact
    yPos += 1
    doc.setFontSize(7)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.2, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.phone || 'N/A', margin + 5, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.2, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
    yPos += 4

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Doctor Information (Left) and Patient Information (Right) - Compact
    const infoStartY = yPos
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 3)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 6)

    // Patient Info (Right) - Compact with proper data extraction
    let patientYPos = yPos
    // Get patient data from prescription or consultation
    const patient = prescriptionData.patient || prescriptionData.originalData?.patientId || selectedConsultation?.patientId
    const patientName = prescriptionData.patientName || (patient?.firstName && patient?.lastName 
      ? `${patient.firstName} ${patient.lastName}` 
      : patient?.name || 'N/A')
    doc.text(`Name: ${patientName}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3
    
    const patientAge = prescriptionData.age || selectedConsultation?.age || patient?.age || (patient?.dateOfBirth 
      ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null)
    doc.text(`Age: ${patientAge ? `${patientAge} years` : 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3
    
    const patientGender = prescriptionData.gender || selectedConsultation?.gender || patient?.gender || 'N/A'
    doc.text(`Gender: ${patientGender}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3
    
    const patientPhone = prescriptionData.patientPhone || selectedConsultation?.patientPhone || patient?.phone || 'N/A'
    doc.text(`Phone: ${patientPhone}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3
    
    // Patient Address - Always show if available
    const patientAddress = prescriptionData.patientAddress || selectedConsultation?.patientAddress || patient?.address
    if (patientAddress) {
      let addressText = ''
      if (typeof patientAddress === 'string') {
        addressText = patientAddress
      } else if (typeof patientAddress === 'object' && patientAddress !== null) {
        const addressParts = []
        if (patientAddress.line1) addressParts.push(patientAddress.line1)
        if (patientAddress.line2) addressParts.push(patientAddress.line2)
        if (patientAddress.city) addressParts.push(patientAddress.city)
        if (patientAddress.state) addressParts.push(patientAddress.state)
        if (patientAddress.pincode || patientAddress.postalCode) {
          addressParts.push(patientAddress.pincode || patientAddress.postalCode)
        }
        if (patientAddress.country) addressParts.push(patientAddress.country)
        addressText = addressParts.join(', ').trim()
      }
      
      if (addressText && addressText !== '[object Object]') {
        const addressLines = doc.splitTextToSize(`Address: ${addressText}`, pageWidth / 2 - margin - 5)
        addressLines.forEach((line, index) => {
          doc.text(line, pageWidth - margin, patientYPos + (index * 3), { align: 'right' })
        })
        patientYPos += (addressLines.length - 1) * 3
      }
    }

    // Set yPos to the maximum of doctor info end or patient info end
    yPos = Math.max(yPos + 9, patientYPos) + 2

    // Diagnosis Section with Light Blue Background Box - Compact
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 5
    
    // Light blue rounded box for diagnosis - Smaller height
    const diagnosisHeight = 6
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 3, yPos + 1)
    yPos += diagnosisHeight + 3

    // Symptoms Section with Green Bullet Points - Compact
    if (prescriptionData.symptoms) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      const symptomLines = typeof prescriptionData.symptoms === 'string' 
        ? prescriptionData.symptoms.split('\n').filter(line => line.trim())
        : Array.isArray(prescriptionData.symptoms)
        ? prescriptionData.symptoms.filter(s => s && s.trim())
        : [String(prescriptionData.symptoms)]
      
      symptomLines.forEach((symptom) => {
        // Check if we're getting too close to bottom - stop if needed
        if (yPos > pageHeight - 60) return
        
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.2, yPos - 0.8, 1, 'F')
        doc.setTextColor(0, 0, 0)
        const symptomText = typeof symptom === 'string' ? symptom.trim() : String(symptom)
        doc.text(symptomText, margin + 4, yPos)
        yPos += 3
      })
      yPos += 1
    }

    // Medications Section with Numbered Cards (Light Gray Background) - Compact
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 5
      
      prescriptionData.medications.forEach((med, idx) => {
        // NO PAGE BREAKS - Force everything to fit on one page
        // Make medication cards more compact
        const cardHeight = 18
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner) - Smaller
        const numberSize = 6
        const numberX = pageWidth - margin - numberSize - 2
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 0.5, { align: 'center' })
        
        // Medication name (bold, top) - Smaller font
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 3, yPos + 2)
        
        // Medication details in 2 columns (left and right) - Smaller font
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 3
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 3
        const startY = yPos + 6
        
        // Left column
        doc.text(`Dosage: ${med.dosage || 'N/A'}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 3)
        
        // Right column
        doc.text(`Frequency: ${med.frequency || 'N/A'}`, rightColX, startY)
        if (med.instructions) {
          const instructionText = doc.splitTextToSize(`Instructions: ${med.instructions}`, (pageWidth - 2 * margin) / 2 - 5)
          instructionText.forEach((line, i) => {
            if (i === 0) {
              doc.text(line, rightColX, startY + 3)
            } else {
              doc.text(line, rightColX, startY + 3 + (i * 3))
            }
          })
        }
        
        yPos += cardHeight + 2
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    // Get investigations from prescriptionData or consultationId
    const investigations = prescriptionData.investigations || prescriptionData.consultationId?.investigations || [];
    if (investigations && investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      investigations.forEach((inv) => {
        // Light purple box for each test
        // Handle both frontend format (name) and backend format (testName)
        const invName = typeof inv === 'string' 
          ? inv 
          : (inv.name || inv.testName || 'Investigation');
        const invNotes = typeof inv === 'object' ? (inv.notes || '') : '';
        const testBoxHeight = invNotes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(invName, margin + 4, yPos + 2)
        
        if (invNotes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(invNotes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section - Dark text like medications
    if (prescriptionData.advice) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0) // Dark black color like medications
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
        doc.text(advice.trim(), margin, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpDate) {
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Get digital signature from prescription data or doctorInfo - handle both object and string formats
    const digitalSignatureRaw = prescriptionData.doctor?.digitalSignature || prescriptionData.originalData?.doctorId?.digitalSignature || doctorInfo.digitalSignature
    let signatureImageUrl = ''
    
    // Extract imageUrl from signature object or use string directly
    if (digitalSignatureRaw) {
      if (typeof digitalSignatureRaw === 'string') {
        signatureImageUrl = digitalSignatureRaw.trim()
      } else if (typeof digitalSignatureRaw === 'object' && digitalSignatureRaw !== null) {
        signatureImageUrl = digitalSignatureRaw.imageUrl || digitalSignatureRaw.url || ''
      }
    }
    
    // Add digital signature image if available
    if (signatureImageUrl && signatureImageUrl !== '') {
      try {
        let imageData = signatureImageUrl
        let imageFormat = 'PNG'
        
        // Determine image format from data URL or file extension
        if (imageData.includes('data:image/jpeg') || imageData.includes('data:image/jpg')) {
          imageFormat = 'JPEG'
        } else if (imageData.includes('data:image/png')) {
          imageFormat = 'PNG'
        } else if (imageData.includes('data:image/')) {
          const match = imageData.match(/data:image\/(\w+);/)
          if (match) {
            imageFormat = match[1].toUpperCase()
          }
        } else if (imageData.toLowerCase().endsWith('.jpg') || imageData.toLowerCase().endsWith('.jpeg')) {
          imageFormat = 'JPEG'
        } else if (imageData.toLowerCase().endsWith('.png')) {
          imageFormat = 'PNG'
        }
        
        // Calculate signature image dimensions - compact size for prescription
        // Standard signature size: width 50, height 18 (in jsPDF points)
        // This ensures signature is small and properly fits in the document
        const signatureWidth = 50  // Compact width
        const signatureHeight = 18  // Compact height (changed from 20 to match patient view)
        
        // Position signature image above the signature line
        // Position it 18 points above the signature line (standard spacing)
        const signatureImageY = signatureY - signatureHeight
        
        // Add signature image with compact dimensions, properly positioned
        doc.addImage(imageData, imageFormat, signatureX, signatureImageY, signatureWidth, signatureHeight, undefined, 'FAST')
        
      } catch (error) {
        console.error('Error adding signature image to PDF:', error)
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(signatureX, signatureY, signatureX + 50, signatureY)
      }
    } else {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    }
    
    // Doctor name and designation below signature - Adjust position based on whether signature image is present
    const hasSignatureImage = signatureImageUrl && signatureImageUrl !== ''
    const textYPos = hasSignatureImage ? signatureY + 6 : signatureY + 8
    const centerX = signatureX + 25  // Center of signature area (50/2 = 25)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.name, centerX, textYPos, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', centerX, textYPos + 4, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Open PDF in new window for viewing
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 1000)
  }

  const handleSavePrescription = async () => {
    if (!diagnosis) {
      toast.warning('Please enter a diagnosis')
      return
    }

    if (medications.length === 0) {
      toast.warning('Please add at least one medication')
      return
    }

    try {
      // If editing a prescription, get consultation ID from the prescription being edited
      let consultationId = null
      if (editingPrescriptionId) {
        const prescriptionBeingEdited = savedPrescriptions.find(p => (p.id || p._id) === editingPrescriptionId)
        if (prescriptionBeingEdited) {
          consultationId = prescriptionBeingEdited.consultationId?._id || 
                           prescriptionBeingEdited.consultationId || 
                           prescriptionBeingEdited.originalData?.consultationId?._id ||
                           prescriptionBeingEdited.originalData?.consultationId
          
          
          // Also update selectedConsultation with consultation ID if not already set
          if (consultationId && (!selectedConsultation || !selectedConsultation.id || !selectedConsultation._id)) {
            // Try to find consultation in consultations list
            const foundConsultation = consultations.find(cons => {
              const consId = cons._id || cons.id
              return consId?.toString() === consultationId.toString()
            })
            
            if (foundConsultation) {
              setSelectedConsultation(foundConsultation)
            } else {
              // Create minimal consultation object
              setSelectedConsultation(prev => ({
                ...prev,
                id: consultationId,
                _id: consultationId,
                consultationId: consultationId,
              }))
            }
          }
        }
      }
      
      // Get appointment ID from consultation - check multiple possible locations
      let appointmentId = selectedConsultation?.appointmentId?._id || 
                          selectedConsultation?.appointmentId || 
                          selectedConsultation?.originalData?._id ||
                          selectedConsultation?.originalData?.id ||
                          selectedConsultation?.originalData?.appointmentId?._id ||
                          selectedConsultation?.originalData?.appointmentId

      // If appointmentId is still not found, try to extract from consultation ID
      // Consultation ID format: cons-{appointmentId}-{timestamp}
      if (!appointmentId && selectedConsultation?.id && selectedConsultation.id.startsWith('cons-')) {
        const parts = selectedConsultation.id.split('-')
        if (parts.length >= 3) {
          appointmentId = parts[1]
          
        }
      }

      // Get real consultation ID from database (or create consultation if it doesn't exist)
      if (!consultationId) {
        consultationId = selectedConsultation?.id || selectedConsultation?._id
      }
      
      // Check if consultation ID is a valid MongoDB ObjectId
      const isValidObjectId = consultationId && consultationId.match(/^[0-9a-fA-F]{24}$/)
      
      // If editing and we have a valid consultation ID, skip to update section
      if (editingPrescriptionId && isValidObjectId) {
        
        // Will proceed to update consultation section below
      } else if (!isValidObjectId) {
        // Consultation ID is not valid ObjectId - need to find or create consultation
        // But first check if we have appointmentId (required for creating consultation)
        if (!appointmentId) {
          toast.error('Consultation ID not found and appointment ID is missing. Cannot save prescription.')
          return
        }
        
        
        
        // First, try to find existing consultation by appointmentId
        let foundConsultation = null
        try {
          const { getDoctorConsultations } = await import('../doctor-services/doctorService')
          const consultationsResponse = await getDoctorConsultations()
          
          if (consultationsResponse.success && consultationsResponse.data) {
            const consultations = Array.isArray(consultationsResponse.data) 
              ? consultationsResponse.data 
              : consultationsResponse.data.items || []
            
            // Find consultation by appointmentId
            foundConsultation = consultations.find(cons => {
              const consAppointmentId = cons.appointmentId?._id || cons.appointmentId?.id || cons.appointmentId
              return consAppointmentId?.toString() === appointmentId.toString()
            })
            
            if (foundConsultation) {
              consultationId = foundConsultation._id || foundConsultation.id
              
              // Update selected consultation with real ID
              setSelectedConsultation(prev => ({
                ...prev,
                id: consultationId,
                _id: consultationId,
              }))
            }
          }
        } catch (error) {
          console.error('Error fetching consultations:', error)
        }
        
        // If consultation not found, try to create one
        if (!foundConsultation || !consultationId || !consultationId.match(/^[0-9a-fA-F]{24}$/)) {
          
          
          // Prepare vitals data
          const vitalsData = {
            ...vitals,
      date: new Date().toISOString(),
            recordedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
          }

          try {
            // Transform investigations to ensure they have the correct format
            const transformedInvestigationsForCreate = (investigations && investigations.length > 0)
              ? investigations.map(inv => ({
                  name: inv.name || inv.testName || 'Investigation',
                  testName: inv.testName || inv.name || 'Investigation',
                  notes: inv.notes || ''
                }))
              : []

            // Debug logging before create
            

            const consultationResponse = await createConsultation({
              appointmentId,
              diagnosis: diagnosis || '',
              symptoms: symptoms || '',
              vitals: vitalsData,
              medications: medications || [],
              investigations: transformedInvestigationsForCreate,
              advice: advice || '',
              followUpDate: followUpDate || null,
            })

            if (consultationResponse.success) {
              consultationId = consultationResponse.data._id || consultationResponse.data.id
              // Update selected consultation with real ID
              setSelectedConsultation(prev => ({
                ...prev,
                id: consultationId,
                _id: consultationId,
                diagnosis,
                vitals: vitalsData,
                medications,
                investigations,
                advice,
                followUpDate,
              }))
              
            } else {
              toast.error('Failed to create consultation. Cannot save prescription.')
              return
            }
          } catch (createError) {
            // If error is "already exists", find it again
            if (createError.message?.includes('already exists')) {
              
              try {
                const { getDoctorConsultations } = await import('../doctor-services/doctorService')
                const consultationsResponse = await getDoctorConsultations()
                
                if (consultationsResponse.success && consultationsResponse.data) {
                  const consultations = Array.isArray(consultationsResponse.data) 
                    ? consultationsResponse.data 
                    : consultationsResponse.data.items || []
                  
                  const existingConsultation = consultations.find(cons => {
                    const consAppointmentId = cons.appointmentId?._id || cons.appointmentId?.id || cons.appointmentId
                    return consAppointmentId?.toString() === appointmentId.toString()
                  })
                  
                  if (existingConsultation) {
                    consultationId = existingConsultation._id || existingConsultation.id
                    
                    setSelectedConsultation(prev => ({
                      ...prev,
                      id: consultationId,
                      _id: consultationId,
                    }))
                  } else {
                    toast.error('Consultation exists but could not be found. Please refresh and try again.')
                    return
                  }
                }
              } catch (findError) {
                console.error('Error finding existing consultation:', findError)
                toast.error('Failed to find existing consultation. Cannot save prescription.')
                return
              }
            } else {
              toast.error(createError.message || 'Failed to create consultation. Cannot save prescription.')
              return
            }
          }
        }
      }
      
      // If we have a valid consultation ID (either from editing or from above logic), update it
      if (consultationId && consultationId.match(/^[0-9a-fA-F]{24}$/)) {
        // Consultation exists - update it with prescription data
        
        
        // Prepare vitals data
        const vitalsData = {
          ...vitals,
          date: new Date().toISOString(),
          recordedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
          }),
    }

        // Transform investigations to ensure they have the correct format
        const transformedInvestigations = (investigations && investigations.length > 0)
          ? investigations.map(inv => ({
              name: inv.name || inv.testName || 'Investigation',
              testName: inv.testName || inv.name || 'Investigation',
              notes: inv.notes || ''
            }))
          : []

        // Debug logging before update
        

        const updateResponse = await updateConsultation(consultationId, {
          diagnosis,
          symptoms: symptoms || '',
          vitals: vitalsData,
          medications,
          investigations: transformedInvestigations,
          advice,
          followUpDate: followUpDate || null,
        })

        if (!updateResponse.success) {
          console.error('Failed to update consultation:', updateResponse)
          toast.error('Failed to update consultation. Cannot save prescription.')
          return
        }
        
      }

      // Now create prescription with real consultation ID (MongoDB ObjectId)
      
      
      // Check if prescription already exists for this consultation
      let existingPrescription = null
      try {
        const { getPrescriptions } = await import('../doctor-services/doctorService')
        const existingPrescriptionsResponse = await getPrescriptions({ consultationId })
        if (existingPrescriptionsResponse.success && existingPrescriptionsResponse.data?.items?.length > 0) {
          existingPrescription = existingPrescriptionsResponse.data.items[0]
          
          
          // If editing the same prescription, we can proceed to update consultation
          // But we can't create a new prescription - show message
          if (editingPrescriptionId && (existingPrescription._id?.toString() === editingPrescriptionId.toString() || existingPrescription.id?.toString() === editingPrescriptionId.toString())) {
            
            // Use existing prescription
            const prescriptionResponse = {
              success: true,
              data: existingPrescription
            }
            
            // Update saved prescriptions list with updated data
            const transformedPrescription = {
              id: existingPrescription._id || existingPrescription.id,
              _id: existingPrescription._id || existingPrescription.id,
              consultationId: existingPrescription.consultationId?._id || existingPrescription.consultationId || consultationId,
              patientId: existingPrescription.patientId?._id || existingPrescription.patientId?.id || existingPrescription.patientId || selectedConsultation.patientId,
              patientName: existingPrescription.patientId?.firstName && existingPrescription.patientId?.lastName
                ? `${existingPrescription.patientId.firstName} ${existingPrescription.patientId.lastName}`
                : selectedConsultation.patientName || 'Patient',
              patientImage: existingPrescription.patientId?.profileImage || selectedConsultation.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConsultation.patientName || 'Patient')}&background=11496c&color=fff&size=160`,
              patientPhone: existingPrescription.patientId?.phone || selectedConsultation.patientPhone || '',
              patientEmail: existingPrescription.patientId?.email || selectedConsultation.patientEmail || '',
              patientAddress: existingPrescription.patientId?.address || selectedConsultation.patientAddress || '',
              diagnosis: diagnosis || '',
              symptoms: symptoms || '',
              medications: medications || [],
              investigations: investigations || [],
              advice: advice || '',
              followUpDate: followUpDate || '',
              date: existingPrescription.createdAt ? new Date(existingPrescription.createdAt).toISOString() : new Date().toISOString(),
              savedAt: existingPrescription.createdAt ? new Date(existingPrescription.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              status: existingPrescription.status || 'active',
              pdfFileUrl: existingPrescription.pdfFileUrl || null,
              originalData: existingPrescription,
            }
            
            setSavedPrescriptions((prev) =>
              prev.map(p => (p.id || p._id) === (transformedPrescription.id || transformedPrescription._id) ? transformedPrescription : p)
            )
            
            // Update consultation data
            const updatedConsultation = {
              ...selectedConsultation,
              id: consultationId,
              _id: consultationId,
              status: selectedConsultation?.status || 'in-progress',
              diagnosis,
              vitals,
              medications,
              investigations,
              advice,
              prescriptionId: existingPrescription._id || existingPrescription.id,
            }
            
            setConsultations((prev) =>
              prev.map((cons) =>
                (cons.id === selectedConsultation.id || cons._id === consultationId) ? updatedConsultation : cons
              )
            )
            
            setSelectedConsultation(updatedConsultation)
            
            toast.success('Prescription updated successfully!')
            
            // Reset form
            setDiagnosis('')
            setSymptoms('')
            setMedications([])
            setInvestigations([])
            setAdvice('')
            setFollowUpDate('')
            setVitals({
              bloodPressure: { systolic: '', diastolic: '' },
              temperature: '',
              pulse: '',
              respiratoryRate: '',
              oxygenSaturation: '',
              weight: '',
              height: '',
              bmi: '',
            })
            setEditingPrescriptionId(null)
            setActiveTab('saved')
            return // Exit early since we handled the update
          } else {
            // Prescription exists but we're not editing it - show error
            toast.error('Prescription already exists for this consultation. Please edit the existing prescription instead.')
            return
          }
        }
      } catch (checkError) {
        console.error('Error checking existing prescription:', checkError)
        // Continue to create new prescription if check fails
      }
      
      // Create new prescription
      const prescriptionResponse = await createPrescription({
        consultationId: consultationId, // Use real MongoDB ObjectId
        medications: medications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
        })),
        notes: advice || '', // Use advice as notes
        expiryDate: followUpDate || null,
        // Include diagnosis, symptoms, investigations in the request
        // Backend will get these from consultation, but we can also pass them explicitly
        diagnosis: diagnosis || '',
        symptoms: symptoms || '',
        investigations: investigations || [],
      })
        
        if (prescriptionResponse && prescriptionResponse.success) {
        // Transform prescription data to match component structure
        const prescriptionData = prescriptionResponse.data
        const transformedPrescription = {
          id: prescriptionData._id || prescriptionData.id,
          _id: prescriptionData._id || prescriptionData.id,
          consultationId: prescriptionData.consultationId?._id || prescriptionData.consultationId || consultationId,
          patientId: prescriptionData.patientId?._id || prescriptionData.patientId?.id || prescriptionData.patientId || selectedConsultation.patientId,
          patientName: prescriptionData.patientId?.firstName && prescriptionData.patientId?.lastName
            ? `${prescriptionData.patientId.firstName} ${prescriptionData.patientId.lastName}`
            : selectedConsultation.patientName || 'Patient',
          patientImage: prescriptionData.patientId?.profileImage || selectedConsultation.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConsultation.patientName || 'Patient')}&background=11496c&color=fff&size=160`,
          patientPhone: prescriptionData.patientId?.phone || selectedConsultation.patientPhone || '',
          patientEmail: prescriptionData.patientId?.email || selectedConsultation.patientEmail || '',
          patientAddress: prescriptionData.patientId?.address || selectedConsultation.patientAddress || '',
          // Get diagnosis, symptoms, investigations from consultationId
          diagnosis: prescriptionData.consultationId?.diagnosis || diagnosis || '',
          symptoms: prescriptionData.consultationId?.symptoms || symptoms || '',
          medications: prescriptionData.medications || medications || [],
          investigations: prescriptionData.consultationId?.investigations || investigations || [],
          advice: prescriptionData.consultationId?.advice || prescriptionData.notes || advice || '',
          followUpDate: prescriptionData.consultationId?.followUpDate || prescriptionData.expiryDate || followUpDate || '',
          date: prescriptionData.createdAt ? new Date(prescriptionData.createdAt).toISOString() : new Date().toISOString(),
          savedAt: prescriptionData.createdAt ? new Date(prescriptionData.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: prescriptionData.status || 'active',
          pdfFileUrl: prescriptionData.pdfFileUrl || null,
          originalData: prescriptionData,
        }
        
        // Update saved prescriptions list
        setSavedPrescriptions((prev) => {
          // Check if prescription already exists (avoid duplicates)
          const exists = prev.find(p => (p.id || p._id) === (transformedPrescription.id || transformedPrescription._id))
          if (exists) {
            return prev.map(p => (p.id || p._id) === (transformedPrescription.id || transformedPrescription._id) ? transformedPrescription : p)
      }
          return [transformedPrescription, ...prev]
        })
    
    // Update consultation data in both consultations list and selectedConsultation
    // IMPORTANT: Do NOT change status to 'completed' here - status should only change when doctor clicks "Complete" button
    const updatedConsultation = {
      ...selectedConsultation,
          id: consultationId,
          _id: consultationId,
      // Keep existing status (don't change to 'completed')
      status: selectedConsultation?.status || 'in-progress',
      diagnosis,
      vitals,
      medications,
      investigations,
      advice,
          prescriptionId: prescriptionData._id || prescriptionData.id,
    }
    
    setConsultations((prev) =>
      prev.map((cons) =>
            (cons.id === selectedConsultation.id || cons._id === consultationId) ? updatedConsultation : cons
      )
    )
    
    // Also update selectedConsultation state (but keep status as is)
    setSelectedConsultation(updatedConsultation)
        
        toast.success('Prescription saved successfully!')
        
        // Reset form and editing state ONLY after successful save
        setDiagnosis('')
        setSymptoms('')
        setMedications([])
        setInvestigations([])
        setAdvice('')
        setFollowUpDate('')
        setVitals({
          bloodPressure: { systolic: '', diastolic: '' },
          temperature: '',
          pulse: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          weight: '',
          height: '',
          bmi: '',
        })
        setEditingPrescriptionId(null)
        
        // Switch to saved prescriptions tab
        setActiveTab('saved')
      } else {
        toast.error(prescriptionResponse?.message || 'Failed to save prescription')
        // Don't reset form if save failed
      }
    } catch (error) {
      console.error('Error saving prescription:', error)
      toast.error(error.message || error.response?.data?.message || 'Failed to save prescription')
      // Don't reset form if error occurred
    }
  }

  // Get filter label
  const getFilterLabel = () => {
    switch (filterParam) {
      case 'today':
        return 'Today\'s Appointments'
      case 'pending':
        return 'Pending Consultations'
      case 'all':
      default:
        return 'All Consultations'
    }
  }

  return (
    <>
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-28' : ''}`}>
        {/* Filter Header */}
        {filterParam !== 'all' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{getFilterLabel()}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredConsultations.length} {filteredConsultations.length === 1 ? 'consultation' : 'consultations'} found
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.history.pushState({}, '', '/doctor/consultations')}
                className="text-sm font-medium text-[#11496c] hover:text-[#0d3a52]"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {/* Consultations List View - Only show if patient was called */}
        {!selectedConsultation && filteredConsultations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              {filterParam !== 'all' ? getFilterLabel() : 'Active Consultations'}
            </h2>
            <div className="space-y-3">
              {filteredConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={async () => {
                    // Mark as manually selected - this prevents socket handlers from clearing it
                    isManuallySelectedRef.current = true
                    
                    // Refresh consultation data from API to get latest patient info
                    try {
                      const response = await getConsultationById(consultation.id)
                      if (response.success && response.data) {
                        const refreshedConsultation = transformConsultationData(response.data)
                        setSelectedConsultation(refreshedConsultation)
                      } else {
                        setSelectedConsultation(consultation)
                      }
                    } catch (error) {
                      console.error('Error refreshing consultation:', error)
                      setSelectedConsultation(consultation)
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#11496c]/30 active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={consultation.patientImage}
                      alt={consultation.patientName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900">{consultation.patientName}</h3>
                          <p className="mt-1 text-sm text-slate-600">{consultation.reason}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          consultation.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : consultation.status === 'waiting' || consultation.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : consultation.status === 'in-progress' || consultation.status === 'called'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {consultation.status === 'in-progress' ? 'IN-PROGRESS' : 
                           consultation.status === 'called' ? 'IN-PROGRESS' :
                           consultation.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-4 w-4" />
                          <span>{formatDateTime(consultation.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{consultation.age} years • {consultation.gender}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#11496c] font-medium">
                          {(() => {
                            const ModeIcon = getTypeIcon(consultation.consultationMode)
                            return (
                              <>
                                <ModeIcon className="h-3.5 w-3.5" />
                                <span>{getModeLabel(consultation.consultationMode)}</span>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Consultations Message - Only show when no patient was called and not viewing from all consultations */}
        {!selectedConsultation && filteredConsultations.length === 0 && !location.state?.loadSavedData && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <IoPersonOutline className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No Patient Selected</h3>
            <p className="mt-2 text-sm text-slate-600">
              Please call a patient from the queue to start consultation.
            </p>
            <button
              type="button"
              onClick={() => navigate('/doctor/patients')}
              className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
            >
              <IoArrowBackOutline className="h-4 w-4" />
              Go to Patient Queue
            </button>
          </div>
        )}

        {/* Consultation Detail View */}
          {selectedConsultation ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
                {/* Left Column - Patient Info & History */}
                <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                  <ConsultationHeader
                    selectedConsultation={selectedConsultation}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    getTypeIcon={getTypeIcon}
                    getModeLabel={getModeLabel}
                  />
              </div>

              {/* Right Column - Consultation Form */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {/* Tabs */}
                <ConsultationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Vitals & Examination Tab */}
                {activeTab === 'vitals' && (
                  <VitalsTab
                    vitals={vitals}
                    setVitals={setVitals}
                    setVitalsEdited={setVitalsEdited}
                    isConsultationActiveRef={isConsultationActiveRef}
                    onSaveVitals={async () => {
                      // Save vitals to patient history via API
                      if (!selectedConsultation) {
                        toast.warning('Please select a patient first')
                        return
                      }

                      // Validate that at least some vitals are entered
                      const hasVitals = vitals.temperature || vitals.pulse || vitals.respiratoryRate || 
                                       vitals.oxygenSaturation || vitals.weight || vitals.height ||
                                       vitals.bloodPressure?.systolic || vitals.bloodPressure?.diastolic
                      
                      if (!hasVitals) {
                        toast.warning('Please enter at least one vital sign')
                        return
                      }

                      try {
                        // Get appointment ID from consultation - check multiple possible locations
                        let appointmentId = selectedConsultation.appointmentId?._id || 
                                            selectedConsultation.appointmentId || 
                                            selectedConsultation.originalData?._id ||
                                            selectedConsultation.originalData?.id ||
                                            selectedConsultation.originalData?.appointmentId?._id ||
                                            selectedConsultation.originalData?.appointmentId

                        // If still not found, try to extract from consultation ID
                        // Consultation ID format: cons-{appointmentId}-{timestamp}
                        if (!appointmentId && selectedConsultation.id) {
                          const idMatch = selectedConsultation.id.match(/^cons-([a-fA-F0-9]{24})-/)
                          if (idMatch && idMatch[1]) {
                            appointmentId = idMatch[1]
                            
                          }
                        }

                        // If still not found, try to get from patient's current appointment
                        if (!appointmentId && selectedConsultation.patientId) {
                        try {
                            const patientId = typeof selectedConsultation.patientId === 'object' 
                              ? (selectedConsultation.patientId._id || selectedConsultation.patientId.id || selectedConsultation.patientId)
                              : selectedConsultation.patientId
                            
                            // Get today's queue to find the appointment
                            const today = new Date().toISOString().split('T')[0]
                            const queueResponse = await getPatientQueue(today)
                            
                            if (queueResponse.success && queueResponse.data?.appointments) {
                              const appointment = queueResponse.data.appointments.find(apt => {
                                const aptPatientId = apt.patientId?._id || apt.patientId
                                return aptPatientId?.toString() === patientId?.toString() &&
                                       (apt.status === 'called' || apt.status === 'in-consultation' || apt.status === 'in_progress' || apt.status === 'scheduled' || apt.status === 'confirmed')
                              })
                              
                              if (appointment) {
                                appointmentId = appointment._id || appointment.id
                                
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching appointment from queue:', error)
                          }
                        }

                        if (!appointmentId) {
                          toast.error('Appointment ID not found. Cannot save vitals.')
                          console.error('❌ Appointment ID not found in consultation:', {
                            consultationId: selectedConsultation.id,
                            hasAppointmentId: !!selectedConsultation.appointmentId,
                            hasOriginalData: !!selectedConsultation.originalData,
                            patientId: selectedConsultation.patientId
                          })
                          return
                        }
                        
                        

                        // Prepare vitals data with timestamp
                        const vitalsData = {
                          ...vitals,
                          date: new Date().toISOString(),
                          recordedAt: new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        }
                        
                        // Check if consultation exists, if not create it, otherwise update it
                        let consultationId = selectedConsultation.id || selectedConsultation._id
                        
                        // If consultation ID doesn't look like a MongoDB ID, we need to create/update via appointment
                        if (!consultationId || !consultationId.match(/^[0-9a-fA-F]{24}$/)) {
                          // Create new consultation with vitals
                          const consultationResponse = await createConsultation({
                            appointmentId,
                            diagnosis: diagnosis || '',
                            vitals: vitalsData,
                            medications: medications || [],
                            investigations: investigations || [],
                            advice: advice || '',
                            followUpDate: followUpDate || null,
                          })

                          if (consultationResponse.success) {
                            consultationId = consultationResponse.data._id || consultationResponse.data.id
                            // Update selected consultation with new ID
                            setSelectedConsultation(prev => ({
                              ...prev,
                              id: consultationId,
                              _id: consultationId,
                              vitals: vitalsData
                            }))
                          }
                        } else {
                          // Update existing consultation with vitals
                          const updateResponse = await updateConsultation(consultationId, {
                            vitals: vitalsData,
                          })

                          if (updateResponse.success) {
                            // Update selected consultation with new vitals
                            setSelectedConsultation(prev => ({
                              ...prev,
                              vitals: vitalsData
                            }))
                          }
                        }

                        // Reload patient history to show updated vitals
                        if (selectedConsultation.patientId) {
                          const patientId = typeof selectedConsultation.patientId === 'object' 
                            ? (selectedConsultation.patientId._id || selectedConsultation.patientId.id || selectedConsultation.patientId)
                            : selectedConsultation.patientId
                          
                          const historyResponse = await getPatientHistory(patientId)
                          if (historyResponse.success && historyResponse.data) {
                            setPatientHistory(historyResponse.data)
                          }
                        }

                        toast.success('Vitals saved to patient history successfully!')
                          
                        // Reset vitals form after successful save
                          setVitals({
                            bloodPressure: { systolic: '', diastolic: '' },
                            temperature: '',
                            pulse: '',
                            respiratoryRate: '',
                            oxygenSaturation: '',
                            weight: '',
                            height: '',
                            bmi: '',
                          })
                        setVitalsEdited(false)
                        } catch (error) {
                          console.error('Error saving vitals to history:', error)
                        toast.error(error.message || 'Error saving vitals. Please try again.')
                      }
                    }}
                  />
                )}

                {/* Prescription Tab */}
                {activeTab === 'prescription' && (
                  <PrescriptionTab
                    sharedLabReports={sharedLabReports}
                    setSelectedReport={setSelectedReport}
                    setShowReportViewer={setShowReportViewer}
                    handleViewLabReport={handleViewLabReport}
                    handleDownloadLabReport={handleDownloadLabReport}
                    selectedConsultation={selectedConsultation}
                    formatDate={formatDate}
                    doctorInfo={doctorInfo}
                    diagnosis={diagnosis}
                    setDiagnosis={setDiagnosis}
                    symptoms={symptoms}
                    setSymptoms={setSymptoms}
                    medications={medications}
                    setShowAddMedication={setShowAddMedication}
                    handleRemoveMedication={handleRemoveMedication}
                    investigations={investigations}
                    setShowAddInvestigation={setShowAddInvestigation}
                    handleRemoveInvestigation={handleRemoveInvestigation}
                    advice={advice}
                    setAdvice={setAdvice}
                    followUpDate={followUpDate}
                    setFollowUpDate={setFollowUpDate}
                    handleSavePrescription={handleSavePrescription}
                    generatePDF={generatePDF}
                  />
                )}
                {/* History Tab */}
                {activeTab === 'history' && (
                  <PatientHistoryTab
                    patientHistory={patientHistory}
                    selectedConsultation={selectedConsultation}
                    sharedLabReports={sharedLabReports}
                    formatDate={formatDate}
                    handleViewLabReport={handleViewLabReport}
                    handleDownloadLabReport={handleDownloadLabReport}
                  />
                )}
              </div>
            </div>
          </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No active consultation</p>
              <p className="mt-1 text-xs text-slate-500">Select a patient from the Patients tab to start</p>
            </div>
          )}
      </section>

      {/* Add Medication Modal */}
      {showAddMedication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMedication(false)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Add Medication</h2>
              <button
                type="button"
                onClick={() => setShowAddMedication(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="relative medicine-dropdown-container">
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Medication Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => handleMedicineNameChange(e.target.value)}
                    onFocus={() => {
                      if (availableMedicines.length > 0) {
                        setShowMedicineDropdown(true)
                      }
                    }}
                    placeholder="Search or type medicine name..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c]"
                  />
                  <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 pointer-events-none" />
                  
                  {/* Medicine Dropdown */}
                  {showMedicineDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((medicine, index) => (
                          <button
                            key={medicine._id || index}
                            type="button"
                            onClick={() => handleMedicineSelect(medicine)}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                  {medicine.name}
                                  {medicine.dosage && ` (${medicine.dosage})`}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                                  {medicine.manufacturer && `${medicine.manufacturer}`}
                                </p>
                              </div>
                              <IoMedicalOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] ml-2 shrink-0" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-xs sm:text-sm text-slate-600">
                            {medicineSearchTerm.trim() 
                              ? `No medicine found matching "${medicineSearchTerm}". You can type manually to add it.`
                              : 'Start typing to search medicines...'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Dosage *</label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="e.g., 5mg"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Frequency *</label>
                <div className="relative">
                  <select
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c]"
                  >
                    <option value="" disabled>Select frequency...</option>
                    <option value="Once daily (OD)">Once daily (OD)</option>
                    <option value="Twice daily (BD)">Twice daily (BD)</option>
                    <option value="Thrice daily (TDS)">Thrice daily (TDS)</option>
                    <option value="Four times daily (QID)">Four times daily (QID)</option>
                    <option value="As needed (SOS)">As needed (SOS)</option>
                    <option value="Every morning">Every morning</option>
                    <option value="Every night">Every night</option>
                    <option value="Every 4 hours">Every 4 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="Alternate days">Alternate days</option>
                    <option value="Once a week">Once a week</option>
                  </select>
                  <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Duration</label>
                <div className="relative">
                  <select
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c]"
                  >
                    <option value="">Select duration (optional)...</option>
                    <option value="1 day">1 day</option>
                    <option value="2 days">2 days</option>
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="1 week">1 week</option>
                    <option value="10 days">10 days</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="3 weeks">3 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Until finished">Until finished</option>
                  </select>
                  <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Instructions</label>
                <textarea
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  placeholder="Additional instructions..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 border-t border-slate-200 p-3 sm:p-4 lg:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddMedication(false)
                  setShowMedicineDropdown(false)
                  setMedicineSearchTerm('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMedication}
                disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Investigation Modal */}
      {showAddInvestigation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddInvestigation(false)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Add Investigation</h2>
              <button
                type="button"
                onClick={() => setShowAddInvestigation(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="relative test-dropdown-container">
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Test Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newInvestigation.name}
                    onChange={(e) => handleTestNameChange(e.target.value)}
                    onFocus={() => {
                      if (availableTests.length > 0) {
                        setShowTestDropdown(true)
                      }
                    }}
                    placeholder="Search or type test name..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c]"
                  />
                  <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 pointer-events-none" />
                  
                  {/* Test Dropdown */}
                  {showTestDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTests.length > 0 ? (
                        filteredTests.map((test, index) => (
                          <button
                            key={test._id || index}
                            type="button"
                            onClick={() => handleTestSelect(test)}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{test.name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                                  {test.category && `${test.category}`}
                                </p>
                              </div>
                              <IoFlaskOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] ml-2 shrink-0" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-xs sm:text-sm text-slate-600">
                            {testSearchTerm.trim() 
                              ? `No test found matching "${testSearchTerm}". You can type manually to add it.`
                              : 'Start typing to search tests...'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Notes</label>
                <textarea
                  value={newInvestigation.notes}
                  onChange={(e) => setNewInvestigation({ ...newInvestigation, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 border-t border-slate-200 p-3 sm:p-4 lg:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddInvestigation(false)
                  setShowTestDropdown(false)
                  setTestSearchTerm('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddInvestigation}
                disabled={!newInvestigation.name}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Viewer Modal */}
      {showReportViewer && selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            setShowReportViewer(false)
            setSelectedReport(null)
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4 rounded-t-2xl">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {selectedReport.testName || selectedReport.reportName || 'Lab Report'}
                </h2>
                {selectedReport.labName && (
                  <p className="text-sm text-slate-600 mt-1">{selectedReport.labName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  // Check if PDF is available (either from report or stored)
                  const storedPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
                  const storedPdf = storedPdfs[selectedReport.id]
                  const pdfUrl = selectedReport.pdfFileUrl || selectedReport.downloadUrl
                  const hasPdf = (pdfUrl && pdfUrl !== '#') || (storedPdf && storedPdf.base64Data)
                  
                  return hasPdf ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadLabReport(selectedReport)
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                      title="Download PDF"
                    >
                      <IoDownloadOutline className="h-5 w-5" />
                    </button>
                  ) : null
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setShowReportViewer(false)
                    setSelectedReport(null)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content - Always show PDF if available, otherwise show message */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {(() => {
                // Check if PDF is available (either from report or stored)
                const storedPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
                const storedPdf = storedPdfs[selectedReport.id]
                const pdfUrl = selectedReport.pdfFileUrl || selectedReport.downloadUrl
                const hasPdf = (pdfUrl && pdfUrl !== '#' && pdfUrl.trim() !== '') || (storedPdf && storedPdf.base64Data)
                const displayUrl = storedPdf?.base64Data || pdfUrl
                
                return hasPdf ? (
                  <div className="w-full h-full min-h-[500px] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                    <object
                      data={`${displayUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      type="application/pdf"
                      className="w-full h-full min-h-[500px]"
                      style={{ border: 'none' }}
                    >
                      <iframe
                        src={`${displayUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                        className="w-full h-full min-h-[500px]"
                        style={{ border: 'none' }}
                        title="Lab Report PDF"
                      />
                      <div className="p-6 text-center">
                        <p className="text-sm text-slate-600 mb-4">Unable to display PDF in browser.</p>
                        <button
                          type="button"
                          onClick={() => {
                            handleViewLabReport(selectedReport)
                          }}
                          className="rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
                        >
                          Open PDF in New Tab
                        </button>
                      </div>
                    </object>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                    <IoFlaskOutline className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                    <p className="text-sm font-medium text-slate-600 mb-2">PDF Report Not Available</p>
                    <p className="text-xs text-slate-500">
                      PDF report will be available once the lab uploads it.
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorConsultations
