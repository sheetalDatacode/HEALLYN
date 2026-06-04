import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5'
import { getSpecialtyDoctors, getDoctors } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

const specialtyLabels = {
  'dentist': 'Dentist',
  'cardio': 'Cardiology',
  'ortho': 'Orthopedic',
  'neuro': 'Neurology',
  'general': 'General',
}

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-3 w-3 text-yellow-400 fill-current" />)
  }
  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-3 w-3 text-yellow-400" />)
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(<IoStarOutline key={i} className="h-3 w-3 text-slate-300" />)
  }
  return stars
}

const PatientSpecialtyDoctors = () => {
  const { specialtyId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const specialtyLabel = specialtyLabels[specialtyId] || 'All Specialties'

  // Fetch doctors by specialty from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { getAuthToken } = await import('../../../utils/apiClient')
        const token = getAuthToken('patient')
        if (!token) {
          navigate('/patient/login')
          return
        }

        let response
        if (specialtyId === 'all') {
          // Fetch all doctors
          response = await getDoctors({ limit: 100 })
        } else {
          // Fetch doctors by specialty
          response = await getSpecialtyDoctors(specialtyId, { limit: 100 })
        }

        if (response.success && response.data) {
          const doctorsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || []
          
          // Filter by active status (doctors should already be filtered by backend, but double-check)
          const activeDoctors = doctorsData.filter(doctor => {
            // Check if doctor is active (from API data)
            return doctor.isActive !== false
          })
          
          setDoctors(activeDoctors)
        } else {
          setDoctors([])
        }
      } catch (err) {
        console.error('Error fetching specialty doctors:', err)
        setError(err.message || 'Failed to load doctors')
        toast.error('Failed to load doctors')
        setDoctors([])
      } finally {
        setLoading(false)
      }
    }

    if (specialtyId) {
      fetchDoctors()
    }
  }, [specialtyId, navigate, toast])

  const handleCardClick = (doctorId) => {
    navigate(`/patient/doctors/${doctorId}`)
  }

  // Calculate paginated doctors
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return doctors.slice(startIndex, endIndex)
  }, [doctors, currentPage])

  const totalPages = Math.ceil(doctors.length / itemsPerPage)
  const totalItems = doctors.length

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{specialtyLabel} Doctors</h1>
          <p className="text-sm text-slate-600">{doctors.length} doctor(s) available</p>
        </div>
      </div>

      {/* Doctors List */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">Loading doctors...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No doctors found in this specialty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedDoctors.map((doctor) => {
            const doctorId = doctor._id || doctor.id
            const doctorName = doctor.firstName && doctor.lastName 
              ? `Dr. ${doctor.firstName} ${doctor.lastName}`
              : doctor.name || 'Doctor'
            const specialty = doctor.specialization || doctor.specialty || ''
            
            // Format full address
            const formatFullAddress = (clinicDetails) => {
              if (!clinicDetails) return 'Location not available'
              
              const parts = []
              if (clinicDetails.name) parts.push(clinicDetails.name)
              
              if (clinicDetails.address) {
                const addr = clinicDetails.address
                if (addr.line1) parts.push(addr.line1)
                if (addr.line2) parts.push(addr.line2)
                if (addr.city) parts.push(addr.city)
                if (addr.state) parts.push(addr.state)
                if (addr.postalCode) parts.push(addr.postalCode)
                if (addr.country) parts.push(addr.country)
              }
              
              return parts.length > 0 ? parts.join(', ') : 'Location not available'
            }
            
            const location = formatFullAddress(doctor.clinicDetails)
            const clinicName = doctor.clinicDetails?.name || ''
            const rating = doctor.rating || 0
            const consultationFee = doctor.consultationFee || 0
            const profileImage = doctor.profileImage || doctor.image || ''
            
            return (
              <article
                key={doctorId}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                onClick={() => handleCardClick(doctorId)}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.15)] blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={profileImage}
                        alt={doctorName}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-100"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{doctorName}</h3>
                      <p className="mt-0.5 text-xs font-medium text-[#11496c] sm:text-sm">{specialty}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">{renderStars(rating)}</div>
                        <span className="text-xs font-semibold text-slate-700">{rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 sm:text-sm">
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{location}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Consultation Fee</p>
                      <p className="text-base font-bold text-slate-900">₹{consultationFee}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/patient/doctors/${doctorId}`)
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 sm:text-sm"
                    >
                      <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                      Book
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && doctors.length > 0 && totalPages > 1 && (
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

export default PatientSpecialtyDoctors

