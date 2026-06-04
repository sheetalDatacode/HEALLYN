import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../contexts/ToastContext'
import { getLaboratoryDashboard, getLaboratoryOrders, getLaboratoryTests, getLaboratoryPatients, getLaboratoryReports, getLaboratoryProfile } from '../laboratory-services/laboratoryService'
import NotificationBell from '../../../components/NotificationBell'
import {
  IoBagHandleOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoCalendarOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoArrowForwardOutline,
  IoFlaskOutline,
  IoChatbubbleOutline,
  IoCloudUploadOutline,
  IoPaperPlaneOutline,
  IoCloseOutline,
  IoMailOutline,
  IoListOutline,
  IoStatsChartOutline,
  IoSearchOutline,
} from 'react-icons/io5'

// Default stats (will be replaced by API data)
const defaultStats = {
  totalOrders: 0,
  testReports: 0,
  notifications: 0,
  recentOrders: 0,
  requestResponses: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  thisMonthOrders: 0,
  lastMonthOrders: 0,
}

// Mock data removed - now using backend API

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'ready':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'ready':
    case 'completed':
      return IoCheckmarkCircleOutline
    case 'cancelled':
      return IoCloseCircleOutline
    default:
      return IoTimeOutline
  }
}

const LaboratoryDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0)
  const [availableTestsCount, setAvailableTestsCount] = useState(0)
  const [recentPatients, setRecentPatients] = useState([])
  const [patients, setPatients] = useState([]) // For patient selection dropdown
  const [stats, setStats] = useState(defaultStats)
  const [loading, setLoading] = useState(false) // Start with false to show content immediately
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getLaboratoryProfile()
        if (response.success && response.data) {
          const lab = response.data.laboratory || response.data
          setProfile({
            name: lab.labName || lab.name || '',
            address: lab.address || {},
            isActive: lab.isActive !== undefined ? lab.isActive : true,
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        // Don't show error toast as it's not critical
      }
    }
    fetchProfile()
  }, [])

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getLaboratoryDashboard()
        
        if (response.success && response.data) {
          const data = response.data
          setStats({
            totalOrders: data.totalOrders || 0,
            testReports: data.totalReports || 0,
            notifications: 0, // Not in API response yet
            recentOrders: data.todayOrders || 0,
            requestResponses: 0, // Not in API response yet
            thisMonthEarnings: data.todayEarnings || data.thisMonthEarnings || 0,
            lastMonthEarnings: data.lastMonthEarnings || 0,
            thisMonthOrders: data.todayOrders || data.thisMonthOrders || 0,
            lastMonthOrders: data.lastMonthOrders || 0,
          })
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])
  const [todayOrders, setTodayOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false) // Start with false
  const [recentTestReports, setRecentTestReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)

  // Fetch today's orders from API
  useEffect(() => {
    const fetchTodayOrders = async () => {
      try {
        setLoadingOrders(true)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStart = today.toISOString()
        const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()

        const response = await getLaboratoryOrders({ 
          startDate: todayStart, 
          endDate: todayEnd, 
          limit: 50, // fetch more and then show top 10
        })
        
        if (response.success && response.data) {
          const ordersData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.orders || response.data.leads || []
          
          const transformed = ordersData.map(order => ({
            id: order._id || order.id,
            _id: order._id || order.id,
            patientName: order.patientId?.firstName && order.patientId?.lastName
              ? `${order.patientId.firstName} ${order.patientId.lastName}`
              : order.patientId?.name || order.patientName || 'Unknown Patient',
            patient: order.patientId || { firstName: order.patientName?.split(' ')[0] || '', lastName: order.patientName?.split(' ')[1] || '' },
            patientImage: order.patientId?.profileImage || order.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientId?.firstName || order.patientName || 'Patient')}&background=3b82f6&color=fff&size=128`,
            time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            status: order.status || 'pending',
            totalAmount: order.totalAmount || order.amount || 0,
            amount: order.totalAmount || order.amount || 0,
            deliveryType: order.deliveryType || order.deliveryOption || 'home',
            testRequestId: order._id || order.id,
            tests: order.tests?.map(t => t.name || t) || order.testNames || [],
            createdAt: order.createdAt || new Date().toISOString(),
          }))
          
          // Sort by createdAt desc and keep top 10
          transformed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setTodayOrders(transformed.slice(0, 10))
        }
      } catch (error) {
        console.error('Error fetching today orders:', error)
        // Don't show error toast as it's not critical
      } finally {
        setLoadingOrders(false)
      }
    }

    fetchTodayOrders()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch available tests count from API
  useEffect(() => {
    const fetchTestsCount = async () => {
      try {
        const response = await getLaboratoryTests({ limit: 1 })
        if (response.success && response.data) {
          // Backend returns total in data.pagination.total
          setAvailableTestsCount(response.data.pagination?.total || response.data.total || 0)
        }
      } catch (error) {
        console.error('Error fetching tests count:', error)
        // Don't show error toast as it's not critical
      }
    }

    fetchTestsCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchTestsCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch recent test reports from API
  useEffect(() => {
    let isMounted = true
    
    const fetchRecentReports = async () => {
      try {
        // Use AbortController to prevent slow requests from blocking
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        setLoadingReports(true)
        const response = await getLaboratoryReports({ limit: 8, status: 'shared' })
        
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        if (response.success && response.data) {
          const reportsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.reports || []
          
          const transformed = reportsData.map(report => {
            const patient = report.patientId || report.patient || {}
            const order = report.orderId || report.order || {}
            const patientName = patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.name || 'Unknown Patient'
            
            return {
              id: report._id || report.id,
              patientName: patientName,
              patientImage: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=6366f1&color=fff&size=128&bold=true`,
              testName: report.testName || report.test?.name || 'Test Report',
              reportDate: report.createdAt || report.reportDate || new Date().toISOString(),
              status: report.status || 'completed',
              orderId: order._id || order.id || report.orderId || `ORD-${(report._id || report.id).toString().slice(-6)}`,
            }
          })
          
          // Sort by date (newest first)
          transformed.sort((a, b) => {
            const dateA = new Date(a.reportDate).getTime()
            const dateB = new Date(b.reportDate).getTime()
            return dateB - dateA
          })
          
          if (isMounted) {
            setRecentTestReports(transformed)
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          
        } else {
          console.error('Error fetching recent test reports:', error)
        }
        // Don't show error toast as it's not critical
        if (isMounted) {
          setRecentTestReports([])
        }
      } finally {
        if (isMounted) {
          setLoadingReports(false)
        }
      }
    }

    fetchRecentReports()
    // Refresh every 30 seconds, but only if component is still mounted
    const interval = setInterval(() => {
      if (isMounted) {
        fetchRecentReports()
      }
    }, 30000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await getLaboratoryPatients({ limit: 20 })
        
        if (response.success && response.data) {
          const patientsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.patients || []
          
          // Transform for recent patients display
          const transformedRecent = patientsData.slice(0, 8).map(patient => ({
            id: patient._id || patient.id,
            name: patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.name || 'Unknown Patient',
            image: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.firstName || patient.name || 'Patient')}&background=3b82f6&color=fff&size=128`,
            lastTestDate: patient.lastOrderDate || patient.lastTestDate || '',
            totalTests: patient.totalOrders || patient.totalTests || 0,
            status: patient.status || 'active',
          }))
          setRecentPatients(transformedRecent)
          
          // Transform for patient selection dropdown
          const transformedForDropdown = patientsData.map(patient => ({
            id: patient._id || patient.id,
            name: patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.name || 'Unknown Patient',
            email: patient.email || '',
          }))
          setPatients(transformedForDropdown)
        }
      } catch (error) {
        console.error('Error fetching patients:', error)
        // Don't show error toast as it's not critical
      }
    }

    fetchPatients()
  }, [])

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

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutLaboratory } = await import('../laboratory-services/laboratoryService')
      await logoutLaboratory()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearLaboratoryTokens } = await import('../laboratory-services/laboratoryService')
      clearLaboratoryTokens()
      toast.success('Logged out successfully')
    }
    // Force navigation to login page - full page reload to clear all state
    setTimeout(() => {
      window.location.href = '/laboratory/login'
    }, 500)
  }

  const handleTestReportsClick = (e) => {
    e.stopPropagation()
    navigate('/laboratory/test-reports')
  }


  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      toast.warning('Please select a PDF file')
    }
  }

  const handleSendToPatient = async () => {
    if (!selectedFile) {
      toast.warning('Please select a PDF file')
      return
    }
    if (!selectedPatient) {
      toast.warning('Please select a patient')
      return
    }

    const patient = patients.find(p => p.id === selectedPatient)
    if (!patient) {
      toast.error('Patient not found')
      return
    }

    if (!window.confirm(`Send prescription PDF to ${patient.name}?`)) {
      return
    }

    setIsSending(true)
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 150)

      // Simulate API call to send PDF
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      
      // Add to uploaded files list
      const newFile = {
        id: `file-${Date.now()}`,
        name: selectedFile.name,
        patientId: selectedPatient,
        patientName: patient.name,
        patientEmail: patient.email,
        uploadedDate: new Date().toISOString(),
        sentDate: new Date().toISOString(),
        status: 'sent',
        fileSize: selectedFile.size,
      }
      setUploadedFiles([newFile, ...uploadedFiles])
      
      // Reset after success
      setTimeout(() => {
        setShowUploadModal(false)
        setSelectedFile(null)
        setSelectedPatient('')
        setUploadStatus(null)
        setUploadProgress(0)
      }, 1500)
    } catch (error) {
      setUploadStatus('error')
      setUploadProgress(0)
      toast.error('Failed to send PDF. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseModal = () => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setSelectedPatient('')
    setShowHistory(false)
    setUploadStatus(null)
    setUploadProgress(0)
  }


  return (
    <>
      <section className="flex flex-col gap-6 pb-24 -mt-28 lg:-mt-28 lg:pb-8">
        {/* Top Header with Gradient Background - Hidden on Desktop */}
        <header 
          className="lg:hidden relative text-white -mx-4 mb-4 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)'
          }}
        >
          <div className="px-4 pt-5 pb-4">
            {/* Top Section - Laboratory Info */}
            <div className="flex items-start justify-between mb-3.5">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-0.5">
                  {profile?.name || 'Laboratory'}
                </h1>
                <p className="text-sm font-normal text-white/95 leading-tight">
                  {profile?.address?.city || profile?.address?.line1 || 'Address'} • <span className="text-white font-medium">{profile?.isActive ? 'Online' : 'Offline'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Notification Icon */}
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                  <NotificationBell className="text-white" />
                </div>
                <button
                  type="button"
                  onClick={handleSidebarToggle}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label="Menu"
                >
                  <IoMenuOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar - Desktop Only */}
        <div className="hidden lg:block mb-6">
          <div className="relative w-full group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110">
              <IoSearchOutline className="h-5 w-5 text-slate-400 group-focus-within:text-[#11496c] transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Search orders, patients, test reports..."
              className="w-full pl-11 pr-20 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] transition-all duration-300 shadow-sm hover:shadow-md hover:border-[#11496c]/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
              <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-300 rounded">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4 w-full">
          {/* Total Orders */}
          <article
            onClick={() => navigate('/laboratory/orders')}
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl border border-emerald-100 bg-white p-3 lg:p-8 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 active:scale-[0.98] lg:hover:scale-105 min-w-0"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-300"></div>
            
            <div className="relative flex items-start justify-between mb-2 lg:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-sm font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1 lg:mb-3 group-hover:text-emerald-800 transition-colors">Total Orders</p>
                <p className="text-xl lg:text-5xl font-bold text-slate-900 leading-none group-hover:text-emerald-700 transition-colors duration-300">{loading ? '...' : stats.totalOrders}</p>
              </div>
              <div className="flex h-8 w-8 lg:h-16 lg:w-16 items-center justify-center rounded-lg lg:rounded-xl bg-emerald-500 text-white group-hover:bg-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <IoBagHandleOutline className="text-base lg:text-3xl" aria-hidden="true" />
              </div>
            </div>
            <p className="relative text-[10px] lg:text-sm text-slate-600 leading-tight group-hover:text-slate-700 transition-colors">This month</p>
            <div className="hidden lg:block mt-4 pt-4 border-t border-slate-100 group-hover:border-emerald-200 transition-colors">
              <p className="text-sm text-slate-500 group-hover:text-emerald-700 font-medium transition-colors">New this month: <span className="text-emerald-600 font-semibold">+{loading ? '...' : stats.thisMonthOrders}</span></p>
            </div>
          </article>

          {/* Test Reports */}
          <article
            onClick={handleTestReportsClick}
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl border border-orange-100 bg-white p-3 lg:p-8 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-orange-300 active:scale-[0.98] lg:hover:scale-105 min-w-0"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-500/10 transition-all duration-300"></div>
            
            <div className="relative flex items-start justify-between mb-2 lg:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-sm font-semibold uppercase tracking-wide text-orange-700 leading-tight mb-1 lg:mb-3 group-hover:text-orange-800 transition-colors">Test Reports</p>
                <p className="text-xl lg:text-5xl font-bold text-slate-900 leading-none group-hover:text-orange-700 transition-colors duration-300">{loading ? '...' : stats.testReports}</p>
              </div>
              <div className="flex h-8 w-8 lg:h-16 lg:w-16 items-center justify-center rounded-lg lg:rounded-xl bg-orange-500 text-white group-hover:bg-orange-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <IoDocumentTextOutline className="text-base lg:text-3xl" aria-hidden="true" />
              </div>
            </div>
            <p className="relative text-[10px] lg:text-sm text-slate-600 leading-tight group-hover:text-slate-700 transition-colors">Pending review</p>
            <div className="hidden lg:block mt-4 pt-4 border-t border-slate-100 group-hover:border-orange-200 transition-colors">
              <p className="text-sm text-slate-500 group-hover:text-orange-700 font-medium transition-colors">Completed: <span className="text-orange-600 font-semibold">{loading ? '...' : Math.max(0, stats.testReports - 5)}</span></p>
            </div>
          </article>

          {/* Request Orders */}
          <article
            onClick={() => navigate('/laboratory/request-orders')}
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl border border-blue-100 bg-white p-3 lg:p-8 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 active:scale-[0.98] lg:hover:scale-105 min-w-0"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
            
            <div className="relative flex items-start justify-between mb-2 lg:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-sm font-semibold uppercase tracking-wide text-blue-700 leading-tight mb-1 lg:mb-3 group-hover:text-blue-800 transition-colors">Request</p>
                <p className="text-xl lg:text-5xl font-bold text-slate-900 leading-none group-hover:text-blue-700 transition-colors duration-300">{stats.requestResponses || 0}</p>
              </div>
              <div className="flex h-8 w-8 lg:h-16 lg:w-16 items-center justify-center rounded-lg lg:rounded-xl bg-blue-500 text-white group-hover:bg-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <IoListOutline className="text-base lg:text-3xl" aria-hidden="true" />
              </div>
            </div>
            <p className="relative text-[10px] lg:text-sm text-slate-600 leading-tight group-hover:text-slate-700 transition-colors">Patient requests</p>
            <div className="hidden lg:block mt-4 pt-4 border-t border-slate-100 group-hover:border-blue-200 transition-colors">
              <p className="text-sm text-slate-500 group-hover:text-blue-700 font-medium transition-colors">Pending: <span className="text-blue-600 font-semibold">{stats.requestResponses || 0}</span></p>
            </div>
          </article>

          {/* Available Tests */}
          <article
            onClick={() => navigate('/laboratory/available-tests')}
            className="group relative overflow-hidden rounded-xl lg:rounded-2xl border border-purple-100 bg-white p-3 lg:p-8 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 active:scale-[0.98] lg:hover:scale-105 min-w-0"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/10 transition-all duration-300"></div>
            
            <div className="relative flex items-start justify-between mb-2 lg:mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-sm font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1 lg:mb-3 group-hover:text-purple-800 transition-colors">Available Tests</p>
                <p className="text-xl lg:text-5xl font-bold text-slate-900 leading-none group-hover:text-purple-700 transition-colors duration-300">{availableTestsCount}</p>
              </div>
              <div className="flex h-8 w-8 lg:h-16 lg:w-16 items-center justify-center rounded-lg lg:rounded-xl bg-purple-500 text-white group-hover:bg-purple-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <IoFlaskOutline className="text-base lg:text-3xl" aria-hidden="true" />
              </div>
            </div>
            <p className="relative text-[10px] lg:text-sm text-slate-600 leading-tight group-hover:text-slate-700 transition-colors">In catalog</p>
            <div className="hidden lg:block mt-4 pt-4 border-t border-slate-100 group-hover:border-purple-200 transition-colors">
              <p className="text-sm text-slate-500 group-hover:text-purple-700 font-medium transition-colors">Active tests: <span className="text-purple-600 font-semibold">{availableTestsCount}</span></p>
            </div>
          </article>
        </div>

        {/* Today's Orders */}
        <section aria-labelledby="orders-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="orders-title" className="text-base font-semibold text-slate-900">
                Today's Orders
              </h2>
              <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
                {loadingOrders ? '...' : todayOrders.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/laboratory/orders')}
              className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
            >
              See all
            </button>
          </header>

          <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
            {loadingOrders ? (
              <div className="lg:col-span-4 text-center py-8">
                <p className="text-sm text-slate-500">Loading orders...</p>
              </div>
            ) : todayOrders.length === 0 ? (
              <div className="lg:col-span-4 text-center py-8">
                <IoBagHandleOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">No orders today</p>
                <p className="text-xs text-slate-500 mt-1">Your orders will appear here</p>
              </div>
            ) : (
              todayOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              const patientName = order.patient?.firstName && order.patient?.lastName
                ? `${order.patient.firstName} ${order.patient.lastName}`
                : order.patientName || order.patient?.name || 'Unknown Patient'
              const patientImage = order.patient?.profileImage || order.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=3b82f6&color=fff&size=128&bold=true`
              const testRequestId = order.testRequestId || order.labLead?._id || order._id
              const tests = order.tests || order.investigations || []
              const orderTime = order.time || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '')
              const deliveryType = order.deliveryType || order.deliveryOptions || 'pickup'
              const totalAmount = order.totalAmount || order.amount || 0
              
              return (
                <article
                  key={order._id || order.id}
                  onClick={() => navigate('/laboratory/orders')}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.02]"
                >
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                  
                  <div className="relative flex flex-col items-start gap-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className="relative shrink-0">
                        <img
                          src={patientImage}
                          alt={patientName}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#11496c]/30 transition-all duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                          }}
                        />
                        {order.status === 'ready' && (
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white group-hover:scale-110 group-hover:ring-emerald-400 transition-all duration-300">
                            <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300">{patientName}</h3>
                            {testRequestId && (
                              <p className="mt-0.5 text-xs text-slate-600 group-hover:text-slate-700 transition-colors">Test Request: {testRequestId}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(order.status)} group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                            <StatusIcon className="h-3 w-3" />
                            {order.status}
                          </span>
                        </div>
                        {tests.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tests.slice(0, 2).map((test, idx) => {
                              const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                              return (
                                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 group-hover:bg-slate-200 transition-colors">
                                  <IoFlaskOutline className="h-2.5 w-2.5" />
                                  {testName}
                                </span>
                              )
                            })}
                            {tests.length > 2 && (
                              <span className="text-[10px] text-slate-500">+{tests.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full flex flex-wrap items-center gap-2 text-xs text-slate-600 group-hover:text-slate-700 transition-colors">
                      {orderTime && (
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-3.5 w-3.5 text-[#11496c]" />
                          <span className="font-medium">{orderTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <IoLocationOutline className="h-3.5 w-3.5 text-[#11496c]" />
                        <span>{deliveryType === 'home' ? 'Home Delivery' : 'Pickup'}</span>
                      </div>
                      {totalAmount > 0 && (
                        <div className="flex items-center gap-1 font-semibold text-emerald-600">
                          <IoWalletOutline className="h-3.5 w-3.5" />
                          <span>{formatCurrency(totalAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            }))}
          </div>
        </section>

        {/* Recent Test Reports */}
        <section aria-labelledby="recent-reports-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="recent-reports-title" className="text-base font-semibold text-slate-900">
              Recent Test Reports
            </h2>
            <button
              type="button"
              onClick={() => navigate('/laboratory/test-reports')}
              className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
            >
              See all
            </button>
          </header>

          <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
            {loadingReports ? (
              <div className="lg:col-span-4 text-center py-8">
                <p className="text-sm text-slate-500">Loading reports...</p>
              </div>
            ) : recentTestReports.length === 0 ? (
              <div className="lg:col-span-4 text-center py-8">
                <IoDocumentTextOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No test reports yet</p>
                <p className="text-xs text-slate-400 mt-1">Test reports will appear here once generated</p>
              </div>
            ) : (
              recentTestReports.map((report) => {
              return (
                <article
                  key={report.id}
                  onClick={() => navigate('/laboratory/test-reports')}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.02]"
                >
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                  
                  <div className="relative flex flex-col items-start gap-3">
                    <div className="flex items-start gap-3 w-full">
                      <img
                        src={report.patientImage}
                        alt={report.patientName}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#11496c]/30 transition-all duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(report.patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300">{report.patientName}</h3>
                            <p className="mt-0.5 text-xs text-slate-600 group-hover:text-slate-700 transition-colors line-clamp-1">Test: {report.testName}</p>
                            <p className="mt-0.5 text-xs text-slate-500 group-hover:text-slate-600 transition-colors line-clamp-1">Order: {report.orderId}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200 group-hover:scale-105 transition-transform duration-300 shrink-0">
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full flex flex-wrap items-center gap-2 text-xs text-slate-600 group-hover:text-slate-700 transition-colors">
                      <div className="flex items-center gap-1">
                        <IoCalendarOutline className="h-3.5 w-3.5 text-[#11496c]" />
                        <span>{formatDate(report.reportDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c]" />
                        <span className="line-clamp-1">{report.testName}</span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            }))
            }
          </div>
        </section>

        {/* Recent Patients */}
        <section aria-labelledby="patients-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="patients-title" className="text-base font-semibold text-slate-900">
              Recent Patients
            </h2>
            <button
              type="button"
              onClick={() => navigate('/laboratory/patients')}
              className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
            >
              See all
            </button>
          </header>

          <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
            {recentPatients.map((patient) => (
              <article
                key={patient.id}
                onClick={() => navigate(`/laboratory/patients/${patient.id}`)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.02]"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                
                <div className="relative flex flex-col items-start gap-3">
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={patient.image}
                      alt={patient.name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#11496c]/30 transition-all duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300">{patient.name}</h3>
                          <p className="mt-0.5 text-xs text-slate-600 group-hover:text-slate-700 transition-colors">Last test: {formatDate(patient.lastTestDate)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 group-hover:scale-105 transition-transform duration-300 shrink-0">
                          {patient.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600 group-hover:text-slate-700 transition-colors">
                        <div className="flex items-center gap-1">
                          <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c]" />
                          <span>{patient.totalTests} tests</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

      </section>

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Theme Color */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoCloudUploadOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Upload Prescription PDF</h2>
                    <p className="text-xs text-white/80">Select PDF from your system</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Status Bar */}
            {uploadStatus && (
              <div className="px-4 sm:px-6 pt-4">
                <div className={`rounded-xl p-3 ${
                  uploadStatus === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  {uploadStatus === 'uploading' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-700">Uploading...</span>
                        <span className="text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">PDF sent successfully!</span>
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2">
                      <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Failed to send PDF</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-5">
              {/* Tabs - Upload/History */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setShowHistory(false)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                    !showHistory 
                      ? 'border-[#11496c] text-[#11496c]' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 relative ${
                    showHistory 
                      ? 'border-[#11496c] text-[#11496c]' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  History
                  {uploadedFiles.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                      {uploadedFiles.length}
                    </span>
                  )}
                </button>
              </div>

              {!showHistory ? (
                <>
                  {/* File Upload Section - Theme Color */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Select PDF File</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="pdf-upload"
                      />
                      <label
                        htmlFor="pdf-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[rgba(17,73,108,0.3)] rounded-xl bg-[rgba(17,73,108,0.05)] cursor-pointer transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.1)]"
                      >
                        {selectedFile ? (
                          <>
                            <IoDocumentTextOutline className="h-8 w-8 text-[#11496c] mb-2" />
                            <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                          </>
                        ) : (
                          <>
                            <IoCloudUploadOutline className="h-8 w-8 text-[#11496c] mb-2" />
                            <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                            <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                          </>
                        )}
                      </label>
                    </div>
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove file
                      </button>
                    )}
                  </div>

                  {/* Patient Selection - Theme Color */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Select Patient</label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* History Section */
                <div>
                  {uploadedFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <IoDocumentTextOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-500">No upload history</p>
                      <p className="text-xs text-slate-400 mt-1">Uploaded files will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-[rgba(17,73,108,0.3)] hover:shadow-md transition-all">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52]">
                            <IoDocumentTextOutline className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-slate-600">
                                <span className="font-medium">Patient:</span> {file.patientName}
                              </p>
                              <p className="text-xs text-slate-600">
                                <span className="font-medium">Email:</span> {file.patientEmail}
                              </p>
                              <p className="text-xs text-slate-500">
                                Sent on {new Date(file.sentDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {file.fileSize && (
                                <p className="text-xs text-slate-500">
                                  Size: {(file.fileSize / 1024).toFixed(2)} KB
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                              <IoCheckmarkCircleOutline className="h-3 w-3" />
                              Sent
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons - Theme Color */}
              {!showHistory && (
                <div className="flex gap-3 pt-2 border-t border-slate-200">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendToPatient}
                    disabled={!selectedFile || !selectedPatient || isSending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#11496c] to-[#0d3a52] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(17,73,108,0.3)] transition-all hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <IoTimeOutline className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IoPaperPlaneOutline className="h-4 w-4" />
                        Send to Patient
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default LaboratoryDashboard



