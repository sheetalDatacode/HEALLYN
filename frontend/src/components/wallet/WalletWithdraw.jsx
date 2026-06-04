import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCashOutline,
  IoAddOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoPhonePortraitOutline,
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

const WalletWithdraw = ({ fetchBalance, fetchWithdrawals, requestWithdrawal, baseRoute }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank')
  const [isProcessing, setIsProcessing] = useState(false)
  const [withdrawData, setWithdrawData] = useState({
    availableBalance: 0,
    totalWithdrawals: 0,
    thisMonthWithdrawals: 0,
    withdrawalHistory: [],
  })
  const [loading, setLoading] = useState(true)
  
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  })
  const [upiId, setUpiId] = useState('')
  const [walletNumber, setWalletNumber] = useState('')

  useEffect(() => {
    const fetchWithdrawData = async () => {
      try {
        setLoading(true)
        const [balanceResponse, withdrawalsResponse] = await Promise.all([
          fetchBalance(),
          fetchWithdrawals(),
        ])
        
        if (balanceResponse.success && balanceResponse.data) {
          const balance = balanceResponse.data
          let withdrawalsData = []
          if (withdrawalsResponse.success && withdrawalsResponse.data) {
            withdrawalsData = Array.isArray(withdrawalsResponse.data) ? withdrawalsResponse.data : (withdrawalsResponse.data.items || withdrawalsResponse.data.withdrawals || [])
          }
          
          const withdrawalHistory = withdrawalsData.map(wd => ({
            id: wd._id || wd.id,
            amount: wd.amount || 0,
            description: wd.description || 'Withdrawal Request',
            date: wd.createdAt || wd.date || new Date().toISOString(),
            status: wd.status || 'pending',
            paymentMethod: wd.payoutMethod?.type || 'Bank Transfer',
          }))
          
          setWithdrawData({
            availableBalance: balance.availableBalance || balance.available || 0,
            totalWithdrawals: balance.totalWithdrawals || 0,
            thisMonthWithdrawals: balance.thisMonthWithdrawals || 0,
            withdrawalHistory,
          })
        }
      } catch (err) {
        console.error('Error fetching withdraw data:', err)
        toast.error('Failed to load withdrawal data')
      } finally {
        setLoading(false)
      }
    }

    fetchWithdrawData()
  }, [fetchBalance, fetchWithdrawals, toast])

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount > withdrawData.availableBalance) {
      toast.error('Insufficient balance')
      return
    }

    setIsProcessing(true)
    try {
      const withdrawalData = {
        amount,
        paymentMethod: selectedPaymentMethod,
        ...(selectedPaymentMethod === 'bank' ? { bankAccount: bankDetails } : selectedPaymentMethod === 'upi' ? { upiId } : { walletNumber }),
      }
      
      await requestWithdrawal(withdrawalData)
      toast.success('Withdrawal request submitted successfully')
      setShowWithdrawModal(false)
      // Note: Ideally refresh logic goes here to update balance
    } catch (err) {
      toast.error(err.message || 'Withdrawal request failed')
    } finally {
      setIsProcessing(false)
    }
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Withdraw</h1>
          <p className="mt-1 text-sm text-slate-600">Transfer earnings to your account</p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={loading || withdrawData.availableBalance <= 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#11496c]/20 transition-all hover:bg-[#0d3a52] hover:shadow-xl active:scale-95 disabled:opacity-50"
        >
          <IoAddOutline className="h-4 w-4" />
          <span>Withdraw</span>
        </button>
      </div>

      {/* Main Withdrawal Card - Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)] transition-all hover:shadow-[rgba(17,73,108,0.35)]">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Total Withdrawn</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">{loading ? '...' : formatCurrency(withdrawData.totalWithdrawals)}</p>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <IoCashOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-[24px] border border-[#11496c]/20 bg-gradient-to-br from-[#11496c]/5 via-white to-[#11496c]/5 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#11496c]/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#11496c]/10">
                <IoWalletOutline className="h-6 w-6 text-[#11496c]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#11496c]">Available</p>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-[#11496c] transition-colors">{loading ? '...' : formatCurrency(withdrawData.availableBalance)}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <IoCashOutline className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">This Month</p>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{loading ? '...' : formatCurrency(withdrawData.thisMonthWithdrawals)}</p>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Withdrawal Log</h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
            {withdrawData.withdrawalHistory.length} requests
          </span>
        </div>
        <div className="space-y-3">
          {withdrawData.withdrawalHistory.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoCashOutline className="mx-auto h-16 w-16 text-slate-200" />
              <p className="mt-4 text-base font-bold text-slate-900">No withdrawals yet</p>
            </div>
          ) : (
            withdrawData.withdrawalHistory.map((withdrawal) => (
              <article
                key={withdrawal.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 shadow-sm transition-transform group-hover:scale-110">
                    <IoCashOutline className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {withdrawal.description}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{withdrawal.paymentMethod}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3 w-3" />
                            {formatDateTime(withdrawal.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-600">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                          withdrawal.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {withdrawal.status}
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

      {/* Withdraw Modal Placeholder */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Withdraw Funds</h2>
              <button onClick={() => setShowWithdrawModal(false)}><IoCloseOutline className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase mb-1">Available</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(withdrawData.availableBalance)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Amount</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#11496c] outline-none"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-[#11496c] text-white font-black uppercase tracking-widest transition-all hover:bg-[#0d3a52] active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default WalletWithdraw
