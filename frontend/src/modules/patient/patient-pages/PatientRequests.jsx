import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCloseCircleOutline,
  IoBagHandleOutline,
  IoFlaskOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoDownloadOutline,
} from 'react-icons/io5'
import {
  getPatientRequests,
  confirmRequestPayment,
  cancelPatientRequest,
  createRequestPaymentOrder
} from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
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
  if (!amount || amount === 0) return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PatientRequests = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [requests, setRequests] = useState([])
  const [receiptPdfUrl, setReceiptPdfUrl] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientRequests()

        if (response.success && response.data) {
          const requestsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || []

          const transformed = requestsData.map(request => {
            const isLab = request.type === 'book_test_visit' || request.type === 'lab'
            const isPharmacy = request.type === 'order_medicine' || request.type === 'pharmacy'

            // Group medicines by pharmacy
            const medicinesByPharmacy = {}
            if (request.adminResponse?.medicines && Array.isArray(request.adminResponse.medicines)) {
              request.adminResponse.medicines.forEach(med => {
                const pharmId = med.pharmacyId?.toString() || med.pharmacyId || 'unknown'
                if (!medicinesByPharmacy[pharmId]) {
                  medicinesByPharmacy[pharmId] = {
                    pharmacyId: pharmId,
                    pharmacyName: med.pharmacyName || 'Pharmacy',
                    medicines: []
                  }
                }
                medicinesByPharmacy[pharmId].medicines.push({
                  name: med.name,
                  dosage: med.dosage,
                  quantity: med.quantity,
                  price: med.price,
                  total: (med.price || 0) * (med.quantity || 1)
                })
              })
            }

            // Group tests by lab
            const testsByLab = {}
            if (request.adminResponse?.tests && Array.isArray(request.adminResponse.tests)) {
              request.adminResponse.tests.forEach(test => {
                const labId = test.labId?.toString() || test.labId || 'unknown'
                if (!testsByLab[labId]) {
                  testsByLab[labId] = {
                    labId: labId,
                    labName: test.labName || 'Laboratory',
                    tests: []
                  }
                }
                testsByLab[labId].tests.push({
                  testName: test.testName,
                  price: test.price
                })
              })
            }

            const orders = Array.isArray(request.orders) ? request.orders : []
            const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null
            // Prioritize order status if available, but don't revert to 'accepted' if request is already 'confirmed' (paid)
            // This prevents the 'Pay' button from reappearing when lab accepts the order
            let status = latestOrder?.status || request.status || 'pending'
            if (request.status === 'confirmed' && latestOrder?.status === 'accepted') {
              status = 'confirmed'
            }

            return {
              id: request._id || request.id,
              _id: request._id || request.id,
              type: isLab ? 'lab' : isPharmacy ? 'pharmacy' : request.type,
              providerName: isLab
                ? (request.adminResponse?.lab?.labName || request.adminResponse?.labs?.[0]?.labName || 'Laboratory')
                : 'Prescription Medicines', // Don't show pharmacy name to patients
              providerId: isLab
                ? (request.adminResponse?.lab?.labId || request.adminResponse?.labs?.[0]?.labId)
                : (request.adminResponse?.pharmacy?.pharmacyId || request.adminResponse?.pharmacies?.[0]?.pharmacyId),
              testName: request.adminResponse?.lab?.testName || request.adminResponse?.tests?.[0]?.testName || 'Lab Test',
              medicineName: request.adminResponse?.pharmacy?.medicineName || 'Prescription Medicines',
              status: status,
              requestDate: request.createdAt || request.requestDate || new Date().toISOString().split('T')[0],
              responseDate: request.adminResponse?.responseTime || request.responseDate || null,
              totalAmount: request.adminResponse?.totalAmount || request.totalAmount || null,
              message: request.adminResponse?.message || request.message || null,
              prescriptionId: request.prescriptionId?._id || request.prescriptionId || null,
              visitType: request.visitType || null,
              // Store lab info for conditional display
              // For lab visits: get from adminResponse
              // For home collection: get from accepted orders (when lab accepts)
              labInfo: isLab ? (
                request.adminResponse?.labs && request.adminResponse.labs.length > 0
                  ? request.adminResponse.labs[0]
                  : (request.adminResponse?.lab ? request.adminResponse.lab : null)
              ) : null,

              // For home collection, get lab info from accepted orders
              homeCollectionLabInfo: request.visitType === 'home' && orders.some(o => ['accepted', 'confirmed', 'completed'].includes(o.status))
                ? (() => {
                    const acceptedOrder = orders.find(o => ['accepted', 'confirmed', 'completed'].includes(o.status))
                    return acceptedOrder?.providerId || null
                  })()
                : null,
              // Grouped data
              medicinesByPharmacy: Object.values(medicinesByPharmacy),
              testsByLab: Object.values(testsByLab),
              // Legacy fields for backward compatibility
              adminMedicines: request.adminResponse?.medicines || [],
              investigations: request.adminResponse?.tests || [],
              patient: request.patientId ? {
                name: `${request.patientId.firstName || ''} ${request.patientId.lastName || ''}`.trim() || 'Patient',
                phone: request.patientId.phone || '',
                email: request.patientId.email || '',
                address: request.patientId.address || '',
                age: request.patientId.age || null,
                gender: request.patientId.gender || null,
              } : null,
              providerResponse: request.adminResponse ? {
                message: request.adminResponse.message || '',
                responseBy: request.adminResponse.responseBy || 'Provider',
                responseTime: request.adminResponse.responseTime || request.createdAt,
              } : null,
              doctor: request.prescriptionId?.doctorId ? {
                name: (() => {
                  const doctorId = request.prescriptionId.doctorId
                  if (doctorId.firstName && doctorId.lastName) {
                    return `Dr. ${doctorId.firstName} ${doctorId.lastName}`
                  } else if (doctorId.firstName) {
                    return `Dr. ${doctorId.firstName}`
                  } else if (doctorId.lastName) {
                    return `Dr. ${doctorId.lastName}`
                  } else if (doctorId.name) {
                    return doctorId.name.startsWith('Dr.') ? doctorId.name : `Dr. ${doctorId.name}`
                  } else {
                    return 'Dr. Unknown'
                  }
                })(),
                specialty: request.prescriptionId.doctorId.specialization || request.prescriptionId.doctorId.specialty || '',
                phone: request.prescriptionId.doctorId.phone || '',
              } : null,
              originalData: request,
              orders: orders, // Include orders in the transformed object
            }
          })

          // Sort by date (newest first)
          transformed.sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0))
          setRequests(transformed)
        }
      } catch (err) {
        console.error('Error fetching requests:', err)
        setError(err.message || 'Failed to load requests')
        toast.error('Failed to load requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
    // Refresh every 30 seconds to get new requests
    const interval = setInterval(() => {
      fetchRequests()
    }, 30000)
    return () => clearInterval(interval)
  }, [toast])

  // Refetch requests after operations
  const refetchRequests = async () => {
    try {
      const response = await getPatientRequests()
      if (response.success && response.data) {
        const requestsData = Array.isArray(response.data)
          ? response.data
          : response.data.items || []

        const transformed = requestsData.map(request => {
          const isLab = request.type === 'book_test_visit' || request.type === 'lab'
          const isPharmacy = request.type === 'order_medicine' || request.type === 'pharmacy'

          // Group medicines by pharmacy
          const medicinesByPharmacy = {}
          if (request.adminResponse?.medicines && Array.isArray(request.adminResponse.medicines)) {
            request.adminResponse.medicines.forEach(med => {
              const pharmId = med.pharmacyId?.toString() || med.pharmacyId || 'unknown'
              if (!medicinesByPharmacy[pharmId]) {
                medicinesByPharmacy[pharmId] = {
                  pharmacyId: pharmId,
                  pharmacyName: med.pharmacyName || 'Pharmacy',
                  medicines: []
                }
              }
              medicinesByPharmacy[pharmId].medicines.push({
                name: med.name,
                dosage: med.dosage,
                quantity: med.quantity,
                price: med.price,
                total: (med.price || 0) * (med.quantity || 1)
              })
            })
          }

          // Group tests by lab
          const testsByLab = {}
          if (request.adminResponse?.tests && Array.isArray(request.adminResponse.tests)) {
            request.adminResponse.tests.forEach(test => {
              const labId = test.labId?.toString() || test.labId || 'unknown'
              if (!testsByLab[labId]) {
                testsByLab[labId] = {
                  labId: labId,
                  labName: test.labName || 'Laboratory',
                  tests: []
                }
              }
              testsByLab[labId].tests.push({
                testName: test.testName,
                price: test.price
              })
            })
          }

          const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null
          // Prioritize order status if available, but don't revert to 'accepted' if request is already 'confirmed' (paid)
          let status = latestOrder?.status || request.status || 'pending'
          if (request.status === 'confirmed' && latestOrder?.status === 'accepted') {
            status = 'confirmed'
          }

          return {
            id: request._id || request.id,
            _id: request._id || request.id,
            type: isLab ? 'lab' : isPharmacy ? 'pharmacy' : request.type,
            providerName: isLab
              ? (request.adminResponse?.lab?.labName || request.adminResponse?.labs?.[0]?.labName || 'Laboratory')
              : 'Prescription Medicines', // Don't show pharmacy name to patients
            providerId: isLab
              ? (request.adminResponse?.lab?.labId || request.adminResponse?.labs?.[0]?.labId)
              : (request.adminResponse?.pharmacy?.pharmacyId || request.adminResponse?.pharmacies?.[0]?.pharmacyId),
            testName: request.adminResponse?.lab?.testName || request.adminResponse?.tests?.[0]?.testName || 'Lab Test',
            medicineName: request.adminResponse?.pharmacy?.medicineName || 'Prescription Medicines',
            status: status,
            requestDate: request.createdAt || request.requestDate || new Date().toISOString().split('T')[0],
            responseDate: request.adminResponse?.responseTime || request.responseDate || null,
            totalAmount: request.adminResponse?.totalAmount || request.totalAmount || null,
            message: request.adminResponse?.message || request.message || null,
            prescriptionId: request.prescriptionId?._id || request.prescriptionId || null,
            visitType: request.visitType || null,
            // Store lab info for conditional display
            labInfo: isLab && request.adminResponse?.labs && request.adminResponse.labs.length > 0
              ? request.adminResponse.labs[0]
              : (isLab && request.adminResponse?.lab ? request.adminResponse.lab : null),
            // Grouped data
            medicinesByPharmacy: Object.values(medicinesByPharmacy),
            testsByLab: Object.values(testsByLab),
            // Legacy fields for backward compatibility
            adminMedicines: request.adminResponse?.medicines || [],
            investigations: request.adminResponse?.tests || [],
            patient: request.patientId ? {
              name: `${request.patientId.firstName || ''} ${request.patientId.lastName || ''}`.trim() || 'Patient',
              phone: request.patientId.phone || '',
              email: request.patientId.email || '',
              address: request.patientId.address || '',
              age: request.patientId.age || null,
              gender: request.patientId.gender || null,
            } : null,
            providerResponse: request.adminResponse ? {
              message: request.adminResponse.message || '',
              responseBy: request.adminResponse.responseBy || 'Provider',
              responseTime: request.adminResponse.responseTime || request.createdAt,
            } : null,
            doctor: request.prescriptionId?.doctorId ? {
              name: request.prescriptionId.doctorId.name || 'Dr. Unknown',
              specialty: request.prescriptionId.doctorId.specialty || '',
              phone: request.prescriptionId.doctorId.phone || '',
            } : null,
            originalData: request,
            orders: orders, // Include orders in the transformed object
          }
        })

        transformed.sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0))
        setRequests(transformed)
      }
    } catch (error) {
      console.error('Error refetching requests:', error)
    }
  }


  const _generateReceiptPDF = (request) => {
    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Receipt - ${request.type === 'lab' ? request.testName : request.medicineName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #11496c;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #11496c;
      margin: 0;
      font-size: 28px;
    }
    .header .subtitle {
      color: #64748b;
      margin-top: 5px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 15px;
      border-left: 4px solid #11496c;
      padding-left: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-label {
      font-weight: 600;
      color: #475569;
    }
    .info-value {
      color: #1e293b;
    }
    .amount-box {
      background-color: rgba(17, 73, 108, 0.05);
      border: 2px solid #11496c;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
      color: #11496c;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      background-color: rgba(17, 73, 108, 0.15);
      color: #11496c;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Receipt</h1>
    <div class="subtitle">Heallyn - Your Health Partner</div>
  </div>

  <div class="section">
    <div class="section-title">Booking Information</div>
    <div class="info-row">
      <span class="info-label">Request ID:</span>
      <span class="info-value">${request.id}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Type:</span>
      <span class="info-value">${request.type === 'lab' ? 'Laboratory Test' : 'Pharmacy Order'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${request.type === 'lab' ? 'Test Name' : 'Medicine'}:</span>
      <span class="info-value">${request.type === 'lab' ? request.testName : request.medicineName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Provider:</span>
      <span class="info-value">${request.providerName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Status:</span>
      <span class="info-value">
        <span class="status-badge">${getStatusLabel(request.status)}</span>
      </span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Timeline</div>
    <div class="info-row">
      <span class="info-label">Requested Date:</span>
      <span class="info-value">${formatDate(request.requestDate)}</span>
    </div>
    ${request.responseDate ? `
    <div class="info-row">
      <span class="info-label">Response Date:</span>
      <span class="info-value">${formatDate(request.responseDate)}</span>
    </div>
    ` : ''}
  </div>

  ${request.patient ? `
  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${request.patient.name} • ${request.patient.age} yrs, ${request.patient.gender}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">${request.patient.phone}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${request.patient.email}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address:</span>
      <span class="info-value">${request.patient.address}</span>
    </div>
  </div>
  ` : ''}

  ${request.providerResponse ? `
  <div class="section">
    <div class="section-title">Provider Message</div>
    <p style="color: #1e293b; line-height: 1.6;">${request.providerResponse.message}</p>
  </div>
  ` : ''}

  ${request.totalAmount ? `
  <div class="amount-box">
    <div class="amount-row">
      <span>Total Amount:</span>
      <span>${formatCurrency(request.totalAmount)}</span>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>This is an electronically generated receipt.</p>
    <p>For any queries, please contact ${request.providerName}</p>
    <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>
    `

    // Create blob URL for PDF
    const blob = new Blob([receiptContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setReceiptPdfUrl(url)
  }

  useEffect(() => {
    return () => {
      // Cleanup blob URL when component unmounts or modal closes
      if (receiptPdfUrl) {
        URL.revokeObjectURL(receiptPdfUrl)
      }
    }
  }, [receiptPdfUrl])

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false)
    setSelectedRequest(null)
    // Cleanup blob URL
    if (receiptPdfUrl) {
      URL.revokeObjectURL(receiptPdfUrl)
      setReceiptPdfUrl(null)
    }
  }


  const handlePayClick = (request) => {
    setSelectedRequest(request)
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedRequest(null)
    setPaymentMethod('card')
  }

  const handleConfirmPayment = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)

    try {
      const requestId = selectedRequest._id || selectedRequest.id

      // Step 1: Create payment order
      const paymentOrderResponse = await createRequestPaymentOrder(requestId)

      if (!paymentOrderResponse.success) {
        toast.error(paymentOrderResponse.message || 'Failed to create payment order. Please try again.')
        setIsProcessing(false)
        return
      }

      const { orderId, amount, currency, razorpayKeyId } = paymentOrderResponse.data

      // Step 2: Initialize Razorpay payment
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.')
        setIsProcessing(false)
        return
      }

      if (!razorpayKeyId) {
        toast.error('Payment gateway not configured. Please contact support.')
        setIsProcessing(false)
        return
      }

      const requestType = selectedRequest.type === 'book_test_visit' || selectedRequest.type === 'lab' ? 'lab test' : 'medicine'
      const requestDescription = selectedRequest.type === 'book_test_visit' || selectedRequest.type === 'lab'
        ? 'Lab Test Payment'
        : 'Medicine Order Payment'

      const options = {
        key: razorpayKeyId, // Use key ID from backend response
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        name: 'Heallyn',
        description: requestDescription,
        order_id: orderId,
        handler: async (response) => {
          try {
            setIsProcessing(true) // Keep loading state during verification
            // Step 3: Verify payment
            const verifyResponse = await confirmRequestPayment(requestId, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              paymentMethod: 'razorpay',
            })

            if (verifyResponse.success) {
              toast.success(`Payment successful! Your ${requestType} order has been confirmed.`)
              handleClosePaymentModal()
              // Refetch requests to get updated status
              await refetchRequests()
            } else {
              toast.error(verifyResponse.message || 'Payment verification failed.')
            }
          } catch (error) {
            console.error('Error verifying payment:', error)
            toast.error(error.message || 'Error verifying payment. Please contact support.')
          } finally {
            setIsProcessing(false)
          }
        },
        prefill: {
          name: selectedRequest.patientName || '',
          email: selectedRequest.patientEmail || '',
          contact: selectedRequest.patientPhone || '',
        },
        theme: {
          color: '#11496c',
        },
        modal: {
          ondismiss: () => {
            
            setIsProcessing(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error(error.message || 'Error processing payment. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleCancelRequest = async (request) => {
    if (!request) return

    // Confirm cancellation
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel this ${request.type === 'lab' ? 'lab test' : 'pharmacy'} request?`
    )

    if (!confirmCancel) return

    setIsProcessing(true)

    try {
      const requestId = request._id || request.id
      const response = await cancelPatientRequest(requestId)

      if (response.success) {
        toast.success(`Request cancelled successfully. Cancellation notification sent to ${request.providerName || 'provider'}.`)
        // Refetch requests to get updated status
        await refetchRequests()
      } else {
        toast.error(response.message || 'Failed to cancel request. Please try again.')
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error(error.message || 'Error cancelling request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'accepted':
        return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
      case 'paid':
        return 'bg-purple-100 text-purple-700'
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700'
      // Lab statuses
      case 'visit_time':
        return 'bg-blue-100 text-blue-700'
      case 'sample_collected':
        return 'bg-indigo-100 text-indigo-700'
      case 'being_tested':
        return 'bg-purple-100 text-purple-700'
      case 'reports_being_generated':
        return 'bg-orange-100 text-orange-700'
      case 'test_successful':
        return 'bg-emerald-100 text-emerald-700'
      case 'reports_updated':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-slate-100 text-slate-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
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
      case 'paid':
        return <IoCardOutline className="h-3 w-3" />
      case 'confirmed':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'accepted':
        return 'Payment Pending'
      case 'paid':
        return 'Processing'
      case 'confirmed':
        return 'Paid'
      default:
        // User requested: "instead of completed status... show request accepted"
        if (status === 'completed' || status === 'Completed') {
          return 'Request Accepted'
        }
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }
  }

  const handleRequestClick = (request) => {
    // If there's an active order (status confirmed/completed/etc.), redirect to orders section
    // Check if we have orders attached or status implies order creation
    const hasOrder = request.orders && request.orders.length > 0
    const isOrderActive = hasOrder || request.status === 'confirmed' || request.status === 'completed' || request.status === 'reports_updated'

    if (isOrderActive) {
      navigate('/patient/orders')
    }
  }

  // Calculate paginated requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return requests.slice(startIndex, endIndex)
  }, [requests, currentPage])

  const totalPages = Math.ceil(requests.length / itemsPerPage)
  const totalItems = requests.length

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-4 py-5 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-slate-600">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-red-600">Error: {error}</p>
            <p className="mt-1 text-xs text-red-500">Please try again later.</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No requests found</p>
            <p className="mt-1 text-xs text-slate-500">No booking requests available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((request) => (
              <article
                key={request.id}
                onClick={() => handleRequestClick(request)}
                className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${(request.orders && request.orders.length > 0) || request.status === 'confirmed' || request.status === 'completed' ? 'cursor-pointer hover:border-[#11496c]/30' : ''
                  }`}
              >
                {/* Main Content */}
                <div className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${request.type === 'lab'
                      ? 'text-white shadow-md'
                      : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-300/50 text-white shadow-md'
                      }`}
                      style={request.type === 'lab' ? {
                        background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                        boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)'
                      } : {}}>
                      {request.type === 'lab' ? (
                        <IoFlaskOutline className="h-5 w-5" />
                      ) : (
                        <IoBagHandleOutline className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="flex-1 min-w-0 text-sm font-bold text-slate-900 leading-tight pr-2 line-clamp-1">
                            {request.type === 'lab' || request.type === 'book_test_visit' 
                              ? (request.providerName || 'Laboratory')
                              : 'Prescription Medicines'}
                          </h3>
                          <div className="shrink-0">
                            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              <span>{getStatusLabel(request.status)}</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500">
                          {formatDate(request.requestDate)}
                        </p>
                        {/* Lab Details Display */}
                        {request.type === 'lab' && request.labInfo && (
                          <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5">
                            {request.labInfo.address && (
                              <div className="flex items-start gap-1">
                                <IoLocationOutline className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-400" />
                                <span className="text-[9px] text-slate-600 line-clamp-2">
                                  {typeof request.labInfo.address === 'object'
                                    ? [
                                      request.labInfo.address.line1,
                                      request.labInfo.address.line2,
                                      request.labInfo.address.city,
                                      request.labInfo.address.state,
                                      request.labInfo.address.postalCode
                                    ].filter(Boolean).join(', ')
                                    : request.labInfo.address}
                                </span>
                              </div>
                            )}
                            {request.labInfo.phone && (
                              <div className="flex items-center gap-1">
                                <IoCallOutline className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                                <span className="text-[9px] text-slate-600">{request.labInfo.phone}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Message for Paid/Confirmed Requests - Show when waiting for provider acceptance */}
                  {request.status === 'confirmed' && (!request.orders || !request.orders.some(o => ['accepted', 'confirmed', 'completed', 'ready_for_pickup'].includes(o.status))) && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center gap-2">
                        <IoTimeOutline className="h-5 w-5 text-yellow-600" />
                        <p className="text-xs font-semibold text-yellow-800">
                          Waiting for {(request.type === 'lab' || request.type === 'book_test_visit') ? 'Lab' : 'Pharmacy'} request acceptance...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Conditional Display for Accepted Status */}
                  {request.status === 'accepted' && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-start gap-3">
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div className="flex-1">
                          {request.type === 'lab' ? (
                            request.visitType === 'home' ? (
                              // Home Collection - Hide Contact Info
                              <div>
                                <p className="text-sm font-bold text-emerald-800">
                                  Request Accepted and Sample Collection Coming Soon
                                </p>
                              </div>
                            ) : (
                              // Lab Visit - Show Admin Accepted Message
                              <div>
                                <p className="text-sm font-bold text-emerald-800 mb-1">
                                  Admin Accepted
                                </p>
                                <p className="text-xs text-emerald-700">
                                  Your request has been accepted by the admin. Please proceed with payment.
                                </p>
                              </div>
                            )
                          ) : (
                            // Pharmacy (Always Home Delivery)
                            <div>
                              <p className="text-sm font-bold text-emerald-800 mb-1">
                                Admin Accepted
                              </p>
                              <p className="text-xs text-emerald-700">
                                Your request has been accepted by the admin. Please proceed with payment.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medicines Grouped by Pharmacy - Only show for pharmacy requests, HIDE pharmacy name */}
                  {request.type !== 'lab' && request.type !== 'book_test_visit' && request.medicinesByPharmacy && request.medicinesByPharmacy.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {request.medicinesByPharmacy.map((pharmacyGroup, pharmIdx) => (
                        <div key={pharmIdx} className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <IoBagHandleOutline className="h-3 w-3 text-blue-600 shrink-0" />
                            <h4 className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">Medicines</h4>
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {pharmacyGroup.medicines.map((med, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[9px] bg-white rounded px-1.5 py-0.5 border border-blue-100">
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-slate-900">{med.name}</span>
                                  {med.dosage && <span className="text-slate-600 ml-1">({med.dosage})</span>}
                                  {med.quantity > 1 && <span className="text-slate-500 ml-1">x{med.quantity}</span>}
                                </div>
                                {med.total > 0 && (
                                  <span className="font-semibold text-blue-700 shrink-0 ml-2">₹{med.total.toFixed(2)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-blue-200 flex items-center justify-between text-[9px]">
                            <span className="font-semibold text-slate-700">Subtotal:</span>
                            <span className="font-bold text-blue-700">₹{pharmacyGroup.medicines.reduce((sum, m) => sum + (m.total || 0), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Amount - Only show for pharmacy requests with medicines and amount > 0 */}
                  {request.type !== 'lab' && request.type !== 'book_test_visit' && request.totalAmount && request.totalAmount > 0 && request.adminMedicines && request.adminMedicines.length > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-[#11496c] bg-[rgba(17,73,108,0.05)] px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Total Amount:</span>
                      <span className="text-sm font-bold text-[#11496c]">{formatCurrency(request.totalAmount)}</span>
                    </div>
                  )}

                  {/* Lab Information and Tests - Only for lab requests */}
                  {(request.type === 'lab' || request.type === 'book_test_visit') && request.totalAmount && request.totalAmount > 0 && (
                    <>
                      {/* Lab Name and Address - Show for lab visits when order is accepted, or for home collection when lab accepts */}
                      {((request.visitType === 'lab' && request.orders?.some(o => ['accepted', 'confirmed', 'completed'].includes(o.status))) ||
                        (request.visitType === 'home' && request.orders?.some(o => ['accepted', 'confirmed', 'completed'].includes(o.status)))) &&
                        ((request.labInfo || request.homeCollectionLabInfo || request.providerName)) && request.status === 'confirmed' && (
                          <div className="mt-2 rounded-lg border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.05)] p-2">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <IoFlaskOutline className="h-3 w-3 text-[#11496c] shrink-0" />
                              <h4 className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">Laboratory</h4>
                            </div>
                            <div className="space-y-1 text-[9px]">
                              <div className="font-semibold text-slate-900">
                                {request.visitType === 'lab'
                                  ? (request.labInfo?.labName || request.labInfo?.name || request.providerName)
                                  : (request.homeCollectionLabInfo?.labName || request.homeCollectionLabInfo?.name || request.providerName || 'Laboratory')
                                }
                              </div>
                              {(request.visitType === 'lab' ? request.labInfo?.address : request.homeCollectionLabInfo?.address) && (
                                <div className="flex items-start gap-1 mt-0.5 text-slate-600">
                                  <IoLocationOutline className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                                  <span className="leading-tight">
                                    {(() => {
                                      const address = request.visitType === 'lab' ? request.labInfo?.address : request.homeCollectionLabInfo?.address;
                                      return address && typeof address === 'object'
                                        ? `${address.line1 || ''}${address.line1 && address.city ? ', ' : ''}${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''}${address.postalCode ? ` ${address.postalCode}` : ''}`.trim()
                                        : (address || '')
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Tests Grouped by Lab - Hide lab name for patient */}
                      {request.testsByLab && request.testsByLab.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {request.testsByLab.map((labGroup, labIdx) => (
                            <div key={labIdx} className="rounded-lg border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.05)] p-2">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <IoFlaskOutline className="h-3 w-3 text-[#11496c] shrink-0" />
                                <h4 className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">Tests</h4>
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {labGroup.tests.map((test, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[9px] bg-white rounded px-1.5 py-0.5 border border-[rgba(17,73,108,0.1)]">
                                    <div className="flex-1 min-w-0">
                                      <span className="font-semibold text-slate-900">{test.testName}</span>
                                    </div>
                                    {test.price > 0 && (
                                      <span className="font-semibold text-[#11496c] shrink-0 ml-2">₹{Number(test.price).toFixed(2)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-1.5 pt-1.5 border-t border-[rgba(17,73,108,0.2)] flex items-center justify-between text-[9px]">
                                <span className="font-semibold text-slate-700">Subtotal:</span>
                                <span className="font-bold text-[#11496c]">₹{labGroup.tests.reduce((sum, t) => sum + (t.price || 0), 0).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total Amount for Lab Requests */}
                      <div className="mt-2 flex items-center justify-between rounded-lg border border-[#11496c] bg-[rgba(17,73,108,0.05)] px-2 py-1.5">
                        <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Total Amount:</span>
                        <span className="text-sm font-bold text-[#11496c]">{formatCurrency(request.totalAmount)}</span>
                      </div>
                    </>
                  )}

                  {/* Cancellation Reason - Show when cancelled */}
                  {request.status === 'cancelled' && request.cancelReason && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
                      <div className="flex items-start gap-1.5">
                        <IoCloseCircleOutline className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[9px] font-semibold text-red-900 mb-0.5">Cancellation Reason:</p>
                          <p className="text-[9px] font-medium text-red-800 leading-tight">
                            {request.cancelReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Waiting Message - Only for pharmacy requests, not lab */}
                  {request.type !== 'lab' && request.type !== 'book_test_visit' && (!request.adminMedicines || request.adminMedicines.length === 0) && request.status === 'accepted' && request.status !== 'cancelled' && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <div className="flex items-center gap-1.5">
                        <IoTimeOutline className="h-3 w-3 text-amber-600 shrink-0" />
                        <p className="text-[9px] font-medium text-amber-900 leading-tight">
                          Waiting for medicine details...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Waiting Message for Lab Requests */}
                  {(request.type === 'lab' || request.type === 'book_test_visit') && (!request.totalAmount || request.totalAmount === 0) && request.status === 'accepted' && request.status !== 'cancelled' && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <div className="flex items-center gap-1.5">
                        <IoTimeOutline className="h-3 w-3 text-amber-600 shrink-0" />
                        <p className="text-[9px] font-medium text-amber-900 leading-tight">
                          Waiting for test details...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Doctor Information */}
                  {request.doctor && (
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-500 px-0.5">
                      <IoDocumentTextOutline className="h-2.5 w-2.5 shrink-0" />
                      <span className="leading-tight">Prescribed by: <span className="font-medium text-slate-700">{request.doctor.name}</span> ({request.doctor.specialty})</span>
                    </div>
                  )}

                  {/* Confirmed Status - Show only when provider accepted */}
                  {request.status === 'confirmed' && request.orders?.some(o => ['accepted', 'confirmed', 'completed'].includes(o.status)) && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                      <IoCheckmarkCircleOutline className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <p className="text-[10px] font-semibold text-emerald-900 leading-tight">
                        {request.visitType === 'home' || request.visitType === 'home_collection'
                          ? "Contact soon for home collection."
                          : "Booking confirmed! Please visit the lab."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Show for pharmacy when medicines available, or for lab when amount available */}
                {request.status === 'accepted' && (
                  (request.type !== 'lab' && request.type !== 'book_test_visit' && request.adminMedicines && request.adminMedicines.length > 0 && request.totalAmount && request.totalAmount > 0) ||
                  ((request.type === 'lab' || request.type === 'book_test_visit') && request.totalAmount && request.totalAmount > 0)
                ) && (
                    <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-2">
                      <button
                        type="button"
                        onClick={() => handlePayClick(request)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#11496c] px-2 py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoCardOutline className="h-3 w-3 shrink-0" />
                        Pay & Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(request)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2 py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[rgba(220,38,38,0.3)] transition-all hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoCloseCircleOutline className="h-3 w-3 shrink-0" />
                        Cancel
                      </button>
                    </div>
                  )}
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && requests.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        )}
      </main>

      {/* Receipt Detail Modal - PDF View */}
      {showReceiptModal && selectedRequest && receiptPdfUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-900"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseReceiptModal()
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#11496c]">Booking Receipt</h2>
              <p className="text-xs text-slate-600">Heallyn - Your Health Partner</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Download PDF
                  const link = document.createElement('a')
                  link.href = receiptPdfUrl
                  link.download = `Receipt_${selectedRequest.id}_${selectedRequest.type === 'lab' ? selectedRequest.testName : selectedRequest.medicineName}.html`
                  link.target = '_blank'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                title="Download PDF"
              >
                <IoDownloadOutline className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleCloseReceiptModal}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden bg-slate-100">
            <iframe
              src={receiptPdfUrl}
              className="w-full h-full border-0"
              title="Booking Receipt"
              style={{ minHeight: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Confirm Payment</h2>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedRequest.type === 'lab' ? selectedRequest.testName : selectedRequest.medicineName}
                    </p>
                    <p className="text-xs text-slate-600">Heallyn</p>
                  </div>
                  <span className="text-lg font-bold text-[#11496c]">
                    {formatCurrency(selectedRequest.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-600 text-center">
                  You will be redirected to Razorpay secure payment gateway to complete your payment.
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="h-4 w-4" />
                    Pay {formatCurrency(selectedRequest.totalAmount)}
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

export default PatientRequests

