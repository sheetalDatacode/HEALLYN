import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoAddOutline,
  IoSearchOutline,
  IoFlaskOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoBagHandleOutline,
} from 'react-icons/io5'
import { getLaboratoryTests, addLaboratoryTest, updateLaboratoryTest, deleteLaboratoryTest } from '../laboratory-services/laboratoryService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

const LaboratoryAvailableTests = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [tests, setTests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch tests from API
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true)
        
         // Debug log
        
        // Use pagination with 10 items per page
        const response = await getLaboratoryTests({ 
          page: currentPage, 
          limit: itemsPerPage 
        })
        
         // Debug log
        
        if (response && response.success && response.data) {
          // Backend returns tests in data.items (with pagination)
          const testsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.tests || []
          
          const pagination = response.data.pagination || {}
          
           // Debug log
          
          const transformed = testsData.map(test => ({
            id: test._id || test.id,
            name: test.name || '',
            price: Number(test.price || 0),
            description: test.description || '',
            category: test.category || '',
            duration: test.duration || '',
            sampleType: test.sampleType || '',
          }))
          
          setTests(transformed)
          setTotalPages(pagination.totalPages || Math.ceil((pagination.total || testsData.length) / itemsPerPage) || 1)
          setTotalItems(pagination.total || testsData.length)
        } else {
          console.error('❌ Invalid API response:', response) // Debug log
          setTests([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('❌ Error fetching tests:', err)
        toast.error('Failed to load tests')
        setTests([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [toast, currentPage])

  const handleAddTest = () => {
    navigate('/laboratory/available-tests/add')
  }

  const handleEditTest = (test) => {
    navigate(`/laboratory/available-tests/edit/${test.id}`)
  }

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) {
      return
    }

    try {
      await deleteLaboratoryTest(testId)
      
      // If current page becomes empty and not on first page, go to previous page
      if (tests.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        // Refresh current page data
        const response = await getLaboratoryTests({ 
          page: currentPage, 
          limit: itemsPerPage 
        })
        
        if (response && response.success && response.data) {
          const testsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.tests || []
          
          const pagination = response.data.pagination || {}
          
          const transformed = testsData.map(test => ({
            id: test._id || test.id,
            name: test.name || '',
            price: Number(test.price || 0),
            description: test.description || '',
            category: test.category || '',
            duration: test.duration || '',
            sampleType: test.sampleType || '',
          }))
          
          setTests(transformed)
          setTotalPages(pagination.totalPages || Math.ceil((pagination.total || testsData.length) / itemsPerPage) || 1)
          setTotalItems(pagination.total || testsData.length)
        }
      }
      
      toast.success('Test deleted successfully')
    } catch (err) {
      console.error('Error deleting test:', err)
      toast.error(err.message || 'Failed to delete test')
    }
  }

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate statistics - use totalItems for accurate count
  const statistics = useMemo(() => {
    const totalTests = totalItems
    const totalValue = tests.reduce((sum, test) => {
      const price = parseFloat(test.price) || 0
      return sum + price
    }, 0)

    return { totalTests, totalValue }
  }, [tests, totalItems])

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
            placeholder="Search by test name..."
            className="w-full h-[42px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[#1a5f7a] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleAddTest}
          className="flex items-center justify-center h-[42px] rounded-lg bg-[#11496c] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a54] active:scale-95 shrink-0"
        >
          Add
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 lg:gap-4">
        <div className="group relative overflow-hidden rounded-lg border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-2 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-emerald-200/40 hover:scale-[1.01] hover:border-emerald-300/80 lg:p-6 lg:rounded-xl lg:hover:scale-[1.02] lg:hover:shadow-lg lg:hover:shadow-emerald-200/50">
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-emerald-200/40 blur-lg transition-opacity group-hover:opacity-100 opacity-70 lg:-right-4 lg:-top-4 lg:h-16 lg:w-16" />
          <IoFlaskOutline className="relative mx-auto h-4 w-4 text-emerald-600 mb-0.5 lg:h-8 lg:w-8 lg:mb-2" />
          <p className="relative text-base font-bold text-emerald-600 lg:text-4xl lg:mb-1">{statistics.totalTests}</p>
          <p className="relative text-[10px] font-semibold text-emerald-700 lg:text-sm">Tests</p>
        </div>
        <div className="group relative overflow-hidden rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 p-2 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-200/40 hover:scale-[1.01] hover:border-blue-300/80 lg:p-6 lg:rounded-xl lg:hover:scale-[1.02] lg:hover:shadow-lg lg:hover:shadow-blue-200/50">
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-blue-200/40 blur-lg transition-opacity group-hover:opacity-100 opacity-70 lg:-right-4 lg:-top-4 lg:h-16 lg:w-16" />
          <IoBagHandleOutline className="relative mx-auto h-4 w-4 text-blue-600 mb-0.5 lg:h-8 lg:w-8 lg:mb-2" />
          <p className="relative text-base font-bold text-blue-600 lg:text-3xl lg:mb-1">{formatCurrency(statistics.totalValue)}</p>
          <p className="relative text-[10px] font-semibold text-blue-700 lg:text-sm">Total Value</p>
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-2.5 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
        {filteredTests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center lg:col-span-4">
            <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              {searchTerm ? 'No tests found' : 'No tests added yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm ? 'Try a different search term' : 'Click "Add" to get started'}
            </p>
          </div>
        ) : (
          filteredTests.map((test) => {
            return (
              <article
                key={test.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-slate-300 lg:shadow-md lg:hover:shadow-xl lg:hover:scale-[1.02] lg:hover:border-[#11496c]/30 lg:transition-all lg:duration-300 lg:cursor-pointer lg:flex lg:flex-col"
              >
                <div className="flex items-start justify-between gap-3 lg:flex-col lg:gap-3 lg:flex-1">
                  <div className="flex-1 min-w-0 lg:w-full">
                    <div className="flex items-start gap-2 lg:flex-col lg:items-center lg:text-center lg:gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white lg:h-16 lg:w-16 lg:rounded-xl lg:transition-transform lg:duration-300 lg:group-hover:scale-110">
                        <IoFlaskOutline className="h-5 w-5 lg:h-8 lg:w-8" />
                      </div>
                      <div className="flex-1 min-w-0 lg:w-full">
                        <h3 className="text-sm font-bold text-slate-900 truncate lg:text-base lg:mb-2">{test.name}</h3>
                        <div className="mt-1.5 flex items-center gap-3 text-xs lg:justify-center lg:mt-0">
                          <span className="font-semibold text-emerald-600 lg:text-lg">
                            {formatCurrency(parseFloat(test.price) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 lg:mt-auto lg:pt-3 lg:border-t lg:border-slate-200 lg:w-full lg:justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditTest(test)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white active:scale-95 lg:h-9 lg:w-9 lg:hover:shadow-md"
                      aria-label="Edit test"
                    >
                      <IoPencilOutline className="h-4 w-4 lg:h-4 lg:w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTest(test.id)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-95 lg:h-9 lg:w-9 lg:hover:shadow-md"
                      aria-label="Delete test"
                    >
                      <IoTrashOutline className="h-4 w-4 lg:h-4 lg:w-4" />
                    </button>
                  </div>
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
    </section>
  )
}

export default LaboratoryAvailableTests

