import { NavLink } from 'react-router-dom'
import { IoLogOutOutline } from 'react-icons/io5'
import healinnLogo from '../../assets/images/logo.png'
import NotificationBell from '../NotificationBell'

/**
 * DashboardHeader — shared desktop-only top header for Doctor, Nurse, Laboratory modules.
 *
 * Props:
 *  - navItems      {array}    [{ id, label, to, Icon }]
 *  - dashboardPath {string}   e.g. "/doctor/dashboard"
 *  - onLogout      {function} Logout handler
 *  - sidebarWidth  {string}   Tailwind left offset (default "lg:left-[280px]")
 */
const DashboardHeader = ({
  navItems = [],
  dashboardPath = '/',
  onLogout,
  sidebarWidth = 'lg:left-[280px]',
}) => {
  return (
    <header
      className={`hidden lg:block fixed top-0 left-0 ${sidebarWidth} right-0 z-50 bg-white border-b border-slate-200 shadow-sm`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to={dashboardPath} className="flex items-center">
              <img
                src={healinnLogo}
                alt="Heallyn"
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ id, label, to, Icon }) => (
              <NavLink
                key={id}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#11496c] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
                end={id === 'home'}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Side — Notifications & Logout */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <IoLogOutOutline className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
