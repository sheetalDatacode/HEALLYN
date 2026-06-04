import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCallOutline,
  IoMailOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoWalletOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoArrowBackOutline,
  IoBagHandleOutline,
  IoCloseOutline,
} from 'react-icons/io5'
import { getLaboratoryPatients } from '../laboratory-services/laboratoryService'

const LaboratoryPatientDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Get filter type from URL params or default to 'total'
  const searchParams = new URLSearchParams(location.search)
  const filterType = searchParams.get('type') || 'total'

  useEffect(() => {
    fetchPatients()
  }, [filterType])

  const fetchPatients = async () => {
    try {
      setIsLoading(true)
      const response = await getLaboratoryPatients({ status: filterType === 'total' ? undefined : filterType })
      const patientsData = Array.isArray(response) ? response : (response.data || response.patients || [])
      setPatients(patientsData)
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Mock data removed - now using backend API

  // Get card info based on filter type
  const getCardInfo = () => {
    switch (filterType) {
      case 'active':
        return {
          title: 'Active Patients',
          count: patients.length,
          icon: IoCheckmarkCircleOutline,
          bgColor: 'from-[rgba(17,73,108,0.1)] to-[rgba(17,73,108,0.05)]',
          iconBg: 'bg-[#11496c]',
          iconColor: 'text-white',
          textColor: 'text-[#11496c]',
          borderColor: 'border-[rgba(17,73,108,0.2)]',
          cardBg: 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/50',
        }
      case 'inactive':
        return {
          title: 'Inactive Patients',
          count: patients.length,
          icon: IoCloseCircleOutline,
          bgColor: 'from-red-50 to-red-100/50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          textColor: 'text-red-600',
          borderColor: 'border-red-100',
          cardBg: 'border-red-100 bg-red-50/50 hover:bg-red-100/50',
        }
      default:
        return {
          title: 'Total Patients',
          count: patients.length,
          icon: IoPeopleOutline,
          bgColor: 'from-blue-50 to-blue-100/50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-200',
          cardBg: 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50',
        }
    }
  }

  const cardInfo = getCardInfo()
  const Icon = cardInfo.icon

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
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/laboratory/patient-statistics')}
              className="flex items-center gap-2 text-slate-600 hover:text-[#11496c] transition-colors mb-4"
            >
              <IoArrowBackOutline className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Statistics</span>
            </button>
          </div>

          {/* Patient List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#11496c] border-t-transparent mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-slate-600">Loading patients...</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <Icon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">No patients found</p>
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${cardInfo.cardBg} transition-colors cursor-pointer shadow-sm hover:shadow-md`}
                >
                  <img
                    src={patient.image || patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Patient')}&background=11496c&color=fff&size=128&bold=true`}
                    alt={patient.name || 'Patient'}
                    className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Patient')}&background=11496c&color=fff&size=128&bold=true`
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-bold text-slate-900 truncate">{patient.name || 'Patient'}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (patient.status === 'active' || patient.isActive)
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {(patient.status === 'active' || patient.isActive) ? (
                          <IoCheckmarkCircleOutline className="h-3 w-3" />
                        ) : (
                          <IoCloseCircleOutline className="h-3 w-3" />
                        )}
                        {(patient.status === 'active' || patient.isActive) ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {patient.phone && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <IoCallOutline className="h-3.5 w-3.5" />
                          {patient.phone}
                        </p>
                      )}
                      {patient.email && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <IoMailOutline className="h-3.5 w-3.5" />
                          <span className="truncate">{patient.email}</span>
                        </p>
                      )}
                      {(patient.age || patient.gender) && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <IoCalendarOutline className="h-3.5 w-3.5" />
                          {patient.age ? `${patient.age} years` : ''}{patient.age && patient.gender ? ', ' : ''}{patient.gender || ''}
                        </p>
                      )}
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
            className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoPersonCircleOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Patient Details</h2>
                    <p className="text-xs text-white/80">Complete patient information</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Patient Details */}
            <div className="p-4 sm:p-6 space-y-5">
              {/* Patient Profile */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                <img
                  src={selectedPatient.image}
                  alt={selectedPatient.name}
                  className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=11496c&color=fff&size=128&bold=true`
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
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
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <IoCallOutline className="h-4 w-4 text-[#11496c]" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <IoCallOutline className="h-4 w-4 text-slate-500" />
                      {selectedPatient.phone}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <IoMailOutline className="h-4 w-4 text-slate-500" />
                      {selectedPatient.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <IoPersonCircleOutline className="h-4 w-4 text-[#11496c]" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Age</p>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <IoCalendarOutline className="h-4 w-4 text-slate-500" />
                      {selectedPatient.age} years
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPatient.gender}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Blood Group</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPatient.bloodGroup}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <IoLocationOutline className="h-4 w-4 text-[#11496c]" />
                  Address
                </h4>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">{selectedPatient.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LaboratoryPatientDetails

