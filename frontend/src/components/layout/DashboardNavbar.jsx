import { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IoMenuOutline } from 'react-icons/io5'
import healinnLogo from '../../assets/images/logo.png'
import DashboardSidebar from './DashboardSidebar'
import { useSidebar } from './SidebarContext'
import NotificationBell from '../NotificationBell'

/**
 * DashboardNavbar — shared mobile/desktop navigation bar for Doctor, Nurse, Laboratory, Pharmacy.
 *
 * Props:
 *  - navItems         {array}     All nav items [{ id, label, to, Icon }]
 *  - bottomNavItems   {array}     Items shown in mobile bottom nav (filtered navItems). If not provided, navItems are used.
 *  - portalLabel      {string}    e.g. "Doctor Portal"
 *  - portalIcon       {element}   JSX icon for the mobile header badge
 *  - dashboardPath    {string}    e.g. "/doctor/dashboard" — hides top header on this path
 *  - onLogout         {function}  Logout handler
 *  - sidebarOffset    {string}    Tailwind class for desktop left offset (default "lg:left-[280px]")
 *  - roleLabel        {string}    Role label for sidebar (e.g. "Doctor")
 *  - sidebarWidth     {string}    Sidebar width Tailwind class (default "w-[280px]")
 *  - mobileHiddenClass {string}  Tailwind class for hiding mobile bottom nav (default "lg:hidden")
 */
const DashboardNavbar = ({
  navItems = [],
  bottomNavItems,
  portalLabel = 'Portal',
  portalIcon = null,
  dashboardPath = '/dashboard',
  onLogout,
  sidebarOffset = 'lg:left-[280px]',
  roleLabel = 'Portal',
  sidebarWidth = 'w-[280px]',
  mobileHiddenClass = 'lg:hidden',
}) => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar()
  const toggleButtonRef = useRef(null)
  const location = useLocation()

  const isDashboardPage =
    location.pathname === dashboardPath ||
    location.pathname === dashboardPath + '/' ||
    location.pathname === dashboardPath.replace('/dashboard', '')

  const isLoginPage =
    location.pathname.includes('/login') || location.pathname.includes('/signup')

  // Bottom nav items: use provided bottomNavItems or fallback to full navItems
  const mobileNavItems = bottomNavItems ?? navItems

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-2xl px-1 py-1 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-all duration-300'

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    closeSidebar()
  }

  const handleLogout = () => {
    handleSidebarClose()
    onLogout?.()
  }

  return (
    <>
      {/* Top Header — hidden on dashboard page */}
      {!isDashboardPage && !isLoginPage && (
        <header
          className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/90 px-4 py-4 backdrop-blur-xl border-b border-slate-100 shadow-sm md:px-8 ${sidebarOffset}`}
        >
          <div className="flex items-center gap-3">
            {/* Mobile icon badge */}
            {portalIcon && (
              <div className="h-10 w-10 rounded-xl bg-[#11496c] flex items-center justify-center text-white shadow-lg shadow-[#11496c]/20 lg:hidden">
                {portalIcon}
              </div>
            )}
            <img
              src={healinnLogo}
              alt="Heallyn"
              className="h-7 w-auto object-contain hidden sm:block lg:hidden"
              loading="lazy"
            />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest hidden lg:block">
              {portalLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              ref={toggleButtonRef}
              className={`${mobileHiddenClass} h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600`}
              aria-label="Toggle navigation menu"
              onClick={toggleSidebar}
            >
              <IoMenuOutline className="text-2xl" aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      {/* Sidebar */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        navItems={navItems}
        onLogout={handleLogout}
        roleLabel={roleLabel}
        sidebarWidth={sidebarWidth}
      />

      {/* Mobile Bottom Navigation */}
      {!isLoginPage && (
        <nav
          className={`fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-2 border-t border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl ${mobileHiddenClass} pb-safe`}
        >
          {mobileNavItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `${mobileLinkBase} ${
                  isActive ? 'scale-110' : 'text-slate-400 opacity-60'
                }`
              }
              end={id === 'home'}
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`${mobileIconWrapper} ${
                      isActive
                        ? 'bg-[#11496c] text-white shadow-xl shadow-[#11496c]/30'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-tighter ${
                      isActive ? 'text-[#11496c]' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export default DashboardNavbar
