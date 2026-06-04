import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  IoWalletOutline,
  IoArrowDownOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'
import { useToast } from '../../contexts/ToastContext'

const defaultWalletData = {
  totalBalance: 0,
  availableBalance: 0,
  pendingBalance: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  totalEarnings: 0,
  totalWithdrawals: 0,
  totalTransactions: 0,
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const WalletDashboard = ({ fetchBalance, baseRoute }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  // Check if we are on the main dashboard page (to handle margin)
  // We assume that the generic wallet is often placed inside a route structure
  // For safety, we can just look at if the current path exactly matches the base route
  // or if we are exactly on the module dashboard (e.g. /doctor/dashboard)
  // However, wallet is usually its own page. We can check if we want to apply -mt-28
  const isDashboardPage = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/dashboard/')
  
  const [walletData, setWalletData] = useState(defaultWalletData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchBalance()
        
        if (response && response.success && response.data) {
          const data = response.data
          setWalletData({
            totalBalance: Number(data.totalBalance || data.balance || 0),
            availableBalance: Number(data.availableBalance || data.available || 0),
            pendingBalance: Number(data.pendingBalance || data.pending || data.pendingWithdrawals || 0),
            thisMonthEarnings: Number(data.thisMonthEarnings || 0),
            lastMonthEarnings: Number(data.lastMonthEarnings || 0),
            totalEarnings: Number(data.totalEarnings || 0),
            totalWithdrawals: Number(data.totalWithdrawals || 0),
            totalTransactions: Number(data.totalTransactions || 0),
          })
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err)
        setError(err.message || 'Failed to load wallet data')
        toast.error('Failed to load wallet data')
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
    
    const handleAppointmentBooked = () => {
      fetchWalletData()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [fetchBalance, toast])

  return (
    <section className={`flex flex-col gap-6 pb-24 ${isDashboardPage ? '-mt-28' : ''}`}>
      {/* Header Section */}
      <div className="space-y-2 mb-3 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Wallet</h1>
            <p className="mt-1.5 text-sm text-slate-600">Manage your earnings and payouts</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 border border-emerald-100 shadow-sm transition-all hover:bg-emerald-100/50">
            <IoShieldCheckmarkOutline className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest hidden sm:inline">Secure Payouts</span>
          </div>
        </div>
      </div>

      {/* Main Balance Card - Hero Section */}
      <div className="relative overflow-hidden rounded-[40px] border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-10 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)] transition-all hover:shadow-[rgba(17,73,108,0.35)]">
        {/* Animated Background Elements */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-3">Total Balance</p>
              <p className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-md">{loading ? '...' : formatCurrency(walletData.totalBalance)}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/20 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Available: {loading ? '...' : formatCurrency(walletData.availableBalance)}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/20 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pending: {loading ? '...' : formatCurrency(walletData.pendingBalance)}</span>
                </div>
              </div>
            </div>
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transition-transform hover:scale-105">
              <IoWalletOutline className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Earning Card */}
        <button
          onClick={() => navigate(`${baseRoute}/earning`)}
          className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.98] hover:border-emerald-200"
        >
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-50/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                <IoArrowDownOutline className="h-6 w-6" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Earnings</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{loading ? '...' : formatCurrency(walletData.totalEarnings)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase">Lifetime</span>
            </div>
          </div>
        </button>

        {/* Withdraw Card */}
        <button
          onClick={() => navigate(`${baseRoute}/withdraw`)}
          className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all hover:shadow-xl hover:shadow-amber-500/5 active:scale-[0.98] hover:border-amber-200"
        >
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-50/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
                <IoCashOutline className="h-6 w-6" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-amber-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Withdrawals</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">{loading ? '...' : formatCurrency(walletData.totalWithdrawals)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[10px] font-bold text-amber-600 uppercase">Settled</span>
            </div>
          </div>
        </button>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Balance Details Card */}
        <button
          onClick={() => navigate(`${baseRoute}/balance`)}
          className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] hover:border-[rgba(17,73,108,0.3)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11496c] to-[#1a5f7a] shadow-lg shadow-[#11496c]/20 transition-transform group-hover:scale-105">
                <IoWalletOutline className="h-7 w-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Balance Details</p>
                <p className="text-xs font-bold text-slate-400 mt-1">View breakdown & status</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#11496c]/10 transition-all">
              <IoArrowForwardOutline className="h-5 w-5 text-slate-400 group-hover:text-[#11496c] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </button>

        {/* Transaction History Card */}
        <button
          onClick={() => navigate(`${baseRoute}/transaction`)}
          className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] hover:border-[rgba(17,73,108,0.3)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11496c] to-[#1a5f7a] shadow-lg shadow-[#11496c]/20 transition-transform group-hover:scale-105">
                <IoReceiptOutline className="h-7 w-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Transactions</p>
                <p className="text-xs font-bold text-slate-400 mt-1">{loading ? '...' : walletData.totalTransactions} total entries</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#11496c]/10 transition-all">
              <IoArrowForwardOutline className="h-5 w-5 text-slate-400 group-hover:text-[#11496c] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </button>
      </div>
    </section>
  )
}

export default WalletDashboard
