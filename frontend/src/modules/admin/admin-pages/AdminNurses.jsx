import { useState, useEffect } from 'react'
import {
  IoSearchOutline,
  IoHeartOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCloseOutline,
  IoMedicalOutline,
  IoSchoolOutline,
  IoBriefcaseOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  getNurses,
  getNurseById,
  verifyNurse,
  rejectNurse,
} from '../admin-services/adminService'
import Pagination from '../../../components/Pagination'

const AdminNurses = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [nurses, setNurses] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingNurseId, setRejectingNurseId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [allNurses, setAllNurses] = useState([]) // Store all nurses for stats
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Load nurses from API
  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filter/search changes
  }, [statusFilter, searchTerm])

  useEffect(() => {
    const token = getAuthToken('admin')
    if (!token) {
      console.warn('No authentication token found. Redirecting to login...')
      window.location.href = '/admin/login'
      return
    }
    loadNurses()
  }, [statusFilter, searchTerm, currentPage])

  useEffect(() => {
    const token = getAuthToken('admin')
    if (!token) {
      console.warn('No authentication token found. Redirecting to login...')
      window.location.href = '/admin/login'
      return
    }
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
      loadNurses()
      } else {
        setCurrentPage(1) // Reset to page 1 when search changes
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const loadNurses = async () => {
    const token = getAuthToken('admin')
    if (!token) {
      console.warn('No authentication token found. Redirecting to login...')
      window.location.href = '/admin/login'
      return
    }

    try {
      setLoading(true)
      
      // First, load ALL nurses for stats (no filters)
      const allNursesResponse = await getNurses({ page: 1, limit: 1000 })
      if (allNursesResponse.success && allNursesResponse.data) {
        // Helper function to format full address
        const formatFullAddress = (address) => {
          if (!address) return ''
          if (typeof address === 'string') return address
          
          const parts = []
          if (address.line1) parts.push(address.line1)
          if (address.line2) parts.push(address.line2)
          if (address.city) parts.push(address.city)
          if (address.state) parts.push(address.state)
          if (address.postalCode) parts.push(address.postalCode)
          if (address.country) parts.push(address.country)
          
          return parts.length > 0 ? parts.join(', ') : ''
        }
        
        const allTransformed = (allNursesResponse.data.items || []).map(nurse => ({
          id: nurse._id || nurse.id,
          name: `${nurse.firstName || ''} ${nurse.lastName || ''}`.trim() || 'N/A',
          email: nurse.email || '',
          phone: nurse.phone || '',
          address: formatFullAddress(nurse.address),
          qualification: nurse.qualification || '',
          specialization: nurse.specialization || '',
          experienceYears: nurse.experienceYears || null,
          fees: nurse.fees || null,
          registrationNumber: nurse.registrationNumber || '',
          registrationCouncilName: nurse.registrationCouncilName || '',
          status: nurse.status === 'approved' ? 'verified' : nurse.status || 'pending',
          registeredAt: nurse.createdAt || new Date().toISOString(),
          totalBookings: nurse.totalBookings || 0,
          rejectionReason: nurse.rejectionReason || '',
        }))
        setAllNurses(allTransformed)
      }
      
      // Then, load filtered nurses for display with pagination
      const filters = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter === 'verified' ? 'approved' : statusFilter
      }
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      filters.page = currentPage
      filters.limit = itemsPerPage
      
      
      const response = await getNurses(filters)
      
      
      if (response.success && response.data) {
        const nursesData = response.data.items || response.data || []
        const pagination = response.data.pagination || {}
        
        
        
        
        // Helper function to format full address
        const formatFullAddress = (address) => {
          if (!address) return ''
          if (typeof address === 'string') return address
          
          const parts = []
          if (address.line1) parts.push(address.line1)
          if (address.line2) parts.push(address.line2)
          if (address.city) parts.push(address.city)
          if (address.state) parts.push(address.state)
          if (address.postalCode) parts.push(address.postalCode)
          if (address.country) parts.push(address.country)
          
          return parts.length > 0 ? parts.join(', ') : ''
        }
        
        const transformedNurses = nursesData.map(nurse => ({
          id: nurse._id || nurse.id,
          name: `${nurse.firstName || ''} ${nurse.lastName || ''}`.trim() || 'N/A',
          email: nurse.email || '',
          phone: nurse.phone || '',
          address: formatFullAddress(nurse.address),
          qualification: nurse.qualification || '',
          specialization: nurse.specialization || '',
          experienceYears: nurse.experienceYears || null,
          fees: nurse.fees || null,
          registrationNumber: nurse.registrationNumber || '',
          registrationCouncilName: nurse.registrationCouncilName || '',
          status: nurse.status === 'approved' ? 'verified' : nurse.status || 'pending',
          registeredAt: nurse.createdAt || new Date().toISOString(),
          totalBookings: nurse.totalBookings || 0,
          rejectionReason: nurse.rejectionReason || '',
        }))
        
        setNurses(transformedNurses)
        
        // Update pagination state
        setTotalPages(pagination.totalPages || 1)
        setTotalItems(pagination.total || 0)
      } else {
        console.error('❌ Invalid response from API:', response)
        setNurses([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      if (error.message && error.message.includes('Authentication token missing')) {
        return
      }
      console.error('Error loading nurses:', error)
      toast.error(error.message || 'Failed to load nurses')
      setNurses([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (nurseId) => {
    try {
      setProcessingId(nurseId)
      const response = await verifyNurse(nurseId)
      
      if (response.success) {
        toast.success('Nurse approved successfully')
        await loadNurses()
      }
    } catch (error) {
      console.error('Error approving nurse:', error)
      toast.error(error.message || 'Failed to approve nurse')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (nurseId) => {
    setRejectingNurseId(nurseId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingNurseId) return
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejection.')
      return
    }

    try {
      setProcessingId(rejectingNurseId)
      const response = await rejectNurse(rejectingNurseId, rejectionReason.trim())
      
      if (response.success) {
        toast.success('Nurse rejected successfully')
        await loadNurses()
        setShowRejectModal(false)
        setRejectingNurseId(null)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Error rejecting nurse:', error)
      toast.error(error.message || 'Failed to reject nurse')
    } finally {
      setProcessingId(null)
    }
  }

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

  return (
    <section className="flex flex-col gap-2 pb-20 pt-0">
      {/* Header */}
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nurses Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage all registered nurses</p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search nurses by name, email, phone, or address..."
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Nurses</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{allNurses.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'verified' ? 'border-emerald-500 bg-emerald-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {allNurses.filter((n) => n.status === 'verified' || n.status === 'approved').length}
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
            {allNurses.filter((n) => n.status === 'pending').length}
          </p>
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {allNurses.reduce((sum, n) => sum + n.totalBookings, 0)}
          </p>
        </div>
      </div>

      {/* Nurses List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Loading nurses...</p>
          </div>
        ) : nurses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No nurses found</p>
          </div>
        ) : (
          nurses.map((nurse) => (
            <article
              key={nurse.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100">
                  <IoHeartOutline className="h-6 w-6 text-pink-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">{nurse.name}</h3>
                      {nurse.qualification && (
                        <p className="mt-0.5 text-sm font-medium text-[#11496c]">{nurse.qualification}</p>
                      )}
                      {nurse.specialization && (
                        <p className="mt-0.5 text-xs text-slate-500">{nurse.specialization}</p>
                      )}
                      <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                        {nurse.address && (
                          <div className="flex items-start gap-2">
                            <IoLocationOutline className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="truncate">{nurse.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <IoMailOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{nurse.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoCallOutline className="h-4 w-4 shrink-0" />
                          <span>{nurse.phone}</span>
                        </div>
                        {nurse.qualification && (
                          <div className="flex items-center gap-2">
                            <IoSchoolOutline className="h-4 w-4 shrink-0" />
                            <span className="text-xs text-slate-500">Qualification: {nurse.qualification}</span>
                          </div>
                        )}
                        {nurse.experienceYears !== null && nurse.experienceYears !== undefined && (
                          <div className="flex items-center gap-2">
                            <IoBriefcaseOutline className="h-4 w-4 shrink-0" />
                            <span className="text-xs text-slate-500">Experience: {nurse.experienceYears} years</span>
                          </div>
                        )}
                        {nurse.fees !== null && nurse.fees !== undefined && (
                          <div className="text-xs text-slate-500">
                            Fees: ₹{nurse.fees}
                          </div>
                        )}
                        {nurse.registrationNumber && (
                          <div className="flex items-center gap-2">
                            <IoDocumentTextOutline className="h-4 w-4 shrink-0" />
                            <span className="text-xs text-slate-500">Registration: {nurse.registrationNumber}</span>
                          </div>
                        )}
                        {nurse.registrationCouncilName && (
                          <div className="text-xs text-slate-500">
                            Council: {nurse.registrationCouncilName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2 flex-col">
                      {getStatusBadge(nurse.status)}
                      {nurse.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(nurse.id)}
                            disabled={processingId === nurse.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                          >
                            {processingId === nurse.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClick(nurse.id)}
                            disabled={processingId === nurse.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {nurse.status === 'rejected' && nurse.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 max-w-xs">
                          <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-600">{nurse.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>Bookings: {nurse.totalBookings}</span>
                    <span>Registered: {formatDate(nurse.registeredAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && nurses.length > 0 && (
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

      {/* Reject Nurse Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingNurseId(null)
            setRejectionReason('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Nurse</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingNurseId(null)
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
                  Please provide a reason for rejecting this nurse. This reason will be visible to the nurse.
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
                  setRejectingNurseId(null)
                  setRejectionReason('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === rejectingNurseId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {processingId === rejectingNurseId ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminNurses

