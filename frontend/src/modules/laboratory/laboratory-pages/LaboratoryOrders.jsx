import { useState, useMemo, useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoBagHandleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoFlaskOutline,
} from 'react-icons/io5'
import { getLaboratoryOrders, updateLaboratoryOrder } from '../laboratory-services/laboratoryService'
import Pagination from '../../../components/Pagination'

// Default orders (will be replaced by API data)
const defaultOrders = []

// Status flow for lab visit/home collection:
// Lab visit: pending -> visit_time -> sample_collected -> being_tested -> reports_being_generated -> test_successful -> reports_updated -> completed
// Home collection: pending -> lab_assistant_is_arriving -> sample_collected -> being_tested -> reports_being_generated -> test_successful -> reports_updated -> completed
const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: IoTimeOutline },
  visit_time: { label: 'You can now visit the lab', color: 'bg-blue-100 text-blue-700', icon: IoCalendarOutline },
  lab_assistant_is_arriving: { label: 'Lab assistant is arriving', color: 'bg-blue-100 text-blue-700', icon: IoTimeOutline },
  sample_collected: { label: 'Sample Collected', color: 'bg-purple-100 text-purple-700', icon: IoCheckmarkCircleOutline },
  being_tested: { label: 'Being Tested', color: 'bg-indigo-100 text-indigo-700', icon: IoFlaskOutline },
  reports_being_generated: { label: 'Reports Being Generated', color: 'bg-cyan-100 text-cyan-700', icon: IoDocumentTextOutline },
  test_successful: { label: 'Test Successful', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
  reports_updated: { label: 'Reports Updated', color: 'bg-green-100 text-green-700', icon: IoCheckmarkCircleOutline },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700', icon: IoCheckmarkCircleOutline },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: IoCloseCircleOutline },
}

// Status flow order for progression
const statusFlow = ['pending', 'visit_time', 'lab_assistant_is_arriving', 'sample_collected', 'being_tested', 'reports_being_generated', 'test_successful', 'reports_updated', 'completed']

// Get next status in the flow
const getNextStatus = (currentStatus) => {
  const currentIndex = statusFlow.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
    return null // No next status
  }
  return statusFlow[currentIndex + 1]
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const LaboratoryOrders = () => {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orders, setOrders] = useState(defaultOrders)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getLaboratoryOrders({ 
          page: currentPage, 
          limit: itemsPerPage 
        })
        
        if (response.success && response.data) {
          const ordersData = Array.isArray(response.data) 
            ? response.data 
            : response.data.leads || response.data.orders || []
          
          const pagination = response.data.pagination || {}
          
          // Transform leads to orders format
          const transformedOrders = ordersData.map(lead => {
            const patientName = lead.patientId?.firstName && lead.patientId?.lastName
              ? `${lead.patientId.firstName} ${lead.patientId.lastName}`
              : lead.patientId?.name || lead.patientName || 'Unknown Patient'
            
            return {
              id: lead._id || lead.id,
              _id: lead._id || lead.id,
              type: 'laboratory',
              patientId: lead.patientId?._id || lead.patientId?.id || lead.patientId || 'pat-unknown',
              patientName: patientName,
              patientPhone: lead.patientId?.phone || lead.patientPhone || '',
              patientEmail: lead.patientId?.email || lead.patientEmail || '',
              // Map backend statuses to frontend status flow
              status: (() => {
                const backendStatus = lead.status || 'pending'
                // Map old statuses to new flow
                if (backendStatus === 'accepted' || backendStatus === 'new') return 'pending'
                if (backendStatus === 'ready') return 'visit_time'
                if (backendStatus === 'lab_assistant_is_arriving') return 'lab_assistant_is_arriving'
                if (backendStatus === 'test_completed') return 'test_successful'
                if (backendStatus === 'report_uploaded') return 'reports_updated'
                if (backendStatus === 'completed') return 'completed'
                // Return as-is if it matches new flow, otherwise default to pending
                return statusFlow.includes(backendStatus) ? backendStatus : 'pending'
              })(),
              createdAt: lead.createdAt || new Date().toISOString(),
              testRequestId: lead._id || lead.id,
              tests: (lead.tests || lead.investigations || lead.items || []).map(test => ({
                name: typeof test === 'string' ? test : test.name || test.testName || 'Test',
                price: typeof test === 'object' && test.price ? test.price : 0,
              })),
              totalAmount: lead.billingSummary?.totalAmount || lead.totalAmount || lead.amount || 0,
              deliveryType: lead.homeCollectionRequested || lead.deliveryOption === 'home' || lead.deliveryOption === 'home_delivery' ? 'home' : 'lab',
              visitType: lead.visitType || (lead.deliveryOption === 'home' || lead.deliveryOption === 'home_delivery' ? 'home' : 'lab'),
              address: lead.patientId?.address 
                ? `${lead.patientId.address.line1 || ''} ${lead.patientId.address.city || ''} ${lead.patientId.address.state || ''}`.trim() || 'Address not provided'
                : lead.deliveryAddress || lead.address || 'Address not provided',
              originalData: lead,
            }
          })
          setOrders(transformedOrders)
          setTotalPages(pagination.totalPages || Math.ceil((pagination.total || transformedOrders.length) / itemsPerPage) || 1)
          setTotalItems(pagination.total || transformedOrders.length)
        } else {
          setOrders([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err.message || 'Failed to load orders')
        toast.error('Failed to load orders')
        setOrders([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [currentPage])

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filter])

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (filter !== 'all') {
      filtered = filtered.filter((order) => order.status === filter)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.patientName.toLowerCase().includes(normalizedSearch) ||
          String(order.id || order._id || '').toLowerCase().includes(normalizedSearch) ||
          String(order.testRequestId || '').toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [filter, searchTerm, orders])

  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId || o._id === orderId)
    if (!order) {
      toast.error('Order not found in local state')
      return
    }

    const statusLabel = statusConfig[newStatus]?.label || newStatus
    const patientName = order.patientName
    const totalAmount = formatCurrency(order.totalAmount)

    const confirmMessage = `Update order status to "${statusLabel}"?\n\nPatient: ${patientName}\nOrder ID: ${orderId}\nTotal Amount: ${totalAmount}\n\nThis will send a notification to the patient about the order status.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      
      
      // Use the most reliable ID - prefer order._id, then order.id, then testRequestId
      const idToUse = order._id || order.id || order.testRequestId || orderId
      
      
      // Call API to update status
      const response = await updateLaboratoryOrder(idToUse, { status: newStatus })
      
      
      // Update order status in state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          (o.id === orderId || o._id === orderId) 
            ? { ...o, status: newStatus }
            : o
        )
      )
      
      toast.success(`Order status updated to "${statusLabel}"! Notification sent to ${patientName}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      console.error('Error details:', { orderId, newStatus, order })
      
      const errorMessage = error.message || 'Failed to update order status. Please try again.'
      toast.error(errorMessage)
      
      // Revert status change on error
      setOrders(prevOrders => 
        prevOrders.map(o => 
          (o.id === orderId || o._id === orderId) 
            ? { ...o, status: order.status }
            : o
        )
      )
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, order ID, or test request..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { key: 'all', label: 'All Orders', icon: IoBagHandleOutline },
          { key: 'completed', label: 'Completed', icon: IoCheckmarkCircleOutline },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                filter === tab.key
                  ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#11496c]/30 hover:bg-slate-50 hover:text-[#11496c]'
              }`}
            >
              <Icon className={`h-4 w-4 ${filter === tab.key ? 'animate-pulse' : ''}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
        {loading ? (
          <div className="lg:col-span-4 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="lg:col-span-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No orders found</p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm.trim() || filter !== 'all' 
                ? 'No orders match your search or filter criteria.' 
                : 'Your orders will appear here'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = statusInfo.icon
            const orderId = order.id || order._id || `order-${Math.random()}`

            return (
              <article
                key={orderId}
                className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 active:scale-[0.98] lg:hover:scale-[1.02] sm:p-5 lg:gap-3.5"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                <div className="relative flex items-start justify-between gap-3 lg:gap-2">
                  <div className="flex-1 min-w-0 lg:min-w-0">
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:gap-1.5">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 lg:text-sm lg:truncate lg:flex-1">{order.patientName}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusInfo.color} group-hover:scale-105 transition-transform duration-300 shrink-0 lg:text-[9px] lg:px-1.5 lg:py-0.5`}>
                        <StatusIcon className="h-3 w-3 lg:h-2.5 lg:w-2.5" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-600 transition-colors break-all lg:text-[10px]">Order ID: {String(orderId)}</p>
                    {order.testRequestId && (
                      <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors break-all lg:text-[10px]">Test ID: {String(order.testRequestId)}</p>
                    )}
                    {/* Visit Type Badge */}
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        (order.deliveryType === 'home' || order.visitType === 'home') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {(order.deliveryType === 'home' || order.visitType === 'home') ? '🏠 Home Visit' : '🏥 Lab Visit'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 group-hover:text-slate-700 transition-colors lg:text-[10px] lg:flex lg:items-center lg:gap-1">
                      <IoCalendarOutline className="mr-1 inline h-3 w-3 text-[#11496c] lg:h-2.5 lg:w-2.5 lg:mr-0" />
                      <span className="lg:truncate">{formatDateTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 lg:flex lg:flex-col lg:items-end lg:gap-0.5">
                    <p className="text-lg font-bold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 lg:text-base lg:leading-tight">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>

                {/* Tests */}
                {order.tests && order.tests.length > 0 && (
                  <div className="relative rounded-lg bg-slate-50 p-3 group-hover:bg-slate-100 transition-colors duration-300 lg:p-2.5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-600 transition-colors lg:text-[10px] lg:mb-1.5">Tests</p>
                    <ul className="space-y-1.5 lg:space-y-1">
                      {order.tests.map((test, idx) => {
                        const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                        const testPrice = typeof test === 'object' && test.price ? test.price : 0
                        return (
                          <li key={idx} className="flex items-center justify-between text-xs lg:text-[10px]">
                            <span className="text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1 line-clamp-1 lg:flex-1 lg:min-w-0">
                              <IoFlaskOutline className="h-3 w-3 text-[#11496c] shrink-0 lg:h-2.5 lg:w-2.5" />
                              <span className="truncate">{testName}</span>
                            </span>
                            {testPrice > 0 && (
                              <span className="font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors shrink-0 lg:ml-1 lg:text-[10px]">{formatCurrency(testPrice)}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* Address */}
                <div className="relative flex items-start gap-2 text-xs text-slate-600 group-hover:text-slate-700 transition-colors lg:text-[10px] lg:gap-1.5">
                  <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0 text-[#11496c] lg:h-3 lg:w-3 lg:mt-0" />
                  <span className="line-clamp-2 lg:line-clamp-1">{order.address}</span>
                </div>

                {/* Action Buttons */}
                <div className="relative flex gap-2 flex-wrap lg:mt-auto lg:pt-2 lg:border-t lg:border-slate-200">
                  {(() => {
                    const nextStatus = getNextStatus(order.status)
                    if (!nextStatus) return null
                    
                    const nextStatusConfig = statusConfig[nextStatus]
                    return (
                    <button
                        onClick={() => handleStatusUpdate(orderId, nextStatus)}
                      className="flex-1 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-95 group-hover:scale-105 lg:px-2 lg:py-1.5 lg:text-[10px]"
                    >
                        <span className="lg:hidden">Next: {nextStatusConfig.label}</span>
                        <span className="hidden lg:inline">{nextStatusConfig.label}</span>
                    </button>
                    )
                  })()}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="View Details"
                  >
                    <IoDocumentTextOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </button>
                  <a
                    href={`tel:${order.patientPhone}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="Call Patient"
                  >
                    <IoCallOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </a>
                  <a
                    href={`mailto:${order.patientEmail}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-blue-500 hover:bg-blue-500 hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="Email Patient"
                  >
                    <IoMailOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </a>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            loading={loading}
          />
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseCircleOutline className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Patient Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrder.patientName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.patientPhone}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.patientEmail}</p>
                </div>
              </div>
              {selectedOrder.tests && selectedOrder.tests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Tests</h3>
                  <ul className="space-y-2">
                    {selectedOrder.tests.map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testPrice = typeof test === 'object' && test.price ? test.price : 0
                      return (
                        <li key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <IoFlaskOutline className="h-4 w-4 text-[#11496c]" />
                            <span className="font-medium">{testName}</span>
                          </div>
                          {testPrice > 0 && (
                            <p className="font-semibold">{formatCurrency(testPrice)}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryOrders

