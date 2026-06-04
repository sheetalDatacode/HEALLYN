import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoCalendarOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoCloseCircleOutline,
  IoCloseOutline,
  IoRefreshOutline,
  IoInformationCircleOutline,
  IoVideocamOutline,
  IoMailOutline,
  IoCallOutline,
} from 'react-icons/io5'
import { getDoctorAppointments, cancelDoctorAppointment, getPatientById, getConsultationById, getDoctorConsultations } from '../doctor-services/doctorService'
import Pagination from '../../../components/Pagination'

// Default appointments (will be replaced by API data)
const defaultAppointments = []

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timeString) => {
  return timeString || 'N/A'
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

// Map backend status to frontend display status
const mapBackendStatusToDisplay = (backendStatus) => {
  switch (backendStatus) {
    case 'scheduled':
      return 'pending' // Backend 'scheduled' shows as 'pending' for doctor
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return backendStatus || 'pending'
  }
}

// Map frontend display status back to backend status
const mapDisplayStatusToBackend = (displayStatus) => {
  switch (displayStatus) {
    case 'pending':
      return 'scheduled' // Frontend 'pending' is backend 'scheduled'
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return displayStatus || 'scheduled'
  }
}

const getStatusColor = (status) => {
  // Handle both backend and frontend statuses
  const displayStatus = status === 'scheduled' ? 'pending' : status
  
  switch (displayStatus) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'no_show':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const DoctorAppointments = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [appointments, setAppointments] = useState(defaultAppointments)
  const [statistics, setStatistics] = useState(null) // Statistics from backend
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all') // 'today', 'monthly', 'yearly', 'all'
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState(null)

  // Reset page when period filter or search changes
  useEffect(() => {
    setPage(1)
  }, [filterPeriod, searchTerm])

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = {
          page,
          limit,
          ...(searchTerm && { search: searchTerm }), // Note: Backend may not support search, keeping for future compatibility
        }
        const response = await getDoctorAppointments(params)
        
        if (response && response.success && response.data) {
          // Handle both array and object with items/appointments property
          const appointmentsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.appointments || []
          
          // Set pagination data
          if (response.data.pagination) {
            setPagination(response.data.pagination)
          }
          
          // Store statistics from backend if available
          if (response.data.statistics) {
            
            setStatistics(response.data.statistics)
          } else {
            
            setStatistics(null)
          }
          
          // Transform API data to match component structure
          const transformed = appointmentsData.map(apt => {
            // Normalize date - use appointmentDate from backend
            const appointmentDate = apt.appointmentDate || apt.date
            const normalizedDate = appointmentDate ? new Date(appointmentDate) : new Date()
            
            return {
            id: apt._id || apt.id,
            _id: apt._id || apt.id,
            patientId: apt.patientId?._id || apt.patientId?.id || apt.patientId || 'pat-unknown',
            patientName: apt.patientId?.firstName && apt.patientId?.lastName
              ? `${apt.patientId.firstName} ${apt.patientId.lastName}`
              : apt.patientId?.name || apt.patientName || 'Unknown Patient',
            patientImage: apt.patientId?.profileImage || apt.patientId?.image || apt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            date: appointmentDate, // Use appointmentDate from backend
            appointmentDate: appointmentDate, // Keep both for compatibility
            time: apt.time || '',
            type: apt.appointmentType || 'New',
            consultationMode: apt.consultationMode || 'in_person',
            status: apt.status || 'scheduled',
            duration: apt.duration || '30 min',
            reason: apt.reason || apt.chiefComplaint || 'Consultation',
            appointmentType: apt.appointmentType || 'New',
            // Preserve additional patient data
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
            age: apt.patientId?.age || apt.age || 30,
            gender: apt.patientId?.gender || apt.gender || 'male',
            // Rescheduled appointment data
            rescheduledAt: apt.rescheduledAt,
            rescheduledBy: apt.rescheduledBy,
            rescheduleReason: apt.rescheduleReason,
            isRescheduled: !!apt.rescheduledAt,
            // Preserve original appointment data for reference
            originalData: apt,
          }
          })
          
          
          
          setAppointments(transformed)
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
        // Check if it's a connection error
        const isConnectionError = err.message?.includes('Failed to fetch') || 
                                  err.message?.includes('ERR_CONNECTION_REFUSED') ||
                                  err.message?.includes('NetworkError') ||
                                  err instanceof TypeError && err.message === 'Failed to fetch'
        
        if (isConnectionError) {
          setError('Unable to connect to server. Please check if the backend server is running.')
          // Don't show toast for connection errors to avoid spam
        } else {
          setError(err.message || 'Failed to load appointments')
          toast.error('Failed to load appointments')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchAppointments()
    // Refresh every 30 seconds to get new appointments
    const interval = setInterval(fetchAppointments, 30000)
    return () => clearInterval(interval)
  }, [toast, page, limit, searchTerm])

  // Get today's date for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get current month start and end
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  currentMonthEnd.setHours(23, 59, 59, 999)

  // Get current year start and end
  const currentYearStart = new Date(today.getFullYear(), 0, 1)
  const currentYearEnd = new Date(today.getFullYear(), 11, 31)
  currentYearEnd.setHours(23, 59, 59, 999)

  // Filter appointments based on period
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Filter by period - normalize dates for comparison
    if (filterPeriod === 'today') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date || apt.appointmentDate)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() >= today.getTime() && aptDate.getTime() < tomorrow.getTime()
      })
    } else if (filterPeriod === 'monthly') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date || apt.appointmentDate)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() >= currentMonthStart.getTime() && aptDate.getTime() <= currentMonthEnd.getTime()
      })
    } else if (filterPeriod === 'yearly') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date || apt.appointmentDate)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() >= currentYearStart.getTime() && aptDate.getTime() <= currentYearEnd.getTime()
      })
    }
    // 'all' shows all appointments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (apt.time && apt.time.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.appointmentDate || 0)
      const dateB = new Date(b.date || b.appointmentDate || 0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [appointments, filterPeriod, searchTerm, today, tomorrow, currentMonthStart, currentMonthEnd, currentYearStart, currentYearEnd])

  // Calculate statistics - use backend statistics if available, otherwise calculate from appointments
  const stats = useMemo(() => {
    // If backend statistics are available, use them
    if (statistics) {
      return {
        today: statistics.today || { scheduled: 0, rescheduled: 0, total: 0 },
        monthly: statistics.monthly || { scheduled: 0, rescheduled: 0, total: 0 },
        yearly: statistics.yearly || { scheduled: 0, rescheduled: 0, total: 0 },
        total: statistics.total || { scheduled: 0, rescheduled: 0, total: 0 },
      }
    }
    
    // Fallback: calculate from appointments (client-side)
    // Normalize dates for proper comparison
    const todayApts = appointments.filter((apt) => {
      const aptDate = new Date(apt.date || apt.appointmentDate)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() >= today.getTime() && aptDate.getTime() < tomorrow.getTime()
    })
    const monthlyApts = appointments.filter((apt) => {
      const aptDate = new Date(apt.date || apt.appointmentDate)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() >= currentMonthStart.getTime() && aptDate.getTime() <= currentMonthEnd.getTime()
    })
    const yearlyApts = appointments.filter((apt) => {
      const aptDate = new Date(apt.date || apt.appointmentDate)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate.getTime() >= currentYearStart.getTime() && aptDate.getTime() <= currentYearEnd.getTime()
    })

    // Calculate scheduled and rescheduled counts
    const todayScheduled = todayApts.filter(apt => !apt.isRescheduled).length
    const todayRescheduled = todayApts.filter(apt => apt.isRescheduled).length
    const monthlyScheduled = monthlyApts.filter(apt => !apt.isRescheduled).length
    const monthlyRescheduled = monthlyApts.filter(apt => apt.isRescheduled).length
    const yearlyScheduled = yearlyApts.filter(apt => !apt.isRescheduled).length
    const yearlyRescheduled = yearlyApts.filter(apt => apt.isRescheduled).length
    const totalScheduled = appointments.filter(apt => !apt.isRescheduled).length
    const totalRescheduled = appointments.filter(apt => apt.isRescheduled).length

    return {
      today: {
        scheduled: todayScheduled,
        rescheduled: todayRescheduled,
        total: todayApts.length,
      },
      monthly: {
        scheduled: monthlyScheduled,
        rescheduled: monthlyRescheduled,
        total: monthlyApts.length,
      },
      yearly: {
        scheduled: yearlyScheduled,
        rescheduled: yearlyRescheduled,
        total: yearlyApts.length,
      },
      total: {
        scheduled: totalScheduled,
        rescheduled: totalRescheduled,
        total: appointments.length,
      },
    }
  }, [statistics, appointments, today, tomorrow, currentMonthStart, currentMonthEnd, currentYearStart, currentYearEnd])

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
      } else if (appointment.patientAddress && appointment.patientAddress !== 'Address not provided') {
        formattedAddress = appointment.patientAddress
      }
      
      // Format appointment date properly
      const appointmentDate = appointment.date || appointment.appointmentDate
      const appointmentTime = appointment.time || '00:00'
      const formattedAppointmentTime = appointmentDate 
        ? `${appointmentDate.split('T')[0]}T${appointmentTime}`
        : new Date().toISOString()
      
      // Create consultation object with real data
      const consultationData = {
        id: `cons-${appointment.id}-${Date.now()}`,
        _id: `cons-${appointment.id}-${Date.now()}`,
        patientId: appointment.patientId || finalPatientData._id || finalPatientData.id,
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

  const handleCancelClick = (e, appointment) => {
    e.stopPropagation() // Prevent card click
    setAppointmentToCancel(appointment)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel || !cancelReason.trim()) {
      toast.warning('Please provide a reason for cancellation')
      return
    }

    // Call API to cancel appointment
    try {
      await cancelDoctorAppointment(appointmentToCancel._id || appointmentToCancel.id, cancelReason.trim())
      
      // Remove cancelled appointment from list (don't show cancelled appointments to doctor)
      setAppointments((prev) =>
        prev.filter((apt) =>
          apt.id !== appointmentToCancel.id && apt._id !== appointmentToCancel._id
        )
      )

      toast.success(`Appointment with ${appointmentToCancel.patientName} has been cancelled. Patient will be notified and can reschedule.`)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error(error.message || 'Failed to cancel appointment')
      return
    }

    // Close modal and reset
    setShowCancelModal(false)
    setAppointmentToCancel(null)
    setCancelReason('')
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setAppointmentToCancel(null)
    setCancelReason('')
  }

  return (
    <>
      <section className="flex flex-col gap-6 lg:gap-8 pb-12">

        {/* Statistics Cards - Clickable */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilterPeriod('today')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'today'
                ? 'border-purple-400 bg-purple-100 ring-2 ring-purple-200'
                : 'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-purple-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-purple-700 mb-1 group-hover:text-purple-900 transition-colors">Today</p>
              <p className="text-xl font-bold text-purple-900 group-hover:text-purple-950 transition-colors duration-300">{stats.today?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-purple-600">Scheduled: {stats.today?.scheduled ?? 0}</span>
                <span className="text-[8px] text-purple-400">•</span>
                <span className="text-[8px] text-purple-600">Rescheduled: {stats.today?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('monthly')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'monthly'
                ? 'border-blue-400 bg-blue-100 ring-2 ring-blue-200'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-blue-700 mb-1 group-hover:text-blue-900 transition-colors">This Month</p>
              <p className="text-xl font-bold text-blue-900 group-hover:text-blue-950 transition-colors duration-300">{stats.monthly?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-blue-600">Scheduled: {stats.monthly?.scheduled ?? 0}</span>
                <span className="text-[8px] text-blue-400">•</span>
                <span className="text-[8px] text-blue-600">Rescheduled: {stats.monthly?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('yearly')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'yearly'
                ? 'border-emerald-400 bg-emerald-100 ring-2 ring-emerald-200'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-emerald-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1 group-hover:text-emerald-900 transition-colors">This Year</p>
              <p className="text-xl font-bold text-emerald-900 group-hover:text-emerald-950 transition-colors duration-300">{stats.yearly?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-emerald-600">Scheduled: {stats.yearly?.scheduled ?? 0}</span>
                <span className="text-[8px] text-emerald-400">•</span>
                <span className="text-[8px] text-emerald-600">Rescheduled: {stats.yearly?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('all')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'all'
                ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-200'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 to-slate-500/0 group-hover:from-slate-500/10 group-hover:to-slate-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-slate-600 mb-1 group-hover:text-slate-900 transition-colors">Total</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-slate-950 transition-colors duration-300">{stats.total?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-slate-600">Scheduled: {stats.total?.scheduled ?? 0}</span>
                <span className="text-[8px] text-slate-400">•</span>
                <span className="text-[8px] text-slate-600">Rescheduled: {stats.total?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by patient name, reason, or time..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Appointments List */}
        <div className="space-y-3 lg:grid lg:grid-cols-6 lg:gap-3 lg:space-y-0">
          {filteredAppointments.length === 0 ? (
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No appointments found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const TypeIcon = getTypeIcon(appointment.consultationMode)
              return (
                <div
                  key={appointment.id}
                  onClick={() => handleViewAppointment(appointment)}
                  className="group relative overflow-hidden rounded-xl lg:rounded-lg border border-slate-200 bg-white p-2.5 lg:p-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#11496c]/30 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.01]"
                >
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                  
                  <div className="relative flex flex-col gap-1.5 lg:gap-1.5">
                    {/* Top Row: Image + Name + Status */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Patient Image */}
                        <div className="relative shrink-0">
                          <img
                            src={appointment.patientImage}
                            alt={appointment.patientName}
                            className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg object-cover ring-2 ring-slate-100 group-hover:ring-[#11496c]/30 transition-all duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=160`
                            }}
                          />
                          {appointment.status === 'completed' && (
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white group-hover:scale-110 group-hover:ring-emerald-400 transition-all duration-300">
                              <IoCheckmarkCircleOutline className="h-1.5 w-1.5 text-white" />
                            </div>
                          )}
                          {(() => {
                            const displayStatus = mapBackendStatusToDisplay(appointment.status)
                            if (displayStatus === 'pending' && !appointment.isRescheduled) {
                              return (
                                <div className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 ring-2 ring-white group-hover:scale-110 group-hover:ring-yellow-400 transition-all duration-300" title="Pending">
                                  <IoTimeOutline className="h-1.5 w-1.5 text-white" />
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs lg:text-xs font-bold text-slate-900 truncate group-hover:text-[#11496c] transition-colors duration-300">{appointment.patientName}</h3>
                          <p className="text-[9px] lg:text-[9px] text-slate-600 truncate group-hover:text-slate-700 transition-colors">{appointment.reason}</p>
                        </div>
                      </div>
                      {/* Status Badge and Cancel Button */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(() => {
                          const displayStatus = mapBackendStatusToDisplay(appointment.status)
                          if (displayStatus === 'pending' && !appointment.isRescheduled) {
                            return null // Pending icon is shown on avatar corner
                          }
                          return (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[8px] lg:text-[8px] font-semibold uppercase tracking-wide ${getStatusColor(appointment.status)} group-hover:scale-105 transition-transform duration-300`}
                            >
                              {displayStatus === 'confirmed' ? (
                                <IoCheckmarkCircleOutline className="h-2 w-2" />
                              ) : displayStatus === 'completed' ? (
                                <IoCheckmarkCircleOutline className="h-2 w-2" />
                              ) : displayStatus === 'cancelled' ? (
                                <IoCloseCircleOutline className="h-2 w-2" />
                              ) : null}
                              <span className="hidden lg:inline">{displayStatus}</span>
                            </span>
                          )
                        })()}
                        {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                          <button
                            type="button"
                            onClick={(e) => handleCancelClick(e, appointment)}
                            className="flex items-center gap-0.5 rounded border border-red-200 bg-red-50 px-1 py-0.5 text-[8px] lg:text-[8px] font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                            title="Cancel Appointment"
                          >
                            <IoCloseCircleOutline className="h-2 w-2" />
                            <span className="hidden lg:inline">Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rescheduled Notice */}
                    {appointment.isRescheduled && appointment.rescheduleReason && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 mb-1">
                        <div className="flex items-start gap-1">
                          <IoInformationCircleOutline className="h-2.5 w-2.5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] lg:text-[8px] font-semibold text-blue-800 mb-0.5">Rescheduled</p>
                            <p className="text-[7px] lg:text-[7px] text-blue-700 line-clamp-2">{appointment.rescheduleReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[8px] lg:text-[8px] text-slate-600 group-hover:text-slate-700 transition-colors">
                      <div className="flex items-center gap-0.5">
                        <IoCalendarOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <IoTimeOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{formatTime(appointment.time)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <TypeIcon className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {appointment.consultationMode === 'in_person' ? 'In-Person' : appointment.consultationMode === 'video' ? 'Video Call' : appointment.consultationMode.charAt(0).toUpperCase() + appointment.consultationMode.slice(1)}
                        </span>
                      </div>
                      {appointment.duration ? (
                        <div className="flex items-center gap-0.5">
                          <span className="truncate">{appointment.duration}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <IoDocumentTextOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{appointment.appointmentType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page || page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit || limit}
              onPageChange={(newPage) => {
                setPage(newPage)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              loading={loading}
            />
          </div>
        )}
      </section>

      {/* Cancel Appointment Modal */}
      {showCancelModal && appointmentToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={handleCloseCancelModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cancel Appointment</h2>
                  <p className="text-xs text-slate-600">Patient: {appointmentToCancel.patientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <IoCalendarOutline className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(appointmentToCancel.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <IoTimeOutline className="h-4 w-4 text-slate-400" />
                  <span>{formatTime(appointmentToCancel.time)}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this appointment..."
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  The patient will be notified and can reschedule for a new date and time.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorAppointments

