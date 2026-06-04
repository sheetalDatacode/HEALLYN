import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    IoSearchOutline,
    IoLocationOutline,
    IoTimeOutline,
} from 'react-icons/io5'
import { TbStethoscope } from 'react-icons/tb'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

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

// Default nurses (using mock data)
const defaultNurses = []

const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
        )
    }

    if (hasHalfStar) {
        stars.push(
            <svg key="half" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <defs>
                    <linearGradient id={`half-fill-${rating}`}>
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <path fill={`url(#half-fill-${rating})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
        )
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
        stars.push(
            <svg key={`empty-${i}`} className="h-3.5 w-3.5 fill-slate-300 text-slate-300" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
        )
    }

    return stars
}

const PatientNurses = () => {
    const navigate = useNavigate()
    const toast = useToast()
    const [searchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [nurses, setNurses] = useState(defaultNurses)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const sortBy = 'relevance'
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Load mock nurses data (no API call)
    useEffect(() => {
        const loadNurses = () => {
            try {
                setLoading(true)
                setError(null)

                // Format full address helper
                const formatFullAddress = (address) => {
                    if (!address) return 'Location not available'

                    const parts = []
                    if (address.line1) parts.push(address.line1)
                    if (address.line2) parts.push(address.line2)
                    if (address.city) parts.push(address.city)
                    if (address.state) parts.push(address.state)

                    return parts.length > 0 ? parts.join(', ') : 'Location not available'
                }

                // Transform mock data to match expected format
                const transformed = mockNurses.map((nurse) => ({
                    id: nurse._id || nurse.id,
                    _id: nurse._id || nurse.id,
                    name: nurse.firstName && nurse.lastName
                        ? `${nurse.firstName} ${nurse.lastName}`
                        : nurse.name || 'Nurse',
                    specialty: nurse.specialization || 'Home Care Nurse',
                    experience: nurse.experienceYears
                        ? `${nurse.experienceYears} years`
                        : nurse.experience || 'N/A',
                    rating: nurse.rating || 0,
                    reviewCount: nurse.reviewCount || 0,
                    fees: nurse.fees || 0,
                    distance: nurse.distance || 'N/A',
                    location: formatFullAddress(nurse.address),
                    availability: nurse.availability && nurse.availability.length > 0 ? nurse.availability.join(', ') : 'Available',
                    nextSlot: 'N/A',
                    image: nurse.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(nurse.firstName || 'Nurse')}&background=11496c&color=fff&size=128&bold=true`,
                    qualification: nurse.qualification || 'Nursing',
                    originalData: nurse,
                }))

                setNurses(transformed)
            } catch (err) {
                console.error('Error loading nurses:', err)
                setError(err.message || 'Failed to load nurses')
                setNurses([])
            } finally {
                setLoading(false)
            }
        }

        loadNurses()
    }, [])

    const filteredNurses = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase()

        let filtered = nurses.filter((nurse) => {
            if (normalizedSearch) {
                const searchableFields = [
                    nurse.name,
                    nurse.specialty,
                    nurse.location,
                    nurse.qualification,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()

                const searchWords = normalizedSearch.split(/\s+/).filter(Boolean)
                const matches = searchWords.some((word) => searchableFields.includes(word))

                return matches
            }
            return true
        })

        return filtered.sort((a, b) => {
            /* Sort logic matching doctor */
            if (sortBy === 'rating') {
                return b.rating - a.rating
            }
            return b.rating - a.rating
        })
    }, [nurses, searchTerm, sortBy])

    const paginatedNurses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filteredNurses.slice(startIndex, endIndex)
    }, [filteredNurses, currentPage])

    const totalPages = Math.ceil(filteredNurses.length / itemsPerPage)
    const totalItems = filteredNurses.length

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const handleCardClick = (nurseId) => {
        // Navigate to nurse details or handle booking (could reuse doctor details or create new)
        // For now, let's assume we might need a details page or just a booking modal actions.
        // Given user's request "details dikhe jo doctor ke usem dikhti h", we imply a details page.
        navigate(`/patient/nurses/${nurseId}`)
    }

    return (
        <section className="flex flex-col gap-4 pb-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#11496c' }}>
                        <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                        id="nurse-search"
                        type="text"
                        placeholder="Search nurses by name or location..."
                        className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:shadow-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c] sm:text-base"
                        style={{ borderColor: 'rgba(17, 73, 108, 0.3)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                    />
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-medium text-slate-600">Loading nurses...</p>
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center">
                    <p className="text-sm font-medium text-red-600">Error: {error}</p>
                    <p className="mt-1 text-xs text-red-500">Please try again later.</p>
                </div>
            ) : filteredNurses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-medium text-slate-600">No nurses found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedNurses.map((nurse) => (
                        <div
                            key={nurse.id}
                            onClick={() => handleCardClick(nurse.id)}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={nurse.image}
                                            alt={nurse.name}
                                            className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nurse.name)}&background=11496c&color=fff&size=128&bold=true`
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-900 mb-0.5 leading-tight">{nurse.name}</h3>
                                        <p className="text-xs text-slate-600 mb-0.5">{nurse.specialty}</p>
                                        <p className="text-xs text-slate-500 mb-1.5 line-clamp-2">{nurse.location}</p>
                                        <div className="flex items-center gap-1.5">
                                            {/* Rating placeholders - assuming nurses have ratings or defaulting */}
                                            <div className="flex items-center gap-0.5">{renderStars(nurse.rating)}</div>
                                            <span className="text-xs font-semibold text-slate-700">
                                                {nurse.rating} ({nurse.reviewCount} reviews)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-base font-bold text-slate-900">₹{nurse.fees}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-slate-600 mb-3 ml-1">
                                    {/* Display availability days if available */}
                                    <span className="font-medium">Available: {nurse.availability}</span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleCardClick(nurse.id)
                                    }}
                                    className="w-full text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm"
                                    style={{ backgroundColor: '#11496c' }}
                                >
                                    Book Now • ₹{nurse.fees}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredNurses.length > 0 && totalPages > 1 && (
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

export default PatientNurses
