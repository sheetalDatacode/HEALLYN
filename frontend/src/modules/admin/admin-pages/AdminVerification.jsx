import { useState, useEffect, useMemo } from 'react'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoPeopleOutline,
  IoHeartOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoEyeOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import {
  getPendingVerifications,
  getDoctors,
  getPharmacies,
  getLaboratories,
  getNurses,
  verifyDoctor,
  rejectDoctor,
  verifyPharmacy,
  rejectPharmacy,
  verifyLaboratory,
  rejectLaboratory,
  verifyNurse,
  rejectNurse,
} from '../admin-services/adminService'
import Pagination from '../../../components/Pagination'

// Helper function to normalize document URLs
const normalizeDocumentUrl = (url) => {
  if (!url) return ''
  
  let cleanUrl = url
  if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) {
    const match = url.match(/https?:\/\/[^\/]+(\/.*)/)
    if (match && match[1]) {
      cleanUrl = match[1]
    }
  } else if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const baseUrl = apiBaseUrl.replace('/api', '').replace(/\/$/, '')
  return `${baseUrl}${cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`}`
}

// Helper to transform backend data to frontend format
const transformVerification = (item, type) => {
  if (type === 'doctor') {
    // Build full address string
    const addressParts = []
    if (item.clinicDetails?.address) {
      const addr = item.clinicDetails.address
      if (addr.line1) addressParts.push(addr.line1)
      if (addr.line2) addressParts.push(addr.line2)
      if (addr.city) addressParts.push(addr.city)
      if (addr.state) addressParts.push(addr.state)
      if (addr.postalCode) addressParts.push(addr.postalCode)
      if (addr.country) addressParts.push(addr.country)
    }
    const fullAddress = addressParts.join(', ')

    // Build location string (city, state)
    const location = item.clinicDetails?.address 
      ? `${item.clinicDetails.address.city || ''}, ${item.clinicDetails.address.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
      : ''

    // Format education array
    const educationList = item.education && Array.isArray(item.education) && item.education.length > 0
      ? item.education.map(edu => {
          const parts = []
          if (edu.institution) parts.push(edu.institution)
          if (edu.degree) parts.push(edu.degree)
          if (edu.year) parts.push(`(${edu.year})`)
          return parts.join(' - ')
        })
      : []

    // Format consultation modes
    const consultationModesList = item.consultationModes && Array.isArray(item.consultationModes) && item.consultationModes.length > 0
      ? item.consultationModes.map(mode => {
          if (mode === 'in_person') return 'In Person'
          if (mode === 'call') return 'Call'
          if (mode === 'audio') return 'Audio Call'
          if (mode === 'chat') return 'Chat'
          if (mode === 'video') return 'Video Call'
          return mode
        })
      : []

    return {
      id: item._id || item.id,
      type: 'doctor',
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      gender: item.gender || '',
      specialty: item.specialization || '',
      licenseNumber: item.licenseNumber || '',
      experienceYears: item.experienceYears || null,
      qualification: item.qualification || '',
      bio: item.bio || '',
      consultationFee: item.consultationFee || null,
      languages: item.languages && Array.isArray(item.languages) ? item.languages : [],
      consultationModes: consultationModesList,
      education: educationList,
      clinic: item.clinicDetails?.name || '',
      location: location,
      fullAddress: fullAddress,
      address: item.clinicDetails?.address || null,
      status: item.status || 'pending',
      submittedAt: item.createdAt || new Date().toISOString(),
      documents: item.documents && Array.isArray(item.documents)
        ? item.documents.map(doc => ({
            name: doc.name || 'Document',
            fileUrl: doc.fileUrl || '',
            uploadedAt: doc.uploadedAt || null
          }))
        : [],
      rejectionReason: item.rejectionReason || '',
      approvedAt: item.approvedAt || null,
      rejectedAt: item.status === 'rejected' ? item.updatedAt : null,
    }
  } else if (type === 'pharmacy') {
    // Build full address string
    const addressParts = []
    if (item.address) {
      const addr = item.address
      if (addr.line1) addressParts.push(addr.line1)
      if (addr.line2) addressParts.push(addr.line2)
      if (addr.city) addressParts.push(addr.city)
      if (addr.state) addressParts.push(addr.state)
      if (addr.postalCode) addressParts.push(addr.postalCode)
      if (addr.country) addressParts.push(addr.country)
    }
    const fullAddress = addressParts.join(', ')

    return {
      id: item._id || item.id,
      type: 'pharmacy',
      name: item.pharmacyName || '',
      ownerName: item.ownerName || '',
      email: item.email || '',
      phone: item.phone || '',
      licenseNumber: item.licenseNumber || '',
      gstNumber: item.gstNumber || '',
      fullAddress: fullAddress,
      address: item.address || null,
      timings: item.timings && Array.isArray(item.timings) ? item.timings : [],
      contactPerson: item.contactPerson || null,
      deliveryOptions: item.deliveryOptions && Array.isArray(item.deliveryOptions) ? item.deliveryOptions : [],
      serviceRadiusKm: item.serviceRadiusKm || null,
      status: item.status || 'pending',
      submittedAt: item.createdAt || new Date().toISOString(),
      documents: item.documents && Array.isArray(item.documents)
        ? item.documents.map(doc => ({
            name: doc.name || 'Document',
            fileUrl: doc.fileUrl || '',
            uploadedAt: doc.uploadedAt || null
          }))
        : [],
      rejectionReason: item.rejectionReason || '',
      approvedAt: item.approvedAt || null,
      rejectedAt: item.status === 'rejected' ? item.updatedAt : null,
    }
  } else if (type === 'laboratory') {
    // Build full address string
    const addressParts = []
    if (item.address) {
      const addr = item.address
      if (addr.line1) addressParts.push(addr.line1)
      if (addr.line2) addressParts.push(addr.line2)
      if (addr.city) addressParts.push(addr.city)
      if (addr.state) addressParts.push(addr.state)
      if (addr.postalCode) addressParts.push(addr.postalCode)
      if (addr.country) addressParts.push(addr.country)
    }
    const fullAddress = addressParts.join(', ')

    return {
      id: item._id || item.id,
      type: 'laboratory',
      name: item.labName || '',
      ownerName: item.ownerName || '',
      email: item.email || '',
      phone: item.phone || '',
      licenseNumber: item.licenseNumber || '',
      gstNumber: item.gstNumber || '',
      fullAddress: fullAddress,
      address: item.address || null,
      timings: item.timings && Array.isArray(item.timings) ? item.timings : [],
      contactPerson: item.contactPerson || null,
      testsOffered: item.testsOffered && Array.isArray(item.testsOffered) ? item.testsOffered : [],
      status: item.status || 'pending',
      submittedAt: item.createdAt || new Date().toISOString(),
      documents: item.documents && Array.isArray(item.documents)
        ? item.documents.map(doc => ({
            name: doc.name || 'Document',
            fileUrl: doc.fileUrl || '',
            uploadedAt: doc.uploadedAt || null
          }))
        : [],
      rejectionReason: item.rejectionReason || '',
      approvedAt: item.approvedAt || null,
      rejectedAt: item.status === 'rejected' ? item.updatedAt : null,
    }
  } else if (type === 'nurse') {
    // Build full address string
    const addressParts = []
    if (item.address) {
      const addr = item.address
      if (addr.line1) addressParts.push(addr.line1)
      if (addr.city) addressParts.push(addr.city)
      if (addr.state) addressParts.push(addr.state)
      if (addr.postalCode) addressParts.push(addr.postalCode)
      if (addr.country) addressParts.push(addr.country)
    }
    const fullAddress = addressParts.join(', ')

    // Build location string (city, state)
    const location = item.address 
      ? `${item.address.city || ''}, ${item.address.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
      : ''

    return {
      id: item._id || item.id,
      type: 'nurse',
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      gender: item.gender || '',
      qualification: item.qualification || '',
      experienceYears: item.experienceYears || null,
      specialization: item.specialization || '',
      fees: item.fees || null,
      registrationNumber: item.registrationNumber || '',
      registrationCouncilName: item.registrationCouncilName || '',
      location: location,
      fullAddress: fullAddress,
      address: item.address || null,
      status: item.status || 'pending',
      submittedAt: item.createdAt || new Date().toISOString(),
      documents: item.documents && Array.isArray(item.documents)
        ? item.documents.map(doc => ({
            name: doc.name || 'Document',
            fileUrl: doc.fileUrl || '',
            uploadedAt: doc.uploadedAt || null
          }))
        : [],
      rejectionReason: item.rejectionReason || '',
      approvedAt: item.approvedAt || null,
      rejectedAt: item.status === 'rejected' ? item.updatedAt : null,
    }
  }
  return null
}

// Mock data removed - using real API now

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeIcon = (type) => {
  switch (type) {
    case 'doctor':
      return IoMedicalOutline
    case 'pharmacy':
      return IoBusinessOutline
    case 'laboratory':
      return IoFlaskOutline
    case 'nurse':
      return IoHeartOutline
    default:
      return IoPeopleOutline
  }
}

const getTypeColor = (type) => {
  switch (type) {
    case 'doctor':
      return 'bg-emerald-100 text-emerald-600'
    case 'pharmacy':
      return 'bg-purple-100 text-purple-600'
    case 'laboratory':
      return 'bg-amber-100 text-amber-600'
    case 'nurse':
      return 'bg-pink-100 text-pink-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const AdminVerification = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifications, setVerifications] = useState([])
  const [viewingVerification, setViewingVerification] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingVerificationId, setRejectingVerificationId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Load verifications from API
  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [typeFilter, statusFilter, searchTerm])

  useEffect(() => {
    loadVerifications()
  }, [typeFilter, statusFilter, currentPage])

  const loadVerifications = async () => {
    try {
      setLoading(true)
      
      // Fetch all doctors, pharmacies, laboratories, and nurses with pagination
      // Load all for stats, but paginate the combined list display
      const [doctorsResponse, pharmaciesResponse, laboratoriesResponse, nursesResponse] = await Promise.allSettled([
        getDoctors({ page: 1, limit: 1000 }), // Get all doctors for stats
        getPharmacies({ page: 1, limit: 1000 }), // Get all pharmacies for stats
        getLaboratories({ page: 1, limit: 1000 }), // Get all laboratories for stats
        getNurses({ page: 1, limit: 1000 }), // Get all nurses for stats
      ])
      
      const allVerifications = []
      
      // Transform doctors
      if (doctorsResponse.status === 'fulfilled' && doctorsResponse.value?.success) {
        const doctors = doctorsResponse.value.data?.items || doctorsResponse.value.data || []
        if (Array.isArray(doctors)) {
          doctors.forEach(doctor => {
            const transformed = transformVerification(doctor, 'doctor')
            if (transformed) allVerifications.push(transformed)
          })
        }
      }
      
      // Transform pharmacies
      if (pharmaciesResponse.status === 'fulfilled' && pharmaciesResponse.value?.success) {
        const pharmacies = pharmaciesResponse.value.data?.items || pharmaciesResponse.value.data || []
        if (Array.isArray(pharmacies)) {
          pharmacies.forEach(pharmacy => {
            const transformed = transformVerification(pharmacy, 'pharmacy')
            if (transformed) allVerifications.push(transformed)
          })
        }
      }
      
      // Transform laboratories
      if (laboratoriesResponse.status === 'fulfilled' && laboratoriesResponse.value?.success) {
        const laboratories = laboratoriesResponse.value.data?.items || laboratoriesResponse.value.data || []
        if (Array.isArray(laboratories)) {
          laboratories.forEach(lab => {
            const transformed = transformVerification(lab, 'laboratory')
            if (transformed) allVerifications.push(transformed)
          })
        }
      }
      
      // Transform nurses
      if (nursesResponse.status === 'fulfilled' && nursesResponse.value?.success) {
        const nurses = nursesResponse.value.data?.items || nursesResponse.value.data || []
        if (Array.isArray(nurses)) {
          nurses.forEach(nurse => {
            const transformed = transformVerification(nurse, 'nurse')
            if (transformed) allVerifications.push(transformed)
          })
        }
      }
      
      setVerifications(allVerifications)
    } catch (error) {
      console.error('Error loading verifications:', error)
      toast.error(error.message || 'Failed to load verifications')
    } finally {
      setLoading(false)
    }
  }

  const filteredVerifications = verifications.filter((verification) => {
    const matchesSearch =
      verification.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (verification.phone && verification.phone.includes(searchTerm))
    const matchesType = typeFilter === 'all' || verification.type === typeFilter
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Paginated filtered verifications
  const paginatedFilteredVerifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredVerifications.slice(startIndex, endIndex)
  }, [filteredVerifications, currentPage, itemsPerPage])

  // Update pagination state
  useEffect(() => {
    const totalFiltered = filteredVerifications.length
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage) || 1)
    setTotalItems(totalFiltered)
  }, [filteredVerifications, itemsPerPage])

  const handleApprove = async (id) => {
    const verification = verifications.find(v => v.id === id)
    if (!verification) return

    try {
      setProcessingId(id)
      let response

      if (verification.type === 'doctor') {
        response = await verifyDoctor(id)
      } else if (verification.type === 'pharmacy') {
        response = await verifyPharmacy(id)
      } else if (verification.type === 'laboratory') {
        response = await verifyLaboratory(id)
      } else if (verification.type === 'nurse') {
        response = await verifyNurse(id)
      } else {
        throw new Error('Invalid verification type')
      }

      if (response && response.success) {
        toast.success(`${verification.type.charAt(0).toUpperCase() + verification.type.slice(1)} approved successfully`)
        await loadVerifications() // Reload to get updated data
        if (viewingVerification?.id === id) {
          setViewingVerification(null)
        }
      } else {
        throw new Error(response?.message || 'Approval failed. Please try again.')
      }
    } catch (error) {
      console.error('Error approving verification:', error)
      toast.error(error.message || 'Failed to approve verification')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (id) => {
    setRejectingVerificationId(id)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingVerificationId) return
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejection.')
      return
    }

    const verification = verifications.find(v => v.id === rejectingVerificationId)
    if (!verification) return

    try {
      setProcessingId(rejectingVerificationId)
      let response

      if (verification.type === 'doctor') {
        response = await rejectDoctor(rejectingVerificationId, rejectionReason.trim())
      } else if (verification.type === 'pharmacy') {
        response = await rejectPharmacy(rejectingVerificationId, rejectionReason.trim())
      } else if (verification.type === 'laboratory') {
        response = await rejectLaboratory(rejectingVerificationId, rejectionReason.trim())
      } else if (verification.type === 'nurse') {
        response = await rejectNurse(rejectingVerificationId, rejectionReason.trim())
      } else {
        throw new Error('Invalid verification type')
      }

      if (response && response.success) {
        toast.success(`${verification.type.charAt(0).toUpperCase() + verification.type.slice(1)} rejected successfully`)
        await loadVerifications() // Reload to get updated data
        if (viewingVerification?.id === rejectingVerificationId) {
          setViewingVerification(null)
      }

      // Close modal
      setShowRejectModal(false)
      setRejectingVerificationId(null)
      setRejectionReason('')
      } else {
        throw new Error(response?.message || 'Rejection failed. Please try again.')
      }
    } catch (error) {
      console.error('Error rejecting verification:', error)
      toast.error(error.message || 'Failed to reject verification')
    } finally {
      setProcessingId(null)
    }
  }

  const stats = {
    total: verifications.length,
    pending: verifications.filter((v) => v.status === 'pending').length,
    approved: verifications.filter((v) => v.status === 'approved').length,
    rejected: verifications.filter((v) => v.status === 'rejected').length,
  }

  // Status breakdown by type
  const statusByType = {
    doctor: {
      total: verifications.filter((v) => v.type === 'doctor').length,
      pending: verifications.filter((v) => v.type === 'doctor' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'doctor' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'doctor' && v.status === 'rejected').length,
    },
    pharmacy: {
      total: verifications.filter((v) => v.type === 'pharmacy').length,
      pending: verifications.filter((v) => v.type === 'pharmacy' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'pharmacy' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'pharmacy' && v.status === 'rejected').length,
    },
    laboratory: {
      total: verifications.filter((v) => v.type === 'laboratory').length,
      pending: verifications.filter((v) => v.type === 'laboratory' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'laboratory' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'laboratory' && v.status === 'rejected').length,
    },
    nurse: {
      total: verifications.filter((v) => v.type === 'nurse').length,
      pending: verifications.filter((v) => v.type === 'nurse' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'nurse' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'nurse' && v.status === 'rejected').length,
    },
  }

  return (
    <section className="flex flex-col gap-2 pb-20 pt-0">
      {/* Header */}
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verification Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Verify doctors, pharmacies, laboratories, and nurses</p>
        </div>
      </header>

      {/* Status Bars by Type */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Doctors Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <IoMedicalOutline className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Doctors</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.doctor.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.doctor.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.doctor.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.doctor.rejected}</span>
            </div>
          </div>
        </div>

        {/* Pharmacy Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <IoBusinessOutline className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Pharmacies</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.pharmacy.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.pharmacy.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.pharmacy.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.pharmacy.rejected}</span>
            </div>
          </div>
        </div>

        {/* Laboratory Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <IoFlaskOutline className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Laboratories</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.laboratory.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.laboratory.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.laboratory.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.laboratory.rejected}</span>
            </div>
          </div>
        </div>

        {/* Nurse Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100">
              <IoHeartOutline className="h-5 w-5 text-pink-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Nurses</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.nurse.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.nurse.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.nurse.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.nurse.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Requests</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-0.5 text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-0.5 text-2xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="mt-0.5 text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
          >
            <option value="all">All Types</option>
            <option value="doctor">Doctors</option>
            <option value="pharmacy">Pharmacies</option>
            <option value="laboratory">Laboratories</option>
            <option value="nurse">Nurses</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#11496c] text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[#11496c] text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-[#11496c] text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-[#11496c] text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Verifications List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Loading verifications...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No verification requests found</p>
          </div>
        ) : (
          paginatedFilteredVerifications.map((verification) => {
            const TypeIcon = getTypeIcon(verification.type)
            return (
              <article
                key={verification.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getTypeColor(verification.type)}`}>
                    <TypeIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900">{verification.name}</h3>
                        <p className="mt-0.5 text-sm text-slate-600 capitalize">{verification.type}</p>
                        <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                          {verification.specialty && (
                            <div className="flex items-center gap-2">
                              <IoMedicalOutline className="h-4 w-4 shrink-0" />
                              <span>{verification.specialty}</span>
                            </div>
                          )}
                          {verification.specialization && (
                            <div className="flex items-center gap-2">
                              <IoMedicalOutline className="h-4 w-4 shrink-0" />
                              <span>{verification.specialization}</span>
                            </div>
                          )}
                          {verification.clinic && (
                            <div className="flex items-center gap-2">
                              <IoLocationOutline className="h-4 w-4 shrink-0" />
                              <span>{verification.clinic}{verification.location ? `, ${verification.location}` : ''}</span>
                            </div>
                          )}
                          {verification.ownerName && (
                            <div className="flex items-center gap-2">
                              <IoPeopleOutline className="h-4 w-4 shrink-0" />
                              <span>Owner: {verification.ownerName}</span>
                            </div>
                          )}
                          {verification.fullAddress && (
                            <div className="flex items-center gap-2">
                              <IoLocationOutline className="h-4 w-4 shrink-0" />
                              <span className="truncate">{verification.fullAddress}</span>
                            </div>
                          )}
                          {!verification.fullAddress && verification.address && (
                            <div className="flex items-center gap-2">
                              <IoLocationOutline className="h-4 w-4 shrink-0" />
                              <span className="truncate">{verification.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <IoMailOutline className="h-4 w-4 shrink-0" />
                            <span className="truncate">{verification.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoCallOutline className="h-4 w-4 shrink-0" />
                            <span>{verification.phone}</span>
                          </div>
                          {verification.qualification && (
                            <div className="text-xs text-slate-500">
                              Qualification: {verification.qualification}
                            </div>
                          )}
                          {verification.registrationNumber && (
                            <div className="text-xs text-slate-500">
                              Registration: {verification.registrationNumber}
                            </div>
                          )}
                          {verification.licenseNumber && (
                            <div className="text-xs text-slate-500">
                              License: {verification.licenseNumber}
                            </div>
                          )}
                          {verification.gstNumber && (
                            <div className="text-xs text-slate-500">
                              GST: {verification.gstNumber}
                            </div>
                          )}
                          {verification.experienceYears !== null && verification.experienceYears !== undefined && (
                            <div className="text-xs text-slate-500">
                              Experience: {verification.experienceYears} years
                            </div>
                          )}
                          {verification.consultationFee !== null && verification.consultationFee !== undefined && (
                            <div className="text-xs text-slate-500">
                              Consultation Fee: ₹{verification.consultationFee}
                            </div>
                          )}
                          {verification.fees !== null && verification.fees !== undefined && (
                            <div className="text-xs text-slate-500">
                              Fees: ₹{verification.fees}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            verification.status === 'approved'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : verification.status === 'rejected'
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {verification.status === 'pending' && <IoTimeOutline className="h-3 w-3" />}
                          {verification.status === 'approved' && <IoCheckmarkCircleOutline className="h-3 w-3" />}
                          {verification.status === 'rejected' && <IoCloseCircleOutline className="h-3 w-3" />}
                          {verification.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingVerification(verification)}
                            className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            <IoEyeOutline className="h-3.5 w-3.5" />
                            View
                          </button>
                          {verification.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(verification.id)}
                                disabled={processingId === verification.id}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                              >
                                {processingId === verification.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectClick(verification.id)}
                                disabled={processingId === verification.id}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <IoCalendarOutline className="h-3.5 w-3.5" />
                        <span>Submitted: {formatDate(verification.submittedAt)}</span>
                      </div>
                      {verification.documents && (
                        <div className="flex items-center gap-1">
                          <span>Documents: {verification.documents.length}</span>
                        </div>
                      )}
                    </div>
                    {verification.status === 'rejected' && verification.rejectionReason && (
                      <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-600">{verification.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && paginatedFilteredVerifications.length > 0 && (
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

      {/* View Verification Details Modal */}
      {viewingVerification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingVerification(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">Verification Details</h2>
              <button
                onClick={() => setViewingVerification(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseCircleOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{viewingVerification.type}</p>
                  </div>
                  {viewingVerification.ownerName && (
                    <div>
                      <p className="text-xs text-slate-500">Owner Name</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.ownerName}</p>
                    </div>
                  )}
                  {viewingVerification.gender && (
                    <div>
                      <p className="text-xs text-slate-500">Gender</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{viewingVerification.gender}</p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.phone}</p>
                  </div>
                  {viewingVerification.licenseNumber && (
                    <div>
                      <p className="text-xs text-slate-500">License Number</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.licenseNumber}</p>
                    </div>
                  )}
                  {viewingVerification.gstNumber && (
                    <div>
                      <p className="text-xs text-slate-500">GST Number</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.gstNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor-specific Professional Details */}
              {viewingVerification.type === 'doctor' && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Professional Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingVerification.specialty && (
                      <div>
                        <p className="text-xs text-slate-500">Specialty</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.specialty}</p>
                      </div>
                    )}
                    {viewingVerification.experienceYears !== null && viewingVerification.experienceYears !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Experience</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.experienceYears} years</p>
                      </div>
                    )}
                    {viewingVerification.qualification && (
                      <div>
                        <p className="text-xs text-slate-500">Qualification</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.qualification}</p>
                      </div>
                    )}
                    {viewingVerification.consultationFee !== null && viewingVerification.consultationFee !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Consultation Fee</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">₹{viewingVerification.consultationFee}</p>
                      </div>
                    )}
                    {viewingVerification.clinic && (
                      <div>
                        <p className="text-xs text-slate-500">Clinic Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.clinic}</p>
                      </div>
                    )}
                    {viewingVerification.location && (
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.location}</p>
                      </div>
                    )}
                    {viewingVerification.fullAddress && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Full Address</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.fullAddress}</p>
                      </div>
                    )}
                    {viewingVerification.languages && viewingVerification.languages.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Languages Spoken</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {viewingVerification.languages.map((lang, idx) => (
                            <span key={idx} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingVerification.consultationModes && viewingVerification.consultationModes.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Consultation Modes</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {viewingVerification.consultationModes.map((mode, idx) => (
                            <span key={idx} className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              {mode}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingVerification.bio && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Bio</p>
                        <p className="mt-1 text-sm text-slate-900">{viewingVerification.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nurse Professional Details */}
              {viewingVerification.type === 'nurse' && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Professional Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingVerification.qualification && (
                      <div>
                        <p className="text-xs text-slate-500">Qualification</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.qualification}</p>
                      </div>
                    )}
                    {viewingVerification.specialization && (
                      <div>
                        <p className="text-xs text-slate-500">Specialization</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.specialization}</p>
                      </div>
                    )}
                    {viewingVerification.experienceYears !== null && viewingVerification.experienceYears !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Experience</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.experienceYears} years</p>
                      </div>
                    )}
                    {viewingVerification.fees !== null && viewingVerification.fees !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Fees</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">₹{viewingVerification.fees}</p>
                      </div>
                    )}
                    {viewingVerification.registrationNumber && (
                      <div>
                        <p className="text-xs text-slate-500">Registration Number</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.registrationNumber}</p>
                      </div>
                    )}
                    {viewingVerification.registrationCouncilName && (
                      <div>
                        <p className="text-xs text-slate-500">Registration Council</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.registrationCouncilName}</p>
                      </div>
                    )}
                    {viewingVerification.location && (
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.location}</p>
                      </div>
                    )}
                    {viewingVerification.fullAddress && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Full Address</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.fullAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pharmacy/Laboratory Business Details */}
              {(viewingVerification.type === 'pharmacy' || viewingVerification.type === 'laboratory') && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Business Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingVerification.fullAddress && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Full Address</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.fullAddress}</p>
                      </div>
                    )}
                    {viewingVerification.timings && viewingVerification.timings.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Timings</p>
                        <div className="mt-1 space-y-1">
                          {viewingVerification.timings.map((timing, idx) => (
                            <p key={idx} className="text-sm text-slate-900">{timing}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingVerification.contactPerson && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Contact Person</p>
                        <div className="mt-1 space-y-1">
                          {viewingVerification.contactPerson.name && (
                            <p className="text-sm font-semibold text-slate-900">Name: {viewingVerification.contactPerson.name}</p>
                          )}
                          {viewingVerification.contactPerson.phone && (
                            <p className="text-sm text-slate-900">Phone: {viewingVerification.contactPerson.phone}</p>
                          )}
                          {viewingVerification.contactPerson.email && (
                            <p className="text-sm text-slate-900">Email: {viewingVerification.contactPerson.email}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {viewingVerification.type === 'pharmacy' && viewingVerification.deliveryOptions && viewingVerification.deliveryOptions.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500">Delivery Options</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {viewingVerification.deliveryOptions.map((option, idx) => (
                            <span key={idx} className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 capitalize">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingVerification.type === 'pharmacy' && viewingVerification.serviceRadiusKm !== null && viewingVerification.serviceRadiusKm !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Service Radius</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.serviceRadiusKm} km</p>
                      </div>
                    )}
                    {viewingVerification.type === 'laboratory' && viewingVerification.testsOffered && viewingVerification.testsOffered.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Tests Offered</p>
                        <div className="mt-1 space-y-1">
                          {viewingVerification.testsOffered.map((test, idx) => (
                            <div key={idx} className="text-sm text-slate-900">
                              <span className="font-semibold">{test.testName || test}</span>
                              {test.price && <span className="text-slate-600 ml-2">₹{test.price}</span>}
                              {test.description && <p className="text-xs text-slate-500 mt-0.5">{test.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Education (Doctor only) */}
              {viewingVerification.type === 'doctor' && viewingVerification.education && viewingVerification.education.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Education</h3>
                  <div className="space-y-2">
                    {viewingVerification.education.map((edu, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{edu}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {viewingVerification.documents && viewingVerification.documents.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Submitted Documents</h3>
                  <div className="space-y-2">
                    {viewingVerification.documents.map((doc, index) => {
                      const normalizedUrl = normalizeDocumentUrl(doc.fileUrl)
                      return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <IoDocumentTextOutline className="h-5 w-5 text-[#11496c] flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{doc.name || 'Document'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {normalizedUrl && (
                            <>
                              <a
                                  href={normalizedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-[#11496c] hover:underline flex items-center gap-1"
                              >
                                <IoEyeOutline className="h-4 w-4" />
                                View
                              </a>
                              <a
                                  href={normalizedUrl}
                                download
                                className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
                              >
                                <IoDownloadOutline className="h-4 w-4" />
                                Download
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Submitted Documents</h3>
                  <p className="text-sm text-slate-500 italic">No documents submitted</p>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Current Status</p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          viewingVerification.status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : viewingVerification.status === 'rejected'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {viewingVerification.status === 'pending' && <IoTimeOutline className="h-3 w-3" />}
                        {viewingVerification.status === 'approved' && <IoCheckmarkCircleOutline className="h-3 w-3" />}
                        {viewingVerification.status === 'rejected' && <IoCloseCircleOutline className="h-3 w-3" />}
                        {viewingVerification.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted At</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(viewingVerification.submittedAt)}
                    </p>
                  </div>
                  {viewingVerification.rejectedAt && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Rejected At</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(viewingVerification.rejectedAt)}
                        </p>
                      </div>
                      {viewingVerification.rejectionReason && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500">Rejection Reason</p>
                          <p className="mt-1 text-sm font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
                            {viewingVerification.rejectionReason}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {viewingVerification.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button
                  onClick={() => {
                    setViewingVerification(null)
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingVerification(null)
                    handleRejectClick(viewingVerification.id)
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApprove(viewingVerification.id)
                    setViewingVerification(null)
                  }}
                  disabled={processingId === viewingVerification.id}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                >
                  {processingId === viewingVerification.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Verification Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingVerificationId(null)
            setRejectionReason('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Verification Request</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingVerificationId(null)
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
                  Please provide a reason for rejecting this verification request. This reason will be visible to the user.
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
                  setRejectingVerificationId(null)
                  setRejectionReason('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === rejectingVerificationId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {processingId === rejectingVerificationId ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminVerification

