import { useState, useEffect, useMemo } from 'react'
import {
  IoMedicalOutline,
  IoSearchOutline,
  IoBusinessOutline,
  IoBagHandleOutline,
  IoPricetagOutline,
  IoCubeOutline,
  IoCheckmarkCircleOutline,
  IoFlaskOutline,
} from 'react-icons/io5'
import {
  getPharmacyInventory,
  getLaboratoryInventory,
  getPharmacyMedicinesByPharmacy,
  getLaboratoryTestsByLaboratory,
} from '../admin-services/adminService'
import Pagination from '../../../components/Pagination'

const AdminInventory = () => {
  const [pharmacyList, setPharmacyList] = useState([])
  const [labList, setLabList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [selectedLab, setSelectedLab] = useState(null)
  const [activeTab, setActiveTab] = useState('total') // 'total', 'pharmacy' or 'laboratory'
  const [loading, setLoading] = useState(false) // Start with false to show content immediately
  const [error, setError] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    // Create AbortController for request cancellation
    const abortController = new AbortController()
    const signal = abortController.signal

    // Load data with signal
    loadPharmacyInventory(signal)
    loadLaboratoryInventory(signal)

    // Cleanup: cancel all pending requests when component unmounts or navigates away
    return () => {
      abortController.abort()
    }
  }, [])

  const loadPharmacyInventory = async (signal = null) => {
    try {
      setError(null)
      const response = await getPharmacyInventory({ limit: 1000 }, signal)
      
      // Check if request was aborted
      if (signal?.aborted) {
        return
      }
      
      if (response.success && response.data) {
        const pharmacies = response.data.items || response.data || []
        
        // Load medicines for each pharmacy with throttling to prevent too many simultaneous requests
        // Process in batches of 5 to avoid rate limiting
        const batchSize = 5
        const pharmaciesWithMedicines = []
        
        for (let i = 0; i < pharmacies.length; i += batchSize) {
          // Check if request was aborted before processing next batch
          if (signal?.aborted) {
            return
          }
          
          const batch = pharmacies.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (pharmacy) => {
              try {
                const medicinesResponse = await getPharmacyMedicinesByPharmacy(
                  pharmacy._id || pharmacy.id, 
                  { limit: 1000 },
                  signal
                )
                
                // Check if request was aborted
                if (signal?.aborted) {
                  return null
                }
                
                const medicines = medicinesResponse.success && medicinesResponse.data
                  ? (medicinesResponse.data.items || medicinesResponse.data || [])
                  : []
                
                return {
                  pharmacyId: pharmacy._id || pharmacy.id,
                  pharmacyName: pharmacy.pharmacyName || 'Unknown Pharmacy',
                  status: pharmacy.status || 'pending',
                  isActive: pharmacy.isActive !== false,
                  address: pharmacy.address || {},
                  medicines: medicines.map((med) => ({
                    name: med.name || '',
                    dosage: med.dosage || '',
                    manufacturer: med.manufacturer || '',
                    quantity: Number(med.quantity) || 0, // Ensure quantity is always a number
                    price: Number(med.price) || 0, // Ensure price is always a number
                    expiryDate: med.expiryDate || null,
                    _id: med._id || med.id,
                  })),
                }
              } catch (err) {
                // Don't log errors for aborted requests
                if (err.name === 'AbortError') {
                  return null
                }
                console.error(`Error loading medicines for pharmacy ${pharmacy._id}:`, err)
                return {
                  pharmacyId: pharmacy._id || pharmacy.id,
                  pharmacyName: pharmacy.pharmacyName || 'Unknown Pharmacy',
                  status: pharmacy.status || 'pending',
                  isActive: pharmacy.isActive !== false,
                  address: pharmacy.address || {},
                  medicines: [],
                }
              }
            })
          )
          
          // Filter out null results (aborted requests)
          const validResults = batchResults.filter(result => result !== null)
          pharmaciesWithMedicines.push(...validResults)
          
          // Small delay between batches to prevent rate limiting
          if (i + batchSize < pharmacies.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        // Only update state if request wasn't aborted
        if (!signal?.aborted) {
          setPharmacyList(pharmaciesWithMedicines)
        }
      }
    } catch (err) {
      // Don't log or set error for aborted requests
      if (err.name === 'AbortError') {
        return
      }
      console.error('Error loading pharmacy inventory:', err)
      setError(err.message || 'Failed to load pharmacy inventory')
      setPharmacyList([])
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  const loadLaboratoryInventory = async (signal = null) => {
    try {
      setError(null)
      setLoading(true)
      
       // Debug log
      
      const response = await getLaboratoryInventory({ limit: 1000 }, signal)
      
      // Check if request was aborted
      if (signal?.aborted) {
        return
      }
      
       // Debug log
      
      if (response && response.success && response.data) {
        const laboratories = response.data.items || response.data || []
        
         // Debug log
        
        // Load tests for each laboratory with throttling to prevent too many simultaneous requests
        // Process in batches of 5 to avoid rate limiting
        const batchSize = 5
        const laboratoriesWithTests = []
        
        for (let i = 0; i < laboratories.length; i += batchSize) {
          // Check if request was aborted before processing next batch
          if (signal?.aborted) {
            return
          }
          
          const batch = laboratories.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (lab) => {
              try {
                const testsResponse = await getLaboratoryTestsByLaboratory(
                  lab._id || lab.id, 
                  { limit: 1000 },
                  signal
                )
                
                // Check if request was aborted
                if (signal?.aborted) {
                  return null
                }
                
                const tests = testsResponse.success && testsResponse.data
                  ? (testsResponse.data.items || testsResponse.data || [])
                  : []
                
                 // Debug log
                
                return {
                  labId: lab._id || lab.id,
                  labName: lab.labName || 'Unknown Laboratory',
                  status: lab.status || 'pending',
                  isActive: lab.isActive !== false,
                  phone: lab.phone || '',
                  email: lab.email || '',
                  address: lab.address || {},
                  rating: lab.rating || 0,
                  tests: tests.map((test) => ({
                    name: test.name || '',
                    price: Number(test.price) || 0, // Ensure price is always a number
                    description: test.description || '',
                    _id: test._id || test.id,
                  })),
                }
              } catch (err) {
                // Don't log errors for aborted requests
                if (err.name === 'AbortError') {
                  return null
                }
                console.error(`❌ Error loading tests for laboratory ${lab._id}:`, err)
                return {
                  labId: lab._id || lab.id,
                  labName: lab.labName || 'Unknown Laboratory',
                  status: lab.status || 'pending',
                  isActive: lab.isActive !== false,
                  phone: lab.phone || '',
                  email: lab.email || '',
                  address: lab.address || {},
                  rating: lab.rating || 0,
                  tests: [],
                }
              }
            })
          )
          
          // Filter out null results (aborted requests)
          const validResults = batchResults.filter(result => result !== null)
          laboratoriesWithTests.push(...validResults)
          
          // Small delay between batches to prevent rate limiting
          if (i + batchSize < laboratories.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
         // Debug log
        
        // Only update state if request wasn't aborted
        if (!signal?.aborted) {
          setLabList(laboratoriesWithTests)
        }
      } else {
        console.error('❌ Invalid API response:', response) // Debug log
        if (!signal?.aborted) {
          setLabList([])
        }
      }
    } catch (err) {
      // Don't log or set error for aborted requests
      if (err.name === 'AbortError') {
        return
      }
      console.error('❌ Error loading laboratory inventory:', err)
      setError(err.message || 'Failed to load laboratory inventory')
      setLabList([])
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  // Calculate total pharmacy inventory statistics
  const totalPharmacyInventory = useMemo(() => {
    const allMedicines = pharmacyList.flatMap(pharmacy => 
      (pharmacy.medicines || []).map(med => ({
        ...med,
        pharmacyId: pharmacy.pharmacyId,
        pharmacyName: pharmacy.pharmacyName,
      }))
    )
    
    // Group by medicine name and dosage
    const medicineMap = new Map()
    allMedicines.forEach(med => {
      const key = `${med.name}_${med.dosage || ''}`
      if (!medicineMap.has(key)) {
        medicineMap.set(key, {
          name: med.name,
          dosage: med.dosage || 'N/A',
          manufacturer: med.manufacturer || 'N/A',
          totalQuantity: 0,
          totalPrice: 0,
          pharmacies: [],
        })
      }
      const existing = medicineMap.get(key)
      const quantity = Number(med.quantity) || 0
      const price = Number(med.price) || 0
      existing.totalQuantity += quantity
      existing.totalPrice += price * quantity
      existing.pharmacies.push({
        pharmacyId: med.pharmacyId,
        pharmacyName: med.pharmacyName,
        quantity,
        price,
      })
    })

    const totalStock = allMedicines.reduce((sum, med) => {
      const qty = Number(med.quantity) || 0
      return sum + qty
    }, 0)
    
    const totalValue = allMedicines.reduce((sum, med) => {
      const quantity = Number(med.quantity) || 0
      const price = Number(med.price) || 0
      return sum + (quantity * price)
    }, 0)

    

    return {
      totalPharmacies: pharmacyList.length,
      totalMedicines: allMedicines.length,
      uniqueMedicines: medicineMap.size,
      totalStock,
      totalValue,
      medicineMap: Array.from(medicineMap.values()),
    }
  }, [pharmacyList])

  // Calculate total laboratory inventory statistics
  const totalLabInventory = useMemo(() => {
    const allTests = labList.flatMap(lab => 
      (lab.tests || []).map(test => ({
        ...test,
        labId: lab.labId,
        labName: lab.labName,
        // Ensure price is always a number
        price: Number(test.price) || 0,
      }))
    )
    
    // Group by test name
    const testMap = new Map()
    allTests.forEach(test => {
      const key = test.name
      if (!testMap.has(key)) {
        testMap.set(key, {
          name: test.name,
          totalPrice: 0,
          laboratories: [],
        })
      }
      const existing = testMap.get(key)
      const price = Number(test.price) || 0
      existing.totalPrice += price
      existing.laboratories.push({
        labId: test.labId,
        labName: test.labName,
        price,
      })
    })

    const totalValue = allTests.reduce((sum, test) => {
      const price = Number(test.price) || 0
      return sum + price
    }, 0)

    

    return {
      totalLabs: labList.length,
      totalTests: allTests.length,
      uniqueTests: testMap.size,
      totalValue,
      testMap: Array.from(testMap.values()),
    }
  }, [labList])

  // Calculate combined total inventory statistics
  const totalInventory = useMemo(() => {
    return {
      totalPharmacies: totalPharmacyInventory.totalPharmacies,
      totalLabs: totalLabInventory.totalLabs,
      totalStock: totalPharmacyInventory.totalStock,
      totalTests: totalLabInventory.totalTests,
      totalValue: totalPharmacyInventory.totalValue + totalLabInventory.totalValue,
    }
  }, [totalPharmacyInventory, totalLabInventory])

  const filteredPharmacies = pharmacyList.filter(pharmacy =>
    pharmacy.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pharmacy.medicines || []).some(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const filteredLabs = labList.filter(lab =>
    lab.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.tests || []).some(test =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Get all medicines and tests for Total Inventory view
  const allMedicinesForTotal = useMemo(() => {
    return pharmacyList.flatMap(pharmacy => 
      (pharmacy.medicines || []).map(med => ({
        ...med,
        type: 'medicine',
        pharmacyId: pharmacy.pharmacyId,
        pharmacyName: pharmacy.pharmacyName,
      }))
    )
  }, [pharmacyList])

  const allTestsForTotal = useMemo(() => {
    return labList.flatMap(lab => 
      (lab.tests || []).map(test => ({
        ...test,
        type: 'test',
        labId: lab.labId,
        labName: lab.labName,
        price: Number(test.price) || 0,
      }))
    )
  }, [labList])

  // Combined items for Total Inventory
  const allInventoryItems = useMemo(() => {
    return [...allMedicinesForTotal, ...allTestsForTotal]
  }, [allMedicinesForTotal, allTestsForTotal])

  // Filter combined items for search
  const filteredInventoryItems = allInventoryItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    if (item.type === 'medicine') {
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.dosage?.toLowerCase().includes(searchLower) ||
        item.manufacturer?.toLowerCase().includes(searchLower) ||
        item.pharmacyName.toLowerCase().includes(searchLower)
      )
    } else {
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.labName.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      )
    }
  })

  // Paginated filtered inventory items
  const paginatedFilteredInventoryItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredInventoryItems.slice(startIndex, endIndex)
  }, [filteredInventoryItems, currentPage, itemsPerPage])

  // Paginated filtered pharmacies
  const paginatedFilteredPharmacies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredPharmacies.slice(startIndex, endIndex)
  }, [filteredPharmacies, currentPage, itemsPerPage])

  // Paginated filtered labs
  const paginatedFilteredLabs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLabs.slice(startIndex, endIndex)
  }, [filteredLabs, currentPage, itemsPerPage])

  // Update pagination state based on active tab
  useEffect(() => {
    let total = 0
    if (activeTab === 'total') {
      total = filteredInventoryItems.length
    } else if (activeTab === 'pharmacy') {
      total = filteredPharmacies.length
    } else if (activeTab === 'laboratory') {
      total = filteredLabs.length
    }
    setTotalPages(Math.ceil(total / itemsPerPage) || 1)
    setTotalItems(total)
    // Reset to page 1 when tab or search changes
    setCurrentPage(1)
  }, [activeTab, filteredInventoryItems, filteredPharmacies, filteredLabs, itemsPerPage, searchTerm])



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

  // Laboratory Detail View
  if (selectedLab) {
    const labTotalValue = (selectedLab.tests || []).reduce((sum, test) => {
      const price = Number(test.price) || 0 // Ensure price is always a number
      return sum + price
    }, 0)

    return (
      <section className="flex flex-col gap-4 pb-4">
        {/* Laboratory Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 p-4 text-center shadow-sm">
            <IoFlaskOutline className="mx-auto h-6 w-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{selectedLab.tests.length}</p>
            <p className="text-xs font-semibold text-blue-700">Tests</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-4 text-center shadow-sm">
            <IoFlaskOutline className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">
              {(selectedLab.tests || []).length}
            </p>
            <p className="text-xs font-semibold text-emerald-700">Available Tests</p>
          </div>
          <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/60 p-4 text-center shadow-sm col-span-2 sm:col-span-1">
            <IoPricetagOutline className="mx-auto h-6 w-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(labTotalValue)}</p>
            <p className="text-xs font-semibold text-purple-700">Total Value</p>
          </div>
        </div>

        {/* Tests List */}
        <div className="space-y-2">
          {selectedLab.tests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <IoFlaskOutline className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">No tests in inventory</p>
            </div>
          ) : (
            selectedLab.tests.map((test, index) => {
              const price = Number(test.price) || 0 // Ensure price is always a number

              return (
                <article
                  key={index}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <IoFlaskOutline className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{test.name}</h3>
                          <div className="flex items-center gap-2.5 text-xs">
                            <span className="text-slate-600">
                              <span className="font-medium">Price:</span> <span className="font-semibold text-slate-900">{formatCurrency(price)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(price)}</p>
                            <p className="text-xs text-slate-500">Test Price</p>
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

        {/* Back Button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setSelectedLab(null)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <IoSearchOutline className="h-4 w-4" />
            Back to List
          </button>
        </div>
      </section>
    )
  }

  // Pharmacy Detail View
  if (selectedPharmacy) {
    const pharmacyTotalValue = selectedPharmacy.medicines.reduce((sum, med) => {
      const quantity = parseInt(med.quantity) || 0
      const price = parseFloat(med.price) || 0
      return sum + (quantity * price)
    }, 0)

    return (
      <section className="flex flex-col gap-4 pb-4">
        {/* Pharmacy Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 p-4 text-center shadow-sm">
            <IoBagHandleOutline className="mx-auto h-6 w-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{selectedPharmacy.medicines.length}</p>
            <p className="text-xs font-semibold text-blue-700">Medicines</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-4 text-center shadow-sm">
            <IoCubeOutline className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">
              {selectedPharmacy.medicines.reduce((sum, med) => sum + (parseInt(med.quantity) || 0), 0)}
            </p>
            <p className="text-xs font-semibold text-emerald-700">Total Units</p>
          </div>
          <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/60 p-4 text-center shadow-sm col-span-2 sm:col-span-1">
            <IoPricetagOutline className="mx-auto h-6 w-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(pharmacyTotalValue)}</p>
            <p className="text-xs font-semibold text-purple-700">Total Value</p>
          </div>
        </div>

        {/* Medicines List */}
        <div className="space-y-2">
          {selectedPharmacy.medicines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <IoMedicalOutline className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">No medicines in inventory</p>
            </div>
          ) : (
            selectedPharmacy.medicines.map((medicine, index) => {
              const quantity = parseInt(medicine.quantity) || 0
              const price = parseFloat(medicine.price) || 0
              const totalValue = quantity * price

              return (
                <article
                  key={index}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <IoMedicalOutline className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <h3 className="text-sm font-semibold text-slate-900">{medicine.name}</h3>
                            <span className="text-xs text-slate-600">Dosage: {medicine.dosage || 'N/A'}</span>
                          </div>
                          {medicine.manufacturer && (
                            <p className="text-xs text-slate-500 mb-0.5">Manufacturer: {medicine.manufacturer}</p>
                          )}
                          <div className="flex items-center gap-2.5 text-xs">
                            <span className="text-slate-600">
                              <span className="font-medium">Units:</span> <span className="font-semibold text-slate-900">{quantity}</span>
                            </span>
                            <span className="text-slate-600">
                              <span className="font-medium">Price/Unit:</span> <span className="font-semibold text-slate-900">{formatCurrency(price)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-slate-600">Dosage:</span>
                            <p className="text-xs font-semibold text-slate-900">{medicine.dosage || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                            <p className="text-xs text-slate-500">Total Value</p>
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
      </section>
    )
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
          placeholder={
            activeTab === 'total'
              ? 'Search by medicine, test, pharmacy or laboratory name...'
              : activeTab === 'pharmacy'
              ? 'Search by pharmacy name or medicine...'
              : 'Search by laboratory name or test...'
          }
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('total')
            setSelectedLab(null)
            setSelectedPharmacy(null)
          }}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'total'
              ? 'text-[#11496c] border-[#11496c]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Total Inventory
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('pharmacy')
            setSelectedLab(null)
          }}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'pharmacy'
              ? 'text-[#11496c] border-[#11496c]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Pharmacy Inventory
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('laboratory')
            setSelectedPharmacy(null)
          }}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'laboratory'
              ? 'text-[#11496c] border-[#11496c]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Laboratory Inventory
        </button>
      </div>

      {/* Summary Cards - Show different values based on active tab */}
      <div className={`grid gap-3 sm:gap-4 ${activeTab === 'total' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {activeTab === 'total' ? (
          <>
            {/* Pharmacy Cards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                  <IoBusinessOutline className="h-6 w-6 text-[#11496c]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Pharmacies</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {totalInventory.totalPharmacies}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <IoCubeOutline className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Stock</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {(totalPharmacyInventory.totalStock || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <IoPricetagOutline className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalPharmacyInventory.totalValue || 0)}
                  </p>
                </div>
              </div>
            </div>
            {/* Laboratory Cards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                  <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Laboratories</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {totalInventory.totalLabs}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <IoFlaskOutline className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Tests</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {(totalLabInventory.totalTests || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <IoPricetagOutline className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(totalLabInventory.totalValue || 0)}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                  {activeTab === 'pharmacy' ? (
                    <IoBusinessOutline className="h-6 w-6 text-[#11496c]" />
                  ) : (
                    <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">
                    {activeTab === 'pharmacy' ? 'Total Pharmacies' : 'Total Laboratories'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeTab === 'pharmacy' 
                      ? totalPharmacyInventory.totalPharmacies 
                      : totalLabInventory.totalLabs}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  {activeTab === 'pharmacy' ? (
                    <IoCubeOutline className="h-6 w-6 text-blue-600" />
                  ) : (
                    <IoFlaskOutline className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">
                    {activeTab === 'pharmacy' ? 'Total Stock' : 'Total Tests'}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {activeTab === 'pharmacy' 
                      ? (totalPharmacyInventory.totalStock || 0).toLocaleString() 
                      : (totalLabInventory.totalTests || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <IoPricetagOutline className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(
                      activeTab === 'pharmacy' 
                        ? (totalPharmacyInventory.totalValue || 0)
                        : (totalLabInventory.totalValue || 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'total' ? (
        /* Total Inventory Tab - Shows all medicines and tests side by side */
        <div className="space-y-3">
          {paginatedFilteredInventoryItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                {searchTerm ? 'No items found' : 'No inventory items available'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm ? 'Try a different search term' : 'Medicines and tests will appear here once added'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Medicines Section - Left Side */}
              <div className="space-y-2">
                {paginatedFilteredInventoryItems.filter(item => item.type === 'medicine').length > 0 ? (
                  <>
                    <h3 className="text-sm font-semibold text-slate-700 px-1 flex items-center gap-2 sticky top-0 bg-white py-2 z-10">
                      <IoMedicalOutline className="h-4 w-4 text-blue-600" />
                      Medicines ({filteredInventoryItems.filter(item => item.type === 'medicine').length})
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {paginatedFilteredInventoryItems
                        .filter(item => item.type === 'medicine')
                        .map((medicine, index) => {
                          const quantity = parseInt(medicine.quantity) || 0
                          const price = parseFloat(medicine.price) || 0
                          const totalValue = quantity * price

                          return (
                            <article
                              key={`med-${medicine._id || index}`}
                              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                  <IoMedicalOutline className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                        <h3 className="text-sm font-semibold text-slate-900">{medicine.name}</h3>
                                        <span className="text-xs text-slate-600">({medicine.dosage || 'N/A'})</span>
                                      </div>
                                      <p className="text-xs text-slate-500 mb-1">Pharmacy: {medicine.pharmacyName}</p>
                                      {medicine.manufacturer && (
                                        <p className="text-xs text-slate-500 mb-0.5">Manufacturer: {medicine.manufacturer}</p>
                                      )}
                                      <div className="flex items-center gap-2.5 text-xs flex-wrap">
                                        <span className="text-slate-600">
                                          <span className="font-medium">Units:</span> <span className="font-semibold text-slate-900">{quantity}</span>
                                        </span>
                                        <span className="text-slate-600">
                                          <span className="font-medium">Price/Unit:</span> <span className="font-semibold text-slate-900">{formatCurrency(price)}</span>
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                                        <p className="text-xs text-slate-500">Total Value</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          )
                        })}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <IoMedicalOutline className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-600">No medicines found</p>
                  </div>
                )}
              </div>

              {/* Tests Section - Right Side */}
              <div className="space-y-2">
                {filteredInventoryItems.filter(item => item.type === 'test').length > 0 ? (
                  <>
                    <h3 
                      id="tests-section"
                      className="text-sm font-semibold text-slate-700 px-1 flex items-center gap-2 sticky top-0 bg-white py-2 z-10 cursor-pointer hover:text-emerald-700 transition-colors"
                      onClick={() => {
                        const element = document.getElementById('tests-section')
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                    >
                      <IoFlaskOutline className="h-4 w-4 text-emerald-600" />
                      Laboratory Tests ({filteredInventoryItems.filter(item => item.type === 'test').length})
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredInventoryItems
                        .filter(item => item.type === 'test')
                        .map((test, index) => {
                          const price = Number(test.price) || 0

                          return (
                            <article
                              key={`test-${test._id || index}`}
                              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                                  <IoFlaskOutline className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{test.name}</h3>
                                      <p className="text-xs text-slate-500 mb-1">Laboratory: {test.labName}</p>
                                      {test.description && (
                                        <p className="text-xs text-slate-500 mb-0.5">{test.description}</p>
                                      )}
                                      <div className="flex items-center gap-2.5 text-xs">
                                        <span className="text-slate-600">
                                          <span className="font-medium">Price:</span> <span className="font-semibold text-slate-900">{formatCurrency(price)}</span>
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{formatCurrency(price)}</p>
                                        <p className="text-xs text-slate-500">Test Price</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          )
                        })}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <IoFlaskOutline className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-600">No tests found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Pagination for Total Inventory */}
          {filteredInventoryItems.length > itemsPerPage && (
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
        </div>
      ) : activeTab === 'pharmacy' ? (
        /* Pharmacy Inventory Tab */
        <div className="space-y-3">
          {paginatedFilteredPharmacies.length === 0 ? (
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
            filteredPharmacies.map((pharmacy) => {
              const pharmacyTotalValue = pharmacy.medicines.reduce((sum, med) => {
                const quantity = parseInt(med.quantity) || 0
                const price = parseFloat(med.price) || 0
                return sum + (quantity * price)
              }, 0)
              const pharmacyTotalStock = pharmacy.medicines.reduce((sum, med) => sum + (parseInt(med.quantity) || 0), 0)

              return (
                <article
                  key={pharmacy.pharmacyId}
                  onClick={() => setSelectedPharmacy(pharmacy)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[rgba(17,73,108,0.3)] hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoBusinessOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{pharmacy.pharmacyName}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <IoMedicalOutline className="h-3 w-3" />
                              <span className="font-semibold text-slate-700">{pharmacy.medicines.length}</span>
                              <span>{pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <IoCubeOutline className="h-3 w-3" />
                              <span className="font-semibold text-slate-700">{pharmacyTotalStock}</span>
                              <span>units</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <IoPricetagOutline className="h-3 w-3" />
                              <span className="font-semibold text-[#11496c]">{formatCurrency(pharmacyTotalValue)}</span>
                            </span>
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
                              {med.name} ({med.dosage}) - {med.quantity} units
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
              )
            })
          )}
          
          {/* Pagination for Pharmacy Inventory */}
          {filteredPharmacies.length > itemsPerPage && (
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
        </div>
      ) : (
        /* Laboratory Inventory Tab */
        <div className="space-y-3">
          {paginatedFilteredLabs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                {searchTerm ? 'No laboratories found' : 'No laboratories have added tests yet'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm ? 'Try a different search term' : 'Laboratories will appear here once they add their tests'}
              </p>
            </div>
          ) : (
            filteredLabs.map((lab) => {
              const labTotalValue = (lab.tests || []).reduce((sum, test) => {
                const price = Number(test.price) || 0 // Ensure price is always a number
                return sum + price
              }, 0)
              const testCount = (lab.tests || []).length

              return (
                <article
                  key={lab.labId}
                  onClick={() => setSelectedLab(lab)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[rgba(17,73,108,0.3)] hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{lab.labName}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <IoFlaskOutline className="h-3 w-3" />
                              <span className="font-semibold text-slate-700">{testCount}</span>
                              <span>{testCount === 1 ? 'test' : 'tests'}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <IoPricetagOutline className="h-3 w-3" />
                              <span className="font-semibold text-[#11496c]">{formatCurrency(labTotalValue)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                            Active
                          </span>
                        </div>
                      </div>
                      
                      {/* Sample Tests Preview */}
                      {testCount > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {lab.tests.slice(0, 3).map((test, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              <IoFlaskOutline className="h-3 w-3" />
                              {test.name} - {formatCurrency(test.price)}
                            </span>
                          ))}
                          {testCount > 3 && (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                              +{testCount - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
          
          {/* Pagination for Laboratory Inventory */}
          {filteredLabs.length > itemsPerPage && (
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
        </div>
      )}
    </section>
  )
}

export default AdminInventory

