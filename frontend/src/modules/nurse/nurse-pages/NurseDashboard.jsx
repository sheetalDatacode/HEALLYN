import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoCalendarOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoPersonCircleOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoSearchOutline,
  IoNotificationsOutline,
  IoTrendingUpOutline,
} from 'react-icons/io5'
import {
  getNurseBookings,
  getNurseTransactions,
  getNurseWalletBalance,
  getNurseProfile
} from '../nurse-services/nurseService'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
    case 'processing':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const NurseDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [stats, setStats] = useState({
    totalBookings: 0,
    walletBalance: 0,
    todayBookingsCount: 0,
    monthlyEarnings: 0
  })
  
  const [todayBookings, setTodayBookings] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch profile, bookings, transactions, and wallet in parallel
        const [profileRes, bookingsRes, transactionsRes, walletRes] = await Promise.allSettled([
          getNurseProfile(),
          getNurseBookings({ limit: 10 }),
          getNurseTransactions({ limit: 5 }),
          getNurseWalletBalance()
        ])

        // Handle Profile
        if (profileRes.status === 'fulfilled' && profileRes.value.success) {
          const data = profileRes.value.data
          setProfile({
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Nurse',
            city: data.city || 'Location',
            isActive: data.isActive ?? true
          })
        }

        // Handle Bookings
        if (bookingsRes.status === 'fulfilled' && bookingsRes.value.success) {
          const bookingsData = Array.isArray(bookingsRes.value.data) 
            ? bookingsRes.value.data 
            : bookingsRes.value.data?.items || []
          
          const today = new Date().toLocaleDateString()
          const todayFiltered = bookingsData.filter(b => new Date(b.createdAt).toLocaleDateString() === today)
          
          setTodayBookings(bookingsData.slice(0, 5).map(b => ({
            id: b._id || b.id,
            patientName: b.patientName || 'Unknown Patient',
            patientImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.patientName || 'P')}&background=3b82f6&color=fff`,
            service: b.serviceName || 'Nursing Care',
            time: new Date(b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: b.status || 'pending'
          })))
          
          setStats(prev => ({
            ...prev,
            totalBookings: bookingsRes.value.data?.pagination?.total || bookingsData.length,
            todayBookingsCount: todayFiltered.length
          }))
        }

        // Handle Transactions
        if (transactionsRes.status === 'fulfilled' && transactionsRes.value.success) {
          const txData = Array.isArray(transactionsRes.value.data)
            ? transactionsRes.value.data
            : transactionsRes.value.data?.items || []
            
          setRecentTransactions(txData.slice(0, 5).map(t => ({
            id: t._id || t.id,
            amount: t.amount || 0,
            type: t.type || 'earning',
            date: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: t.status || 'completed'
          })))
        }

        // Handle Wallet
        if (walletRes.status === 'fulfilled' && walletRes.value.success) {
          const wData = walletRes.value.data
          setStats(prev => ({
            ...prev,
            walletBalance: wData.availableBalance || wData.balance || 0,
            monthlyEarnings: wData.thisMonthEarnings || 0
          }))
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  return (
    <section className="flex flex-col gap-6 pb-24 -mt-28">
      {/* Professional Header - Cover Style */}
      <header className="relative -mx-4 sm:-mx-6 mb-2 overflow-hidden bg-slate-50">
        <div 
          className="h-28 sm:h-36 w-full relative"
          style={{
            background: 'linear-gradient(135deg, #11496c 0%, #1a5f7a 50%, #14B8A6 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-4 sm:px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-[24px] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#11496c] flex items-center justify-center text-white shadow-lg shadow-[#11496c]/20 shrink-0">
                 <IoPersonCircleOutline className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                  {profile?.name || 'Nurse'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">
                    <IoLocationOutline className="h-3 w-3" />
                    {profile?.city || 'Location'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${profile?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {profile?.isActive ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-0 sm:px-2 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div 
            onClick={() => navigate('/nurse/booking')}
            className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoCalendarOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Bookings</p>
            <div className="flex items-baseline gap-1.5">
               <h3 className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : stats.totalBookings}</h3>
               <span className="text-[9px] font-bold text-emerald-600">+8%</span>
            </div>
            <p className="text-[9px] font-medium text-slate-400 mt-1.5 uppercase tracking-tighter">Lifetime care</p>
          </div>

          <div 
            onClick={() => navigate('/nurse/wallet')}
            className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#11496c] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoWalletOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Wallet Balance</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : formatCurrency(stats.walletBalance)}</h3>
            <p className="text-[9px] font-medium text-[#11496c] mt-1.5 uppercase tracking-tighter">Available now</p>
          </div>

          <div className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-[#11496c]/10 text-[#11496c] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoCalendarOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Visits</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none">{stats.todayBookingsCount}</h3>
            <p className="text-[9px] font-medium text-[#11496c] mt-1.5 uppercase tracking-tighter">Pending visits</p>
          </div>

          <div className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoReceiptOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">This Month</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : formatCurrency(stats.monthlyEarnings)}</h3>
            <p className="text-[9px] font-medium text-amber-600 mt-1.5 uppercase tracking-tighter">Net earnings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Bookings Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-0.5 rounded-full bg-[#11496c]"></div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Bookings</h2>
                <div className="bg-slate-100 px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-500">
                  {todayBookings.length}
                </div>
              </div>
              <button 
                onClick={() => navigate('/nurse/booking')}
                className="text-[10px] font-bold text-[#11496c] uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todayBookings.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-12 text-center">
                          <IoCalendarOutline className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">No bookings found</p>
                        </td>
                      </tr>
                    ) : (
                      todayBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate('/nurse/booking')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={booking.patientImage} alt="" className="h-8 w-8 rounded-lg object-cover ring-2 ring-white shadow-sm" />
                              <div>
                                <p className="text-xs font-bold text-slate-800 leading-none">{booking.patientName}</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">{booking.time}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-slate-600">{booking.service}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-0.5 rounded-full bg-teal-500"></div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Transactions</h2>
                <div className="bg-slate-100 px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-500">
                  {recentTransactions.length}
                </div>
              </div>
              <button 
                onClick={() => navigate('/nurse/wallet')}
                className="text-[10px] font-bold text-[#11496c] uppercase tracking-widest hover:underline"
              >
                Wallet
              </button>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-12 text-center">
                          <IoReceiptOutline className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">No transactions</p>
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate('/nurse/wallet')}>
                          <td className="px-4 py-3">
                            <p className={`text-xs font-bold ${tx.type === 'earning' ? 'text-emerald-600' : 'text-slate-700'}`}>
                              {tx.type === 'earning' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-slate-600">{tx.date}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NurseDashboard
