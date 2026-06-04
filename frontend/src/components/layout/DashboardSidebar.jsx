import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { IoCloseOutline, IoLogOutOutline } from 'react-icons/io5'
import healinnLogo from '../../assets/images/logo.png'

/**
 * DashboardSidebar — shared sidebar for Doctor, Nurse, Laboratory, Pharmacy modules.
 *
 * Props:
 *  - isOpen       {boolean}   Whether the sidebar is visible (mobile drawer)
 *  - onClose      {function}  Close handler
 *  - navItems     {array}     [{ id, label, to, Icon }]
 *  - onLogout     {function}  Logout handler
 *  - roleLabel    {string}    e.g. "Doctor", "Nurse", "Laboratory", "Pharmacy"
 *  - sidebarWidth {string}    Tailwind width class (default "w-[280px]")
 */
const DashboardSidebar = ({
  isOpen,
  onClose,
  navItems = [],
  onLogout,
  roleLabel = 'Portal',
  sidebarWidth = 'w-[280px]',
}) => {
  const closeButtonRef = useRef(null)

  const sidebarNavClasses =
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-300'

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex ${sidebarWidth} flex-col bg-white border-r border-slate-100 shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-modal="true"
        role="dialog"
      >
        {/* Header / Logo */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <img src={healinnLogo} alt="Heallyn" className="h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#11496c] uppercase tracking-tighter leading-none">
                {roleLabel}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Portal
              </span>
            </div>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <IoCloseOutline className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-100">
          <div className="px-2 mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Main Menu
            </span>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ id, label, to, Icon }) => (
              <NavLink
                key={id}
                to={to}
                className={({ isActive }) =>
                  `${sidebarNavClasses} ${
                    isActive
                      ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-[#11496c]'
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
                end={id === 'home'}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-50">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all duration-300"
            onClick={onLogout}
          >
            <IoLogOutOutline className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default DashboardSidebar
