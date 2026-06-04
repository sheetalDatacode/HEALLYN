import React from 'react'
import { IoPersonCircleOutline, IoArrowForwardOutline, IoChevronDown, IoTicketOutline } from 'react-icons/io5'

const HealthKarmaSection = ({ patientName, isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-xl font-bold text-white tracking-tight">HealthKarma</h2>
             <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Powered by AI</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-emerald-400/30 flex items-center justify-center text-xl text-emerald-400 font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            ?
          </div>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                 <IoPersonCircleOutline className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                 <h3 className="text-sm font-bold text-white flex items-center gap-1">
                   Hi, {patientName}
                 </h3>
                 <p className="text-[10px] text-white/50 font-medium tracking-wide">Welcome back!</p>
              </div>
           </div>
        </div>

        <div className="space-y-4 pt-1">
          <p className="text-xs text-white/70 font-medium leading-relaxed">
            Your HealthKarma score helps us personalize your healthcare journey.
          </p>
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
            Calculate My Score
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#e0f7fa] rounded-[24px] p-4 md:p-5 space-y-4 shadow-sm border border-cyan-100 h-full">
      <h2 className="text-xl md:text-xl font-bold text-slate-800 px-1">HealthKarma</h2>
      
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-1">
            Hi, {patientName} <IoChevronDown className="h-4 w-4" />
          </h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Welcome to HealthKarma!</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-4 shadow-sm flex items-center gap-3 md:gap-4 border border-cyan-50 relative overflow-hidden">
         <div className="flex-1 space-y-2 md:space-y-3 z-10">
            <h3 className="text-base md:text-lg font-extrabold text-slate-900">Find Your HealthKarma</h3>
            <p className="text-[10px] md:text-xs text-slate-600 font-medium leading-relaxed">
              Your HealthKarma score will help us understand your health status better
            </p>
            <button className="bg-[#11496c] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold flex items-center gap-2 hover:bg-[#0d3a52] transition-colors whitespace-nowrap">
              Calculate Your Score <IoChevronDown className="h-3 w-3 -rotate-90" />
            </button>
         </div>
         <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-[6px] md:border-[10px] border-slate-50 flex items-center justify-center text-xl md:text-3xl text-cyan-400 font-bold shadow-inner shrink-0">
            ?
         </div>
      </div>
    </div>
  )
}

const WelcomeSection = ({ 
  patientName, 
  upcomingAppointmentsCount, 
  navigate 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
      {/* Welcome Back Card */}
      <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
         <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#11496c] group-hover:scale-110 transition-transform duration-300">
               <IoPersonCircleOutline className="h-8 w-8" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900">Welcome Back!</h3>
               <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  You have <span className="text-[#11496c] font-black">{upcomingAppointmentsCount}</span> upcoming appointments scheduled for today.
               </p>
            </div>
         </div>
         <button 
           onClick={() => navigate('/patient/appointments')}
           className="mt-8 bg-[#11496c] text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-[#0d3a52] transition-all shadow-lg shadow-[#11496c]/10 active:scale-95"
         >
            View Appointments <IoArrowForwardOutline className="h-5 w-5" />
         </button>
      </div>

      {/* HealthKarma Section */}
      <div className="lg:col-span-3">
         <HealthKarmaSection patientName={patientName} />
      </div>
    </div>
  )
}

export default WelcomeSection
export { HealthKarmaSection }
