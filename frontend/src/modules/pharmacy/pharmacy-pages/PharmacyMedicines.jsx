import { useState, useEffect, useMemo } from 'react'
import {
  IoAddOutline,
  IoCloseOutline,
  IoSearchOutline,
  IoMedicalOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoBagHandleOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5'
import { getPharmacyMedicines, addPharmacyMedicine, updatePharmacyMedicine, deletePharmacyMedicine } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

const PharmacyMedicines = () => {
  const toast = useToast()
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    quantity: '',
    price: '',
    manufacturer: '',
  })

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Fetch medicines from API
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true)
        const response = await getPharmacyMedicines({ 
          page: currentPage,
          limit: itemsPerPage
        })
        
        if (response.success && response.data) {
          // Backend returns medicines in data.items (with pagination)
          const medicinesData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.medicines || []
          
          // Extract pagination info
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
            setTotalItems(response.data.pagination.total || 0)
          } else {
            setTotalPages(1)
            setTotalItems(medicinesData.length)
          }
          
          const transformed = medicinesData.map(med => ({
            id: med._id || med.id,
            name: med.name || '',
            dosage: med.dosage || '',
            quantity: med.quantity || med.stock || 0,
            price: med.price || 0,
            manufacturer: med.manufacturer || '',
            createdAt: med.createdAt || new Date().toISOString(),
            updatedAt: med.updatedAt || new Date().toISOString(),
          }))
          
          setMedicines(transformed)
        } else {
          setMedicines([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching medicines:', err)
        toast.error('Failed to load medicines')
        setMedicines([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchMedicines()
  }, [toast, currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddMedicine = () => {
    setEditingMedicine(null)
    setFormData({
      name: '',
      dosage: '',
      quantity: '',
      price: '',
      manufacturer: '',
    })
    setShowAddModal(true)
  }

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine)
    setFormData({
      name: medicine.name,
      dosage: medicine.dosage,
      quantity: medicine.quantity,
      price: medicine.price,
      manufacturer: medicine.manufacturer || '',
    })
    setShowAddModal(true)
  }

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return
    }

    try {
      await deletePharmacyMedicine(medicineId)
      setMedicines(prev => prev.filter(med => med.id !== medicineId))
      toast.success('Medicine deleted successfully')
    } catch (err) {
      console.error('Error deleting medicine:', err)
      toast.error(err.message || 'Failed to delete medicine')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.dosage.trim() || !formData.quantity.trim() || !formData.price.trim()) {
      toast.warning('Please fill in all required fields')
      return
    }

    try {
      const medicineData = {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        quantity: parseInt(formData.quantity.trim()),
        price: parseFloat(formData.price.trim()),
        manufacturer: formData.manufacturer.trim(),
      }

      if (editingMedicine) {
        // Update existing medicine
        await updatePharmacyMedicine(editingMedicine.id, medicineData)
        setMedicines(prev => prev.map(med =>
          med.id === editingMedicine.id
            ? { ...med, ...medicineData, updatedAt: new Date().toISOString() }
            : med
        ))
        toast.success('Medicine updated successfully')
      } else {
        // Add new medicine
        const response = await addPharmacyMedicine(medicineData)
        if (response.success && response.data) {
          const newMedicine = {
            id: response.data._id || response.data.id,
            ...medicineData,
            createdAt: response.data.createdAt || new Date().toISOString(),
            updatedAt: response.data.updatedAt || new Date().toISOString(),
          }
          setMedicines(prev => [...prev, newMedicine])
          toast.success('Medicine added successfully')
        }
      }

      setShowAddModal(false)
      setFormData({
        name: '',
        dosage: '',
        quantity: '',
        price: '',
        manufacturer: '',
      })
    } catch (err) {
      console.error('Error saving medicine:', err)
      toast.error(err.message || 'Failed to save medicine')
    }
  }

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.manufacturer && med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalMedicines = medicines.length
    const totalStock = medicines.reduce((sum, med) => {
      const qty = parseInt(med.quantity) || 0
      return sum + qty
    }, 0)

    return { totalMedicines, totalStock }
  }, [medicines])

  // Get stock status
  const getStockStatus = (quantity) => {
    const qty = parseInt(quantity) || 0
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', icon: IoAlertCircleOutline }
    if (qty < 50) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: IoAlertCircleOutline }
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: IoCheckmarkCircleOutline }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar and Add Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by medicine name, dosage, or manufacturer..."
            className="w-full h-[42px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[#1a5f7a] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleAddMedicine}
          className="flex items-center justify-center h-[42px] rounded-lg bg-[#11496c] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a54] active:scale-95 shrink-0"
        >
          Add
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="group relative overflow-hidden rounded-lg border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-2.5 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-emerald-200/40 hover:scale-[1.01] hover:border-emerald-300/80">
          <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-emerald-200/40 blur-lg transition-opacity group-hover:opacity-100 opacity-70" />
          <IoMedicalOutline className="relative mx-auto h-5 w-5 text-emerald-600 mb-0.5" />
          <p className="relative text-lg font-bold text-emerald-600">{statistics.totalMedicines}</p>
          <p className="relative text-[10px] font-semibold text-emerald-700">Medicines</p>
        </div>
        <div className="group relative overflow-hidden rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 p-2.5 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-200/40 hover:scale-[1.01] hover:border-blue-300/80">
          <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-blue-200/40 blur-lg transition-opacity group-hover:opacity-100 opacity-70" />
          <IoBagHandleOutline className="relative mx-auto h-5 w-5 text-blue-600 mb-0.5" />
          <p className="relative text-lg font-bold text-blue-600">{statistics.totalStock}</p>
          <p className="relative text-[10px] font-semibold text-blue-700">Total Stock</p>
        </div>
      </div>

      {/* Medicines List - Scrollable Container */}
      <div className="space-y-4">
        <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto space-y-2.5 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-500">Loading medicines...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                {searchTerm ? 'No medicines found' : 'No medicines added yet'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm ? 'Try a different search term' : 'Click "Add Medicine" to get started'}
              </p>
            </div>
          ) : (
            filteredMedicines.map((medicine) => {
            const stockStatus = getStockStatus(medicine.quantity)
            const StatusIcon = stockStatus.icon
            
            return (
              <article
                key={medicine.id}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[rgba(17,73,108,0.2)] hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {/* Medicine Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[rgba(17,73,108,0.1)]">
                    <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                  </div>
                  
                  {/* Medicine Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Medicine Name */}
                        <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-tight">{medicine.name}</h3>
                        
                        {/* Dosage - Line by Line */}
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                          <span className="font-medium">Dosage:</span>
                          <span>{medicine.dosage}</span>
                        </div>

                        {/* Manufacturer - Line by Line */}
                        {medicine.manufacturer && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                            <span className="font-medium">Manufacturer:</span>
                            <span>{medicine.manufacturer}</span>
                          </div>
                        )}

                        {/* Quantity - Line by Line */}
                        <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
                          <span className="font-semibold">Quantity:</span>
                          <span className="text-slate-900">{medicine.quantity} tablets</span>
                        </div>

                        {/* Price per Tablet - Line by Line */}
                        <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
                          <span className="font-semibold">Price per Tablet:</span>
                          <span className="text-slate-600">{formatCurrency(parseFloat(medicine.price))}</span>
                        </div>

                        {/* Total Price - Line by Line */}
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <span className="font-semibold">Total Price:</span>
                          <span className="text-[#11496c] font-bold">
                            {formatCurrency((parseFloat(medicine.quantity) || 0) * (parseFloat(medicine.price) || 0))}
                          </span>
                        </div>
                      </div>
                      
                      {/* Right Side - Status Badge and Action Buttons */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Stock Status Badge - Top Right */}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${stockStatus.color}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {stockStatus.label}
                        </span>
                        
                        {/* Action Buttons - Below Status */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditMedicine(medicine)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] hover:text-[#11496c] active:scale-95"
                            aria-label="Edit medicine"
                          >
                            <IoPencilOutline className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedicine(medicine.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50 active:scale-95"
                            aria-label="Delete medicine"
                          >
                            <IoTrashOutline className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredMedicines.length > 0 && totalPages > 1 && (
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

      {/* Add/Edit Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Close modal"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="e.g., Paracetamol"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="dosage" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dosage"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="e.g., 500mg"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quantity (Tablets) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    required
                    min="1"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    placeholder="e.g., 100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-500">Enter number of tablets/pills</p>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Price per Tablet (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    placeholder="e.g., 2.50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-500">Price for one tablet/pill</p>
                </div>
              </div>
              
              {/* Total Price Display */}
              {(formData.quantity && formData.price) && (
                <div className="rounded-lg border-2 border-[#11496c] bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Total Price:</span>
                    <span className="text-lg font-bold text-[#11496c]">
                      {formatCurrency((parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.quantity} tablets × {formatCurrency(parseFloat(formData.price) || 0)} per tablet
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="e.g., Cipla Ltd"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a54] active:scale-95"
                >
                  {editingMedicine ? 'Update' : 'Add'} Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyMedicines


