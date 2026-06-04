import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  IoFlaskOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoArrowForwardOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoCloseOutline,
  IoMedicalOutline,
} from 'react-icons/io5'
import { getLaboratoryOrders } from '../laboratory-services/laboratoryService'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (error) {
    return dateString
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'new':
      return 'bg-[rgba(17,73,108,0.15)] text-[#11496c] border-[rgba(17,73,108,0.2)]'
    case 'home_collection_requested':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'sample_collected':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'test_completed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'report_uploaded':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'new':
      return 'New Order'
    case 'home_collection_requested':
      return 'Collection Requested'
    case 'sample_collected':
      return 'Sample Collected'
    case 'test_completed':
      return 'Test Completed'
    case 'report_uploaded':
      return 'Report Ready'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'new':
    case 'home_collection_requested':
      return <IoTimeOutline className="h-3.5 w-3.5" />
    case 'sample_collected':
    case 'test_completed':
      return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
    case 'report_uploaded':
      return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
    case 'cancelled':
      return <IoCloseCircleOutline className="h-3.5 w-3.5" />
    default:
      return null
  }
}

const getStatusSteps = (status) => {
  const allSteps = [
    { key: 'new', label: 'Order Placed' },
    { key: 'home_collection_requested', label: 'Collection Scheduled' },
    { key: 'sample_collected', label: 'Sample Collected' },
    { key: 'test_completed', label: 'Test Completed' },
    { key: 'report_uploaded', label: 'Report Ready' },
  ]

  const statusOrder = {
    new: 0,
    home_collection_requested: 1,
    sample_collected: 2,
    test_completed: 3,
    report_uploaded: 4,
    cancelled: -1,
  }

  const currentStep = statusOrder[status] ?? 0

  return allSteps.map((step, index) => ({
    ...step,
    completed: index <= currentStep,
    current: index === currentStep,
  }))
}

const LaboratoryPatientOrders = () => {
  const [filter, setFilter] = useState('all') // 'all', 'home', 'lab'
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await getLaboratoryOrders()
      const ordersData = Array.isArray(response) ? response : (response.data || response.orders || [])
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => {
        const collectionType = order.collectionType || order.collection?.type || 'lab'
        return filter === 'home' ? collectionType === 'home' : collectionType === 'lab'
      })

  const patientHistory = selectedOrder ? orders.filter(order => 
    (order.patientId === selectedOrder.patientId || order.patient?.id === selectedOrder.patient?.id) &&
    order.id !== selectedOrder.id && order._id !== selectedOrder._id
  ).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) : []

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'home', label: 'Home Collection' },
          { key: 'lab', label: 'Lab Test' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-[#11496c] text-white shadow-md shadow-[rgba(17,73,108,0.3)]'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-[rgba(17,73,108,0.3)] hover:bg-[rgba(17,73,108,0.05)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#11496c] border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm font-medium text-slate-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoFlaskOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No orders found</p>
            <p className="text-xs text-slate-400 mt-1">Orders will appear here</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusSteps = getStatusSteps(order.status)
            return (
              <article
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
              >
                {/* Patient Info */}
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={order.patientImage || order.patient?.image || order.patient?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientName || order.patient?.name || 'Patient')}&background=3b82f6&color=fff&size=128&bold=true`}
                    alt={order.patientName || order.patient?.name || 'Patient'}
                    className="h-12 w-12 rounded-xl object-cover bg-slate-100"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientName || order.patient?.name || 'Patient')}&background=3b82f6&color=fff&size=128&bold=true`
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900">{order.patientName || order.patient?.name || 'Patient'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Order ID: {order.orderId || order.id || order._id}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Info */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <IoFlaskOutline className="h-4 w-4 text-[#11496c]" />
                    <p className="text-sm font-semibold text-slate-900">{order.testName || order.test?.name || 'Test'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <IoCalendarOutline className="h-3.5 w-3.5" />
                      <span>{formatDate(order.date || order.createdAt || order.orderDate)}</span>
                    </div>
                    {order.time && (
                      <div className="flex items-center gap-1.5">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span>{order.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {(order.collectionType || order.collection?.type) === 'home' ? (
                        <IoHomeOutline className="h-3.5 w-3.5" />
                      ) : (
                        <IoLocationOutline className="h-3.5 w-3.5" />
                      )}
                      <span className="capitalize">{(order.collectionType || order.collection?.type) === 'home' ? 'Home Collection' : 'Lab Visit'}</span>
                    </div>
                  </div>
                  {(order.collectionType || order.collection?.type) === 'home' && order.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-600">
                      <IoLocationOutline className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{order.address || order.collection?.address}</span>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="mb-4 pt-4 border-t border-slate-200">
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#11496c] to-[#0d3a52] transition-all duration-500"
                        style={{
                          width: `${(statusSteps.filter(s => s.completed).length / statusSteps.length) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {statusSteps.map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                              step.completed
                                ? 'bg-[#11496c] border-[#11496c] text-white'
                                : step.current
                                ? 'bg-white border-[#11496c] text-[#11496c]'
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}
                          >
                            {step.completed ? (
                              <IoCheckmarkCircleOutline className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>
                          <p
                            className={`mt-2 text-[10px] font-medium text-center max-w-[60px] ${
                              step.completed || step.current
                                ? 'text-[#11496c]'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-600">Amount</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(order.amount)}</span>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoPersonOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Patient Details</h2>
                    <p className="text-xs text-white/80">Order: {selectedOrder.orderId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Patient Profile */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
                <img
                  src={selectedOrder.patientImage || selectedOrder.patient?.image || selectedOrder.patient?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedOrder.patientName || selectedOrder.patient?.name || 'Patient')}&background=11496c&color=fff&size=160&bold=true`}
                  alt={selectedOrder.patientName || selectedOrder.patient?.name || 'Patient'}
                  className="h-20 w-20 rounded-xl object-cover bg-white shadow-sm border-2 border-white"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedOrder.patientName || selectedOrder.patient?.name || 'Patient')}&background=11496c&color=fff&size=160&bold=true`
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{selectedOrder.patientName || selectedOrder.patient?.name || 'Patient'}</h3>
                  {(selectedOrder.patientAge || selectedOrder.patient?.age || selectedOrder.patientGender || selectedOrder.patient?.gender) && (
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedOrder.patientAge || selectedOrder.patient?.age || ''} {selectedOrder.patientAge || selectedOrder.patient?.age ? 'years' : ''}{selectedOrder.patientAge && selectedOrder.patientGender ? ', ' : ''}{selectedOrder.patientGender || selectedOrder.patient?.gender || ''}
                    </p>
                  )}
                  <div className="mt-3 space-y-2">
                    {(selectedOrder.patientPhone || selectedOrder.patient?.phone) && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <IoCallOutline className="h-4 w-4 text-[#11496c]" />
                        <a href={`tel:${selectedOrder.patientPhone || selectedOrder.patient?.phone}`} className="hover:text-[#11496c]">
                          {selectedOrder.patientPhone || selectedOrder.patient?.phone}
                        </a>
                      </div>
                    )}
                    {(selectedOrder.patientEmail || selectedOrder.patient?.email) && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <IoMailOutline className="h-4 w-4 text-[#11496c]" />
                        <a href={`mailto:${selectedOrder.patientEmail || selectedOrder.patient?.email}`} className="hover:text-[#11496c]">
                          {selectedOrder.patientEmail || selectedOrder.patient?.email}
                        </a>
                      </div>
                    )}
                    {(selectedOrder.patientAddress || selectedOrder.patient?.address) && (
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                        <IoLocationOutline className="h-4 w-4 text-[#11496c] mt-0.5 shrink-0" />
                        <div>
                          {selectedOrder.patientAddress?.line1 || selectedOrder.patient?.address?.line1 ? (
                            <>
                              <p>{selectedOrder.patientAddress?.line1 || selectedOrder.patient?.address?.line1}</p>
                              {selectedOrder.patientAddress?.line2 && <p>{selectedOrder.patientAddress.line2}</p>}
                              <p>{selectedOrder.patientAddress?.city || selectedOrder.patient?.address?.city || ''}, {selectedOrder.patientAddress?.state || selectedOrder.patient?.address?.state || ''} {selectedOrder.patientAddress?.postalCode || selectedOrder.patient?.address?.postalCode || ''}</p>
                            </>
                          ) : (
                            <p>{typeof selectedOrder.patientAddress === 'string' ? selectedOrder.patientAddress : (selectedOrder.patient?.address || 'Address not provided')}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Order Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <IoFlaskOutline className="h-4 w-4 text-[#11496c]" />
                  Current Test Order
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Test Name:</span>
                    <span className="font-semibold text-slate-900">{selectedOrder.testName || selectedOrder.test?.name || 'Test'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Order Date:</span>
                    <span className="font-semibold text-slate-900">{formatDate(selectedOrder.date || selectedOrder.createdAt || selectedOrder.orderDate)}</span>
                  </div>
                  {selectedOrder.time && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Time:</span>
                      <span className="font-semibold text-slate-900">{selectedOrder.time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Collection Type:</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {(selectedOrder.collectionType || selectedOrder.collection?.type) === 'home' ? 'Home Collection' : 'Lab Visit'}
                    </span>
                  </div>
                  {selectedOrder.doctorName && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Prescribed by:</span>
                      <span className="font-semibold text-slate-900">{selectedOrder.doctorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(selectedOrder.amount || selectedOrder.totalAmount || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <IoMedicalOutline className="h-4 w-4 text-[#11496c]" />
                  Order Status
                </h4>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-[#11496c] to-[#0d3a52] rounded-full transition-all duration-500"
                      style={{
                        width: `${(getStatusSteps(selectedOrder.status).filter(s => s.completed).length / getStatusSteps(selectedOrder.status).length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {getStatusSteps(selectedOrder.status).map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                            step.completed
                              ? 'bg-[#11496c] border-[#11496c] text-white'
                              : step.current
                              ? 'bg-white border-[#11496c] text-[#11496c]'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {step.completed ? (
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        <p
                          className={`mt-2 text-[10px] font-medium text-center max-w-[70px] ${
                            step.completed || step.current
                              ? 'text-[#11496c]'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient History */}
              {patientHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <IoDocumentTextOutline className="h-4 w-4 text-[#11496c]" />
                    Patient History ({patientHistory.length} orders)
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {patientHistory.map((historyOrder) => (
                      <div
                        key={historyOrder.id}
                        className={`p-3 rounded-lg border ${
                          historyOrder.id === selectedOrder.id
                            ? 'bg-[rgba(17,73,108,0.1)] border-[#11496c]'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{historyOrder.testName || historyOrder.test?.name || 'Test'}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                              <span>{formatDate(historyOrder.date || historyOrder.createdAt || historyOrder.orderDate)}</span>
                              {historyOrder.time && <span>{historyOrder.time}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(historyOrder.status)}`}>
                              {getStatusIcon(historyOrder.status)}
                              {getStatusLabel(historyOrder.status)}
                            </span>
                            <p className="text-xs font-semibold text-emerald-600 mt-1">{formatCurrency(historyOrder.amount || historyOrder.totalAmount || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryPatientOrders

