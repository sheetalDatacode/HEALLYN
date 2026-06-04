import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'
import {
  IoCalendarOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoPersonOutline,
  IoCloseCircleOutline,
  IoCloseOutline,
  IoRefreshOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'

// Default bookings (will be replaced by API data)
const defaultBookings = []

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timeString) => {
  return timeString || 'N/A'
}

// Map backend status to frontend display status
const mapBackendStatusToDisplay = (backendStatus) => {
  switch (backendStatus) {
    case 'scheduled':
      return 'pending'
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return backendStatus || 'pending'
  }
}

const getStatusColor = (status) => {
  const displayStatus = status === 'scheduled' ? 'pending' : status
  
  switch (displayStatus) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'no_show':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getTypeIcon = (type) => {
  return IoPersonOutline
}

const NurseBookings = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [bookings, setBookings] = useState(defaultBookings)
  const [statistics, setStatistics] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all') // 'today', 'monthly', 'yearly', 'all'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        // TODO: Import nurse bookings service when available
        // const response = await getNurseBookings({ 
        //   page: currentPage, 
        //   limit: itemsPerPage,
        //   period: filterPeriod !== 'all' ? filterPeriod : undefined,
        //   search: searchTerm || undefined
        // })
        // if (response && response.success && response.data) {
        //   const bookingsData = Array.isArray(response.data) 
        //     ? response.data 
        //     : response.data.items || response.data.bookings || []
        //   
        //   // Store statistics from backend if available
        //   if (response.data.statistics) {
        //     setStatistics(response.data.statistics)
        //   }
        //   
        //   // Extract pagination info
        //   const pagination = response.data.pagination || {}
        //   setTotalPages(pagination.totalPages || Math.ceil((pagination.total || bookingsData.length) / itemsPerPage) || 1)
        //   setTotalItems(pagination.total || bookingsData.length)
        //   
        //   // Transform API data to match component structure
        //   const transformed = bookingsData.map(booking => {
        //     const bookingDate = booking.appointmentDate || booking.date
        //     return {
        //       id: booking._id || booking.id,
        //       _id: booking._id || booking.id,
        //       patientId: booking.patientId?._id || booking.patientId?.id || booking.patientId || 'pat-unknown',
        //       patientName: booking.patientId?.firstName && booking.patientId?.lastName
        //         ? `${booking.patientId.firstName} ${booking.patientId.lastName}`
        //         : booking.patientId?.name || booking.patientName || 'Unknown Patient',
        //       patientImage: booking.patientId?.profileImage || booking.patientId?.image || booking.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
        //       date: bookingDate,
        //       bookingDate: bookingDate,
        //       time: booking.time || '',
        //       type: booking.appointmentType || booking.type || 'In-person',
        //       status: booking.status || 'scheduled',
        //       duration: booking.duration || '30 min',
        //       reason: booking.reason || booking.chiefComplaint || 'Consultation',
        //       appointmentType: booking.appointmentType || 'New',
        //       rescheduledAt: booking.rescheduledAt,
        //       rescheduledBy: booking.rescheduledBy,
        //       rescheduleReason: booking.rescheduleReason,
        //       isRescheduled: !!booking.rescheduledAt,
        //       originalData: booking,
        //     }
        //   })
        //   setBookings(transformed)
        // }
        setBookings([])
        setTotalPages(1)
        setTotalItems(0)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError(err.message || 'Failed to load bookings')
        toast.error('Failed to load bookings')
        setLoading(false)
      }
    }

    fetchBookings()
  }, [toast, currentPage, filterPeriod, searchTerm])

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterPeriod, searchTerm])

  // Calculate statistics
  const stats = useMemo(() => {
    if (statistics) {
      return {
        today: statistics.today || { total: 0, scheduled: 0, rescheduled: 0 },
        monthly: statistics.monthly || { total: 0, scheduled: 0, rescheduled: 0 },
        yearly: statistics.yearly || { total: 0, scheduled: 0, rescheduled: 0 },
        total: statistics.total || { total: 0, scheduled: 0, rescheduled: 0 },
      }
    }

    // Calculate from bookings if statistics not available
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    const calculateStats = (filterFn) => {
      const filtered = bookings.filter(filterFn)
      return {
        total: filtered.length,
        scheduled: filtered.filter(b => !b.isRescheduled).length,
        rescheduled: filtered.filter(b => b.isRescheduled).length,
      }
    }

    return {
      today: calculateStats((b) => {
        const bookingDate = new Date(b.date || b.bookingDate)
        return bookingDate >= today
      }),
      monthly: calculateStats((b) => {
        const bookingDate = new Date(b.date || b.bookingDate)
        return bookingDate >= thisMonth
      }),
      yearly: calculateStats((b) => {
        const bookingDate = new Date(b.date || b.bookingDate)
        return bookingDate >= thisYear
      }),
      total: calculateStats(() => true),
    }
  }, [bookings, statistics])

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        booking.patientName?.toLowerCase().includes(searchLower) ||
        booking.reason?.toLowerCase().includes(searchLower) ||
        booking.time?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const bookingDate = new Date(booking.date || booking.bookingDate)
      const now = new Date()
      
      if (filterPeriod === 'today') {
        return bookingDate.toDateString() === now.toDateString()
      } else if (filterPeriod === 'monthly') {
        return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()
      } else if (filterPeriod === 'yearly') {
        return bookingDate.getFullYear() === now.getFullYear()
      }
    }

    return true
  })

  return (
    <section className="flex flex-col gap-4 pb-24">
        {/* Statistics Cards - Clickable */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilterPeriod('today')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'today'
                ? 'border-[#11496c]/40 bg-[#11496c]/10 ring-2 ring-[#11496c]/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/10 group-hover:to-[#11496c]/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-[#11496c]/70 mb-1 group-hover:text-[#11496c] transition-colors">Today</p>
              <p className="text-xl font-bold text-[#11496c] group-hover:text-[#0d3a52] transition-colors duration-300">{stats.today?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-[#11496c]/80">Scheduled: {stats.today?.scheduled ?? 0}</span>
                <span className="text-[8px] text-[#11496c]/40">•</span>
                <span className="text-[8px] text-[#11496c]/80">Rescheduled: {stats.today?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('monthly')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'monthly'
                ? 'border-blue-400 bg-blue-100 ring-2 ring-blue-200'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-blue-700 mb-1 group-hover:text-blue-900 transition-colors">This Month</p>
              <p className="text-xl font-bold text-blue-900 group-hover:text-blue-950 transition-colors duration-300">{stats.monthly?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-blue-600">Scheduled: {stats.monthly?.scheduled ?? 0}</span>
                <span className="text-[8px] text-blue-400">•</span>
                <span className="text-[8px] text-blue-600">Rescheduled: {stats.monthly?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('yearly')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'yearly'
                ? 'border-emerald-400 bg-emerald-100 ring-2 ring-emerald-200'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-emerald-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1 group-hover:text-emerald-900 transition-colors">This Year</p>
              <p className="text-xl font-bold text-emerald-900 group-hover:text-emerald-950 transition-colors duration-300">{stats.yearly?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-emerald-600">Scheduled: {stats.yearly?.scheduled ?? 0}</span>
                <span className="text-[8px] text-emerald-400">•</span>
                <span className="text-[8px] text-emerald-600">Rescheduled: {stats.yearly?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('all')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'all'
                ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-200'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 to-slate-500/0 group-hover:from-slate-500/10 group-hover:to-slate-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-slate-600 mb-1 group-hover:text-slate-900 transition-colors">Total</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-slate-950 transition-colors duration-300">{stats.total?.total ?? 0}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-slate-600">Scheduled: {stats.total?.scheduled ?? 0}</span>
                <span className="text-[8px] text-slate-400">•</span>
                <span className="text-[8px] text-slate-600">Rescheduled: {stats.total?.rescheduled ?? 0}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by patient name, reason, or time..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Bookings List */}
        <div className="space-y-3 lg:grid lg:grid-cols-6 lg:gap-3 lg:space-y-0">
          {loading ? (
            <div className="lg:col-span-6 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
                <p className="mt-4 text-sm text-slate-600">Loading bookings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="lg:col-span-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
              <IoCloseCircleOutline className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-sm font-medium text-red-800">{error}</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No bookings found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const TypeIcon = getTypeIcon(booking.type)
              const patientImage = booking.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.patientName || 'Patient')}&background=3b82f6&color=fff&size=160`
              
              return (
                <div
                  key={booking.id || booking._id}
                  className="group relative overflow-hidden rounded-xl lg:rounded-lg border border-slate-200 bg-white p-2.5 lg:p-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#11496c]/30 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.01]"
                >
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                  
                  <div className="relative flex flex-col gap-1.5 lg:gap-1.5">
                    {/* Top Row: Image + Name + Status */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Patient Image */}
                        <div className="relative shrink-0">
                          <img
                            src={patientImage}
                            alt={booking.patientName}
                            className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg object-cover ring-2 ring-slate-100 group-hover:ring-[#11496c]/30 transition-all duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.patientName)}&background=3b82f6&color=fff&size=160`
                            }}
                          />
                          {booking.status === 'completed' && (
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white group-hover:scale-110 group-hover:ring-emerald-400 transition-all duration-300">
                              <IoCheckmarkCircleOutline className="h-1.5 w-1.5 text-white" />
                            </div>
                          )}
                          {(() => {
                            const displayStatus = mapBackendStatusToDisplay(booking.status)
                            if (displayStatus === 'pending' && !booking.isRescheduled) {
                              return (
                                <div className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 ring-2 ring-white group-hover:scale-110 group-hover:ring-yellow-400 transition-all duration-300" title="Pending">
                                  <IoTimeOutline className="h-1.5 w-1.5 text-white" />
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs lg:text-xs font-bold text-slate-900 truncate group-hover:text-[#11496c] transition-colors duration-300">{booking.patientName || 'Unknown Patient'}</h3>
                          <p className="text-[9px] lg:text-[9px] text-slate-600 truncate group-hover:text-slate-700 transition-colors">{booking.reason || 'Consultation'}</p>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(() => {
                          const displayStatus = mapBackendStatusToDisplay(booking.status)
                          if (displayStatus === 'pending' && !booking.isRescheduled) {
                            return null
                          }
                          return (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[8px] lg:text-[8px] font-semibold uppercase tracking-wide ${getStatusColor(booking.status)} group-hover:scale-105 transition-transform duration-300`}
                            >
                              {displayStatus === 'confirmed' ? (
                                <IoCheckmarkCircleOutline className="h-2 w-2" />
                              ) : displayStatus === 'completed' ? (
                                <IoCheckmarkCircleOutline className="h-2 w-2" />
                              ) : displayStatus === 'cancelled' ? (
                                <IoCloseCircleOutline className="h-2 w-2" />
                              ) : null}
                              <span className="hidden lg:inline">{displayStatus}</span>
                            </span>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Rescheduled Notice */}
                    {booking.isRescheduled && booking.rescheduleReason && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 mb-1">
                        <div className="flex items-start gap-1">
                          <IoInformationCircleOutline className="h-2.5 w-2.5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] lg:text-[8px] font-semibold text-blue-800 mb-0.5">Rescheduled</p>
                            <p className="text-[7px] lg:text-[7px] text-blue-700 line-clamp-2">{booking.rescheduleReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[8px] lg:text-[8px] text-slate-600 group-hover:text-slate-700 transition-colors">
                      <div className="flex items-center gap-0.5">
                        <IoCalendarOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{formatDate(booking.date || booking.bookingDate)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <IoTimeOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{formatTime(booking.time)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <TypeIcon className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{booking.type || 'In-person'}</span>
                      </div>
                      {booking.duration ? (
                        <div className="flex items-center gap-0.5">
                          <span className="truncate">{booking.duration}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <IoDocumentTextOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{booking.appointmentType || 'New'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredBookings.length > 0 && (
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
    </section>
  )
}

export default NurseBookings

