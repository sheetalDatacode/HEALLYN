import { useRef, useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoHelpCircleOutline,
  IoReceiptOutline,
  IoArchiveOutline,
  IoHeartOutline,
  IoPulseOutline,
  IoCallOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import PatientSidebar from './PatientSidebar'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'
import DashboardHeader from './dashboard-sections/DashboardHeader'
import { getPatientProfile } from '../patient-services/patientService'

// All nav items for sidebar and desktop navbar (includes Nurses and Support)
// This is used for: Sidebar (mobile menu) and Desktop top navbar
const allNavItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: IoHomeOutline },
  { id: 'care', label: 'Care', to: '/patient/care', Icon: IoHeartOutline },
  { id: 'call', label: 'Call', to: '/patient/support', Icon: IoCallOutline },
  { id: 'vitals', label: 'Vitals', to: '/patient/prescriptions', Icon: IoPulseOutline },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: IoPersonCircleOutline },
]

const navItems = allNavItems

const PatientNavbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  const [profile, setProfile] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Hide navbar completely on login page
  const isLoginPage = location.pathname === '/patient/login'

  useEffect(() => {
    if (!isLoginPage) {
      getPatientProfile().then(res => {
        if (res.success && res.data) {
          setProfile(res.data.patient || res.data)
        }
      }).catch(err => console.error('Error fetching profile for navbar:', err))
    }
  }, [isLoginPage])

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2'
  const mobileLinkFocusStyle = { '--tw-ring-color': 'rgba(17, 73, 108, 0.7)' }

  const mobileIconWrapper =
    'flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200'

  const handleSidebarToggle = () => {
    if (isSidebarOpen) {
      handleSidebarClose()
    } else {
      setIsSidebarOpen(true)
    }
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      // Import logout function from patientService
      const { logoutPatient } = await import('../patient-services/patientService')
      await logoutPatient()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearPatientTokens } = await import('../patient-services/patientService')
      clearPatientTokens()
      toast.success('Logged out successfully')
    }
    // Navigate to login page
    setTimeout(() => {
      navigate('/patient/login', { replace: true })
    }, 500)
  }

  return (
    <>
      {/* Top Header - Used on all pages except login */}
      {!isLoginPage && (
        <DashboardHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          navigate={navigate}
          profile={profile}
          setIsSidebarOpen={setIsSidebarOpen}
          location={location}
        />
      )}

      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={allNavItems}
        onLogout={handleLogout}
      />

      {/* Mobile Bottom Navbar - Uses navItems (excludes Nurses and Support) */}
      {!isLoginPage && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-3 md:hidden rounded-t-[30px] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+12px)]" style={{ bottom: 0 }}>
          {navItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 flex-1 transition-all duration-200 ${
                  isActive ? 'text-[#11496c]' : 'text-slate-400'
                }`
              }
              end={id === 'home'}
            >
              {({ isActive }) => (
                <>
                  <div className={`relative flex items-center justify-center transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {id === 'home' && (
                       <div className="relative">
                          <div className="absolute -top-3 -left-2 z-10">
                            <div className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold shadow-sm border border-white">New</div>
                          </div>
                          <div className={`h-10 w-10 rounded-full border-2 overflow-hidden ${isActive ? 'border-[#11496c]' : 'border-slate-200'}`}>
                            <img 
                              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                              alt="Home" 
                              className="h-full w-full object-cover bg-slate-100"
                            />
                          </div>
                       </div>
                    )}
                    {id === 'care' && (
                      <div className={`p-2 rounded-full border-2 ${isActive ? 'border-[#11496c] bg-[#11496c]/5' : 'border-slate-200'}`}>
                        <IoHeartOutline className={`h-5 w-5 ${isActive ? 'text-[#11496c]' : 'text-slate-400'}`} />
                      </div>
                    )}
                    {id === 'call' && (
                      <div className={`p-2 rounded-full border-2 ${isActive ? 'border-[#11496c] bg-[#11496c]/5' : 'border-slate-200'}`}>
                        <IoCallOutline className={`h-5 w-5 ${isActive ? 'text-[#11496c]' : 'text-slate-400'}`} />
                      </div>
                    )}
                    {id === 'vitals' && (
                      <div className={`p-2 rounded-full border-2 ${isActive ? 'border-[#11496c] bg-[#11496c]/5' : 'border-slate-200'}`}>
                        <IoPulseOutline className={`h-5 w-5 ${isActive ? 'text-[#11496c]' : 'text-slate-400'}`} />
                      </div>
                    )}
                    {id === 'profile' && (
                      <div className={`p-2 rounded-full border-2 ${isActive ? 'border-[#11496c] bg-[#11496c]/5' : 'border-slate-200'}`}>
                        <IoPersonCircleOutline className={`h-5 w-5 ${isActive ? 'text-[#11496c]' : 'text-slate-400'}`} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-[#11496c]' : 'text-slate-400'}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export default PatientNavbar

