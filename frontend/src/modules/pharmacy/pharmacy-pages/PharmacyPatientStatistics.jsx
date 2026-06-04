import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonCircleOutline,
  IoCloseOutline,
} from 'react-icons/io5'
import { getPharmacyPatients, getPharmacyPatientStatistics } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'

// Removed mock data - now using backend API

const PharmacyPatientStatistics = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('total')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState({ totalPatients: 0, activePatients: 0, inactivePatients: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch patients and statistics from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [patientsResponse, statsResponse] = await Promise.all([
          getPharmacyPatients(),
          getPharmacyPatientStatistics().catch(() => ({ success: false, data: {} })),
        ])
        
        if (patientsResponse.success && patientsResponse.data) {
          const patientsData = Array.isArray(patientsResponse.data) 
            ? patientsResponse.data 
            : patientsResponse.data.items || []
          
          // Transform API data
          const transformed = patientsData.map(patient => {
            const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
            return {
              id: patient._id || patient.id,
              name: fullName || 'Unknown Patient',
              phone: patient.phone || 'N/A',
              email: patient.email || 'N/A',
              status: patient.status || 'active', // Determine from last order date
              age: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A',
              gender: patient.gender || 'N/A',
              address: patient.address ? 
                `${patient.address.line1 || ''}, ${patient.address.city || ''}, ${patient.address.state || ''}`.trim() 
                : 'N/A',
              image: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=11496c&color=fff&size=128&bold=true`,
            }
          })
          
          setPatients(transformed)
        }
        
        if (statsResponse.success && statsResponse.data) {
          const statsData = statsResponse.data
          setStats({
            totalPatients: statsData.totalPatients || 0,
            activePatients: statsData.activePatients || 0,
            inactivePatients: (statsData.totalPatients || 0) - (statsData.activePatients || 0),
          })
        }
      } catch (err) {
        console.error('Error fetching patient statistics:', err)
        setError(err.message || 'Failed to load patient statistics')
        toast.error('Failed to load patient statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filter patients based on active tab
  const filteredPatientsByTab = useMemo(() => {
    if (activeTab === 'active') {
      return patients.filter(p => p.status === 'active')
    } else if (activeTab === 'inactive') {
      return patients.filter(p => p.status === 'inactive')
    }
    return patients
  }, [patients, activeTab])

  // Filter patients based on search term - only by name
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return filteredPatientsByTab
    
    const searchLower = searchTerm.toLowerCase()
    return filteredPatientsByTab.filter(patient => 
      patient.name.toLowerCase().includes(searchLower)
    )
  }, [filteredPatientsByTab, searchTerm])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-slate-600">Loading patient statistics...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-red-600">Error: {error}</p>
          <p className="mt-1 text-xs text-red-500">Please try again later.</p>
        </div>
      )}

      {/* Patient Statistics Cards - Parallel in One Row (Above Search Bar) */}
      {!loading && !error && (
        <>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
            {/* Total Patients Card */}
            <button
              onClick={() => {
                setActiveTab('total')
                setSearchTerm('')
              }}
              className={`shrink-0 flex-1 rounded-xl p-4 border-2 transition-all shadow-sm hover:shadow-md text-left ${
                activeTab === 'total'
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">Total</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{stats.totalPatients}</p>
            </button>

            {/* Active Patients Card */}
            <button
              onClick={() => {
                setActiveTab('active')
                setSearchTerm('')
              }}
              className={`shrink-0 flex-1 rounded-xl p-4 border-2 transition-all shadow-sm hover:shadow-md text-left ${
                activeTab === 'active'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <p className="text-sm font-semibold text-emerald-700">Active</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">{stats.activePatients}</p>
            </button>

            {/* Inactive Patients Card */}
            <button
              onClick={() => {
                setActiveTab('inactive')
                setSearchTerm('')
              }}
              className={`shrink-0 flex-1 rounded-xl p-4 border-2 transition-all shadow-sm hover:shadow-md text-left ${
                activeTab === 'inactive'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-red-50/50 border-red-200 hover:border-red-300'
              }`}
            >
              <p className="text-sm font-semibold text-red-700">Inactive</p>
              <p className="text-lg font-bold text-red-700 mt-1">{stats.inactivePatients}</p>
            </button>
          </div>

          {/* Search Bar - Below Cards */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#11496c]">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="text"
          placeholder="Search patients by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[rgba(17,73,108,0.2)] rounded-lg bg-white text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:shadow-md focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
        />
      </div>

          {/* Patient List */}
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <IoPeopleOutline className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              {searchTerm ? 'No patients found matching your search' : 'No patients found'}
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar - Left Side */}
                <img
                  src={patient.image}
                  alt={patient.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=11496c&color=fff&size=128&bold=true`
                  }}
                />
                {/* Patient Information - Right Side */}
                <div className="flex-1 min-w-0">
                  {/* Name and Status Badge - Top */}
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-base font-bold text-slate-900">{patient.name}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      patient.status === 'active'
                        ? 'bg-emerald-500 text-white border border-emerald-600'
                        : 'bg-red-500 text-white border border-red-600'
                    }`}>
                      {patient.status === 'active' ? (
                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                      ) : (
                        <IoCloseCircleOutline className="h-3 w-3" />
                      )}
                      {patient.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {/* Contact and Demographic Info - Line by Line */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <IoCallOutline className="h-4 w-4 text-slate-500" />
                      {patient.phone}
                    </p>
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <IoMailOutline className="h-4 w-4 text-slate-500" />
                      <span className="truncate">{patient.email}</span>
                    </p>
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <IoCalendarOutline className="h-4 w-4 text-slate-500" />
                      {patient.age} years, {patient.gender}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
          </div>
        </>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-3 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoPersonCircleOutline className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-white">Patient Details</h2>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Patient Details - Compact Layout */}
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Profile */}
                <div className="lg:col-span-1">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                    <img
                      src={selectedPatient.image}
                      alt={selectedPatient.name}
                      className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md mb-2"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=11496c&color=fff&size=128&bold=true`
                      }}
                    />
                    <h3 className="text-base font-bold text-slate-900 text-center">{selectedPatient.name}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold mt-1 ${
                      selectedPatient.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {selectedPatient.status === 'active' ? (
                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                      ) : (
                        <IoCloseCircleOutline className="h-3 w-3" />
                      )}
                      {selectedPatient.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Contact Information */}
                  <div>
                    <h4 className="text-xs font-bold text-[#11496c] flex items-center gap-1.5 mb-2">
                      <IoCallOutline className="h-3.5 w-3.5" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Phone</p>
                        <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <IoCallOutline className="h-3.5 w-3.5 text-slate-500" />
                          {selectedPatient.phone}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Email</p>
                        <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <IoMailOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate">{selectedPatient.email}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h4 className="text-xs font-bold text-[#11496c] flex items-center gap-1.5 mb-2">
                      <IoPersonCircleOutline className="h-3.5 w-3.5" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Age</p>
                        <p className="text-xs font-semibold text-slate-900">{selectedPatient.age} years</p>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Gender</p>
                        <p className="text-xs font-semibold text-slate-900">{selectedPatient.gender}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="text-xs font-bold text-[#11496c] flex items-center gap-1.5 mb-2">
                      <IoLocationOutline className="h-3.5 w-3.5" />
                      Address
                    </h4>
                    <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-900">{selectedPatient.address}</p>
                    </div>
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

export default PharmacyPatientStatistics

