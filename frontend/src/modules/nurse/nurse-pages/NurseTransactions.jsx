import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../../../contexts/ToastContext'
import { getNurseWalletTransactions } from '../nurse-services/nurseService'
import Pagination from '../../../components/Pagination'
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

// Default transactions (will be replaced by API data)
const defaultTransactions = []

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

const NurseTransactions = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const isDashboardPage = location.pathname === '/nurse/dashboard' || location.pathname === '/nurse/'
  const isWalletTransaction = location.pathname.includes('/wallet/transaction')
  const [filterType, setFilterType] = useState('all') // all, earnings, withdrawals
  const [transactions, setTransactions] = useState(defaultTransactions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        // TODO: Import nurse transactions service when available
        // const response = await getNurseTransactions({ 
        //   page: currentPage, 
        //   limit: itemsPerPage,
        //   type: filterType !== 'all' ? filterType : undefined
        // })
        // if (response && response.success && response.data) {
        //   const data = response.data
        //   const transactionsData = Array.isArray(data) 
        //     ? data 
        //     : (data.items || data.transactions || [])
        //   
        //   // Extract pagination info
        //   const pagination = response.data.pagination || {}
        //   setTotalPages(pagination.totalPages || Math.ceil((pagination.total || transactionsData.length) / itemsPerPage) || 1)
        //   setTotalItems(pagination.total || transactionsData.length)
        //   
        //   setTransactions(transactionsData)
        // }
        setTransactions([])
        setTotalPages(1)
        setTotalItems(0)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err.message || 'Failed to load transactions')
        toast.error('Failed to load transactions')
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [toast, currentPage, filterType])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType])

  // Transactions are already filtered by backend, but we can do client-side filtering as fallback
  const filteredTransactions = transactions.filter((txn) => {
    if (filterType === 'all') return true
    if (filterType === 'earning') return txn.type === 'earning'
    if (filterType === 'withdrawal') return txn.type === 'withdrawal'
    return true
  })

  return (
    <section className={`flex flex-col gap-6 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          {isWalletTransaction && (
            <button
              onClick={() => navigate('/nurse/wallet')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
            >
              <IoArrowBackOutline className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Transactions</h1>
            <p className="mt-1 text-sm text-slate-600">View all your transaction history</p>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)]">
          <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white/80 mb-1">Total Transactions</p>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight">{loading ? '...' : filteredTransactions.length}</p>
              </div>
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
                <IoReceiptOutline className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterType('all')}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-[#11496c] text-white shadow-sm'
                : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('earning')}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              filterType === 'earning'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setFilterType('withdrawal')}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              filterType === 'withdrawal'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Withdrawals
          </button>
        </div>

        {/* Transaction History Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Transaction History</h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {loading ? '...' : filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
                <p className="mt-4 text-sm text-slate-600">Loading transactions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-sm font-medium text-red-800">{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No transactions found</p>
              <p className="mt-1 text-sm text-slate-500">
                {filterType !== 'all' 
                  ? `You don't have any ${filterType} transactions yet`
                  : 'You don\'t have any transactions yet'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <article
                key={transaction.id || transaction._id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                    transaction.type === 'earning' 
                      ? 'bg-emerald-50 border border-emerald-100' 
                      : 'bg-amber-50 border border-amber-100'
                  }`}>
                    {transaction.type === 'earning' ? (
                      <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <IoArrowUpOutline className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {transaction.description || (transaction.type === 'earning' ? 'Earning from service' : 'Withdrawal')}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(transaction.createdAt || transaction.date)}
                          </span>
                          {transaction._id && (
                            <span className="text-slate-400">ID: {String(transaction._id).substring(0, 8)}</span>
                          )}
                          {transaction.commission && (
                            <span className="text-slate-400">(Commission: {transaction.commission}%)</span>
                          )}
                        </div>
                        <div className="mt-2.5">
                          {transaction.status === 'pending' && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                              <IoTimeOutline className="h-3.5 w-3.5" />
                              Processing
                            </div>
                          )}
                          {transaction.status === 'completed' || transaction.status === 'success' ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                              Completed
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className={`text-xl font-bold ${
                          transaction.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {transaction.type === 'earning' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                        </p>
                        {transaction.balance !== undefined && (
                          <p className="text-xs text-slate-500 mt-1">Balance: {formatCurrency(transaction.balance)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredTransactions.length > 0 && (
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

export default NurseTransactions

