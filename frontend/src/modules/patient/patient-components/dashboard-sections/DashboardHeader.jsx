import React from 'react'
import { IoSearchOutline, IoHomeOutline, IoPulseOutline, IoArchiveOutline, IoPersonCircleOutline, IoMenuOutline, IoPeopleOutline, IoHeartOutline, IoCallOutline } from 'react-icons/io5'
import NotificationBell from '../../../../components/NotificationBell'
import healinnLogo from '../../../../assets/images/logo.png'

const DashboardHeader = ({ 
  searchTerm, 
  setSearchTerm, 
  navigate, 
  profile, 
  setIsSidebarOpen,
  location 
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-6">
         {/* Logo & Search Area */}
         <div className="flex items-center gap-6 flex-1">
            <div 
              onClick={() => navigate('/patient/dashboard')}
              className="flex items-center cursor-pointer group shrink-0"
            >
               <img
                 src={healinnLogo}
                 alt="Heallyn"
                 className="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105"
               />
            </div>
            
            <div className="flex-1 relative max-w-md hidden lg:block">
               <input
                 type="text"
                 placeholder="Search for 'CBC', 'Blood Test'..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/10 focus:border-[#11496c] transition-all"
               />
               <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
         </div>

         {/* Desktop Navigation Links */}
         <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {[
              { label: 'Dashboard', to: '/patient/dashboard', icon: IoHomeOutline },
              { label: 'Care', to: '/patient/care', icon: IoHeartOutline },
              { label: 'Vitals', to: '/patient/prescriptions', icon: IoPulseOutline },
              { label: 'History', to: '/patient/history', icon: IoArchiveOutline },
              { label: 'Call', to: '/patient/support', icon: IoCallOutline },
              { label: 'Profile', to: '/patient/profile', icon: IoPersonCircleOutline },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className={`flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  location.pathname === item.to 
                    ? 'bg-[#11496c] text-white shadow-md shadow-[#11496c]/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#11496c]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
         </nav>

         {/* Action Icons */}
         <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 hidden xl:flex flex-col items-center shadow-sm">
               <span className="text-[9px] font-bold text-[#11496c] uppercase tracking-tighter">Wallet Balance</span>
               <span className="text-sm font-black text-slate-800">₹{profile?.walletBalance || 0}</span>
            </div>
            <NotificationBell className="text-slate-600" />
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-slate-50 rounded-full border border-slate-200 text-slate-600 md:hidden"
            >
              <IoMenuOutline className="h-6 w-6" />
            </button>
         </div>
      </div>
      {/* Mobile/Small Tablet Search Bar */}
      <div className="px-4 pb-3 lg:hidden bg-white">
         <div className="relative">
            <input
              type="text"
              placeholder="Search for 'CBC', 'MRI'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
            <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
         </div>
      </div>
    </header>
  )
}

export default DashboardHeader
