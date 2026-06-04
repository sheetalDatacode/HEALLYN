import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoWalletOutline,
  IoArrowBackOutline,
  IoBagHandleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoCloseOutline,
} from 'react-icons/io5'
import { getLaboratoryPatients, getPatientStatistics } from '../laboratory-services/laboratoryService'

const LaboratoryPatientStatistics = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('total')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState({ totalPatients: 0, activePatients: 0, inactivePatients: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [patientsResponse, statsResponse] = await Promise.all([
        getLaboratoryPatients({ status: activeTab === 'total' ? undefined : activeTab }),
        getPatientStatistics(),
      ])
      
      const patientsData = Array.isArray(patientsResponse) ? patientsResponse : (patientsResponse.data || patientsResponse.patients || [])
      setPatients(patientsData)
      
      const statsData = statsResponse.data || statsResponse || {}
      setStats({
        totalPatients: statsData.totalPatients || statsData.total || 0,
        activePatients: statsData.activePatients || statsData.active || 0,
        inactivePatients: statsData.inactivePatients || statsData.inactive || 0,
      })
    } catch (error) {
      console.error('Error fetching patient data:', error)
      toast.error('Failed to load patient data')
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data removed - now using backend API

  // Filter patients based on search term - only by name
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients
    
    const searchLower = searchTerm.toLowerCase()
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(searchLower)
    )
  }, [patients, searchTerm])

  const sidebarNavItems = [
    { id: 'home', label: 'Home', to: '/laboratory/dashboard', Icon: IoHomeOutline },
    { id: 'orders', label: 'Orders', to: '/laboratory/orders', Icon: IoBagHandleOutline },
    { id: 'patients', label: 'Patients', to: '/laboratory/patients', Icon: IoPeopleOutline },
    { id: 'wallet', label: 'Wallet', to: '/laboratory/wallet', Icon: IoWalletOutline },
    { id: 'profile', label: 'Profile', to: '/laboratory/profile', Icon: IoPersonCircleOutline },
  ]

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pt-16 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Patient Statistics Cards - Parallel in One Row (Above Search Bar) */}
          <div className="flex gap-4 mb-6 -mt-12 sm:-mt-10">
            {/* Total Patients Card */}
            <button
              onClick={() => {
                setActiveTab('total')
                setSearchTerm('')
              }}
              className={`flex-1 rounded-xl p-5 border-2 transition-all shadow-sm hover:shadow-md text-left ${
                activeTab === 'total'
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">Total</p>
            </button>

            {/* Active Patients Card */}
            <button
              onClick={() => {
                setActiveTab('active')
                setSearchTerm('')
              }}
              className={`flex-1 rounded-xl p-5 border-2 transition-all shadow-sm hover:shadow-md text-left ${
                activeTab === 'active'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <p className="text-sm font-semibold text-emerald-700">Active</p>
            </button>

            {/* Inactive Patients Card */}
            <button
              onClick={() => {
                setActiveTab('inactive')
                setSearchTerm('')
              }}
              className={`flex-1 rounded-xl p-5 border-2 transition-all shadow-sm hover:shadow-md text-left ${
                activeTab === 'inactive'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-red-50/50 border-red-200 hover:border-red-300'
              }`}
            >
              <p className="text-sm font-semibold text-red-700">Inactive</p>
            </button>
          </div>

          {/* Search Bar - Below Cards */}
          <div className="mb-6">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-transparent"
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#11496c] border-t-transparent mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-slate-600">Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
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
                      src={patient.image || patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Patient')}&background=11496c&color=fff&size=128&bold=true`}
                      alt={patient.name || 'Patient'}
                      className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Patient')}&background=11496c&color=fff&size=128&bold=true`
                      }}
                    />
                    {/* Patient Information - Right Side */}
                    <div className="flex-1 min-w-0">
                      {/* Name and Status Badge - Top */}
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-base font-bold text-slate-900">{patient.name || 'Patient'}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          (patient.status === 'active' || patient.isActive)
                            ? 'bg-emerald-500 text-white border border-emerald-600'
                            : 'bg-red-500 text-white border border-red-600'
                        }`}>
                          {(patient.status === 'active' || patient.isActive) ? (
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                          ) : (
                            <IoCloseCircleOutline className="h-3 w-3" />
                          )}
                          {(patient.status === 'active' || patient.isActive) ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {/* Contact and Demographic Info - Line by Line */}
                      <div className="space-y-2">
                        {patient.phone && (
                          <p className="text-sm text-slate-700 flex items-center gap-2">
                            <IoCallOutline className="h-4 w-4 text-slate-500" />
                            {patient.phone}
                          </p>
                        )}
                        {patient.email && (
                          <p className="text-sm text-slate-700 flex items-center gap-2">
                            <IoMailOutline className="h-4 w-4 text-slate-500" />
                            <span className="truncate">{patient.email}</span>
                          </p>
                        )}
                        {(patient.age || patient.gender) && (
                          <p className="text-sm text-slate-700 flex items-center gap-2">
                            <IoCalendarOutline className="h-4 w-4 text-slate-500" />
                            {patient.age ? `${patient.age} years` : ''}{patient.age && patient.gender ? ', ' : ''}{patient.gender || ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                      <IoCallOutline className="h-3.5 w-3.5 text-[#11496c]" />
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
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                      <IoPersonCircleOutline className="h-3.5 w-3.5 text-[#11496c]" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Age</p>
                        <p className="text-xs font-semibold text-slate-900">{selectedPatient.age} years</p>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Gender</p>
                        <p className="text-xs font-semibold text-slate-900">{selectedPatient.gender}</p>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">Blood Group</p>
                        <p className="text-xs font-semibold text-slate-900">{selectedPatient.bloodGroup}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                      <IoLocationOutline className="h-3.5 w-3.5 text-[#11496c]" />
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
    </>
  )
}

export default LaboratoryPatientStatistics

