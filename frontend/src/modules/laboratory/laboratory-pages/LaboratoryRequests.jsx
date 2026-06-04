import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCloseCircleOutline,
  IoFlaskOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoArrowForwardOutline,
  IoWalletOutline,
} from 'react-icons/io5'
import { getLaboratoryRequests } from '../laboratory-services/laboratoryService'
import Pagination from '../../../components/Pagination'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const LaboratoryRequests = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [responseAmount, setResponseAmount] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    fetchRequests()
  }, [currentPage])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const response = await getLaboratoryRequests({ 
        page: currentPage, 
        limit: itemsPerPage 
      })
      
      // Transform backend response to match frontend structure
      if (response.success && response.data) {
        const requestsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || response.data.requests || []
        const pagination = response.data.pagination || {}
        
        setRequests(requestsData)
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || requestsData.length) / itemsPerPage) || 1)
        setTotalItems(pagination.total || requestsData.length)
      } else {
        const transformedRequests = Array.isArray(response) ? response : (response.data || response.requests || [])
        setRequests(transformedRequests)
        setTotalPages(Math.ceil(transformedRequests.length / itemsPerPage) || 1)
        setTotalItems(transformedRequests.length)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load requests')
      setRequests([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRequest = (request) => {
    setSelectedRequest(request)
    setResponseAmount('')
    setResponseMessage('')
    setScheduledDate('')
    setScheduledTime('')
    setShowResponseModal(true)
  }

  const handleRejectRequest = async (request) => {
    if (!request) return

    const confirmReject = window.confirm(
      `Are you sure you want to reject this request from ${request.patient?.name || 'patient'}?`
    )

    if (!confirmReject) return

    setIsProcessing(true)

    try {
      // TODO: Add backend endpoint for rejecting requests
      // For now, update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === request.id || req._id === request._id
            ? { ...req, status: 'rejected', rejectedAt: new Date().toISOString() }
            : req
        )
      )
      toast.success('Request rejected successfully')
      // Refresh requests after rejection
      await fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseResponseModal = () => {
    setShowResponseModal(false)
    setSelectedRequest(null)
    setResponseAmount('')
    setResponseMessage('')
    setScheduledDate('')
    setScheduledTime('')
  }

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return
    if (!responseAmount || !responseMessage) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsProcessing(true)

    try {
      // TODO: Add backend endpoint for accepting/responding to requests
      // For now, update local state
      const responseData = {
        message: responseMessage,
        responseBy: 'MediLab Diagnostics Team',
        responseTime: new Date().toISOString(),
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
      }

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          (req.id === selectedRequest.id || req._id === selectedRequest._id)
            ? {
                ...req,
                status: 'accepted',
                responseDate: new Date().toISOString().split('T')[0],
                totalAmount: parseFloat(responseAmount),
                message: responseMessage,
                laboratoryResponse: responseData,
              }
            : req
        )
      )

      toast.success(`Response sent successfully to ${selectedRequest.patient?.name || 'patient'}!`)
      handleCloseResponseModal()
      // Refresh requests after response
      await fetchRequests()
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('Failed to send response')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'completed':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <IoTimeOutline className="h-3 w-3" />
      case 'accepted':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      case 'rejected':
        return <IoCloseCircleOutline className="h-3 w-3" />
      case 'completed':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Response'
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const pendingRequests = requests.filter((req) => req.status === 'pending')
  const respondedRequests = requests.filter((req) => req.status !== 'pending')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#11496c] border-t-transparent mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-4 py-6 sm:px-6">
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Requests</h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <article
                    key={request.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icon */}
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                          style={{
                            background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                            boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)',
                          }}
                        >
                          <IoFlaskOutline className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title and Status */}
                          <div className="mb-3">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="flex-1 min-w-0 text-base font-bold text-slate-900 leading-tight pr-2 line-clamp-2">
                                {request.testName || request.test?.name || request.investigations?.[0]?.name || 'Test Request'}
                              </h3>
                              <div className="shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${getStatusColor(request.status)}`}
                                >
                                  {getStatusIcon(request.status)}
                                  <span>{getStatusLabel(request.status)}</span>
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Requested: {formatDate(request.requestDate || request.createdAt || request.date)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Patient Information Section */}
                      {(request.patient || request.patientId) && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm p-3.5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-6 rounded-lg bg-[#11496c]/10 flex items-center justify-center shrink-0">
                              <IoPersonOutline className="h-3.5 w-3.5 text-[#11496c]" />
                            </div>
                            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                              Patient Information
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 flex items-center gap-1.5 text-[10px] mb-1">
                              <span className="text-slate-700 font-semibold">{request.patient?.name || 'Patient'}</span>
                              {request.patient?.age && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500 text-[9px]">
                                    {request.patient.age} yrs, {request.patient.gender || ''}
                                  </span>
                                </>
                              )}
                            </div>
                            {request.patient?.phone && (
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
                                <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{request.patient.phone}</span>
                              </div>
                            )}
                            {request.patient?.email && (
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
                                <IoMailOutline className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{request.patient.email}</span>
                              </div>
                            )}
                            {request.patient?.address && (
                              <div className="col-span-2 flex items-start gap-1.5 text-[9px] text-slate-600 mt-0.5">
                                <IoLocationOutline className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                                <span className="leading-tight line-clamp-2 flex-1">{request.patient.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Doctor Information */}
                      {request.doctor && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 px-1">
                          <IoDocumentTextOutline className="h-3 w-3 shrink-0" />
                          <span className="leading-tight">
                            Prescribed by: <span className="font-medium text-slate-700">{request.doctor.name}</span> ({request.doctor.specialty})
                          </span>
                        </div>
                      )}

                      {/* Collection Type */}
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600">
                        <IoLocationOutline className="h-3 w-3 shrink-0" />
                        <span>
                          Collection Type: <span className="font-semibold">{request.collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(request)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#11496c] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoCheckmarkCircleOutline className="h-3 w-3 shrink-0" />
                        Accept & Respond
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(request)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[rgba(220,38,38,0.3)] transition-all hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoCloseCircleOutline className="h-3 w-3 shrink-0" />
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Responded Requests */}
          {respondedRequests.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Responded Requests</h2>
              <div className="space-y-4">
                {respondedRequests.map((request) => (
                  <article
                    key={request.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icon */}
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                          style={{
                            background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                            boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)',
                          }}
                        >
                          <IoFlaskOutline className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title and Status */}
                          <div className="mb-3">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="flex-1 min-w-0 text-base font-bold text-slate-900 leading-tight pr-2 line-clamp-2">
                                {request.testName || request.test?.name || request.investigations?.[0]?.name || 'Test Request'}
                              </h3>
                              <div className="shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${getStatusColor(request.status)}`}
                                >
                                  {getStatusIcon(request.status)}
                                  <span>{getStatusLabel(request.status)}</span>
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 mb-1">{request.patient?.name || request.patientName || 'Patient'}</p>
                            <p className="text-[10px] text-slate-500">
                              {formatDate(request.requestDate || request.createdAt || request.date)} • {request.responseDate && formatDate(request.responseDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Laboratory Response Section */}
                      {request.laboratoryResponse && (
                        <div className="mt-4 rounded-xl border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.05)] p-3.5">
                          <div className="flex items-center gap-2 mb-3">
                            <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
                            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                              Your Response
                            </h4>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed mb-3">{request.laboratoryResponse.message}</p>
                          {request.totalAmount && (
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200 mb-3">
                              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Total Amount:</span>
                              <span className="text-sm font-bold text-[#11496c]">{formatCurrency(request.totalAmount)}</span>
                            </div>
                          )}
                          {request.laboratoryResponse.scheduledDate && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-600">
                              <IoTimeOutline className="h-3 w-3 shrink-0" />
                              <span>
                                Scheduled: {formatDate(request.laboratoryResponse.scheduledDate)} {request.laboratoryResponse.scheduledTime && `at ${request.laboratoryResponse.scheduledTime}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {requests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
              <p className="font-semibold">No requests found.</p>
              <p className="mt-1 text-sm">Requests from patients will appear here.</p>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  setCurrentPage(page)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                loading={isLoading}
              />
            </div>
          )}
        </div>
      </main>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Respond to Request</h2>
              <button
                type="button"
                onClick={handleCloseResponseModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Test:</p>
                <p className="text-sm text-slate-600">{selectedRequest.testName || selectedRequest.test?.name || 'Test Request'}</p>
                <p className="text-xs text-slate-500 mt-1">Patient: {selectedRequest.patient?.name || 'Patient'}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={responseAmount}
                  onChange={(e) => setResponseAmount(e.target.value)}
                  placeholder="Enter amount in ₹"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Response Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Enter your response message..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                />
              </div>

              {selectedRequest.collectionType === 'home' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      placeholder="e.g., 9:00 AM - 11:00 AM"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  </div>
                </>
              )}

              {selectedRequest.collectionType === 'lab' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Scheduled Time
                    </label>
                    <input
                      type="text"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      placeholder="e.g., 10:00 AM"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={handleCloseResponseModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitResponse}
                disabled={isProcessing || !responseAmount || !responseMessage}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="h-4 w-4" />
                    Send Response
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LaboratoryRequests

