import { useState, useEffect, useRef, useMemo } from 'react'
import jsPDF from 'jspdf'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoBagHandleOutline,
  IoMedicalOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoBusinessOutline,
  IoChevronDownOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoStar,
  IoStarOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoFlaskOutline,
  IoSearchOutline,
  IoChatbubbleOutline,
  IoHomeOutline,
} from 'react-icons/io5'
import { getAdminRequests, acceptAdminRequest, respondToAdminRequest, cancelAdminRequest, getPharmacies, getLaboratories, getLaboratoryTestsByLaboratory, getPharmacyMedicinesByPharmacy } from '../admin-services/adminService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

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

const AdminRequests = () => {
  const toast = useToast()
  const [labRequests, setLabRequests] = useState([])
  const [pharmacyRequests, setPharmacyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [activeSection, setActiveSection] = useState('pharmacy') // 'lab' or 'pharmacy'
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [pharmacies, setPharmacies] = useState([])
  const [labs, setLabs] = useState([])
  const [showPharmacyDropdown, setShowPharmacyDropdown] = useState(false)
  const [showLabDropdown, setShowLabDropdown] = useState(false)
  const [selectedPharmacies, setSelectedPharmacies] = useState([])
  const [selectedLabs, setSelectedLabs] = useState([]) // Changed to array for multiple labs
  const [selectedLab, setSelectedLab] = useState(null) // Keep for backward compatibility, but will use selectedLabs
  const pharmacyDropdownRef = useRef(null)
  const labDropdownRef = useRef(null)
  const [adminMedicines, setAdminMedicines] = useState([]) // Medicines added by admin
  const [adminResponse, setAdminResponse] = useState('') // Admin's response message
  const [totalAmount, setTotalAmount] = useState(0) // Total amount calculated from medicines
  const [isSendingResponse, setIsSendingResponse] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [pharmacyMedicineSearch, setPharmacyMedicineSearch] = useState('') // Search term for pharmacy medicines
  const [expandedPharmacyId, setExpandedPharmacyId] = useState(null) // Track which pharmacy's medicines are expanded
  const [expandedPharmacySearch, setExpandedPharmacySearch] = useState('') // Search term for expanded pharmacy medicines
  const [expandedLabId, setExpandedLabId] = useState(null) // Track which lab's tests are expanded
  const [expandedLabSearch, setExpandedLabSearch] = useState('') // Search term for expanded lab tests
  const [labTestSearch, setLabTestSearch] = useState('') // Search term for lab tests (keep for backward compatibility)
  const [showCancelModal, setShowCancelModal] = useState(false) // Show cancel reason modal
  const [cancelReason, setCancelReason] = useState('') // Cancel reason text
  const [requestToCancel, setRequestToCancel] = useState(null) // Request to cancel
  const [selectedMedicinesFromPharmacy, setSelectedMedicinesFromPharmacy] = useState([]) // {pharmacyId, pharmacyName, medicine, quantity, price}
  const [selectedTestsFromLab, setSelectedTestsFromLab] = useState([]) // {labId, labName, test, price}
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filter or activeSection changes
  }, [filter, activeSection])

  useEffect(() => {
    loadRequests()
    loadPharmacies()
    loadLabs()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadRequests()
      loadPharmacies()
      loadLabs()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Reload pharmacies when modal opens (when selectedRequest is set)
  useEffect(() => {
    if (selectedRequest && activeSection === 'pharmacy') {
      loadPharmacies()
    }
  }, [selectedRequest, activeSection])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPharmacyDropdown && pharmacyDropdownRef.current && !pharmacyDropdownRef.current.contains(event.target)) {
        setShowPharmacyDropdown(false)
      }
      if (showLabDropdown && labDropdownRef.current && !labDropdownRef.current.contains(event.target)) {
        setShowLabDropdown(false)
      }
    }
    if (showPharmacyDropdown || showLabDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPharmacyDropdown, showLabDropdown])

  const loadLabs = async () => {
    try {
      const response = await getLaboratories({ status: 'approved', page: 1, limit: 100 })

      if (response.success && response.data) {
        const labsData = Array.isArray(response.data)
          ? response.data
          : response.data.items || []

        const filteredLabs = labsData.filter(lab => lab.status === 'approved' && lab.isActive)

        // Load tests for each laboratory
        const labsWithTests = await Promise.all(
          filteredLabs.map(async (lab) => {
            try {
              const testsResponse = await getLaboratoryTestsByLaboratory(lab._id || lab.id, { limit: 1000 })
              const tests = testsResponse.success && testsResponse.data
                ? (testsResponse.data.items || testsResponse.data || [])
                : []

              return {
                labId: lab._id || lab.id,
                labName: lab.labName || '',
                status: lab.status || 'pending',
                isActive: lab.isActive !== false,
                phone: lab.phone || '',
                email: lab.email || '',
                address: lab.address ? `${lab.address.line1 || ''}, ${lab.address.city || ''}, ${lab.address.state || ''}`.trim() : '',
                rating: lab.rating || 0,
                tests: tests.map((test) => ({
                  name: test.name || '',
                  price: Number(test.price) || 0,
                  description: test.description || '',
                  _id: test._id || test.id,
                })),
                originalData: lab,
              }
            } catch (err) {
              console.error(`Error loading tests for laboratory ${lab._id}:`, err)
              return {
                labId: lab._id || lab.id,
                labName: lab.labName || '',
                status: lab.status || 'pending',
                isActive: lab.isActive !== false,
                phone: lab.phone || '',
                email: lab.email || '',
                address: lab.address ? `${lab.address.line1 || ''}, ${lab.address.city || ''}, ${lab.address.state || ''}`.trim() : '',
                rating: lab.rating || 0,
                tests: [],
                originalData: lab,
              }
            }
          })
        )

        setLabs(labsWithTests)
      }
    } catch (error) {
      console.error('Error loading labs:', error)
      toast.error('Failed to load laboratories')
      setLabs([])
    }
  }

  const loadPharmacies = async () => {
    try {
      const response = await getPharmacies({ status: 'approved', page: 1, limit: 100 })

      if (response.success && response.data) {
        const pharmaciesData = Array.isArray(response.data)
          ? response.data
          : response.data.items || []

        const filteredPharmacies = pharmaciesData.filter(pharm => pharm.status === 'approved' && pharm.isActive)

        // Load medicines for each pharmacy
        const pharmaciesWithMedicines = await Promise.all(
          filteredPharmacies.map(async (pharm) => {
            try {
              const medicinesResponse = await getPharmacyMedicinesByPharmacy(pharm._id || pharm.id, { limit: 1000 })
              const medicines = medicinesResponse.success && medicinesResponse.data
                ? (medicinesResponse.data.items || medicinesResponse.data || [])
                : []

              return {
                pharmacyId: pharm._id || pharm.id,
                pharmacyName: pharm.pharmacyName || '',
                status: pharm.status || 'pending',
                isActive: pharm.isActive !== false,
                phone: pharm.phone || '',
                email: pharm.email || '',
                address: pharm.address ? `${pharm.address.line1 || ''}, ${pharm.address.city || ''}, ${pharm.address.state || ''}`.trim() : '',
                rating: pharm.rating || 0,
                medicines: medicines.map((med) => ({
                  name: med.name || '',
                  dosage: med.dosage || '',
                  manufacturer: med.manufacturer || '',
                  quantity: Number(med.quantity) || 0,
                  price: Number(med.price) || 0,
                  expiryDate: med.expiryDate || null,
                  _id: med._id || med.id,
                })),
                originalData: pharm,
              }
            } catch (err) {
              console.error(`Error loading medicines for pharmacy ${pharm._id}:`, err)
              return {
                pharmacyId: pharm._id || pharm.id,
                pharmacyName: pharm.pharmacyName || '',
                status: pharm.status || 'pending',
                isActive: pharm.isActive !== false,
                phone: pharm.phone || '',
                email: pharm.email || '',
                address: pharm.address ? `${pharm.address.line1 || ''}, ${pharm.address.city || ''}, ${pharm.address.state || ''}`.trim() : '',
                rating: pharm.rating || 0,
                medicines: [],
                originalData: pharm,
              }
            }
          })
        )

        setPharmacies(pharmaciesWithMedicines)
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error)
      toast.error('Failed to load pharmacies')
      setPharmacies([])
    }
  }

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

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all requests (filtering by activeSection happens client-side)
      const filters = {
        page: 1,
        limit: 1000, // Load all for client-side filtering by activeSection
      }
      if (filter !== 'all') {
        filters.status = filter
      }

      const response = await getAdminRequests(filters)

      if (response.success && response.data) {
        const requestsData = Array.isArray(response.data)
          ? response.data
          : response.data.items || []
        const pagination = response.data.pagination || {}

        // Helper function to format patient address
        const formatPatientAddress = (req) => {
          // Priority: 1. req.patientId.address, 2. req.prescriptionId.patientId.address, 3. req.address/deliveryAddress
          let address = req.patientId?.address ||
            req.prescriptionId?.patientId?.address ||
            req.address ||
            req.deliveryAddress ||
            null

          if (!address) return ''

          // If address is an object, format it
          if (typeof address === 'object' && address !== null) {
            const parts = []
            if (address.line1) parts.push(address.line1)
            if (address.line2) parts.push(address.line2)
            if (address.city) parts.push(address.city)
            if (address.state) parts.push(address.state)
            if (address.pincode || address.postalCode) parts.push(address.pincode || address.postalCode)
            return parts.filter(Boolean).join(', ')
          }

          // If address is a string, return as is
          return address
        }

        // Separate lab and pharmacy requests
        const flattenPrescription = (req) => {
          // Priority: 1. populated prescriptionId, 2. prescription (Mixed field), 3. req itself (if flattened)
          const rawP = req.prescriptionId || req.prescription || {}

          // Doctor info might be in doctorId (populated), doctor (field), or at top level of rawP
          const doc = rawP.doctorId || rawP.doctor || {}

          // Helper to get name
          const getDocName = () => {
            if (doc.firstName && doc.lastName) return `${doc.firstName} ${doc.lastName}`
            if (doc.firstName) return doc.firstName
            if (doc.name) return doc.name
            if (rawP.doctorName) return rawP.doctorName
            if (req.doctorName) return req.doctorName // Unlikely but safe
            return 'Doctor'
          }

          const getSpecialty = () => {
            return doc.specialization || doc.specialty || rawP.doctorSpecialty || rawP.specialty || 'General Physician'
          }

          return {
            ...rawP,
            doctorName: getDocName(),
            doctorSpecialty: getSpecialty(),
            doctorPhone: doc.phone || rawP.doctorPhone,
            doctorEmail: doc.email || rawP.doctorEmail,
            clinicName: doc.clinicDetails?.name || doc.clinicDetails?.clinicName || rawP.clinicName || 'Heallyn Clinic',
            clinicAddress: doc.clinicDetails?.address || rawP.clinicAddress,
            doctorSignature: doc.digitalSignature || rawP.doctorSignature,

            diagnosis: (rawP.consultationId?.diagnosis) || rawP.diagnosis || '',
            symptoms: (rawP.consultationId?.symptoms) || rawP.symptoms || [],
            investigations: (rawP.consultationId?.investigations) || rawP.investigations || [],
            advice: (rawP.consultationId?.advice) || rawP.advice || '',
            followUpAt: (rawP.consultationId?.followUpDate) || rawP.followUpDate || rawP.followUpAt,

            medications: rawP.medications || req.medicines || [],
            issuedAt: rawP.createdAt || req.createdAt || new Date().toISOString(),
          }
        }

        const labReqs = requestsData
          .filter((req) => req.type === 'book_test_visit' || req.requestType === 'lab' || req.providerType === 'laboratory')
          .map(req => ({
            id: req._id || req.id,
            _id: req._id || req.id,
            type: 'book_test_visit',
            patientName: req.patientId?.firstName && req.patientId?.lastName
              ? `${req.patientId.firstName} ${req.patientId.lastName}`
              : req.patientId?.name || req.patientName || 'Unknown Patient',
            patientPhone: req.patientId?.phone || req.patientPhone || '',
            patientEmail: req.patientId?.email || req.patientEmail || '',
            patientAddress: formatPatientAddress(req),
            address: req.address || req.deliveryAddress || '',
            date: req.requestedDate || req.date || '',
            time: req.requestedTime || req.time || '',
            status: req.status || 'pending',
            totalAmount: req.totalAmount || req.amount || 0,
            investigations: req.investigations || req.tests || [],
            createdAt: req.createdAt || new Date().toISOString(),
            prescription: flattenPrescription(req),
            // If adminResponse exists, prefer that for display on modal reopen
            adminResponse: (req.adminResponse && Object.keys(req.adminResponse).length > 0) ? req.adminResponse : null,
            originalData: req,
          }))

        const pharmacyReqs = requestsData
          .filter((req) => req.type === 'order_medicine' || req.requestType === 'pharmacy' || req.providerType === 'pharmacy')
          .map(req => ({
            id: req._id || req.id,
            _id: req._id || req.id,
            type: 'order_medicine',
            patientName: req.patientId?.firstName && req.patientId?.lastName
              ? `${req.patientId.firstName} ${req.patientId.lastName}`
              : req.patientId?.name || req.patientName || 'Unknown Patient',
            patientPhone: req.patientId?.phone || req.patientPhone || '',
            patientEmail: req.patientId?.email || req.patientEmail || '',
            patientAddress: formatPatientAddress(req),
            address: req.address || req.deliveryAddress || '',
            date: req.requestedDate || req.date || '',
            time: req.requestedTime || req.time || '',
            status: req.status || 'pending',
            totalAmount: req.totalAmount || req.amount || 0,
            medicines: req.medicines || req.items || [],
            createdAt: req.createdAt || new Date().toISOString(),
            prescription: flattenPrescription(req),
            adminResponse: (req.adminResponse && Object.keys(req.adminResponse).length > 0) ? req.adminResponse : null, // Include adminResponse from backend
            originalData: req,
          }))

        // Sort by creation date (newest first)
        labReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        pharmacyReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setLabRequests(labReqs)
        setPharmacyRequests(pharmacyReqs)
      }
    } catch (err) {
      console.error('Error loading requests:', err)
      setError(err.message || 'Failed to load requests')
      toast.error('Failed to load requests')
      setLabRequests([])
      setPharmacyRequests([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRequests = (requestsList) => {
    return requestsList.filter((req) => {
      if (filter === 'all') return true
      return req.status === filter
    })
  }

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      // Update via API
      await respondToAdminRequest(requestId, { status: newStatus })
      loadRequests()
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus })
      }
      toast.success('Request status updated')
    } catch (error) {
      console.error('Error updating request status:', error)
      toast.error('Failed to update request status')
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const request = filteredRequests.find(req => req.id === requestId)
      if (!request) return

      // Accept request via API
      await acceptAdminRequest(requestId)

      // Reload requests to get updated status
      loadRequests()
      toast.success('Request accepted successfully')
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error(error.message || 'Failed to accept request')
    }
  }

  const handleCancelRequest = (requestId) => {
    const request = filteredRequests.find(req => req.id === requestId)
    if (request) {
      setRequestToCancel(request)
      setShowCancelModal(true)
    }
  }

  const handleConfirmCancel = async () => {
    if (!requestToCancel || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    try {
      // Cancel via API
      await cancelAdminRequest(requestToCancel.id, cancelReason.trim())

      // Reload requests to get updated status
      loadRequests()
      toast.success('Request cancelled successfully')

      // Close modal and reset
      setShowCancelModal(false)
      setCancelReason('')
      setRequestToCancel(null)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error('Failed to cancel request')
    }
  }

  // Open request and ensure the correct section is active


  const handleOpenRequest = (request) => {
    if (!request) return
    const nextSection = (request.type === 'book_test_visit' || request.requestType === 'lab' || request.providerType === 'laboratory')
      ? 'lab'
      : 'pharmacy'
    setActiveSection(nextSection)
    setSelectedRequest(request)
  }

  const hasBillGeneratedForRequest = (req) => {
    if (!req || !req.adminResponse) return false
    const hasData = Object.keys(req.adminResponse).length > 0
    if (!hasData) return false
    return (
      req.paymentConfirmed === true ||
      ['admin_responded', 'accepted', 'confirmed', 'payment_confirmed', 'paid'].includes(req.status)
    )
  }

  // Helper function to get localStorage key for current request
  const getRequestStorageKey = (key) => {
    if (!selectedRequest) return null
    return `adminRequest_${selectedRequest.id}_${key}`
  }

  // Load saved data from localStorage when request is selected
  useEffect(() => {
    if (selectedRequest) {
      // If request already has adminResponse (bill generated), load data from adminResponse
      // The bill details should be shown from adminResponse
      if (selectedRequest.adminResponse && (selectedRequest.status === 'accepted' || selectedRequest.status === 'admin_responded')) {
        // Bill already generated, populate state from adminResponse so it's visible in the modal
        if (activeSection === 'lab' && selectedRequest.adminResponse.investigations) {
          // Calculate total from adminResponse for lab
          const calculatedTotal = selectedRequest.adminResponse.totalAmount ||
            selectedRequest.adminResponse.investigations.reduce((sum, test) => sum + (test.price || 0), 0)
          setTotalAmount(calculatedTotal)

          // Populate selectedLabs from adminResponse
          if (selectedRequest.adminResponse.labs && selectedRequest.adminResponse.labs.length > 0) {
            const labsFromResponse = selectedRequest.adminResponse.labs.map(lab => ({
              labId: lab.id || lab.labId,
              labName: lab.name || lab.labName,
              address: lab.address || '',
              phone: lab.phone || '',
              email: lab.email || '',
            }))
            setSelectedLabs(labsFromResponse)
          }

          // Populate selectedTestsFromLab from adminResponse
          if (selectedRequest.adminResponse.investigations && selectedRequest.adminResponse.investigations.length > 0) {
            const testsFromResponse = selectedRequest.adminResponse.investigations.map((test, idx) => {
              // Find the lab for this test (use first lab if multiple)
              const lab = selectedRequest.adminResponse.labs && selectedRequest.adminResponse.labs.length > 0
                ? selectedRequest.adminResponse.labs[0]
                : { id: '', name: '' }

              return {
                labId: lab.id || lab.labId || '',
                labName: lab.name || lab.labName || '',
                test: {
                  name: test.name || test.testName || 'Test',
                  testName: test.testName || test.name || 'Test',
                },
                price: test.price || 0,
              }
            })
            setSelectedTestsFromLab(testsFromResponse)
          }
        } else if (activeSection === 'pharmacy' && selectedRequest.adminResponse.medicines) {
          // Calculate total from adminResponse for pharmacy
          const calculatedTotal = selectedRequest.adminResponse.totalAmount ||
            selectedRequest.adminResponse.medicines.reduce((sum, med) => sum + ((med.price || 0) * (med.quantity || 0)), 0)
          setTotalAmount(calculatedTotal)

          // Populate selectedPharmacies from adminResponse
          if (selectedRequest.adminResponse.pharmacies && selectedRequest.adminResponse.pharmacies.length > 0) {
            const pharmaciesFromResponse = selectedRequest.adminResponse.pharmacies.map(pharmacy => ({
              pharmacyId: pharmacy.id || pharmacy.pharmacyId,
              pharmacyName: pharmacy.name || pharmacy.pharmacyName,
              address: pharmacy.address || '',
              phone: pharmacy.phone || '',
              email: pharmacy.email || '',
            }))
            setSelectedPharmacies(pharmaciesFromResponse)
          }

          // Populate selectedMedicinesFromPharmacy from adminResponse
          if (selectedRequest.adminResponse.medicines && selectedRequest.adminResponse.medicines.length > 0) {
            const medicinesFromResponse = selectedRequest.adminResponse.medicines.map(med => {
              // Find the pharmacy for this medicine (use first pharmacy if multiple)
              const pharmacy = selectedRequest.adminResponse.pharmacies && selectedRequest.adminResponse.pharmacies.length > 0
                ? selectedRequest.adminResponse.pharmacies[0]
                : { id: '', name: '' }

              return {
                pharmacyId: pharmacy.id || pharmacy.pharmacyId || med.pharmacyId || '',
                pharmacyName: pharmacy.name || pharmacy.pharmacyName || med.pharmacyName || '',
                medicine: {
                  name: med.name || '',
                  dosage: med.dosage || '',
                  manufacturer: med.manufacturer || '',
                },
                quantity: med.quantity !== undefined && med.quantity !== null ? med.quantity : '',
                price: med.price || 0,
              }
            })
            setSelectedMedicinesFromPharmacy(medicinesFromResponse)
          }
        }
        return // Don't proceed with localStorage loading
      }

      const storageKey = getRequestStorageKey(activeSection === 'lab' ? 'labData' : 'pharmacyData')
      const savedData = localStorage.getItem(storageKey)
      let hasSavedData = false

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          if (activeSection === 'lab') {
            // Restore selected labs and tests
            if (parsed.selectedLabs) {
              setSelectedLabs(parsed.selectedLabs)
            }
            if (parsed.selectedTestsFromLab) {
              setSelectedTestsFromLab(parsed.selectedTestsFromLab)
            }
            if (parsed.totalAmount !== undefined) {
              setTotalAmount(parsed.totalAmount)
            }
            hasSavedData = true
          } else if (activeSection === 'pharmacy') {
            // Restore selected pharmacies and medicines
            if (parsed.selectedPharmacies) {
              setSelectedPharmacies(parsed.selectedPharmacies)
            }
            if (parsed.selectedMedicinesFromPharmacy) {
              setSelectedMedicinesFromPharmacy(parsed.selectedMedicinesFromPharmacy)
            }
            if (parsed.totalAmount !== undefined) {
              setTotalAmount(parsed.totalAmount)
            }
            hasSavedData = true
          }
        } catch (error) {
          console.error('Error loading saved data:', error)
        }
      }

      if (!hasSavedData) {
        if (activeSection === 'lab') {
          // No saved data, initialize fresh for lab
          setSelectedLabs([])
          setSelectedTestsFromLab([])
          setTotalAmount(0)
        } else if (activeSection === 'pharmacy') {
          // No saved data, initialize fresh for pharmacy
          setSelectedPharmacies([])
          setSelectedMedicinesFromPharmacy([])
          setTotalAmount(0)
        }
      }

      // For pharmacy requests: Initialize with prescription medications
      if (activeSection === 'pharmacy' && selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0) {
        const initialMedicines = selectedRequest.prescription.medications.map((med, idx) => ({
          ...med,
          id: `med-${Date.now()}-${idx}`,
          price: '',
          quantity: '',
          available: true,
        }))
        setAdminMedicines(initialMedicines)
        if (!hasSavedData) {
          setTotalAmount(0)
        }
        setAdminResponse('')
      }
      // For lab requests: Initialize with prescription investigations (tests will be shown in lab selection)
      else if (activeSection === 'lab' && selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0) {
        // Lab tests are handled in the lab selection section, but we clear medicines
        setAdminMedicines([])
        if (!hasSavedData) {
          setTotalAmount(0)
        }
        setAdminResponse('')
      }
      else {
        setAdminMedicines([])
        if (!hasSavedData) {
          setTotalAmount(0)
        }
        setAdminResponse('')
      }
    } else {
      setAdminMedicines([])
      setTotalAmount(0)
      setAdminResponse('')
      setSelectedLabs([])
      setSelectedTestsFromLab([])
      setSelectedPharmacies([])
      setSelectedMedicinesFromPharmacy([])
    }
  }, [selectedRequest, activeSection])

  // Save selected labs/tests and pharmacies/medicines to localStorage whenever they change
  useEffect(() => {
    if (selectedRequest) {
      if (activeSection === 'lab') {
        const storageKey = getRequestStorageKey('labData')
        if (storageKey) {
          const dataToSave = {
            selectedLabs,
            selectedTestsFromLab,
            totalAmount,
          }
          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        }
      } else if (activeSection === 'pharmacy') {
        const storageKey = getRequestStorageKey('pharmacyData')
        if (storageKey) {
          const dataToSave = {
            selectedPharmacies,
            selectedMedicinesFromPharmacy,
            totalAmount,
          }
          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        }
      }
    }
  }, [selectedLabs, selectedTestsFromLab, selectedPharmacies, selectedMedicinesFromPharmacy, totalAmount, selectedRequest, activeSection])

  // Add new medicine
  const handleAddMedicine = () => {
    const newMedicine = {
      id: `med-${Date.now()}`,
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      price: '',
      quantity: '',
      available: true,
    }
    setAdminMedicines([...adminMedicines, newMedicine])
  }

  // Add medicine from pharmacy
  const handleAddMedicineFromPharmacy = (pharmacyMed, pharmacyId, pharmacyName) => {
    // Check if medicine already added from this pharmacy
    const existingIndex = selectedMedicinesFromPharmacy.findIndex(
      med => med.medicine.name.toLowerCase() === pharmacyMed.name.toLowerCase() &&
        med.medicine.dosage === pharmacyMed.dosage &&
        med.pharmacyId === pharmacyId
    )

    if (existingIndex >= 0) {
      // Remove if already added
      setSelectedMedicinesFromPharmacy(selectedMedicinesFromPharmacy.filter((_, i) => i !== existingIndex))
      return
    }

    // Add new medicine with empty quantity (admin will type it)
    const newMedicine = {
      pharmacyId,
      pharmacyName,
      medicine: pharmacyMed,
      quantity: '',
      price: parseFloat(pharmacyMed.price) || 0,
    }
    setSelectedMedicinesFromPharmacy([...selectedMedicinesFromPharmacy, newMedicine])
  }

  // Update medicine quantity
  const handleUpdateMedicineQuantity = (index, quantity) => {
    const updated = [...selectedMedicinesFromPharmacy]
    // Allow empty string, but validate when calculating totals
    if (quantity === '' || quantity === null || quantity === undefined) {
      updated[index].quantity = ''
    } else {
      const numValue = parseInt(quantity) || 0
      updated[index].quantity = Math.max(1, numValue)
    }
    setSelectedMedicinesFromPharmacy(updated)
  }

  // Add test from lab
  const handleAddTestFromLab = (labTest, labId, labName) => {
    // Ensure only one lab is selected and test is from that lab
    if (selectedLabs.length === 0) {
      toast.error('Please select a laboratory first')
      return
    }

    const selectedLabId = selectedLabs[0]?.labId
    if (selectedLabId !== labId) {
      toast.error('You can only add tests from the selected laboratory')
      return
    }

    // Check if test already added
    const existingIndex = selectedTestsFromLab.findIndex(
      test => test.test.name === labTest.name && test.labId === labId
    )

    if (existingIndex >= 0) {
      // Remove if already added
      setSelectedTestsFromLab(selectedTestsFromLab.filter((_, i) => i !== existingIndex))
      return
    }

    // Add new test - ensure price is properly converted to number
    const testPrice = typeof labTest.price === 'string'
      ? parseFloat(labTest.price.replace(/[^0-9.]/g, '')) || 0
      : Number(labTest.price) || 0

    const newTest = {
      labId,
      labName,
      test: labTest,
      price: testPrice,
    }
    setSelectedTestsFromLab([...selectedTestsFromLab, newTest])
  }

  // Calculate total amount from all sources: adminMedicines, selectedMedicinesFromPharmacy, and selectedTestsFromLab
  useEffect(() => {
    // Calculate from manually added medicines (adminMedicines)
    const adminMedicinesTotal = adminMedicines.reduce((sum, med) => {
      const quantity = Number(med.quantity) || 0
      const price = Number(med.price) || 0
      return sum + (quantity * price)
    }, 0)

    // Calculate from selected pharmacy medicines
    const pharmacyMedicinesTotal = selectedMedicinesFromPharmacy.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0
      const price = Number(item.price) || 0
      return sum + (quantity * price)
    }, 0)

    // Calculate from selected lab tests
    const testsTotal = selectedTestsFromLab.reduce((sum, item) => {
      const price = Number(item.price) || 0
      return sum + price
    }, 0)

    // Set total amount from all sources
    setTotalAmount(adminMedicinesTotal + pharmacyMedicinesTotal + testsTotal)
  }, [adminMedicines, selectedMedicinesFromPharmacy, selectedTestsFromLab])


  // Update medicine
  const handleUpdateMedicine = (medId, field, value) => {
    setAdminMedicines(adminMedicines.map(med =>
      med.id === medId ? { ...med, [field]: value } : med
    ))
  }

  // Remove medicine
  const handleRemoveMedicine = (medId) => {
    setAdminMedicines(adminMedicines.filter(med => med.id !== medId))
  }

  // Share to patient (when clicking Share button from card)
  const handleShareToPatient = async (request) => {
    if (!request || !request.adminResponse) {
      alert('Please configure the request first')
      return
    }

    try {
      // Update request status to confirmed (patient can now pay)
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === request.id) {
          return {
            ...req,
            status: 'confirmed',
            paymentPending: true,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Update patient request status
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const patientReqIndex = patientRequests.findIndex(req => req.id === request.id)
      if (patientReqIndex >= 0) {
        patientRequests[patientReqIndex] = {
          ...patientRequests[patientReqIndex],
          status: 'accepted',
          paymentPending: true,
          adminMedicines: request.adminResponse?.medicines || patientRequests[patientReqIndex].adminMedicines,
          totalAmount: request.adminResponse?.totalAmount || patientRequests[patientReqIndex].totalAmount,
        }
        localStorage.setItem('patientRequests', JSON.stringify(patientRequests))
      }

      // Update pharmacy/lab order status
      if (activeSection === 'pharmacy' && request.adminResponse.pharmacy?.id) {
        const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${request.adminResponse.pharmacy.id}`) || '[]')
        const orderIndex = pharmacyOrders.findIndex(order => order.requestId === request.id)
        if (orderIndex >= 0) {
          pharmacyOrders[orderIndex] = {
            ...pharmacyOrders[orderIndex],
            status: 'payment_pending',
          }
          localStorage.setItem(`pharmacyOrders_${request.adminResponse.pharmacy.id}`, JSON.stringify(pharmacyOrders))
        }
      } else if (activeSection === 'lab' && request.adminResponse.lab?.id) {
        const labOrders = JSON.parse(localStorage.getItem(`labOrders_${request.adminResponse.lab.id}`) || '[]')
        const orderIndex = labOrders.findIndex(order => order.requestId === request.id)
        if (orderIndex >= 0) {
          labOrders[orderIndex] = {
            ...labOrders[orderIndex],
            status: 'payment_pending',
          }
          localStorage.setItem(`labOrders_${request.adminResponse.lab.id}`, JSON.stringify(labOrders))
        }
      }

      alert('Request shared to patient successfully! Patient can now make payment.')
      loadRequests()
    } catch (error) {
      console.error('Error sharing to patient:', error)
      alert('Error sharing to patient. Please try again.')
    }
  }

  // Send response to patient
  const handleSendResponse = async () => {
    // Check if this is assignment after payment or bill generation
    const isAssignment = selectedRequest?.paymentConfirmed && selectedRequest?.readyForAssignment

    if (activeSection === 'pharmacy') {
      if (!selectedRequest || selectedPharmacies.length === 0) {
        toast.error('Please select a pharmacy first')
        return
      }
      if (selectedMedicinesFromPharmacy.length === 0) {
        toast.error('Please select at least one medicine')
        return
      }
    } else if (activeSection === 'lab') {
      if (!selectedRequest || selectedLabs.length === 0) {
        toast.error('Please select at least one lab first')
        return
      }
      if (selectedTestsFromLab.length === 0) {
        toast.error('Please select at least one test')
        return
      }
    }

    setIsSendingResponse(true)

    try {
      let adminResponseData = {}
      let patientRequest = {}
      let providerOrder = {}

      if (activeSection === 'pharmacy') {
        // For multiple pharmacies, use first pharmacy for response data
        const primaryPharmacy = selectedPharmacies[0]
        const pharmacyNames = selectedPharmacies.map(p => p.pharmacyName).join(', ')

        // Prepare medicines list for patient request
        const adminMedicinesList = selectedMedicinesFromPharmacy.map(item => ({
          name: item.medicine.name,
          dosage: item.medicine.dosage || '',
          manufacturer: item.medicine.manufacturer || '',
          quantity: item.quantity,
          price: item.price,
          pharmacyId: item.pharmacyId,
          pharmacyName: item.pharmacyName,
        }))

        adminResponseData = {
          message: adminResponse || `Pharmacy request accepted. Selected pharmacies: ${pharmacyNames}.`,
          pharmacies: selectedPharmacies.map(p => ({
            id: p.pharmacyId,
            name: p.pharmacyName,
            address: p.address,
            phone: p.phone,
            email: p.email,
          })),
          medicines: adminMedicinesList,
          totalAmount: totalAmount,
          respondedAt: new Date().toISOString(),
          respondedBy: 'Admin',
        }

        patientRequest = {
          id: selectedRequest.id,
          type: 'pharmacy',
          providerName: pharmacyNames, // All pharmacy names
          providerId: selectedPharmacies.map(p => p.pharmacyId).join(','), // All pharmacy IDs
          medicineName: 'Prescription Medicines',
          status: 'accepted',
          requestDate: selectedRequest.createdAt,
          responseDate: new Date().toISOString(),
          totalAmount: totalAmount,
          adminMedicines: adminMedicinesList,
          message: adminResponse || `Pharmacy request accepted. Selected pharmacies: ${pharmacyNames}.`,
          prescriptionId: selectedRequest.prescriptionId,
          patient: {
            name: selectedRequest.patientName,
            phone: selectedRequest.patientPhone,
            email: selectedRequest.patientEmail || 'patient@example.com',
            address: selectedRequest.patientAddress,
            age: 32,
            gender: 'Male',
          },
          providerResponse: {
            message: adminResponse || `Pharmacy request accepted. Selected pharmacies: ${pharmacyNames}.`,
            responseBy: 'Admin',
            responseTime: new Date().toISOString(),
          },
          doctor: {
            name: selectedRequest.prescription?.doctorName || 'Doctor',
            specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
            phone: '+91 98765 43210',
          },
        }

        // Get prescription PDF URL from patient prescriptions if available
        let prescriptionPdfUrl = null
        try {
          if (selectedRequest.prescriptionId) {
            const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
            const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
            const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
            if (matchingPrescription?.pdfUrl) {
              prescriptionPdfUrl = matchingPrescription.pdfUrl
            }
          }
        } catch (error) {
          console.error('Error loading prescription PDF:', error)
        }

        // If payment is confirmed, create orders for pharmacy
        if (isAssignment && selectedRequest.paymentConfirmed) {
          selectedPharmacies.forEach((pharmacy) => {
            // Get medicines for this pharmacy
            const pharmacyMedicines = selectedMedicinesFromPharmacy
              .filter(item => item.pharmacyId === pharmacy.pharmacyId)
              .map(item => ({
                name: item.medicine.name,
                dosage: item.medicine.dosage || '',
                manufacturer: item.medicine.manufacturer || '',
                quantity: item.quantity,
                price: item.price,
              }))

            const pharmacyTotal = pharmacyMedicines.reduce((sum, med) => sum + (med.quantity * med.price), 0)

            // Get prescription PDF URL
            let prescriptionPdfUrl = null
            try {
              if (selectedRequest.prescriptionId) {
                const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
                const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
                const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
                if (matchingPrescription?.pdfUrl) {
                  prescriptionPdfUrl = matchingPrescription.pdfUrl
                }
              }
            } catch (error) {
              console.error('Error loading prescription PDF:', error)
            }

            const providerOrder = {
              id: `order-${Date.now()}-${pharmacy.pharmacyId}`,
              requestId: selectedRequest.id,
              type: 'pharmacy',
              pharmacyId: pharmacy.pharmacyId,
              pharmacyName: pharmacy.pharmacyName,
              patient: {
                name: selectedRequest.patientName,
                phone: selectedRequest.patientPhone,
                email: selectedRequest.patientEmail || 'patient@example.com',
                address: selectedRequest.patientAddress,
              },
              medicines: pharmacyMedicines,
              totalAmount: pharmacyTotal,
              status: 'confirmed', // Payment already confirmed
              paymentConfirmed: true,
              createdAt: new Date().toISOString(),
              assignedAt: new Date().toISOString(),
              prescription: {
                ...selectedRequest.prescription,
                pdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl,
              },
              prescriptionPdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl,
            }

            // Save to pharmacy orders
            const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacy.pharmacyId}`) || '[]')
            pharmacyOrders.push(providerOrder)
            localStorage.setItem(`pharmacyOrders_${pharmacy.pharmacyId}`, JSON.stringify(pharmacyOrders))
          })
        } else {
          // Don't create pharmacy orders yet - wait for patient payment
          // Orders will be assigned by admin after patient pays the bill
        }

      } else if (activeSection === 'lab') {
        // For multiple labs, use first lab for response data
        const primaryLab = selectedLabs[0]
        const labNames = selectedLabs.map(l => l.labName).join(', ')

        // Use selected tests instead of prescription investigations
        const investigations = selectedTestsFromLab.map(item => ({
          name: item.test.name,
          price: item.price,
          labId: item.labId, // Include labId for wallet distribution
          labName: item.labName, // Include labName for reference
        }))
        const calculatedTotal = selectedTestsFromLab.reduce((sum, item) => sum + item.price, 0)

        adminResponseData = {
          message: adminResponse || `Lab tests are available. Selected laboratories: ${labNames}. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
          labs: selectedLabs.map(l => ({
            id: l.labId,
            name: l.labName,
            address: l.address,
            phone: l.phone,
            email: l.email,
          })),
          investigations: investigations,
          totalAmount: calculatedTotal,
          respondedAt: new Date().toISOString(),
          respondedBy: 'Admin',
        }

        // Get prescription PDF URL from patient prescriptions if available
        let prescriptionPdfUrl = null
        try {
          if (selectedRequest.prescriptionId) {
            const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
            const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
            const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
            if (matchingPrescription?.pdfUrl) {
              prescriptionPdfUrl = matchingPrescription.pdfUrl
            }
          }
        } catch (error) {
          console.error('Error loading prescription PDF:', error)
        }

        patientRequest = {
          id: selectedRequest.id,
          type: 'lab',
          visitType: selectedRequest.visitType || 'lab', // Pass visitType to patient
          providerName: labNames, // All lab names
          providerId: selectedLabs.map(l => l.labId).join(','), // All lab IDs
          testName: 'Lab Test Request',
          status: 'accepted', // Payment pending
          requestDate: selectedRequest.createdAt,
          responseDate: new Date().toISOString(),
          totalAmount: calculatedTotal,
          message: adminResponse || `Lab tests are available. Selected laboratories: ${labNames}. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
          prescriptionId: selectedRequest.prescriptionId,
          prescriptionPdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl, // Include prescription PDF URL
          patient: {
            name: selectedRequest.patientName,
            phone: selectedRequest.patientPhone,
            email: selectedRequest.patientEmail || 'patient@example.com',
            address: selectedRequest.patientAddress,
            age: 32,
            gender: 'Male',
          },
          providerResponse: {
            message: adminResponse || `All prescribed tests are available. We can schedule your visit. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
            responseBy: 'Heallyn Team',
            responseTime: new Date().toISOString(),
          },
          doctor: {
            name: selectedRequest.prescription?.doctorName || 'Doctor',
            specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
            phone: '+91 98765 43210',
          },
          investigations: investigations,
        }

        // If payment is confirmed, create orders for lab
        if (isAssignment && selectedRequest.paymentConfirmed) {
          selectedLabs.forEach((lab) => {
            // Get tests for this lab
            const labTests = selectedTestsFromLab
              .filter(item => item.labId === lab.labId)
              .map(item => ({
                name: item.test.name,
                price: item.price,
              }))

            const labTotal = labTests.reduce((sum, test) => sum + test.price, 0)

            // Get prescription PDF URL
            let prescriptionPdfUrl = null
            try {
              if (selectedRequest.prescriptionId) {
                const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
                const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
                const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
                if (matchingPrescription?.pdfUrl) {
                  prescriptionPdfUrl = matchingPrescription.pdfUrl
                }
              }
            } catch (error) {
              console.error('Error loading prescription PDF:', error)
            }

            const providerOrder = {
              id: `order-${Date.now()}-${lab.labId}`,
              requestId: selectedRequest.id,
              type: 'lab',
              visitType: selectedRequest.visitType || 'lab',
              labId: lab.labId,
              labName: lab.labName,
              patient: {
                name: selectedRequest.patientName,
                phone: selectedRequest.patientPhone,
                email: selectedRequest.patientEmail || 'patient@example.com',
                address: selectedRequest.patientAddress,
              },
              investigations: labTests,
              totalAmount: labTotal,
              status: 'confirmed', // Payment already confirmed
              paymentConfirmed: true,
              createdAt: new Date().toISOString(),
              assignedAt: new Date().toISOString(),
              prescription: {
                ...selectedRequest.prescription,
                pdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl,
              },
              prescriptionPdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl,
            }

            // Save to lab orders
            const labOrders = JSON.parse(localStorage.getItem(`labOrders_${lab.labId}`) || '[]')
            labOrders.push(providerOrder)
            localStorage.setItem(`labOrders_${lab.labId}`, JSON.stringify(labOrders))

            // Update lab wallet
            try {
              const labWallet = JSON.parse(localStorage.getItem(`labWallet_${lab.labId}`) || '{"balance": 0, "transactions": []}')
              labWallet.balance = (labWallet.balance || 0) + labTotal
              const transaction = {
                id: `txn-${Date.now()}-${lab.labId}`,
                type: 'credit',
                amount: labTotal,
                description: `Payment received for order from ${selectedRequest.patientName || 'Patient'}`,
                orderId: providerOrder.id,
                requestId: selectedRequest.id,
                patientName: selectedRequest.patientName || 'Patient',
                createdAt: new Date().toISOString(),
              }
              labWallet.transactions = labWallet.transactions || []
              labWallet.transactions.unshift(transaction)
              localStorage.setItem(`labWallet_${lab.labId}`, JSON.stringify(labWallet))
            } catch (error) {
              console.error('Error updating lab wallet:', error)
            }
          })

          // Update patient order status
          const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
          const patientOrderIndex = patientOrders.findIndex(o => o.requestId === selectedRequest.id)
          if (patientOrderIndex >= 0) {
            patientOrders[patientOrderIndex] = {
              ...patientOrders[patientOrderIndex],
              status: 'confirmed',
            }
            localStorage.setItem('patientOrders', JSON.stringify(patientOrders))
          }
        } else {
          // Don't create lab orders yet - wait for patient payment
          // Orders will be assigned by admin after patient pays the bill
        }
      }

      // Send response to backend API
      const requestId = selectedRequest.id || selectedRequest._id
      if (!requestId) {
        throw new Error('Request ID not found')
      }

      // Prepare API payload
      const apiPayload = {
        ...(activeSection === 'pharmacy' && selectedPharmacies.length > 0 ? {
          pharmacies: selectedPharmacies.map(p => p.pharmacyId || p._id),
        } : {}),
        ...(activeSection === 'lab' && selectedLabs.length > 0 ? {
          labs: selectedLabs.map(l => l.labId || l._id),
        } : {}),
        medicines: activeSection === 'pharmacy' ? selectedMedicinesFromPharmacy.map(item => ({
          pharmacyId: item.pharmacyId,
          pharmacyName: item.pharmacyName,
          name: item.medicine.name,
          dosage: item.medicine.dosage || '',
          quantity: item.quantity,
          price: item.price,
        })) : [],
        tests: activeSection === 'lab' ? selectedTestsFromLab.map(item => ({
          labId: item.labId,
          labName: item.labName,
          testName: item.test.name || item.test.testName,
          price: item.price,
        })) : [],
        message: adminResponse || '',
      }

      // Call backend API
      const response = await respondToAdminRequest(requestId, apiPayload)

      if (!response.success) {
        throw new Error(response.message || 'Failed to send response')
      }

      toast.success('Response sent successfully! Patient can now view and pay for the request.')

      // Construct the response data structure for local update (including names to ensure visibility)
      const updatedAdminResponseData = {
        ...apiPayload,
        // Override IDs with full objects for display
        labs: activeSection === 'lab' ? selectedLabs.map(l => ({
          labId: l.labId || l._id,
          name: l.labName || l.name, // Ensure name property exists
          labName: l.labName || l.name
        })) : [],
        pharmacies: activeSection === 'pharmacy' ? selectedPharmacies.map(p => ({
          pharmacyId: p.pharmacyId || p._id,
          name: p.pharmacyName || p.name, // Ensure name property exists
          pharmacyName: p.pharmacyName || p.name
        })) : [],
        totalAmount: totalAmount,
        respondedAt: new Date().toISOString()
      }

      // Update the requests list immediately with adminResponse so it persists when modal is reopened
      if (activeSection === 'lab') {
        setLabRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === selectedRequest.id || req._id === selectedRequest.id
              ? {
                ...req,
                adminResponse: updatedAdminResponseData,
                status: 'accepted',
              }
              : req
          )
        )
      } else if (activeSection === 'pharmacy') {
        setPharmacyRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === selectedRequest.id || req._id === selectedRequest.id
              ? {
                ...req,
                adminResponse: updatedAdminResponseData,
                status: 'accepted',
              }
              : req
          )
        )
      }

      // Close the modal as requested
      setSelectedRequest(null)

      // Reset form inputs (though closing modal usually does this via the onClose handler, explicit reset here is safe)
      setShowPharmacyDropdown(false)
      setShowLabDropdown(false)
      setAdminResponse('')
      setExpandedPharmacyId(null)
      setExpandedPharmacySearch('')
      setExpandedLabId(null)
      setExpandedLabSearch('')
      setLabTestSearch('')

      // Keep selected labs and tests visible - they're now in adminResponse
      // Don't clear them so user can see what was selected
    } catch (error) {
      console.error('Error sending response:', error)
      // Error sending response
    } finally {
      setIsSendingResponse(false)
    }
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

  const generatePDF = (request) => {
    // Convert request data to proper structure using originalData where possible
    const prescriptionData = {
      doctor: {
        name: request.prescription?.doctorName || 'Doctor',
        specialty: request.prescription?.doctorSpecialty || '',
        // Try to get clinic details from originalData
        clinicName: request.prescription?.clinicName || request.originalData?.prescriptionId?.doctorId?.clinicDetails?.name || 'Heallyn Clinic',
        clinicAddress: request.prescription?.clinicAddress || request.originalData?.prescriptionId?.doctorId?.clinicDetails?.address || null,
        phone: request.prescription?.doctorPhone || request.originalData?.prescriptionId?.doctorId?.phone || '',
        email: request.prescription?.doctorEmail || request.originalData?.prescriptionId?.doctorId?.email || '',
        digitalSignature: request.prescription?.doctorSignature || request.originalData?.prescriptionId?.doctorId?.digitalSignature || null
      },
      patient: {
        name: request.patientName || 'Patient',
        age: request.originalData?.patientId?.age || null,
        gender: request.originalData?.patientId?.gender || '',
        phone: request.patientPhone || '',
        address: request.patientAddress || request.address || ''
      },
      diagnosis: request.prescription?.diagnosis || '',
      symptoms: request.prescription?.symptoms || [],
      medications: request.prescription?.medications || [],
      investigations: request.prescription?.investigations || [],
      advice: request.prescription?.advice || request.prescription?.notes || '',
      followUpAt: request.prescription?.followUpAt || request.prescription?.followUpDate || null,
      issuedAt: request.prescription?.issuedAt || request.createdAt || new Date().toISOString().split('T')[0],
      status: 'active',
      originalData: request.originalData
    }

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
    const clinicName = prescriptionData.doctor.clinicName
    doc.text(clinicName, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Clinic Address (Centered) - Reduced spacing
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    let clinicAddress = 'Address not provided'
    const clinicAddressRaw = prescriptionData.doctor.clinicAddress

    if (clinicAddressRaw) {
      if (typeof clinicAddressRaw === 'string') {
        clinicAddress = clinicAddressRaw
      } else if (typeof clinicAddressRaw === 'object' && clinicAddressRaw !== null) {
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
    const phone = prescriptionData.doctor.phone || 'N/A'
    doc.text(phone, margin + 5, contactY)

    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.2, 'F')
    const email = prescriptionData.doctor.email || 'N/A'
    doc.text(email, pageWidth - margin, contactY, { align: 'right' })
    yPos += 4

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Doctor Information (Left) and Patient Information (Right)
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

    // Patient Info (Right)
    let patientYPos = yPos
    doc.text(`Name: ${prescriptionData.patient.name}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    doc.text(`Age: ${prescriptionData.patient.age ? `${prescriptionData.patient.age} years` : 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    doc.text(`Gender: ${prescriptionData.patient.gender || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    doc.text(`Phone: ${prescriptionData.patient.phone}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 3

    // Patient Address
    const patientAddress = prescriptionData.patient.address
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

    // Diagnosis Section
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 5

    // Light blue rounded box for diagnosis
    const diagnosisHeight = 6
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 3, yPos + 1)
    yPos += diagnosisHeight + 3

    // Symptoms Section
    if (prescriptionData.symptoms && prescriptionData.symptoms.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')

      const symptomsList = Array.isArray(prescriptionData.symptoms)
        ? prescriptionData.symptoms
        : typeof prescriptionData.symptoms === 'string'
          ? prescriptionData.symptoms.split('\n')
          : [String(prescriptionData.symptoms)]

      symptomsList.filter(s => s && s.trim()).forEach((symptom) => {
        if (yPos > pageHeight - 60) return

        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.2, yPos - 0.8, 1, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(symptom.trim(), margin + 4, yPos)
        yPos += 3
      })
      yPos += 1
    }

    // Medications Section
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 5

      prescriptionData.medications.forEach((med, idx) => {
        const cardHeight = 18
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')

        // Numbered square
        const numberSize = 6
        const numberX = pageWidth - margin - numberSize - 2
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 0.5, { align: 'center' })

        // Name
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 3, yPos + 2)

        // Details
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 3
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 3
        const startY = yPos + 6

        doc.text(`Dosage: ${med.dosage || 'N/A'}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 3)

        doc.text(`Frequency: ${med.frequency || 'N/A'}`, rightColX, startY)
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 3)
        }

        yPos += cardHeight + 2
      })
      yPos += 1
    }

    // Investigations (Tests) Section
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 5

      prescriptionData.investigations.forEach((inv) => {
        if (yPos > pageHeight - 50) return

        const invName = inv.name || inv.testName || 'Investigation'
        const invNotes = inv.notes || ''
        const invNameStr = typeof invName === 'string' ? invName : String(invName)

        const testBoxHeight = invNotes ? 10 : 7
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')

        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(invNameStr, margin + 3, yPos + 1.5)

        if (invNotes) {
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(String(invNotes), margin + 3, yPos + 6)
        }

        yPos += testBoxHeight + 2
      })
      yPos += 1
    }

    // Advice Section
    if (prescriptionData.advice) {
      if (yPos > pageHeight - 50) yPos = pageHeight - 50
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 5
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const adviceText = typeof prescriptionData.advice === 'string' ? prescriptionData.advice : String(prescriptionData.advice)
      const adviceLines = doc.splitTextToSize(adviceText, pageWidth - 2 * margin)
      adviceLines.forEach((line) => {
        if (yPos > pageHeight - 45) return
        doc.text(line.trim(), margin, yPos)
        yPos += 3
      })
      yPos += 1
    }

    // Follow-up Section
    if (prescriptionData.followUpAt && yPos < pageHeight - 35) {
      const followUpHeight = 9
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')

      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 0.5, 2.5, 2.5, 0.5, 0.5, 'F')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 6, yPos + 2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const followUpDate = new Date(prescriptionData.followUpAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 6, yPos + 6)
      yPos += followUpHeight + 3
    }

    // Footer with Signature
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) yPos = minYPos

    const signatureX = pageWidth - margin - 55
    const signatureY = yPos

    // Add digital signature if available
    const digitalSignature = prescriptionData.doctor.digitalSignature
    if (digitalSignature) {
      try {
        let imageData = typeof digitalSignature === 'string' ? digitalSignature : digitalSignature.imageUrl || digitalSignature.url
        if (imageData) {
          // Basic check for image format
          let imageFormat = 'PNG'
          if (imageData.includes('jpeg') || imageData.includes('jpg')) imageFormat = 'JPEG'

          // Position above the line
          doc.addImage(imageData, imageFormat, signatureX, signatureY - 18, 50, 18, undefined, 'FAST')
        }
      } catch (err) {
        console.warn('Failed to add signature image', err)
      }
    }

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(signatureX, signatureY, signatureX + 50, signatureY)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescriptionData.doctor.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(prescriptionData.doctor.specialty, signatureX + 25, signatureY + 12, { align: 'center' })

    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    return doc
  }

  const handleViewPDF = async (request) => {
    try {
      // Process signature if needed (convert to base64)
      let reqWithSignature = { ...request }
      const digitalSignature = request.prescription?.doctorSignature || request.originalData?.prescriptionId?.doctorId?.digitalSignature

      if (digitalSignature) {
        const sigUrl = typeof digitalSignature === 'string' ? digitalSignature : digitalSignature.imageUrl || digitalSignature.url
        if (sigUrl && !sigUrl.startsWith('data:image/')) {
          try {
            const base64Sig = await urlToBase64(sigUrl)
            // Inject back into structure for generatePDF
            if (!reqWithSignature.prescription) reqWithSignature.prescription = {}
            reqWithSignature.prescription.doctorSignature = base64Sig
          } catch (e) {
            console.warn('Signature conversion failed', e)
          }
        }
      }

      const doc = generatePDF(reqWithSignature)
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 100)
    } catch (error) {
      console.error('Error viewing PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  const handleDownloadPDF = async (request) => {
    try {
      // Process signature if needed
      let reqWithSignature = { ...request }
      const digitalSignature = request.prescription?.doctorSignature || request.originalData?.prescriptionId?.doctorId?.digitalSignature

      if (digitalSignature) {
        const sigUrl = typeof digitalSignature === 'string' ? digitalSignature : digitalSignature.imageUrl || digitalSignature.url
        if (sigUrl && !sigUrl.startsWith('data:image/')) {
          try {
            const base64Sig = await urlToBase64(sigUrl)
            if (!reqWithSignature.prescription) reqWithSignature.prescription = {}
            reqWithSignature.prescription.doctorSignature = base64Sig
          } catch (e) {
            console.warn('Signature conversion failed', e)
          }
        }
      }

      const doc = generatePDF(reqWithSignature)
      const fileName = `Prescription_${request.patientName || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  const currentRequests = activeSection === 'lab' ? labRequests : pharmacyRequests
  const filteredRequests = getFilteredRequests(currentRequests)
  
  // Paginated filtered requests
  const paginatedFilteredRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredRequests.slice(startIndex, endIndex)
  }, [filteredRequests, currentPage, itemsPerPage])
  
  // Update pagination when filtered requests change
  useEffect(() => {
    const totalFiltered = filteredRequests.length
    setTotalPages(Math.ceil(totalFiltered / itemsPerPage) || 1)
    setTotalItems(totalFiltered)
  }, [filteredRequests, itemsPerPage])

  // Debug: Log to console
  useEffect(() => {
    
    
    
    
    
  }, [labRequests, pharmacyRequests, activeSection, filteredRequests])

  // Hydrate state when selectedRequest changes and has adminResponse
  useEffect(() => {
    if (selectedRequest?.adminResponse) {
      const resp = selectedRequest.adminResponse;

      // Hydrate Pharmacy Data
      if (resp.pharmacies && resp.pharmacies.length > 0) {
        // Map simplified pharmacy objects to state
        setSelectedPharmacies(resp.pharmacies.map(p => ({
          pharmacyId: p.pharmacyId || p._id || p.id,
          pharmacyName: p.pharmacyName || p.name,
          ...p
        })));
      }

      if (resp.medicines && resp.medicines.length > 0) {
        setSelectedMedicinesFromPharmacy(resp.medicines.map(m => ({
          pharmacyId: m.pharmacyId,
          pharmacyName: m.pharmacyName,
          medicine: {
            name: m.name,
            dosage: m.dosage
          },
          quantity: m.quantity,
          price: m.price
        })));
      }

      // Hydrate Lab Data
      if (resp.labs && resp.labs.length > 0) {
        setSelectedLabs(resp.labs.map(l => ({
          labId: l.labId || l._id || l.id,
          labName: l.labName || l.name,
          ...l
        })));
      }

      if ((resp.tests && resp.tests.length > 0) || (resp.investigations && resp.investigations.length > 0)) {
        const testsToUse = resp.tests || resp.investigations;
        setSelectedTestsFromLab(testsToUse.map(t => ({
          labId: t.labId,
          labName: t.labName,
          test: {
            name: t.testName || t.name
          },
          price: t.price
        })));
      }

      // Set Total Amount
      if (resp.totalAmount) {
        setTotalAmount(Number(resp.totalAmount));
      }
    }
  }, [selectedRequest]);

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
          <p className="mt-1 text-sm text-slate-600">
            Patient prescription requests for lab tests and pharmacy orders
          </p>
        </div>

        {/* Section Tabs - Lab and Pharmacy */}
        <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveSection('pharmacy')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeSection === 'pharmacy'
              ? 'text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
            style={activeSection === 'pharmacy' ? { backgroundColor: '#11496c' } : {}}
          >
            <IoBagHandleOutline className="h-5 w-5" />
            Pharmacy ({pharmacyRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('lab')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeSection === 'lab'
              ? 'text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
            style={activeSection === 'lab' ? { backgroundColor: '#11496c' } : {}}
          >
            <IoFlaskOutline className="h-5 w-5" />
            Lab ({labRequests.length})
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === tab.value
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
              style={filter === tab.value ? { backgroundColor: '#11496c' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {paginatedFilteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            {activeSection === 'pharmacy' ? (
              <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-400" />
            ) : (
              <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-400" />
            )}
            <p className="mt-4 text-sm font-medium text-slate-600">No requests found</p>
            <p className="mt-1 text-xs text-slate-500">
              {activeSection === 'pharmacy'
                ? 'Medicine order requests from patients will appear here'
                : 'Lab test requests from patients will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedFilteredRequests.map((request) => (
              <article
                key={request.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }}
                />

                <div className="relative">
                  {/* Patient Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-slate-100 ${activeSection === 'lab'
                      ? 'bg-[rgba(17,73,108,0.1)]'
                      : 'bg-[rgba(17,73,108,0.1)]'
                      }`}>
                      <IoPersonOutline className={`h-6 w-6 ${activeSection === 'lab' ? 'text-[#11496c]' : 'text-[#11496c]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {request.patientName || 'Patient'}
                      </h3>
                      <p className="text-xs text-[#11496c] truncate mt-0.5">
                        {request.prescription?.doctorName || 'Doctor'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {request.prescription?.doctorSpecialty || 'Specialty'}
                      </p>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">{request.patientPhone || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <IoLocationOutline className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-700 line-clamp-1 text-[10px]">{request.patientAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${request.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : request.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : request.status === 'bill_generated' || (request.status === 'accepted' && request.paymentPending && !request.paymentConfirmed)
                            ? 'bg-amber-100 text-amber-700'
                            : request.status === 'accepted' || request.status === 'admin_responded'
                              ? 'bg-blue-100 text-blue-700'
                              : request.status === 'payment_confirmed' || request.paymentConfirmed
                                ? 'bg-emerald-100 text-emerald-700'
                                : request.status === 'completed' || request.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {request.status === 'pending'
                        ? 'Pending'
                        : request.status === 'cancelled'
                          ? request.cancelledBy === 'patient' ? 'Cancelled by Patient' : 'Cancelled'
                          : request.status === 'bill_generated' || (request.status === 'accepted' && request.paymentPending && !request.paymentConfirmed)
                            ? 'Payment Pending'
                            : request.status === 'accepted' || request.status === 'admin_responded'
                              ? 'Accepted'
                              : request.status === 'payment_confirmed' || request.paymentConfirmed
                                ? 'Payment Confirmed'
                                : request.status === 'completed' || request.status === 'confirmed'
                                  ? 'Completed'
                                  : 'Active'}
                    </span>
                    {request.paymentConfirmed && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-green-100 text-green-700">
                        Paid{request.paidAt ? `: ${formatDate(request.paidAt)}` : ''}
                      </span>
                    )}
                    {request.cancelledBy === 'patient' && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-red-100 text-red-700">
                        Patient Cancelled
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <IoCalendarOutline className="h-2.5 w-2.5" />
                      <span>{formatDate(request.prescription?.issuedAt)}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {request.prescription?.diagnosis && (
                    <div className="mb-2">
                      <p className="text-[9px] text-slate-600 mb-0.5">Diagnosis:</p>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {request.prescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Medications/Investigations Count */}
                  {activeSection === 'pharmacy' && request.prescription?.medications && request.prescription.medications.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-[rgba(59,130,246,0.1)] px-2 py-0.5 border border-[rgba(59,130,246,0.2)] w-fit mb-2">
                      <IoBagHandleOutline className="h-3 w-3 text-blue-700" />
                      <span className="text-[10px] font-semibold text-blue-700">
                        {request.prescription.medications.length} {request.prescription.medications.length === 1 ? 'medicine' : 'medicines'}
                      </span>
                    </div>
                  )}
                  {activeSection === 'lab' && request.prescription?.investigations && request.prescription.investigations.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 border border-[rgba(17,73,108,0.2)] w-fit mb-2">
                      <IoFlaskOutline className="h-3 w-3 text-[#11496c]" />
                      <span className="text-[10px] font-semibold text-[#11496c]">
                        {request.prescription.investigations.length} {request.prescription.investigations.length === 1 ? 'test' : 'tests'}
                      </span>
                    </div>
                  )}

                  {/* Visit Type Badge for Lab Requests */}
                  {activeSection === 'lab' && request.visitType && (
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 border w-fit mb-2 ${request.visitType === 'home'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-blue-50 border-blue-200'
                      }`}>
                      {request.visitType === 'home' ? (
                        <>
                          <IoHomeOutline className="h-3 w-3 text-emerald-700" />
                          <span className="text-[10px] font-semibold text-emerald-700">Home Collection</span>
                        </>
                      ) : (
                        <>
                          <IoBusinessOutline className="h-3 w-3 text-blue-700" />
                          <span className="text-[10px] font-semibold text-blue-700">Lab Visit</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Prescription Actions - Icons Only */}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleViewPDF(request)}
                        className="flex items-center justify-center rounded-lg bg-[#11496c] p-2 text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                        title="View"
                      >
                        <IoEyeOutline className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(request)}
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                        title="Download"
                      >
                        <IoDownloadOutline className="h-4 w-4" />
                      </button>
                      {request.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenRequest(request)}
                            className="flex items-center justify-center rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95 gap-1.5"
                            title={activeSection === 'pharmacy' ? 'Select Pharmacy' : 'Select Lab'}
                          >
                            {activeSection === 'pharmacy' ? (
                              <>
                                <IoBagHandleOutline className="h-4 w-4" />
                                Select Pharmacy
                              </>
                            ) : (
                              <>
                                <IoFlaskOutline className="h-4 w-4" />
                                Select Lab
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(request.id)}
                            className="flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 gap-1.5"
                            title="Reject"
                          >
                            <IoCloseCircleOutline className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      ) : request.status !== 'cancelled' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRequest(request)}
                          className="flex items-center justify-center rounded-lg border border-[#11496c] bg-white p-2 text-[#11496c] transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                          title={activeSection === 'pharmacy' ? 'View/Edit Medicines' : 'View/Edit Lab'}
                        >
                          {activeSection === 'pharmacy' ? (
                            <IoBagHandleOutline className="h-4 w-4" />
                          ) : (
                            <IoFlaskOutline className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[9px] font-semibold text-red-600 px-2 py-1 rounded bg-red-50">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Request Time */}
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <IoTimeOutline className="h-2.5 w-2.5" />
                      <span>Requested {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && paginatedFilteredRequests.length > 0 && (
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
      </div>

      {/* Prescription View Modal */}
      {showPrescriptionModal && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrescriptionModal(false)
              setSelectedRequest(null)
            }
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Prescription</h2>
                <p className="text-sm text-slate-600">View prescription details</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedRequest)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => handleViewPDF(selectedRequest)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <IoEyeOutline className="h-4 w-4" />
                  Open in New Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrescriptionModal(false)
                    setSelectedRequest(null)
                  }}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Prescription Content - PDF Viewer */}
            <div className="p-6">
              <div className="w-full h-[600px] border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                {(() => {
                  try {
                    const doc = generatePDF(selectedRequest)
                    const pdfBlob = doc.output('blob')
                    const pdfUrl = URL.createObjectURL(pdfBlob)
                    return (
                      <object
                        data={pdfUrl}
                        type="application/pdf"
                        className="w-full h-full"
                        aria-label="Prescription PDF"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <IoDocumentTextOutline className="h-16 w-16 text-slate-400 mb-4" />
                          <p className="text-sm font-medium text-slate-600 mb-2">
                            PDF viewer not supported in your browser
                          </p>
                          <button
                            type="button"
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="flex items-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
                          >
                            <IoEyeOutline className="h-4 w-4" />
                            Open PDF in New Tab
                          </button>
                        </div>
                      </object>
                    )
                  } catch (error) {
                    console.error('Error generating PDF:', error)
                    return (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <IoDocumentTextOutline className="h-16 w-16 text-slate-400 mb-4" />
                        <p className="text-sm font-medium text-slate-600">
                          Error loading prescription. Please try again.
                        </p>
                      </div>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && !showPrescriptionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Only reset state if bill hasn't been generated yet
              const hasBillGenerated = selectedRequest?.adminResponse &&
                (selectedRequest.status === 'accepted' || selectedRequest.status === 'admin_responded')

              if (!hasBillGenerated) {
                // Reset all state only if bill not generated
                setSelectedPharmacy(null)
                setSelectedLab(null)
                setSelectedPharmacies([])
                setSelectedLabs([])
                setAdminMedicines([])
                setAdminResponse('')
                setTotalAmount(0)
                setSelectedMedicinesFromPharmacy([])
                setSelectedTestsFromLab([])
              }

              // Always close dropdowns and reset search
              setShowPharmacyDropdown(false)
              setShowLabDropdown(false)
              setExpandedPharmacyId(null)
              setExpandedPharmacySearch('')
              setExpandedLabId(null)
              setExpandedLabSearch('')
              setLabTestSearch('')

              // Close modal
              setSelectedRequest(null)
            }
          }}
        >
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Request Details</h2>
                <p className="text-xs text-slate-600">{activeSection === 'pharmacy' ? 'Medicine Order Request' : 'Lab Test Request'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Only reset state if bill hasn't been generated yet
                  // If bill is generated, keep the data so it shows when modal is reopened
                  const hasBillGenerated = selectedRequest?.adminResponse &&
                    (selectedRequest.status === 'accepted' || selectedRequest.status === 'admin_responded')

                  if (!hasBillGenerated) {
                    // Reset all state only if bill not generated
                    setSelectedPharmacy(null)
                    setSelectedLab(null)
                    setSelectedPharmacies([])
                    setSelectedLabs([])
                    setAdminMedicines([])
                    setAdminResponse('')
                    setTotalAmount(0)
                    setSelectedMedicinesFromPharmacy([])
                    setSelectedTestsFromLab([])
                  }

                  // Always close dropdowns and reset search
                  setShowPharmacyDropdown(false)
                  setShowLabDropdown(false)
                  setExpandedPharmacyId(null)
                  setExpandedPharmacySearch('')
                  setExpandedLabId(null)
                  setExpandedLabSearch('')
                  setLabTestSearch('')

                  // Close modal
                  setSelectedRequest(null)
                }}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Patient Information */}
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <IoPersonOutline className="h-3.5 w-3.5" />
                  Patient Information
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.patientName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Phone:</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.patientPhone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Address:</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%] text-[11px]">{selectedRequest.patientAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Prescription Details */}
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <IoDocumentTextOutline className="h-3.5 w-3.5" />
                  Prescription Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-600">Doctor:</span>
                    <p className="text-xs font-semibold text-slate-900">
                      {selectedRequest.prescription?.doctorName || 'N/A'} - {selectedRequest.prescription?.doctorSpecialty || 'N/A'}
                    </p>
                  </div>
                  {selectedRequest.prescription?.diagnosis && (
                    <div>
                      <span className="text-[10px] text-slate-600">Diagnosis:</span>
                      <p className="text-xs font-semibold text-slate-900">{selectedRequest.prescription.diagnosis}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-600">Issued Date:</span>
                    <p className="text-xs font-semibold text-slate-900">{formatDate(selectedRequest.prescription?.issuedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoDownloadOutline className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewPDF(selectedRequest)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    aria-label="View PDF"
                  >
                    <IoEyeOutline className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Prescription Medications - Show only for pharmacy requests */}
              {activeSection === 'pharmacy' && selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoBagHandleOutline className="h-3.5 w-3.5" />
                    Prescribed Medicines
                  </h3>
                  <div className="space-y-1.5">
                    {selectedRequest.prescription.medications.map((med, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-900">{med.name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
                          {med.dosage && <span>Dosage: {med.dosage}</span>}
                          {med.frequency && <span>Frequency: {med.frequency}</span>}
                          {med.duration && <span>Duration: {med.duration}</span>}
                        </div>
                        {med.instructions && (
                          <p className="mt-1 text-[10px] text-slate-500 line-clamp-1">Instructions: {med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescribed Lab Tests - Show for lab requests */}
              {activeSection === 'lab' && selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoFlaskOutline className="h-3.5 w-3.5" />
                    Prescribed Lab Tests
                  </h3>
                  <div className="space-y-1.5">
                    {selectedRequest.prescription.investigations.map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testNotes = typeof test === 'object' ? test.notes : null
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <p className="text-xs font-semibold text-slate-900">{testName}</p>
                          {testNotes && (
                            <p className="mt-1 text-[10px] text-slate-500 line-clamp-1">Notes: {testNotes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pharmacy Selection Dropdown - Only for pharmacy requests (not cancelled) */}
              {activeSection === 'pharmacy' && (selectedRequest.status === 'pending' || (selectedRequest.status !== 'cancelled' && !selectedRequest.adminResponse)) && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoBusinessOutline className="h-3.5 w-3.5" />
                    Select Pharmacy
                  </h3>

                  {/* Dropdown Button */}
                  <div className="relative" ref={pharmacyDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowPharmacyDropdown(!showPharmacyDropdown)}
                      className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-[#11496c] hover:bg-slate-50 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <IoBusinessOutline className="h-3.5 w-3.5 text-[#11496c]" />
                        <span className="truncate">
                          {selectedPharmacies.length === 0
                            ? 'Select pharmacy(s)'
                            : selectedPharmacies.length === 1
                              ? selectedPharmacies[0].pharmacyName
                              : `${selectedPharmacies.length} pharmacies selected`}
                        </span>
                      </span>
                      <IoChevronDownOutline
                        className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${showPharmacyDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showPharmacyDropdown && (
                      <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-96 overflow-y-auto">
                        {pharmacies.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No pharmacies available
                          </div>
                        ) : (
                          <div className="p-1.5 space-y-1.5">
                            {pharmacies.map((pharmacy) => {
                              const isSelected = selectedPharmacies.some(p => p.pharmacyId === pharmacy.pharmacyId)
                              const isExpanded = expandedPharmacyId === pharmacy.pharmacyId
                              return (
                                <div
                                  key={pharmacy.pharmacyId}
                                  className={`rounded-lg border transition ${isSelected
                                    ? 'border-[#11496c] bg-blue-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                  {/* Pharmacy Header - Clickable for selection */}
                                  <div
                                    className="flex items-start justify-between p-2.5 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isSelected) {
                                        setSelectedPharmacies(selectedPharmacies.filter(p => p.pharmacyId !== pharmacy.pharmacyId))
                                      } else {
                                        setSelectedPharmacies([...selectedPharmacies, pharmacy])
                                      }
                                    }}
                                  >
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }} // Handled by parent onClick
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c] cursor-pointer"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-slate-900 mb-0.5 truncate">
                                          {pharmacy.pharmacyName}
                                        </h4>
                                        {pharmacy.rating != null && Number(pharmacy.rating) > 0 && (
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <div className="flex items-center gap-0.5">
                                              {renderStars(Number(pharmacy.rating))}
                                            </div>
                                            <span className="text-[10px] font-semibold text-slate-700">
                                              {Number(pharmacy.rating).toFixed(1)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pharmacy Details */}
                                  <div className="px-2.5 pb-2.5 space-y-1 text-[10px] text-slate-600">
                                    {pharmacy.address && (
                                      <div className="flex items-start gap-1">
                                        <IoLocationOutline className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                                        <span className="flex-1 line-clamp-1">{pharmacy.address}</span>
                                      </div>
                                    )}
                                    {pharmacy.phone && (
                                      <div className="flex items-center gap-1">
                                        <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                                        <span>{pharmacy.phone}</span>
                                      </div>
                                    )}
                                    {pharmacy.medicines && pharmacy.medicines.length > 0 && (
                                      <div
                                        className="flex items-center justify-between pt-1.5 border-t border-slate-200 cursor-pointer hover:bg-slate-50 -mx-2.5 px-2.5 py-1 rounded"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const newExpandedId = isExpanded ? null : pharmacy.pharmacyId
                                          setExpandedPharmacyId(newExpandedId)
                                          if (!newExpandedId) {
                                            setExpandedPharmacySearch('') // Clear search when collapsing
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-1">
                                          <IoBagHandleOutline className="h-3 w-3 text-blue-600 shrink-0" />
                                          <span className="font-semibold text-blue-700">
                                            {pharmacy.medicines.length} {pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'}
                                          </span>
                                        </div>
                                        <IoChevronDownOutline
                                          className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Expanded Medicines List */}
                                  {isExpanded && pharmacy.medicines && pharmacy.medicines.length > 0 && (
                                    <div className="px-2.5 pb-2.5 border-t border-slate-200 bg-slate-50">
                                      {/* Search Input for Medicines */}
                                      <div className="mt-2 mb-2">
                                        <div className="relative">
                                          <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                                          <input
                                            type="text"
                                            value={expandedPharmacyId === pharmacy.pharmacyId ? expandedPharmacySearch : ''}
                                            onChange={(e) => {
                                              if (expandedPharmacyId === pharmacy.pharmacyId) {
                                                setExpandedPharmacySearch(e.target.value)
                                              }
                                            }}
                                            placeholder="Search medicine name, dosage..."
                                            className="w-full rounded border border-slate-300 bg-white pl-7 pr-2 py-1.5 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {pharmacy.medicines
                                          .filter((med) => {
                                            // Only show medicines for the expanded pharmacy
                                            if (expandedPharmacyId !== pharmacy.pharmacyId) return false
                                            // If no search term, show all medicines
                                            if (!expandedPharmacySearch) return true
                                            // Filter by search term
                                            const searchTerm = expandedPharmacySearch.toLowerCase()
                                            return (
                                              med.name?.toLowerCase().includes(searchTerm) ||
                                              med.dosage?.toLowerCase().includes(searchTerm) ||
                                              med.manufacturer?.toLowerCase().includes(searchTerm)
                                            )
                                          })
                                          .map((med, idx) => {
                                            const isSelected = selectedMedicinesFromPharmacy.some(
                                              item => item.medicine.name.toLowerCase() === med.name.toLowerCase() &&
                                                item.medicine.dosage === med.dosage &&
                                                item.pharmacyId === pharmacy.pharmacyId
                                            )
                                            const selectedItem = selectedMedicinesFromPharmacy.find(
                                              item => item.medicine.name.toLowerCase() === med.name.toLowerCase() &&
                                                item.medicine.dosage === med.dosage &&
                                                item.pharmacyId === pharmacy.pharmacyId
                                            )

                                            return (
                                              <div
                                                key={idx}
                                                className={`rounded border p-2 text-[10px] transition ${isSelected
                                                  ? 'border-[#11496c] bg-blue-50'
                                                  : 'border-slate-200 bg-white hover:border-slate-300'
                                                  }`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleAddMedicineFromPharmacy(med, pharmacy.pharmacyId, pharmacy.pharmacyName)
                                                        }}
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${isSelected
                                                          ? 'border-[#11496c] bg-[#11496c] text-white'
                                                          : 'border-slate-300 bg-white text-slate-600 hover:border-[#11496c] hover:text-[#11496c]'
                                                          }`}
                                                      >
                                                        {isSelected ? (
                                                          <IoCheckmarkCircleOutline className="h-3 w-3" />
                                                        ) : (
                                                          <IoAddOutline className="h-3 w-3" />
                                                        )}
                                                      </button>
                                                      <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900">
                                                          {med.name}
                                                        </p>
                                                        {med.dosage && (
                                                          <p className="text-slate-600 text-[9px]">
                                                            Dosage: {med.dosage}
                                                          </p>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-600 ml-6">
                                                      {med.quantity && (
                                                        <span>Available: {med.quantity} tablets</span>
                                                      )}
                                                      {med.price && (
                                                        <span className="font-semibold text-[#11496c]">
                                                          ₹{med.price} per tablet
                                                        </span>
                                                      )}
                                                    </div>
                                                    {isSelected && selectedItem && (
                                                      <div className="mt-1.5 ml-6 flex items-center gap-2">
                                                        <label className="text-[9px] font-medium text-slate-700">
                                                          Quantity (Tablets):
                                                        </label>
                                                        <input
                                                          type="number"
                                                          min="1"
                                                          max={med.quantity || 999}
                                                          value={selectedItem.quantity || ''}
                                                          placeholder="Qty"
                                                          onChange={(e) => {
                                                            const index = selectedMedicinesFromPharmacy.findIndex(
                                                              item => item.medicine.name.toLowerCase() === med.name.toLowerCase() &&
                                                                item.medicine.dosage === med.dosage &&
                                                                item.pharmacyId === pharmacy.pharmacyId
                                                            )
                                                            if (index >= 0) {
                                                              handleUpdateMedicineQuantity(index, e.target.value)
                                                            }
                                                          }}
                                                          onClick={(e) => e.stopPropagation()}
                                                          className="w-16 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#11496c]"
                                                        />
                                                        <span className="text-[9px] font-semibold text-[#11496c]">
                                                          = ₹{((selectedItem.quantity || 0) * selectedItem.price).toFixed(2)}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        {pharmacy.medicines.filter((med) => {
                                          // Only check medicines for the expanded pharmacy
                                          if (expandedPharmacyId !== pharmacy.pharmacyId) return false
                                          // If no search term, show all medicines
                                          if (!expandedPharmacySearch) return true
                                          // Filter by search term
                                          const searchTerm = expandedPharmacySearch.toLowerCase()
                                          return (
                                            med.name?.toLowerCase().includes(searchTerm) ||
                                            med.dosage?.toLowerCase().includes(searchTerm) ||
                                            med.manufacturer?.toLowerCase().includes(searchTerm)
                                          )
                                        }).length === 0 && expandedPharmacySearch && expandedPharmacyId === pharmacy.pharmacyId && (
                                            <div className="text-center py-3 text-[10px] text-slate-500">
                                              No medicines found matching "{expandedPharmacySearch}"
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Medicines Summary */}
                  {selectedMedicinesFromPharmacy.length > 0 && (
                    <div className="mt-3 rounded-lg border-2 border-[#11496c] bg-blue-50 p-2.5">
                      <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                        <IoBagHandleOutline className="h-3.5 w-3.5" />
                        Selected Medicines
                      </h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedMedicinesFromPharmacy.map((item, idx) => (
                          <div key={idx} className="rounded border border-blue-200 bg-white p-1.5 text-[10px]">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {item.medicine.name} ({item.medicine.dosage})
                                </p>
                                <p className="text-slate-600">
                                  {item.pharmacyName} • Qty: {item.quantity} tablets
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#11496c]">
                                  ₹{(item.quantity * item.price).toFixed(2)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMedicinesFromPharmacy(selectedMedicinesFromPharmacy.filter((_, i) => i !== idx))
                                  }}
                                  className="mt-0.5 text-red-600 hover:text-red-700"
                                  title="Remove"
                                >
                                  <IoTrashOutline className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between bg-blue-100 p-2 rounded">
                        <span className="text-sm font-bold text-slate-900">Total Calculation:</span>
                        <span className="text-lg font-extrabold text-[#11496c]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Lab Selection Dropdown - Only for lab requests (not cancelled) */}
              {activeSection === 'lab' && (selectedRequest.status === 'pending' || (selectedRequest.status !== 'cancelled' && !selectedRequest.adminResponse)) && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoFlaskOutline className="h-3.5 w-3.5" />
                    Select Laboratory (Select only one)
                  </h3>
                  {selectedLabs.length > 0 && (
                    <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                      <p className="text-[10px] text-blue-800 font-medium">
                        Selected: {selectedLabs[0]?.labName}
                      </p>
                    </div>
                  )}

                  {/* Dropdown Button */}
                  <div className="relative" ref={labDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowLabDropdown(!showLabDropdown)}
                      className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-[#11496c] hover:bg-slate-50 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c]" />
                        <span className="truncate">
                          {selectedLabs.length > 0
                            ? `${selectedLabs.length} ${selectedLabs.length === 1 ? 'laboratory' : 'laboratories'} selected`
                            : 'Select a laboratory'}
                        </span>
                      </span>
                      <IoChevronDownOutline
                        className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${showLabDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showLabDropdown && (
                      <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-96 overflow-y-auto">
                        {labs.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No laboratories available
                          </div>
                        ) : (
                          <div className="p-1.5">
                            {labs.map((lab) => {
                              const isSelected = selectedLabs.some(l => l.labId === lab.labId)
                              const isExpanded = expandedLabId === lab.labId

                              return (
                                <div
                                  key={lab.labId}
                                  className={`rounded-lg border mb-1.5 transition ${isSelected
                                    ? 'border-[#11496c] bg-blue-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                  {/* Lab Header */}
                                  <div className="p-2.5">
                                    <div className="flex items-start justify-between mb-1.5">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <input
                                          type="radio"
                                          name="selectedLab"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            e.stopPropagation()
                                            if (isSelected) {
                                              // Deselect if clicking the same lab
                                              setSelectedLabs([])
                                              // Clear tests from this lab
                                              setSelectedTestsFromLab([])
                                            } else {
                                              // Select only this lab (clear previous selection)
                                              setSelectedLabs([lab])
                                              // Clear tests from previous lab
                                              setSelectedTestsFromLab([])
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-0.5 h-3.5 w-3.5 border-slate-300 text-[#11496c] focus:ring-[#11496c] cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-xs font-semibold text-slate-900 mb-0.5 truncate">
                                            {lab.labName}
                                          </h4>
                                          {lab.rating != null && Number(lab.rating) > 0 && (
                                            <div className="flex items-center gap-1 mb-0.5">
                                              <div className="flex items-center gap-0.5">
                                                {renderStars(Number(lab.rating))}
                                              </div>
                                              <span className="text-[10px] font-semibold text-slate-700">
                                                {Number(lab.rating).toFixed(1)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Lab Details */}
                                    <div className="space-y-1 text-[10px] text-slate-600">
                                      {lab.address && (
                                        <div className="flex items-start gap-1">
                                          <IoLocationOutline className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                                          <span className="flex-1 line-clamp-1">{lab.address}</span>
                                        </div>
                                      )}
                                      {lab.phone && (
                                        <div className="flex items-center gap-1">
                                          <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                                          <span>{lab.phone}</span>
                                        </div>
                                      )}
                                      {lab.tests && lab.tests.length > 0 && (
                                        <div
                                          className={`flex items-center justify-between pt-1.5 border-t border-slate-200 -mx-2.5 px-2.5 py-1 rounded ${isSelected ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'}`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            // Only allow expanding if this lab is selected
                                            if (!isSelected) {
                                              toast.error('Please select this laboratory first to view tests')
                                              return
                                            }
                                            const newExpandedId = isExpanded ? null : lab.labId
                                            setExpandedLabId(newExpandedId)
                                            if (!newExpandedId) {
                                              setExpandedLabSearch('') // Clear search when collapsing
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-1">
                                            <IoFlaskOutline className="h-3 w-3 text-blue-600 shrink-0" />
                                            <span className="font-semibold text-blue-700">
                                              {lab.tests.length} {lab.tests.length === 1 ? 'test' : 'tests'}
                                            </span>
                                          </div>
                                          <IoChevronDownOutline
                                            className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded Tests Section - Only show if this lab is selected */}
                                  {isExpanded && isSelected && lab.tests && lab.tests.length > 0 && (
                                    <div className="border-t border-slate-200 bg-slate-50 p-2">
                                      {/* Search Input */}
                                      <div className="mb-2">
                                        <div className="relative">
                                          <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                                          <input
                                            type="text"
                                            value={expandedLabId === lab.labId ? expandedLabSearch : ''}
                                            onChange={(e) => {
                                              if (expandedLabId === lab.labId) {
                                                setExpandedLabSearch(e.target.value)
                                              }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Search test name..."
                                            className="w-full rounded border border-slate-300 bg-white pl-7 pr-2 py-1 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                                          />
                                        </div>
                                      </div>

                                      {/* Tests List */}
                                      <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {(() => {
                                          const filteredTests = lab.tests.filter((test) => {
                                            if (expandedLabId !== lab.labId || !expandedLabSearch) return true
                                            const searchTerm = expandedLabSearch.toLowerCase()
                                            return test.name?.toLowerCase().includes(searchTerm)
                                          })

                                          if (filteredTests.length === 0) {
                                            return (
                                              <div className="p-2 text-center text-[10px] text-slate-500">
                                                {expandedLabSearch ? 'No tests found matching your search' : 'No tests available in this laboratory'}
                                              </div>
                                            )
                                          }

                                          return filteredTests.map((test, idx) => {
                                            const isTestSelected = selectedTestsFromLab.some(
                                              item => item.test.name === test.name && item.labId === lab.labId
                                            )

                                            return (
                                              <div
                                                key={idx}
                                                className={`rounded border p-2 text-[10px] transition ${isTestSelected
                                                  ? 'border-[#11496c] bg-blue-50'
                                                  : 'border-slate-200 bg-white hover:border-slate-300'
                                                  }`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleAddTestFromLab(test, lab.labId, lab.labName)
                                                        }}
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${isTestSelected
                                                          ? 'border-[#11496c] bg-[#11496c] text-white'
                                                          : 'border-slate-300 bg-white text-slate-600 hover:border-[#11496c] hover:text-[#11496c]'
                                                          }`}
                                                      >
                                                        {isTestSelected ? (
                                                          <IoCheckmarkCircleOutline className="h-3 w-3" />
                                                        ) : (
                                                          <IoAddOutline className="h-3 w-3" />
                                                        )}
                                                      </button>
                                                      <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900">
                                                          {test.name}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-600 ml-6">
                                                      {test.price && (
                                                        <span className="font-semibold text-[#11496c]">
                                                          ₹{test.price}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Tests Summary */}
                  {selectedTestsFromLab.length > 0 && (
                    <div className="mt-3 rounded-lg border-2 border-[#11496c] bg-blue-50 p-2.5">
                      <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                        <IoFlaskOutline className="h-3.5 w-3.5" />
                        Selected Tests
                      </h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedTestsFromLab.map((item, idx) => (
                          <div key={idx} className="rounded border border-blue-200 bg-white p-1.5 text-[10px]">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {item.test.name}
                                </p>
                                <p className="text-slate-600">
                                  {item.labName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#11496c]">
                                  ₹{(Number(item.price) || 0).toFixed(2)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTestsFromLab(selectedTestsFromLab.filter((_, i) => i !== idx))
                                  }}
                                  className="mt-0.5 text-red-600 hover:text-red-700"
                                  title="Remove"
                                >
                                  <IoTrashOutline className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between bg-blue-100 p-2 rounded">
                        <span className="text-sm font-bold text-slate-900">Total Calculation:</span>
                        <span className="text-lg font-extrabold text-[#11496c]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}



              {/* Admin Response Display - If already responded */}
              {hasBillGeneratedForRequest(selectedRequest) && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoCheckmarkCircleOutline className="h-3.5 w-3.5 text-green-600" />
                    Bill Generated
                  </h3>
                  <p className="text-xs text-slate-700 mb-1.5">{selectedRequest.adminResponse.message || 'Bill has been generated successfully.'}</p>

                  {/* Show selected labs - with fallback to selectedLabs if adminResponse doesn't have it */}
                  {(() => {
                    const labsToShow = (selectedRequest.adminResponse.labs && selectedRequest.adminResponse.labs.length > 0)
                      ? selectedRequest.adminResponse.labs
                      : (selectedLabs.length > 0
                        ? selectedLabs.map(l => ({
                          name: l.labName || l.name,
                          id: l.labId || l.id,
                        }))
                        : [])

                    if (labsToShow.length > 0) {
                      return (
                        <div className="mt-2 mb-2">
                          <p className="text-[10px] font-semibold text-slate-600 mb-1">Selected Laboratories:</p>
                          <div className="space-y-1">
                            {labsToShow.map((lab, idx) => {
                              const labId = lab.id || lab.labId || lab._id
                              const matchedLab = labs.find(l =>
                                l.labId === labId || l._id === labId || l.id === labId
                              )
                              const displayName = lab.name || lab.labName || matchedLab?.labName || matchedLab?.name || 'Laboratory'
                              const displayId = labId || matchedLab?.labId || matchedLab?._id || matchedLab?.id

                              return (
                                <div key={idx} className="flex items-center gap-1.5 bg-white rounded px-2 py-1.5 border border-green-100 shadow-sm">
                                  <IoFlaskOutline className="h-3 w-3 text-green-600" />
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] font-bold text-slate-800">{displayName}</span>
                                    {displayId && (
                                      <span className="text-[10px] text-slate-500 break-all">ID: {displayId}</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}


                  {/* Show selected tests/investigations - with fallback to selectedTestsFromLab if adminResponse doesn't have it */}
                  {(() => {
                    const testsToShow = selectedRequest.adminResponse.investigations && selectedRequest.adminResponse.investigations.length > 0
                      ? selectedRequest.adminResponse.investigations
                      : (activeSection === 'lab' && selectedTestsFromLab.length > 0 ? selectedTestsFromLab.map(item => ({ name: item.test.name, price: item.price })) : [])

                    if (testsToShow.length > 0) {
                      return (
                        <div className="mt-2 mb-2">
                          <p className="text-[10px] font-semibold text-slate-600 mb-1">Selected Tests:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {testsToShow.map((test, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white rounded px-2 py-1 text-[10px]">
                                <span className="text-slate-700">{test.name}</span>
                                <span className="font-semibold text-[#11496c]">₹{Number(test.price || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Show selected medicines grouped by pharmacy */}
                  {(() => {
                    // Get medicines with pharmacy info
                    const medicinesToShow = selectedRequest.adminResponse.medicines && selectedRequest.adminResponse.medicines.length > 0
                      ? selectedRequest.adminResponse.medicines.map(med => ({
                        name: med.name,
                        dosage: med.dosage,
                        quantity: med.quantity,
                        price: med.price,
                        pharmacyId: med.pharmacyId || '',
                        pharmacyName: med.pharmacyName || ''
                      }))
                      : (activeSection === 'pharmacy' && selectedMedicinesFromPharmacy.length > 0 ? selectedMedicinesFromPharmacy.map(item => ({
                        name: item.medicine.name,
                        dosage: item.medicine.dosage,
                        quantity: item.quantity,
                        price: item.price,
                        pharmacyId: item.pharmacyId || '',
                        pharmacyName: item.pharmacyName || ''
                      })) : [])

                    if (medicinesToShow.length > 0) {
                      // Get unique pharmacies - try to match with pharmacies list first
                      const pharmaciesMap = new Map()
                      const pharmaciesList = selectedRequest.adminResponse.pharmacies || []
                      
                      medicinesToShow.forEach(med => {
                        // Try to find pharmacy name from pharmacies list
                        let pharmId = med.pharmacyId || ''
                        let pharmName = med.pharmacyName || ''
                        
                        // If no pharmacy info in medicine, try to find from pharmacies list
                        if (!pharmId && pharmaciesList.length > 0) {
                          // If only one pharmacy, assign to it
                          if (pharmaciesList.length === 1) {
                            pharmId = pharmaciesList[0].id || pharmaciesList[0].pharmacyId || 'unknown'
                            pharmName = pharmaciesList[0].name || pharmaciesList[0].pharmacyName || 'Unknown Pharmacy'
                          } else {
                            // Multiple pharmacies - use 'unknown' as fallback
                            pharmId = 'unknown'
                            pharmName = 'Unknown Pharmacy'
                          }
                        }
                        
                        // Use pharmacy name from list if available
                        if (pharmId && pharmaciesList.length > 0) {
                          const matchedPharm = pharmaciesList.find(p => 
                            (p.id || p.pharmacyId) === pharmId
                          )
                          if (matchedPharm) {
                            pharmName = matchedPharm.name || matchedPharm.pharmacyName || pharmName
                          }
                        }
                        
                        if (!pharmId) pharmId = 'unknown'
                        if (!pharmName) pharmName = 'Unknown Pharmacy'
                        
                        if (!pharmaciesMap.has(pharmId)) {
                          pharmaciesMap.set(pharmId, {
                            id: pharmId,
                            name: pharmName,
                            medicines: []
                          })
                        }
                        pharmaciesMap.get(pharmId).medicines.push(med)
                      })

                      const groupedPharmacies = Array.from(pharmaciesMap.values())
                      let calculatedGrandTotal = 0

                      return (
                        <div className="mt-2 mb-2">
                          <p className="text-[10px] font-semibold text-slate-600 mb-2">Selected Medicines:</p>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {groupedPharmacies.map((pharmacy, pharmIdx) => {
                              const pharmacySubtotal = pharmacy.medicines.reduce((sum, med) => {
                                return sum + ((Number(med.price) || 0) * (Number(med.quantity) || 1))
                              }, 0)
                              calculatedGrandTotal += pharmacySubtotal

                              return (
                                <div key={pharmIdx} className="rounded-lg border border-green-200 bg-white p-2">
                                  {/* Pharmacy Header */}
                                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-green-100">
                                    <h4 className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                                      <IoBagHandleOutline className="h-3.5 w-3.5 text-green-600" />
                                      {pharmacy.name}
                                    </h4>
                                    <span className="text-[10px] font-semibold text-green-700">
                                      Subtotal: ₹{pharmacySubtotal.toFixed(2)}
                                    </span>
                                  </div>
                                  
                                  {/* Medicines under this pharmacy */}
                                  <div className="space-y-1">
                                    {pharmacy.medicines.map((med, medIdx) => (
                                      <div key={medIdx} className="flex items-center justify-between bg-green-50 rounded px-2 py-1 text-[10px]">
                                <div className="flex-1 min-w-0">
                                          <span className="text-slate-700 font-medium">{med.name}</span>
                                  {med.dosage && <span className="text-slate-500 ml-1">({med.dosage})</span>}
                                  {med.quantity && <span className="text-slate-500 ml-1">x{med.quantity}</span>}
                                </div>
                                <span className="font-semibold text-[#11496c]">₹{((Number(med.price) || 0) * (Number(med.quantity) || 1)).toFixed(2)}</span>
                              </div>
                            ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="mt-2 pt-2 border-t border-green-300 flex items-center justify-between bg-green-100 p-2 rounded">
                    <span className="text-sm font-bold text-slate-900">Total Calculation:</span>
                    <span className="text-lg font-extrabold text-green-700">₹{Number(selectedRequest.adminResponse.totalAmount || totalAmount || 0).toFixed(2)}</span>
                  </div>

                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                    {selectedRequest.adminResponse.pharmacies && selectedRequest.adminResponse.pharmacies.length > 0 && (
                      <p>Pharmacies: {selectedRequest.adminResponse.pharmacies.map(p => p.name).join(', ')}</p>
                    )}
                    {selectedRequest.adminResponse.pharmacy?.name && (
                      <p>Pharmacy: {selectedRequest.adminResponse.pharmacy.name}</p>
                    )}
                    {selectedRequest.adminResponse.lab?.name && (
                      <p>Lab: {selectedRequest.adminResponse.lab.name}</p>
                    )}
                    {selectedRequest.adminResponse.respondedAt && (
                      <p>Sent: {formatDate(selectedRequest.adminResponse.respondedAt)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Confirmation Display */}
              {selectedRequest.paymentConfirmed && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoCheckmarkCircleOutline className="h-3.5 w-3.5 text-emerald-600" />
                    Payment Confirmed
                  </h3>
                  <p className="text-xs text-slate-700 mb-1.5">
                    {selectedRequest.confirmationMessage || `Payment confirmed! Order has been created for patient ${selectedRequest.patientName || 'Patient'}.`}
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                    {selectedRequest.paidAt && (
                      <p>Paid At: {formatDate(selectedRequest.paidAt)}</p>
                    )}
                    <p>Total Amount: ₹{selectedRequest.adminResponse?.totalAmount || selectedRequest.totalAmount || 0}</p>
                  </div>
                </div>
              )}

              {/* Cancellation Display */}
              {selectedRequest.status === 'cancelled' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoCloseCircleOutline className="h-3.5 w-3.5 text-red-600" />
                    {selectedRequest.cancelledBy === 'patient' ? 'Cancelled by Patient' : 'Cancelled'}
                  </h3>
                  {selectedRequest.cancelReason && (
                    <p className="text-xs text-slate-700 mb-1.5">{selectedRequest.cancelReason}</p>
                  )}
                  {selectedRequest.cancellationMessage && (
                    <p className="text-xs text-slate-700 mb-1.5">{selectedRequest.cancellationMessage}</p>
                  )}
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                    {selectedRequest.cancelledAt && (
                      <p>Cancelled At: {formatDate(selectedRequest.cancelledAt)}</p>
                    )}
                  </div>
                </div>
              )}


            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null)
                    setShowPharmacyDropdown(false)
                    setShowLabDropdown(false)
                    setSelectedPharmacy(null)
                    setSelectedLab(null)
                    setSelectedPharmacies([])
                    setSelectedLabs([])
                    setAdminMedicines([])
                    setAdminResponse('')
                    setTotalAmount(0)
                    setSelectedMedicinesFromPharmacy([])
                    setSelectedTestsFromLab([])
                    setExpandedPharmacyId(null)
                    setExpandedPharmacySearch('')
                    setExpandedLabId(null)
                    setExpandedLabSearch('')
                    setLabTestSearch('')
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'confirmed' && !selectedRequest.paymentConfirmed && (
                  <button
                    type="button"
                    onClick={handleSendResponse}
                    disabled={isSendingResponse || hasBillGeneratedForRequest(selectedRequest)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={hasBillGeneratedForRequest(selectedRequest) ? 'Bill already generated' : 'Generate Bill'}
                  >
                    {hasBillGeneratedForRequest(selectedRequest) ? (
                      <>
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                        Bill Generated
                      </>
                    ) : isSendingResponse ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                        Generate Bill
                      </>
                    )}
                  </button>
                )}
                {/* Assign Order Button - Show when payment is confirmed */}
                {selectedRequest.paymentConfirmed && selectedRequest.readyForAssignment && (
                  <button
                    type="button"
                    onClick={() => {
                      // Open the same modal but in assignment mode
                      setSelectedRequest(selectedRequest)
                      // Reset selections to allow admin to assign
                      setSelectedPharmacies([])
                      setSelectedLabs([])
                      setSelectedMedicinesFromPharmacy([])
                      setSelectedTestsFromLab([])
                      setTotalAmount(0)
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                    Assign Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && requestToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCancelModal(false)
              setCancelReason('')
              setRequestToCancel(null)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reject Request</h2>
                <p className="text-xs text-slate-600">Please provide a reason for rejecting this request</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setRequestToCancel(null)
                }}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancelling this request..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-1">Patient:</p>
                <p className="text-xs text-slate-900">{requestToCancel.patientName || 'N/A'}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2 mb-1">Doctor:</p>
                <p className="text-xs text-slate-900">{requestToCancel.prescription?.doctorName || 'N/A'}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setRequestToCancel(null)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoCloseCircleOutline className="h-3.5 w-3.5" />
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRequests

