import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useToast } from '../../../contexts/ToastContext'
import {
  getLaboratoryRequestOrders,
  confirmLaboratoryRequestOrder,
  updateLaboratoryRequestOrderStatus,
} from '../laboratory-services/laboratoryService'
import { getAuthToken, getFileUrl } from '../../../utils/apiClient'
import Pagination from '../../../components/Pagination'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoFlaskOutline,
  IoMedicalOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoCallOutline,
  IoLocationOutline,
} from 'react-icons/io5'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatAddress = (address) => {
  if (!address) return ''
  if (typeof address === 'string') return address
  if (typeof address === 'object') {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ]
    return parts.filter(Boolean).join(', ')
  }
  return ''
}

const LaboratoryRequestOrders = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await getLaboratoryRequestOrders({ limit: 100 })

      if (response.success && response.data) {
        const requestsData = response.data.items || response.data || []
        const pagination = response.data.pagination || {}

        // Transform backend data to match frontend format
        const transformedRequests = requestsData.map(req => {
          if (!req) return null

          const patient = (req.patientId && typeof req.patientId === 'object') ? req.patientId : {}
          const prescription = (req.prescriptionId && typeof req.prescriptionId === 'object') ? req.prescriptionId : {}
          const adminResponse = req.adminResponse || {}
          const tests = Array.isArray(adminResponse.tests) ? adminResponse.tests : []

          // Get investigations from tests (backend already filters by labId, so all tests are for this lab)
          const investigations = tests
            .map(test => {
              if (typeof test === 'string') return test
              return test?.testName || test?.name || null
            })
            .filter(Boolean) // Remove any undefined/null values

          // Find associated order to get status
          const orders = Array.isArray(req.orders) ? req.orders : []
          const order = orders.length > 0 ? orders[0] : null

          return {
            id: req._id || req.id,
            requestId: req._id || req.id,
            patientName: patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.name || req.patientName || 'Unknown Patient',
            patientPhone: patient.phone || req.patientPhone,
            patientAddress: formatAddress(patient.address || req.patientAddress || req.deliveryAddress),
            patientEmail: patient.email || req.patientEmail,
            patient: patient,
            prescription: {
              doctorName: prescription.doctorName || prescription.doctor?.name || 'Doctor',
              doctorSpecialty: prescription.doctorSpecialty || prescription.specialty,
              diagnosis: prescription.diagnosis || req.diagnosis,
              investigations: prescription.investigations || investigations,
              pdfUrl: prescription.pdfUrl || req.prescriptionPdfUrl,
              issuedAt: prescription.createdAt || prescription.issuedAt,
            },
            prescriptionPdfUrl: prescription.pdfUrl || req.prescriptionPdfUrl,
            visitType: req.visitType || (req.deliveryOption === 'home_delivery' ? 'home' : 'lab'),
            investigations: investigations.length > 0 ? investigations : (prescription.investigations || []),
            totalAmount: adminResponse.billingSummary?.totalAmount || adminResponse.totalAmount || order?.totalAmount || 0,
            status: order?.status || req.status || 'pending',
            labAccepted:
              ['accepted', 'confirmed'].includes(order?.status) ||
              ['accepted', 'confirmed'].includes(req.status) ||
              false,
            labRejected: order?.status === 'rejected' || false,
            labConfirmed: order?.status === 'completed' || false,
            acceptedAt: order?.acceptedAt || order?.createdAt,
            rejectedAt: order?.rejectedAt,
            createdAt: req.createdAt || req.requestDate,
            paymentConfirmed: req.paymentStatus === 'paid' || req.paymentStatus === 'completed' || false,
            paidAt: req.paidAt,
            order: order,
          }
        }).filter(Boolean).filter(req => req.status !== 'accepted') // Only show confirmed/completed requests to lab

        // Sort by date (newest first)
        transformedRequests.sort((a, b) => {
          const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })

        setRequests(transformedRequests)
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || transformedRequests.length) / itemsPerPage) || 1)
        setTotalItems(pagination.total || transformedRequests.length)
      } else {
        setRequests([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests([])
      setTotalPages(1)
      setTotalItems(0)
      toast.error('Failed to load request orders')
    } finally {
      setIsLoading(false)
    }
  }, [toast, currentPage])

  useEffect(() => {
    const token = getAuthToken('laboratory')
    if (!token) {
      return
    }
    loadRequests()
    // Refresh every 30 seconds to get new requests
    const interval = setInterval(() => {
      const currentToken = getAuthToken('laboratory')
      if (currentToken) {
        loadRequests()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [loadRequests])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const handleRejectOrder = async (requestId) => {
    try {
      // Confirm rejection
      const confirmReject = window.confirm(
        'Are you sure you want to reject this order? This action cannot be undone.'
      )
      if (!confirmReject) return

      // First, confirm the order to create it if it doesn't exist
      // Then update its status to rejected
      try {
        // Try to confirm first (creates order if doesn't exist)
        await confirmLaboratoryRequestOrder(requestId)
        // Then update status to rejected
        await updateLaboratoryRequestOrderStatus(requestId, 'rejected')
      } catch (confirmError) {
        // If order already exists, just update status
        await updateLaboratoryRequestOrderStatus(requestId, 'rejected')
      }

      // Update local state
      const updatedRequests = requests.map(r => {
        if (r.id === requestId || r.requestId === requestId) {
          return {
            ...r,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            labRejected: true,
          }
        }
        return r
      })
      setRequests(updatedRequests)

      loadRequests()
      toast.success('Order rejected successfully.')
    } catch (error) {
      console.error('Error rejecting order:', error)
      toast.error('Error rejecting order. Please try again.')
    }
  }

  const handleAcceptOrder = async (requestId) => {
    try {
      await confirmLaboratoryRequestOrder(requestId)

      // Update local state
      const updatedRequests = requests.map(r => {
        if (r.id === requestId || r.requestId === requestId) {
          return {
            ...r,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            labAccepted: true,
          }
        }
        return r
      })
      setRequests(updatedRequests)

      loadRequests()
      toast.success('Order accepted successfully!')
    } catch (error) {
      console.error('Error accepting order:', error)
      toast.error('Error accepting order. Please try again.')
    }
  }

  const handleConfirmOrder = async (requestId) => {
    try {
      await updateLaboratoryRequestOrderStatus(requestId, 'completed')

      // Update local state
      const updatedRequests = requests.map(r => {
        if (r.id === requestId || r.requestId === requestId) {
          return {
            ...r,
            status: 'completed',
            confirmedAt: new Date().toISOString(),
            labConfirmed: true,
          }
        }
        return r
      })
      setRequests(updatedRequests)

      loadRequests()
      toast.success('Order confirmed successfully!')
    } catch (error) {
      console.error('Error confirming order:', error)
      toast.error('Error confirming order. Please try again.')
    }
  }

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    if (filter === 'pending') return request.status === 'pending'
    if (filter === 'completed') return request.status === 'completed'
    return true
  })

  const generatePDF = (request) => {
    const prescription = request.prescription
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108]
    const lightBlueColor = [230, 240, 255]
    const lightGrayColor = [245, 245, 245]
    let yPos = margin

    // Header
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Heallyn Prescription', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Doctor Name and Specialty
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescription?.doctorName || 'Doctor', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(prescription?.doctorSpecialty || 'Specialty', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Patient Info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient Information', margin, yPos)
    yPos += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${request.patientName || 'N/A'}`, margin, yPos)
    yPos += 4
    if (request.patientPhone) {
      doc.text(`Phone: ${request.patientPhone}`, margin, yPos)
      yPos += 4
    }
    if (request.patientAddress) {
      const addressLines = doc.splitTextToSize(`Address: ${request.patientAddress}`, pageWidth - 2 * margin)
      addressLines.forEach(line => {
        doc.text(line, margin, yPos)
        yPos += 4
      })
    } else {
      yPos += 4
    }
    yPos += 2

    // Diagnosis
    if (prescription?.diagnosis) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Diagnosis', margin, yPos)
      yPos += 6
      const diagnosisHeight = 8
      doc.setFillColor(...lightBlueColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.diagnosis, margin + 4, yPos + 2)
      yPos += diagnosisHeight + 4
    }

    // Investigations/Tests
    if (prescription?.investigations && prescription.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Lab Tests Required', margin, yPos)
      yPos += 6

      prescription.investigations.forEach((test, idx) => {
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }

        const cardHeight = 18
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')

        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
        doc.text(testName, margin + 4, yPos + 3)

        if (typeof test === 'object' && test.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          const notesLines = doc.splitTextToSize(test.notes, pageWidth - 2 * margin - 8)
          notesLines.forEach((line, lineIdx) => {
            doc.text(line, margin + 4, yPos + 8 + (lineIdx * 4))
          })
        }

        yPos += cardHeight + 4
      })
    }

    // Date
    yPos += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Issued: ${formatDate(prescription?.issuedAt)}`, margin, yPos)

    return doc
  }

  const handleViewPDF = (request) => {
    const doc = generatePDF(request)
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  const handleDownloadPDF = (request) => {
    const doc = generatePDF(request)
    const fileName = `Prescription_${request.patientName || 'Patient'}_${request.id}.pdf`
    doc.save(fileName)
  }

  const handleMarkCompleted = async (requestId) => {
    try {
      await updateLaboratoryRequestOrderStatus(requestId, 'completed')
      loadRequests()
      setSelectedRequest(null)
      toast.success('Order marked as completed!')
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Error marking order as completed. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Requests List */}

      {/* Requests List */}
      <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 lg:col-span-4">
            <IoFlaskOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No requests found</p>
            <p className="text-xs text-slate-400 mt-1">Patient lab test requests will appear here</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const getStatusIcon = (status) => {
              if (status === 'completed') return IoCheckmarkCircleOutline
              if (status === 'confirmed' || status === 'payment_pending') return IoCheckmarkCircleOutline
              return IoTimeOutline
            }
            const StatusIcon = getStatusIcon(request.status)
            const investigations = request.investigations || request.prescription?.investigations || []
            const investigationsCount = investigations.length

            return (
              <article
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`group relative rounded-xl border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98] lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start ${request.visitType === 'home'
                  ? 'border-emerald-200 bg-emerald-50/30 lg:border-emerald-300/50'
                  : 'border-slate-200 bg-white lg:border-slate-300/50'
                  }`}
              >
                {/* Status Icon - Top Right Absolute */}
                <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
                  <span className={`inline-flex items-center justify-center rounded-full p-1.5 border shadow-sm ${request.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : request.status === 'payment_pending'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : request.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : request.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                    title={request.status}
                  >
                    <StatusIcon className="h-4 w-4" />
                  </span>
                </div>

                {/* Section 1: Patient Info (Span 5) */}
                <div className="lg:col-span-6 flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white shadow-sm">
                    <IoPersonOutline className="h-6 w-6" />
                  </div>

                  {/* Patient Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap pr-8">
                      <h3 className="text-base font-bold text-slate-900 leading-none">
                        {request.patientName || request.patient?.name || 'Unknown Patient'}
                      </h3>
                      {request.visitType && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${request.visitType === 'home'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                          {request.visitType === 'home' ? (
                            <>
                              <IoHomeOutline className="h-3 w-3" />
                              HOME
                            </>
                          ) : (
                            <>
                              <IoBusinessOutline className="h-3 w-3" />
                              LAB
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      {(request.patientPhone || request.patient?.phone) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <IoCallOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
                          <span className="font-medium">{request.patientPhone || request.patient?.phone}</span>
                        </div>
                      )}
                      {(request.patientAddress || request.patient?.address) && (
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <IoLocationOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0 mt-0.5" />
                          <span className="leading-snug">{request.patientAddress || request.patient?.address || 'Address not provided'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Medical/Order Info (Span 6) */}
                <div className="lg:col-span-6 mt-4 lg:mt-0 space-y-3 lg:border-l lg:border-slate-200 lg:pl-6">


                  {/* Tests Summary & Date */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        <IoFlaskOutline className="h-3.5 w-3.5" />
                        {investigationsCount} Tests
                      </span>
                    </div>

                    {request.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <IoCalendarOutline className="h-3.5 w-3.5" />
                        {formatDateTime(request.createdAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Actions (View/Download always, Accept when allowed) */}
                {request.status !== 'rejected' && request.status !== 'completed' && (
                  <div className="lg:col-span-12 mt-4 pt-4 border-t border-slate-200/60 flex flex-row items-center justify-end gap-2">
                    {/* Icon Only View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const pdfUrl = request.prescriptionPdfUrl || request.prescription?.pdfUrl
                        if (pdfUrl && pdfUrl !== '#' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                          window.open(getFileUrl(pdfUrl), '_blank')
                        } else {
                          handleViewPDF(request)
                        }
                      }}
                      className="p-2 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                      title="View Prescription"
                    >
                      <IoEyeOutline className="h-4 w-4" />
                    </button>

                    {/* Compact Download Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadPDF(request)
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                    >
                      <IoDownloadOutline className="h-3.5 w-3.5" />
                      Download
                    </button>

                    {/* Compact Accept Button */}
                    {((request.paymentConfirmed || ['payment_pending', 'pending', 'confirmed'].includes(request.status)) &&
                      !request.labAccepted &&
                      !request.labRejected &&
                      !['accepted', 'confirmed'].includes(request.status)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAcceptOrder(request.id || request.requestId)
                          }}
                          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95"
                        >
                          <IoCheckmarkCircleOutline className="h-4 w-4" />
                          Accept
                        </button>
                      )}

                    {/* Accepted disabled state */}
                    {(request.labAccepted || request.status === 'accepted' || request.status === 'confirmed') && !request.labRejected && (
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 cursor-not-allowed"
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        Accepted
                      </button>
                    )}
                  </div>
                )}

                {/* Rejected Badge */}
                {(request.status === 'rejected' || request.labRejected) && (
                  <div className="lg:col-span-12 mt-4 pt-4 border-t border-slate-200/60 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      <IoCloseCircleOutline className="h-3.5 w-3.5" />
                      Use Rejected This Order
                    </span>
                  </div>
                )}

                {/* Accepted Badge */}
                {request.status === 'accepted' && request.labAccepted && !request.labConfirmed && (
                  <div className="lg:col-span-12 mt-4 pt-4 border-t border-slate-200/60 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                      Order Accepted
                    </span>
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-4">
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

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Request Details</h2>
                  <p className="text-xs text-white/80">{selectedRequest.patientName || 'Patient'}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Visit Type Badge */}
              {selectedRequest.visitType && (
                <div className={`rounded-xl border p-4 ${selectedRequest.visitType === 'home'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-blue-50 border-blue-200'
                  }`}>
                  <div className="flex items-center gap-2">
                    {selectedRequest.visitType === 'home' ? (
                      <>
                        <IoHomeOutline className="h-5 w-5 text-emerald-700" />
                        <div>
                          <h3 className="text-sm font-semibold text-emerald-900">Home Sample Collection</h3>
                          <p className="text-xs text-emerald-700 mt-0.5">Sample will be collected from patient's home address</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <IoBusinessOutline className="h-5 w-5 text-blue-700" />
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900">Lab Visit</h3>
                          <p className="text-xs text-blue-700 mt-0.5">Patient will visit the lab for sample collection</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Information */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Name:</span>
                    <span className="ml-2 text-slate-900 font-semibold">{selectedRequest.patientName || selectedRequest.patient?.name || 'N/A'}</span>
                  </div>
                  {(selectedRequest.patientPhone || selectedRequest.patient?.phone) && (
                    <div className="flex items-center gap-2">
                      <IoCallOutline className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-medium text-slate-700">Phone:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.patientPhone || selectedRequest.patient?.phone}</span>
                      </div>
                    </div>
                  )}
                  {(selectedRequest.patientAddress || selectedRequest.patient?.address) && (
                    <div className="flex items-start gap-2">
                      <IoLocationOutline className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-slate-700">Address:</span>
                        <p className="mt-0.5 text-slate-900 leading-relaxed">{selectedRequest.patientAddress || selectedRequest.patient?.address}</p>
                        {selectedRequest.visitType === 'home' && (
                          <span className="mt-1 inline-block text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Sample Collection Address</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(selectedRequest.patientEmail || selectedRequest.patient?.email) && (
                    <div>
                      <span className="font-medium text-slate-700">Email:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.patientEmail || selectedRequest.patient?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Information */}
              {selectedRequest.prescription && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <IoMedicalOutline className="h-4 w-4" />
                    Doctor Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Name:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.prescription.doctorName || 'N/A'}</span>
                    </div>
                    {selectedRequest.prescription.doctorSpecialty && (
                      <div>
                        <span className="font-medium text-slate-700">Specialty:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.prescription.doctorSpecialty}</span>
                      </div>
                    )}
                    {selectedRequest.prescription.diagnosis && (
                      <div>
                        <span className="font-medium text-slate-700">Diagnosis:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.prescription.diagnosis}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lab Tests */}
              {(selectedRequest.investigations && selectedRequest.investigations.length > 0) || (selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0) ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <IoFlaskOutline className="h-4 w-4" />
                    Lab Tests Required ({(selectedRequest.investigations || selectedRequest.prescription?.investigations || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(selectedRequest.investigations || selectedRequest.prescription?.investigations || []).map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testNotes = typeof test === 'object' ? test.notes : null
                      const testPrice = typeof test === 'object' ? test.price : null
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-start gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">{testName}</p>
                              {testNotes && (
                                <p className="mt-1 text-xs text-slate-600">{testNotes}</p>
                              )}
                              {testPrice && (
                                <p className="mt-1 text-xs font-semibold text-[#11496c]">Price: ₹{Number(testPrice).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Prescription PDF */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <IoDocumentTextOutline className="h-4 w-4" />
                  Prescription PDF {selectedRequest.prescriptionPdfUrl || selectedRequest.prescription?.pdfUrl ? '(From Doctor)' : ''}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const pdfUrl = selectedRequest.prescriptionPdfUrl || selectedRequest.prescription?.pdfUrl
                      if (pdfUrl && pdfUrl !== '#' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                        window.open(pdfUrl, '_blank')
                      } else {
                        handleViewPDF(selectedRequest)
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white hover:shadow-md"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                    <span>View PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      const pdfUrl = selectedRequest.prescriptionPdfUrl || selectedRequest.prescription?.pdfUrl
                      if (pdfUrl && pdfUrl !== '#' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                        const link = document.createElement('a')
                        link.href = pdfUrl
                        link.download = `Prescription_${selectedRequest.patientName || selectedRequest.patient?.name || 'Patient'}_${selectedRequest.id || Date.now()}.pdf`
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      } else {
                        handleDownloadPDF(selectedRequest)
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Request Date */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <IoTimeOutline className="h-4 w-4" />
                <span>Request Date: {formatDateTime(selectedRequest.createdAt)}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                {/* Accept Button - Show when payment confirmed and order not yet accepted/rejected */}
                {((selectedRequest.paymentConfirmed || selectedRequest.status === 'payment_pending' || selectedRequest.status === 'pending' || selectedRequest.status === 'confirmed') && !selectedRequest.labAccepted && !selectedRequest.labRejected && selectedRequest.status !== 'completed' && selectedRequest.status !== 'rejected' && selectedRequest.status !== 'accepted') && (
                  <button
                    onClick={() => {
                      handleAcceptOrder(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Accept Order</span>
                  </button>
                )}
                {/* Confirm Order Button - Show when order is accepted and payment confirmed but not yet confirmed */}
                {(selectedRequest.status === 'accepted' || selectedRequest.status === 'confirmed' || selectedRequest.status === 'payment_pending') && selectedRequest.labAccepted && !selectedRequest.labConfirmed && selectedRequest.paymentConfirmed && (
                  <button
                    onClick={() => {
                      handleConfirmOrder(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Confirm Order</span>
                  </button>
                )}
                {/* Rejected Status Badge */}
                {(selectedRequest.status === 'rejected' || selectedRequest.labRejected) && (
                  <div className="w-full rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 flex items-center justify-center gap-2">
                    <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Order Rejected</span>
                  </div>
                )}
                {/* Accepted Status Badge */}
                {selectedRequest.status === 'accepted' && selectedRequest.labAccepted && !selectedRequest.labConfirmed && (
                  <div className="w-full rounded-xl bg-green-50 border-2 border-green-200 px-4 py-3 flex items-center justify-center gap-2">
                    <IoCheckmarkCircleOutline className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Order Accepted</span>
                  </div>
                )}
                {/* Mark as Completed Button - Show when status is pending */}
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleMarkCompleted(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LaboratoryRequestOrders

