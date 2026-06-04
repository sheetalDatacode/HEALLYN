import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCallOutline,
  IoVideocamOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoCardOutline,
  IoCheckmarkCircle,
  IoInformationCircleOutline,
  IoMailOutline,
  IoPulseOutline,
} from 'react-icons/io5'
import { getDoctorById, bookAppointment, getPatientAppointments, getPatientProfile, getPatientPrescriptions, checkDoctorSlotAvailability, createAppointmentPaymentOrder, verifyAppointmentPayment, submitReview, rescheduleAppointment, cancelAppointment } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

// Default doctor data (will be replaced by API)
const defaultDoctor = null

// Helper function to convert 24-hour format to 12-hour format (or return as is if already 12-hour)
const convertTo12Hour = (time) => {
  if (!time) return ''
  
  // If already in 12-hour format (contains AM/PM), return as is
  if (time.toString().includes('AM') || time.toString().includes('PM')) {
    return time
  }
  
  // Handle both "HH:MM" and "HH:MM:SS" formats (24-hour format)
  const [hours, minutes] = time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return time
  
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12 // Convert 0 to 12 for 12 AM
  const minutesStr = minutes.toString().padStart(2, '0')
  
  return `${hours12}:${minutesStr} ${period}`
}

// Helper function to format availability
const formatAvailability = (availability) => {
  if (!availability || !Array.isArray(availability) || availability.length === 0) {
    return 'Available'
  }
  
  // Filter out entries without day or time
  const validAvailability = availability.filter(av => 
    av.day && av.startTime && av.endTime
  )
  
  if (validAvailability.length === 0) return 'Available'
  
  // Group by time slots (same start and end time)
  const timeGroups = {}
  validAvailability.forEach(av => {
    const timeKey = `${av.startTime}-${av.endTime}`
    if (!timeGroups[timeKey]) {
      timeGroups[timeKey] = {
        days: [],
        startTime: av.startTime,
        endTime: av.endTime,
      }
    }
    timeGroups[timeKey].days.push(av.day)
  })
  
  // Format each time group
  const formattedGroups = Object.values(timeGroups).map(group => {
    const startTime12 = convertTo12Hour(group.startTime)
    const endTime12 = convertTo12Hour(group.endTime)
    const daysStr = group.days.join(', ')
    return `${daysStr}: ${startTime12} - ${endTime12}`
  })
  
  // Join all groups with line breaks or commas
  return formattedGroups.join('; ')
}

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-5 w-5 text-amber-400" />)
  }

  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-5 w-5 text-amber-400" />)
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(<IoStarOutline key={`empty-${i}`} className="h-5 w-5 text-slate-300" />)
  }

  return stars
}

// Get next 7 days
const getAvailableDates = () => {
  const dates = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      isToday: i === 0,
      isTomorrow: i === 1,
    })
  }
  return dates
}

// Helper function to check if doctor is active (removed localStorage dependency)
// Doctor active status is now determined by the doctor data from API
const isDoctorActive = (doctor) => {
  return doctor?.isActive !== false
}

const PatientDoctorDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [doctor, setDoctor] = useState(defaultDoctor)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch doctor details from API
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getDoctorById(id)
        
        if (response.success && response.data) {
          // Backend returns { doctor, reviews, reviewStats, queueInfo }
          const doctorData = response.data.doctor || response.data
          const transformed = {
            id: doctorData._id || doctorData.id,
            _id: doctorData._id || doctorData.id,
            name: doctorData.firstName && doctorData.lastName
              ? `Dr. ${doctorData.firstName} ${doctorData.lastName}`
              : doctorData.name || (doctorData.firstName ? `Dr. ${doctorData.firstName}` : 'Dr. Unknown'),
            specialty: doctorData.specialization || doctorData.specialty || 'General',
            experience: doctorData.experienceYears 
              ? `${doctorData.experienceYears} years` 
              : doctorData.experience || 'N/A',
            rating: response.data.reviewStats?.averageRating || doctorData.rating || 0,
            reviewCount: response.data.reviewStats?.totalReviews || doctorData.reviewCount || 0,
            consultationFee: doctorData.consultationFee || 0,
            distance: doctorData.distance || 'N/A',
            location: (() => {
              if (!doctorData.clinicDetails) return doctorData.location || 'Location not available'
              
              const parts = []
              if (doctorData.clinicDetails.name) parts.push(doctorData.clinicDetails.name)
              
              if (doctorData.clinicDetails.address) {
                const addr = doctorData.clinicDetails.address
                if (addr.line1) parts.push(addr.line1)
                if (addr.line2) parts.push(addr.line2)
                if (addr.city) parts.push(addr.city)
                if (addr.state) parts.push(addr.state)
                if (addr.postalCode) parts.push(addr.postalCode)
                if (addr.country) parts.push(addr.country)
              }
              
              return parts.length > 0 ? parts.join(', ') : 'Location not available'
            })(),
            clinicName: doctorData.clinicDetails?.name || '',
            clinicAddress: doctorData.clinicDetails?.address || {},
            availability: doctorData.availability && doctorData.availability.length > 0
              ? formatAvailability(doctorData.availability)
              : (doctorData.availableTimings && doctorData.availableTimings.length > 0
                ? doctorData.availableTimings.join(', ')
                : 'Available'),
            nextSlot: response.data.queueInfo?.nextToken 
              ? `Token #${response.data.queueInfo.nextToken}${response.data.queueInfo?.eta ? ` (${response.data.queueInfo.eta})` : ''}`
              : (response.data.queueInfo?.eta || null),
            image: doctorData.profileImage || doctorData.documents?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent((doctorData.firstName && doctorData.lastName ? `${doctorData.firstName} ${doctorData.lastName}` : doctorData.firstName || 'Doctor'))}&background=11496c&color=fff&size=128&bold=true`,
            languages: doctorData.languages || ['English'],
            education: doctorData.qualification || doctorData.education || 'MBBS',
            about: doctorData.bio || doctorData.about || '',
            phone: doctorData.phone || doctorData.clinicDetails?.phone || 'N/A',
            originalData: doctorData,
          }
          setDoctor(transformed)
          
          // Check if doctor is active
          if (!isDoctorActive(transformed.name)) {
            toast.error('This doctor profile is currently not available.')
            navigate('/patient/doctors')
          }
        } else {
          setError('Doctor not found')
          toast.error('Doctor not found')
          navigate('/patient/doctors')
        }
      } catch (err) {
        console.error('Error fetching doctor details:', err)
        setError(err.message || 'Failed to load doctor details')
        toast.error('Failed to load doctor details')
        navigate('/patient/doctors')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDoctorDetails()
    }
  }, [id, navigate, toast])
  
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  // Removed selectedTime - time will be automatically assigned by backend based on token number
  const [appointmentType, setAppointmentType] = useState('in_person')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPrescriptions, setSelectedPrescriptions] = useState([]) // Prescriptions to share
  const [bookingStep, setBookingStep] = useState(1) // 1: Date/Time, 2: Details, 3: Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false) // Track if rescheduling
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState(null) // Appointment ID to reschedule
  const [cancelledSessionDate, setCancelledSessionDate] = useState(null) // Original cancelled session date to block
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const availableDates = getAvailableDates()

  // Check if patient is a returning patient (within 7 days) - using API
  const [isReturningPatient, setIsReturningPatient] = useState(false)
  const [lastVisitData, setLastVisitData] = useState(null)
  const [patientProfile, setPatientProfile] = useState(null)
  
  useEffect(() => {
    const checkIsReturningPatientAsync = async () => {
      if (!doctor?.id && !doctor?._id) return
      
      try {
        const response = await getPatientAppointments({ 
          doctor: doctor.id || doctor._id,
          status: 'completed'
        })
        
        if (response.success && response.data) {
          const appointments = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          
          // Find last completed appointment with this doctor
          const lastAppointment = appointments
            .filter(apt => {
              const aptDoctorId = apt.doctorId?._id || apt.doctorId?.id || apt.doctorId
              const currentDoctorId = doctor.id || doctor._id
              return aptDoctorId === currentDoctorId && 
                     (apt.status === 'completed' || apt.status === 'visited')
            })
            .sort((a, b) => {
              const dateA = new Date(a.appointmentDate || a.createdAt || 0)
              const dateB = new Date(b.appointmentDate || b.createdAt || 0)
              return dateB - dateA
            })[0]
          
          if (lastAppointment) {
            const lastVisitDate = new Date(lastAppointment.appointmentDate || lastAppointment.createdAt)
            const today = new Date()
            const diffTime = today - lastVisitDate
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            setIsReturningPatient(diffDays <= 7)
            setLastVisitData({ daysSince: diffDays, isReturning: diffDays <= 7 })
          } else {
            setIsReturningPatient(false)
            setLastVisitData({ daysSince: null, isReturning: false })
          }
        }
      } catch (error) {
        console.error('Error checking returning patient:', error)
        setIsReturningPatient(false)
        setLastVisitData({ daysSince: null, isReturning: false })
      }
    }
    
    if (doctor) {
      checkIsReturningPatientAsync()
    }
  }, [doctor])

  // Synchronous helper function to check returning patient status
  const checkIsReturningPatient = (doctorId) => {
    if (!lastVisitData) {
      return { isReturning: false, daysSince: null }
    }
    return lastVisitData
  }

  // Get doctor profile data (session time and average consultation minutes)
  const getDoctorProfileData = () => {
    try {
      const profile = JSON.parse(localStorage.getItem('doctorProfile') || '{}')
      return {
        averageConsultationMinutes: profile.averageConsultationMinutes || 20,
        availability: profile.availability || [],
        sessionStartTime: profile.sessionStartTime || '09:00',
        sessionEndTime: profile.sessionEndTime || '17:00',
      }
    } catch (error) {
      console.error('Error getting doctor profile:', error)
      return {
        averageConsultationMinutes: 20,
        availability: [],
        sessionStartTime: '09:00',
        sessionEndTime: '17:00',
      }
    }
  }

  // Calculate max tokens based on session time and average consultation minutes
  const calculateMaxTokens = (sessionStartTime, sessionEndTime, averageMinutes) => {
    if (!sessionStartTime || !sessionEndTime || !averageMinutes) return 0
    
    const [startHour, startMin] = sessionStartTime.split(':').map(Number)
    const [endHour, endMin] = sessionEndTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    
    if (durationMinutes <= 0) return 0
    
    return Math.floor(durationMinutes / averageMinutes)
  }

  // Function to convert time string to minutes (handles both 12-hour and 24-hour formats)
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null
    
    // Handle 12-hour format (e.g., "9:00 AM", "2:30 PM")
    const pmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(PM|pm)/i)
    const amMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|am)/i)
    
    if (pmMatch) {
      let hour = parseInt(pmMatch[1], 10)
      const minute = parseInt(pmMatch[2], 10)
      if (hour !== 12) hour += 12
      return hour * 60 + minute
    }
    
    if (amMatch) {
      let hour = parseInt(amMatch[1], 10)
      const minute = parseInt(amMatch[2], 10)
      if (hour === 12) hour = 0
      return hour * 60 + minute
    }
    
    // Handle 24-hour format (e.g., "09:00", "14:30")
    const time24Match = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (time24Match) {
      const hour = parseInt(time24Match[1], 10)
      const minute = parseInt(time24Match[2], 10)
      return hour * 60 + minute
    }
    
    return null
  }

  // Function to convert minutes to 12-hour format string
  const minutesTo12Hour = (minutes) => {
    if (minutes === null || minutes === undefined) return ''
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const period = hour >= 12 ? 'PM' : 'AM'
    let displayHour = hour % 12
    if (displayHour === 0) displayHour = 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Function to generate time slots based on session times
  const generateTimeSlots = (sessionStartTime, sessionEndTime, avgConsultationMinutes, bookedSlots = 0, maxTokens = 0) => {
    if (!sessionStartTime || !sessionEndTime || !avgConsultationMinutes) return []
    
    const startMinutes = timeToMinutes(sessionStartTime)
    const endMinutes = timeToMinutes(sessionEndTime)
    
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) return []
    
    const slots = []
    let currentMinutes = startMinutes
    let slotNumber = 1
    
    while (currentMinutes < endMinutes) {
      const slotTime = minutesTo12Hour(currentMinutes)
      const isBooked = slotNumber <= bookedSlots
      const isAvailable = slotNumber <= maxTokens && !isBooked
      
      slots.push({
        time: slotTime,
        minutes: currentMinutes,
        slotNumber,
        isBooked,
        isAvailable,
      })
      
      currentMinutes += avgConsultationMinutes
      slotNumber++
    }
    
    return slots
  }

  // Function to get session info and token availability for selected date (using API cached data)
  const getSessionInfoForDate = (date) => {
    // Return cached slot availability if available
    if (slotAvailability[date]) {
      const info = slotAvailability[date]
      // If session is cancelled, mark as unavailable
      const isCancelled = info.isCancelled || false
      // Ensure we have valid data and calculate availability correctly
      const available = !isCancelled && info.available && (info.maxTokens > 0) && (info.currentBookings < info.maxTokens)
      return {
        available,
        maxTokens: info.maxTokens || 0,
        currentBookings: info.currentBookings || 0,
        nextToken: info.nextToken || (available ? (info.currentBookings + 1) : null),
        sessionId: info.sessionId || null,
        isCancelled: isCancelled,
        sessionStartTime: info.sessionStartTime || null,
        sessionEndTime: info.sessionEndTime || null,
        avgConsultationMinutes: info.avgConsultationMinutes || 20,
        isSessionEnded: info.isSessionEnded || false,
      }
    }
    
    // Fallback: return unavailable if not yet loaded
    return {
      available: false,
      maxTokens: 0,
      currentBookings: 0,
      nextToken: null,
      sessionId: null,
      isCancelled: false,
      sessionStartTime: null,
      sessionEndTime: null,
      avgConsultationMinutes: 20,
      isSessionEnded: false,
    }
  }

  // Function to check if session has ended for a given date
  const isSessionEndedForDate = (date) => {
    if (!date) return false
    
    // Check if date is today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let selectedDateObj
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number)
      selectedDateObj = new Date(year, month - 1, day, 0, 0, 0, 0)
    } else {
      selectedDateObj = new Date(date)
      selectedDateObj.setHours(0, 0, 0, 0)
    }
    
    // Only check for same day
    if (selectedDateObj.getTime() !== today.getTime()) {
      return false
    }
    
    // Get session info for the date
    const sessionInfo = getSessionInfoForDate(date)
    
    // Check if isSessionEnded flag is set (from API)
    if (sessionInfo.isSessionEnded) {
      return true
    }
    
    // Fallback: manually check if session end time has passed
    if (!sessionInfo.sessionEndTime) {
      return false
    }
    
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const sessionEndMinutes = timeToMinutes(sessionInfo.sessionEndTime)
    
    if (sessionEndMinutes === null) {
      return false
    }
    
    return currentMinutes >= sessionEndMinutes
  }

  useEffect(() => {
    if (showBookingModal) {
      // Set default date to tomorrow or today if available
      const dates = getAvailableDates()
      const tomorrow = dates.find((d) => d.isTomorrow)
      if (tomorrow) {
        setSelectedDate(tomorrow.value)
      }
    }
  }, [showBookingModal])

  useEffect(() => {
    if (showBookingModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showBookingModal])

  // Auto-open booking modal if 'book' or 'reschedule' query parameter is present
  useEffect(() => {
    if (doctor && id) {
      const rescheduleId = searchParams.get('reschedule')
      if (rescheduleId) {
        // Reschedule mode - fetch appointment details to get cancelled session date
        const fetchCancelledAppointmentDate = async () => {
          try {
            const appointmentsResponse = await getPatientAppointments({})
            if (appointmentsResponse.success && appointmentsResponse.data) {
              const appointments = Array.isArray(appointmentsResponse.data) 
                ? appointmentsResponse.data 
                : appointmentsResponse.data.items || []
              
              const appointment = appointments.find(apt => 
                (apt._id || apt.id) === rescheduleId && apt.status === 'cancelled'
              )
              
              if (appointment) {
                // Get the cancelled session date
                // Priority 1: Use sessionId.date if session exists (this is the actual cancelled session date)
                // Priority 2: Use appointment.appointmentDate (original appointment date)
                let dateToBlock = null
                
                // Check if sessionId exists and has date
                if (appointment.sessionId) {
                  const session = appointment.sessionId
                  // Session date is the actual date when session was cancelled
                  if (session && session.date) {
                    const sessionDate = typeof session.date === 'string' 
                      ? session.date.split('T')[0] 
                      : new Date(session.date).toISOString().split('T')[0]
                    dateToBlock = sessionDate
                    
                  }
                }
                
                // Fallback to appointment's original date if session date not found
                if (!dateToBlock) {
                  const originalDate = appointment.appointmentDate || appointment.date
                  if (originalDate) {
                    dateToBlock = typeof originalDate === 'string' 
                      ? originalDate.split('T')[0] 
                      : new Date(originalDate).toISOString().split('T')[0]
                    
                  }
                }
                
                if (dateToBlock) {
                  
                  setCancelledSessionDate(dateToBlock)
                } else {
                  console.warn('⚠️ Could not determine cancelled session date for appointment:', appointment)
                }
              } else {
                console.warn('⚠️ Cancelled appointment not found for rescheduleId:', rescheduleId)
              }
            }
          } catch (error) {
            console.error('Error fetching cancelled appointment date:', error)
          }
        }
        
        setIsRescheduling(true)
        setRescheduleAppointmentId(rescheduleId)
        setShowBookingModal(true)
        setBookingStep(1)
        fetchCancelledAppointmentDate()
        // Remove the query parameter from URL
        navigate(`/patient/doctors/${id}`, { replace: true })
      } else if (searchParams.get('book') === 'true') {
        // Normal booking mode
        setIsRescheduling(false)
        setRescheduleAppointmentId(null)
        setCancelledSessionDate(null)
        setShowBookingModal(true)
        setBookingStep(1)
        // Remove the query parameter from URL
        navigate(`/patient/doctors/${id}`, { replace: true })
      }
    }
  }, [doctor, searchParams, navigate, id])

  // Load patient prescriptions from API
  const [patientPrescriptions, setPatientPrescriptions] = useState([])
  
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await getPatientPrescriptions()
        if (response.success && response.data) {
          const prescriptionsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.prescriptions || []
          setPatientPrescriptions(prescriptionsData)
        }
      } catch (error) {
        console.error('Error loading patient prescriptions:', error)
        setPatientPrescriptions([])
      }
    }
    
    if (showBookingModal) {
      fetchPrescriptions()
    }
  }, [showBookingModal])

  // Slot availability state (cached by date)
  const [slotAvailability, setSlotAvailability] = useState({})
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Fetch slot availability for a specific date
  const fetchSlotAvailabilityForDate = useCallback(async (date, doctorId, forceRefresh = false) => {
    if (!date || !doctorId) return
    
    try {
      const response = await checkDoctorSlotAvailability(doctorId, date)
      if (response.success && response.data) {
        // Debug log to verify API response
        
        
        // If session is cancelled or completed, mark date as unavailable
        const isCancelled = response.data.isCancelled || false
        const isCompleted = response.data.isCompleted || false
        const isSessionEnded = response.data.isSessionEnded || false
        
        setSlotAvailability(prev => {
          // If forceRefresh is true, always update. Otherwise, don't overwrite if already cached
          if (!forceRefresh && prev[date]) return prev
          return {
            ...prev,
            [date]: {
              available: !isCancelled && !isCompleted && response.data.available, // Not available if cancelled or completed
              maxTokens: response.data.totalSlots || 0,
              currentBookings: response.data.bookedSlots || 0,
              nextToken: !isCancelled && !isCompleted && response.data.availableSlots > 0 ? (response.data.nextToken || null) : null,
              sessionId: response.data.sessionId,
              isCancelled: isCancelled, // Store cancelled flag
              isCompleted: isCompleted, // Store completed flag
              sessionStartTime: response.data.sessionStartTime, // Store session start time
              sessionEndTime: response.data.sessionEndTime, // Store session end time
              avgConsultationMinutes: response.data.avgConsultationMinutes || 20, // Store avg consultation minutes
              isSessionEnded: isSessionEnded, // Store session ended flag
            }
          }
        })
        
        // If cancelled, also set cancelledSessionDate for rescheduling
        if (isCancelled && isRescheduling) {
          const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0]
          setCancelledSessionDate(dateStr)
        }
      } else {
        setSlotAvailability(prev => {
          if (!forceRefresh && prev[date]) return prev
          return {
            ...prev,
              [date]: {
                available: false,
                maxTokens: 0,
                currentBookings: 0,
                nextToken: null,
                sessionId: null,
                sessionStartTime: null,
                sessionEndTime: null,
                avgConsultationMinutes: 20,
              }
          }
        })
      }
    } catch (error) {
      console.error(`Error fetching slot availability for ${date}:`, error)
      setSlotAvailability(prev => {
        if (!forceRefresh && prev[date]) return prev
        return {
          ...prev,
              [date]: {
                available: false,
                maxTokens: 0,
                currentBookings: 0,
                nextToken: null,
                sessionId: null,
                sessionStartTime: null,
                sessionEndTime: null,
                avgConsultationMinutes: 20,
              }
        }
      })
    }
  }, [])

  // Fetch slot availability for all dates when booking modal opens
  useEffect(() => {
    if (showBookingModal && doctor?._id) {
      const fetchAllDatesAvailability = async () => {
        setLoadingSlots(true)
        const dates = getAvailableDates()
        
        // Fetch availability for all dates in parallel (with limit to avoid too many requests)
        const datePromises = dates.slice(0, 14).map(date => 
          fetchSlotAvailabilityForDate(date.value, doctor._id)
        )
        
        try {
          await Promise.all(datePromises)
        } catch (error) {
          console.error('Error fetching dates availability:', error)
        } finally {
          setLoadingSlots(false)
        }
      }
      
      fetchAllDatesAvailability()
    }
  }, [showBookingModal, doctor?._id])

  // Also fetch when a date is selected (in case it wasn't loaded initially)
  useEffect(() => {
    if (selectedDate && doctor?._id && !slotAvailability[selectedDate]) {
      fetchSlotAvailabilityForDate(selectedDate, doctor._id)
    }
  }, [selectedDate, doctor?._id, slotAvailability, fetchSlotAvailabilityForDate])

  // Auto-switch from in_person to call if session has ended for selected date
  useEffect(() => {
    if (selectedDate && appointmentType === 'in_person' && bookingStep === 2) {
      const sessionEnded = isSessionEndedForDate(selectedDate)
      if (sessionEnded) {
        // Auto-switch to call when session has ended
        setAppointmentType('call')
        toast.info('Session time has ended. Switched to Call appointment type. In-person appointments are not available after session time ends.')
      }
    }
  }, [selectedDate, appointmentType, bookingStep, slotAvailability])

  // Time will be automatically assigned by backend - no need to track selectedTime

  const handleBookingClick = () => {
    setShowBookingModal(true)
    setBookingStep(1)
    setSelectedDate('')
    setAppointmentType('in_person')
    setReason('')
    setNotes('')
    setSelectedPrescriptions([])
  }

  const handleCloseModal = () => {
    setShowBookingModal(false)
    setBookingStep(1)
    setIsRescheduling(false)
    setRescheduleAppointmentId(null)
    setCancelledSessionDate(null)
    setSelectedDate('')
    // Time assignment is handled by backend
  }

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedDate) {
      // Check if booking is available for selected date
      const sessionInfo = getSessionInfoForDate(selectedDate)
      if (!sessionInfo.available) {
        toast.error('This date is fully booked. Please select another date.')
        return
      }
      // Check if time is selected (for rescheduling, time selection is required)
      // Time will be automatically assigned by backend based on token number and session time
      setBookingStep(2)
    } else if (bookingStep === 2) {
      // Validate that in-person appointments are not selected after session end time
      if (selectedDate && appointmentType === 'in_person' && isSessionEndedForDate(selectedDate)) {
        toast.error('In-person appointments cannot be booked after session time ends. Please select Call.')
        return
      }
      setBookingStep(3)
    }
  }

  const handlePreviousStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }

    setIsSubmitting(true)
    
    // Store appointmentId for potential cancellation if payment fails
    let createdAppointmentId = null
    
    try {
      // Handle reschedule (no payment required)
      if (isRescheduling && rescheduleAppointmentId) {
        // Time will be automatically assigned by backend based on token number and session time
        const rescheduleData = {
          appointmentDate: selectedDate,
          // time will be automatically assigned by backend
        }
        
        const rescheduleResponse = await rescheduleAppointment(rescheduleAppointmentId, rescheduleData)
        
        if (!rescheduleResponse.success) {
          toast.error(rescheduleResponse.message || 'Failed to reschedule appointment. Please try again.')
          setIsSubmitting(false)
          return
        }
        
        toast.success('Appointment rescheduled successfully!')
        
        // Refresh slot availability for both old and new dates
        if (selectedDate && doctor?.id) {
          fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
        }
        
        // Refresh all dates availability
        const dates = getAvailableDates()
        dates.slice(0, 14).forEach(date => {
          fetchSlotAvailabilityForDate(date.value, doctor.id, true)
        })
        
        handleCloseModal()
        // Reset form
        setSelectedDate('')
        // Time assignment is handled by backend
        setAppointmentType('in_person')
        setReason('')
        setNotes('')
        setSelectedPrescriptions([])
        setBookingStep(1)
        setIsRescheduling(false)
        setRescheduleAppointmentId(null)
        setIsSubmitting(false)
        
        // Emit custom event to refresh appointments with a slight delay to ensure backend has updated
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('appointmentBooked'))
        }, 500)
        
        setTimeout(() => {
          navigate('/patient/appointments')
        }, 1500)
        return
      }
      
      // Normal booking flow
      const returningPatientInfo = checkIsReturningPatient(doctor.id)
      const isFreeBooking = returningPatientInfo.isReturning
      
      // Map appointmentType to backend enum values: 'New' or 'Follow-up'
      let mappedAppointmentType = 'New'
      if (appointmentType === 'follow_up') {
        mappedAppointmentType = 'Follow-up'
      } else {
        mappedAppointmentType = 'New' // Both 'in_person' and 'call' map to 'New'
      }

      // Prepare appointment data for API
      const appointmentData = {
        doctorId: doctor.id || doctor._id,
        appointmentDate: selectedDate,
        time: '10:00 AM', // Backend will calculate based on token number
        reason: reason || 'Consultation',
        appointmentType: mappedAppointmentType, // Use mapped value
        consultationMode: appointmentType || 'in_person', // Send consultation mode (in_person or call)
      }

      // Step 1: Book appointment first (creates appointment with paymentStatus: 'pending')
      const bookingResponse = await bookAppointment(appointmentData)
      
      if (!bookingResponse.success) {
        toast.error(bookingResponse.message || 'Failed to book appointment. Please try again.')
        setIsSubmitting(false)
        return
      }

      const appointmentId = bookingResponse.data?._id || bookingResponse.data?.id
      createdAppointmentId = appointmentId

      // Step 2: Payment is always required (no free bookings)
      // All appointments require payment before confirmation

      // Step 3: Create payment order
      const paymentOrderResponse = await createAppointmentPaymentOrder(appointmentId)
      
      if (!paymentOrderResponse.success) {
        toast.error(paymentOrderResponse.message || 'Failed to create payment order. Please try again.')
        
        // Cancel the appointment if payment order creation failed
        if (createdAppointmentId) {
          try {
            await cancelAppointment(createdAppointmentId, 'Payment order creation failed')
            
            
            // Refresh slot availability
            if (selectedDate && doctor?.id) {
              fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
            }
          } catch (cancelError) {
            console.error('Error cancelling appointment after payment order failure:', cancelError)
          }
        }
        
        setIsSubmitting(false)
        return
      }

      const { orderId, amount, currency, razorpayKeyId } = paymentOrderResponse.data

      // Step 4: Initialize Razorpay payment
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.')
        
        // Cancel the appointment if Razorpay is not available
        if (createdAppointmentId) {
          try {
            await cancelAppointment(createdAppointmentId, 'Payment gateway not loaded')
            
            
            // Refresh slot availability
            if (selectedDate && doctor?.id) {
              fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
            }
          } catch (cancelError) {
            console.error('Error cancelling appointment:', cancelError)
          }
        }
        
        setIsSubmitting(false)
        return
      }

      if (!razorpayKeyId) {
        toast.error('Payment gateway not configured. Please contact support.')
        
        // Cancel the appointment if Razorpay key is not configured
        if (createdAppointmentId) {
          try {
            await cancelAppointment(createdAppointmentId, 'Payment gateway not configured')
            
            
            // Refresh slot availability
            if (selectedDate && doctor?.id) {
              fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
            }
          } catch (cancelError) {
            console.error('Error cancelling appointment:', cancelError)
          }
        }
        
        setIsSubmitting(false)
        return
      }

      const options = {
        key: razorpayKeyId, // Use key ID from backend response
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        name: 'Heallyn',
        description: `Appointment with ${doctor.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            setIsSubmitting(true) // Keep loading state during verification
            // Step 5: Verify payment
            const verifyResponse = await verifyAppointmentPayment(appointmentId, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              paymentMethod: 'razorpay',
            })

            if (verifyResponse.success) {
              toast.success('Payment successful! Appointment booked successfully!')
              
              // Refresh slot availability for the booked date
              if (selectedDate && doctor?.id) {
                fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
              }
              
              // Refresh all dates availability
              const dates = getAvailableDates()
              dates.slice(0, 14).forEach(date => {
                fetchSlotAvailabilityForDate(date.value, doctor.id, true)
              })
              
              // Close modal and reset form immediately
              handleCloseModal()
              setSelectedDate('')
              setAppointmentType('in_person')
              setReason('')
              setNotes('')
              setSelectedPrescriptions([])
              setBookingStep(1)
              setIsSubmitting(false)
              
              // Emit custom event to refresh dashboard and appointments
              window.dispatchEvent(new CustomEvent('appointmentBooked'))
              
              // Navigate after a short delay to show success message
              setTimeout(() => {
                navigate('/patient/appointments', { replace: true })
              }, 1000)
            } else {
              toast.error(verifyResponse.message || 'Payment verification failed. Please contact support.')
              setIsSubmitting(false)
              
              // Cancel appointment if payment verification failed
              if (appointmentId) {
                try {
                  await cancelAppointment(appointmentId, 'Payment verification failed')
                  
                  
                  // Refresh slot availability
                  if (selectedDate && doctor?.id) {
                    fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
                  }
                } catch (cancelError) {
                  console.error('Error cancelling appointment after verification failure:', cancelError)
                }
              }
            }
          } catch (error) {
            console.error('Error verifying payment:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed. Please contact support.'
            toast.error(errorMessage)
            setIsSubmitting(false)
            
            // Cancel appointment if payment verification error occurred
            if (appointmentId) {
              try {
                await cancelAppointment(appointmentId, `Payment verification error: ${errorMessage}`)
                
                
                // Refresh slot availability
                if (selectedDate && doctor?.id) {
                  fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
                }
              } catch (cancelError) {
                console.error('Error cancelling appointment after verification error:', cancelError)
              }
            }
          }
        },
        prefill: {
          name: patientProfile?.firstName && patientProfile?.lastName 
            ? `${patientProfile.firstName} ${patientProfile.lastName}` 
            : patientProfile?.name || '',
          email: patientProfile?.email || '',
          contact: patientProfile?.phone || '',
        },
        theme: {
          color: '#11496c',
        },
        modal: {
          ondismiss: async () => {
            setIsSubmitting(false)
            toast.info('Payment cancelled')
            
            // Cancel the appointment if payment was cancelled
            if (createdAppointmentId) {
              try {
                await cancelAppointment(createdAppointmentId, 'Payment cancelled by user')
                
                
                // Refresh slot availability
                if (selectedDate && doctor?.id) {
                  fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
                }
              } catch (error) {
                console.error('Error cancelling appointment after payment cancellation:', error)
                // Don't show error toast as user already cancelled
              }
            }
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      }

      const razorpay = new window.Razorpay(options)
      
      // Handle Razorpay errors
      razorpay.on('payment.failed', async (response) => {
        console.error('Razorpay payment failed:', response)
        setIsSubmitting(false)
        const errorMessage = response.error?.description || response.error?.reason || 'Payment failed. Please try again.'
        toast.error(errorMessage)
        
        // Cancel the appointment if payment failed
        if (createdAppointmentId) {
          try {
            await cancelAppointment(createdAppointmentId, `Payment failed: ${errorMessage}`)
            
            
            // Refresh slot availability
            if (selectedDate && doctor?.id) {
              fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
            }
          } catch (error) {
            console.error('Error cancelling appointment after payment failure:', error)
            // Don't show additional error toast
          }
        }
      })

      razorpay.on('payment.authorized', (response) => {
        
      })

      razorpay.open()
      
      // Handle Razorpay modal errors
      razorpay.on('error', async (error) => {
        console.error('Razorpay error:', error)
        setIsSubmitting(false)
        
        // Handle specific error types
        let errorMessage = 'Payment error. Please try again.'
        if (error.error?.code === 'BAD_REQUEST_ERROR') {
          errorMessage = 'Invalid payment request. Please try again.'
        } else if (error.error?.code === 'GATEWAY_ERROR') {
          errorMessage = 'Payment gateway error. Please try again later.'
        } else if (error.error?.code === 'SERVER_ERROR') {
          errorMessage = 'Payment server error. Please try again later or contact support.'
        } else {
          errorMessage = error.error?.description || error.error?.reason || 'Payment error. Please try again.'
        }
        toast.error(errorMessage)
        
        // Cancel the appointment if there was an error (but not if user just closed modal)
        // Only cancel if it's a critical error, not user cancellation
        if (createdAppointmentId && error.error?.code !== 'USER_CLOSED_MODAL') {
          try {
            await cancelAppointment(createdAppointmentId, `Payment error: ${errorMessage}`)
            
            
            // Refresh slot availability
            if (selectedDate && doctor?.id) {
              fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
            }
          } catch (cancelError) {
            console.error('Error cancelling appointment after payment error:', cancelError)
            // Don't show additional error toast
          }
        }
      })
      
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error(error.message || 'Failed to book appointment. Please try again.')
      setIsSubmitting(false)
      
      // Cancel appointment if it was created but booking process failed
      if (createdAppointmentId) {
        try {
          await cancelAppointment(createdAppointmentId, 'Booking process failed')
          
          
          // Refresh slot availability
          if (selectedDate && doctor?.id) {
            fetchSlotAvailabilityForDate(selectedDate, doctor.id, true)
          }
        } catch (cancelError) {
          console.error('Error cancelling appointment after booking error:', cancelError)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-semibold text-slate-700">Loading doctor details...</p>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-semibold text-slate-700">{error || 'Doctor not found'}</p>
        <button
          onClick={() => navigate('/patient/doctors')}
          className="rounded-lg bg-[#11496c] px-4 py-2 text-white font-semibold hover:bg-[#0d3a52]"
        >
          Back to Doctors
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="bg-[#f8fafc] min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#11496c] transition-colors mb-8 group"
        >
           <IoArrowBackOutline className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
           Back to Doctors
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           {/* Left Column: Doctor Info & About */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-slate-100">
                 <div className="flex flex-col md:flex-row gap-8">
                    <div className="relative shrink-0 mx-auto md:mx-0">
                       <img
                         src={doctor.image}
                         alt={doctor.name}
                         className="h-40 w-40 md:h-48 md:w-48 rounded-[40px] object-cover ring-8 ring-slate-50 shadow-xl"
                         loading="lazy"
                         onError={(e) => {
                           e.target.onerror = null
                           e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=11496c&color=fff&size=160&bold=true`
                         }}
                       />
                       <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white h-8 w-8 rounded-full shadow-lg"></div>
                    </div>

                    <div className="flex-1 space-y-6 text-center md:text-left">
                       <div className="space-y-2">
                          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{doctor.name}</h1>
                          <p className="text-lg font-bold text-[#11496c] uppercase tracking-wide">{doctor.specialty}</p>
                          <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                             <div className="flex items-center gap-1">{renderStars(doctor.rating)}</div>
                             <span className="text-sm font-black text-slate-900">{doctor.rating}</span>
                             <span className="text-sm text-slate-400 font-bold">({doctor.reviewCount} reviews)</span>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                             <p className="text-sm font-black text-slate-900">{doctor.experience}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Education</p>
                             <p className="text-sm font-black text-slate-900">{doctor.education}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 col-span-2 md:col-span-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Languages</p>
                             <p className="text-sm font-black text-slate-900">{doctor.languages.join(', ')}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-10 pt-10 border-t border-slate-100 space-y-4">
                    <h2 className="text-xl font-black text-slate-900">About Doctor</h2>
                    <p className="text-slate-600 leading-relaxed font-medium">
                       {doctor.about || 'Dr. ' + doctor.name + ' is a highly skilled specialist committed to providing exceptional care and medical expertise to patients.'}
                    </p>
                 </div>
              </div>

              {/* Clinic Info */}
              <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-slate-100 space-y-6">
                 <h2 className="text-xl font-black text-slate-900">Clinic Information</h2>
                 <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                       <div className="flex items-start gap-4">
                          <div className="p-3 bg-[#11496c]/5 rounded-2xl text-[#11496c] shrink-0">
                             <IoLocationOutline className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="font-black text-slate-900">{doctor.clinicName || 'Heallyn Partner Clinic'}</p>
                             <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">{doctor.location}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#11496c]/5 rounded-2xl text-[#11496c] shrink-0">
                             <IoTimeOutline className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="font-black text-slate-900">Availability</p>
                             <p className="text-sm text-slate-500 font-medium mt-1">{doctor.availability}</p>
                          </div>
                       </div>
                    </div>
                    <div className="w-full md:w-64 h-48 bg-slate-100 rounded-3xl overflow-hidden relative group cursor-pointer">
                       <img 
                         src="https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400" 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                         alt="Clinic Map" 
                       />
                       <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-bold shadow-lg">View on Map</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Actions Sidebar (Sticky on Desktop) */}
           <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 space-y-8">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Fee</p>
                    <p className="text-3xl font-black text-slate-900">₹{doctor.consultationFee}</p>
                 </div>

                 <div className="space-y-4">
                    <button
                      onClick={handleBookingClick}
                      className="w-full bg-[#11496c] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#11496c]/20 hover:bg-[#0d3a52] transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <IoCalendarOutline className="h-5 w-5" /> Book Appointment
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                       <button
                         onClick={() => doctor.phone && (window.location.href = `tel:${doctor.phone}`)}
                         className="flex items-center justify-center gap-2 py-4 border border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                       >
                          <IoCallOutline className="h-5 w-5 text-[#11496c]" /> Call
                       </button>
                       <button
                         className="flex items-center justify-center gap-2 py-4 border border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                       >
                          <IoVideocamOutline className="h-5 w-5 text-[#11496c]" /> Video
                       </button>
                    </div>
                 </div>

                 {doctor.nextSlot && (
                    <div className="rounded-3xl p-5 bg-emerald-50 border border-emerald-100">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Next Available Slot</p>
                       </div>
                       <p className="text-sm font-black text-emerald-900">{doctor.nextSlot}</p>
                    </div>
                 )}

                 <div className="pt-6 border-t border-slate-50 space-y-4">
                    <div className="flex items-center gap-3 text-slate-500">
                       <IoCheckmarkCircle className="h-5 w-5 text-emerald-500" />
                       <span className="text-xs font-bold italic">100% Verified Specialist</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                       <IoCheckmarkCircle className="h-5 w-5 text-emerald-500" />
                       <span className="text-xs font-bold italic">Instant Confirmation</span>
                    </div>
                 </div>
              </div>

              {/* Promo Card */}
              <div className="bg-gradient-to-br from-[#11496c] to-[#0d3a52] rounded-[40px] p-8 text-white relative overflow-hidden shadow-lg shadow-[#11496c]/10">
                 <div className="relative z-10 space-y-4">
                    <h3 className="text-lg font-black leading-tight">Get 20% OFF on your first booking</h3>
                    <p className="text-xs text-white/70 font-medium">Use code: HEAL20 at checkout</p>
                    <button className="bg-white text-[#11496c] px-4 py-2 rounded-xl text-xs font-black shadow-lg">Copy Code</button>
                 </div>
                 <IoPulseOutline className="absolute -bottom-4 -right-4 h-24 w-24 text-white/5 rotate-12" />
              </div>
           </div>
        </div>
      </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
                </h2>
                <p className="text-sm text-slate-600">{doctor.name} - {doctor.specialty}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                      bookingStep >= step
                        ? 'bg-[#11496c] text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {bookingStep > step ? <IoCheckmarkCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-1 w-12 transition ${
                        bookingStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Date Selection */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Select Date</h3>
                    <p className="mb-4 text-sm text-slate-600">
                      Select your preferred date. The system will automatically assign you a time slot based on availability.
                    </p>
                    
                    <div className="mb-6">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 p-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
                        <div className="flex gap-2">
                          {availableDates.map((date) => {
                            const sessionInfo = getSessionInfoForDate(date.value)
                            const slotInfo = slotAvailability[date.value] || {}
                            const isSessionCancelled = slotInfo.isCancelled || sessionInfo.isCancelled || false
                            
                            const isFull = !sessionInfo.available || (sessionInfo.maxTokens > 0 && sessionInfo.currentBookings >= sessionInfo.maxTokens)
                            const slotsRemaining = sessionInfo.maxTokens > 0 
                              ? Math.max(0, sessionInfo.maxTokens - sessionInfo.currentBookings)
                              : 0
                            const hasSlots = slotsRemaining > 0 && sessionInfo.maxTokens > 0
                            
                            // Check if this is the cancelled session date (when rescheduling)
                            // Normalize both dates to YYYY-MM-DD format for comparison
                            const normalizeDate = (dateStr) => {
                              if (!dateStr) return null
                              if (typeof dateStr === 'string') {
                                return dateStr.split('T')[0] // Get YYYY-MM-DD part
                              }
                              return new Date(dateStr).toISOString().split('T')[0]
                            }
                            
                            const normalizedCurrentDate = normalizeDate(date.value)
                            const normalizedCancelledDate = normalizeDate(cancelledSessionDate)
                            const isCancelledSessionDate = isRescheduling && 
                              cancelledSessionDate && 
                              normalizedCurrentDate && 
                              normalizedCancelledDate &&
                              normalizedCurrentDate === normalizedCancelledDate
                            
                            // Disable if full, cancelled session date, or session is cancelled
                            const isDisabled = isFull || isCancelledSessionDate || isSessionCancelled
                            
                            // Debug log for cancelled date check (only in development)
                            if (isRescheduling && cancelledSessionDate && process.env.NODE_ENV === 'development') {
                              
                            }
                            
                            return (
                              <button
                                key={date.value}
                                type="button"
                                onClick={() => {
                                  if (!isDisabled) {
                                    setSelectedDate(date.value)
                                    // Fetch fresh data when date is selected
                                    if (doctor?._id && (!slotAvailability[date.value] || loadingSlots)) {
                                      fetchSlotAvailabilityForDate(date.value, doctor._id, true)
                                    }
                                  } else if (isCancelledSessionDate || isSessionCancelled) {
                                    toast.warning('This date is not available because the session was cancelled on this date. Please select a different date.')
                                  }
                                }}
                                disabled={isDisabled}
                                className={`shrink-0 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                                  isDisabled
                                    ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                                    : selectedDate === date.value
                                    ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)] text-[#0d3a52]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                                title={(isCancelledSessionDate || isSessionCancelled) ? 'Session was cancelled on this date. Please select a different date.' : isFull ? 'Fully booked' : ''}
                              >
                                <div className="text-xs text-slate-500">{date.label.split(',')[0]}</div>
                                <div className="mt-1 whitespace-nowrap">{date.label.split(',')[1]?.trim()}</div>
                                {loadingSlots && !slotAvailability[date.value] ? (
                                  <div className="mt-1 text-[10px] text-slate-400 font-semibold">Loading...</div>
                                ) : (isCancelledSessionDate || isSessionCancelled) ? (
                                  <div className="mt-1 text-[10px] text-red-600 font-semibold">Cancelled</div>
                                ) : isFull ? (
                                  <div className="mt-1 text-[10px] text-red-500 font-semibold">Full</div>
                                ) : hasSlots && slotsRemaining > 0 ? (
                                  <div className="mt-1 text-[10px] text-emerald-600 font-semibold">
                                    {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''}
                                  </div>
                                ) : sessionInfo.maxTokens > 0 ? (
                                  <div className="mt-1 text-[10px] text-slate-500 font-semibold">
                                    {sessionInfo.maxTokens} slots
                                  </div>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Token and Availability Info */}
                    {selectedDate && (() => {
                      const sessionInfo = getSessionInfoForDate(selectedDate)
                      const returningPatientInfo = checkIsReturningPatient(doctor.id)
                      const isFreeBooking = returningPatientInfo.isReturning
                      
                      if (!sessionInfo.available && sessionInfo.maxTokens === 0) {
                        return (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-medium text-amber-800">
                              No session available for this date. Please select another date.
                            </p>
                          </div>
                        )
                      }
                      if (!sessionInfo.available) {
                        return (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-800">
                              This date is fully booked. Please select another date.
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Current bookings: {sessionInfo.currentBookings} / {sessionInfo.maxTokens}
                            </p>
                          </div>
                        )
                      }
                      return (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-emerald-900">
                                  Your Token Number: <span className="text-lg">{sessionInfo.nextToken}</span>
                                </p>
                                <p className="text-xs text-emerald-700 mt-1">
                                  {sessionInfo.currentBookings} of {sessionInfo.maxTokens} slots booked
                                </p>
                                <p className="text-xs text-emerald-600 mt-1">
                                  {sessionInfo.maxTokens - sessionInfo.currentBookings} slot(s) remaining
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-emerald-700">{sessionInfo.nextToken}</div>
                                <div className="text-[10px] text-emerald-600">Token</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Returning Patient Info */}
                          {false && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                              <div className="flex items-start gap-2">
                                <IoCheckmarkCircleOutline className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-blue-900">
                                    Returning Patient Benefit
                                  </p>
                                  <p className="text-xs text-blue-700 mt-1">
                                    You visited this doctor {returningPatientInfo.daysSince} day(s) ago. This appointment will be FREE!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Time will be automatically assigned by backend based on token number and session time */}
                          {isRescheduling && (
                            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/80 p-3">
                              <p className="text-xs text-blue-700">
                                <IoInformationCircleOutline className="inline h-4 w-4 mr-1" />
                                Your appointment time will be automatically assigned based on your token number and session availability.
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Step 2: Appointment Details */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Appointment Details</h3>
                    
                    <div className="mb-6">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Appointment Type</label>
                      {(() => {
                        const sessionEnded = selectedDate ? isSessionEndedForDate(selectedDate) : false
                        const supportedModes = doctor.originalData?.consultationModes || ['in_person', 'call']
                        
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {['in_person', 'call', 'audio', 'chat', 'video'].map((mode) => {
                              const isSupported = supportedModes.includes(mode)
                              if (!isSupported) return null
                              
                              const isDisableMode = mode === 'in_person' && sessionEnded
                              
                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => {
                                    if (!isDisableMode) {
                                      setAppointmentType(mode)
                                    } else {
                                      toast.warning('In-person appointments cannot be booked after session time ends. Please select another mode.')
                                    }
                                  }}
                                  disabled={isDisableMode}
                                  className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition ${
                                    isDisableMode
                                      ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                                      : appointmentType === mode
                                      ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                  title={isDisableMode ? 'In-person appointments cannot be booked after session time ends.' : ''}
                                >
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                                    isDisableMode
                                      ? 'bg-slate-200 text-slate-400'
                                      : appointmentType === mode 
                                      ? 'bg-[#11496c] text-white' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {mode === 'in_person' ? (
                                      <IoPersonOutline className="h-4 w-4" />
                                    ) : mode === 'call' || mode === 'audio' ? (
                                      <IoCallOutline className="h-4 w-4" />
                                    ) : mode === 'chat' ? (
                                      <IoMailOutline className="h-4 w-4" />
                                    ) : (
                                      <IoVideocamOutline className="h-4 w-4" />
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-semibold truncate ${isDisableMode ? 'text-slate-500' : 'text-slate-900'}`}>
                                    {mode === 'in_person' ? 'In-Person' : mode === 'video' ? 'Video' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}
                      {selectedDate && isSessionEndedForDate(selectedDate) && (
                        <p className="mt-2 text-xs text-amber-600">
                          <IoInformationCircleOutline className="inline h-3 w-3 mr-1" />
                          Session time has ended. In-person appointments are not available.
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-slate-700">
                        Reason for Visit
                      </label>
                      <input
                        id="reason"
                        type="text"
                        placeholder="e.g., General checkup, Follow-up, Consultation"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-700">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        rows={4}
                        placeholder="Any additional information you'd like to share..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                      />
                    </div>

                    {/* Share Prescriptions Section */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-700">
                        Share Previous Prescriptions (Optional)
                      </label>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-3 text-xs text-slate-600">
                          Select prescriptions from other doctors to share with {doctor.name}
                        </p>
                        {patientPrescriptions.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No previous prescriptions available</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {patientPrescriptions.map((prescription) => {
                              const prescriptionId = prescription._id || prescription.id
                              return (
                              <label
                                key={prescriptionId}
                                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-[#11496c]/30 transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPrescriptions.includes(prescriptionId)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPrescriptions([...selectedPrescriptions, prescriptionId])
                                    } else {
                                      setSelectedPrescriptions(selectedPrescriptions.filter((id) => id !== prescriptionId))
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {prescription.doctor?.name || 'Previous Doctor'}
                                      </p>
                                      <p className="text-xs text-slate-600">
                                        {prescription.doctor?.specialty || 'General'} • {prescription.diagnosis || 'Consultation'}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        {prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        }) : 'Date not available'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {bookingStep === 3 && (() => {
                const sessionInfo = getSessionInfoForDate(selectedDate)
                const returningPatientInfo = checkIsReturningPatient(doctor.id)
                const isFreeBooking = returningPatientInfo.isReturning
                
                return (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)]">
                        <IoCheckmarkCircle className="h-10 w-10 text-[#11496c]" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-slate-900">
                        {isRescheduling ? 'Reschedule Your Appointment' : 'Confirm Your Appointment'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {isRescheduling ? 'Please review your rescheduled appointment details' : 'Please review your appointment details'}
                      </p>
                    </div>
                    
                    {/* Rescheduling Notice */}
                    {isRescheduling && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2">
                          <IoInformationCircleOutline className="h-5 w-5 text-blue-600" />
                          <p className="text-sm font-semibold text-blue-900">
                            Rescheduling Appointment
                          </p>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Your previous appointment will be cancelled and a new appointment will be created for the selected date. No additional payment is required.
                        </p>
                      </div>
                    )}


                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{doctor.name}</h4>
                            <p className="text-sm text-slate-600">{doctor.specialty}</p>
                            <p className="mt-1 text-sm text-slate-500">{doctor.location}</p>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Date</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {selectedDate
                                ? new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Time</span>
                            <span className="text-sm font-semibold text-slate-900">
                              Will be assigned by system based on token number
                            </span>
                          </div>
                          {sessionInfo.nextToken && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">Token Number</span>
                              <span className="text-lg font-bold text-[#11496c]">
                                #{sessionInfo.nextToken}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Type</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {appointmentType === 'call' ? 'Call' : 'In-Person'}
                            </span>
                          </div>
                          {reason && (
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-slate-600">Reason</span>
                              <span className="text-right text-sm font-semibold text-slate-900">{reason}</span>
                            </div>
                          )}
                          {selectedPrescriptions.length > 0 && (
                            <div className="flex items-start justify-between border-t border-slate-200 pt-3">
                              <span className="text-sm text-slate-600">Shared Prescriptions</span>
                              <span className="text-right text-sm font-semibold text-slate-900">
                                {selectedPrescriptions.length} prescription(s)
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-base font-semibold text-slate-900">Consultation Fee</span>
                            {isRescheduling ? (
                              <div className="text-right">
                                <span className="text-lg font-bold text-blue-600">Already Paid</span>
                                <p className="text-xs text-slate-500">No additional payment required</p>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-slate-900">₹{doctor.consultationFee}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                {bookingStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                )}
                {bookingStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={bookingStep === 1 && (!selectedDate || !getSessionInfoForDate(selectedDate).available)}
                    className="flex-1 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  (() => {
                    const returningPatientInfo = checkIsReturningPatient(doctor.id)
                    const isFreeBooking = returningPatientInfo.isReturning
                    
                    return (
                      <button
                        type="button"
                        onClick={handleConfirmBooking}
                        disabled={isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isRescheduling
                            ? 'bg-blue-500 shadow-blue-400/40 hover:bg-blue-600'
                            : isFreeBooking
                            ? 'bg-emerald-500 shadow-emerald-400/40 hover:bg-emerald-600'
                            : 'bg-emerald-500 shadow-emerald-400/40 hover:bg-emerald-600'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {isRescheduling ? 'Rescheduling...' : 'Confirming...'}
                          </>
                        ) : isRescheduling ? (
                          <>
                            <IoCheckmarkCircleOutline className="h-5 w-5" />
                            Reschedule
                          </>
                        ) : (
                          <>
                            <IoCardOutline className="h-5 w-5" />
                            Confirm & Pay
                          </>
                        )}
                      </button>
                    )
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Rating Modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReviewModal(false)
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rate & Review</h2>
                <p className="text-sm text-slate-600">{doctor.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Rating Selection */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    Your Rating
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform active:scale-95"
                      >
                        {star <= reviewRating ? (
                          <IoStar className="h-8 w-8 text-amber-400" />
                        ) : (
                          <IoStarOutline className="h-8 w-8 text-slate-300" />
                        )}
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && (
                    <p className="mt-2 text-center text-sm text-slate-600">
                      {reviewRating === 1 && 'Poor'}
                      {reviewRating === 2 && 'Fair'}
                      {reviewRating === 3 && 'Good'}
                      {reviewRating === 4 && 'Very Good'}
                      {reviewRating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Review Comment */}
                <div>
                  <label htmlFor="reviewComment" className="mb-2 block text-sm font-semibold text-slate-700">
                    Your Review (Optional)
                  </label>
                  <textarea
                    id="reviewComment"
                    rows={4}
                    placeholder="Share your experience with this doctor..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false)
                    setReviewRating(0)
                    setReviewComment('')
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (reviewRating === 0) {
                      toast.error('Please select a rating')
                      return
                    }
                    
                    setIsSubmittingReview(true)
                    
                    try {
                      const reviewData = {
                        doctorId: doctor.id,
                        rating: reviewRating,
                        comment: reviewComment || '',
                      }
                      
                      // Try to find a completed appointment with this doctor
                      try {
                        const appointmentsResponse = await getPatientAppointments({ 
                          doctor: doctor.id, 
                          status: 'completed' 
                        })
                        const completedAppointments = appointmentsResponse.data?.items || appointmentsResponse.data || []
                        if (completedAppointments.length > 0) {
                          // Use the most recent completed appointment
                          reviewData.appointmentId = completedAppointments[0]._id || completedAppointments[0].id
                        }
                      } catch (apptError) {
                        
                      }
                      
                      const response = await submitReview(reviewData)
                      
                      if (response.success) {
                        toast.success('Thank you for your review!')
                        setShowReviewModal(false)
                        setReviewRating(0)
                        setReviewComment('')
                        
                        // Refresh doctor data to show updated rating
                        try {
                          const updatedDoctor = await getDoctorById(doctor.id)
                          if (updatedDoctor.success && updatedDoctor.data) {
                            setDoctor(prevDoctor => ({
                              ...prevDoctor,
                              rating: updatedDoctor.data.reviewStats?.averageRating || updatedDoctor.data.doctor?.rating || prevDoctor.rating,
                              reviewCount: updatedDoctor.data.reviewStats?.totalReviews || updatedDoctor.data.doctor?.reviewCount || prevDoctor.reviewCount,
                            }))
                          }
                        } catch (refreshError) {
                          console.error('Error refreshing doctor data:', refreshError)
                        }
                      } else {
                        toast.error(response.message || 'Failed to submit review. Please try again.')
                      }
                    } catch (error) {
                      console.error('Error submitting review:', error)
                      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit review. Please try again.'
                      toast.error(errorMessage)
                    } finally {
                      setIsSubmittingReview(false)
                    }
                  }}
                  disabled={isSubmittingReview || reviewRating === 0}
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PatientDoctorDetails

