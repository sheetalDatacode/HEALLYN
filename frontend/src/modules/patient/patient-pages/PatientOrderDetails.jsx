import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
} from 'react-icons/io5'
import { getPatientOrderById } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

const statusFlowLab = [
  'pending',
  'visit_time',
  'lab_assistant_is_arriving',
  'sample_collected',
  'being_tested',
  'reports_being_generated',
  'test_successful',
  'reports_updated',
  'completed',
]

const statusFlowPharmacy = [
  'pending',
  'prescription_received',
  'medicine_collected',
  'packed',
  'ready_to_be_picked',
  'picked_up',
  'delivered',
  'completed',
]

const getStatusColor = (status) => {
  switch (status) {
    case 'payment_pending':
      return 'bg-blue-100 text-blue-700'
    case 'payment_confirmed':
      return 'bg-emerald-100 text-emerald-700'
    case 'pending':
    case 'new':
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
    case 'sample_collected':
      return 'bg-purple-100 text-purple-700'
    case 'being_tested':
      return 'bg-indigo-100 text-indigo-700'
    case 'reports_being_generated':
      return 'bg-cyan-100 text-cyan-700'
    case 'test_successful':
    case 'reports_updated':
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'delivery_requested':
    case 'patient_arrived':
      return 'bg-amber-100 text-amber-700'
    case 'delivered':
      return 'bg-purple-100 text-purple-700'
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
    case 'pending':
    case 'new':
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
    case 'visit_time':
      return 'You can now visit the lab'
    case 'lab_assistant_is_arriving':
      return 'Lab assistant is arriving'
    case 'sample_collected':
      return 'Sample Collected'
    case 'being_tested':
      return 'Being Tested'
    case 'reports_being_generated':
      return 'Reports Being Generated'
    case 'test_successful':
      return 'Test Successful'
    case 'reports_updated':
      return 'Reports Updated'
    case 'accepted':
      return 'Order Accepted'
    case 'processing':
      return 'Processing'
    case 'ready':
      return 'Ready'
    case 'delivery_requested':
      return 'Delivery Requested'
    case 'delivered':
      return 'Delivered'
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
    case 'cancelled':
      return <IoCloseCircleOutline className="h-3.5 w-3.5" />
    case 'visit_time':
      return <IoCalendarOutline className="h-3.5 w-3.5" />
    case 'being_tested':
      return <IoFlaskOutline className="h-3.5 w-3.5" />
    case 'reports_being_generated':
      return <IoDocumentTextOutline className="h-3.5 w-3.5" />
    default:
      return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
  }
}

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
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

const formatTime = (dateString) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    return ''
  }
}

const buildTimeline = (type, currentStatus) => {
  const flow = type === 'lab' ? statusFlowLab : statusFlowPharmacy
  const currentIndex = flow.indexOf(currentStatus)
  return flow.map((step, idx) => ({
    key: step,
    label: getStatusLabel(step),
    completed: currentIndex >= idx,
    current: currentIndex === idx,
  }))
}

const PatientOrderDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      // If we already have order from navigation state, use it while fetching latest
      if (order) {
        setLoading(false)
      }
      try {
        setError(null)
        const response = await getPatientOrderById(id)
        if (response.success && response.data) {
          const data = response.data
          const providerAddress = data.providerId?.address || data.providerAddress || data.provider?.address || null

          setOrder({
            id: data._id || data.id,
            _id: data._id || data.id,
            type: data.providerType === 'laboratory' ? 'lab' : 'pharmacy',
            status: data.status || 'pending',
            amount: data.totalAmount || data.amount || 0,
            createdAt: data.createdAt,
            tests: data.items?.map(i => i.name) || [],
            providerName:
              data.providerId?.labName ||
              data.providerId?.pharmacyName ||
              data.providerId?.name ||
              order?.providerName ||
              'Provider',
            providerAddress: providerAddress || order?.providerAddress,
            // For lab visit show lab address; for home, use delivery address
            address: data.deliveryOption === 'pickup'
              ? (providerAddress || data.address || data.deliveryAddress || '')
              : (data.deliveryAddress || data.address || providerAddress || ''),
            deliveryType: data.deliveryOption || 'home',
            collectionType: data.deliveryOption === 'pickup' ? 'lab' : 'home',
            patient: data.patientId,
            provider: data.providerId,
          })
        }
      } catch (err) {
        console.error('Error fetching order details:', err)
        setError(err.message || 'Failed to load order details')
        // If we have state order, keep showing it even if API 404
        if (!order) {
          toast.error('Failed to load order details')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id, toast])

  const timeline = useMemo(() => {
    if (!order) return []
    return buildTimeline(order.type, order.status)
  }, [order])

  if (loading) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <p className="text-sm text-slate-600">Loading order details...</p>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <p className="text-sm text-red-600">Failed to load order details.</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <IoArrowBackOutline className="h-4 w-4" />
          Back
        </button>
      </section>
    )
  }

  const isLab = order.type === 'lab'

  return (
    <section className="flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <IoArrowBackOutline className="h-4 w-4" />
          Back
        </button>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="text-sm font-semibold text-slate-900 break-all">{order._id}</p>
            <p className="text-xs text-slate-500">Type</p>
            <p className="text-sm font-semibold text-slate-900">{isLab ? 'Laboratory' : 'Pharmacy'}</p>
            {isLab && order.collectionType === 'lab' && (
              <>
                <p className="text-xs text-slate-500 mt-1">Laboratory Name</p>
                <p className="text-sm font-semibold text-slate-900 break-words">{order.providerName || 'Laboratory'}</p>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-500">Amount</p>
            <p className="text-xl font-bold text-slate-900">₹{order.amount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
              <IoCalendarOutline className="h-3.5 w-3.5" />
              {formatDate(order.createdAt)}
              <IoTimeOutline className="h-3.5 w-3.5" />
              {formatTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isLab && order.collectionType === 'lab' && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Lab Address</p>
              <p className="text-sm text-slate-800 break-words">
                {order.address
                  ? (typeof order.address === 'object'
                    ? [order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode].filter(Boolean).join(', ')
                    : order.address)
                  : (order.providerAddress
                    ? (typeof order.providerAddress === 'object'
                      ? [order.providerAddress.line1, order.providerAddress.line2, order.providerAddress.city, order.providerAddress.state, order.providerAddress.postalCode].filter(Boolean).join(', ')
                      : order.providerAddress)
                    : '—')}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-slate-500">{isLab ? 'Collection' : 'Delivery'}</p>
            <p className="text-sm font-semibold text-slate-800">
              {isLab
                ? (order.collectionType === 'home' ? 'Home Collection' : 'Lab Visit')
                : (order.deliveryType === 'home' ? 'Home Delivery' : 'Pickup')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          {isLab ? <IoFlaskOutline className="h-4 w-4 text-[#11496c]" /> : <IoBagHandleOutline className="h-4 w-4 text-[#11496c]" />}
          {isLab ? 'Tests' : 'Medicines'}
        </h3>
        {order.tests && order.tests.length > 0 ? (
          <ul className="space-y-1">
            {order.tests.map((test, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-slate-800">
                <IoCheckmarkCircleOutline className="h-4 w-4 text-emerald-600" />
                <span>{typeof test === 'string' ? test : test.name || test.testName || 'Item'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No items listed.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <IoDocumentTextOutline className="h-4 w-4 text-[#11496c]" />
          Order Timeline
        </h3>
        <div className="space-y-2">
          {timeline.map((step) => (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${step.completed ? 'bg-emerald-600' : 'bg-slate-300'}`}></div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(step.key)}`}>
                  {getStatusIcon(step.key)}
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PatientOrderDetails

