import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import { getDoctorDashboard, getDoctorAppointments, getDoctorQueue, getDoctorConsultations, getDoctorProfile, getDoctorWalletBalance, getPatientById, getConsultationById } from '../doctor-services/doctorService'
import NotificationBell from '../../../components/NotificationBell'
import {
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoStarOutline,
  IoCheckmarkCircleOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoChatbubbleOutline,
  IoHelpCircleOutline,
  IoSearchOutline,
  IoPhonePortraitOutline,
  IoMailOutline,
  IoVideocamOutline,
  IoCallOutline,
} from 'react-icons/io5'

// Default stats (will be replaced by API data)
const defaultStats = {
  totalPatients: 0,
  totalConsultations: 0,
  todayAppointments: 0,
  totalEarnings: 0,
  pendingConsultations: 0,
  averageRating: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  thisMonthConsultations: 0,
  lastMonthConsultations: 0,
}

// Helper function to get today's date string in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mock data removed - using API data now

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
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

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [appointmentStatistics, setAppointmentStatistics] = useState(null) // Statistics from backend
  const [recentConsultations, setRecentConsultations] = useState([])
  const [stats, setStats] = useState(defaultStats)
  const [loading, setLoading] = useState(false) // Start with false to show content immediately
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  // Fetch profile and dashboard data in parallel for faster loading
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch profile and dashboard in parallel
        const [profileResponse, dashboardResponse] = await Promise.allSettled([
          getDoctorProfile().catch(() => ({ success: false })),
          getDoctorDashboard()
        ])

        // Handle profile response (non-critical, don't block UI)
        if (profileResponse.status === 'fulfilled' && profileResponse.value.success && profileResponse.value.data) {
          const doctor = profileResponse.value.data.doctor || profileResponse.value.data
          setProfile({
            firstName: doctor.firstName || '',
            lastName: doctor.lastName || '',
            clinicName: doctor.clinicDetails?.name || '',
            clinicAddress: doctor.clinicDetails?.address || {},
            isActive: doctor.isActive !== undefined ? doctor.isActive : true,
          })
        }

        // Handle dashboard response
        const response = dashboardResponse.status === 'fulfilled' ? dashboardResponse.value : null
        
         // Debug log
        
        if (response && response.success && response.data) {
          const data = response.data
           // Debug log
          
          const statsUpdate = {
            totalPatients: Number(data.totalPatients || 0),
            totalConsultations: Number(data.totalConsultations || 0),
            todayAppointments: Number(data.todayAppointments || 0),
            totalEarnings: Number(data.totalEarnings || 0),
            pendingConsultations: Number(data.pendingConsultations || 0),
            averageRating: Number(data.averageRating || 0),
            thisMonthEarnings: Number(data.thisMonthEarnings || 0),
            lastMonthEarnings: Number(data.lastMonthEarnings || 0),
            thisMonthConsultations: Number(data.thisMonthConsultations || 0),
            lastMonthConsultations: Number(data.lastMonthConsultations || 0),
          }
          
           // Debug log
          setStats(statsUpdate)
        } else {
          console.error('❌ Dashboard API response error:', response) // Debug log
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Listen for appointment booking event to refresh dashboard
    const handleAppointmentBooked = () => {
      fetchDashboardData()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast])

  const earningsChange = stats.lastMonthEarnings > 0 
    ? ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings) * 100 
    : 0
  const consultationsChange = stats.lastMonthConsultations > 0
    ? ((stats.thisMonthConsultations - stats.lastMonthConsultations) / stats.lastMonthConsultations) * 100
    : 0

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await getDoctorAppointments()
        
        if (response.success && response.data) {
          // Store statistics from backend if available
          if (response.data.statistics) {
            setAppointmentStatistics(response.data.statistics)
          }
          
          // Handle both array and object with items/appointments property
          const appointmentsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.appointments || []
          
          // Transform API data to match component structure
          const transformed = appointmentsData.map(apt => ({
            rescheduledAt: apt.rescheduledAt,
            isRescheduled: !!apt.rescheduledAt,
            id: apt._id || apt.id,
            patientId: apt.patientId?._id || apt.patientId || 'pat-unknown',
            patientName: apt.patientId?.firstName && apt.patientId?.lastName
              ? `${apt.patientId.firstName} ${apt.patientId.lastName}`
              : apt.patientId?.name || apt.patientName || 'Unknown Patient',
            patientImage: apt.patientId?.profileImage || apt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientId?.firstName || apt.patientName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            date: apt.appointmentDate || apt.date || getTodayDateString(),
            time: apt.time || apt.slotTime || '10:00 AM',
            type: apt.appointmentType || apt.type || 'In-person',
            status: apt.status || 'scheduled',
            duration: apt.duration || '30 min',
            reason: apt.reason || apt.consultationReason || 'Consultation',
            appointmentType: apt.appointmentType || 'New',
            consultationMode: apt.consultationMode || 'in_person',
            patientPhone: apt.patientId?.phone || apt.patientPhone || '',
            patientEmail: apt.patientId?.email || apt.patientEmail || '',
            patientAddress: apt.patientId?.address 
              ? [
                  apt.patientId.address.line1,
                  apt.patientId.address.line2,
                  apt.patientId.address.city,
                  apt.patientId.address.state,
                  apt.patientId.address.postalCode,
                  apt.patientId.address.country
                ].filter(Boolean).join(', ').trim() || 'Not provided'
              : apt.patientAddress || 'Not provided',
            age: (() => {
              if (apt.patientId?.dateOfBirth) {
                const birthDate = new Date(apt.patientId.dateOfBirth)
                if (!isNaN(birthDate.getTime())) {
                  const today = new Date()
                  let age = today.getFullYear() - birthDate.getFullYear()
                  const monthDiff = today.getMonth() - birthDate.getMonth()
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--
                  }
                  return age
                }
              }
              return apt.patientId?.age || apt.age || null
            })(),
            gender: apt.patientId?.gender || apt.gender || '',
            originalData: apt,
          }))
          
          setAppointments(transformed)
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
        setError(err.message || 'Failed to load appointments')
        // Don't show toast here as it's not critical
      }
    }
    
    fetchAppointments()
    
    // Listen for appointment booking event to refresh appointments
    const handleAppointmentBooked = () => {
      fetchAppointments()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    // Refresh every 30 seconds to get new appointments
    const interval = setInterval(fetchAppointments, 30000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [])

  // Fetch recent consultations from API
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await getDoctorConsultations({ limit: 8, sort: '-createdAt' })
        
        if (response.success && response.data) {
          const consultationsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.consultations || []
          
          // Transform API data to match component structure
          const transformed = consultationsData.map(cons => ({
            id: cons._id || cons.id,
            patientName: cons.patientId?.firstName && cons.patientId?.lastName
              ? `${cons.patientId.firstName} ${cons.patientId.lastName}`
              : cons.patientId?.name || cons.patientName || 'Unknown Patient',
            patientImage: cons.patientId?.profileImage || cons.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(cons.patientId?.firstName || cons.patientName || 'Patient')}&background=3b82f6&color=fff&size=128`,
            date: cons.consultationDate || cons.date || new Date().toISOString().split('T')[0],
            time: cons.time || cons.slotTime || '10:00 AM',
            type: cons.consultationType || cons.type || 'In-person',
            status: cons.status || 'pending',
            consultationMode: cons.appointmentId?.consultationMode || cons.consultationMode || 'in_person',
            fee: cons.fee || cons.consultationFee || 0,
            notes: cons.notes || cons.summary || '',
          }))
          
          setRecentConsultations(transformed)
        }
      } catch (err) {
        console.error('Error fetching consultations:', err)
        // Don't show error toast as it's not critical
      }
    }
    
    fetchConsultations()
  }, [])

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateValue) => {
    if (!dateValue) return null
    if (typeof dateValue === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue
      }
      // Otherwise parse it
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return null
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) return null
      const year = dateValue.getFullYear()
      const month = String(dateValue.getMonth() + 1).padStart(2, '0')
      const day = String(dateValue.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return null
  }

  // Calculate appointment counts - use backend statistics if available
  const appointmentStats = useMemo(() => {
    // If backend statistics are available, use them
    if (appointmentStatistics) {
      const todayScheduled = appointmentStatistics.today?.scheduled || 0
      const todayRescheduled = appointmentStatistics.today?.rescheduled || 0
      const monthScheduled = appointmentStatistics.monthly?.scheduled || 0
      const monthRescheduled = appointmentStatistics.monthly?.rescheduled || 0
      const yearScheduled = appointmentStatistics.yearly?.scheduled || 0
      const yearRescheduled = appointmentStatistics.yearly?.rescheduled || 0
      
      return {
        todayCount: appointmentStatistics.today?.total || (todayScheduled + todayRescheduled),
        todayScheduled: todayScheduled,
        todayRescheduled: todayRescheduled,
        monthCount: appointmentStatistics.monthly?.total || (monthScheduled + monthRescheduled),
        monthScheduled: monthScheduled,
        monthRescheduled: monthRescheduled,
        yearCount: appointmentStatistics.yearly?.total || (yearScheduled + yearRescheduled),
        yearScheduled: yearScheduled,
        yearRescheduled: yearRescheduled,
      }
    }
    
    // Fallback: calculate from appointments (client-side)
    const today = getTodayDateString()
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    
    // Current month start and end
    const currentMonthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
    const currentMonthEnd = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)
    currentMonthEnd.setHours(23, 59, 59, 999)
    
    // Current year start and end
    const currentYearStart = new Date(todayDate.getFullYear(), 0, 1)
    const currentYearEnd = new Date(todayDate.getFullYear(), 11, 31)
    currentYearEnd.setHours(23, 59, 59, 999)
    
    let todayCount = 0
    let todayScheduled = 0
    let todayRescheduled = 0
    let monthCount = 0
    let monthScheduled = 0
    let monthRescheduled = 0
    let yearCount = 0
    let yearScheduled = 0
    let yearRescheduled = 0
    
    appointments.forEach(apt => {
      // Try both date and appointmentDate fields
      const dateStr = normalizeDate(apt.date || apt.appointmentDate)
      if (!dateStr) return
      
      const aptDate = new Date(dateStr)
      if (isNaN(aptDate.getTime())) return
      
      aptDate.setHours(0, 0, 0, 0)
      const isRescheduled = apt.isRescheduled || apt.rescheduledAt
      
      // Today count - compare normalized date strings
      if (dateStr === today || aptDate.getTime() === todayDate.getTime()) {
        todayCount++
        if (isRescheduled) {
          todayRescheduled++
        } else {
          todayScheduled++
        }
      }
      
      // Month count
      if (aptDate >= currentMonthStart && aptDate <= currentMonthEnd) {
        monthCount++
        if (isRescheduled) {
          monthRescheduled++
        } else {
          monthScheduled++
        }
      }
      
      // Year count
      if (aptDate >= currentYearStart && aptDate <= currentYearEnd) {
        yearCount++
        if (isRescheduled) {
          yearRescheduled++
        } else {
          yearScheduled++
        }
      }
    })
    
    // Always use the sum of scheduled and rescheduled for total counts
    const finalTodayCount = todayScheduled + todayRescheduled
    const finalMonthCount = monthScheduled + monthRescheduled
    const finalYearCount = yearScheduled + yearRescheduled
    
    return { 
      todayCount: finalTodayCount, 
      todayScheduled, 
      todayRescheduled,
      monthCount: finalMonthCount, 
      monthScheduled,
      monthRescheduled,
      yearCount: finalYearCount,
      yearScheduled,
      yearRescheduled,
    }
  }, [appointmentStatistics, appointments])

  // Filter today's appointments dynamically
  const todayAppointments = useMemo(() => {
    const today = getTodayDateString()
    return appointments.filter((apt) => {
      // Exclude pending payment appointments - only show paid appointments
      const paymentStatus = apt.paymentStatus || apt.originalData?.paymentStatus
      if (paymentStatus === 'pending') {
        return false
      }
      
      // Try both date and appointmentDate fields
      const dateStr = normalizeDate(apt.date || apt.appointmentDate)
      if (!dateStr) return false
      
      // Compare normalized date strings
      if (dateStr === today) return true
      
      // Also compare as Date objects for safety
      const aptDate = new Date(dateStr)
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() === todayDate.getTime()
    }).sort((a, b) => {
      // Sort by time
      const timeA = a.time || '00:00'
      const timeB = b.time || '00:00'
      return timeA.localeCompare(timeB)
    })
  }, [appointments])

  // Sidebar navigation items
  const sidebarNavItems = [
    { id: 'home', label: 'Dashboard', to: '/doctor/dashboard', Icon: IoHomeOutline },
    { id: 'consultations', label: 'Consultations', to: '/doctor/consultations', Icon: IoDocumentTextOutline },
    { id: 'patients', label: 'Patients', to: '/doctor/patients', Icon: IoPeopleOutline },
    { id: 'wallet', label: 'Wallet', to: '/doctor/wallet', Icon: IoWalletOutline },
    { id: 'support', label: 'Support', to: '/doctor/support', Icon: IoHelpCircleOutline },
    { id: 'profile', label: 'Profile', to: '/doctor/profile', Icon: IoPersonCircleOutline },
  ]

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutDoctor } = await import('../doctor-services/doctorService')
      await logoutDoctor()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearDoctorTokens } = await import('../doctor-services/doctorService')
      clearDoctorTokens()
      toast.success('Logged out successfully')
    }
    // Force navigation to login page - full page reload to clear all state
    setTimeout(() => {
      window.location.href = '/login?type=doctor'
    }, 500)
  }

  const handleViewAppointment = async (appointment) => {
    try {
      // First, try to find existing consultation for this appointment
      const consultationsResponse = await getDoctorConsultations()
      let existingConsultation = null
      
      if (consultationsResponse.success && consultationsResponse.data) {
        const consultations = Array.isArray(consultationsResponse.data)
          ? consultationsResponse.data
          : consultationsResponse.data.items || consultationsResponse.data.consultations || []
        
        // Find consultation by appointmentId
        existingConsultation = consultations.find(cons => 
          cons.appointmentId?._id?.toString() === appointment.id?.toString() ||
          cons.appointmentId?.id?.toString() === appointment.id?.toString() ||
          cons.appointmentId?.toString() === appointment.id?.toString()
        )
      }
      
      // If consultation exists, fetch full consultation data
      if (existingConsultation) {
        try {
          const consultationResponse = await getConsultationById(existingConsultation._id || existingConsultation.id)
          if (consultationResponse.success && consultationResponse.data) {
    navigate('/doctor/consultations', {
      state: {
                selectedConsultation: consultationResponse.data,
                loadSavedData: true,
              },
            })
            return
          }
        } catch (error) {
          console.error('Error fetching consultation:', error)
        }
      }
      
      // If no consultation exists, fetch patient data and create consultation object
      let patientData = null
      if (appointment.patientId) {
        try {
          const patientResponse = await getPatientById(appointment.patientId)
          if (patientResponse.success && patientResponse.data) {
            patientData = patientResponse.data
          }
        } catch (error) {
          console.error('Error fetching patient data:', error)
        }
      }
      
      // Calculate age from dateOfBirth
      const calculateAge = (dateOfBirth) => {
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
          return null
        }
      }
      
      // Use patient data from API or fallback to appointment data
      const finalPatientData = patientData || appointment.originalData?.patientId || {}
      const patientDateOfBirth = finalPatientData.dateOfBirth || appointment.originalData?.patientId?.dateOfBirth
      const calculatedAge = patientDateOfBirth ? calculateAge(patientDateOfBirth) : (finalPatientData.age || appointment.age || null)
      
      // Format address properly
      let formattedAddress = 'Not provided'
      const address = finalPatientData.address || appointment.originalData?.patientId?.address
      if (address) {
        const addressParts = [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
          address.country
        ].filter(Boolean)
        if (addressParts.length > 0) {
          formattedAddress = addressParts.join(', ')
        }
      } else if (appointment.patientAddress && appointment.patientAddress !== 'Address not provided' && appointment.patientAddress !== 'Not provided') {
        formattedAddress = appointment.patientAddress
      }
      
      // Format appointment date properly
      const appointmentDate = appointment.date || appointment.appointmentDate
      const appointmentTime = appointment.time || '00:00'
      const formattedAppointmentTime = appointmentDate 
        ? `${appointmentDate.split('T')[0]}T${appointmentTime}`
        : new Date().toISOString()
      
      // Get patient ID as string
      const patientIdString = appointment.patientId || finalPatientData._id || finalPatientData.id
      
      // Create consultation object with real data
      const consultationData = {
        id: `cons-${appointment.id}-${Date.now()}`,
        _id: `cons-${appointment.id}-${Date.now()}`,
        patientName: finalPatientData.firstName && finalPatientData.lastName
          ? `${finalPatientData.firstName} ${finalPatientData.lastName}`
          : appointment.patientName || 'Unknown Patient',
        age: calculatedAge,
        gender: finalPatientData.gender || appointment.gender || 'male',
        appointmentTime: formattedAppointmentTime,
        appointmentDate: appointmentDate ? appointmentDate.split('T')[0] : null,
          appointmentType: appointment.appointmentType || 'New',
        status: appointment.status === 'scheduled' || appointment.status === 'confirmed' ? 'in-progress' : appointment.status,
          reason: appointment.reason || 'Consultation',
        patientImage: finalPatientData.profileImage || appointment.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalPatientData.firstName || appointment.patientName || 'Patient')}&background=3b82f6&color=fff&size=160`,
        patientPhone: finalPatientData.phone || appointment.patientPhone || '',
        patientEmail: finalPatientData.email || appointment.patientEmail || '',
        patientAddress: formattedAddress,
        // Include patientId object structure for transformConsultationData
        patientId: {
          _id: patientIdString,
          id: patientIdString,
          firstName: finalPatientData.firstName || appointment.patientName?.split(' ')[0] || '',
          lastName: finalPatientData.lastName || appointment.patientName?.split(' ').slice(1).join(' ') || '',
          email: finalPatientData.email || appointment.patientEmail || '',
          phone: finalPatientData.phone || appointment.patientPhone || '',
          dateOfBirth: patientDateOfBirth || null,
          gender: finalPatientData.gender || appointment.gender || 'male',
          profileImage: finalPatientData.profileImage || appointment.patientImage || null,
          address: address || null,
        },
          diagnosis: '',
          vitals: {},
          medications: [],
          investigations: [],
          advice: '',
          attachments: [],
        appointmentId: appointment.id || appointment._id,
          originalAppointment: appointment.originalData || appointment,
      }
      
      navigate('/doctor/consultations', {
        state: {
          selectedConsultation: consultationData,
      },
    })
    } catch (error) {
      console.error('Error handling appointment view:', error)
      toast.error('Failed to load consultation data')
    }
  }

  return (
    <>
      <section className="flex flex-col gap-6 pb-24 -mt-28 lg:mt-0 lg:pb-8">
        {/* ── Mobile Hero Header ── */}
        <header
          className="lg:hidden relative overflow-hidden -mx-4 mb-2"
          style={{ background: 'linear-gradient(135deg, #11496c 0%, #0d3a52 60%, #14B8A6 100%)' }}
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative px-4 pt-16 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${profile?.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  {profile?.isActive ? 'Online' : 'Offline'}
                </div>
                <h1 className="text-3xl font-black text-white leading-none tracking-tight">
                  {profile?.firstName ? `Dr. ${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ''}` : 'Doctor'}
                </h1>
                <p className="text-sm font-bold text-white/70 mt-1">{profile?.clinicName || 'Clinic'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 border border-white/25">
                  <NotificationBell className="text-white" />
                </div>
                <button
                  type="button"
                  onClick={handleSidebarToggle}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white"
                  aria-label="Menu"
                >
                  <IoMenuOutline className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white/60">{todayLabel}</p>
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Queue Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Desktop Search ── */}
        <div className="hidden lg:block">
          <div className="relative w-full group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <IoSearchOutline className="h-5 w-5 text-slate-400 group-focus-within:text-[#11496c] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search patients, appointments, consultations..."
              className="w-full pl-12 pr-20 py-3.5 text-sm rounded-2xl border border-slate-100 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            />
          </div>
        </div>


        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">

          <article onClick={() => navigate('/doctor/all-patients')}
            className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-xl hover:shadow-[#11496c]/5 active:scale-[0.98]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #11496c 0%, #14B8A6 100%)' }}>
                <IoPeopleOutline className="h-7 w-7" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Patients</p>
                <p className="text-3xl font-black text-slate-900 leading-none group-hover:text-[#11496c] transition-colors">{loading ? '—' : stats.totalPatients}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-50"><p className="text-xs font-bold text-slate-400">Active patients</p></div>
          </article>

          <article onClick={() => navigate('/doctor/all-consultations')}
            className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <IoDocumentTextOutline className="h-7 w-7" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Consults</p>
                <p className="text-3xl font-black text-slate-900 leading-none group-hover:text-emerald-600 transition-colors">{loading ? '—' : stats.totalConsultations}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-50"><p className="text-xs font-bold text-slate-400">This month: <span className="text-emerald-600">{stats.thisMonthConsultations}</span></p></div>
          </article>

          <article onClick={() => navigate('/doctor/appointments')}
            className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-xl hover:shadow-purple-500/10 active:scale-[0.98]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                <IoCalendarOutline className="h-7 w-7" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Today</p>
                <p className="text-3xl font-black text-slate-900 leading-none group-hover:text-purple-600 transition-colors">{appointmentStats.todayCount ?? 0}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-50"><p className="text-xs font-bold text-slate-400">Month: <span className="text-purple-600">{appointmentStats.monthCount ?? 0}</span> · Year: <span className="text-purple-600">{appointmentStats.yearCount ?? 0}</span></p></div>
          </article>

          <article onClick={() => navigate('/doctor/wallet')}
            className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <IoWalletOutline className="h-7 w-7" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Earnings</p>
                <p className="text-xl font-black text-slate-900 leading-none group-hover:text-amber-600 transition-colors">{loading ? '—' : formatCurrency(stats.totalEarnings)}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-50 flex items-center gap-1.5">
              {earningsChange >= 0 ? <IoTrendingUpOutline className="h-3.5 w-3.5 text-emerald-500" /> : <IoTrendingDownOutline className="h-3.5 w-3.5 text-red-500" />}
              <p className="text-xs font-bold text-slate-400"><span className={earningsChange >= 0 ? 'text-emerald-600' : 'text-red-500'}>{earningsChange >= 0 ? '+' : ''}{earningsChange.toFixed(1)}%</span> vs last month</p>
            </div>
          </article>

        </div>

        {/* ── Today's Schedule ── */}
        <section aria-labelledby="schedule-title" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h2 id="schedule-title" className="text-xl font-black text-slate-900 tracking-tight">Today's Schedule</h2>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#11496c]/10 px-2.5 text-xs font-black text-[#11496c]">
                {todayAppointments.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/appointments')}
              className="text-xs font-black text-[#11496c] hover:text-[#14B8A6] uppercase tracking-widest transition-colors"
            >
              See all →
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-[32px] border border-dashed border-slate-200 bg-slate-50 text-center">
              <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                <IoCalendarOutline className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-black text-slate-600">No appointments today</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Your schedule is clear</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-4">
              {todayAppointments.map((appointment) => {
                const TypeIcon = getTypeIcon(appointment.consultationMode)
                return (
                  <article
                    key={appointment.id}
                    onClick={() => handleViewAppointment(appointment)}
                    className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-xl hover:shadow-[#11496c]/5 cursor-pointer active:scale-[0.98]"
                  >
                    {/* Top row: patient info + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={appointment.patientImage}
                            alt={appointment.patientName}
                            className="h-12 w-12 rounded-2xl object-cover ring-4 ring-white shadow-sm bg-slate-100"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=11496c&color=fff&size=128&bold=true`
                            }}
                          />
                          {appointment.status === 'confirmed' && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                              <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-[#11496c] transition-colors">
                            {appointment.patientName}
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5 line-clamp-1">{appointment.reason}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getStatusColor(appointment.status)}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        {appointment.status}
                      </span>
                    </div>

                    {/* Info chips */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <IoTimeOutline className="h-3 w-3 text-[#11496c]" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                        </div>
                        <p className="text-xs font-black text-slate-700">{appointment.time}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <TypeIcon className="h-3 w-3 text-[#11496c]" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode</span>
                        </div>
                        <p className="text-xs font-black text-slate-700 truncate">{getModeLabel(appointment.consultationMode)}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Recent Consultations ── */}
        <section aria-labelledby="consultations-title" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 id="consultations-title" className="text-xl font-black text-slate-900 tracking-tight">Recent Consultations</h2>
            <button
              type="button"
              onClick={() => navigate('/doctor/all-consultations')}
              className="text-xs font-black text-[#11496c] hover:text-[#14B8A6] uppercase tracking-widest transition-colors"
            >
              See all →
            </button>
          </div>

          {recentConsultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-[32px] border border-dashed border-slate-200 bg-slate-50 text-center">
              <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                <IoDocumentTextOutline className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-base font-black text-slate-600">No consultations yet</p>
              <p className="text-xs font-bold text-slate-400 mt-1">Completed consultations will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-4">
              {recentConsultations.map((consultation) => {
                const TypeIcon = getTypeIcon(consultation.consultationMode)
                return (
                  <article
                    key={consultation.id}
                    className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-xl hover:shadow-[#11496c]/5 cursor-pointer active:scale-[0.98]"
                  >
                    {/* Top row: patient info + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={consultation.patientImage}
                            alt={consultation.patientName}
                            className="h-12 w-12 rounded-2xl object-cover ring-4 ring-white shadow-sm bg-slate-100"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.patientName)}&background=11496c&color=fff&size=128&bold=true`
                            }}
                          />
                          {consultation.status === 'completed' && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                              <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-[#11496c] transition-colors">
                            {consultation.patientName}
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5 line-clamp-1">{consultation.notes || 'Consultation'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getStatusColor(consultation.status)}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        {consultation.status}
                      </span>
                    </div>

                    {/* Info row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5 text-[#11496c]" />
                          {formatDate(consultation.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5 text-[#11496c]" />
                          {getModeLabel(consultation.consultationMode)}
                        </span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">{formatCurrency(consultation.fee)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>
    </>
  )
}

export default DoctorDashboard



