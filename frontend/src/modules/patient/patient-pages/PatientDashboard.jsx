import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoCall,
} from 'react-icons/io5'
import PatientSidebar from '../patient-components/PatientSidebar'
import { useToast } from '../../../contexts/ToastContext'
import { getPatientDashboard, getPatientProfile } from '../patient-services/patientService'

// Import Refactored Dashboard Sections
import HeroBanner from '../patient-components/dashboard-sections/HeroBanner'
import ServicesSlider from '../patient-components/dashboard-sections/ServicesSlider'
import WelcomeSection from '../patient-components/dashboard-sections/WelcomeSection'
import HealthSupplementsSection from '../patient-components/dashboard-sections/HealthSupplementsSection'
import ArticlesSection from '../patient-components/dashboard-sections/ArticlesSection'
import TrustAwardsSection from '../patient-components/dashboard-sections/TrustAwardsSection'
import RadiologyTests from '../patient-components/dashboard-sections/RadiologyTests'
import PromoBanners from '../patient-components/dashboard-sections/PromoBanners'
import InteractiveCards from '../patient-components/dashboard-sections/InteractiveCards'
import HealthConcerns from '../patient-components/dashboard-sections/HealthConcerns'

const navItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: () => null }, // Icons handled in Sidebar
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: () => null },
  { id: 'transactions', label: 'Transactions', to: '/patient/transactions', Icon: () => null },
  { id: 'history', label: 'History', to: '/patient/history', Icon: () => null },
  { id: 'support', label: 'Support', to: '/patient/support', Icon: () => null },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: () => null },
]

const PatientDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [profile, setProfile] = useState(null)

  // Fetch profile and dashboard data
  useEffect(() => {
    const fetchData = async () => {
      const { getAuthToken } = await import('../../../utils/apiClient')
      const token = getAuthToken('patient')

      if (!token) {
        navigate('/patient/login')
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const [profileResponse, dashboardResponse] = await Promise.allSettled([
          getPatientProfile().catch(() => ({ success: false })),
          getPatientDashboard()
        ])

        if (profileResponse.status === 'fulfilled' && profileResponse.value.success && profileResponse.value.data) {
          const patient = profileResponse.value.data.patient || profileResponse.value.data
          setProfile({ ...patient, address: patient.address || {} })
        }

        const response = dashboardResponse.status === 'fulfilled' ? dashboardResponse.value : null
        
        if (!response || !response.success) {
          throw new Error(dashboardResponse.reason?.message || 'Failed to load dashboard')
        }

        if (response.data) {
          setDashboardData(response.data)
          if (response.data.upcomingAppointments) {
            setUpcomingAppointments(response.data.upcomingAppointments)
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes('Authentication token missing') || err.message.includes('Unauthorized') || err.message.includes('401'))) {
          const { clearTokens } = await import('../../../utils/apiClient')
          clearTokens('patient')
          if (!window.location.pathname.includes('/login')) navigate('/patient/login')
          return
        }
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast, navigate])

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutPatient } = await import('../patient-services/patientService')
      await logoutPatient()
      toast.success('Logged out successfully')
    } catch (error) {
      const { clearPatientTokens } = await import('../patient-services/patientService')
      clearPatientTokens()
      toast.success('Logged out successfully')
    }
    setTimeout(() => navigate('/patient/login', { replace: true }), 500)
  }

  return (
    <section className="bg-[#f8fafc] min-h-screen pb-32 overflow-x-hidden">

      <HeroBanner navigate={navigate} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-10">
        <ServicesSlider navigate={navigate} />

        <WelcomeSection 
          patientName={dashboardData?.patientName?.split(' ')[0] || 'User'}
          upcomingAppointmentsCount={upcomingAppointments.length}
          navigate={navigate}
        />

        <HealthSupplementsSection navigate={navigate} />

        <ArticlesSection />

        <TrustAwardsSection />

        <RadiologyTests />

        <PromoBanners rewardsConfig={dashboardData?.rewardsConfig} />

        <InteractiveCards />

        <HealthConcerns />
      </div>

      {/* Floating Call Button */}
      <button className="fixed bottom-24 right-4 md:right-8 z-40 bg-white shadow-2xl rounded-full p-1 md:p-1.5 flex items-center gap-2 md:gap-3 pr-4 md:pr-6 border border-slate-100 group active:scale-95 transition-all hover:scale-105">
         <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-[#11496c] flex items-center justify-center text-white shadow-xl shadow-[#11496c]/40">
            <IoCall className="h-5 w-5 md:h-6 md:w-6" />
         </div>
         <span className="text-sm md:text-base font-black text-slate-800 group-hover:text-[#11496c] transition-colors">Call to Book</span>
      </button>

      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </section>
  )
}

export default PatientDashboard
