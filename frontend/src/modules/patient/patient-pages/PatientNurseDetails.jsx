import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
    IoArrowBackOutline,
    IoLocationOutline,
    IoStar,
    IoStarOutline,
    IoTimeOutline,
    IoInformationCircleOutline,
    IoCloseOutline,
    IoCheckmarkCircleOutline,
    IoCheckmarkCircle,
    IoCalendarOutline,
    IoHomeOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'

// Mock nurses data (until backend endpoint is ready)
const mockNurses = [
  {
    _id: 'n1',
    firstName: 'Sarah',
    lastName: 'Wilson',
    specialization: 'Critical Care',
    qualification: 'B.Sc Nursing',
    experienceYears: 8,
    fees: 500,
    rating: 4.8,
    reviewCount: 45,
    bio: 'Experienced critical care nurse with expertise in ICU management and emergency care. Dedicated to providing compassionate patient care.',
    address: {
      line1: '123 Health Ave',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001'
    },
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    profileImage: '',
  },
  {
    _id: 'n2',
    firstName: 'Priya',
    lastName: 'Sharma',
    specialization: 'Pediatric Care',
    qualification: 'M.Sc Nursing',
    experienceYears: 12,
    fees: 600,
    rating: 4.9,
    reviewCount: 82,
    bio: 'Specialized pediatric nurse with extensive experience in child care and development. Passionate about providing quality healthcare to children.',
    address: {
      line1: '45 Care Lane',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001'
    },
    availability: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    profileImage: '',
  },
  {
    _id: 'n3',
    firstName: 'Anita',
    lastName: 'Desai',
    specialization: 'Home Care',
    qualification: 'B.Sc Nursing',
    experienceYears: 6,
    fees: 450,
    rating: 4.7,
    reviewCount: 28,
    bio: 'Dedicated home care nurse providing personalized care services. Experienced in post-surgery care and elderly patient management.',
    address: {
      line1: 'Indore',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452001'
    },
    availability: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
    profileImage: '',
  },
  {
    _id: 'n4',
    firstName: 'Meera',
    lastName: 'Patel',
    specialization: 'Elderly Care',
    qualification: 'GNM',
    experienceYears: 10,
    fees: 550,
    rating: 4.6,
    reviewCount: 35,
    bio: 'Compassionate elderly care specialist with focus on geriatric nursing. Expert in managing chronic conditions and providing comfort care.',
    address: {
      line1: '78 Wellness Street',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380001'
    },
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    profileImage: '',
  },
  {
    _id: 'n5',
    firstName: 'Kavita',
    lastName: 'Singh',
    specialization: 'Post-Surgery Care',
    qualification: 'B.Sc Nursing',
    experienceYears: 7,
    fees: 480,
    rating: 4.5,
    reviewCount: 22,
    bio: 'Specialized in post-operative care and wound management. Skilled in monitoring recovery and preventing complications.',
    address: {
      line1: '12 Recovery Road',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001'
    },
    availability: ['Monday', 'Wednesday', 'Friday'],
    profileImage: '',
  },
]

// Default nurse data
const defaultNurse = null

// Get next 14 days for date selection
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

const PatientNurseDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const toast = useToast()
    const [nurse, setNurse] = useState(defaultNurse)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Booking modal state
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState('')
    const [serviceType, setServiceType] = useState('home_visit') // home_visit is default for nurses
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')
    const [patientAddress, setPatientAddress] = useState('')
    const [bookingStep, setBookingStep] = useState(1) // 1: Date, 2: Details, 3: Confirmation
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const availableDates = getAvailableDates()

    // Load nurse details from mock data
    useEffect(() => {
        const loadNurseDetails = () => {
            try {
                setLoading(true)
                setError(null)
                
                // Find nurse from mock data by ID
                const nurseData = mockNurses.find(n => n._id === id || n.id === id)
                
                if (nurseData) {
                    const transformed = {
                        id: nurseData._id || nurseData.id,
                        _id: nurseData._id || nurseData.id,
                        name: nurseData.firstName && nurseData.lastName
                            ? `${nurseData.firstName} ${nurseData.lastName}`
                            : nurseData.name || 'Nurse',
                        specialty: nurseData.specialization || 'Home Care Nurse',
                        experience: nurseData.experienceYears
                            ? `${nurseData.experienceYears} years`
                            : nurseData.experience || 'N/A',
                        rating: nurseData.rating || 0,
                        reviewCount: nurseData.reviewCount || 0,
                        fees: nurseData.fees || 0,
                        location: (() => {
                            if (!nurseData.address) return 'Location not available'

                            const parts = []
                            const addr = nurseData.address
                            if (addr.line1) parts.push(addr.line1)
                            if (addr.city) parts.push(addr.city)
                            if (addr.state) parts.push(addr.state)
                            if (addr.postalCode) parts.push(addr.postalCode)

                            return parts.length > 0 ? parts.join(', ') : 'Location not available'
                        })(),
                        availability: nurseData.availability && nurseData.availability.length > 0
                            ? nurseData.availability.join(', ')
                            : 'Available',
                        image: nurseData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent((nurseData.firstName || 'Nurse'))}&background=11496c&color=fff&size=128&bold=true`,
                        qualification: nurseData.qualification || 'Nursing',
                        about: nurseData.bio || '', // Helper field if needed
                        phone: nurseData.phone || 'N/A',
                        email: nurseData.email || 'N/A',
                        originalData: nurseData,
                    }
                    setNurse(transformed)
                } else {
                    setError('Nurse not found')
                    toast.error('Nurse not found')
                    setTimeout(() => {
                        navigate('/patient/nurses')
                    }, 2000)
                }
            } catch (err) {
                console.error('Error loading nurse details:', err)
                setError(err.message || 'Failed to load nurse details')
                toast.error('Failed to load nurse details')
                setTimeout(() => {
                    navigate('/patient/nurses')
                }, 2000)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            loadNurseDetails()
        }
    }, [id, navigate, toast])

    // Auto-open booking modal if ?book=true in URL (similar to doctor booking)
    useEffect(() => {
        if (!nurse) return
        
        const shouldOpenBooking = searchParams.get('book') === 'true'
        if (shouldOpenBooking && !showBookingModal) {
            // Open modal and remove query parameter from URL (like doctor booking)
            setShowBookingModal(true)
            setBookingStep(1)
            setSelectedDate('')
            setServiceType('home_visit')
            setReason('')
            setNotes('')
            setPatientAddress('')
            // Remove the query parameter from URL (stay on same page)
            navigate(`/patient/nurses/${id}`, { replace: true })
        }
    }, [nurse, searchParams, showBookingModal, id, navigate])

    const handleBookingClick = () => {
        setShowBookingModal(true)
        setBookingStep(1)
        setSelectedDate('')
        setServiceType('home_visit')
        setReason('')
        setNotes('')
        setPatientAddress('')
    }

    const handleCloseModal = () => {
        setShowBookingModal(false)
        setBookingStep(1)
        setSelectedDate('')
        setReason('')
        setNotes('')
        setPatientAddress('')
        // Stay on same page (no navigation needed, URL already cleaned when modal opened)
    }

    const handleNextStep = () => {
        if (bookingStep === 1 && selectedDate) {
            setBookingStep(2)
        } else if (bookingStep === 2) {
            // Validate required fields
            if (!reason.trim()) {
                toast.error('Please provide a reason for the service')
                return
            }
            if (!patientAddress.trim()) {
                toast.error('Please provide your address for home visit')
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
        if (!selectedDate || !reason.trim() || !patientAddress.trim()) {
            toast.error('Please fill all required fields')
            return
        }

        setIsSubmitting(true)
        
        try {
            // Mock booking - show success message
            // In future, this will call actual API: await bookNurseService({...})
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            toast.success('Nurse service requested successfully! You will be contacted soon.')
            handleCloseModal()
            
            setTimeout(() => {
                navigate('/patient/appointments')
            }, 1500)
        } catch (err) {
            console.error('Error booking nurse service:', err)
            toast.error('Failed to book service. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#11496c] border-r-transparent"></div>
            </div>
        )
    }

    if (!nurse) return null

    return (
        <section className="flex flex-col gap-6 pb-4">
            {/* Single Card Design (matching doctor details page) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Profile Image */}
                    <div className="relative shrink-0">
                        <img
                            src={nurse.image}
                            alt={nurse.name}
                            className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl object-cover ring-2 ring-slate-100 bg-slate-100"
                            loading="lazy"
                            onError={(e) => {
                                e.target.onerror = null
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nurse.name)}&background=11496c&color=fff&size=160&bold=true`
                            }}
                        />
                    </div>

                    {/* Nurse Info */}
                    <div className="flex-1 space-y-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{nurse.name}</h1>
                            <p className="mt-1 text-base font-medium text-[#11496c]">{nurse.specialty}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <div className="flex items-center gap-0.5">{renderStars(nurse.rating)}</div>
                                <span className="text-sm font-semibold text-slate-700">{nurse.rating}</span>
                                <span className="text-sm text-slate-500">({nurse.reviewCount} reviews)</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // TODO: Open review modal
                                        toast.info('Review feature coming soon')
                                    }}
                                    className="ml-2 text-xs font-semibold text-[#11496c] hover:text-[#0d3a52] underline"
                                >
                                    Rate & Review
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            {/* Availability */}
                            <div className="flex items-start gap-2">
                                <IoTimeOutline className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" aria-hidden="true" />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-700">
                                        {nurse.availability && nurse.availability !== 'Available' 
                                            ? nurse.availability.split(', ').map((day, idx) => (
                                                <div key={idx} className={idx > 0 ? 'mt-1' : ''}>{day}</div>
                                            ))
                                            : 'Available on all days'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="flex items-center gap-2">
                                <IoInformationCircleOutline className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                                <span>{nurse.experience} experience</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleBookingClick}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 sm:text-sm"
                            >
                                <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                                Book Nurse
                            </button>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
                    <p className="text-sm text-slate-600">
                        {nurse.about || `${nurse.name} is a dedicated ${nurse.specialty} with ${nurse.experience} of experience in patient care.`}
                    </p>
                </div>
            </div>

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
                                <h2 className="text-xl font-bold text-slate-900">Book Nurse Service</h2>
                                <p className="text-sm text-slate-600">{nurse.name} - {nurse.specialty}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleCloseModal()
                                }}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close modal"
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
                                            Choose your preferred date for the home visit service.
                                        </p>
                                        
                                        <div className="mb-6">
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                                            <div className="overflow-x-auto rounded-lg border border-slate-200 p-2 scrollbar-hide">
                                                <div className="flex gap-2">
                                                    {availableDates.map((date) => {
                                                        // Check if date is in nurse's availability
                                                        const dateObj = new Date(date.value)
                                                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                                                        const isAvailable = !nurse.availability || nurse.availability === 'Available' || 
                                                            (typeof nurse.availability === 'string' && nurse.availability.includes(dayName)) ||
                                                            (Array.isArray(nurse.availability) && nurse.availability.includes(dayName))
                                                        
                                                        return (
                                                            <button
                                                                key={date.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isAvailable) {
                                                                        setSelectedDate(date.value)
                                                                    } else {
                                                                        toast.warning(`${nurse.name} is not available on ${dayName}`)
                                                                    }
                                                                }}
                                                                disabled={!isAvailable}
                                                                className={`shrink-0 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                                                                    !isAvailable
                                                                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                        : selectedDate === date.value
                                                                        ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)] text-[#0d3a52]'
                                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="text-xs text-slate-500">{date.label.split(',')[0]}</div>
                                                                <div className="mt-1 whitespace-nowrap">{date.label.split(',')[1]?.trim()}</div>
                                                                {!isAvailable && (
                                                                    <div className="mt-1 text-[10px] text-red-500 font-semibold">Unavailable</div>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {selectedDate && (
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                                <div className="flex items-center gap-2">
                                                    <IoCheckmarkCircleOutline className="h-5 w-5 text-emerald-600" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-emerald-900">
                                                            Date Selected: {new Date(selectedDate).toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-emerald-700 mt-1">
                                                            Home visit service will be scheduled for this date
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Service Details */}
                            {bookingStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="mb-4 text-lg font-semibold text-slate-900">Service Details</h3>
                                        
                                        <div className="mb-6">
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Service Type
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setServiceType('home_visit')}
                                                    className={`flex flex-1 items-center gap-2 rounded-xl border-2 p-2.5 transition ${
                                                        serviceType === 'home_visit'
                                                            ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                                        serviceType === 'home_visit' ? 'bg-[#11496c] text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <IoHomeOutline className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-900">Home Visit</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-slate-700">
                                                Reason for Service <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="reason"
                                                type="text"
                                                placeholder="e.g., Post-surgery care, Elderly care, Wound dressing"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="patientAddress" className="mb-2 block text-sm font-semibold text-slate-700">
                                                Your Address for Home Visit <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="patientAddress"
                                                rows={3}
                                                placeholder="Enter your complete address where the nurse should visit..."
                                                value={patientAddress}
                                                onChange={(e) => setPatientAddress(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] resize-y"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-700">
                                                Additional Notes (Optional)
                                            </label>
                                            <textarea
                                                id="notes"
                                                rows={4}
                                                placeholder="Any additional information, special instructions, or requirements..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] resize-y"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {bookingStep === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)]">
                                            <IoCheckmarkCircle className="h-10 w-10 text-[#11496c]" />
                                        </div>
                                        <h3 className="mb-2 text-xl font-bold text-slate-900">Confirm Your Service Request</h3>
                                        <p className="text-sm text-slate-600">Please review your service request details</p>
                                    </div>
                                    
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={nurse.image}
                                                    alt={nurse.name}
                                                    className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                                                    onError={(e) => {
                                                        e.target.onerror = null
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nurse.name)}&background=11496c&color=fff&size=128&bold=true`
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-900">{nurse.name}</h4>
                                                    <p className="text-sm text-slate-600">{nurse.specialty}</p>
                                                    <p className="mt-1 text-sm text-slate-500">{nurse.location}</p>
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
                                                    <span className="text-sm text-slate-600">Service Type</span>
                                                    <span className="text-sm font-semibold text-slate-900">Home Visit</span>
                                                </div>
                                                <div className="flex items-start justify-between">
                                                    <span className="text-sm text-slate-600">Reason</span>
                                                    <span className="text-right text-sm font-semibold text-slate-900">{reason}</span>
                                                </div>
                                                <div className="flex items-start justify-between">
                                                    <span className="text-sm text-slate-600">Address</span>
                                                    <span className="text-right text-sm font-semibold text-slate-900 max-w-[60%]">{patientAddress}</span>
                                                </div>
                                                {notes && (
                                                    <div className="flex items-start justify-between">
                                                        <span className="text-sm text-slate-600">Notes</span>
                                                        <span className="text-right text-sm font-semibold text-slate-900 max-w-[60%]">{notes}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                                    <span className="text-base font-semibold text-slate-900">Total Fee</span>
                                                    <span className="text-xl font-bold text-[#11496c]">₹{nurse.fees}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-start gap-2">
                                            <IoInformationCircleOutline className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-blue-900">
                                                    What happens next?
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Your service request will be reviewed. The nurse will contact you to confirm the visit time and finalize the details.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
                                {bookingStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handlePreviousStep}
                                        className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Previous
                                    </button>
                                ) : (
                                    <div></div>
                                )}
                                
                                {bookingStep < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={bookingStep === 1 && !selectedDate}
                                        className="ml-auto rounded-lg bg-[#11496c] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleConfirmBooking}
                                        disabled={isSubmitting}
                                        className="ml-auto rounded-lg bg-[#11496c] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <IoCheckmarkCircleOutline className="h-5 w-5" />
                                                Confirm & Request Service
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default PatientNurseDetails
