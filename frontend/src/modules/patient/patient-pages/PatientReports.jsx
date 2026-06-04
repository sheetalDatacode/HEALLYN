import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoShareSocialOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoFlaskOutline,
  IoMedicalOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { getPatientReports, downloadReport, shareLabReport } from '../patient-services/patientService'
import { getFileUrl } from '../../../utils/apiClient'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Default reports (will be replaced by API data)
const defaultReports = []

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

const PatientReports = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [reports, setReports] = useState(defaultReports)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientReports()

        if (response.success && response.data) {
          const reportsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || []

          const transformed = reportsData.map(report => ({
            id: report._id || report.id,
            _id: report._id || report.id,
            testName: report.testName || report.test?.name || 'Lab Test',
            labName: report.laboratoryId?.labName || report.labName || 'Laboratory',
            labId: report.laboratoryId?._id || report.laboratoryId || report.labId,
            date: report.createdAt || report.date || new Date().toISOString().split('T')[0],
            status: report.status || 'ready',
            downloadUrl: report.pdfFileUrl || '#',
            pdfFileUrl: report.pdfFileUrl || null,
            pdfFileName: report.pdfFileName || `${report.testName || 'Report'}_${new Date(report.createdAt || Date.now()).toISOString().split('T')[0]}.pdf`,
            doctorId: report.doctorId || null,
            doctorName: report.doctorId?.name || null,
            doctorSpecialty: report.doctorId?.specialty || null,
            doctorImage: report.doctorId?.image || null,
            originalData: report,
          }))

          setReports(transformed)
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
        setError(err.message || 'Failed to load reports')
        toast.error('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [toast])

  // Calculate paginated reports
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return reports.slice(startIndex, endIndex)
  }, [reports, currentPage])

  const totalPages = Math.ceil(reports.length / itemsPerPage)
  const totalItems = reports.length

  // Get doctors for sharing (using discovery API)
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { getDiscoveryDoctors } = await import('../patient-services/patientService')
        const response = await getDiscoveryDoctors()
        if (response.success && response.data) {
          const doctorsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || []
          const transformed = doctorsData.map(doctor => ({
            id: doctor._id || doctor.id,
            name: doctor.firstName && doctor.lastName
              ? `Dr. ${doctor.firstName} ${doctor.lastName}`
              : doctor.name || 'Dr. Unknown',
            specialty: doctor.specialization || doctor.specialty || 'General',
            image: doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
          }))
          setDoctors(transformed)
        }
      } catch (err) {
        console.error('Error fetching doctors for sharing:', err)
      }
    }
    fetchDoctors()
  }, [])

  // Doctors list loaded from API - no mock data

  const [selectedDoctorId, setSelectedDoctorId] = useState(null)

  const handleViewClick = (report) => {
    // Open the lab-uploaded PDF in a new tab
    if (report.pdfFileUrl && report.pdfFileUrl !== '#') {
      window.open(getFileUrl(report.pdfFileUrl), '_blank')
    } else {
      // Fallback: show modal if PDF not available
      setSelectedReport(report)
      setShowViewModal(true)
    }
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedReport(null)
  }

  const handleShareClick = (report) => {
    setSelectedReport(report)
    setSelectedDoctorId(null)
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
    setSelectedReport(null)
    setSelectedDoctorId(null)
  }

  const handleShareWithDoctor = async () => {
    if (!selectedReport || !selectedDoctorId) return

    setIsSharing(true)

    try {
      const selectedDoctor = doctors.find(doc => (doc.id || doc._id) === selectedDoctorId)
      const reportId = selectedReport._id || selectedReport.id
      const doctorId = selectedDoctorId

      // Try to find consultation ID if patient has appointment with this doctor
      let consultationId = null
      try {
        const { getPatientAppointments } = await import('../patient-services/patientService')
        const appointmentsResponse = await getPatientAppointments({ doctor: doctorId, status: 'completed' })
        if (appointmentsResponse.success && appointmentsResponse.data) {
          const appointments = Array.isArray(appointmentsResponse.data)
            ? appointmentsResponse.data
            : appointmentsResponse.data.items || []
          // Get the most recent completed appointment
          const recentAppointment = appointments
            .filter(apt => {
              const aptDoctorId = apt.doctorId?._id || apt.doctorId?.id || apt.doctorId
              return aptDoctorId === doctorId && (apt.status === 'completed' || apt.status === 'visited')
            })
            .sort((a, b) => {
              const dateA = new Date(a.appointmentDate || a.createdAt || 0)
              const dateB = new Date(b.appointmentDate || b.createdAt || 0)
              return dateB - dateA
            })[0]

          if (recentAppointment?.consultationId) {
            consultationId = recentAppointment.consultationId._id || recentAppointment.consultationId
          }
        }
      } catch (error) {
        console.error('Error fetching consultation ID:', error)
        // Continue without consultationId
      }

      // Share report via API
      const response = await shareLabReport(reportId, doctorId, consultationId)

      if (response.success) {
        toast.success(`Report shared successfully with ${selectedDoctor?.name || 'doctor'}`)
        handleCloseShareModal()

        // Refresh reports to get updated shared status
        const reportsResponse = await getPatientReports()
        if (reportsResponse.success && reportsResponse.data) {
          const reportsData = Array.isArray(reportsResponse.data)
            ? reportsResponse.data
            : reportsResponse.data.items || []

          const transformed = reportsData.map(report => ({
            id: report._id || report.id,
            _id: report._id || report.id,
            testName: report.testName || report.test?.name || 'Lab Test',
            labName: report.laboratoryId?.labName || report.labName || 'Laboratory',
            labId: report.laboratoryId?._id || report.laboratoryId || report.labId,
            date: report.createdAt || report.date || new Date().toISOString().split('T')[0],
            status: report.status || 'ready',
            downloadUrl: report.pdfFileUrl || '#',
            pdfFileUrl: report.pdfFileUrl || null,
            pdfFileName: report.pdfFileName || `${report.testName || 'Report'}_${new Date(report.createdAt || Date.now()).toISOString().split('T')[0]}.pdf`,
            doctorId: report.doctorId || null,
            doctorName: report.doctorId?.name || null,
            doctorSpecialty: report.doctorId?.specialty || null,
            doctorImage: report.doctorId?.image || null,
            originalData: report,
          }))

          setReports(transformed)
        }
      } else {
        toast.error(response.message || 'Failed to share report. Please try again.')
      }
    } catch (error) {
      console.error('Error sharing report:', error)
      toast.error(error.message || 'Failed to share report. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async (report) => {
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

        // Try to fetch the PDF file (works for same-origin or CORS-enabled servers)
        try {
          const response = await fetch(getFileUrl(report.pdfFileUrl), {
            method: 'GET',
            mode: 'cors',
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
          // If fetch fails due to CORS, use direct link approach
          console.warn('Fetch failed, trying direct link:', fetchError)
        }

        // Fallback: Use direct link (browser will handle download if server allows)
        // This works for same-origin or servers that allow direct downloads
        const link = document.createElement('a')
        link.href = report.pdfFileUrl
        link.download = report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Note: For cross-origin PDFs that don't allow CORS, the browser will open in new tab
        // In production, use a backend proxy endpoint to download the PDF
      } catch (error) {
        console.error('Error downloading PDF:', error)
        // Last resort: open in new tab
        window.open(getFileUrl(report.pdfFileUrl), '_blank')
      }
      return
    }

    // Fallback: Generate and download PDF report if no PDF file URL
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Medical Report - ${report.testName}</title>
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
    <h1>Medical Test Report</h1>
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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
            aria-label="Go back"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">Lab Reports</h1>
            <p className="text-xs text-slate-600">Share reports with your doctors</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-slate-600">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-red-600">Error: {error}</p>
            <p className="mt-1 text-xs text-red-500">Please try again later.</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No reports found</p>
            <p className="mt-1 text-xs text-slate-500">No lab reports available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedReports.map((report) => (
              <article
                key={report.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md flex flex-col min-h-[180px]"
              >
                {/* Header Section */}
                <div className="flex items-start gap-4 p-5 pb-4 flex-1 min-h-[120px]">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{
                      background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                      boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
                    }}>
                    <IoFlaskOutline className="h-8 w-8" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">{report.testName}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-1">{report.labName}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <IoTimeOutline className="h-3.5 w-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(report.date)}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                  <button
                    type="button"
                    onClick={() => handleDownload(report)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98]"
                  >
                    <IoDownloadOutline className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewClick(report)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-95"
                    aria-label="View report"
                  >
                    <IoEyeOutline className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareClick(report)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-[rgba(17,73,108,0.4)] hover:bg-[rgba(17,73,108,0.1)] hover:text-[#11496c] hover:shadow active:scale-95"
                    aria-label="Share with doctor"
                  >
                    <IoShareSocialOutline className="h-5 w-5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && reports.length > 0 && totalPages > 1 && (
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

      {/* Share Modal */}
      {showShareModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Share Report with Doctor</h2>
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Report:</p>
                <p className="text-sm text-slate-600">{selectedReport.testName}</p>
              </div>

              {/* Associated Doctor - Direct Share */}
              {selectedReport.doctorId && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Your Appointed Doctor (Direct Share):</p>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorId(selectedReport.doctorId)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all ${selectedDoctorId === selectedReport.doctorId
                        ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedReport.doctorImage}
                        alt={selectedReport.doctorName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{selectedReport.doctorName}</h3>
                        <p className="text-xs text-slate-600">{selectedReport.doctorSpecialty}</p>
                      </div>
                      {selectedDoctorId === selectedReport.doctorId && (
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (appointment already booked)</p>
                  </button>
                </div>
              )}

              {/* Other Doctors - Requires Booking */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Other Doctors {selectedReport.doctorId && '(Requires Booking)'}:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {doctors.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No doctors available. Please try again later.</p>
                  ) : (
                    doctors
                      .filter((doc) => !selectedReport.doctorId || doc.id !== selectedReport.doctorId)
                      .map((doctor) => (
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => setSelectedDoctorId(doctor.id)}
                          className={`w-full rounded-xl border-2 p-3 text-left transition-all ${selectedDoctorId === doctor.id
                              ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={doctor.image}
                              alt={doctor.name}
                              className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                              <p className="text-xs text-slate-600">{doctor.specialty}</p>
                            </div>
                            {selectedDoctorId === doctor.id && (
                              <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-amber-600">⚠ Requires booking appointment</p>
                        </button>
                      ))
                  )}
                </div>
              </div>

              {selectedDoctorId && (
                <div className="mt-4 rounded-lg bg-[rgba(17,73,108,0.1)] p-3">
                  <p className="text-xs text-[#0a2d3f]">
                    {selectedReport.doctorId && selectedDoctorId === selectedReport.doctorId ? (
                      <>
                        <strong>Direct Share:</strong> Report will be shared immediately with {selectedReport.doctorName}.
                      </>
                    ) : (
                      <>
                        <strong>Note:</strong> To share with this doctor, you'll need to book an appointment first. The booking page will open after sharing.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareWithDoctor}
                disabled={isSharing || !selectedDoctorId}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <IoShareSocialOutline className="h-4 w-4" />
                    {selectedReport.doctorId && selectedDoctorId === selectedReport.doctorId
                      ? 'Share Now'
                      : 'Share & Book'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Report Details</h2>
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Report Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                    boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
                  }}>
                  <IoFlaskOutline className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{selectedReport.testName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedReport.labName}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <IoTimeOutline className="h-3.5 w-3.5" />
                      <span>{formatDate(selectedReport.date)}</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      {selectedReport.status === 'ready' ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Information */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Report Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Report ID:</span>
                      <span className="text-xs font-semibold text-slate-900">{selectedReport.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Test Name:</span>
                      <span className="text-xs font-semibold text-slate-900">{selectedReport.testName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Laboratory:</span>
                      <span className="text-xs font-semibold text-slate-900">{selectedReport.labName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Report Date:</span>
                      <span className="text-xs font-semibold text-slate-900">{formatDate(selectedReport.date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Status:</span>
                      <span className="text-xs font-semibold text-emerald-700">
                        {selectedReport.status === 'ready' ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Associated Doctor Info */}
                {selectedReport.doctorName && (
                  <div className="rounded-2xl border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.1)]/50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Associated Doctor</h4>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedReport.doctorImage}
                        alt={selectedReport.doctorName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-[rgba(17,73,108,0.2)]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{selectedReport.doctorName}</p>
                        <p className="text-xs text-slate-600">{selectedReport.doctorSpecialty}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCloseViewModal()
                  handleDownload(selectedReport)
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
    </div>
  )
}

export default PatientReports

