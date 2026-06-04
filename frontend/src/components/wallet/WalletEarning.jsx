import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoArrowDownOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
} from 'react-icons/io5'
import { useToast } from '../../contexts/ToastContext'
import Pagination from '../Pagination'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const WalletEarning = ({ fetchEarnings, baseRoute }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filterType, setFilterType] = useState('all')
  const [earningData, setEarningData] = useState({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    thisYearEarnings: 0,
    todayEarnings: 0,
    earnings: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [filterType])

  useEffect(() => {
    const getEarnings = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = { page, limit }
        const response = await fetchEarnings(params)
        
        if (response && response.success && response.data) {
          const data = response.data
          if (data.pagination) setPagination(data.pagination)
          
          const earningsList = Array.isArray(data) ? data : (data.items || data.earnings || [])
          
          const getDescription = (earn) => {
            if (earn.description) return earn.description
            if (earn.notes) return earn.notes
            if (earn.appointmentId) return 'Consultation fee'
            if (earn.orderId) return `Order payment #${earn.orderId._id || earn.orderId}`
            return 'Earning'
          }
          
          const getCategory = (earn) => {
            if (earn.category) return earn.category
            if (earn.appointmentId) return 'Consultation'
            if (earn.orderId) return 'Order Payment'
            return 'Earning'
          }
          
          setEarningData({
            totalEarnings: Number(data.totalEarnings || 0),
            thisMonthEarnings: Number(data.thisMonthEarnings || 0),
            lastMonthEarnings: Number(data.lastMonthEarnings || 0),
            thisYearEarnings: Number(data.thisYearEarnings || 0),
            todayEarnings: Number(data.todayEarnings || 0),
            earnings: earningsList.map(earn => ({
              id: earn._id || earn.id,
              amount: Number(earn.amount || 0),
              description: getDescription(earn),
              date: earn.createdAt || earn.date || new Date().toISOString(),
              status: earn.status || 'completed',
              category: getCategory(earn),
            })),
          })
        }
      } catch (err) {
        console.error('Error fetching earnings:', err)
        setError(err.message || 'Failed to load earnings')
        toast.error('Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }

    getEarnings()
  }, [fetchEarnings, toast, page, limit, filterType])

  const earningsChange = earningData.lastMonthEarnings > 0
    ? ((earningData.thisMonthEarnings - earningData.lastMonthEarnings) / earningData.lastMonthEarnings) * 100
    : 0

  const location = useLocation()
  const isDashboardPage = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/dashboard/')

  return (
    <section className={`flex flex-col gap-6 pb-24 ${isDashboardPage ? '-mt-28' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(baseRoute)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Earnings</h1>
          <p className="mt-1 text-sm text-slate-600">View your income breakdown and history</p>
        </div>
      </div>

      {/* Main Earnings Card - Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)] transition-all hover:shadow-[rgba(17,73,108,0.35)]">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Total Earnings</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">{loading ? '...' : formatCurrency(earningData.totalEarnings)}</p>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-105">
              <IoArrowDownOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today Earnings */}
        <div className="group relative overflow-hidden rounded-[24px] border border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.05)] via-white to-[rgba(17,73,108,0.05)] p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.1)] blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#11496c]/10 transition-transform group-hover:scale-110">
                <IoCalendarOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#11496c]">Today</p>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-[#11496c] transition-colors">{loading ? '...' : formatCurrency(earningData.todayEarnings)}</p>
          </div>
        </div>

        {/* Month Earnings */}
        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 transition-transform group-hover:scale-110">
                <IoTrendingUpOutline className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">This Month</p>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{loading ? '...' : formatCurrency(earningData.thisMonthEarnings)}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
              {earningsChange >= 0 ? (
                <>
                  <IoTrendingUpOutline className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">+{earningsChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <IoTrendingDownOutline className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-red-600">{earningsChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-slate-400 uppercase tracking-tighter">vs last month</span>
            </div>
          </div>
        </div>

        {/* Year Earnings */}
        <div className="group relative overflow-hidden rounded-[24px] border border-[#11496c]/20 bg-gradient-to-br from-[#11496c]/5 via-white to-[#11496c]/5 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#11496c]/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#11496c]/10 transition-transform group-hover:scale-110">
                <IoCalendarOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#11496c]">This Year</p>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-[#11496c] transition-colors">{loading ? '...' : formatCurrency(earningData.thisYearEarnings)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'today', 'month', 'year'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`shrink-0 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              filterType === type
                ? 'text-white shadow-md'
                : 'bg-white text-slate-500 shadow-sm hover:bg-slate-50 border border-slate-200'
            }`}
            style={filterType === type ? { backgroundColor: '#11496c' } : {}}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Earnings List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Earning History</h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
            {pagination?.total || earningData.earnings.length} entries
          </span>
        </div>
        <div className="space-y-3">
          {earningData.earnings.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoArrowDownOutline className="mx-auto h-16 w-16 text-slate-200" />
              <p className="mt-4 text-base font-bold text-slate-900">No earnings found</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Your earnings will appear here</p>
            </div>
          ) : (
            earningData.earnings.map((earning) => (
              <article
                key={earning.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-lg hover:border-emerald-100"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm transition-transform group-hover:scale-110">
                    <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {earning.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span className="text-emerald-600/80">{earning.category}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3 w-3" />
                            {formatDateTime(earning.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-emerald-600">
                          +{formatCurrency(earning.amount)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter mt-1 ${
                          earning.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {earning.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={pagination.page || page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit || limit}
              onPageChange={(newPage) => {
                setPage(newPage)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              loading={loading}
            />
          </div>
        )}
      </section>
    </section>
  )
}

export default WalletEarning
