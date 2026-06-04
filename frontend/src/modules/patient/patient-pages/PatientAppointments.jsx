import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCallOutline,
  IoVideocamOutline,
  IoMailOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { getPatientAppointments, rescheduleAppointment, createAppointmentPaymentOrder, verifyAppointmentPayment } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import { getSocket } from '../../../utils/socketClient'
import Pagination from '../../../components/Pagination'

// Default appointments (will be replaced by API data)
const defaultAppointments = []

// Map backend status to frontend display status
const mapBackendStatusToDisplay = (backendStatus) => {
  switch (backendStatus) {
    case 'scheduled':
      return 'scheduled' // Backend 'scheduled' shows as 'scheduled' for patient
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return backendStatus || 'scheduled'
  }
}

// Helper function to convert time to 12-hour format
const convertTimeTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getStatusColor = (status) => {
  // Handle both backend and frontend statuses
  const displayStatus = mapBackendStatusToDisplay(status)
  
  switch (displayStatus) {
    case 'confirmed':
      return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
    case 'scheduled':
      return 'bg-blue-100 text-blue-700'
    case 'upcoming': // Legacy support
      return 'bg-blue-100 text-blue-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    case 'no_show':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusIcon = (status) => {
  const displayStatus = mapBackendStatusToDisplay(status)
  switch (displayStatus) {
    case 'confirmed':
      return <IoCheckmarkCircleOutline className="h-4 w-4" />
    case 'scheduled':
      return <IoCalendarOutline className="h-4 w-4" />
    case 'upcoming': // Legacy support
      return <IoCalendarOutline className="h-4 w-4" />
    case 'completed':
      return <IoCheckmarkCircleOutline className="h-4 w-4" />
    case 'cancelled':
      return <IoCloseCircleOutline className="h-4 w-4" />
    default:
      return null
  }
}

const PatientAppointments = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [appointments, setAppointments] = useState(defaultAppointments)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inConsultationRoom, setInConsultationRoom] = useState(false)
  const [consultationAppointmentId, setConsultationAppointmentId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch appointments from API - Always fetch all appointments, filter on frontend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        // Always fetch all appointments including cancelled, we'll filter on frontend
        // Pass empty object to get all appointments (backend will include cancelled)
        const response = await getPatientAppointments({})
        
        
        
        if (response.success && response.data) {
          // Handle both array and object with items/appointments property
          let appointmentsData = []
          
          if (Array.isArray(response.data)) {
            appointmentsData = response.data
          } else if (response.data.items && Array.isArray(response.data.items)) {
            appointmentsData = response.data.items
          } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
            appointmentsData = response.data.appointments
          } else {
            console.warn('⚠️ Unexpected response data structure:', response.data)
            appointmentsData = []
          }
          
          // Transform API data to match component structure
          const transformedAppointments = appointmentsData.map(apt => ({
            id: apt._id || apt.id,
            _id: apt._id || apt.id,
            doctor: apt.doctorId ? {
              id: apt.doctorId._id || apt.doctorId.id,
              name: apt.doctorId.firstName && apt.doctorId.lastName
                ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                : apt.doctorId.name || 'Dr. Unknown',
              specialty: apt.doctorId.specialization || apt.doctorId.specialty || '',
              image: apt.doctorId.profileImage || apt.doctorId.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorId.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            } : apt.doctor || {},
            date: apt.appointmentDate || apt.date,
            time: convertTimeTo12Hour(apt.time || ''),
            status: apt.status || 'scheduled',
            type: apt.appointmentType || apt.type || 'In-Person',
            clinic: apt.doctorId?.clinicDetails?.name || apt.clinicDetails?.name || apt.clinic || '',
            location: (() => {
              // Try to get location from doctor's clinicDetails first
              const doctorClinic = apt.doctorId?.clinicDetails;
              if (doctorClinic?.address) {
                const parts = [];
                if (doctorClinic.address.line1) parts.push(doctorClinic.address.line1);
                if (doctorClinic.address.city) parts.push(doctorClinic.address.city);
                if (doctorClinic.address.state) parts.push(doctorClinic.address.state);
                if (doctorClinic.address.pincode) parts.push(doctorClinic.address.pincode);
                return parts.join(', ').trim();
              }
              // Fallback to appointment's clinicDetails
              const aptClinic = apt.clinicDetails;
              if (aptClinic?.address) {
                const parts = [];
                if (aptClinic.address.line1) parts.push(aptClinic.address.line1);
                if (aptClinic.address.city) parts.push(aptClinic.address.city);
                if (aptClinic.address.state) parts.push(aptClinic.address.state);
                if (aptClinic.address.pincode) parts.push(aptClinic.address.pincode);
                return parts.join(', ').trim();
              }
              return apt.location || '';
            })(),
            token: apt.tokenNumber ? `Token #${apt.tokenNumber}` : apt.token || null,
            fee: apt.fee || apt.consultationFee || 0,
            paymentStatus: apt.paymentStatus || 'paid', // Include payment status
            cancelledBy: apt.cancelledBy,
            cancelledAt: apt.cancelledAt,
            cancelReason: apt.cancellationReason || apt.cancelReason,
            rescheduledAt: apt.rescheduledAt,
            rescheduledBy: apt.rescheduledBy,
            rescheduleReason: apt.rescheduleReason,
            isRescheduled: !!apt.rescheduledAt, // Flag to identify rescheduled appointments
            sessionId: apt.sessionId, // Include sessionId for cancelled session date check
            consultationMode: apt.consultationMode || 'in_person',
            originalData: apt, // Keep original data for reference
          }))
          
          setAppointments(transformedAppointments)
          
          // Check if any appointment is in 'called' or 'in-consultation' status
          // Also check queueStatus to handle skipped appointments that might be recalled
          const activeConsultation = transformedAppointments.find(apt => {
            const status = apt.status || apt.originalData?.status
            const queueStatus = apt.queueStatus || apt.originalData?.queueStatus
            // Active if status is called/in-consultation OR if patient is waiting after being recalled
            return status === 'called' || 
                   status === 'in-consultation' || 
                   status === 'in_progress' ||
                   (status === 'waiting' && apt.originalData?.recallCount > 0) // Recalled patient
          })
          
          if (activeConsultation) {
            const appointmentId = activeConsultation.id || activeConsultation._id
            // Update consultation room state based on appointment status from backend
            // Always set based on current appointment status (handles refresh)
            setInConsultationRoom(true)
            setConsultationAppointmentId(appointmentId)
            try {
              const consultationState = {
                appointmentId: appointmentId,
                tokenNumber: activeConsultation.originalData?.tokenNumber || null,
                calledAt: new Date().toISOString(),
                isInConsultation: true,
              }
              localStorage.setItem('patientConsultationRoom', JSON.stringify(consultationState))
              
            } catch (error) {
              console.error('Error saving consultation room state:', error)
            }
          } else {
            // No active consultation found - check if we should clear state
            // Only clear if consultation was completed (not if skipped)
            try {
              const savedState = localStorage.getItem('patientConsultationRoom')
              if (savedState) {
                const consultationState = JSON.parse(savedState)
                // Check if the saved appointment still exists and is completed/cancelled
                const savedAppointment = transformedAppointments.find(apt => 
                  (apt.id || apt._id)?.toString() === consultationState.appointmentId?.toString()
                )
                if (savedAppointment && 
                    (savedAppointment.status === 'completed' || savedAppointment.status === 'cancelled')) {
                  // Only clear if appointment is completed or cancelled
                  setInConsultationRoom(false)
                  setConsultationAppointmentId(null)
                  localStorage.removeItem('patientConsultationRoom')
                  
                }
                // If appointment is skipped, keep consultation room state (patient might be recalled)
              }
            } catch (error) {
              console.error('Error checking consultation room state:', error)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
        
        // Don't show error toast for rate limiting - just set error state
        if (err.message?.includes('Too many requests') || err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh the page.')
          // Don't retry immediately - wait for user action
        } else {
        setError(err.message || 'Failed to load appointments')
        toast.error('Failed to load appointments')
        }
      } finally {
        setLoading(false)
      }
    }

    // Fetch immediately - no delay needed
    fetchAppointments()
    
    // Listen for appointment booking event to refresh
    const handleAppointmentBooked = () => {
      // Small debounce to prevent rapid requests
      setTimeout(() => {
      fetchAppointments()
      }, 300)
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast]) // Remove filter dependency - fetch all appointments once

  // Check for consultation room state on mount and restore it
  // Also check appointment status from backend to validate
  useEffect(() => {
    const restoreConsultationState = async () => {
      try {
        const savedState = localStorage.getItem('patientConsultationRoom')
        if (savedState) {
          const consultationState = JSON.parse(savedState)
          if (consultationState?.isInConsultation && consultationState?.appointmentId) {
            // Verify appointment status from backend
            const response = await getPatientAppointments({})
            if (response.success && response.data) {
              let appointmentsData = []
              if (Array.isArray(response.data)) {
                appointmentsData = response.data
              } else if (response.data.items && Array.isArray(response.data.items)) {
                appointmentsData = response.data.items
              } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
                appointmentsData = response.data.appointments
              }
              
              const appointment = appointmentsData.find(apt => 
                (apt._id || apt.id)?.toString() === consultationState.appointmentId?.toString()
              )
              
              // Only restore if appointment is still in called/in-consultation status
              // Don't restore if completed or cancelled
              if (appointment && 
                  (appointment.status === 'called' || 
                   appointment.status === 'in-consultation' || 
                   appointment.status === 'in_progress')) {
                setInConsultationRoom(true)
                setConsultationAppointmentId(consultationState.appointmentId)
                
              } else {
                // Appointment is no longer in consultation, clear state
                localStorage.removeItem('patientConsultationRoom')
                
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading consultation room state:', error)
      }
    }
    
    restoreConsultationState()
  }, [])

  // Setup socket listener for token:called event
  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      console.warn('⚠️ Patient socket not connected')
      return
    }
    
    

    const handleTokenCalled = (data) => {
      if (data?.appointmentId) {
        setInConsultationRoom(true)
        setConsultationAppointmentId(data.appointmentId)
        try {
          const consultationState = {
            appointmentId: data.appointmentId,
            tokenNumber: data.tokenNumber || null,
            calledAt: new Date().toISOString(),
            isInConsultation: true,
          }
          localStorage.setItem('patientConsultationRoom', JSON.stringify(consultationState))
          
        } catch (error) {
          console.error('Error saving consultation room state:', error)
        }
        toast.info('Doctor has called you! Please enter the consultation room.', {
          duration: 5000,
        })
      }
    }

    const handleConsultationCompleted = () => {
      setInConsultationRoom(false)
      setConsultationAppointmentId(null)
      localStorage.removeItem('patientConsultationRoom')
      
    }

    const handleTokenRecalled = (data) => {
      // When patient is recalled, they should enter consultation room again
      if (data?.appointmentId) {
        setInConsultationRoom(true)
        setConsultationAppointmentId(data.appointmentId)
        try {
          const consultationState = {
            appointmentId: data.appointmentId,
            tokenNumber: data.tokenNumber || null,
            calledAt: new Date().toISOString(),
            isInConsultation: true,
          }
          localStorage.setItem('patientConsultationRoom', JSON.stringify(consultationState))
          
        } catch (error) {
          console.error('Error saving consultation room state from recall:', error)
        }
        toast.info('You have been recalled! Please enter the consultation room.', {
          duration: 5000,
        })
      }
    }

    const handleAppointmentSkipped = (data) => {
      // When appointment is skipped, DON'T clear consultation room state
      // Patient might still be in consultation or will be recalled
      // Only update if this is the current consultation appointment
      if (data?.appointmentId && consultationAppointmentId === data.appointmentId) {
        
        // Don't clear - patient might be recalled
      }
    }

    socket.on('token:called', handleTokenCalled)
    socket.on('token:recalled', handleTokenRecalled)
    socket.on('appointment:skipped', handleAppointmentSkipped)
    socket.on('consultation:completed', handleConsultationCompleted)

    return () => {
      socket.off('token:called', handleTokenCalled)
      socket.off('token:recalled', handleTokenRecalled)
      socket.off('appointment:skipped', handleAppointmentSkipped)
      socket.off('consultation:completed', handleConsultationCompleted)
    }
  }, [toast, consultationAppointmentId])

  const handleRescheduleAppointment = (appointmentId, doctorId) => {
    navigate(`/patient/doctors/${doctorId}?reschedule=${appointmentId}`)
  }

  const handleCompletePayment = async (appointment) => {
    try {
      const appointmentId = appointment.id || appointment._id
      
      // Create payment order
      const paymentOrderResponse = await createAppointmentPaymentOrder(appointmentId)
      
      if (!paymentOrderResponse.success) {
        toast.error(paymentOrderResponse.message || 'Failed to create payment order. Please try again.')
        return
      }

      const { orderId, amount, currency, razorpayKeyId } = paymentOrderResponse.data

      // Initialize Razorpay payment
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.')
        return
      }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        name: 'Heallyn',
        description: `Appointment payment for ${appointment.doctor.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await verifyAppointmentPayment(appointmentId, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              paymentMethod: 'razorpay',
            })

            if (verifyResponse.success) {
              toast.success('Payment successful! Appointment confirmed.')
              // Refresh appointments
              window.dispatchEvent(new CustomEvent('appointmentBooked'))
            } else {
              toast.error(verifyResponse.message || 'Payment verification failed.')
            }
          } catch (error) {
            console.error('Error verifying payment:', error)
            toast.error(error.message || 'Error verifying payment. Please contact support.')
          }
        },
        prefill: {
          name: '', // Can be filled from user profile if available
          email: '',
          contact: '',
        },
        theme: {
          color: '#11496c',
        },
        modal: {
          ondismiss: () => {
            
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error(error.message || 'Error processing payment. Please try again.')
    }
  }

  // Calculate filtered appointments - MUST be before early returns (React Hooks rule)
  const filteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return []
    }
    
    // Filter out appointments with pending payment status - these should not be shown to patients
    const validAppointments = appointments.filter(apt => {
      // Don't show appointments with pending payment status (payment failed or not completed)
      return apt.paymentStatus !== 'pending'
    })
    
    if (filter === 'all') {
      return validAppointments
    } else if (filter === 'rescheduled') {
      return validAppointments.filter(apt => apt.isRescheduled)
    } else if (filter === 'scheduled') {
      return validAppointments.filter(apt => {
        const displayStatus = mapBackendStatusToDisplay(apt.status)
        // Show scheduled appointments but exclude rescheduled ones
        return (displayStatus === 'scheduled' || apt.status === 'upcoming') && !apt.isRescheduled
      })
    } else {
      return validAppointments.filter(apt => {
        const displayStatus = mapBackendStatusToDisplay(apt.status)
        return displayStatus === filter
      })
    }
  }, [appointments, filter])

  // Calculate paginated appointments
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAppointments.slice(startIndex, endIndex)
  }, [filteredAppointments, currentPage])

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage)
  const totalItems = filteredAppointments.length

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-100 w-fit overflow-x-auto max-w-full no-scrollbar mb-2">
        {['all', 'scheduled', 'rescheduled', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 px-5 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${filter === status
              ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20'
              : 'text-slate-500 hover:text-[#11496c] hover:bg-slate-50'
              }`}
          >
            {status === 'scheduled' ? 'Scheduled' : status === 'rescheduled' ? 'Rescheduled' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Consultation Room Notice - Show when patient is in consultation */}
      {inConsultationRoom && consultationAppointmentId && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
              <IoCallOutline className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-green-900">You are in Consultation Room</h3>
              <p className="text-xs text-green-700 mt-0.5">Doctor has called you. Your consultation is in progress.</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-3">
        {paginatedAppointments.map((appointment) => {
          const isInConsultation = inConsultationRoom && (
            consultationAppointmentId === appointment.id || 
            consultationAppointmentId === appointment._id
          )
          const isCalled = appointment.status === 'called' || 
                          appointment.status === 'in-consultation' || 
                          appointment.status === 'in_progress' ||
                          isInConsultation
          
          return (
          <article
            key={appointment.id}
            className={`group relative overflow-hidden rounded-[32px] border transition-all hover:shadow-xl hover:shadow-[#11496c]/5 p-6 ${
              isInConsultation 
                ? 'border-green-400 bg-green-50 shadow-lg shadow-green-100' 
                : isCalled
                ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100'
                : 'border-slate-50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
            }`}
          >
            <div className="relative">
              {/* Doctor Info & Status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={appointment.doctor.image}
                      alt={appointment.doctor.name}
                      className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white shadow-sm bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    {isCalled && (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white animate-pulse">
                        <IoCallOutline className="h-3.5 w-3.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{appointment.doctor.name}</h3>
                    <p className="text-xs font-bold text-[#14B8A6] mt-0.5">{appointment.doctor.specialty}</p>
                  </div>
                </div>

                {(() => {
                  const displayStatus = mapBackendStatusToDisplay(appointment.status)
                  const isPendingPayment = appointment.paymentStatus === 'pending' && displayStatus !== 'cancelled'
                  
                  let statusLabel = displayStatus === 'cancelled' ? 'Cancelled'
                                  : isPendingPayment ? 'Pending Payment'
                                  : appointment.isRescheduled ? 'Rescheduled'
                                  : isInConsultation ? 'In Consultation'
                                  : isCalled ? 'Called'
                                  : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)
                  
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                      isInConsultation ? 'bg-green-100 text-green-700'
                      : displayStatus === 'cancelled' ? 'bg-red-50 text-red-600'
                      : isPendingPayment ? 'bg-amber-50 text-amber-600'
                      : isCalled || appointment.isRescheduled ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-50 text-slate-500'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        isInConsultation ? 'bg-green-500 animate-pulse'
                        : displayStatus === 'cancelled' ? 'bg-red-500'
                        : 'bg-current'
                      }`} />
                      {statusLabel}
                    </span>
                  )
                })()}
              </div>

              {/* Appointment Details Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <IoCalendarOutline className="h-3.5 w-3.5 text-[#11496c]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  </div>
                  <p className="text-xs font-black text-slate-700">{formatDate(appointment.date)}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <IoTimeOutline className="h-3.5 w-3.5 text-[#11496c]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Slot</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700">{appointment.time}</p>
                    {appointment.token && (
                      <span className="px-2 py-0.5 bg-[#11496c] text-white text-[9px] font-black rounded-lg">
                        {appointment.token}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode & Location */}
              <div className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/30 border border-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-[#11496c] shadow-sm">
                    {appointment.consultationMode === 'in_person' ? <IoPersonOutline className="h-4 w-4" /> 
                    : (appointment.consultationMode === 'call' || appointment.consultationMode === 'audio') ? <IoCallOutline className="h-4 w-4" />
                    : appointment.consultationMode === 'chat' ? <IoMailOutline className="h-4 w-4" />
                    : <IoVideocamOutline className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Mode</p>
                    <p className="text-xs font-black text-slate-700 capitalize">
                      {appointment.consultationMode === 'in_person' ? 'In-Person' : appointment.consultationMode === 'video' ? 'Video Call' : appointment.consultationMode.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Fee</p>
                  <p className="text-sm font-black text-slate-900">₹{appointment.fee}</p>
                </div>
              </div>

              {appointment.location && (
                <div className="mt-3 flex items-start gap-2 px-1">
                  <IoLocationOutline className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-1">{appointment.location}</p>
                </div>
              )}

              {/* Specialized States (Payment/Cancellation/Rescheduled) */}
              <div className="mt-6 flex flex-col gap-3">
                {appointment.paymentStatus === 'pending' && appointment.status !== 'cancelled' && (
                  <div className="p-4 rounded-3xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-black text-amber-900 uppercase tracking-wide mb-3">Action Required: Payment Pending</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCompletePayment(appointment) }}
                      className="w-full py-3.5 bg-amber-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all hover:bg-amber-700"
                    >
                      Complete Payment (₹{appointment.fee})
                    </button>
                  </div>
                )}

                {appointment.status === 'cancelled' ? (
                  <div className="space-y-3">
                    {appointment.cancelledBy === 'doctor' && (
                      <div className="p-4 rounded-3xl bg-orange-50 border border-orange-100">
                        <p className="text-xs font-black text-orange-900 uppercase tracking-wide mb-1">Doctor Cancelled</p>
                        <p className="text-xs text-orange-700 font-medium italic line-clamp-2">"{appointment.cancelReason || 'No reason provided'}"</p>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRescheduleAppointment(appointment.id, appointment.doctor.id) }}
                      className="w-full py-3.5 bg-[#11496c] text-white font-black text-xs rounded-2xl shadow-lg shadow-[#11496c]/20 active:scale-95 transition-all hover:bg-[#0d3a52]"
                    >
                      Reschedule Now
                    </button>
                  </div>
                ) : (appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'upcoming') && appointment.paymentStatus !== 'pending' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/patient/doctors/${appointment.doctor.id}`)}
                      className="flex-1 py-3.5 bg-[#11496c] text-white font-black text-xs rounded-2xl shadow-lg shadow-[#11496c]/20 active:scale-95 transition-all hover:bg-[#0d3a52]"
                    >
                      View Details
                    </button>
                    {!appointment.isRescheduled && (
                      <button
                        onClick={() => handleRescheduleAppointment(appointment.id, appointment.doctor.id)}
                        className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-black text-xs rounded-2xl shadow-sm active:scale-95 transition-all hover:bg-slate-50"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                ) : null}

                {appointment.isRescheduled && appointment.status !== 'cancelled' && (
                  <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-black text-blue-900 uppercase tracking-wide mb-1">Rescheduled</p>
                    {appointment.rescheduleReason && (
                      <p className="text-xs text-blue-700 font-medium italic line-clamp-2">"{appointment.rescheduleReason}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
          )
        })}
      </div>

      {!loading && filteredAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoCalendarOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">
            {appointments && appointments.length > 0 
              ? `No ${filter === 'all' ? '' : filter.charAt(0).toUpperCase() + filter.slice(1)} appointments found`
              : 'No appointments available'}
          </p>
          {appointments && appointments.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">Try selecting a different filter</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredAppointments.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      )}

    </section>
  )
}

export default PatientAppointments

