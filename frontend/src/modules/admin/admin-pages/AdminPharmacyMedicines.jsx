import { useState, useEffect } from 'react'
import {
  IoMedicalOutline,
  IoSearchOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { getPharmacyMedicines } from '../admin-services/adminService'
import Pagination from '../../../components/Pagination'

const AdminPharmacyMedicines = () => {
  const [pharmacyList, setPharmacyList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [currentMedicinePage, setCurrentMedicinePage] = useState(1)
  const [totalMedicinePages, setTotalMedicinePages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadPharmacyAvailability()
  }, [])

  const loadPharmacyAvailability = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all pharmacy medicines
      const response = await getPharmacyMedicines({ limit: 1000 })
      
      if (response.success && response.data) {
        const medicines = response.data.items || response.data || []
        
        // Group medicines by pharmacy
        const pharmacyMap = new Map()
        
        medicines.forEach((medicine) => {
          const pharmacy = medicine.pharmacyId || {}
          const pharmacyId = pharmacy._id || pharmacy.id || 'unknown'
          
          if (!pharmacyMap.has(pharmacyId)) {
            pharmacyMap.set(pharmacyId, {
              pharmacyId,
              pharmacyName: pharmacy.pharmacyName || 'Unknown Pharmacy',
              address: pharmacy.address || {},
              medicines: [],
              lastUpdated: null,
            })
          }
          
          const pharmacyData = pharmacyMap.get(pharmacyId)
          pharmacyData.medicines.push({
            name: medicine.name || '',
            dosage: medicine.dosage || '',
            manufacturer: medicine.manufacturer || '',
            quantity: medicine.quantity || 0,
            price: medicine.price || 0,
            expiryDate: medicine.expiryDate || null,
            _id: medicine._id || medicine.id,
          })
          
          // Update last updated if this medicine was updated more recently
          const medicineUpdated = medicine.updatedAt || medicine.createdAt
          if (medicineUpdated) {
            if (!pharmacyData.lastUpdated || new Date(medicineUpdated) > new Date(pharmacyData.lastUpdated)) {
              pharmacyData.lastUpdated = medicineUpdated
            }
          }
        })
        
        // Convert map to array
        const availabilityList = Array.from(pharmacyMap.values())
    setPharmacyList(availabilityList)
      }
    } catch (err) {
      console.error('Error loading pharmacy medicines:', err)
      setError(err.message || 'Failed to load pharmacy medicines')
      setPharmacyList([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPharmacies = pharmacyList.filter(pharmacy =>
    pharmacy.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.medicines.some(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Paginated filtered pharmacies
  const paginatedFilteredPharmacies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredPharmacies.slice(startIndex, endIndex)
  }, [filteredPharmacies, currentPage, itemsPerPage])

  // Paginated selected pharmacy medicines
  const paginatedSelectedPharmacyMedicines = useMemo(() => {
    if (!selectedPharmacy) return []
    const startIndex = (currentMedicinePage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return selectedPharmacy.medicines.slice(startIndex, endIndex)
  }, [selectedPharmacy, currentMedicinePage, itemsPerPage])

  // Update pagination state
  useEffect(() => {
    if (selectedPharmacy) {
      const totalMedicines = selectedPharmacy.medicines.length
      setTotalMedicinePages(Math.ceil(totalMedicines / itemsPerPage) || 1)
    } else {
      const totalPharmacies = filteredPharmacies.length
      setTotalPages(Math.ceil(totalPharmacies / itemsPerPage) || 1)
      setTotalItems(totalPharmacies)
    }
  }, [filteredPharmacies, selectedPharmacy, itemsPerPage])

  // Reset medicine page when pharmacy changes
  useEffect(() => {
    setCurrentMedicinePage(1)
  }, [selectedPharmacy])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return dateString
    }
  }

  if (selectedPharmacy) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        {/* Back Button and Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedPharmacy(null)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selectedPharmacy.pharmacyName}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {selectedPharmacy.medicines.length} {selectedPharmacy.medicines.length === 1 ? 'medicine' : 'medicines'} available
            </p>
          </div>
        </div>

        {/* Last Updated */}
        {selectedPharmacy.lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <IoTimeOutline className="h-4 w-4" />
            <span>Last updated: {formatDate(selectedPharmacy.lastUpdated)}</span>
          </div>
        )}

        {/* Medicines List */}
        <div className="space-y-3">
          {selectedPharmacy.medicines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">No medicines listed</p>
              <p className="mt-1 text-xs text-slate-500">This pharmacy hasn't added any medicines yet</p>
            </div>
          ) : (
            selectedPharmacy.medicines.map((medicine, index) => (
              <article
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                    <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{medicine.name}</h3>
                    <p className="text-sm text-slate-600 mb-1">Dosage: {medicine.dosage}</p>
                    {medicine.manufacturer && (
                      <p className="text-xs text-slate-500 mb-2">Manufacturer: {medicine.manufacturer}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700">Quantity:</span>
                        <span>{medicine.quantity}</span>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700">Price:</span>
                        <span className="text-[#11496c] font-bold">
                          {formatCurrency(parseFloat(medicine.price))}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        
        {/* Pagination for Selected Pharmacy Medicines */}
        {selectedPharmacy.medicines.length > itemsPerPage && (
          <div className="mt-4">
            <Pagination
              currentPage={currentMedicinePage}
              totalPages={totalMedicinePages}
              totalItems={selectedPharmacy.medicines.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentMedicinePage}
              loading={loading}
            />
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pharmacy Medicines</h1>
        <p className="text-sm text-slate-600 mt-1">View available medicines from all pharmacies</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by pharmacy name or medicine..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
              <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Total Pharmacies</p>
              <p className="text-2xl font-bold text-slate-900">{pharmacyList.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <IoCheckmarkCircleOutline className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Total Medicines</p>
              <p className="text-2xl font-bold text-slate-900">
                {pharmacyList.reduce((sum, ph) => sum + ph.medicines.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <IoTimeOutline className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Active Listings</p>
              <p className="text-2xl font-bold text-slate-900">
                {pharmacyList.filter(ph => ph.medicines.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pharmacies List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-600">Loading pharmacy medicines...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-600">Error: {error}</p>
            <button
              onClick={loadPharmacyAvailability}
              className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              {searchTerm ? 'No pharmacies found' : 'No pharmacies have added medicines yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm ? 'Try a different search term' : 'Pharmacies will appear here once they add their medicines'}
            </p>
          </div>
        ) : (
          filteredPharmacies.map((pharmacy) => (
            <article
              key={pharmacy.pharmacyId}
              onClick={() => setSelectedPharmacy(pharmacy)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[rgba(17,73,108,0.3)] hover:shadow-md cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                  <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 mb-1">{pharmacy.pharmacyName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <IoMedicalOutline className="h-3 w-3" />
                          <span className="font-semibold text-slate-700">{pharmacy.medicines.length}</span>
                          <span>{pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'} available</span>
                        </span>
                        {pharmacy.lastUpdated && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <IoTimeOutline className="h-3 w-3" />
                              <span>Updated {formatDate(pharmacy.lastUpdated)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                  </div>
                  
                  {/* Sample Medicines Preview */}
                  {pharmacy.medicines.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pharmacy.medicines.slice(0, 3).map((med, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                        >
                          <IoMedicalOutline className="h-3 w-3" />
                          {med.name} ({med.dosage})
                        </span>
                      ))}
                      {pharmacy.medicines.length > 3 && (
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                          +{pharmacy.medicines.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {!loading && paginatedFilteredPharmacies.length > 0 && (
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

export default AdminPharmacyMedicines

