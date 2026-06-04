import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAuthToken } from '../../../utils/apiClient'
import { getDashboardStats, getDashboardChartData, getUsers, getDoctors, getPharmacies, getLaboratories, getNurses, getAdminAppointments, getAdminRequests, getRecentActivities } from '../admin-services/adminService'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoPeopleOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoNotificationsOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoCallOutline,
  IoBagHandleOutline,
  IoHeartOutline,
} from 'react-icons/io5'

const defaultStats = {
  totalUsers: 0,
  totalDoctors: 0,
  totalPharmacies: 0,
  totalLaboratories: 0,
  totalNurses: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingVerifications: 0,
  thisMonthUsers: 0,
  lastMonthUsers: 0,
  thisMonthRevenue: 0,
  lastMonthRevenue: 0,
  thisMonthConsultations: 0,
  lastMonthConsultations: 0,
}

// Default empty chart data
const defaultChartData = {
  revenue: [],
  userGrowth: [],
  consultations: [],
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getTimeAgo = (date) => {
  const now = new Date()
  const dateObj = new Date(date)
  const diff = now - dateObj
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else {
    return 'Just now'
  }
}

// Chart Components
const RevenueLineChart = ({ data }) => {
  // Validate and ensure data is an array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-32">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    )
  }
  
  // Process data - include all items, ensure values are numbers (0 is valid)
  const validData = data.map((d, index) => ({
    month: d?.month || `Month ${index + 1}`,
    value: typeof d?.value === 'number' && !isNaN(d.value) ? d.value : 0,
  })).filter(d => d !== null && d !== undefined)
  
  // If no valid data after processing, return empty chart
  if (validData.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-32">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    )
  }
  
  const values = validData.map(d => d.value || 0)
  const maxValue = Math.max(...values, 0) // Ensure at least 0
  const minValue = Math.min(...values, 0) // Ensure at least 0
  const range = maxValue - minValue || 1 // Avoid division by zero
  const width = 100
  const height = 120
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = validData.map((item, index) => {
    const x = padding + (index / Math.max(validData.length - 1, 1)) * chartWidth
    const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${padding},${padding + chartHeight} ${points} ${padding + chartWidth},${padding + chartHeight}`}
          fill="url(#revenueGradient)"
        />
        {validData.map((item, index) => {
          const x = padding + (index / Math.max(validData.length - 1, 1)) * chartWidth
          const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#10b981"
              className="hover:r-3 transition-all"
            />
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        {validData.map((item, index) => (
          <span key={index} className="text-[10px]">{item.month || ''}</span>
        ))}
      </div>
    </div>
  )
}

const UserGrowthBarChart = ({ data }) => {
  // Validate and ensure data is an array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-32">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    )
  }
  
  // Process data - include all items, ensure values are numbers (0 is valid)
  const validData = data.map((d, index) => ({
    month: d?.month || `Month ${index + 1}`,
    users: typeof d?.users === 'number' && !isNaN(d.users) ? d.users : 0,
  })).filter(d => d !== null && d !== undefined)
  
  // If no valid data after processing, return empty chart
  if (validData.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-32">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    )
  }
  
  const values = validData.map(d => d.users || 0)
  const maxValue = Math.max(...values, 0) || 1 // Ensure at least 1 to show bars
  const width = 100
  const height = 120
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const barWidth = chartWidth / validData.length * 0.6

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        {validData.map((item, index) => {
          const barHeight = (item.users / maxValue) * chartHeight
          const x = padding + (index / validData.length) * chartWidth + (chartWidth / validData.length - barWidth) / 2
          const y = padding + chartHeight - barHeight
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#11496c"
                rx="2"
                className="hover:opacity-80 transition-opacity"
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        {validData.map((item, index) => (
          <span key={index} className="text-[10px]">{item.month || ''}</span>
        ))}
      </div>
    </div>
  )
}

const ConsultationsAreaChart = ({ data }) => {
  // Validate and ensure data is an array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-32">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    )
  }
  
  // Process data - include all items, ensure values are numbers (0 is valid)
  const validData = data.map((d, index) => ({
    month: d?.month || `Month ${index + 1}`,
    consultations: typeof d?.consultations === 'number' && !isNaN(d.consultations) ? d.consultations : 0,
  })).filter(d => d !== null && d !== undefined)
  
  // If no valid data after processing, return empty chart
  if (validData.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-32">
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    )
  }
  
  const values = validData.map(d => d.consultations || 0)
  const maxValue = Math.max(...values, 0) // Ensure at least 0
  const minValue = Math.min(...values, 0) // Ensure at least 0
  const range = maxValue - minValue || 1 // Avoid division by zero
  const width = 100
  const height = 120
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = validData.map((item, index) => {
    const x = padding + (index / Math.max(validData.length - 1, 1)) * chartWidth
    const y = padding + chartHeight - ((item.consultations - minValue) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="consultationsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${padding},${padding + chartHeight} ${points} ${padding + chartWidth},${padding + chartHeight}`}
          fill="url(#consultationsGradient)"
        />
        {validData.map((item, index) => {
          const x = padding + (index / Math.max(validData.length - 1, 1)) * chartWidth
          const y = padding + chartHeight - ((item.consultations - minValue) / range) * chartHeight
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#6366f1"
              className="hover:r-3 transition-all"
            />
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        {validData.map((item, index) => (
          <span key={index} className="text-[10px]">{item.month || ''}</span>
        ))}
      </div>
    </div>
  )
}

const UserDistributionChart = ({ patients, doctors, pharmacies, laboratories }) => {
  // Ensure all values are numbers
  const safePatients = Number(patients) || 0
  const safeDoctors = Number(doctors) || 0
  const safePharmacies = Number(pharmacies) || 0
  const safeLaboratories = Number(laboratories) || 0
  
  const total = safePatients + safeDoctors + safePharmacies + safeLaboratories
  
  // If total is 0, show empty state
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center">
          <p className="text-xs text-slate-400">No data</p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900">Patients</p>
              <p className="text-[10px] text-slate-600">0 (0%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900">Doctors</p>
              <p className="text-[10px] text-slate-600">0 (0%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900">Pharmacies</p>
              <p className="text-[10px] text-slate-600">0 (0%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900">Laboratories</p>
              <p className="text-[10px] text-slate-600">0 (0%)</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const data = [
    { label: 'Patients', value: safePatients, color: '#3b82f6' },
    { label: 'Doctors', value: safeDoctors, color: '#10b981' },
    { label: 'Pharmacies', value: safePharmacies, color: '#8b5cf6' },
    { label: 'Laboratories', value: safeLaboratories, color: '#f59e0b' },
  ]

  let currentAngle = -90
  const centerX = 50
  const centerY = 50
  const radius = 35

  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
    const largeArcFlag = angle > 180 ? 1 : 0

    return {
      path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
    }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            className="hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{item.label}</p>
              <p className="text-[10px] text-slate-600">{item.value} ({((item.value / total) * 100).toFixed(1)}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'user':
      return IoPeopleOutline
    case 'doctor':
      return IoMedicalOutline
    case 'pharmacy':
      return IoBusinessOutline
    case 'laboratory':
      return IoFlaskOutline
    case 'consultation':
      return IoDocumentTextOutline
    default:
      return IoNotificationsOutline
  }
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [stats, setStats] = useState(defaultStats)
  const [isLoadingStats, setIsLoadingStats] = useState(false) // Start with false to show content immediately
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0)
  const [todayScheduledCount, setTodayScheduledCount] = useState(0)
  const [todayRescheduledCount, setTodayRescheduledCount] = useState(0)
  const [doctorAppointmentsOverview, setDoctorAppointmentsOverview] = useState([])
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0)
  const [confirmedPaymentCount, setConfirmedPaymentCount] = useState(0)
  const [paymentNotifications, setPaymentNotifications] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false) // Start with false
  const [chartData, setChartData] = useState(defaultChartData)
  const [isLoadingCharts, setIsLoadingCharts] = useState(false) // Start with false

  // Fetch dashboard stats from backend
  useEffect(() => {
    const token = getAuthToken('admin')
    if (!token) {
      return
    }

    const fetchDashboardStats = async () => {
      try {
        setIsLoadingStats(true)
        
        // Try to get stats from dashboard endpoint first
        let dashboardData = null
        try {
          const dashboardResponse = await getDashboardStats()
          if (dashboardResponse.success && dashboardResponse.data) {
            dashboardData = dashboardResponse.data
          }
        } catch (error) {
          
        }

        // If dashboard endpoint doesn't exist, fetch from individual endpoints
        if (!dashboardData) {
          // Fetch all items to get accurate counts (or use pagination.total if available)
          const [usersResponse, doctorsResponse, pharmaciesResponse, laboratoriesResponse, nursesResponse] = await Promise.allSettled([
            getUsers({ limit: 1000 }),
            getDoctors({ limit: 1000 }),
            getPharmacies({ limit: 1000 }),
            getLaboratories({ limit: 1000 }),
            getNurses({ limit: 1000 }),
          ])

          // Helper function to extract count from response
          const extractCount = (response) => {
            if (response.status !== 'fulfilled' || !response.value?.success) {
              return 0
            }
            const data = response.value.data
            // Try pagination.total first (most accurate)
            if (data?.pagination?.total !== undefined && data.pagination.total !== null) {
              return Number(data.pagination.total) || 0
            }
            // Fallback to items array length
            if (Array.isArray(data?.items)) {
              return data.items.length
            }
            // Fallback to direct array
            if (Array.isArray(data)) {
              return data.length
            }
            return 0
          }

          // Extract counts using helper function
          const totalUsers = extractCount(usersResponse)
          const totalDoctors = extractCount(doctorsResponse)
          const totalPharmacies = extractCount(pharmaciesResponse)
          const totalLaboratories = extractCount(laboratoriesResponse)
          const totalNurses = extractCount(nursesResponse)

          
          
          // Get pending verifications count from all providers
          let pendingVerifications = 0
          if (doctorsResponse.status === 'fulfilled' && doctorsResponse.value?.success) {
            const doctors = doctorsResponse.value.data?.items || (Array.isArray(doctorsResponse.value.data) ? doctorsResponse.value.data : []) || []
            if (Array.isArray(doctors)) {
              pendingVerifications += doctors.filter(d => d.status === 'pending').length
            }
          }
          if (pharmaciesResponse.status === 'fulfilled' && pharmaciesResponse.value?.success) {
            const pharmacies = pharmaciesResponse.value.data?.items || (Array.isArray(pharmaciesResponse.value.data) ? pharmaciesResponse.value.data : []) || []
            if (Array.isArray(pharmacies)) {
              pendingVerifications += pharmacies.filter(p => p.status === 'pending').length
            }
          }
          if (laboratoriesResponse.status === 'fulfilled' && laboratoriesResponse.value?.success) {
            const laboratories = laboratoriesResponse.value.data?.items || (Array.isArray(laboratoriesResponse.value.data) ? laboratoriesResponse.value.data : []) || []
            if (Array.isArray(laboratories)) {
              pendingVerifications += laboratories.filter(l => l.status === 'pending').length
            }
          }
          if (nursesResponse.status === 'fulfilled' && nursesResponse.value?.success) {
            const nurses = nursesResponse.value.data?.items || (Array.isArray(nursesResponse.value.data) ? nursesResponse.value.data : []) || []
            if (Array.isArray(nurses)) {
              pendingVerifications += nurses.filter(n => n.status === 'pending').length
            }
          }

          setStats({
            totalUsers,
            totalDoctors,
            totalPharmacies,
            totalLaboratories,
            totalNurses,
            totalOrders: dashboardData?.totalOrders || 0,
            totalRevenue: dashboardData?.totalRevenue || 0,
            pendingVerifications,
            thisMonthUsers: dashboardData?.thisMonthUsers || dashboardData?.thisMonthPatients || 0,
            lastMonthUsers: dashboardData?.lastMonthUsers || dashboardData?.lastMonthPatients || 0,
            thisMonthRevenue: dashboardData?.thisMonthRevenue || 0,
            lastMonthRevenue: dashboardData?.lastMonthRevenue || 0,
          })
        } else {
          // Use dashboard endpoint data
          setStats({
            totalUsers: dashboardData.totalPatients || dashboardData.totalUsers || 0,
            totalDoctors: dashboardData.totalDoctors || 0,
            totalPharmacies: dashboardData.totalPharmacies || 0,
            totalLaboratories: dashboardData.totalLaboratories || 0,
            totalNurses: dashboardData.totalNurses || 0,
            totalOrders: dashboardData.totalOrders || 0,
            totalRevenue: dashboardData.totalRevenue || 0,
            pendingVerifications: dashboardData.pendingVerifications || 0,
            thisMonthUsers: dashboardData.thisMonthUsers || dashboardData.thisMonthPatients || 0,
            lastMonthUsers: dashboardData.lastMonthUsers || dashboardData.lastMonthPatients || 0,
            thisMonthRevenue: dashboardData.thisMonthRevenue || 0,
            lastMonthRevenue: dashboardData.lastMonthRevenue || 0,
          })
        }
      } catch (error) {
        // Silently handle 401 errors (user logged out)
        if (error.message && error.message.includes('Authentication token missing')) {
          return
        }
        console.error('Error fetching dashboard stats:', error)
        // Keep default stats on error
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchDashboardStats()
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      const token = getAuthToken('admin')
      if (token) {
        fetchDashboardStats()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])


  // Load real appointment count and doctor overview from API
  // This MUST be called before any conditional returns to follow React Hooks rules
  useEffect(() => {
    // Check token before loading
    const token = getAuthToken('admin')
    if (!token) {
      return
    }
    const loadAppointments = async () => {
      try {
        const response = await getAdminAppointments({ limit: 1000 })
        const allAppts = response.success && response.data
          ? (response.data.items || response.data || [])
          : []
        
        
        
        // Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        // Filter today's appointments - check appointmentDate field
        const todayApts = allAppts.filter((apt) => {
          if (!apt.appointmentDate && !apt.date) return false
          
          const aptDate = new Date(apt.appointmentDate || apt.date)
          if (isNaN(aptDate.getTime())) return false
          
          aptDate.setHours(0, 0, 0, 0)
          const isToday = aptDate.getTime() >= today.getTime() && aptDate.getTime() < tomorrow.getTime()
          return isToday
        })
        
        
        
        const doctors = Array.from(doctorMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 5) // Show top 5 doctors
        
        setDoctorAppointmentsOverview(doctors || [])
      } catch (error) {
        // Silently handle 401 errors (user logged out)
        if (error.message && error.message.includes('Authentication token missing')) {
          return
        }
        console.error('❌ Error loading appointments:', error)
        setTodayAppointmentsCount(0)
        setTodayScheduledCount(0)
        setTodayRescheduledCount(0)
        setDoctorAppointmentsOverview([])
      }
    }
    
    loadAppointments()
    
    // Listen for appointment booking event to refresh appointments
    const handleAppointmentBooked = () => {
      loadAppointments()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    // Refresh every 30 seconds (reduced from 2 seconds to avoid excessive API calls)
    const interval = setInterval(() => {
      const token = getAuthToken('admin')
      if (token) {
        loadAppointments()
      }
    }, 30000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [])

  // Load payment data from API
  useEffect(() => {
    const token = getAuthToken('admin')
    if (!token) {
      return
    }
    
    const loadPaymentData = async () => {
    try {
        // Load payment-related requests from API
        const response = await getAdminRequests({ limit: 1000 })
        const allRequests = response.success && response.data
          ? (response.data.items || response.data || [])
          : []
      
      // Count pending payments (requests with payment status pending)
      const pendingPayments = allRequests.filter(
        (req) => req.paymentStatus === 'pending' || (req.status === 'pending' && req.paymentStatus !== 'confirmed')
      )
      
      // Count confirmed payments (requests with payment confirmed but not yet assigned)
      const confirmedPayments = allRequests.filter(
        (req) => req.paymentStatus === 'confirmed' && (req.status === 'pending' || req.status === 'payment_confirmed')
      )
      
      setPendingPaymentCount(pendingPayments.length)
      setConfirmedPaymentCount(confirmedPayments.length)
      
      // Create payment notifications from recent payment updates
      const notifications = allRequests
        .filter((req) => req.paymentStatus === 'confirmed' || req.paymentStatus === 'pending')
        .slice(0, 5) // Show latest 5
          .map((req) => {
            const patient = req.patientId || {}
            const patientName = patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : req.patientName || 'Patient'
            return {
              id: req._id || req.id || `payment-${Date.now()}`,
          type: req.type || 'payment',
          message: req.paymentStatus === 'confirmed' 
                ? `Payment confirmed for ${patientName}'s request`
                : `Payment pending for ${patientName}'s request`,
          timestamp: req.updatedAt || req.createdAt || new Date().toISOString(),
            }
          })
      
      setPaymentNotifications(notifications)
    } catch (error) {
        // Silently handle 401 errors (user logged out)
        if (error.message && error.message.includes('Authentication token missing')) {
          return
        }
      console.error('Error loading payment data:', error)
      setPendingPaymentCount(0)
      setConfirmedPaymentCount(0)
      setPaymentNotifications([])
    }
    }
    
    loadPaymentData()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      const token = getAuthToken('admin')
      if (token) {
        loadPaymentData()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch recent activities from backend
  useEffect(() => {
    const token = getAuthToken('admin')
    if (!token) {
      return
    }

    const fetchRecentActivities = async () => {
      // Check token before making request
      const currentToken = getAuthToken('admin')
      if (!currentToken) {
        setIsLoadingActivities(false)
        return
      }

      try {
        setIsLoadingActivities(true)
        const response = await getRecentActivities(10)
        
        if (response.success && response.data) {
          const activities = Array.isArray(response.data) ? response.data : []
          
          // Transform activities to match UI format
          const transformedActivities = activities.map((activity) => {
            try {
              let action = ''
              let name = ''
              let type = activity.type || 'notification'
              let status = 'success'
              let image = ''
              
              const data = activity.data || {}
              const dateStr = activity.date || activity.createdAt || new Date().toISOString()
              let date
              try {
                date = new Date(dateStr)
                if (isNaN(date.getTime())) {
                  date = new Date()
                }
              } catch {
                date = new Date()
              }
              const timeAgo = getTimeAgo(date)
            
            if (activity.type === 'appointment') {
              const patient = data.patientId || {}
              const doctor = data.doctorId || {}
              const patientName = patient.firstName && patient.lastName
                ? `${patient.firstName} ${patient.lastName}`
                : patient.name || 'Patient'
              const doctorName = doctor.firstName && doctor.lastName
                ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                : doctor.name || 'Doctor'
              
              // Check if appointment is cancelled first
              const isCancelled = data.status === 'cancelled'
              // Check if appointment is rescheduled
              const isRescheduled = data.rescheduledAt || data.isRescheduled || false
              
              if (isCancelled) {
                action = 'Appointment cancelled'
                name = `${patientName} with ${doctorName}`
                type = 'consultation'
                status = 'pending' // Show as pending/warning for cancelled
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=ef4444&color=fff&size=128&bold=true`
              } else if (data.status === 'completed') {
                action = 'Consultation completed'
                name = doctorName
                type = 'consultation'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=6366f1&color=fff&size=128&bold=true`
              } else if (isRescheduled) {
                action = 'Appointment rescheduled'
                name = `${patientName} with ${doctorName}`
                type = 'consultation'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=10b981&color=fff&size=128&bold=true`
              } else if (data.status === 'scheduled' || data.status === 'confirmed') {
                action = 'Appointment scheduled'
                name = `${patientName} with ${doctorName}`
                type = 'consultation'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=6366f1&color=fff&size=128&bold=true`
              } else {
                action = 'Appointment created'
                name = `${patientName} with ${doctorName}`
                type = 'consultation'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=6366f1&color=fff&size=128&bold=true`
              }
            } else if (activity.type === 'order') {
              const patient = data.patientId || {}
              const patientName = patient.firstName && patient.lastName
                ? `${patient.firstName} ${patient.lastName}`
                : patient.name || 'Patient'
              
              if (data.status === 'completed' || data.status === 'delivered') {
                action = 'Order completed'
                name = patientName
                type = 'order'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=3b82f6&color=fff&size=128&bold=true`
              } else {
                action = 'New order placed'
                name = patientName
                type = 'order'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=3b82f6&color=fff&size=128&bold=true`
              }
            } else if (activity.type === 'request') {
              const patient = data.patientId || {}
              const patientName = patient.firstName && patient.lastName
                ? `${patient.firstName} ${patient.lastName}`
                : patient.name || 'Patient'
              
              action = 'New request submitted'
              name = patientName
              type = 'request'
              status = data.status === 'pending' ? 'pending' : 'success'
              image = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=3b82f6&color=fff&size=128&bold=true`
            } else if (activity.type === 'verification') {
              if (data.firstName || data.lastName) {
                // Doctor
                const doctorName = `Dr. ${data.firstName || ''} ${data.lastName || ''}`.trim()
                action = 'Doctor verification pending'
                name = doctorName
                type = 'doctor'
                status = 'pending'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=10b981&color=fff&size=128&bold=true`
              } else if (data.pharmacyName) {
                // Pharmacy
                action = 'Pharmacy verification pending'
                name = data.pharmacyName
                type = 'pharmacy'
                status = 'pending'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.pharmacyName)}&background=8b5cf6&color=fff&size=128&bold=true`
              } else if (data.labName) {
                // Laboratory
                action = 'Laboratory verification pending'
                name = data.labName
                type = 'laboratory'
                status = 'pending'
                image = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.labName)}&background=f59e0b&color=fff&size=128&bold=true`
              }
            }
            
              return {
                id: activity._id || activity.id || `act-${Date.now()}-${Math.random()}`,
                type,
                action: action || 'Activity',
                name: name || 'Unknown',
                image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Unknown')}&background=3b82f6&color=fff&size=128&bold=true`,
                time: timeAgo,
                status,
              }
            } catch (err) {
              console.error('Error transforming activity:', err, activity)
              return {
                id: activity._id || activity.id || `act-${Date.now()}-${Math.random()}`,
                type: 'notification',
                action: 'Activity',
                name: 'Unknown',
                image: `https://ui-avatars.com/api/?name=Unknown&background=3b82f6&color=fff&size=128&bold=true`,
                time: 'Just now',
                status: 'success',
              }
            }
          })
          
          setRecentActivities(transformedActivities)
        }
      } catch (error) {
        // Silently handle 401 errors (user logged out)
        if (error.message && error.message.includes('Authentication token missing')) {
          // User logged out, stop fetching
          return
        }
        console.error('Error fetching recent activities:', error)
        setRecentActivities([])
      } finally {
        setIsLoadingActivities(false)
      }
    }
    
    fetchRecentActivities()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      const token = getAuthToken('admin')
      if (token) {
        fetchRecentActivities()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])


  // Fetch chart data from backend
  useEffect(() => {
    const token = getAuthToken('admin')
    if (!token) {
      return
    }

    const fetchChartData = async () => {
      try {
        setIsLoadingCharts(true)
        
        const response = await getDashboardChartData()
        
        
        if (response.success && response.data) {
          // Normalize data to ensure all values are numbers
          const normalizeArray = (arr, type = 'value') => {
            if (!Array.isArray(arr)) {
              console.warn(`⚠️ Chart data ${type} is not an array:`, arr)
              return []
            }
            const normalized = arr.map((item, index) => {
              const normalizedItem = {
                month: item.month || `Month ${index + 1}`,
                value: typeof item.value === 'number' ? item.value : (Number(item.value) || 0),
                users: typeof item.users === 'number' ? item.users : (Number(item.users) || 0),
                consultations: typeof item.consultations === 'number' ? item.consultations : (Number(item.consultations) || 0),
              }
              return normalizedItem
            })
            
            return normalized
          }
          
          const normalizedData = {
            revenue: normalizeArray(response.data.revenue || [], 'revenue'),
            userGrowth: normalizeArray(response.data.userGrowth || [], 'userGrowth'),
            consultations: normalizeArray(response.data.consultations || [], 'consultations'),
          }
          
          
          setChartData(normalizedData)
        } else {
          console.warn('⚠️ Invalid chart data response:', response)
          setChartData(defaultChartData)
        }
      } catch (error) {
        // Silently handle 401 errors (user logged out)
        if (error.message && error.message.includes('Authentication token missing')) {
          return
        }
        console.error('❌ Error fetching chart data:', error)
        setChartData(defaultChartData)
      } finally {
        setIsLoadingCharts(false)
      }
    }
    
    fetchChartData()
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      const token = getAuthToken('admin')
      if (token) {
        fetchChartData()
      }
    }, 300000)
    return () => clearInterval(interval)
  }, [])

  const usersChange = stats.lastMonthUsers > 0 
    ? ((stats.thisMonthUsers - stats.lastMonthUsers) / stats.lastMonthUsers) * 100 
    : 0
  const revenueChange = stats.lastMonthRevenue > 0 
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100 
    : (stats.thisMonthRevenue > 0 ? 100 : 0) // If last month was 0 and this month has revenue, show 100% increase
  const consultationsChange = stats.lastMonthConsultations > 0 
    ? ((stats.thisMonthConsultations - stats.lastMonthConsultations) / stats.lastMonthConsultations) * 100 
    : 0

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <>
      <section className="flex flex-col gap-3 sm:gap-4 pb-20 pt-0 bg-white">
        {/* Stats Cards Grid - First Row (Same Height as Second Row) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Total Patients */}
          <article
            onClick={() => navigate('/admin/users')}
            className="relative overflow-hidden rounded-xl border border-[rgba(17,73,108,0.2)] bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-0.5">Total Patients</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#11496c] text-white shrink-0">
                <IoPeopleOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] flex-wrap">
              {usersChange >= 0 ? (
                <>
                  <IoTrendingUpOutline className="h-2.5 w-2.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">+{usersChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <IoTrendingDownOutline className="h-2.5 w-2.5 text-red-600" />
                  <span className="text-red-600 font-semibold">{usersChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-slate-600">vs last month</span>
            </div>
          </article>

          {/* Total Doctors */}
          <article
            onClick={() => navigate('/admin/doctors')}
            className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-0.5">Total Doctors</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.totalDoctors}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                <IoMedicalOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-600 leading-tight">Active doctors</p>
          </article>

          {/* Total Pharmacies */}
          <article
            onClick={() => navigate('/admin/pharmacies')}
            className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-0.5">Pharmacies</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.totalPharmacies}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-500 text-white shrink-0">
                <IoBusinessOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-600 leading-tight">Registered</p>
          </article>

          {/* Total Laboratories */}
          <article
            onClick={() => navigate('/admin/laboratories')}
            className="relative overflow-hidden rounded-xl border border-amber-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-amber-700 leading-tight mb-0.5">Laboratories</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.totalLaboratories}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                <IoFlaskOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-600 leading-tight">Active labs</p>
          </article>

          {/* Total Nurses */}
          <article
            onClick={() => navigate('/admin/nurses')}
            className="relative overflow-hidden rounded-xl border border-pink-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-pink-700 leading-tight mb-0.5">Nurses</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.totalNurses}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-pink-500 text-white shrink-0">
                <IoHeartOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-600 leading-tight">Registered</p>
          </article>
        </div>

        {/* Stats Cards Grid - Second Row (Larger Cards - Unchanged) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">

          {/* Orders */}
          <article
            onClick={() => navigate('/admin/orders')}
            className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-blue-700 leading-tight mb-1">Orders</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.totalOrders.toLocaleString()}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500 text-white shrink-0">
                <IoBagHandleOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">All time</p>
          </article>

          {/* Appointments */}
          <article
            onClick={() => navigate('/admin/appointments')}
            className="relative overflow-hidden rounded-xl border border-indigo-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-indigo-700 leading-tight mb-1">Appointments</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none">{todayAppointmentsCount}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-500 text-white shrink-0">
                <IoCalendarOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">Scheduled: {todayScheduledCount}</p>
              <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">Rescheduled: {todayRescheduledCount}</p>
            </div>
          </article>

          {/* Total Revenue */}
          <article
            onClick={() => navigate('/admin/revenue')}
            className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Revenue</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : formatCurrency(stats.totalRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] sm:text-[10px] flex-wrap">
                  {revenueChange >= 0 ? (
                    <>
                      <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">+{revenueChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                      <span className="text-red-600 font-semibold">{revenueChange.toFixed(1)}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                <IoWalletOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">vs last month</p>
          </article>

          {/* Verifications */}
          <article
            onClick={() => navigate('/admin/verification')}
            className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-3 sm:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-orange-700 leading-tight mb-1">Verifications</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                  {isLoadingStats ? '...' : stats.pendingVerifications}
                </p>
              </div>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-orange-500 text-white shrink-0">
                <IoNotificationsOutline className="text-base sm:text-lg" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">Requires attention</p>
          </article>
        </div>

        {/* Appointments Overview - Doctor Cards */}
        {doctorAppointmentsOverview.length > 0 && (
          <section aria-labelledby="appointments-overview-title" className="space-y-3 sm:space-y-4">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 id="appointments-overview-title" className="text-base sm:text-lg font-semibold text-slate-900">
                  Appointments Overview
                </h2>
                <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
                  {doctorAppointmentsOverview.length}
                </span>
              </div>
              <button
                onClick={() => navigate('/admin/appointments')}
                className="text-xs font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors"
              >
                View All
              </button>
            </header>

            <div className="space-y-3">
              {doctorAppointmentsOverview.map((doctor) => (
                <article
                  key={`${doctor.doctorName}_${doctor.specialty}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#11496c]/10">
                      <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900">{doctor.doctorName}</h3>
                          <p className="mt-0.5 text-sm text-slate-600">{doctor.specialty}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
                          <p className="mt-0.5 text-lg font-bold text-slate-900">{doctor.total}</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Scheduled</p>
                          <p className="mt-0.5 text-lg font-bold text-blue-700">{doctor.scheduled}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Rescheduled</p>
                          <p className="mt-0.5 text-lg font-bold text-emerald-700">{doctor.rescheduled}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Completed</p>
                          <p className="mt-0.5 text-lg font-bold text-emerald-700">{doctor.completed}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600">Cancelled</p>
                          <p className="mt-0.5 text-lg font-bold text-red-700">{doctor.cancelled}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}


        {/* Payment Status Notifications */}
        {(pendingPaymentCount > 0 || confirmedPaymentCount > 0 || paymentNotifications.length > 0) && (
          <section aria-labelledby="payment-status-title" className="space-y-3 sm:space-y-4">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 id="payment-status-title" className="text-base sm:text-lg font-semibold text-slate-900">
                  Payment Status
                </h2>
                {(pendingPaymentCount > 0 || confirmedPaymentCount > 0) && (
                  <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
                    {pendingPaymentCount + confirmedPaymentCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/admin/requests')}
                className="text-xs font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors"
              >
                View All
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pending Payments */}
              {pendingPaymentCount > 0 && (
                <article
                  onClick={() => navigate('/admin/requests?filter=pending_payment')}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 mb-1">Pending Payments</p>
                      <p className="text-2xl font-bold text-amber-900">{pendingPaymentCount}</p>
                      <p className="text-[10px] text-amber-600 mt-1">Waiting for patient payment</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white">
                      <IoTimeOutline className="h-6 w-6" />
                    </div>
                  </div>
                </article>
              )}

              {/* Confirmed Payments - Ready for Assignment */}
              {confirmedPaymentCount > 0 && (
                <article
                  onClick={() => navigate('/admin/requests?filter=payment_confirmed')}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Payment Confirmed</p>
                      <p className="text-2xl font-bold text-emerald-900">{confirmedPaymentCount}</p>
                      <p className="text-[10px] text-emerald-600 mt-1">Ready to assign orders</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <IoCheckmarkCircleOutline className="h-6 w-6" />
                    </div>
                  </div>
                </article>
              )}
            </div>

            {/* Payment Notifications */}
            {paymentNotifications.length > 0 && (
              <div className="space-y-2">
                {paymentNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    onClick={() => {
                      // Navigate to requests page (notifications will be managed by backend in future)
                      navigate('/admin/requests')
                    }}
                    className="rounded-xl border border-emerald-200 bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 shrink-0">
                        <IoCheckmarkCircleOutline className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Recent Activities */}
        <section aria-labelledby="activities-title" className="space-y-3 sm:space-y-4">
          <header className="flex items-center justify-between">
            <h2 id="activities-title" className="text-base sm:text-lg font-semibold text-slate-900">
              Recent Activities
            </h2>
          </header>

          <div className="space-y-2 sm:space-y-3">
            {isLoadingActivities ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-sm text-slate-600">Loading activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-sm text-slate-600">No recent activities</p>
              </div>
            ) : (
              recentActivities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type)
              return (
                <article
                  key={activity.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.name)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">{activity.action}</h3>
                          <p className="mt-0.5 text-xs text-slate-600">{activity.name}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(activity.status)}`}>
                          {activity.status === 'success' ? (
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                          ) : (
                            <IoTimeOutline className="h-3 w-3" />
                          )}
                          {activity.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                </article>
              )
              })
            )}
          </div>
        </section>

        {/* Revenue & Statistics Overview */}
        <section aria-labelledby="overview-title">
          <header className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 id="overview-title" className="text-base sm:text-lg font-semibold text-slate-900">
              Platform Overview
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">This Month Revenue</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                    {isLoadingStats ? '...' : formatCurrency(stats.thisMonthRevenue)}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs flex-wrap">
                    {revenueChange >= 0 ? (
                      <>
                        <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">+{revenueChange.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-slate-500">vs last month</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-100 shrink-0">
                  <IoWalletOutline className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">This Month Consultations</p>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                    {isLoadingStats ? '...' : stats.thisMonthConsultations || 0}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs flex-wrap">
                    {consultationsChange >= 0 ? (
                      <>
                        <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">+{consultationsChange.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{consultationsChange.toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-slate-500">vs last month</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.15)] shrink-0">
                  <IoDocumentTextOutline className="h-5 w-5 sm:h-6 sm:w-6 text-[#11496c]" />
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Revenue Trend Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Revenue Trend</h2>
              <p className="mt-1 text-[10px] sm:text-xs text-slate-600">Last 6 months</p>
            </header>
            {isLoadingCharts ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm text-slate-600">Loading chart data...</p>
              </div>
            ) : (
              <RevenueLineChart data={chartData.revenue} />
            )}
          </section>

          {/* User Growth Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">User Growth</h2>
              <p className="mt-1 text-[10px] sm:text-xs text-slate-600">Last 6 months</p>
            </header>
            {isLoadingCharts ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm text-slate-600">Loading chart data...</p>
              </div>
            ) : (
              <UserGrowthBarChart data={chartData.userGrowth} />
            )}
          </section>

          {/* Consultations Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Consultations Trend</h2>
              <p className="mt-1 text-[10px] sm:text-xs text-slate-600">Last 6 months</p>
            </header>
            {isLoadingCharts ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-sm text-slate-600">Loading chart data...</p>
              </div>
            ) : (
              <ConsultationsAreaChart data={chartData.consultations} />
            )}
          </section>

          {/* User Distribution Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">User Distribution</h2>
              <p className="mt-1 text-[10px] sm:text-xs text-slate-600">By user type</p>
            </header>
            <UserDistributionChart 
              patients={isLoadingStats ? 0 : (stats.totalUsers || 0)}
              doctors={isLoadingStats ? 0 : (stats.totalDoctors || 0)}
              pharmacies={isLoadingStats ? 0 : (stats.totalPharmacies || 0)}
              laboratories={isLoadingStats ? 0 : (stats.totalLaboratories || 0)}
            />
          </section>
        </div>
      </section>
    </>
  )
}

export default AdminDashboard

