import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoReceiptOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoFilterOutline,
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

const WalletTransaction = ({ fetchTransactions, baseRoute }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filterType, setFilterType] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [filterType])

  useEffect(() => {
    const getTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = {
          page,
          limit,
          ...(filterType !== 'all' && { type: filterType === 'earnings' ? 'earning' : filterType }),
        }
        const response = await fetchTransactions(params)
        
        if (response && response.success && response.data) {
          const data = response.data
          if (data.pagination) setPagination(data.pagination)
          
          const transactionsData = Array.isArray(data) ? data : (data.items || data.transactions || [])
          
          setTransactions(transactionsData.map(txn => ({
            id: txn._id || txn.id,
            type: txn.type || 'earning',
            amount: Number(txn.amount || 0),
            description: txn.description || txn.notes || 'Transaction',
            date: txn.createdAt || txn.date || new Date().toISOString(),
            status: txn.status || 'completed',
            category: txn.category || 'Transaction',
          })))
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err.message || 'Failed to load transactions')
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    getTransactions()
  }, [fetchTransactions, toast, page, limit, filterType])

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-slate-600">Complete history of your wallet activities</p>
        </div>
      </div>

      {/* Main Transaction Card - Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)] transition-all hover:shadow-[rgba(17,73,108,0.35)]">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1.5">Total Transactions</p>
              <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">{loading ? '...' : (pagination?.total || transactions.length)}</p>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-transform hover:scale-105">
              <IoReceiptOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mr-1">
           <IoFilterOutline className="h-5 w-5" />
        </div>
        {['all', 'earnings', 'withdrawals'].map((type) => (
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

      {/* Transactions List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Activity Log</h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
            {pagination?.total || transactions.length} transactions
          </span>
        </div>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-16 w-16 text-slate-200" />
              <p className="mt-4 text-base font-bold text-slate-900">No transactions found</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110 ${
                      transaction.type === 'earning' 
                        ? 'bg-emerald-50 border border-emerald-100' 
                        : 'bg-amber-50 border border-amber-100'
                    }`}
                  >
                    {transaction.type === 'earning' ? (
                      <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <IoArrowUpOutline className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#11496c] transition-colors">
                          {transaction.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span className={transaction.type === 'earning' ? 'text-emerald-600/80' : 'text-amber-600/80'}>
                            {transaction.category}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3 w-3" />
                            {formatDateTime(transaction.date)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-black ${
                            transaction.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {transaction.type === 'earning' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter mt-1 ${
                          transaction.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {transaction.status}
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

export default WalletTransaction
