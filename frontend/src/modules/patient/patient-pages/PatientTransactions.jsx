import { useState, useEffect, useMemo } from 'react'
import {
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
} from 'react-icons/io5'
import { getPatientTransactions } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Default transactions (will be replaced by API data)
const defaultTransactions = []

const PatientTransactions = () => {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [transactions, setTransactions] = useState(defaultTransactions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientTransactions()
        
        if (response.success && response.data) {
          // Handle both array and object with items/transactions property
          const transactionsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.transactions || []
          
          // Transform API data to match component structure
          const transformed = transactionsData.map(txn => {
            // Extract provider name based on category
            let providerName = 'Provider'
            let category = txn.category || 'appointment'
            
            if (txn.category === 'appointment' && txn.appointmentId) {
              // For appointments, get doctor name
              const doctor = txn.appointmentId.doctorId
              if (doctor) {
                if (doctor.firstName && doctor.lastName) {
                  providerName = `Dr. ${doctor.firstName} ${doctor.lastName}`
                } else if (doctor.name) {
                  providerName = doctor.name
                } else {
                  providerName = 'Doctor'
                }
                category = 'appointment'
              }
            } else if ((txn.category === 'medicine' || txn.category === 'order') && txn.orderId) {
              // For orders (pharmacy/lab), get provider name
              const order = txn.orderId
              if (order.providerId) {
                if (order.providerType === 'laboratory') {
                  providerName = order.providerId.labName || order.providerId.name || 'Laboratory'
                  category = 'laboratory'
                } else if (order.providerType === 'pharmacy') {
                  providerName = order.providerId.name || 'Pharmacy'
                  category = 'pharmacy'
                }
              }
            }
            
            // Extract service/description
            let serviceName = txn.description || ''
            if (txn.category === 'appointment' && txn.appointmentId) {
              const doctor = txn.appointmentId.doctorId
              if (doctor && doctor.specialization) {
                serviceName = `Appointment with ${providerName} - ${doctor.specialization}`
              } else {
                serviceName = `Appointment payment for appointment`
              }
            } else if ((txn.category === 'medicine' || txn.category === 'order') && txn.orderId) {
              serviceName = txn.description || `Payment for ${category === 'laboratory' ? 'lab test' : 'medicine'} order`
            }
            
            return {
              id: txn._id || txn.id,
              _id: txn._id || txn.id,
              type: txn.type || txn.transactionType || 'payment',
              category: category,
              providerName: providerName,
              serviceName: serviceName,
              amount: txn.amount || 0,
              status: txn.status || 'completed',
              date: txn.createdAt ? new Date(txn.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              time: txn.createdAt ? new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
              transactionId: txn.transactionId || txn._id || txn.id,
              paymentMethod: txn.paymentMethod || 'razorpay',
              queueNumber: txn.queueNumber || null,
              originalData: txn,
            }
          })
          
          setTransactions(transformed)
        }
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err.message || 'Failed to load transactions')
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    
    // Listen for appointment booking event to refresh transactions
    const handleAppointmentBooked = () => {
      fetchTransactions()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast])

  // Legacy localStorage loading removed - using API now

  // Filter out pending transactions (they should show in requests page)
  const completedTransactions = transactions.filter(txn => txn.status !== 'pending' && txn.status !== 'accepted')
  
  const filteredTransactions = filter === 'all' 
    ? completedTransactions 
    : completedTransactions.filter(txn => txn.status === filter)

  // Calculate paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const totalItems = filteredTransactions.length

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // Show loading state
  if (loading) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-slate-700">Loading transactions...</p>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-red-700">Error loading transactions</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </section>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
      case 'accepted':
        return 'bg-amber-100 text-amber-700'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'pending':
      case 'accepted':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'failed':
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const getTypeIcon = (type, category) => {
    if (category === 'laboratory' || type === 'Lab Test') {
      return <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
    } else if (category === 'pharmacy' || type === 'Pharmacy') {
      return <IoBagHandleOutline className="h-6 w-6 text-amber-600" />
    } else {
      return <IoPeopleOutline className="h-6 w-6 text-purple-600" />
    }
  }

  const getTypeBgColor = (category) => {
    if (category === 'laboratory') {
      return 'bg-[rgba(17,73,108,0.1)]'
    } else if (category === 'pharmacy') {
      return 'bg-amber-100'
    } else {
      return 'bg-purple-100'
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  const formatDateTime = (dateString, timeString) => {
    try {
      if (dateString && timeString && timeString !== 'N/A') {
        return `${formatDate(dateString)}, ${timeString}`
      }
      return formatDate(dateString)
    } catch (error) {
      return dateString
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-100 w-fit overflow-x-auto max-w-full no-scrollbar mb-2">
        {['all', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 px-5 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${filter === status
              ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20'
              : 'text-slate-500 hover:text-[#11496c] hover:bg-slate-50'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {paginatedTransactions.map((transaction) => (
          <article
            key={transaction.id}
            className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-xl hover:shadow-[#11496c]/5"
          >
            <div className="flex items-start gap-5">
              {/* Category Icon */}
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${getTypeBgColor(transaction.category)} transition-transform group-hover:scale-110`}>
                {getTypeIcon(transaction.type, transaction.category)}
              </div>

              {/* Transaction Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-black text-slate-900 truncate leading-tight">
                        {transaction.providerName}
                      </h3>
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {transaction.category}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 line-clamp-1 italic">
                      {transaction.serviceName || `Payment for ${transaction.category}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black leading-none ${transaction.status === 'completed' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {transaction.status === 'completed' ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">Amount</p>
                  </div>
                </div>

                {/* Badges & Meta */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="capitalize">{transaction.status === 'paid' ? 'completed' : transaction.status === 'accepted' ? 'pending' : transaction.status}</span>
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1.5 rounded-full">
                      {transaction.paymentMethod}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <IoCalendarOutline className="h-3.5 w-3.5" />
                      {formatDateTime(transaction.date, transaction.time)}
                    </span>
                  </div>
                </div>

                {/* Transaction ID Footer */}
                <div className="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                  ID: {transaction.transactionId}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoReceiptOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No transactions found</p>
          <p className="text-sm text-slate-500">Try selecting a different filter</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredTransactions.length > 0 && totalPages > 1 && (
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

export default PatientTransactions
