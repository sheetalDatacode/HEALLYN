import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useToast } from '../../../contexts/ToastContext'
import { getLaboratoryRequestOrders, generateLaboratoryBill } from '../laboratory-services/laboratoryService'
import { getAuthToken } from '../../../utils/apiClient'
import Pagination from '../../../components/Pagination'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoFlaskOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoCloseOutline,
  IoAddOutline,
  IoTrashOutline,
  IoHomeOutline,
  IoPaperPlaneOutline,
} from 'react-icons/io5'

// Mock data removed - now using backend API

const formatDateTime = (value) => {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatAddress = (address = {}) => {
  const { line1, line2, city, state, postalCode } = address
  return [line1, line2, [city, state].filter(Boolean).join(', '), postalCode]
    .filter(Boolean)
    .join(', ')
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'accepted':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'bill_generated':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'order_created':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'accepted':
      return 'Accepted'
    case 'bill_generated':
      return 'Bill Generated'
    case 'paid':
      return 'Paid'
    case 'order_created':
      return 'Order Created'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

const LaboratoryPatients = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [testRequests, setTestRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showBillGenerator, setShowBillGenerator] = useState(false)
  const [billRequest, setBillRequest] = useState(null)
  const [billItems, setBillItems] = useState([])
  const [deliveryCharge, setDeliveryCharge] = useState('50')
  const [additionalCharges, setAdditionalCharges] = useState('0')
  const [collectionFilter, setCollectionFilter] = useState('all') // 'all', 'home', 'lab'
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 12

  const loadTestRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken('laboratory')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await getLaboratoryRequestOrders({ 
        page: currentPage, 
        limit: itemsPerPage 
      })
      
      if (response.success && response.data) {
        const requestsData = response.data.items || response.data || []
        
        // Transform backend data to match component format
        const transformedRequests = requestsData.map(req => {
          if (!req) return null
          
          const patient = (req.patientId && typeof req.patientId === 'object') ? req.patientId : {}
          const prescription = (req.prescriptionId && typeof req.prescriptionId === 'object') ? req.prescriptionId : {}
          const adminResponse = req.adminResponse || {}
          const tests = Array.isArray(adminResponse.tests) ? adminResponse.tests : []
          const orders = Array.isArray(req.orders) ? req.orders : []
          const order = orders.length > 0 ? orders[0] : null
          
          // Calculate age from dateOfBirth
          const calculateAge = (dateOfBirth) => {
            if (!dateOfBirth) return null
            const birthDate = new Date(dateOfBirth)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            return age
          }
          
          // Get investigations from tests
          const investigations = tests
            .map(test => ({
              name: test.testName || test.name || 'Test',
              notes: test.notes || '',
              price: test.price || 0
            }))
            .filter(Boolean)
          
          // Get patient name
          const patientName = patient.firstName && patient.lastName
            ? `${patient.firstName} ${patient.lastName}`
            : patient.name || 'Unknown Patient'
          
          // Format address
          const address = patient.address || {}
          const formattedAddress = {
            line1: address.line1 || address.street || '',
            line2: address.line2 || address.apartment || '',
            city: address.city || '',
            state: address.state || '',
            postalCode: address.postalCode || address.zipCode || ''
          }
          
          // Get billing info
          const billingSummary = adminResponse.billingSummary || {}
          const bill = billingSummary.totalAmount ? {
            id: `bill-${req._id || req.id}`,
            requestId: req._id || req.id,
            testsAmount: billingSummary.testAmount || billingSummary.totalAmount || 0,
            deliveryCharge: billingSummary.deliveryCharge || 0,
            additionalCharges: billingSummary.additionalCharges || 0,
            totalAmount: billingSummary.totalAmount || 0,
            items: investigations.map(inv => ({ name: inv.name, price: inv.price || 0 })),
            generatedDate: billingSummary.generatedDate || req.createdAt
          } : null
          
          // Determine status
          let status = 'pending'
          if (order) {
            if (order.status === 'completed') status = 'order_created'
            else if (order.status === 'accepted' || order.status === 'confirmed') {
              if (bill) {
                status = order.paymentStatus === 'paid' ? 'paid' : 'bill_generated'
              } else {
                status = 'accepted'
              }
            } else if (order.status === 'rejected') status = 'cancelled'
            else status = order.status
          } else {
            status = req.status || 'pending'
          }
          
          return {
            id: req._id || req.id,
            requestId: req._id || req.id,
            patientId: patient._id || patient.id || req.patientId,
            patient: {
              name: patientName,
              age: calculateAge(patient.dateOfBirth),
              gender: patient.gender || 'unknown',
              phone: patient.phone || '',
              email: patient.email || '',
              address: formattedAddress,
              image: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=3b82f6&color=fff&size=160`
            },
            status: status,
            requestDate: req.createdAt || req.requestDate,
            acceptedDate: order?.acceptedAt || order?.createdAt,
            prescription: {
              doctor: {
                name: prescription.doctorName || prescription.doctor?.name || 'Doctor',
                qualification: prescription.doctorQualification || prescription.doctor?.qualification || '',
                licenseNumber: prescription.doctorLicense || prescription.doctor?.licenseNumber || '',
                clinicName: prescription.clinicName || prescription.doctor?.clinicName || '',
                clinicAddress: prescription.clinicAddress || prescription.doctor?.clinicAddress || '',
                phone: prescription.doctorPhone || prescription.doctor?.phone || '',
                email: prescription.doctorEmail || prescription.doctor?.email || '',
                specialization: prescription.doctorSpecialty || prescription.doctor?.specialization || ''
              },
              diagnosis: prescription.diagnosis || req.diagnosis || '',
              investigations: investigations,
              medications: prescription.medications || [],
              advice: prescription.advice || '',
              followUpDate: prescription.followUpDate || null
            },
            bill: bill,
            orderId: order?._id || order?.id || null,
            collectionType: req.visitType === 'home' || req.deliveryOption === 'home_delivery' ? 'home' : 'lab'
          }
        }).filter(Boolean)
        
        // Sort by date (newest first)
        transformedRequests.sort((a, b) => {
          const dateA = a?.requestDate ? new Date(a.requestDate).getTime() : 0
          const dateB = b?.requestDate ? new Date(b.requestDate).getTime() : 0
          return dateB - dateA
        })
        
        setTestRequests(transformedRequests)
        const pagination = response.data.pagination || {}
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || transformedRequests.length) / itemsPerPage) || 1)
        setTotalItems(pagination.total || transformedRequests.length)
      } else {
        setTestRequests([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error loading test requests:', error)
      setTestRequests([])
      setTotalPages(1)
      setTotalItems(0)
      toast.error('Failed to load test requests')
    } finally {
      setIsLoading(false)
    }
  }, [toast, currentPage])

  useEffect(() => {
    const token = getAuthToken('laboratory')
    if (!token) {
      return
    }
    loadTestRequests()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      const currentToken = getAuthToken('laboratory')
      if (currentToken) {
        loadTestRequests()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [loadTestRequests])

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, collectionFilter])

  const filteredRequests = useMemo(() => {
    let filtered = testRequests

    // Filter by collection type
    if (collectionFilter !== 'all') {
      filtered = filtered.filter(request => request.collectionType === collectionFilter)
    }

    // Filter by search term
    if (searchTerm.trim()) {
    const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (request) =>
          request.patient.name.toLowerCase().includes(normalizedSearch) ||
          request.patient.phone.includes(normalizedSearch) ||
          request.patient.email.toLowerCase().includes(normalizedSearch) ||
          request.requestId.toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered
  }, [searchTerm, testRequests, collectionFilter])


  const handleCloseBillGenerator = () => {
    setShowBillGenerator(false)
    setBillRequest(null)
    setBillItems([])
    setDeliveryCharge('50')
    setAdditionalCharges('0')
  }

  const handleUpdateBillItemPrice = (index, price) => {
    const updatedItems = [...billItems]
    updatedItems[index].price = parseFloat(price) || 0
    setBillItems(updatedItems)
  }

  const handleUpdateBillItemName = (index, name) => {
    const updatedItems = [...billItems]
    updatedItems[index].name = name
    setBillItems(updatedItems)
  }

  const handleAddBillItem = () => {
    setBillItems([...billItems, { name: '', price: 0 }])
  }

  const handleRemoveBillItem = (index) => {
    const updatedItems = billItems.filter((_, i) => i !== index)
    setBillItems(updatedItems)
  }

  const handleGenerateBillManually = async () => {
    if (!billRequest) return

    // Validate that all test items have names
    const emptyNames = billItems.filter(item => !item.name || item.name.trim() === '')
    if (emptyNames.length > 0) {
      toast.error('Please enter test name for all items')
      return
    }

    // Filter out items with empty names (just in case)
    const validItems = billItems.filter(item => item.name && item.name.trim() !== '')
    
    if (validItems.length === 0) {
      toast.error('Please add at least one test item')
      return
    }

    const testsAmount = validItems.reduce((sum, item) => sum + (item.price || 0), 0)
    // Add delivery charge only for home collection
    const delivery = billRequest.collectionType === 'home' ? (parseFloat(deliveryCharge) || 0) : 0
    const additional = parseFloat(additionalCharges) || 0
    const totalAmount = testsAmount + delivery + additional

    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than 0')
      return
    }

    setIsProcessing(true)
    try {
      await generateLaboratoryBill(billRequest.requestId, {
        testAmount: testsAmount,
        deliveryCharge: delivery,
        additionalCharges: additional
      })

      const bill = {
        id: `bill-${billRequest.id}`,
        requestId: billRequest.requestId,
        testsAmount,
        deliveryCharge: delivery,
        additionalCharges: additional,
        totalAmount,
        items: validItems,
        generatedDate: new Date().toISOString(),
      }

      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === billRequest.id
            ? { ...req, status: 'bill_generated', bill }
            : req
        )
      )

      handleCloseBillGenerator()
      toast.success(`Bill generated successfully! Total: ${formatCurrency(totalAmount)}`)
      loadTestRequests() // Refresh data
    } catch (error) {
      console.error('Error generating bill:', error)
      toast.error('Failed to generate bill. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendBillToPatient = async (requestId) => {
    const request = testRequests.find((r) => r.id === requestId)
    if (!request || !request.bill) {
      toast.warning('Bill not found. Please generate bill first.')
      return
    }

    if (!window.confirm(`Send bill to ${request.patient.name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      // Simulate API call to send bill to patient
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: 'bill_generated', billSent: true, billSentDate: new Date().toISOString() }
            : req
        )
      )
      
      toast.success(`Bill sent to ${request.patient.name} successfully!`)
    } catch (error) {
      toast.error('Failed to send bill. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateAndShareBill = async () => {
    if (!billRequest) return

    // Validate that all test items have names
    const emptyNames = billItems.filter(item => !item.name || item.name.trim() === '')
    if (emptyNames.length > 0) {
      alert('Please enter test name for all items')
      return
    }

    // Filter out items with empty names (just in case)
    const validItems = billItems.filter(item => item.name && item.name.trim() !== '')
    
    if (validItems.length === 0) {
      alert('Please add at least one test item')
      return
    }

    const testsAmount = validItems.reduce((sum, item) => sum + (item.price || 0), 0)
    // Add delivery charge only for home collection
    const delivery = billRequest.collectionType === 'home' ? (parseFloat(deliveryCharge) || 0) : 0
    const additional = parseFloat(additionalCharges) || 0
    const totalAmount = testsAmount + delivery + additional

    if (totalAmount <= 0) {
      alert('Total amount must be greater than 0')
      return
    }

    if (!window.confirm(`Generate and share bill with ${billRequest.patient.name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const bill = {
        id: `bill-${billRequest.id}`,
        requestId: billRequest.requestId,
        testsAmount,
        deliveryCharge: delivery,
        additionalCharges: additional,
        totalAmount,
        items: validItems,
        generatedDate: new Date().toISOString(),
      }

      // Update request with bill
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === billRequest.id
            ? { ...req, status: 'bill_generated', bill }
            : req
        )
      )

      // Simulate API call to send bill to patient
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Update request with bill sent status
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === billRequest.id
            ? { ...req, status: 'bill_generated', bill, billSent: true, billSentDate: new Date().toISOString() }
            : req
        )
      )
      
      handleCloseBillGenerator()
      toast.success(`Bill generated and shared with ${billRequest.patient.name} successfully!`)
    } catch (error) {
      toast.error('Failed to generate and share bill. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsPaid = async (requestId) => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: 'paid' }
            : req
        )
      )
      
      // Create order after payment
      setTimeout(() => {
        handleCreateOrder(requestId)
      }, 500)
      
      toast.success(`Payment confirmed! Order will be created.`)
    } catch (error) {
      toast.error('Failed to mark as paid. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateOrder = async (requestId) => {
    const request = testRequests.find((r) => r.id === requestId)
    if (!request) return

    const orderId = `order-${Date.now()}`
    
    setTestRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: 'order_created', orderId }
          : req
      )
    )

    toast.success(`Order created: ${orderId}`)
    // Navigate to orders page
    navigate('/laboratory/orders')
  }

  const handleDownloadPDF = (request) => {
    // Generate PDF using jsPDF matching doctor module format exactly
    const prescriptionData = request.prescription
    const patientData = request.patient
    const doctorInfo = prescriptionData.doctor
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 4
    })

    // Contact Information (Left: Phone, Right: Email)
    yPos += 1
    doc.setFontSize(8)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
    yPos += 5

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Doctor Information (Left) and Patient Information (Right)
    const infoStartY = yPos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    doc.text(`Name: ${patientData.name}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Age: ${patientData.age} years`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Gender: ${patientData.gender}`, pageWidth - margin, yPos + 8, { align: 'right' })
    if (patientData.phone) {
      doc.text(`Phone: ${patientData.phone}`, pageWidth - margin, yPos + 12, { align: 'right' })
    }
    // Patient Address
    if (patientData.address) {
      const address = patientData.address
      const addressParts = []
      if (address.line1) addressParts.push(address.line1)
      if (address.line2) addressParts.push(address.line2)
      if (address.city) addressParts.push(address.city)
      if (address.state) addressParts.push(address.state)
      if (address.postalCode) addressParts.push(address.postalCode)
      if (addressParts.length > 0) {
        const addressText = addressParts.join(', ')
        const addressLines = doc.splitTextToSize(addressText, (pageWidth - 2 * margin) / 2)
        const startY = patientData.phone ? yPos + 16 : yPos + 12
        addressLines.forEach((line, idx) => {
          doc.text(`${idx === 0 ? 'Address: ' : ''}${line}`, pageWidth - margin, startY + (idx * 4), { align: 'right' })
        })
        yPos = startY + (addressLines.length - 1) * 4
      } else {
        yPos = patientData.phone ? yPos + 16 : yPos + 12
      }
    } else {
      yPos = patientData.phone ? yPos + 16 : yPos + 12
    }

    yPos += 3

    // Diagnosis Section with Light Blue Background Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 6
    
    // Light blue rounded box for diagnosis
    const diagnosisHeight = 8
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 4, yPos + 2)
    yPos += diagnosisHeight + 4

    // Medications Section with Numbered Cards (Light Gray Background)
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6
      
      prescriptionData.medications.forEach((med, idx) => {
        // Check if we need a new page
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }
        
        // Medication card with light gray background
        const cardHeight = 22
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner)
        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })
        
        // Medication name (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)
        
        // Medication details in 2 columns (left and right)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7
        
        // Left column
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 4)
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      prescriptionData.investigations.forEach((inv) => {
        // Light purple box for each test
        const testBoxHeight = inv.notes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(inv.name, margin + 4, yPos + 2)
        
        if (inv.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(inv.notes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section with Green Bullet Points
    if (prescriptionData.advice) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(advice.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpDate) {
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Draw a line for signature
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    
    // Doctor name and designation below signature (centered under signature area)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Save PDF
    const fileName = `Prescription_${patientData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const handleViewPDF = (request) => {
    // Generate PDF for viewing (same as download but opens in new window)
    const prescriptionData = request.prescription
    const patientData = request.patient
    const doctorInfo = prescriptionData.doctor
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 4
    })

    // Contact Information (Left: Phone, Right: Email)
    yPos += 1
    doc.setFontSize(8)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
    yPos += 5

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Doctor Information (Left) and Patient Information (Right)
    const infoStartY = yPos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    doc.text(`Name: ${patientData.name}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Age: ${patientData.age} years`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Gender: ${patientData.gender}`, pageWidth - margin, yPos + 8, { align: 'right' })
    if (patientData.phone) {
      doc.text(`Phone: ${patientData.phone}`, pageWidth - margin, yPos + 12, { align: 'right' })
    }
    // Patient Address
    if (patientData.address) {
      const address = patientData.address
      const addressParts = []
      if (address.line1) addressParts.push(address.line1)
      if (address.line2) addressParts.push(address.line2)
      if (address.city) addressParts.push(address.city)
      if (address.state) addressParts.push(address.state)
      if (address.postalCode) addressParts.push(address.postalCode)
      if (addressParts.length > 0) {
        const addressText = addressParts.join(', ')
        const addressLines = doc.splitTextToSize(addressText, (pageWidth - 2 * margin) / 2)
        const startY = patientData.phone ? yPos + 16 : yPos + 12
        addressLines.forEach((line, idx) => {
          doc.text(`${idx === 0 ? 'Address: ' : ''}${line}`, pageWidth - margin, startY + (idx * 4), { align: 'right' })
        })
        yPos = startY + (addressLines.length - 1) * 4
      } else {
        yPos = patientData.phone ? yPos + 16 : yPos + 12
      }
    } else {
      yPos = patientData.phone ? yPos + 16 : yPos + 12
    }

    yPos += 3

    // Diagnosis Section with Light Blue Background Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 6
    
    // Light blue rounded box for diagnosis
    const diagnosisHeight = 8
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 4, yPos + 2)
    yPos += diagnosisHeight + 4

    // Medications Section with Numbered Cards (Light Gray Background)
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6
      
      prescriptionData.medications.forEach((med, idx) => {
        // Check if we need a new page
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }
        
        // Medication card with light gray background
        const cardHeight = 22
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner)
        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })
        
        // Medication name (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)
        
        // Medication details in 2 columns (left and right)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7
        
        // Left column
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 4)
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      prescriptionData.investigations.forEach((inv) => {
        // Light purple box for each test
        const testBoxHeight = inv.notes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(inv.name, margin + 4, yPos + 2)
        
        if (inv.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(inv.notes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section with Green Bullet Points
    if (prescriptionData.advice) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(advice.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpDate) {
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Draw a line for signature
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    
    // Doctor name and designation below signature (centered under signature area)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Open PDF in new window for viewing
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 1000)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs - Home Collection & Lab Visit */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { key: 'all', label: 'All Requests', icon: IoFlaskOutline },
          { key: 'home', label: 'Home Collection', icon: IoHomeOutline },
          { key: 'lab', label: 'Lab Visit', icon: IoLocationOutline },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setCollectionFilter(tab.key)}
              className={`shrink-0 flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                collectionFilter === tab.key
                  ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#11496c]/30 hover:bg-slate-50 hover:text-[#11496c]'
              }`}
            >
              <Icon className={`h-4 w-4 ${collectionFilter === tab.key ? 'animate-pulse' : ''}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, phone, email, or request ID..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Test Requests List */}
      <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
        {filteredRequests.length === 0 ? (
          <p className="lg:col-span-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
            No test requests found matching your search.
          </p>
        ) : (
          filteredRequests.map((request) => (
            <article
              key={request.id}
              className="group relative overflow-hidden flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 active:scale-[0.98] lg:hover:scale-[1.02] sm:p-4"
            >
              {/* Hover Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
              {/* Patient Information Section */}
              <div className="relative flex items-start gap-3 mb-3">
                <img
                  src={request.patient.image}
                  alt={request.patient.name}
                  className="h-12 w-12 rounded-lg object-cover bg-slate-100 border border-slate-200 group-hover:scale-110 group-hover:border-[#11496c] transition-all duration-300"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.patient.name)}&background=11496c&color=fff&size=160&bold=true`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-0.5 group-hover:text-[#11496c] transition-colors duration-300">{request.patient.name}</h3>
                      <p className="text-xs text-slate-600 group-hover:text-slate-700 transition-colors">
                        {request.patient.age ? `${request.patient.age} years` : '—'}{request.patient.gender ? `, ${request.patient.gender}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 group-hover:text-slate-600 transition-colors">Request ID: {request.requestId}</p>
                    </div>
                    {/* Status and Collection Type Badges - Stacked */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {/* Status Badge - Smaller */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold transition-all duration-300 group-hover:scale-105 ${
                        request.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                          : request.status === 'accepted'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : request.status === 'bill_generated'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : request.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : request.status === 'order_created'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : request.status === 'cancelled'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}>
                        {request.status === 'pending' && <IoTimeOutline className="h-2.5 w-2.5" />}
                        {(request.status === 'accepted' || request.status === 'paid' || request.status === 'order_created') && <IoCheckmarkCircleOutline className="h-2.5 w-2.5" />}
                        {request.status === 'cancelled' && <IoCloseCircleOutline className="h-2.5 w-2.5" />}
                        {getStatusLabel(request.status)}
                      </span>
                      {/* Collection Type Badge - Below Status */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold transition-all duration-300 group-hover:scale-105 ${
                        request.collectionType === 'home'
                          ? 'bg-orange-50 text-orange-700 border border-orange-300'
                          : 'bg-blue-50 text-blue-700 border border-blue-300'
                      }`}>
                        {request.collectionType === 'home' ? (
                          <>
                            <IoHomeOutline className="h-2.5 w-2.5" />
                            Home Collection
                          </>
                        ) : (
                          <>
                            <IoLocationOutline className="h-2.5 w-2.5" />
                            Lab Visit
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Contact Information - Line by Line - Always shown */}
                  <div className="space-y-1 mt-2 lg:mt-1.5">
                    {request.patient.phone ? (
                      <a
                        href={`tel:${request.patient.phone}`}
                        className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-[#11496c] transition-colors group-hover:translate-x-1 duration-300 lg:text-[10px] lg:gap-1"
                      >
                        <IoCallOutline className="h-3 w-3 text-slate-500 shrink-0 group-hover:text-[#11496c] transition-colors lg:h-2.5 lg:w-2.5" />
                        <span className="line-clamp-1">{request.patient.phone}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 lg:text-[10px]">
                        <IoCallOutline className="h-3 w-3 shrink-0 lg:h-2.5 lg:w-2.5" />
                        <span>No phone number</span>
                      </div>
                    )}
                    {request.patient.email ? (
                      <a
                        href={`mailto:${request.patient.email}`}
                        className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-[#11496c] transition-colors group-hover:translate-x-1 duration-300 lg:text-[10px] lg:gap-1"
                      >
                        <IoMailOutline className="h-3 w-3 text-slate-500 shrink-0 group-hover:text-[#11496c] transition-colors lg:h-2.5 lg:w-2.5" />
                        <span className="line-clamp-1">{request.patient.email}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 lg:text-[10px]">
                        <IoMailOutline className="h-3 w-3 shrink-0 lg:h-2.5 lg:w-2.5" />
                        <span>No email address</span>
                      </div>
                    )}
                    {request.patient.address ? (
                      <div className="flex items-start gap-1.5 text-xs text-slate-700 group-hover:text-slate-800 transition-colors lg:text-[10px] lg:gap-1">
                        <IoLocationOutline className="h-3 w-3 text-slate-500 shrink-0 mt-0.5 group-hover:text-[#11496c] transition-colors lg:h-2.5 lg:w-2.5 lg:mt-0" />
                        <span className="line-clamp-2">{formatAddress(request.patient.address)}</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5 text-xs text-slate-400 lg:text-[10px] lg:gap-1">
                        <IoLocationOutline className="h-3 w-3 shrink-0 mt-0.5 lg:h-2.5 lg:w-2.5 lg:mt-0" />
                        <span>No address provided</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Prescription Details - Light Grey Box - Always shown */}
              <div className="relative rounded-lg bg-slate-100 p-3 lg:p-2.5 border border-slate-200 group-hover:bg-slate-200 group-hover:border-slate-300 transition-all duration-300">
                <div className="space-y-1.5 lg:space-y-1">
                  {request.prescription && request.prescription.doctor ? (
                    <p className="text-xs text-slate-800 group-hover:text-slate-900 transition-colors lg:text-[10px] lg:leading-tight">
                      <span className="font-semibold">Prescribed by:</span> <span className="font-bold text-slate-900 group-hover:text-[#11496c] transition-colors">{request.prescription.doctor.name || 'N/A'}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 lg:text-[10px]">No prescription data</p>
                  )}
                  {request.prescription && request.prescription.diagnosis ? (
                    <p className="text-xs text-slate-700 group-hover:text-slate-800 transition-colors line-clamp-2 lg:text-[10px] lg:leading-tight">
                      <span className="font-semibold">Diagnosis:</span> {request.prescription.diagnosis}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 lg:text-[10px]">No diagnosis available</p>
                  )}
                  {/* Test Tags - Purple Badges with proper spacing */}
                  {request.prescription && request.prescription.investigations && request.prescription.investigations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1 lg:gap-1 lg:mt-1">
                      {request.prescription.investigations.map((inv, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700 border border-purple-200 group-hover:bg-purple-100 group-hover:border-purple-300 group-hover:scale-105 transition-all duration-300 lg:px-1.5 lg:py-0.5 lg:text-[9px] lg:gap-0.5"
                        >
                          <IoFlaskOutline className="h-3 w-3 shrink-0 lg:h-2.5 lg:w-2.5" />
                          <span className="line-clamp-1">{inv.name || 'Test'}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1 lg:text-[10px]">No tests specified</p>
                  )}
                </div>
              </div>

              {/* Bill Information - only when available */}
              {request.bill && (
                <div className="rounded-lg border-2 p-3 lg:p-2.5 transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2 lg:mb-1.5">
                    <p className="text-sm font-bold text-emerald-800 flex items-center gap-2 lg:text-xs lg:gap-1.5">
                      <IoReceiptOutline className="h-4 w-4 lg:h-3 lg:w-3" />
                      Bill Generated
                    </p>
                    {request.billSent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-300 lg:px-1.5 lg:py-0.5 lg:text-[8px] lg:gap-0.5">
                        <IoCheckmarkCircleOutline className="h-3 w-3 lg:h-2 lg:w-2" />
                        Sent
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 lg:space-y-1 text-sm lg:text-xs">
                    {request.bill.testsAmount !== undefined && request.bill.testsAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 lg:text-[10px]">Tests Amount:</span>
                        <span className="font-semibold text-slate-900 lg:text-[10px]">{formatCurrency(request.bill.testsAmount)}</span>
                      </div>
                    )}
                    {request.bill.deliveryCharge !== undefined && request.bill.deliveryCharge > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 lg:text-[10px]">Delivery Charge:</span>
                        <span className="font-semibold text-slate-900 lg:text-[10px]">{formatCurrency(request.bill.deliveryCharge)}</span>
                      </div>
                    )}
                    {request.bill.additionalCharges !== undefined && request.bill.additionalCharges > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 lg:text-[10px]">Additional Charges:</span>
                        <span className="font-semibold text-slate-900 lg:text-[10px]">{formatCurrency(request.bill.additionalCharges)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t-2 border-emerald-300 lg:pt-1 lg:mt-1">
                      <span className="text-base font-bold text-emerald-900 lg:text-xs">Total:</span>
                      <span className="text-base font-bold text-emerald-900 lg:text-xs">{formatCurrency(request.bill.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Information - only when available */}
              {request.orderId && (
                <div className="rounded-lg p-3 lg:p-2.5 border transition-all duration-300 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5 lg:text-[10px] lg:gap-1">
                      <IoCheckmarkCircleOutline className="h-3.5 w-3.5 lg:h-3 lg:w-3" />
                      Order Created: <span className="font-bold">{request.orderId}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons - PDF View/Download with Text - Smaller */}
              <div className="relative flex items-center gap-2 pt-3 border-t border-slate-200 group-hover:border-[#11496c]/30 transition-colors duration-300">
                {/* Download Button */}
                <button
                  onClick={() => handleDownloadPDF(request)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-95 group-hover:scale-105"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                
                {/* View Button */}
                <button
                  onClick={() => handleViewPDF(request)}
                  className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white active:scale-95 group-hover:scale-110"
                  aria-label="View PDF"
                >
                  <IoEyeOutline className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Test Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Patient Information */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedRequest.patient.image}
                  alt={selectedRequest.patient.name}
                  className="h-20 w-20 rounded-xl object-cover bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRequest.patient.name)}&background=3b82f6&color=fff&size=160&bold=true`
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRequest.patient.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedRequest.patient.age} years, {selectedRequest.patient.gender}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Request ID: {selectedRequest.requestId}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedRequest.patient.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedRequest.patient.email}</p>
                  <p><span className="font-medium">Address:</span> {formatAddress(selectedRequest.patient.address)}</p>
                </div>
              </div>

              {/* Doctor Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoMedicalOutline className="h-4 w-4" />
                  Doctor Information
                </h4>
                <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-lg">
                  <p><span className="font-medium">Name:</span> {selectedRequest.prescription.doctor.name}</p>
                  <p><span className="font-medium">Qualification:</span> {selectedRequest.prescription.doctor.qualification}</p>
                  <p><span className="font-medium">Clinic:</span> {selectedRequest.prescription.doctor.clinicName}</p>
                  <p><span className="font-medium">Specialization:</span> {selectedRequest.prescription.doctor.specialization}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Diagnosis</h4>
                <p className="text-sm bg-red-50 p-3 rounded-lg border border-red-200">{selectedRequest.prescription.diagnosis}</p>
                </div>

              {/* Recommended Tests */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoFlaskOutline className="h-4 w-4" />
                  Recommended Tests
                </h4>
                <div className="space-y-2">
                  {selectedRequest.prescription.investigations.map((inv, idx) => (
                    <div key={idx} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="font-medium text-sm text-purple-900">{inv.name}</p>
                      {inv.notes && <p className="text-xs text-purple-700 mt-1">{inv.notes}</p>}
              </div>
                  ))}
                </div>
              </div>

              {/* Medications */}
              {selectedRequest.prescription.medications.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Medications</h4>
                  <div className="space-y-2">
                    {selectedRequest.prescription.medications.map((med, idx) => (
                      <div key={idx} className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <p className="font-medium text-sm text-amber-900">{med.name}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-amber-700">
                          <p>Dosage: {med.dosage}</p>
                          <p>Frequency: {med.frequency}</p>
                          <p>Duration: {med.duration}</p>
                          {med.instructions && <p>Instructions: {med.instructions}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Advice */}
              {selectedRequest.prescription.advice && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Medical Advice</h4>
                  <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">{selectedRequest.prescription.advice}</p>
                </div>
              )}

              {/* Follow-up */}
              {selectedRequest.prescription.followUpDate && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <IoCalendarOutline className="h-4 w-4" />
                    Follow-up Appointment
                  </h4>
                  <p className="text-sm">{formatDate(selectedRequest.prescription.followUpDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Bill Generator Modal */}
      {showBillGenerator && billRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={handleCloseBillGenerator}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoReceiptOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Generate Bill</h2>
                    <p className="text-xs text-white/80">Create invoice for patient</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseBillGenerator}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              {/* Enhanced Patient Information */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200">
                <div className="flex items-center gap-4">
                  <img
                    src={billRequest.patient.image}
                    alt={billRequest.patient.name}
                    className="h-16 w-16 rounded-xl object-cover bg-white shadow-sm border-2 border-white"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(billRequest.patient.name)}&background=11496c&color=fff&size=160&bold=true`
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900">{billRequest.patient.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <IoPersonOutline className="h-3.5 w-3.5" />
                        <span>{billRequest.patient.age} years, {billRequest.patient.gender}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <IoDocumentTextOutline className="h-3.5 w-3.5" />
                        <span>ID: {billRequest.requestId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <IoFlaskOutline className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Test Items</h4>
                  </div>
                  <button
                    onClick={handleAddBillItem}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#11496c] to-[#0d3a52] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.3)] transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <IoAddOutline className="h-4 w-4" />
                    Add Test
                  </button>
                </div>
                <div className="space-y-3">
                  {billItems.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                      <IoFlaskOutline className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No test items added</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Add Test" to add items</p>
                    </div>
                  ) : (
                    billItems.map((item, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                        <div className="flex items-end gap-3">
                          {/* Number Badge */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 text-xs font-bold text-purple-700">
                            {index + 1}
                          </div>
                          
                          {/* Test Name - Takes more space, bigger */}
                          <div className="flex-[2] min-w-0">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Item Name</label>
                            <input
                              type="text"
                              placeholder="Enter test name"
                              value={item.name}
                              onChange={(e) => handleUpdateBillItemName(index, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                            />
                          </div>
                          
                          {/* Amount - Smaller width */}
                          <div className="w-20 sm:w-24">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.price}
                              onChange={(e) => handleUpdateBillItemPrice(index, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                            />
                          </div>
                          
                          {/* Remove Button - Smaller */}
                          <button
                            onClick={() => handleRemoveBillItem(index)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all hover:bg-red-50 hover:border-red-300 hover:scale-110 active:scale-95 mb-0.5"
                            aria-label="Remove test"
                            title="Remove Test"
                          >
                            <IoTrashOutline className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivery Charge Input - Only for Home Collection */}
              {billRequest && billRequest.collectionType === 'home' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Delivery Charge
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter delivery charge"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Enhanced Bill Summary */}
              <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <IoReceiptOutline className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Bill Summary</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600">Tests Amount</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(billItems.reduce((sum, item) => sum + (item.price || 0), 0))}</span>
                  </div>
                  {/* Delivery Charge - Only for Home Collection */}
                  {billRequest && billRequest.collectionType === 'home' && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-slate-600">Delivery Charge</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(parseFloat(deliveryCharge) || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-slate-300">
                    <span className="text-lg font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      {formatCurrency(
                        billItems.reduce((sum, item) => sum + (item.price || 0), 0) +
                        (billRequest && billRequest.collectionType === 'home' ? (parseFloat(deliveryCharge) || 0) : 0) +
                        (parseFloat(additionalCharges) || 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <IoCalendarOutline className="h-3.5 w-3.5" />
                    <span>Bill Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={handleCloseBillGenerator}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateBillManually}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <IoReceiptOutline className="h-4 w-4" />
                  Generate Bill
                </button>
                <button
                  onClick={handleGenerateAndShareBill}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#11496c] to-[#0d3a52] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(17,73,108,0.3)] transition-all hover:from-[#0d3a52] hover:to-[#0a2d3f] hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <>
                      <IoPaperPlaneOutline className="h-4 w-4" />
                      Share Bill
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryPatients
