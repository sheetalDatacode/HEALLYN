import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoFlaskOutline,
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoBagHandleOutline,
  IoHomeOutline,
} from 'react-icons/io5'
import { getPharmacyServices, addPharmacyService, updatePharmacyService, deletePharmacyService, togglePharmacyService } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Removed mock data - now using backend API

const categoryConfig = {
  prescription: { label: 'Prescription', color: 'bg-[rgba(17,73,108,0.15)] text-[#11496c]', icon: IoBagHandleOutline },
  consultation: { label: 'Consultation', color: 'bg-purple-100 text-purple-700', icon: IoFlaskOutline },
  delivery: { label: 'Delivery', color: 'bg-emerald-100 text-emerald-700', icon: IoHomeOutline },
}

const PharmacyServices = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'prescription',
    price: 0,
    duration: '',
    available: true,
    deliveryOptions: [],
    serviceRadius: 0,
  })

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPharmacyServices({ 
          page: currentPage,
          limit: itemsPerPage
        })
        
        if (response.success && response.data) {
          const servicesData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          
          // Extract pagination info
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
            setTotalItems(response.data.pagination.total || 0)
          } else {
            setTotalPages(1)
            setTotalItems(servicesData.length)
          }
          
          setServices(servicesData)
        } else {
          setServices([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching services:', err)
        setError(err.message || 'Failed to load services')
        toast.error('Failed to load services')
        setServices([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [toast, currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDeliveryOptionToggle = (option) => {
    setFormData((prev) => ({
      ...prev,
      deliveryOptions: prev.deliveryOptions.includes(option)
        ? prev.deliveryOptions.filter((o) => o !== option)
        : [...prev.deliveryOptions, option],
    }))
  }

  const handleSave = async () => {
    try {
      if (editingService) {
        const response = await updatePharmacyService(editingService._id || editingService.id, formData)
        if (response.success) {
          toast.success('Service updated successfully')
          setServices((prev) =>
            prev.map((svc) => (svc._id === editingService._id || svc.id === editingService.id) 
              ? { ...svc, ...formData } 
              : svc)
          )
        }
      } else {
        const response = await addPharmacyService(formData)
        if (response.success) {
          toast.success('Service added successfully')
          setServices((prev) => [...prev, response.data])
        }
      }
      setShowAddModal(false)
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        category: 'prescription',
        price: 0,
        duration: '',
        available: true,
        deliveryOptions: [],
        serviceRadius: 0,
      })
    } catch (err) {
      console.error('Error saving service:', err)
      toast.error(err.message || 'Failed to save service')
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData(service)
    setShowAddModal(true)
  }

  const handleDelete = async (serviceId) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await deletePharmacyService(serviceId)
        if (response.success) {
          toast.success('Service deleted successfully')
          setServices((prev) => prev.filter((svc) => (svc._id || svc.id) !== serviceId))
        }
      } catch (err) {
        console.error('Error deleting service:', err)
        toast.error(err.message || 'Failed to delete service')
      }
    }
  }

  const handleToggleAvailability = async (serviceId) => {
    try {
      const response = await togglePharmacyService(serviceId)
      if (response.success) {
        toast.success(`Service ${response.data.available ? 'enabled' : 'disabled'}`)
        setServices((prev) =>
          prev.map((svc) => ((svc._id || svc.id) === serviceId) 
            ? { ...svc, available: response.data.available } 
            : svc)
        )
      }
    } catch (err) {
      console.error('Error toggling service:', err)
      toast.error(err.message || 'Failed to toggle service')
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Services</h1>
            <p className="text-sm text-slate-600">{services.length} services</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingService(null)
            setFormData({
              name: '',
              description: '',
              category: 'prescription',
              price: 0,
              duration: '',
              available: true,
              deliveryOptions: [],
              serviceRadius: 0,
            })
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
        >
          <IoAddOutline className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-slate-600">Loading services...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-red-600">Error: {error}</p>
          <p className="mt-1 text-xs text-red-500">Please try again later.</p>
        </div>
      )}

      {/* Services List - Scrollable Container */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-600">No services found</p>
                <p className="mt-1 text-xs text-slate-500">Add your first service to get started.</p>
              </div>
            ) : (
              services.map((service) => {
          const categoryInfo = categoryConfig[service.category] || categoryConfig.prescription
          const CategoryIcon = categoryInfo.icon

          return (
            <article
              key={service._id || service.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${categoryInfo.color}`}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailability(service._id || service.id)}
                    className={`rounded-full p-2 transition ${
                      service.available
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {service.available ? (
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                    ) : (
                      <IoCloseCircleOutline className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {service.price === 0 ? 'Free' : service.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1">
                    <IoTimeOutline className="h-4 w-4" />
                    {service.duration}
                  </p>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="flex flex-wrap gap-2">
                {service.deliveryOptions.map((option) => (
                  <span
                    key={option}
                    className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.15)] px-2 py-1 text-[10px] font-medium text-[#11496c]"
                  >
                    {option === 'pickup' ? (
                      <>
                        <IoBagHandleOutline className="h-3 w-3" />
                        Pickup
                      </>
                    ) : (
                      <>
                        <IoHomeOutline className="h-3 w-3" />
                        Delivery
                      </>
                    )}
                  </span>
                ))}
                {service.serviceRadius > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
                    <IoLocationOutline className="h-3 w-3" />
                    {service.serviceRadius} km radius
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <IoPencilOutline className="mr-1 inline h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id || service.id)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <IoTrashOutline className="h-4 w-4" />
                </button>
              </div>
            </article>
            )
          })
          )}
          </div>

          {/* Pagination */}
          {!loading && !error && services.length > 0 && totalPages > 1 && (
            <div className="pt-4 border-t border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => {
            setShowAddModal(false)
            setEditingService(null)
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingService(null)
                }}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                >
                  <option value="prescription">Prescription</option>
                  <option value="consultation">Consultation</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    placeholder="e.g., 30 minutes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Options</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryOptionToggle('pickup')}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      formData.deliveryOptions.includes('pickup')
                        ? 'border-[#11496c] bg-[#11496c] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <IoBagHandleOutline className="h-4 w-4" />
                    Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeliveryOptionToggle('delivery')}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      formData.deliveryOptions.includes('delivery')
                        ? 'border-[#11496c] bg-[#11496c] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <IoHomeOutline className="h-4 w-4" />
                    Delivery
                  </button>
                </div>
              </div>

              {formData.deliveryOptions.includes('delivery') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Service Radius (km)</label>
                  <input
                    type="number"
                    value={formData.serviceRadius}
                    onChange={(e) => handleInputChange('serviceRadius', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    min="0"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => handleInputChange('available', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                />
                <label htmlFor="available" className="text-sm font-medium text-slate-700">
                  Service is currently available
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingService(null)
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
                >
                  {editingService ? 'Update' : 'Add'} Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyServices

