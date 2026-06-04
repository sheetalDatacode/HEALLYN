import { useState, useEffect } from 'react'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoFlaskOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoEllipsisVerticalOutline,
  IoCreateOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoEyeOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import { getAuthToken } from '../../../utils/apiClient'
import {
  getLaboratories,
  getLaboratoryById,
  verifyLaboratory,
  rejectLaboratory,
  getLaboratoryTestsByLaboratory,
} from '../admin-services/adminService'
import Pagination from '../../../components/Pagination'

// Mock data removed - using real API now

const AdminLaboratories = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [laboratories, setLaboratories] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingLabId, setRejectingLabId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingLaboratory, setViewingLaboratory] = useState(null)
  const [loadingLaboratoryDetails, setLoadingLaboratoryDetails] = useState(false)
  const [allLaboratories, setAllLaboratories] = useState([]) // Store all laboratories for stats
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const loadLaboratories = async () => {
    // Check if user is authenticated before making API calls
    const token = getAuthToken('admin')
    if (!token) {
      console.warn('No authentication token found. Redirecting to login...')
      // Redirect immediately
      window.location.href = '/admin/login'
      return
    }

    try {
      setLoading(true)
      
      // First, load ALL laboratories for stats (no filters)
      const allLabsResponse = await getLaboratories({ page: 1, limit: 1000 })
      if (allLabsResponse.success && allLabsResponse.data) {
        const allLabsData = allLabsResponse.data.items || []
        
        // Load tests count for all laboratories (for stats)
        const allLabsWithTests = await Promise.all(
          allLabsData.map(async (lab) => {
            try {
              const testsResponse = await getLaboratoryTestsByLaboratory(lab._id || lab.id, { limit: 1 })
              const testsCount = testsResponse.success && testsResponse.data
                ? (testsResponse.data.pagination?.total || testsResponse.data.items?.length || 0)
                : 0
              
              return {
                id: lab._id || lab.id,
                name: lab.labName || '',
                ownerName: lab.ownerName || '',
                email: lab.email || '',
                phone: lab.phone || '',
                address: lab.address ? `${lab.address.line1 || ''}, ${lab.address.city || ''}, ${lab.address.state || ''}`.trim() : '',
                licenseNumber: lab.licenseNumber || '',
                status: lab.status === 'approved' ? 'verified' : lab.status || 'pending',
                registeredAt: lab.createdAt || new Date().toISOString(),
                totalTests: testsCount,
                rejectionReason: lab.rejectionReason || '',
              }
            } catch (err) {
              console.error(`Error loading tests count for laboratory ${lab._id}:`, err)
              return {
          id: lab._id || lab.id,
          name: lab.labName || '',
          ownerName: lab.ownerName || '',
          email: lab.email || '',
          phone: lab.phone || '',
          address: lab.address ? `${lab.address.line1 || ''}, ${lab.address.city || ''}, ${lab.address.state || ''}`.trim() : '',
          licenseNumber: lab.licenseNumber || '',
          status: lab.status === 'approved' ? 'verified' : lab.status || 'pending',
          registeredAt: lab.createdAt || new Date().toISOString(),
                totalTests: 0,
          rejectionReason: lab.rejectionReason || '',
              }
            }
          })
        )
        
        setAllLaboratories(allLabsWithTests)
      }
      
      // Then, load filtered laboratories for display with pagination
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
      const response = await getLaboratories(filters)
       // Debug log
      
      if (response.success && response.data) {
        const labsData = response.data.items || response.data || []
        const pagination = response.data.pagination || {}
        
         // Debug log
         // Debug log
         // Debug log
        
        // Load tests for each laboratory
        const labsWithTests = await Promise.all(
          labsData.map(async (lab) => {
            try {
              const testsResponse = await getLaboratoryTestsByLaboratory(lab._id || lab.id, { limit: 1000 })
              const tests = testsResponse.success && testsResponse.data
                ? (testsResponse.data.items || testsResponse.data || [])
                : []
              
              return {
                id: lab._id || lab.id,
                name: lab.labName || '',
                ownerName: lab.ownerName || '',
                email: lab.email || '',
                phone: lab.phone || '',
                address: lab.address ? `${lab.address.line1 || ''}, ${lab.address.city || ''}, ${lab.address.state || ''}`.trim() : '',
                licenseNumber: lab.licenseNumber || '',
                status: lab.status === 'approved' ? 'verified' : lab.status || 'pending',
                registeredAt: lab.createdAt || new Date().toISOString(),
                totalTests: tests.length,
                tests: tests,
                rejectionReason: lab.rejectionReason || '',
              }
            } catch (err) {
              console.error(`Error loading tests for laboratory ${lab._id}:`, err)
              return {
          id: lab._id || lab.id,
          name: lab.labName || '',
          ownerName: lab.ownerName || '',
          email: lab.email || '',
          phone: lab.phone || '',
          address: lab.address ? `${lab.address.line1 || ''}, ${lab.address.city || ''}, ${lab.address.state || ''}`.trim() : '',
          licenseNumber: lab.licenseNumber || '',
          status: lab.status === 'approved' ? 'verified' : lab.status || 'pending',
          registeredAt: lab.createdAt || new Date().toISOString(),
                totalTests: 0,
                tests: [],
          rejectionReason: lab.rejectionReason || '',
              }
            }
          })
        )
        
         // Debug log
        setLaboratories(labsWithTests)
        
        // Update pagination state
        setTotalPages(pagination.totalPages || 1)
        setTotalItems(pagination.total || 0)
      } else {
        console.error('❌ Invalid response from API:', response) // Debug log
        setLaboratories([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      // Don't log or show errors if it's an authentication error (redirect is happening)
      if (error.message && error.message.includes('Authentication token missing')) {
        // Redirect is already happening in apiRequest, just return
        return
      }
      console.error('Error loading laboratories:', error)
      toast.error(error.message || 'Failed to load laboratories')
      setLaboratories([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // Load laboratories from API
  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filter/search changes
  }, [statusFilter, searchTerm])

  useEffect(() => {
    // Check token before making any API calls
    const token = getAuthToken('admin')
    if (!token) {
      console.warn('No authentication token found. Redirecting to login...')
      window.location.href = '/admin/login'
      return
    }
    loadLaboratories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, currentPage])

  useEffect(() => {
    // Check token before making any API calls
    const token = getAuthToken('admin')
    if (!token) {
      console.warn('No authentication token found. Redirecting to login...')
      window.location.href = '/admin/login'
      return
    }
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
      loadLaboratories()
      } else {
        setCurrentPage(1) // Reset to page 1 when search changes
      }
    }, 500)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const handleApprove = async (labId) => {
    try {
      setProcessingId(labId)
      const response = await verifyLaboratory(labId)
      
      if (response.success) {
        toast.success('Laboratory approved successfully')
        await loadLaboratories()
      }
    } catch (error) {
      console.error('Error approving laboratory:', error)
      toast.error(error.message || 'Failed to approve laboratory')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (labId) => {
    setRejectingLabId(labId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingLabId) return
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejection.')
      return
    }

    try {
      setProcessingId(rejectingLabId)
      const response = await rejectLaboratory(rejectingLabId, rejectionReason.trim())
      
      if (response.success) {
        toast.success('Laboratory rejected successfully')
        await loadLaboratories()
        setShowRejectModal(false)
        setRejectingLabId(null)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Error rejecting laboratory:', error)
      toast.error(error.message || 'Failed to reject laboratory')
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewLaboratory = async (labId) => {
    try {
      setLoadingLaboratoryDetails(true)
      const response = await getLaboratoryById(labId)
      if (response.success && response.data) {
        setViewingLaboratory(response.data)
      } else {
        toast.error('Failed to load laboratory details')
      }
    } catch (error) {
      console.error('Error fetching laboratory details:', error)
      toast.error(error.message || 'Failed to load laboratory details')
    } finally {
      setLoadingLaboratoryDetails(false)
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

  // CRUD Operations - Removed unused functions (edit/delete not needed for approval workflow)

  return (
    <section className="flex flex-col gap-2 pb-20 pt-0">
      {/* Header */}
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratories Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage all registered laboratories</p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search laboratories by name, owner, or address..."
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Laboratories</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{allLaboratories.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'verified' ? 'border-emerald-500 bg-emerald-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {allLaboratories.filter((l) => l.status === 'verified' || l.status === 'approved').length}
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
            {allLaboratories.filter((l) => l.status === 'pending').length}
          </p>
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Tests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {allLaboratories.reduce((sum, l) => sum + l.totalTests, 0)}
          </p>
        </div>
      </div>

      {/* Laboratories List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Loading laboratories...</p>
          </div>
        ) : laboratories.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No laboratories found</p>
          </div>
        ) : (
          laboratories.map((lab) => (
            <article
              key={lab.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <IoFlaskOutline className="h-6 w-6 text-amber-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">{lab.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-600">Owner: {lab.ownerName}</p>
                      <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <IoLocationOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{lab.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoMailOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{lab.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoCallOutline className="h-4 w-4 shrink-0" />
                          <span>{lab.phone}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          License: {lab.licenseNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2 flex-col">
                      {getStatusBadge(lab.status)}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleViewLaboratory(lab.id)}
                          disabled={loadingLaboratoryDetails}
                          className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          <IoEyeOutline className="h-3.5 w-3.5" />
                          View
                        </button>
                      {lab.status === 'pending' && (
                          <>
                          <button
                            type="button"
                            onClick={() => handleApprove(lab.id)}
                            disabled={processingId === lab.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                          >
                            {processingId === lab.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClick(lab.id)}
                            disabled={processingId === lab.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                          </>
                        )}
                        </div>
                      {lab.status === 'rejected' && lab.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 max-w-xs">
                          <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-600">{lab.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>Tests: {lab.totalTests}</span>
                    <span>Registered: {formatDate(lab.registeredAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && laboratories.length > 0 && (
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

      {/* Reject Laboratory Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingLabId(null)
            setRejectionReason('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Laboratory</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingLabId(null)
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
                  Please provide a reason for rejecting this laboratory. This reason will be visible to the laboratory.
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
                  setRejectingLabId(null)
                  setRejectionReason('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === rejectingLabId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {processingId === rejectingLabId ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Laboratory Details Modal */}
      {viewingLaboratory && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingLaboratory(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Laboratory Details</h2>
              <button
                onClick={() => setViewingLaboratory(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {loadingLaboratoryDetails ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-slate-600">Loading laboratory details...</p>
                </div>
              ) : (
                <>
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Laboratory Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingLaboratory.labName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingLaboratory.ownerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingLaboratory.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingLaboratory.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">License Number</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingLaboratory.licenseNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <div className="mt-1">{getStatusBadge(viewingLaboratory.status === 'approved' ? 'verified' : viewingLaboratory.status || 'pending')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {viewingLaboratory.address && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Address</h3>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-900">
                          {viewingLaboratory.address.line1 || ''}
                          {viewingLaboratory.address.line2 && `, ${viewingLaboratory.address.line2}`}
                          {viewingLaboratory.address.city && `, ${viewingLaboratory.address.city}`}
                          {viewingLaboratory.address.state && `, ${viewingLaboratory.address.state}`}
                          {viewingLaboratory.address.postalCode && ` - ${viewingLaboratory.address.postalCode}`}
                          {viewingLaboratory.address.country && `, ${viewingLaboratory.address.country}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Additional Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingLaboratory.createdAt && (
                        <div>
                          <p className="text-xs text-slate-500">Registered Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {new Date(viewingLaboratory.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {viewingLaboratory.approvedAt && (
                        <div>
                          <p className="text-xs text-slate-500">Approved Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {new Date(viewingLaboratory.approvedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {viewingLaboratory.rejectionReason && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500">Rejection Reason</p>
                          <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg">{viewingLaboratory.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => setViewingLaboratory(null)}
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

export default AdminLaboratories


