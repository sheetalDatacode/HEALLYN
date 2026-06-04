import React, { useState, useEffect } from 'react'
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoShieldCheckmarkOutline,
  IoImageOutline,
  IoTrashOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoDownloadOutline
} from 'react-icons/io5'

const VerificationAndDocuments = (props) => {
  const {
    activeSection,
    setActiveSection,
    isEditing,
    formData,
    formatDate,
    handleSignatureUpload,
    handleRemoveSignature,
    normalizeImageUrl,
    getSupportHistory,
    useToast
  } = props;

  return (
    <>
      {/* KYC & Verification */}
      <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'kyc' ? null : 'kyc')}
          className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
        >
          <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">KYC & Verification</h2>
          {activeSection === 'kyc' ? (
            <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          ) : (
            <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          )}
        </button>

        {activeSection === 'kyc' && (
          <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <IoShieldCheckmarkOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                <span className="text-xs font-semibold text-slate-900">Verification Status</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${formData.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : formData.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                {formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1) : 'Not Verified'}
              </span>
            </div>

          </div>
        )}
      </div>

      {/* Digital Signature */}
      <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'signature' ? null : 'signature')}
          className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
        >
          <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Digital Signature</h2>
          {(activeSection === 'signature' || isEditing) ? (
            <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          ) : (
            <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          )}
        </button>

        {(activeSection === 'signature' || isEditing) && (
          <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
            {formData.digitalSignature?.imageUrl ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Signature Preview */}
                <div className="rounded-lg border-2 border-slate-200 bg-slate-50/50 p-4 sm:p-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-3">
                      <img
                        src={formData.digitalSignature.imageUrl}
                        alt="Digital Signature"
                        className="max-w-full h-auto max-h-48 sm:max-h-64 rounded-lg shadow-md bg-white p-2 border border-slate-200"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                    </div>
                    {formData.digitalSignature.uploadedAt && (
                      <p className="text-xs text-slate-500 mt-2">
                        Uploaded: {formatDate(formData.digitalSignature.uploadedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Options */}
                {isEditing && (
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Update Signature
                    </p>
                    <label
                      htmlFor="gallery-input-signature-update"
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-slate-300 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-[#11496c] hover:bg-slate-50 hover:text-[#11496c] cursor-pointer shadow-sm"
                    >
                      <IoImageOutline className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      Upload from Gallery
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="gallery-input-signature-update"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50"
                    >
                      <IoTrashOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                      Remove Signature
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Empty State */}
                <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 sm:p-8 text-center">
                  <IoImageOutline className="h-10 w-10 sm:h-14 sm:w-14 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm sm:text-base font-semibold text-slate-700 mb-1">
                    No signature uploaded
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Upload your digital signature image
                  </p>
                </div>

                {/* Upload Options */}
                {isEditing && (
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Choose Upload Method
                    </p>
                    <label
                      htmlFor="gallery-input-signature-empty"
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-slate-300 bg-white px-2 sm:px-3 py-2 text-center transition hover:border-[#11496c] hover:bg-slate-50 cursor-pointer shadow-sm"
                    >
                      <IoImageOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">Upload from Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="gallery-input-signature-empty"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
            {!isEditing && formData.digitalSignature?.imageUrl && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Click "Edit Profile" to change or remove your digital signature
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Documents */}
      <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'documents' ? null : 'documents')}
          className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
        >
          <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Uploaded Documents</h2>
          {activeSection === 'documents' ? (
            <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          ) : (
            <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          )}
        </button>

        {activeSection === 'documents' && (
          <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
            {formData.documents && Array.isArray(formData.documents) && formData.documents.length > 0 ? (
              <div className="space-y-2">
                {formData.documents.map((doc, index) => {
                  const normalizedUrl = normalizeImageUrl(doc.fileUrl || '')
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IoDocumentTextOutline className="h-5 w-5 text-[#11496c] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-700 block truncate">{doc.name || 'Document'}</span>
                          {doc.uploadedAt && (
                            <span className="text-xs text-slate-500">
                              Uploaded: {formatDate(doc.uploadedAt)}
                            </span>
                          )}
                        </div>
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
            ) : (
              <p className="text-sm text-slate-500 italic">No documents uploaded</p>
            )}
          </div>
        )}
      </div>

      {/* Support History */}
      <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'support' ? null : 'support')}
          className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
        >
          <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Support History</h2>
          {activeSection === 'support' ? (
            <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          ) : (
            <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
          )}
        </button>

        {activeSection === 'support' && (
          <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
            <SupportHistory 
              role="doctor" 
              getSupportHistory={getSupportHistory} 
              useToast={useToast} 
            />
          </div>
        )}
      </div>
    </>
  );
};

// Support History Component
const SupportHistory = ({ role, getSupportHistory, useToast }) => {
  const [supportRequests, setSupportRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchSupportHistory = async () => {
      try {
        setIsLoading(true)
        const response = await getSupportHistory()

        // Handle different response structures
        let tickets = []
        if (Array.isArray(response)) {
          tickets = response
        } else if (response && response.success && response.data) {
          // Check if data is an array or has items property
          if (Array.isArray(response.data)) {
            tickets = response.data
          } else if (response.data.items && Array.isArray(response.data.items)) {
            tickets = response.data.items
          } else if (response.data.tickets && Array.isArray(response.data.tickets)) {
            tickets = response.data.tickets
          } else if (response.data.history && Array.isArray(response.data.history)) {
            tickets = response.data.history
          }
        } else if (response && response.tickets && Array.isArray(response.tickets)) {
          tickets = response.tickets
        } else if (response && response.data && Array.isArray(response.data)) {
          tickets = response.data
        }

        // Transform tickets to match component structure
        const transformedTickets = tickets.map(ticket => ({
          id: ticket._id || ticket.id,
          _id: ticket._id || ticket.id,
          note: ticket.message || ticket.subject || ticket.note || '',
          subject: ticket.subject || ticket.message || '',
          message: ticket.message || ticket.subject || '',
          status: ticket.status || 'pending',
          createdAt: ticket.createdAt || ticket.date || new Date().toISOString(),
          updatedAt: ticket.updatedAt || ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
          adminNote: ticket.adminNote || ticket.response || ticket.adminResponse || '',
          priority: ticket.priority || 'medium',
        }))

        setSupportRequests(Array.isArray(transformedTickets) ? transformedTickets : [])
      } catch (error) {
        console.error('Error fetching support history:', error)
        toast.error('Failed to load support history')
        setSupportRequests([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSupportHistory()
  }, [role, toast])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

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

  // Ensure supportRequests is always an array
  const safeSupportRequests = Array.isArray(supportRequests) ? supportRequests : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#11496c] border-t-transparent" />
      </div>
    )
  }

  if (safeSupportRequests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">No support requests yet</p>
        <p className="mt-1 text-xs text-slate-500">Your support request history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {safeSupportRequests.map((request, index) => (
        <div key={request._id || request.id || `support-${index}-${request.createdAt || Date.now()}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900 flex-1">{request.note || request.message || request.subject || 'Support Request'}</p>
            {getStatusBadge(request.status)}
          </div>
          {request.adminNote && (
            <div className="mt-2 rounded bg-blue-50 p-2">
              <p className="text-xs font-semibold text-blue-900">Admin Response:</p>
              <p className="mt-1 text-xs text-blue-800">{request.adminNote}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span>Submitted: {formatDate(request.createdAt)}</span>
            {request.updatedAt && request.updatedAt !== request.createdAt && (
              <span>Updated: {formatDate(request.updatedAt)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}



export default VerificationAndDocuments;
