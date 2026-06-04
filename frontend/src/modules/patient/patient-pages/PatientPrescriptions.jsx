import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useToast } from '../../../contexts/ToastContext'
import {
  getPatientPrescriptions,
  getDoctors,
  getDiscoveryPharmacies,
  getDiscoveryLaboratories,
  createPatientRequest,
  getPatientReports,
} from '../patient-services/patientService'
import { getFileUrl } from '../../../utils/apiClient'
import Pagination from '../../../components/Pagination'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoShareSocialOutline,
  IoEyeOutline,
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoCloseOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoSearchOutline,
  IoPeopleOutline,
  IoStar,
  IoStarOutline,
  IoInformationCircleOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoFootstepsOutline,
  IoScaleOutline,
  IoAdd,
  IoWaterOutline,
  IoPulseOutline,
  IoMedkitOutline,
  IoPersonOutline,
  IoStatsChartOutline,
} from 'react-icons/io5'

// Default prescriptions (will be replaced by API data)
const defaultPrescriptions = []

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-3 w-3 text-amber-400" />)
  }

  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-3 w-3 text-amber-400" />)
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(<IoStarOutline key={`empty-${i}`} className="h-3 w-3 text-slate-300" />)
  }

  return stars
}

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

const PatientPrescriptions = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharePrescriptionId, setSharePrescriptionId] = useState(null)
  const [selectedDoctors, setSelectedDoctors] = useState([])
  const [shareSearchTerm, setShareSearchTerm] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  // Lab report sharing and viewing states
  const [selectedLabReport, setSelectedLabReport] = useState(null)
  const [showLabShareModal, setShowLabShareModal] = useState(false)
  const [showLabViewModal, setShowLabViewModal] = useState(false)
  const [selectedLabDoctorId, setSelectedLabDoctorId] = useState(null)
  const [isSharingLabReport, setIsSharingLabReport] = useState(false)

  // Test visit modal states
  const [showTestVisitModal, setShowTestVisitModal] = useState(false)
  const [testVisitPrescription, setTestVisitPrescription] = useState(null)

  // Get active tab from URL params, default to 'vitals'
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'lab-reports' ? 'lab-reports' : 
    tabFromUrl === 'prescriptions' ? 'prescriptions' : 'vitals'
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'lab-reports') {
      setActiveTab('lab-reports')
    } else if (tab === 'prescriptions') {
      setActiveTab('prescriptions')
    } else if (tab === 'vitals') {
      setActiveTab('vitals')
    }
  }, [searchParams])

  const [prescriptions, setPrescriptions] = useState(defaultPrescriptions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentLabReportsPage, setCurrentLabReportsPage] = useState(1)
  const itemsPerPage = 10

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientPrescriptions()

        if (response.success && response.data) {
          const prescriptionsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || response.data.prescriptions || []

          // Transform API data to match component structure
          const transformed = prescriptionsData.map(presc => ({
            id: presc._id || presc.id,
            _id: presc._id || presc.id,
            doctor: presc.doctorId ? {
              name: (() => {
                // Build doctor name from firstName and lastName
                if (presc.doctorId.firstName && presc.doctorId.lastName) {
                  return `Dr. ${presc.doctorId.firstName} ${presc.doctorId.lastName}`
                } else if (presc.doctorId.firstName) {
                  return `Dr. ${presc.doctorId.firstName}`
                } else if (presc.doctorId.lastName) {
                  return `Dr. ${presc.doctorId.lastName}`
                } else if (presc.doctorId.name) {
                  return presc.doctorId.name.startsWith('Dr.') ? presc.doctorId.name : `Dr. ${presc.doctorId.name}`
                } else {
                  // Last resort: check originalData or use fallback
                  return presc.originalData?.doctorId?.firstName || presc.originalData?.doctorId?.lastName
                    ? `Dr. ${presc.originalData.doctorId.firstName || ''} ${presc.originalData.doctorId.lastName || ''}`.trim()
                    : 'Dr. Unknown'
                }
              })(),
              specialty: presc.doctorId.specialization || presc.doctorId.specialty || '',
              phone: presc.doctorId.phone || '',
              email: presc.doctorId.email || '',
              clinicName: presc.doctorId.clinicDetails?.name || presc.doctorId.clinicDetails?.clinicName || '',
              clinicAddress: presc.doctorId.clinicDetails?.address || null,
              digitalSignature: presc.doctorId.digitalSignature || null,
              image: presc.doctorId.profileImage || presc.doctorId.image || (() => {
                const firstName = presc.doctorId.firstName || ''
                const lastName = presc.doctorId.lastName || ''
                const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Doctor'
                return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=11496c&color=fff&size=128&bold=true`
              })(),
            } : (presc.doctor || {}),
            patient: presc.patientId ? {
              name: presc.patientId.firstName && presc.patientId.lastName
                ? `${presc.patientId.firstName} ${presc.patientId.lastName}`
                : presc.patientId.name || 'N/A',
              dateOfBirth: presc.patientId.dateOfBirth || null,
              age: presc.patientId.dateOfBirth
                ? Math.floor((new Date() - new Date(presc.patientId.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
              gender: presc.patientId.gender || 'N/A',
              phone: presc.patientId.phone || 'N/A',
              email: presc.patientId.email || '',
              address: presc.patientId.address || null,
            } : null,
            issuedAt: presc.createdAt ? new Date(presc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: presc.status || 'active',
            // Get diagnosis, symptoms, investigations from consultationId if available
            diagnosis: presc.consultationId?.diagnosis || presc.diagnosis || '',
            symptoms: presc.consultationId?.symptoms || presc.symptoms || '',
            medications: presc.medicines || presc.medications || [],
            investigations: presc.consultationId?.investigations || presc.investigations || [],
            advice: presc.consultationId?.advice || presc.advice || presc.notes || '',
            followUpAt: presc.consultationId?.followUpDate || presc.followUpDate || presc.followUpAt || null,
            pdfUrl: presc.pdfFileUrl || presc.pdfUrl || '#',
            sharedWith: presc.sharedWith || {
              pharmacies: [],
              laboratories: [],
            },
            originalData: presc,
          }))

          setPrescriptions(transformed)
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err)
        setError(err.message || 'Failed to load prescriptions')
        toast.error('Failed to load prescriptions')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [toast])

  const filteredPrescriptions = prescriptions.filter((presc) => {
    if (filter === 'all') return true
    return presc.status === filter
  })

  // Calculate paginated prescriptions
  const paginatedPrescriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredPrescriptions.slice(startIndex, endIndex)
  }, [filteredPrescriptions, currentPage])

  const prescriptionsTotalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage)
  const prescriptionsTotalItems = filteredPrescriptions.length

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const currentPrescription = prescriptions.find((p) => p.id === sharePrescriptionId)

  useEffect(() => {
    if (showShareModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showShareModal])

  const handleShareClick = (prescriptionId) => {
    setSharePrescriptionId(prescriptionId)
    setSelectedDoctors([])
    setShareSearchTerm('')
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
    setSharePrescriptionId(null)
    setSelectedDoctors([])
    setShareSearchTerm('')
  }

  // Helper function to convert image URL to base64
  const urlToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataURL = canvas.toDataURL('image/png')
          resolve(dataURL)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = reject
      img.src = url
    })
  }

  const generatePDF = (prescriptionData) => {
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

    // Header Section - Heallyn (Above Clinic Name) - Reduced size
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Heallyn', pageWidth / 2, yPos, { align: 'center' })
    yPos += 6

    // Clinic Name in Teal (Below Heallyn) - Reduced size
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    const clinicName = prescriptionData.doctor?.clinicName || prescriptionData.originalData?.doctorId?.clinicDetails?.name || prescriptionData.originalData?.doctorId?.clinicDetails?.clinicName || 'Super Clinic'
    doc.text(clinicName, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Clinic Address (Centered) - Reduced spacing - Convert object to string
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    let clinicAddressRaw = prescriptionData.doctor?.clinicAddress || prescriptionData.originalData?.doctorId?.clinicDetails?.address
    let clinicAddress = 'Address not provided'

    if (clinicAddressRaw) {
      if (typeof clinicAddressRaw === 'string') {
        clinicAddress = clinicAddressRaw
      } else if (typeof clinicAddressRaw === 'object' && clinicAddressRaw !== null) {
        // Convert address object to string
        const addressParts = []
        if (clinicAddressRaw.line1) addressParts.push(clinicAddressRaw.line1)
        if (clinicAddressRaw.line2) addressParts.push(clinicAddressRaw.line2)
        if (clinicAddressRaw.city) addressParts.push(clinicAddressRaw.city)
        if (clinicAddressRaw.state) addressParts.push(clinicAddressRaw.state)
        if (clinicAddressRaw.postalCode || clinicAddressRaw.pincode) {
          addressParts.push(clinicAddressRaw.postalCode || clinicAddressRaw.pincode)
        }
        if (clinicAddressRaw.country) addressParts.push(clinicAddressRaw.country)
        clinicAddress = addressParts.join(', ').trim() || 'Address not provided'
      }
    }

    const addressLines = doc.splitTextToSize(clinicAddress, pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 3
    })

    // Contact Information (Left: Phone, Right: Email) - Compact
    yPos += 1
    doc.setFontSize(7)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.2, 'F')
    doc.setTextColor(0, 0, 0)
    const phone = prescriptionData.doctor?.phone || prescriptionData.originalData?.doctorId?.phone || 'N/A'
    doc.text(phone, margin + 5, contactY)

    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.2, 'F')
    const email = prescriptionData.doctor?.email || prescriptionData.originalData?.doctorId?.email || 'N/A'
    doc.text(email, pageWidth - margin, contactY, { align: 'right' })
    yPos += 4

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Doctor Information (Left) and Patient Information (Right) - Compact
    const infoStartY = yPos
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })

    yPos = infoStartY + 5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    // Doctor Info (Left)
    doc.text(`Name: ${prescriptionData.doctor.name}`, margin, yPos)
    doc.text(`Specialty: ${prescriptionData.doctor.specialty}`, margin, yPos + 3)
    const issuedDate = formatDate(prescriptionData.issuedAt)
    doc.text(`Date: ${issuedDate}`, margin, yPos + 6)

    // Patient Info (Right) - Get from prescriptionData.patient first, then originalData
    let patientYPos = yPos
    const patient = prescriptionData.patient || prescriptionData.originalData?.patientId
    const patientName = patient?.name || (patient?.firstName && patient?.lastName
      ? `${patient.firstName} ${patient.lastName}`
      : 'N/A')
    doc.text(`Name: ${patientName}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    const patientAge = patient?.age || (patient?.dateOfBirth
      ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null)
    doc.text(`Age: ${patientAge ? `${patientAge} years` : 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    const patientGender = patient?.gender || 'N/A'
    doc.text(`Gender: ${patientGender}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    const patientPhone = patient?.phone || 'N/A'
    doc.text(`Phone: ${patientPhone}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    // Patient Address - Always show if available
    const patientAddress = patient?.address
    if (patientAddress) {
      let addressText = ''
      if (typeof patientAddress === 'string') {
        addressText = patientAddress
      } else if (typeof patientAddress === 'object' && patientAddress !== null) {
        const addressParts = []
        if (patientAddress.line1) addressParts.push(patientAddress.line1)
        if (patientAddress.line2) addressParts.push(patientAddress.line2)
        if (patientAddress.city) addressParts.push(patientAddress.city)
        if (patientAddress.state) addressParts.push(patientAddress.state)
        if (patientAddress.pincode || patientAddress.postalCode) {
          addressParts.push(patientAddress.pincode || patientAddress.postalCode)
        }
        if (patientAddress.country) addressParts.push(patientAddress.country)
        addressText = addressParts.join(', ').trim()
      }

      if (addressText && addressText !== '[object Object]') {
        const addressLines = doc.splitTextToSize(`Address: ${addressText}`, pageWidth / 2 - margin - 5)
        addressLines.forEach((line, index) => {
          doc.text(line, pageWidth - margin, patientYPos + (index * 3), { align: 'right' })
        })
        patientYPos += (addressLines.length - 1) * 3
      }
    }

    // Set yPos to the maximum of doctor info end or patient info end
    yPos = Math.max(yPos + 9, patientYPos) + 2

    // Diagnosis Section with Light Blue Background Box - Compact
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 5

    // Light blue rounded box for diagnosis - Smaller height
    const diagnosisHeight = 6
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 3, yPos + 1)
    yPos += diagnosisHeight + 3

    // Symptoms Section with Green Bullet Points - Compact
    if (prescriptionData.symptoms) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      const symptomLines = typeof prescriptionData.symptoms === 'string'
        ? prescriptionData.symptoms.split('\n').filter(line => line.trim())
        : Array.isArray(prescriptionData.symptoms)
          ? prescriptionData.symptoms.filter(s => s && s.trim())
          : [String(prescriptionData.symptoms)]

      symptomLines.forEach((symptom) => {
        // Check if we're getting too close to bottom - stop if needed
        if (yPos > pageHeight - 60) return

        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.2, yPos - 0.8, 1, 'F')
        doc.setTextColor(0, 0, 0)
        const symptomText = typeof symptom === 'string' ? symptom.trim() : String(symptom)
        doc.text(symptomText, margin + 4, yPos)
        yPos += 3
      })
      yPos += 1
    }

    // Medications Section with Numbered Cards (Light Gray Background) - Compact
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 5

      prescriptionData.medications.forEach((med, idx) => {
        // NO PAGE BREAKS - Force everything to fit on one page
        // Make medication cards more compact
        const cardHeight = 18
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')

        // Numbered square in teal (top-right corner) - Smaller
        const numberSize = 6
        const numberX = pageWidth - margin - numberSize - 2
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 0.5, { align: 'center' })

        // Medication name (bold, top) - Smaller font
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 3, yPos + 2)

        // Medication details in 2 columns (left and right) - Smaller font
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 3
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 3
        const startY = yPos + 6

        // Left column
        doc.text(`Dosage: ${med.dosage || 'N/A'}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 3)

        // Right column
        doc.text(`Frequency: ${med.frequency || 'N/A'}`, rightColX, startY)
        if (med.instructions) {
          const instructionText = doc.splitTextToSize(`Instructions: ${med.instructions}`, (pageWidth - 2 * margin) / 2 - 5)
          instructionText.forEach((line, i) => {
            if (i === 0) {
              doc.text(line, rightColX, startY + 3)
            } else {
              doc.text(line, rightColX, startY + 3 + (i * 3))
            }
          })
        }

        yPos += cardHeight + 2
      })
      yPos += 1
    }

    // Recommended Tests Section (Light Purple Boxes) - Compact
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 5

      prescriptionData.investigations.forEach((inv) => {
        // NO PAGE BREAKS - Stop if getting too close to bottom
        if (yPos > pageHeight - 50) return

        // Handle both frontend format (name) and backend format (testName)
        const invName = inv.name || inv.testName || 'Investigation'
        const invNotes = inv.notes || ''

        // Ensure invName is a valid string (not null, undefined, or object)
        const invNameStr = typeof invName === 'string' ? invName : String(invName || 'Investigation')
        const invNotesStr = typeof invNotes === 'string' ? invNotes : String(invNotes || '')

        // Light purple box for each test - Smaller height
        const testBoxHeight = invNotesStr ? 10 : 7
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')

        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(invNameStr, margin + 3, yPos + 1.5)

        if (invNotesStr) {
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(invNotesStr, margin + 3, yPos + 6)
        }

        yPos += testBoxHeight + 2
      })
      yPos += 1
    }

    // Medical Advice Section - Compact - Always show if available
    if (prescriptionData.advice) {
      // Check if we have space, if not, adjust yPos
      if (yPos > pageHeight - 50) {
        yPos = pageHeight - 50
      }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const adviceText = typeof prescriptionData.advice === 'string' ? prescriptionData.advice : String(prescriptionData.advice || '')
      const adviceLines = doc.splitTextToSize(adviceText, pageWidth - 2 * margin)
      adviceLines.forEach((advice) => {
        if (yPos > pageHeight - 45) return
        doc.text(advice.trim(), margin, yPos)
        yPos += 3
      })
      yPos += 1
    }

    // Follow-up Appointment (Light Yellow Box) - Compact
    if ((prescriptionData.followUpAt || prescriptionData.followUpDate) && yPos < pageHeight - 35) {
      const followUpHeight = 9
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')

      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 0.5, 2.5, 2.5, 0.5, 0.5, 'F')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 6, yPos + 2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const followUpDateValue = prescriptionData.followUpAt || prescriptionData.followUpDate
      const followUpDate = new Date(followUpDateValue).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 6, yPos + 6)
      yPos += followUpHeight + 3
    }

    // Footer with Doctor Signature (Right side) - Fixed position
    // Ensure signature is always visible at the bottom
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side) - Compact and properly positioned
    const signatureAreaWidth = 50  // Standard signature width
    const signatureX = pageWidth - margin - 55  // Position from right margin (55 = area width + spacing)
    const signatureY = yPos

    // Get digital signature from prescription data - handle both object and string formats
    const digitalSignatureRaw = prescriptionData.doctor?.digitalSignature || prescriptionData.originalData?.doctorId?.digitalSignature
    let signatureImageUrl = ''

    // Extract imageUrl from signature object or use string directly
    if (digitalSignatureRaw) {
      if (typeof digitalSignatureRaw === 'string') {
        signatureImageUrl = digitalSignatureRaw.trim()
      } else if (typeof digitalSignatureRaw === 'object' && digitalSignatureRaw !== null) {
        signatureImageUrl = digitalSignatureRaw.imageUrl || digitalSignatureRaw.url || ''
      }
    }

    // Add digital signature image if available
    if (signatureImageUrl && signatureImageUrl !== '') {
      try {
        let imageData = signatureImageUrl
        let imageFormat = 'PNG'

        // Determine image format from data URL or file extension
        if (imageData.includes('data:image/jpeg') || imageData.includes('data:image/jpg')) {
          imageFormat = 'JPEG'
        } else if (imageData.includes('data:image/png')) {
          imageFormat = 'PNG'
        } else if (imageData.includes('data:image/')) {
          const match = imageData.match(/data:image\/(\w+);/)
          if (match) {
            imageFormat = match[1].toUpperCase()
          }
        } else if (imageData.toLowerCase().endsWith('.jpg') || imageData.toLowerCase().endsWith('.jpeg')) {
          imageFormat = 'JPEG'
        } else if (imageData.toLowerCase().endsWith('.png')) {
          imageFormat = 'PNG'
        }

        // Calculate signature image dimensions - compact size for prescription
        // Standard signature size: width 50, height 18 (in jsPDF points)
        // This ensures signature is small and properly fits in the document
        const signatureWidth = 50  // Compact width
        const signatureHeight = 18  // Compact height

        // Position signature image above the signature line
        // Position it 18 points above the signature line (standard spacing)
        const signatureImageY = signatureY - signatureHeight

        // Add signature image with compact dimensions, properly positioned
        doc.addImage(imageData, imageFormat, signatureX, signatureImageY, signatureWidth, signatureHeight, undefined, 'FAST')
        
      } catch (error) {
        console.error('Error adding signature image to PDF:', error)
        // Fallback to line if image fails
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(signatureX, signatureY, signatureX + 50, signatureY)
      }
    } else {
      // Draw a line for signature if no image available
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    }

    // Doctor name and designation below signature (centered under signature area)
    // Adjust position based on whether signature image is present
    // signatureImageUrl is already declared above, check if it has a value
    const hasSignatureImage = signatureImageUrl && signatureImageUrl !== ''

    // Position text appropriately - if image exists, position below it, otherwise below line
    const textYPos = hasSignatureImage ? signatureY + 6 : signatureY + 8
    const centerX = signatureX + 25  // Center of signature area (50/2 = 25)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    const doctorName = prescriptionData.doctor?.name || 'Dr. Unknown'
    doc.text(doctorName, centerX, textYPos, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const doctorSpecialty = prescriptionData.doctor?.specialty || ''
    doc.text(doctorSpecialty, centerX, textYPos + 4, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 4
    doc.setFontSize(5.5)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    return doc
  }

  const handleDownloadPDF = async (prescription) => {
    try {
      // If signature is a URL (not base64), convert it to base64 first
      const digitalSignatureRaw = prescription.doctor?.digitalSignature || prescription.originalData?.doctorId?.digitalSignature
      let signatureImageUrl = ''

      if (digitalSignatureRaw) {
        if (typeof digitalSignatureRaw === 'string') {
          signatureImageUrl = digitalSignatureRaw.trim()
        } else if (typeof digitalSignatureRaw === 'object' && digitalSignatureRaw !== null) {
          signatureImageUrl = digitalSignatureRaw.imageUrl || digitalSignatureRaw.url || ''
        }
      }

      // If signature is a URL (not base64), convert to base64
      if (signatureImageUrl && !signatureImageUrl.startsWith('data:image/')) {
        try {
          const base64Signature = await urlToBase64(signatureImageUrl)
          // Update prescription data with base64 signature
          prescription = {
            ...prescription,
            doctor: {
              ...prescription.doctor,
              digitalSignature: base64Signature
            }
          }
        } catch (error) {
          console.warn('Could not convert signature URL to base64, will try direct URL:', error)
        }
      }

      const doc = generatePDF(prescription)
      const fileName = `Prescription_${prescription.doctor.name.replace(/\s+/g, '_')}_${prescription.issuedAt}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  const handleViewPDF = async (prescription) => {
    try {
      // If signature is a URL (not base64), convert it to base64 first
      const digitalSignatureRaw = prescription.doctor?.digitalSignature || prescription.originalData?.doctorId?.digitalSignature
      let signatureImageUrl = ''

      if (digitalSignatureRaw) {
        if (typeof digitalSignatureRaw === 'string') {
          signatureImageUrl = digitalSignatureRaw.trim()
        } else if (typeof digitalSignatureRaw === 'object' && digitalSignatureRaw !== null) {
          signatureImageUrl = digitalSignatureRaw.imageUrl || digitalSignatureRaw.url || ''
        }
      }

      // If signature is a URL (not base64), convert to base64
      if (signatureImageUrl && !signatureImageUrl.startsWith('data:image/')) {
        try {
          const base64Signature = await urlToBase64(signatureImageUrl)
          // Update prescription data with base64 signature
          prescription = {
            ...prescription,
            doctor: {
              ...prescription.doctor,
              digitalSignature: base64Signature
            }
          }
        } catch (error) {
          console.warn('Could not convert signature URL to base64, will try direct URL:', error)
        }
      }

      const doc = generatePDF(prescription)
      // Generate PDF blob and open in new window
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 100)
    } catch (error) {
      console.error('Error viewing PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  const toggleDoctorSelection = (doctorId) => {
    setSelectedDoctors((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId)
      }
      return [...prev, doctorId]
    })
  }

  const handleShare = async () => {
    if (selectedDoctors.length === 0) {
      return
    }

    setIsSharing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setIsSharing(false)

    // Navigate to first doctor's booking page
    if (selectedDoctors.length > 0) {
      const firstDoctorId = selectedDoctors[0]
      handleCloseShareModal()
      // Navigate to doctor details page with booking modal open
      navigate(`/patient/doctors/${firstDoctorId}?book=true`)
    }
  }

  const handleBookTestVisit = (prescription) => {
    // Show modal to select Home or Lab
    setTestVisitPrescription(prescription)
    setShowTestVisitModal(true)
  }

  const handleTestVisitHome = async () => {
    if (!testVisitPrescription) return

    try {
      setIsSharing(true)

      // Get prescription ID
      const prescriptionId = testVisitPrescription._id || testVisitPrescription.id

      if (!prescriptionId) {
        toast.error('Prescription ID not found')
        setIsSharing(false)
        return
      }

      // Create request via API
      const response = await createPatientRequest({
        type: 'book_test_visit',
        prescriptionId,
        visitType: 'home',
      })

      if (response.success) {
        // Close modal
        setShowTestVisitModal(false)
        setTestVisitPrescription(null)
        toast.success('Home sample collection request sent successfully! Admin will review and approve your request.')
      }
    } catch (error) {
      console.error('Error sending home test visit request:', error)
      toast.error(error.message || 'Error sending request. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleTestVisitLab = async () => {
    if (!testVisitPrescription) return

    try {
      setIsSharing(true)

      // Get prescription ID
      const prescriptionId = testVisitPrescription._id || testVisitPrescription.id

      if (!prescriptionId) {
        toast.error('Prescription ID not found')
        setIsSharing(false)
        return
      }

      // Create request via API
      const response = await createPatientRequest({
        type: 'book_test_visit',
        prescriptionId,
        visitType: 'lab',
      })

      if (response.success) {
        // Close modal
        setShowTestVisitModal(false)
        setTestVisitPrescription(null)
        toast.success('Lab visit request sent successfully! Admin will review and approve your request.')
      }
    } catch (error) {
      console.error('Error sending lab visit request:', error)
      toast.error(error.message || 'Error sending request. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleOrderMedicine = async (prescription) => {
    try {
      setIsSharing(true)

      // Get prescription ID
      const prescriptionId = prescription._id || prescription.id

      if (!prescriptionId) {
        toast.error('Prescription ID not found')
        setIsSharing(false)
        return
      }

      // Create request via API
      const response = await createPatientRequest({
        type: 'order_medicine',
        prescriptionId,
      })

      if (response.success) {
        toast.success('Medicine order request sent successfully!')
      }
    } catch (error) {
      console.error('Error sending medicine order request:', error)
      toast.error(error.message || 'Error sending request. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  // Calculate prescription counts
  const activePrescriptionsCount = prescriptions.filter((p) => p.status === 'active').length
  const totalPrescriptionsCount = prescriptions.length

  // Load lab reports from API
  const [labReports, setLabReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)

  // State for doctors, pharmacies, and labs
  const [doctors, setDoctors] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [labs, setLabs] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingPharmacies, setLoadingPharmacies] = useState(false)
  const [loadingLabs, setLoadingLabs] = useState(false)

  // Filter doctors for sharing (must be after doctors state declaration)
  const filteredDoctors = doctors.filter((doctor) => {
    if (!doctor.isActive) return false

    const search = shareSearchTerm.toLowerCase()
    const doctorName = doctor.firstName && doctor.lastName
      ? `Dr. ${doctor.firstName} ${doctor.lastName}`
      : doctor.name || ''
    const specialty = doctor.specialization || doctor.specialty || ''
    const location = doctor.clinicDetails?.clinicName || doctor.location || ''

    return (
      doctorName.toLowerCase().includes(search) ||
      specialty.toLowerCase().includes(search) ||
      location.toLowerCase().includes(search)
    )
  })

  // Fetch doctors for sharing
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true)
        const response = await getDoctors({ limit: 50 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items || []
          setDoctors(items)
        }
      } catch (error) {
        console.error('Error fetching doctors:', error)
        setDoctors([])
      } finally {
        setLoadingDoctors(false)
      }
    }

    if (showShareModal || showLabShareModal) {
      fetchDoctors()
    }
  }, [showShareModal, showLabShareModal])

  // Fetch pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        setLoadingPharmacies(true)
        const response = await getDiscoveryPharmacies({ limit: 20 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items || []
          setPharmacies(items)
        }
      } catch (error) {
        console.error('Error fetching pharmacies:', error)
        setPharmacies([])
      } finally {
        setLoadingPharmacies(false)
      }
    }

    fetchPharmacies()
  }, [])

  // Fetch labs
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoadingLabs(true)
        const response = await getDiscoveryLaboratories({ limit: 20 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items || []
          setLabs(items)
        }
      } catch (error) {
        console.error('Error fetching labs:', error)
        setLabs([])
      } finally {
        setLoadingLabs(false)
      }
    }

    fetchLabs()
  }, [])

  useEffect(() => {
    const fetchLabReports = async () => {
      try {
        setLoadingReports(true)
        const response = await getPatientReports({ limit: 50 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items || []

          const mapped = items.map((report) => ({
            id: report._id || report.id,
            testName: report.testName || report.test?.name || 'Lab Test',
            labName: report.laboratoryId?.labName || report.labName || 'Laboratory',
            labId: report.laboratoryId?._id || report.laboratoryId || report.labId,
            date: report.createdAt || report.reportDate || report.date || new Date().toISOString(),
            status: report.status || 'ready',
            pdfFileUrl: report.pdfFileUrl || null,
            pdfFileName:
              report.pdfFileName ||
              `${report.testName || 'Report'}_${new Date(report.createdAt || Date.now()).toISOString().split('T')[0]}.pdf`,
            original: report,
          }))

          setLabReports(mapped)
        } else {
          setLabReports([])
        }
      } catch (error) {
        console.error('Error loading lab reports:', error)
        setLabReports([])
      } finally {
        setLoadingReports(false)
      }
    }

    fetchLabReports()
    // Refresh every 30 seconds to get new reports
    const interval = setInterval(fetchLabReports, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calculate lab reports count
  const labReportsCount = labReports.length

  // Calculate paginated lab reports
  const paginatedLabReports = useMemo(() => {
    const startIndex = (currentLabReportsPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return labReports.slice(startIndex, endIndex)
  }, [labReports, currentLabReportsPage])

  const labReportsTotalPages = Math.ceil(labReports.length / itemsPerPage)
  const labReportsTotalItems = labReports.length

  // State for patient appointments
  const [patientAppointments, setPatientAppointments] = useState([])

  // Fetch patient appointments to check if doctor has appointment
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { getPatientAppointments } = await import('../patient-services/patientService')
        const response = await getPatientAppointments({ limit: 100 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items || []
          setPatientAppointments(items)
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setPatientAppointments([])
      }
    }

    if (showShareModal || showLabShareModal) {
      fetchAppointments()
    }
  }, [showShareModal, showLabShareModal])

  // Check if patient has appointment with a doctor
  const checkPatientHasAppointment = (doctorId) => {
    return patientAppointments.some(
      (apt) =>
        (apt.doctorId?._id || apt.doctorId?.id || apt.doctorId) === doctorId &&
        (apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'completed')
    )
  }

  // Lab report handlers
  const handleShareLabReportClick = (report) => {
    setSelectedLabReport(report)
    setSelectedLabDoctorId(null)
    setShowLabShareModal(true)
  }

  const handleCloseLabShareModal = () => {
    setShowLabShareModal(false)
    setSelectedLabReport(null)
    setSelectedLabDoctorId(null)
  }

  const handleViewLabReportClick = (report) => {
    if (report.pdfFileUrl && report.pdfFileUrl !== '#') {
      const url = getFileUrl(report.pdfFileUrl)
      window.open(url, '_blank')
    } else {
      setSelectedLabReport(report)
      setShowLabViewModal(true)
    }
  }

  const handleCloseLabViewModal = () => {
    setShowLabViewModal(false)
    setSelectedLabReport(null)
  }

  const handleShareLabReportWithDoctor = async () => {
    if (!selectedLabReport || !selectedLabDoctorId) return

    setIsSharingLabReport(true)

    const selectedDoctor = doctors.find(doc => (doc._id || doc.id) === selectedLabDoctorId)

    if (!selectedDoctor) {
      setIsSharingLabReport(false)
      toast.error('Doctor not found')
      return
    }

    const doctorName = selectedDoctor.firstName && selectedDoctor.lastName
      ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
      : selectedDoctor.name || 'Doctor'

    // Check if patient has appointment with this doctor
    const hasAppointment = checkPatientHasAppointment(selectedLabDoctorId)

    if (hasAppointment || (selectedLabReport.doctorId && selectedLabDoctorId === selectedLabReport.doctorId)) {
      // Direct share - TODO: Implement API for sharing reports with doctors
      // For now, just show success message
      setTimeout(() => {
        setIsSharingLabReport(false)
        handleCloseLabShareModal()
        toast.success(`Report will be shared with ${doctorName}. Note: This feature will be available via API soon.`)
      }, 1000)
    } else {
      // Share with other doctor - requires booking
      setTimeout(() => {
        setIsSharingLabReport(false)
        handleCloseLabShareModal()
        toast.info(`To share with ${doctorName}, please book an appointment first.`)
        // Navigate to doctor details page with booking modal
        navigate(`/patient/doctors/${selectedLabDoctorId}?book=true`)
      }, 1000)
    }
  }

  const handleDownloadLabReport = async (report) => {
    // If PDF file URL is available, download the lab-uploaded PDF
    if (report.pdfFileUrl && report.pdfFileUrl !== '#') {
      try {
        // Check if we have stored PDF in localStorage (from previous download)
        const storedPdfs = JSON.parse(localStorage.getItem('patientLabReportPdfs') || '{}')
        const storedPdf = storedPdfs[report.id]

        if (storedPdf && storedPdf.base64Data) {
          // Use stored PDF if available
          const link = document.createElement('a')
          link.href = storedPdf.base64Data
          link.download = storedPdf.pdfFileName || report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          return
        }

        // Check if URL is from same origin or is a data URL
        const isSameOrigin = report.pdfFileUrl.startsWith(window.location.origin) || report.pdfFileUrl.startsWith('/')
        const isDataUrl = report.pdfFileUrl.startsWith('data:')

        if (isDataUrl) {
          // Direct download for data URLs
          const link = document.createElement('a')
          link.href = report.pdfFileUrl
          link.download = report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          return
        }

        // Only try fetch for same-origin URLs to avoid CORS errors
        if (isSameOrigin) {
          try {
            const response = await fetch(getFileUrl(report.pdfFileUrl), {
              method: 'GET',
            })

            if (response.ok) {
              const blob = await response.blob()

              // Create a blob URL for download
              const blobUrl = URL.createObjectURL(blob)

              // Create download link
              const link = document.createElement('a')
              link.href = blobUrl
              link.download = report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)

              // Clean up blob URL
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl)
              }, 100)

              // Store PDF in localStorage for offline access
              try {
                const reader = new FileReader()
                reader.onloadend = () => {
                  const base64Data = reader.result
                  const updatedStoredPdfs = JSON.parse(localStorage.getItem('patientLabReportPdfs') || '{}')
                  updatedStoredPdfs[report.id] = {
                    pdfFileUrl: report.pdfFileUrl,
                    pdfFileName: report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`,
                    base64Data: base64Data,
                    downloadedAt: new Date().toISOString(),
                  }
                  localStorage.setItem('patientLabReportPdfs', JSON.stringify(updatedStoredPdfs))
                }
                reader.readAsDataURL(blob)
              } catch (storageError) {
                console.error('Error storing PDF:', storageError)
              }
              return
            }
          } catch (fetchError) {
            // Silently handle fetch errors for same-origin (shouldn't happen but handle gracefully)
            console.warn('Fetch failed for same-origin URL')
          }
        }

        // For external URLs (cross-origin), don't try fetch (will cause CORS error)
        // Just open in new tab - browser will handle download if server allows
        window.open(getFileUrl(report.pdfFileUrl), '_blank')
      } catch (error) {
        console.error('Error downloading PDF:', error)
        // Last resort: open in new tab
        window.open(getFileUrl(report.pdfFileUrl), '_blank')
      }
      return
    }

    // Fallback: Generate and download PDF report if no PDF file URL
    // Generate and download PDF report
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lab Report - ${report.testName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 28px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 15px;
      border-left: 4px solid #3b82f6;
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
  </style>
</head>
<body>
  <div class="header">
    <h1>Lab Test Report</h1>
    <div style="color: #64748b; margin-top: 5px; font-size: 14px;">Heallyn - Your Health Partner</div>
  </div>
  <div class="section">
    <div class="section-title">Report Information</div>
    <div class="info-row">
      <span class="info-label">Test Name:</span>
      <span class="info-value">${report.testName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Laboratory:</span>
      <span class="info-value">${report.labName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Report Date:</span>
      <span class="info-value">${formatDate(report.date)}</span>
    </div>
  </div>
</body>
</html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(pdfContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  }

  return (
    <section className="flex flex-col gap-6 pb-20 max-w-7xl mx-auto w-full px-4 md:px-0">
      {/* Vitals Tab Content */}
      {activeTab === 'vitals' && (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Diet Plan Banner - Premium Upgrade */}
          <div className="relative overflow-hidden rounded-[40px] bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 group">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-50 group-hover:bg-orange-100 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  Limited Time Offer
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Get your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">7 Days</span>
                  <br />Smart Diet Plan
                </h2>
                <p className="text-slate-500 font-bold max-w-md text-sm md:text-base">
                  Personalized nutrition guidance powered by AI, tailored to your health records and lifestyle.
                </p>
                <div className="pt-6">
                  <button 
                    onClick={() => toast.info('Diet plan generation coming soon!')}
                    className="w-full md:w-auto px-12 py-4 bg-[#11496c] text-white font-black uppercase tracking-widest text-xs rounded-[20px] hover:bg-[#0d3a52] transition-all shadow-xl shadow-[#11496c]/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span>Generate It Now</span>
                    <IoArrowForwardOutline className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="relative z-20 transition-transform duration-500 group-hover:scale-110">
                  <img 
                    src="https://img.freepik.com/free-vector/healthy-lifestyle-diet-plan-illustration_23-2148529240.jpg" 
                    alt="Healthy Diet Illustration" 
                    className="w-full max-w-[340px] mx-auto object-contain drop-shadow-2xl"
                  />
                </div>
                {/* Image Backdrop Glow */}
                <div className="absolute inset-0 bg-orange-500/5 blur-[80px] rounded-full scale-75" />
              </div>
            </div>
          </div>
          {/* Health Trackers Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Health Trackers</h2>
              <button className="text-xs font-black text-[#11496c] uppercase tracking-widest hover:underline">View History</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'steps', title: 'Step Count', Icon: IoFootstepsOutline, color: 'text-teal-500', bg: 'bg-teal-50', value: '8,432', unit: 'steps' },
                { id: 'sugar', title: 'Log Sugar', Icon: IoWaterOutline, color: 'text-blue-500', bg: 'bg-blue-50', value: '98', unit: 'mg/dL' },
                { id: 'weight', title: 'Track Weight', Icon: IoScaleOutline, color: 'text-cyan-500', bg: 'bg-cyan-50', value: '72.5', unit: 'kg' },
                { id: 'bp', title: 'Blood Pressure', Icon: IoPulseOutline, color: 'text-rose-500', bg: 'bg-rose-50', value: '120/80', unit: 'mmHg' },
                { id: 'medicine', title: 'Track Medicine', Icon: IoMedkitOutline, color: 'text-emerald-500', bg: 'bg-emerald-50', count: totalPrescriptionsCount, value: totalPrescriptionsCount, unit: 'active' },
                { id: 'doctor', title: 'Doctor', Icon: IoPersonOutline, color: 'text-indigo-500', bg: 'bg-indigo-50', value: '4', unit: 'consults' },
              ].map((tracker) => (
                <div 
                  key={tracker.id}
                  onClick={() => {
                    if (tracker.id === 'medicine') {
                      setActiveTab('prescriptions')
                      setSearchParams({ tab: 'prescriptions' })
                    } else if (tracker.id === 'doctor') {
                      navigate('/patient/doctors')
                    } else {
                      toast.info(`${tracker.title} tracking coming soon!`)
                    }
                  }}
                  className="group relative overflow-hidden flex flex-col p-6 bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:shadow-[#11496c]/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3.5 rounded-2xl ${tracker.bg} ${tracker.color} transition-transform group-hover:scale-110`}>
                      <tracker.Icon className="h-6 w-6" />
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#11496c] group-hover:text-white transition-all">
                      <IoAdd className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{tracker.title}</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl font-black text-slate-900">{tracker.value}</span>
                      <span className="text-xs font-bold text-slate-500">{tracker.unit}</span>
                    </div>
                  </div>

                  {/* Sparkline Decorative Element */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#11496c]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access to Reports */}
          <div className="mt-4 overflow-hidden rounded-[32px] bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-8 shadow-xl shadow-[#11496c]/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                  <IoDocumentTextOutline className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Clinical Documents</h3>
                  <p className="text-sm font-bold text-white/60">Access all your medical history in one place</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => {
                    setActiveTab('prescriptions')
                    setSearchParams({ tab: 'prescriptions' })
                  }}
                  className="flex-1 md:flex-none px-6 py-3.5 bg-white text-[#11496c] text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Prescriptions
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('lab-reports')
                    setSearchParams({ tab: 'lab-reports' })
                  }}
                  className="flex-1 md:flex-none px-6 py-3.5 bg-[#14B8A6] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Lab Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription and Lab Report Cards - Desktop Optimized Tabs */}
      {(activeTab === 'prescriptions' || activeTab === 'lab-reports') && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setActiveTab('vitals')
                  setSearchParams({ tab: 'vitals' })
                }}
                className="h-14 w-14 flex items-center justify-center rounded-[20px] bg-white border border-slate-100 text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <IoArrowBackOutline className="h-7 w-7" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {activeTab === 'prescriptions' ? 'Prescriptions' : 'Lab Reports'}
                </h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  {activeTab === 'prescriptions' ? `Medical Records (${totalPrescriptionsCount})` : `Diagnostic Center (${labReportsCount})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'prescriptions' ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Records
              </button>
              <button
                onClick={() => setActiveTab('lab-reports')}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'lab-reports' ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Diagnostics
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Optimized Summary Cards for Desktop */}
            <div className="relative overflow-hidden rounded-[40px] p-8 text-white shadow-xl shadow-[#11496c]/20"
              style={{ background: 'linear-gradient(135deg, #11496c 0%, #0d3a52 100%)' }}>
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="h-20 w-20 rounded-[24px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <IoDocumentTextOutline className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Total Records</p>
                  <p className="text-5xl font-black mt-1 tracking-tighter">{totalPrescriptionsCount}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[40px] p-8 text-white shadow-xl shadow-[#14B8A6]/20"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0f9687 100%)' }}>
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="h-20 w-20 rounded-[24px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <IoFlaskOutline className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Lab Findings</p>
                  <p className="text-5xl font-black mt-1 tracking-tighter">{labReportsCount}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Prescriptions Content */}
      {activeTab === 'prescriptions' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div id="filter-tabs" className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
              {[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${filter === tab.value
                    ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20 scale-105'
                    : 'text-slate-400 hover:text-[#11496c] hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="relative group">
              <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#11496c] transition-colors" />
              <input 
                type="text" 
                placeholder="Search prescriptions..."
                className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#11496c]/10 outline-none w-full md:w-80 transition-all"
              />
            </div>
          </div>

          {/* Prescriptions List - Desktop Grid */}
          <div id="prescriptions-section">
            {filteredPrescriptions.length === 0 ? (
              <div className="rounded-[40px] border-2 border-dashed border-slate-100 bg-white p-20 text-center shadow-sm">
                <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                  <IoDocumentTextOutline className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No records found</h3>
                <p className="mt-2 text-sm font-bold text-slate-400 max-w-xs mx-auto">Your medical prescriptions will be listed here once issued by your doctor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedPrescriptions.map((prescription) => (
                  <article
                    key={prescription.id}
                    className="group relative overflow-hidden rounded-[40px] border border-slate-50 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-2xl hover:shadow-[#11496c]/10 hover:-translate-y-1"
                  >
                    <div className="relative">
                      {/* Doctor Info Header */}
                      <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                          <img
                            src={prescription.doctor.image}
                            alt={prescription.doctor.name}
                            className="h-20 w-20 rounded-[28px] object-cover ring-8 ring-slate-50 bg-slate-100 transition-transform group-hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.doctor.name)}&background=11496c&color=fff&size=128&bold=true`
                            }}
                          />
                          <div className={`absolute -bottom-1 -right-1 h-7 w-7 rounded-2xl border-4 border-white flex items-center justify-center ${prescription.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <IoCheckmarkCircleOutline className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 leading-none truncate tracking-tight">{prescription.doctor.name}</h3>
                              <p className="text-xs font-black text-[#14B8A6] uppercase tracking-[0.15em] mt-2">{prescription.doctor.specialty || 'General Physician'}</p>
                            </div>
                            <div className="px-4 py-2 bg-[#11496c]/5 rounded-xl border border-[#11496c]/10">
                              <span className="text-[10px] font-black text-[#11496c] uppercase tracking-widest">{formatDate(prescription.issuedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Prescription Details Summary */}
                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 group-hover:bg-white transition-colors">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diagnosis</span>
                          <span className="text-sm font-black text-slate-800 line-clamp-1">{prescription.diagnosis || 'Checkup'}</span>
                        </div>
                        <div className="p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 group-hover:bg-white transition-colors">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Follow-up</span>
                          <span className="text-sm font-black text-slate-800">{prescription.followUpAt ? formatDate(prescription.followUpAt) : 'None'}</span>
                        </div>
                      </div>

                      {/* Actions Grid - Desktop Optimized */}
                      <div className="mt-8 flex flex-col gap-4">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(prescription)}
                            className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-[#11496c] py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#0d3a52] shadow-lg shadow-[#11496c]/20"
                          >
                            <IoDownloadOutline className="h-5 w-5" />
                            PDF Report
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewPDF(prescription)}
                              className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 hover:bg-[#11496c]/5 hover:text-[#11496c] transition-all border border-slate-100"
                              title="View Records"
                            >
                              <IoEyeOutline className="h-6 w-6" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareClick(prescription.id)}
                              className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 hover:bg-[#11496c]/5 hover:text-[#11496c] transition-all border border-slate-100"
                              title="Share Report"
                            >
                              <IoShareSocialOutline className="h-6 w-6" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleBookTestVisit(prescription)}
                            className="flex items-center justify-center gap-2.5 rounded-2xl bg-white border-2 border-slate-50 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-[#11496c] hover:bg-[#11496c]/5 hover:text-[#11496c] transition-all"
                          >
                            <IoFlaskOutline className="h-4 w-4" />
                            Schedule Test
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOrderMedicine(prescription)}
                            className="flex items-center justify-center gap-2.5 rounded-2xl bg-white border-2 border-slate-50 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-[#11496c] hover:bg-[#11496c]/5 hover:text-[#11496c] transition-all"
                          >
                            <IoBagHandleOutline className="h-4 w-4" />
                            Buy Medicine
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination for Prescriptions */}
            {filteredPrescriptions.length > 0 && prescriptionsTotalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={prescriptionsTotalPages}
                  totalItems={prescriptionsTotalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lab Reports Content */}
      {activeTab === 'lab-reports' && (
        <div id="lab-reports-section" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostics History</h2>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time sync active</p>
            </div>
          </div>

          {labReports.length === 0 ? (
            <div className="rounded-[40px] border-2 border-dashed border-slate-100 bg-white p-20 text-center shadow-sm">
              <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                <IoFlaskOutline className="h-12 w-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">No Findings Yet</h3>
              <p className="mt-2 text-sm font-bold text-slate-400 max-w-xs mx-auto">Once the lab uploads your results, they will appear here instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedLabReports.map((report) => (
                <article
                  key={report.id}
                  className="group relative overflow-hidden rounded-[40px] border border-slate-50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-2xl hover:shadow-[#11496c]/10 hover:-translate-y-1 flex flex-col"
                >
                  {/* Report Main Info */}
                  <div className="flex items-center gap-6 p-8 flex-1">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] text-white shadow-xl shadow-[#11496c]/20 group-hover:scale-105 transition-transform"
                      style={{
                        background: 'linear-gradient(135deg, #11496c 0%, #14B8A6 100%)',
                      }}>
                      <IoFlaskOutline className="h-10 w-10" />
                    </div>
 
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{report.testName}</h3>
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            Ready
                          </span>
                        </div>
                        <p className="text-sm font-black text-[#11496c] uppercase tracking-widest mt-1 opacity-70">{report.labName}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                            <IoCalendarOutline className="h-4 w-4 text-[#11496c]" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{formatDate(report.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Section - Desktop Optimized */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-8 border-t sm:border-t-0 sm:border-l border-slate-50 bg-slate-50/30 sm:min-w-[280px]">
                    <button
                      type="button"
                      onClick={() => handleDownloadLabReport(report)}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#11496c] py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#0d3a52] shadow-lg shadow-[#11496c]/20"
                    >
                      <IoDownloadOutline className="h-5 w-5" />
                      Results
                    </button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleViewLabReportClick(report)}
                        className="flex-1 sm:h-14 sm:w-14 flex items-center justify-center rounded-2xl bg-white text-slate-600 hover:bg-[#11496c]/5 hover:text-[#11496c] transition-all border border-slate-100 shadow-sm py-3.5 sm:py-0"
                        title="View Report"
                      >
                        <IoEyeOutline className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareLabReportClick(report)}
                        className="flex-1 sm:h-14 sm:w-14 flex items-center justify-center rounded-2xl bg-white text-slate-600 hover:bg-[#11496c]/5 hover:text-[#11496c] transition-all border border-slate-100 shadow-sm py-3.5 sm:py-0"
                        title="Share Report"
                      >
                        <IoShareSocialOutline className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination for Lab Reports */}
          {labReports.length > 0 && labReportsTotalPages > 1 && (
            <Pagination
              currentPage={currentLabReportsPage}
              totalPages={labReportsTotalPages}
              totalItems={labReportsTotalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentLabReportsPage}
              loading={loadingReports}
            />
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && currentPrescription && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseShareModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Share Prescription</h2>
                <p className="text-sm text-slate-600">
                  {currentPrescription.doctor.name} - {currentPrescription.doctor.specialty}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Header for Doctors */}
            <div className="flex items-center justify-center border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <IoPeopleOutline className="h-5 w-5 text-[#11496c]" />
                <h3 className="text-base font-semibold text-slate-900">Select Doctors</h3>
                {selectedDoctors.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                    {selectedDoctors.length}
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <IoSearchOutline className="h-5 w-5" />
                </span>
                <input
                  type="search"
                  placeholder="Search doctors..."
                  value={shareSearchTerm}
                  onChange={(e) => setShareSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                {/* Info Banner */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <IoInformationCircleOutline className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">Note</p>
                      <p className="text-xs text-amber-800 mt-1">
                        Doctors will need to book an appointment to view this prescription.
                      </p>
                    </div>
                  </div>
                </div>

                {filteredDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">No doctors found</p>
                  </div>
                ) : (
                  filteredDoctors.map((doctor) => {
                    const isSelected = selectedDoctors.includes(doctor.id)
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => toggleDoctorSelection(doctor.id)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 p-4 transition text-left ${isSelected
                          ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className={`h-12 w-12 rounded-xl object-cover ring-2 bg-slate-100 ${isSelected ? 'ring-[#11496c]' : 'ring-slate-200'
                              }`}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-slate-900">{doctor.name}</h4>
                            <p className="text-xs text-[#11496c] mt-0.5">{doctor.specialty}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                              <IoLocationOutline className="h-3 w-3" />
                              <span>{doctor.location}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {renderStars(doctor.rating)}
                              <span className="text-xs font-semibold text-slate-700 ml-1">{doctor.rating}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">
                  {selectedDoctors.length} selected
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctors([])
                  }}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Clear All
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseShareModal}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={selectedDoctors.length === 0 || isSharing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <IoShareSocialOutline className="h-4 w-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Share Modal */}
      {showLabShareModal && selectedLabReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Share Report with Doctor</h2>
              <button
                type="button"
                onClick={handleCloseLabShareModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Report:</p>
                <p className="text-sm text-slate-600">{selectedLabReport.testName}</p>
              </div>

              {/* Associated Doctor - Direct Share */}
              {selectedLabReport.doctorId && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Your Appointed Doctor (Direct Share):</p>
                  <button
                    type="button"
                    onClick={() => setSelectedLabDoctorId(selectedLabReport.doctorId)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all ${selectedLabDoctorId === selectedLabReport.doctorId
                      ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedLabReport.doctorImage}
                        alt={selectedLabReport.doctorName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{selectedLabReport.doctorName}</h3>
                        <p className="text-xs text-slate-600">{selectedLabReport.doctorSpecialty}</p>
                      </div>
                      {selectedLabDoctorId === selectedLabReport.doctorId && (
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (appointment already booked)</p>
                  </button>
                </div>
              )}

              {/* Other Doctors - Check for appointments */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Other Doctors:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingDoctors ? (
                    <p className="text-xs text-slate-500 text-center py-4">Loading doctors...</p>
                  ) : filteredDoctors.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No doctors found</p>
                  ) : (
                    filteredDoctors
                      .filter((doc) => {
                        const docId = doc._id || doc.id
                        return !selectedLabReport?.doctorId || docId !== selectedLabReport.doctorId
                      })
                      .map((doctor) => {
                        const doctorId = doctor._id || doctor.id
                        const doctorName = doctor.firstName && doctor.lastName
                          ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                          : doctor.name || 'Doctor'
                        const specialty = doctor.specialization || doctor.specialty || ''
                        const hasAppointment = checkPatientHasAppointment(doctorId)
                        return (
                          <button
                            key={doctorId}
                            type="button"
                            onClick={() => setSelectedLabDoctorId(doctorId)}
                            className={`w-full rounded-xl border-2 p-3 text-left transition-all ${selectedLabDoctorId === doctorId
                              ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={doctor.profileImage || doctor.image || ''}
                                alt={doctorName}
                                className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=3b82f6&color=fff&size=128&bold=true`
                                }}
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{doctorName}</h3>
                                <p className="text-xs text-slate-600">{specialty}</p>
                              </div>
                              {selectedLabDoctorId === doctorId && (
                                <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                              )}
                            </div>
                            {hasAppointment ? (
                              <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (appointment already booked)</p>
                            ) : (
                              <p className="mt-2 text-xs text-amber-600">⚠ Requires booking appointment</p>
                            )}
                          </button>
                        )
                      })
                  )}
                </div>
              </div>

              {selectedLabDoctorId && (
                <div className="mt-4 rounded-lg bg-[rgba(17,73,108,0.1)] p-3">
                  <p className="text-xs text-[#0a2d3f]">
                    {(() => {
                      const doctor = doctors.find(d => (d._id || d.id) === selectedLabDoctorId);
                      const name = doctor ? (doctor.firstName && doctor.lastName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : doctor.name) : (selectedLabReport?.doctorName || 'Doctor');
                      const hasAppointment = (selectedLabReport.doctorId && selectedLabDoctorId === selectedLabReport.doctorId) || checkPatientHasAppointment(selectedLabDoctorId);
                      
                      return hasAppointment ? (
                        <><strong>Direct Share:</strong> Report will be shared immediately with {name}.</>
                      ) : (
                        <><strong>Note:</strong> To share with this doctor, you'll need to book an appointment first. The booking page will open after sharing.</>
                      );
                    })()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseLabShareModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareLabReportWithDoctor}
                disabled={isSharingLabReport || !selectedLabDoctorId}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharingLabReport ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <IoShareSocialOutline className="h-4 w-4" />
                    {(selectedLabReport.doctorId && selectedLabDoctorId === selectedLabReport.doctorId) || checkPatientHasAppointment(selectedLabDoctorId)
                      ? 'Share Now'
                      : 'Share & Book'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Visit Selection Modal */}
      {showTestVisitModal && testVisitPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Choose Test Visit Type</h2>
              <button
                type="button"
                onClick={() => {
                  setShowTestVisitModal(false)
                  setTestVisitPrescription(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Prescription:</p>
                <p className="text-sm text-slate-600">
                  {testVisitPrescription.doctor?.name || 'Doctor'} - {testVisitPrescription.diagnosis || 'Test'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Home Option */}
                <button
                  type="button"
                  onClick={handleTestVisitHome}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                      <IoHomeOutline className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Home Sample Collection</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Sample will be collected from your home. Request will be sent to admin for approval.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Lab Option */}
                <button
                  type="button"
                  onClick={handleTestVisitLab}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <IoBusinessOutline className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Visit Lab</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Visit the lab for sample collection. Request will be sent to admin for approval.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => {
                  setShowTestVisitModal(false)
                  setTestVisitPrescription(null)
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report View Modal */}
      {showLabViewModal && selectedLabReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Lab Report - {selectedLabReport.testName}</h2>
              <button
                type="button"
                onClick={handleCloseLabViewModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
              {selectedLabReport.pdfFileUrl && selectedLabReport.pdfFileUrl !== '#' ? (
                <>
                  <iframe
                    src={`${getFileUrl(selectedLabReport.pdfFileUrl)}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full flex-1 border-0"
                    title={`Lab Report - ${selectedLabReport.testName}`}
                    onError={(e) => {
                      console.error('Error loading PDF:', e)
                    }}
                  />
                  <div className="p-3 bg-white border-t border-slate-200">
                    <p className="text-xs text-slate-600 text-center">
                      If PDF doesn't load, click "Download PDF" to view it
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <IoFlaskOutline className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-600">PDF not available</p>
                    <p className="text-xs text-slate-500 mt-1">The lab report PDF has not been uploaded yet.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseLabViewModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadLabReport(selectedLabReport)
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52]"
              >
                <IoDownloadOutline className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PatientPrescriptions

