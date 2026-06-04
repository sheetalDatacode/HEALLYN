import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoWalletOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
} from 'react-icons/io5'
import { useToast } from '../../contexts/ToastContext'

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

const WalletBalance = ({ fetchBalance, fetchTransactions, baseRoute }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const isDashboardPage = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/dashboard/')
  
  const [balanceData, setBalanceData] = useState({
    totalBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        setLoading(true)
        const [balanceResponse, transactionsResponse] = await Promise.all([
          fetchBalance(),
          fetchTransactions({ limit: 5 }),
        ])
        
        if (balanceResponse.success && balanceResponse.data) {
          const balance = balanceResponse.data
          let transactionsData = []
          if (transactionsResponse.success && transactionsResponse.data) {
            if (Array.isArray(transactionsResponse.data)) {
              transactionsData = transactionsResponse.data
            } else {
              transactionsData = transactionsResponse.data.items || transactionsResponse.data.transactions || []
            }
          }
          
          const recentActivity = transactionsData
            .slice(0, 5)
            .map(txn => ({
              id: txn._id || txn.id,
              type: txn.type || 'earning',
              amount: txn.amount || 0,
              description: txn.description || txn.notes || (txn.type === 'earning' ? 'Earning' : 'Withdrawal'),
              date: txn.createdAt || txn.date || new Date().toISOString(),
              status: txn.status || 'completed',
            }))
          
          setBalanceData({
            totalBalance: balance.totalBalance || balance.balance || 0,
            availableBalance: balance.availableBalance || balance.available || 0,
            pendingBalance: balance.pendingBalance || balance.pending || 0,
            recentActivity,
          })
        }
      } catch (err) {
        console.error('Error fetching balance data:', err)
        toast.error('Failed to load balance details')
      } finally {
        setLoading(false)
      }
    }

    fetchBalanceData()
  }, [fetchBalance, fetchTransactions, toast])

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Balance Details</h1>
          <p className="mt-1 text-sm text-slate-600">Breakdown of your current wallet status</p>
        </div>
      </div>

      {/* Main Balance Card - Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)] transition-all hover:shadow-[rgba(17,73,108,0.35)]">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Total Balance</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">{loading ? '...' : formatCurrency(balanceData.totalBalance)}</p>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-105">
              <IoWalletOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Available Balance */}
        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-transform group-hover:scale-110">
                <IoCheckmarkCircleOutline className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Available</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">Ready for Payout</p>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{loading ? '...' : formatCurrency(balanceData.availableBalance)}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available now</span>
            </div>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="group relative overflow-hidden rounded-[24px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-transform group-hover:scale-110">
                <IoTimeOutline className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Pending</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">Processing</p>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">{loading ? '...' : formatCurrency(balanceData.pendingBalance)}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-tighter">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Settling soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Recent Activity</h2>
          <button onClick={() => navigate(`${baseRoute}/transaction`)} className="text-[10px] font-black text-[#11496c] uppercase tracking-widest hover:underline">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {balanceData.recentActivity.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoWalletOutline className="mx-auto h-16 w-16 text-slate-200" />
              <p className="mt-4 text-base font-bold text-slate-900">No activity yet</p>
            </div>
          ) : (
            balanceData.recentActivity.map((activity) => (
              <article
                key={activity.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110 ${
                      activity.type === 'earning' 
                        ? 'bg-emerald-50 border border-emerald-100' 
                        : 'bg-amber-50 border border-amber-100'
                    }`}
                  >
                    <IoWalletOutline
                      className={`h-6 w-6 ${
                        activity.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#11496c] transition-colors">
                          {activity.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <IoCalendarOutline className="h-3 w-3" />
                          {formatDateTime(activity.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${activity.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {activity.type === 'earning' ? '+' : '-'}{formatCurrency(activity.amount)}
                        </p>
                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                          activity.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  )
}

export default WalletBalance
