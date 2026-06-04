import { useState, useEffect } from 'react'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoMedicalOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoEllipsisVerticalOutline,
  IoStarOutline,
  IoCreateOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoEyeOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import {
  getDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
} from '../admin-services/adminService'
import Pagination from '../../../components/Pagination'

// Mock data removed - using real API now

const AdminDoctors = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingDoctorId, setRejectingDoctorId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingDoctor, setViewingDoctor] = useState(null)
  const [loadingDoctorDetails, setLoadingDoctorDetails] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    clinic: '',
    location: '',
    status: 'pending',
  })
  const [allDoctors, setAllDoctors] = useState([]) // Store all doctors for stats
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Load doctors from API
  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filter/search changes
  }, [statusFilter, searchTerm])

  useEffect(() => {
    loadDoctors()
  }, [statusFilter, searchTerm, currentPage])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      
      // First, load ALL doctors for stats (no filters)
      const allDoctorsResponse = await getDoctors({ page: 1, limit: 1000 })
      if (allDoctorsResponse.success && allDoctorsResponse.data) {
        // Helper function to format full address
        const formatFullAddress = (clinicDetails) => {
          if (!clinicDetails) return ''
          
          const parts = []
          if (clinicDetails.address) {
            const addr = clinicDetails.address
            if (addr.line1) parts.push(addr.line1)
            if (addr.line2) parts.push(addr.line2)
            if (addr.city) parts.push(addr.city)
            if (addr.state) parts.push(addr.state)
            if (addr.postalCode) parts.push(addr.postalCode)
            if (addr.country) parts.push(addr.country)
          }
          
          return parts.length > 0 ? parts.join(', ') : ''
        }
        
        const allTransformed = (allDoctorsResponse.data.items || []).map(doctor => ({
          id: doctor._id || doctor.id,
          name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'N/A',
          email: doctor.email || '',
          phone: doctor.phone || '',
          specialty: doctor.specialization || '',
          clinic: doctor.clinicDetails?.name || '',
          location: formatFullAddress(doctor.clinicDetails),
          rating: doctor.rating || 0,
          totalConsultations: 0, // TODO: Add when appointments API is ready
          status: doctor.status === 'approved' ? 'verified' : doctor.status || 'pending',
          registeredAt: doctor.createdAt || new Date().toISOString(),
          rejectionReason: doctor.rejectionReason || '',
        }))
        setAllDoctors(allTransformed)
      }
      
      // Then, load filtered doctors for display with pagination
      const filters = {}
      if (statusFilter !== 'all') {
        // Map 'verified' to 'approved' for backend compatibility
        filters.status = statusFilter === 'verified' ? 'approved' : statusFilter
      }
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      filters.page = currentPage
      filters.limit = itemsPerPage
      
       // Debug log
      const response = await getDoctors(filters)
       // Debug log
      
      if (response.success && response.data) {
        const doctorsData = response.data.items || response.data || []
        const pagination = response.data.pagination || {}
        
         // Debug log
         // Debug log
         // Debug log
        
        // Helper function to format full address
        const formatFullAddress = (clinicDetails) => {
          if (!clinicDetails) return ''
          
          const parts = []
          if (clinicDetails.address) {
            const addr = clinicDetails.address
            if (addr.line1) parts.push(addr.line1)
            if (addr.line2) parts.push(addr.line2)
            if (addr.city) parts.push(addr.city)
            if (addr.state) parts.push(addr.state)
            if (addr.postalCode) parts.push(addr.postalCode)
            if (addr.country) parts.push(addr.country)
          }
          
          return parts.length > 0 ? parts.join(', ') : ''
        }
        
        const transformedDoctors = doctorsData.map(doctor => ({
          id: doctor._id || doctor.id,
          name: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'N/A',
          email: doctor.email || '',
          phone: doctor.phone || '',
          specialty: doctor.specialization || '',
          clinic: doctor.clinicDetails?.name || '',
          location: formatFullAddress(doctor.clinicDetails),
          rating: doctor.rating || 0,
          totalConsultations: 0, // TODO: Add when appointments API is ready
          status: doctor.status === 'approved' ? 'verified' : doctor.status || 'pending',
          registeredAt: doctor.createdAt || new Date().toISOString(),
          rejectionReason: doctor.rejectionReason || '',
        }))
         // Debug log
        setDoctors(transformedDoctors)
        
        // Update pagination state
        setTotalPages(pagination.totalPages || 1)
        setTotalItems(pagination.total || 0)
      } else {
        console.error('❌ Invalid response from API:', response) // Debug log
        setDoctors([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error loading doctors:', error)
      toast.error(error.message || 'Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (doctorId) => {
    try {
      setProcessingId(doctorId)
      const response = await verifyDoctor(doctorId)
      
      if (response.success) {
        toast.success('Doctor approved successfully')
        await loadDoctors()
      }
    } catch (error) {
      console.error('Error approving doctor:', error)
      toast.error(error.message || 'Failed to approve doctor')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (doctorId) => {
    setRejectingDoctorId(doctorId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingDoctorId) return
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejection.')
      return
    }

    try {
      setProcessingId(rejectingDoctorId)
      const response = await rejectDoctor(rejectingDoctorId, rejectionReason.trim())
      
      if (response.success) {
        toast.success('Doctor rejected successfully')
        await loadDoctors()
        setShowRejectModal(false)
        setRejectingDoctorId(null)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error)
      toast.error(error.message || 'Failed to reject doctor')
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewDoctor = async (doctorId) => {
    try {
      setLoadingDoctorDetails(true)
      const response = await getDoctorById(doctorId)
      if (response.success && response.data) {
        setViewingDoctor(response.data)
      } else {
        toast.error('Failed to load doctor details')
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error)
      toast.error(error.message || 'Failed to load doctor details')
    } finally {
      setLoadingDoctorDetails(false)
    }
  }

  // Update doctors when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
      loadDoctors()
      } else {
        setCurrentPage(1) // Reset to page 1 when search changes
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // No need for client-side filtering - backend handles it

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
            <IoCheckmarkCircleOutline className="h-3 w-3" />
            Verified
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
            <IoTimeOutline className="h-3 w-3" />
            Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
            <IoCloseCircleOutline className="h-3 w-3" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <IoStarOutline key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      )
    }
    const remainingStars = 5 - fullStars
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <IoStarOutline key={`empty-${i}`} className="h-4 w-4 text-slate-300" />
      )
    }
    return stars
  }

  // CRUD Operations
  const handleCreate = () => {
    setEditingDoctor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      clinic: '',
      location: '',
      status: 'pending',
    })
    setShowEditModal(true)
  }

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      clinic: doctor.clinic,
      location: doctor.location,
      status: doctor.status,
    })
    setShowEditModal(true)
  }

  const handleSave = () => {
    if (editingDoctor) {
      // Update existing doctor
      setDoctors(doctors.map(doc => 
        doc.id === editingDoctor.id 
          ? { ...doc, ...formData }
          : doc
      ))
    } else {
      // Create new doctor
      const newDoctor = {
        id: `doc-${Date.now()}`,
        ...formData,
        rating: 0,
        totalConsultations: 0,
        registeredAt: new Date().toISOString().split('T')[0],
      }
      setDoctors([...doctors, newDoctor])
    }
    setShowEditModal(false)
    setEditingDoctor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      clinic: '',
      location: '',
      status: 'pending',
    })
  }

  const handleDelete = (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      setDoctors(doctors.filter(doc => doc.id !== doctorId))
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <section className="flex flex-col gap-2 pb-20 pt-0">
      {/* Header */}
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage all registered doctors</p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search doctors by name, specialty, or clinic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
        />
      </div>

      {/* Stats Summary - Clickable Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:shadow-md ${
            statusFilter === 'all' ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Doctors</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{allDoctors.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'verified' ? 'border-emerald-500 bg-emerald-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {allDoctors.filter((d) => d.status === 'verified' || d.status === 'approved').length}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'pending' ? 'border-amber-500 bg-amber-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {allDoctors.filter((d) => d.status === 'pending').length}
          </p>
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Appointments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {allDoctors.reduce((sum, d) => sum + d.totalConsultations, 0)}
          </p>
        </div>
      </div>

      {/* Doctors List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No doctors found</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <IoMedicalOutline className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">{doctor.name}</h3>
                      <p className="mt-0.5 text-sm font-medium text-[#11496c]">{doctor.specialty}</p>
                      <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                        <div className="flex items-start gap-2">
                          <IoLocationOutline className="h-4 w-4 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            {doctor.clinic && (
                              <p className="font-semibold text-slate-900">{doctor.clinic}</p>
                            )}
                            {doctor.location && (
                              <p className="text-slate-600 text-sm">{doctor.location}</p>
                            )}
                            {!doctor.clinic && !doctor.location && (
                              <span className="text-slate-400 text-sm">No address available</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoMailOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoCallOutline className="h-4 w-4 shrink-0" />
                          <span>{doctor.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2 flex-col">
                      {getStatusBadge(doctor.status)}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleViewDoctor(doctor.id)}
                          disabled={loadingDoctorDetails}
                          className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          <IoEyeOutline className="h-3.5 w-3.5" />
                          View
                        </button>
                        {doctor.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(doctor.id)}
                              disabled={processingId === doctor.id}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                            >
                              {processingId === doctor.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectClick(doctor.id)}
                              disabled={processingId === doctor.id}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                      {doctor.status === 'rejected' && doctor.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 max-w-xs">
                          <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-600">{doctor.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      {renderStars(doctor.rating)}
                      <span className="ml-1 font-medium text-slate-700">{doctor.rating}</span>
                    </div>
                    <span>Consultations: {doctor.totalConsultations}</span>
                    <span>Registered: {formatDate(doctor.registeredAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && doctors.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </div>
      )}

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowEditModal(false)
            setEditingDoctor(null)
          }}
        >
          <div 
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingDoctor(null)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Dr. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="doctor@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specialty *
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Cardiologist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  value={formData.clinic}
                  onChange={(e) => handleInputChange('clinic', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="City Hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Mumbai, Maharashtra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingDoctor(null)
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0e3a52]"
              >
                {editingDoctor ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Doctor Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingDoctorId(null)
            setRejectionReason('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Doctor</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingDoctorId(null)
                  setRejectionReason('')
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Please provide a reason for rejecting this doctor. This reason will be visible to the doctor.
                </p>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
                {!rejectionReason.trim() && (
                  <p className="mt-1 text-xs text-red-600">Reason is required</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingDoctorId(null)
                  setRejectionReason('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === rejectingDoctorId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {processingId === rejectingDoctorId ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Doctor Details Modal */}
      {viewingDoctor && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingDoctor(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Doctor Details</h2>
              <button
                onClick={() => setViewingDoctor(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {loadingDoctorDetails ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-slate-600">Loading doctor details...</p>
                </div>
              ) : (
                <>
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Full Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {`${viewingDoctor.firstName || ''} ${viewingDoctor.lastName || ''}`.trim() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingDoctor.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingDoctor.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Specialization</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingDoctor.specialization || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Registration Number</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingDoctor.registrationNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <div className="mt-1">{getStatusBadge(viewingDoctor.status === 'approved' ? 'verified' : viewingDoctor.status || 'pending')}</div>
                      </div>
                      {viewingDoctor.rating && (
                        <div>
                          <p className="text-xs text-slate-500">Rating</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{viewingDoctor.rating}/5</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clinic Details */}
                  {viewingDoctor.clinicDetails && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Clinic Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {viewingDoctor.clinicDetails.name && (
                          <div>
                            <p className="text-xs text-slate-500">Clinic Name</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{viewingDoctor.clinicDetails.name}</p>
                          </div>
                        )}
                        {viewingDoctor.clinicDetails.address && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-slate-500">Address</p>
                            <div className="bg-slate-50 rounded-lg p-3 mt-1">
                              <p className="text-sm text-slate-900">
                                {viewingDoctor.clinicDetails.address.line1 || ''}
                                {viewingDoctor.clinicDetails.address.line2 && `, ${viewingDoctor.clinicDetails.address.line2}`}
                                {viewingDoctor.clinicDetails.address.city && `, ${viewingDoctor.clinicDetails.address.city}`}
                                {viewingDoctor.clinicDetails.address.state && `, ${viewingDoctor.clinicDetails.address.state}`}
                                {viewingDoctor.clinicDetails.address.postalCode && ` - ${viewingDoctor.clinicDetails.address.postalCode}`}
                                {viewingDoctor.clinicDetails.address.country && `, ${viewingDoctor.clinicDetails.address.country}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Additional Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingDoctor.createdAt && (
                        <div>
                          <p className="text-xs text-slate-500">Registered Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {new Date(viewingDoctor.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {viewingDoctor.approvedAt && (
                        <div>
                          <p className="text-xs text-slate-500">Approved Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {new Date(viewingDoctor.approvedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {viewingDoctor.rejectionReason && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500">Rejection Reason</p>
                          <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg">{viewingDoctor.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => setViewingDoctor(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminDoctors


