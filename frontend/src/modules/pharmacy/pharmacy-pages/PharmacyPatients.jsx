import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMedicalOutline,
} from 'react-icons/io5'
import { getPharmacyPatients } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

// Removed mock data - now using backend API

const formatDateTime = (value) => {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatAddress = (address = {}) => {
  const { line1, line2, city, state, postalCode } = address
  return [line1, line2, [city, state].filter(Boolean).join(', '), postalCode]
    .filter(Boolean)
    .join(', ')
}

const PharmacyPatients = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPharmacyPatients({ 
          search: searchTerm || undefined,
          page: currentPage,
          limit: itemsPerPage
        })
        
        if (response.success && response.data) {
          const patientsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          
          // Extract pagination info
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
            setTotalItems(response.data.pagination.total || 0)
          } else {
            setTotalPages(1)
            setTotalItems(patientsData.length)
          }
          
          // Transform API data to match component structure
          const transformed = patientsData.map(patient => {
            const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
            return {
              id: patient._id || patient.id,
              name: fullName || 'Unknown Patient',
              age: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A',
              gender: patient.gender || 'N/A',
              phone: patient.phone || 'N/A',
              email: patient.email || 'N/A',
              lastOrderDate: patient.lastOrderDate || null,
              totalOrders: patient.totalOrders || 0,
              totalSpent: patient.totalSpent || 0,
              address: patient.address || {},
              medicalHistory: patient.medicalHistory || [],
              allergies: patient.allergies || [],
              image: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=160`,
            }
          })
          
          setPatients(transformed)
        } else {
          setPatients([])
          setTotalPages(1)
          setTotalItems(0)
        }
      } catch (err) {
        console.error('Error fetching patients:', err)
        setError(err.message || 'Failed to load patients')
        toast.error('Failed to load patients')
        setPatients([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [searchTerm, toast, currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredPatients = useMemo(() => {
    return patients
  }, [patients])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#11496c]">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-slate-600">Loading patients...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-red-600">Error: {error}</p>
          <p className="mt-1 text-xs text-red-500">Please try again later.</p>
        </div>
      )}

      {/* Patients List - Scrollable Container */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            {patients.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
                No patients found matching your search.
              </p>
            ) : (
              patients.map((patient) => (
            <article
              key={patient.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[rgba(17,73,108,0.2)] hover:shadow-md sm:p-5"
            >
              <div className="flex items-start gap-3">
                <img
                  src={patient.image}
                  alt={patient.name}
                  className="h-16 w-16 rounded-xl object-cover bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{patient.name}</h3>
                  <p className="text-xs text-slate-500">
                    {patient.age} years, {patient.gender}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`tel:${patient.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[rgba(17,73,108,0.2)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#11496c] transition-all hover:bg-[rgba(17,73,108,0.05)] hover:border-[rgba(17,73,108,0.3)]"
                    >
                      <IoCallOutline className="h-3.5 w-3.5" />
                      {patient.phone}
                    </a>
                    <a
                      href={`mailto:${patient.email}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[rgba(17,73,108,0.2)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#11496c] transition-all hover:bg-[rgba(17,73,108,0.05)] hover:border-[rgba(17,73,108,0.3)]"
                    >
                      <IoMailOutline className="h-3.5 w-3.5" />
                      Email
                    </a>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[rgba(17,73,108,0.05)] p-3 border border-[rgba(17,73,108,0.1)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c]">Total Orders</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{patient.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c]">Total Spent</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(patient.totalSpent)}</p>
                </div>
              </div>

              {/* Medical Info */}
              {(patient.medicalHistory.length > 0 || patient.allergies.length > 0) && (
                <div className="space-y-2">
                  {patient.medicalHistory.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Medical History</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.medicalHistory.map((condition, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-[rgba(17,73,108,0.15)] px-2 py-1 text-[10px] font-medium text-[#11496c]"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.allergies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Allergies</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formatAddress(patient.address)}</span>
              </div>

              {/* Last Order */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IoCalendarOutline className="h-3 w-3" />
                <span>Last order: {formatDateTime(patient.lastOrderDate)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="rounded-lg border border-[rgba(17,73,108,0.2)] bg-white px-3 py-1.5 text-[10px] font-bold text-[#11496c] transition-all hover:border-[rgba(17,73,108,0.3)] hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                >
                  <IoDocumentTextOutline className="mr-1 inline h-3.5 w-3.5" />
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/pharmacy/orders?patientId=${patient.id}`)}
                  className="rounded-lg bg-[#11496c] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95"
                >
                  View Orders
                </button>
              </div>
              </article>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && patients.length > 0 && totalPages > 1 && (
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

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">Patient Details</h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPatient.image}
                  alt={selectedPatient.name}
                  className="h-20 w-20 rounded-xl object-cover bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=3b82f6&color=fff&size=160&bold=true`
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedPatient.age} years, {selectedPatient.gender}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#11496c] mb-2 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedPatient.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedPatient.email}</p>
                  <p><span className="font-medium">Address:</span> {formatAddress(selectedPatient.address)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#11496c] mb-2 flex items-center gap-2">
                  <IoMedicalOutline className="h-4 w-4" />
                  Medical Information
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedPatient.medicalHistory.length > 0 ? (
                    <div>
                      <p className="font-medium text-slate-600">Medical History:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.medicalHistory.map((condition, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-[rgba(17,73,108,0.15)] px-2 py-1 text-xs font-medium text-[#11496c]"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">No medical history recorded</p>
                  )}
                  {selectedPatient.allergies.length > 0 && (
                    <div>
                      <p className="font-medium text-slate-600">Allergies:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.allergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#11496c] mb-2">Order Statistics</h4>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-[rgba(17,73,108,0.05)] p-3 border border-[rgba(17,73,108,0.1)]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c]">Total Orders</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{selectedPatient.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c]">Total Spent</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(selectedPatient.totalSpent)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyPatients

