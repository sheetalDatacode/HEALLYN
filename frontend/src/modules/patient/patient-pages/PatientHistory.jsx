import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoDocumentTextOutline,
  IoBagHandleOutline,
  IoFlaskOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoArchiveOutline,
} from 'react-icons/io5'
import { getPatientHistory } from '../patient-services/patientService'
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
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PatientHistory = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('all') // all, prescription, lab_test, order, appointment
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch history from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientHistory({ limit: 100 })
        
        if (response.success && response.data) {
          const allHistory = []
          
          // Transform prescriptions
          if (response.data.prescriptions?.items) {
            response.data.prescriptions.items.forEach(presc => {
              allHistory.push({
                id: presc._id || presc.id,
                type: 'prescription',
                doctor: {
                  name: presc.doctorId ? `Dr. ${presc.doctorId.firstName} ${presc.doctorId.lastName}` : 'Unknown Doctor',
                  specialty: presc.doctorId?.specialization || '',
                  image: presc.doctorId?.profileImage || '',
                },
                issuedAt: presc.createdAt || presc.issuedAt,
                status: presc.status || 'active',
                diagnosis: presc.diagnosis || '',
                medications: presc.medications || [],
                investigations: presc.investigations || [],
              })
            })
          }
          
          // Transform lab tests
          if (response.data.labTests?.items) {
            response.data.labTests.items.forEach(report => {
              allHistory.push({
                id: report._id || report.id,
                type: 'lab_test',
                labName: report.laboratoryId?.labName || 'Unknown Lab',
                testName: report.testName || 'Lab Test',
                status: report.status || 'completed',
                testDate: report.testDate || report.createdAt,
                resultDate: report.resultDate || report.createdAt,
                amount: report.amount || 0,
                results: report.results || 'Pending',
                reportUrl: report.reportUrl || report.pdfUrl || '#',
              })
            })
          }
          
          // Transform appointments
          if (response.data.appointments?.items) {
            response.data.appointments.items.forEach(apt => {
              allHistory.push({
                id: apt._id || apt.id,
                type: 'appointment',
                doctor: {
                  name: apt.doctorId ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}` : 'Unknown Doctor',
                  specialty: apt.doctorId?.specialization || '',
                  image: apt.doctorId?.profileImage || '',
                },
                clinic: apt.clinicName || apt.clinic || 'Clinic',
                date: apt.appointmentDate || apt.date,
                time: apt.time || '',
                status: apt.status || 'completed',
                consultationFee: apt.consultationFee || 0,
              })
            })
          }
          
          // Transform orders
          if (response.data.orders?.items) {
            response.data.orders.items.forEach(order => {
              const providerName = order.providerId?.pharmacyName || order.providerId?.labName || 'Provider'
              const itemNames = order.items?.map(item => item.name).join(', ') || 'Items'
              
              allHistory.push({
                id: order._id || order.id,
                type: 'order',
                orderType: order.providerType || 'pharmacy',
                providerName,
                itemName: itemNames,
                status: order.status || 'pending',
                amount: order.totalAmount || 0,
                date: order.createdAt || order.date,
                time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
              })
            })
          }
          
          // Sort by date (newest first)
          allHistory.sort((a, b) => {
            const dateA = new Date(a.date || a.testDate || a.issuedAt || 0)
            const dateB = new Date(b.date || b.testDate || b.issuedAt || 0)
            return dateB - dateA
          })
          
          setHistory(allHistory)
        }
      } catch (err) {
        console.error('Error fetching history:', err)
        setError(err.message || 'Failed to load history')
        toast.error('Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [toast])

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'prescription') return item.type === 'prescription'
    if (filter === 'lab_test') return item.type === 'lab_test'
    if (filter === 'order') return item.type === 'order'
    if (filter === 'appointment') return item.type === 'appointment'
    return true
  })

  // Calculate paginated history
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredHistory.slice(startIndex, endIndex)
  }, [filteredHistory, currentPage])

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const totalItems = filteredHistory.length

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'delivered':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      case 'pending':
        return <IoTimeOutline className="h-3 w-3" />
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3 w-3" />
      default:
        return null
    }
  }

  // Show current patient's history
  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 overflow-x-auto">
        {[
          { value: 'all', label: 'All' },
          { value: 'prescription', label: 'Prescriptions' },
          { value: 'lab_test', label: 'Lab Tests' },
          { value: 'order', label: 'Orders' },
          { value: 'appointment', label: 'Appointments' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === tab.value
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={filter === tab.value ? { backgroundColor: '#11496c' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoArchiveOutline className="mx-auto h-12 w-12 text-slate-400 animate-pulse" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading history...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center">
          <IoArchiveOutline className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-sm font-medium text-red-600">Error loading history</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoArchiveOutline className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No history found</p>
          <p className="mt-1 text-xs text-slate-500">Your {filter !== 'all' ? filter.replace('_', ' ') : 'medical'} history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedHistory.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }} />

              <div className="relative">
                {/* Prescription Card */}
                {item.type === 'prescription' && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoDocumentTextOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.doctor.name}</h3>
                          <p className="text-sm text-[#11496c] mb-1">{item.doctor.specialty}</p>
                          <p className="text-xs text-slate-600 mb-2">Diagnosis: {item.diagnosis}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>{formatDate(item.issuedAt)}</span>
                            </div>
                            {item.medications && item.medications.length > 0 && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span>{item.medications.length} medication(s)</span>
                              </>
                            )}
                            {item.investigations && item.investigations.length > 0 && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span>{item.investigations.length} test(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span>{item.status === 'active' ? 'Active' : 'Completed'}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/prescriptions`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lab Test Card */}
                {item.type === 'lab_test' && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.testName}</h3>
                          <p className="text-sm text-slate-600 mb-2">{item.labName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>Test: {formatDate(item.testDate)}</span>
                            </div>
                            {item.resultDate && (
                              <>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1">
                                  <IoTimeOutline className="h-3 w-3" />
                                  <span>Result: {formatDate(item.resultDate)}</span>
                                </div>
                              </>
                            )}
                            {item.amount && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                              </>
                            )}
                          </div>
                          {item.results && (
                            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1 inline-block">
                              <span className="font-semibold">Results:</span> {item.results}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/reports`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Report
                        </button>
                        {item.reportUrl && (
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <IoDownloadOutline className="h-3 w-3" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Card */}
                {item.type === 'order' && (
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      item.orderType === 'lab' 
                        ? 'bg-[rgba(17,73,108,0.1)]' 
                        : 'bg-orange-100'
                    }`}>
                      {item.orderType === 'lab' ? (
                        <IoFlaskOutline className={`h-6 w-6 ${item.orderType === 'lab' ? 'text-[#11496c]' : 'text-orange-600'}`} />
                      ) : (
                        <IoBagHandleOutline className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.itemName}</h3>
                          <p className="text-sm text-slate-600 mb-2">{item.providerName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            {item.time && (
                              <>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1">
                                  <IoTimeOutline className="h-3 w-3" />
                                  <span>{item.time}</span>
                                </div>
                              </>
                            )}
                            {item.amount && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/orders`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Card */}
                {item.type === 'appointment' && (
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={item.doctor.image}
                        alt={item.doctor.name}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100 bg-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.doctor.name}</h3>
                          <p className="text-sm text-[#11496c] mb-1">{item.doctor.specialty}</p>
                          <p className="text-xs text-slate-600 mb-2">{item.clinic}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            {item.time && (
                              <>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1">
                                  <IoTimeOutline className="h-3 w-3" />
                                  <span>{item.time}</span>
                                </div>
                              </>
                            )}
                            {item.consultationFee && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.consultationFee)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/appointments?appointment=${item.id}`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredHistory.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      )}
    </section>
  )
}

export default PatientHistory

