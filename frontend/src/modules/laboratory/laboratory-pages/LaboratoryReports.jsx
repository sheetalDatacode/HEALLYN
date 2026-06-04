import { useState, useMemo, useEffect } from 'react'
import {
  IoSearchOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoFlaskOutline,
  IoShareSocialOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoMailOutline,
} from 'react-icons/io5'
import { getLaboratoryReports, shareLaboratoryReport } from '../laboratory-services/laboratoryService'
import { getFileUrl } from '../../../utils/apiClient'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
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

const LaboratoryReports = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [testReports, setTestReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const response = await getLaboratoryReports({ 
          page: currentPage, 
          limit: itemsPerPage 
        })

        if (response.success && response.data) {
          const reportsData = Array.isArray(response.data)
            ? response.data
            : response.data.items || response.data.reports || []
          
          const pagination = response.data.pagination || {}

          const transformed = reportsData.map(report => ({
            id: report._id || report.id,
            orderId: report.orderId?._id || report.orderId?.id || report.orderId || '',
            patientId: report.patientId?._id || report.patientId?.id || report.patientId || '',
            patientName: report.patientId?.firstName && report.patientId?.lastName
              ? `${report.patientId.firstName} ${report.patientId.lastName}`
              : report.patientId?.name || report.patientName || 'Unknown Patient',
            patientEmail: report.patientId?.email || report.patientEmail || '',
            patientPhone: report.patientId?.phone || report.patientPhone || '',
            testName: report.testName || report.test?.name || 'Test Report',
            status: report.status || 'completed',
            completedDate: report.completedDate || report.createdAt || new Date().toISOString(),
            results: report.results || {},
            sharedWithPatient: report.sharedWithPatient || false,
            sharedDate: report.sharedDate || null,
          }))

          setTestReports(transformed)
          setTotalPages(pagination.totalPages || Math.ceil((pagination.total || transformed.length) / itemsPerPage) || 1)
          setTotalItems(pagination.total || transformed.length)
        } else {
          setTestReports([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
        toast.error('Failed to load reports')
        setTestReports([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [toast, currentPage])

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return testReports

    const normalizedSearch = searchTerm.trim().toLowerCase()
    return testReports.filter(
      (report) =>
        report.patientName.toLowerCase().includes(normalizedSearch) ||
        report.testName.toLowerCase().includes(normalizedSearch) ||
        report.orderId.toLowerCase().includes(normalizedSearch)
    )
  }, [searchTerm, testReports])

  const handleShareReport = async (report) => {
    if (!window.confirm(`Share test report with ${report.patientName}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      await shareLaboratoryReport(report.id)

      setTestReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, sharedWithPatient: true, sharedDate: new Date().toISOString() }
            : r
        )
      )

      toast.success(`Test report shared with ${report.patientName} successfully!`)
    } catch (error) {
      console.error('Error sharing report:', error)
      toast.error(error.message || 'Failed to share report')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadReport = (report) => {
    // Open PDF for test report
    const pdfUrl = report.pdfFileUrl || report.fileUrl || report.url
    if (pdfUrl) {
      window.open(getFileUrl(pdfUrl), '_blank')
    } else {
      toast.error('Report PDF not found')
    }
  }

  const handleViewReport = (report) => {
    setSelectedReport(report)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, test name, or order ID..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Test Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
            No test reports found matching your search.
          </p>
        ) : (
          filteredReports.map((report) => (
            <article
              key={report.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
            >
              {/* Report Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                    <IoFlaskOutline className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{report.testName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Order ID: {report.orderId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <IoPersonOutline className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-600">{report.patientName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <IoCheckmarkCircleOutline className="h-3 w-3" />
                    Completed
                  </span>
                  {report.sharedWithPatient && (
                    <span className="text-[10px] text-emerald-600 font-medium">Shared</span>
                  )}
                </div>
              </div>

              {/* Completion Date */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IoCalendarOutline className="h-3 w-3" />
                <span>Completed: {formatDate(report.completedDate)}</span>
                {report.sharedWithPatient && report.sharedDate && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Shared: {formatDate(report.sharedDate)}</span>
                  </>
                )}
              </div>

              {/* Test Results Preview */}
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Results Preview</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(report.results).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Share with Patient Button */}
                {!report.sharedWithPatient ? (
                  <button
                    onClick={() => handleShareReport(report)}
                    disabled={isProcessing}
                    className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-400/40 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IoShareSocialOutline className="mr-1 inline h-4 w-4" />
                    Share with Patient
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
                  >
                    <IoCheckmarkCircleOutline className="mr-1 inline h-4 w-4" />
                    Already Shared
                  </button>
                )}

                {/* Download and View (icon only) */}
                <button
                  onClick={() => handleDownloadReport(report)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                  aria-label="Download Report"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleViewReport(report)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  aria-label="View Report"
                >
                  <IoEyeOutline className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
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
            loading={loading}
          />
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Test Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Patient Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Patient Information
                </h4>
                <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-lg">
                  <p><span className="font-medium">Name:</span> {selectedReport.patientName}</p>
                  <p><span className="font-medium">Email:</span> {selectedReport.patientEmail}</p>
                  <p><span className="font-medium">Phone:</span> {selectedReport.patientPhone}</p>
                  <p><span className="font-medium">Order ID:</span> {selectedReport.orderId}</p>
                </div>
              </div>

              {/* Test Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoFlaskOutline className="h-4 w-4" />
                  Test Information
                </h4>
                <div className="space-y-1 text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="font-medium text-orange-900">{selectedReport.testName}</p>
                  <p className="text-xs text-orange-700">Completed: {formatDateTime(selectedReport.completedDate)}</p>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Test Results</h4>
                <div className="space-y-2">
                  {Object.entries(selectedReport.results).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share Status */}
              {selectedReport.sharedWithPatient && (
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Report Status</p>
                  <p className="text-sm text-emerald-900">
                    ✓ Shared with patient on {formatDateTime(selectedReport.sharedDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryReports

