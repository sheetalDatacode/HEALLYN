import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoFlaskOutline,
  IoBagHandleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5'
import { getPatientOrders } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Default orders (will be replaced by API data)
const defaultOrders = []

const PatientOrders = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [orders, setOrders] = useState(defaultOrders)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientOrders()

        if (response.success && response.data) {
          // Backend returns orders in response.data.items
          const ordersData = Array.isArray(response.data)
            ? response.data
            : response.data.items || response.data.orders || []

          

          // Transform API data to match component structure
          const transformed = (ordersData || []).map(order => ({
            id: order._id || order.id,
            _id: order._id || order.id,
            type: order.providerType === 'laboratory' ? 'lab' : (order.providerType || order.type || 'pharmacy'),
            labName: order.providerType === 'laboratory'
              ? (order.providerId?.labName || order.providerId?.name || 'Laboratory')
              : undefined,
            pharmacyName: order.providerType === 'pharmacy'
              ? 'Prescription Medicines'
              : undefined,
            testName: order.providerType === 'laboratory' && order.items?.length > 0
              ? order.items.map(item => item.name || item.testName).join(', ')
              : undefined,
            medicineName: order.providerType === 'pharmacy' && order.items?.length > 0
              ? order.items.map(item => item.name || item.medicineName).join(', ')
              : undefined,
            status: order.status || 'new',
            amount: order.totalAmount || order.amount || 0,
            date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            collectionType: order.deliveryOption === 'pickup' ? 'lab' : 'home',
            deliveryType: order.deliveryOption === 'home_delivery' ? 'home' : (order.deliveryOption === 'pickup' ? 'pickup' : 'home'),
            address: (() => {
              // Hide address for pharmacy orders completely
              if (order.providerType === 'pharmacy') return ''

              // Prefer delivery address, then order address, then provider address
              const formatAddr = (addr) => {
                if (!addr) return ''
                if (typeof addr === 'string') return addr
                return [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')
              }
              return (
                formatAddr(order.deliveryAddress) ||
                formatAddr(order.address) ||
                formatAddr(order.providerId?.address) ||
                ''
              )
            })(),
            prescriptionId: order.prescriptionId || order.prescription?.id || null,
            originalData: order,
          }))

          setOrders(transformed)
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err.message || 'Failed to load orders')
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders

    return orders.filter(order => {
      switch (filter) {
        case 'pharmacy':
          return order.type === 'pharmacy'
        case 'lab':
          return order.type === 'lab'
        case 'active':
          return ['new', 'accepted', 'confirmed', 'processing', 'ready', 'payment_pending', 'payment_confirmed', 'prescription_received', 'medicine_collected', 'packed', 'ready_to_be_picked'].includes(order.status)
        case 'completed':
          return ['delivered', 'test_completed', 'report_uploaded', 'completed', 'picked_up'].includes(order.status)
        default:
          return true
      }
    })
  }, [orders, filter])

  // Calculate paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const totalItems = filteredOrders.length

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // Show loading state
  if (loading) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-slate-700">Loading orders...</p>
        </div>
      </section>
    )
  }

  // Show error state
  if (error) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-red-700">Error loading orders</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </div>
      </section>
    )
  }

  // Legacy localStorage loading removed - using API now

  const getStatusColor = (status) => {
    switch (status) {
      case 'payment_pending':
        return 'bg-blue-100 text-blue-700'
      case 'payment_confirmed':
        return 'bg-emerald-100 text-emerald-700'
      case 'new':
      case 'pending':
        return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
      case 'prescription_received':
        return 'bg-blue-100 text-blue-700'
      case 'medicine_collected':
        return 'bg-indigo-100 text-indigo-700'
      case 'packed':
        return 'bg-purple-100 text-purple-700'
      case 'ready_to_be_picked':
        return 'bg-cyan-100 text-cyan-700'
      case 'picked_up':
        return 'bg-emerald-100 text-emerald-700'
      case 'accepted':
        return 'bg-indigo-100 text-indigo-700'
      case 'visit_time':
        return 'bg-blue-100 text-blue-700'
      case 'home_collection_requested':
      case 'patient_arrived':
      case 'delivery_requested':
        return 'bg-amber-100 text-amber-700'
      case 'sample_collected':
      case 'delivered':
        return 'bg-purple-100 text-purple-700'
      case 'being_tested':
        return 'bg-indigo-100 text-indigo-700'
      case 'reports_being_generated':
        return 'bg-cyan-100 text-cyan-700'
      case 'test_completed':
      case 'test_successful':
        return 'bg-emerald-100 text-emerald-700'
      case 'report_uploaded':
      case 'reports_updated':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'payment_pending':
        return 'Payment Pending'
      case 'payment_confirmed':
        return 'Payment Confirmed'
      // Lab statuses - new flow
      case 'new':
      case 'pending':
        return 'Pending'
      case 'prescription_received':
        return 'Prescription Received'
      case 'medicine_collected':
        return 'Medicine Collected'
      case 'packed':
        return 'Packed'
      case 'ready_to_be_picked':
        return 'Ready to be Picked'
      case 'picked_up':
        return 'Picked Up'
      case 'accepted':
        return 'Order Accepted'
      case 'visit_time':
        return 'You can now visit the lab'
      case 'lab_assistant_is_arriving':
        return 'Lab assistant is arriving'
      case 'home_collection_requested':
        return 'Collection Requested'
      case 'sample_collected':
        return 'Sample Collected'
      case 'being_tested':
        return 'Being Tested'
      case 'reports_being_generated':
        return 'Reports Being Generated'
      case 'test_completed':
      case 'test_successful':
        return 'Test Successful'
      case 'report_uploaded':
      case 'reports_updated':
        return 'Reports Updated'
      // Pharmacy statuses
      case 'patient_arrived':
        return 'Patient Arrived'
      case 'delivery_requested':
        return 'Delivery Requested'
      case 'delivered':
        return 'Delivered'
      // Common statuses
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'payment_pending':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'payment_confirmed':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'new':
      case 'pending':
      case 'home_collection_requested':
      case 'patient_arrived':
      case 'delivery_requested':
      case 'lab_assistant_is_arriving':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'visit_time':
        return <IoCalendarOutline className="h-3.5 w-3.5" />
      case 'sample_collected':
      case 'delivered':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'being_tested':
        return <IoFlaskOutline className="h-3.5 w-3.5" />
      case 'reports_being_generated':
        return <IoDocumentTextOutline className="h-3.5 w-3.5" />
      case 'test_completed':
      case 'test_successful':
      case 'report_uploaded':
      case 'reports_updated':
      case 'completed':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3.5 w-3.5" />
      default:
        return null
    }
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

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-100 w-fit overflow-x-auto max-w-full no-scrollbar mb-2">
        {['all', 'lab', 'pharmacy'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`shrink-0 px-5 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${filter === type
              ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20'
              : 'text-slate-500 hover:text-[#11496c] hover:bg-slate-50'
              }`}
          >
            {type === 'all' ? 'All Orders' : type === 'lab' ? 'Lab Tests' : 'Pharmacy'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {paginatedOrders.map((order) => (
          <article
            key={order.id}
            className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-xl hover:shadow-[#11496c]/5 cursor-pointer active:scale-[0.98]"
            onClick={() => {
              const orderIdToUse = order._id || order.id || order.originalData?._id || order.originalData?.id
              if (!orderIdToUse) return
              navigate(`/patient/orders/${orderIdToUse}`, { state: { order } })
            }}
          >
            <div className="flex items-start gap-5">
              {/* Type Icon with Gradient */}
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-white shadow-lg"
                style={order.type === 'lab'
                  ? { background: 'linear-gradient(135deg, #11496c 0%, #14B8A6 100%)' }
                  : { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }
                }
              >
                {order.type === 'lab' ? (
                  <IoFlaskOutline className="h-8 w-8" />
                ) : (
                  <IoBagHandleOutline className="h-8 w-8" />
                )}
              </div>

              {/* Order Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate">
                      {order.type === 'lab' ? order.labName : order.pharmacyName}
                    </h3>
                    <p className="text-xs font-bold text-[#11496c] mt-0.5 truncate uppercase tracking-wider">
                      {order.type === 'lab' ? order.testName : order.medicineName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-slate-900 leading-none">₹{order.amount}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Total</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                    {getStatusLabel(order.status)}
                  </span>
                  {order.type === 'lab' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
                      {order.collectionType === 'home' ? '🏠 Home Visit' : '🏥 Lab Visit'}
                    </span>
                  )}
                </div>

                {/* Date & Location Footer */}
                <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <IoCalendarOutline className="h-4 w-4" />
                        {formatDate(order.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <IoTimeOutline className="h-4 w-4" />
                        {order.time}
                      </span>
                    </div>
                    {order.deliveryType && (
                      <span className="capitalize">{order.deliveryType} Delivery</span>
                    )}
                  </div>
                  
                  {order.address && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium italic">
                      <IoLocationOutline className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{order.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Hover Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
              <IoChevronForwardOutline className="h-5 w-5 text-slate-400" />
            </div>
          </article>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            {filter === 'lab' ? (
              <IoFlaskOutline className="h-8 w-8" />
            ) : filter === 'pharmacy' ? (
              <IoBagHandleOutline className="h-8 w-8" />
            ) : (
              <IoDocumentTextOutline className="h-8 w-8" />
            )}
          </div>
          <p className="text-lg font-semibold text-slate-700">No orders found</p>
          <p className="text-sm text-slate-500">Try selecting a different filter</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && totalPages > 1 && (
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

export default PatientOrders

