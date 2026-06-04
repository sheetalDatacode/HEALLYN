import React from 'react'

const HeroBanner = ({ navigate }) => {
  return (
    <div className="w-full bg-[#11496c] relative overflow-hidden">
      {/* Modern Medical Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#11496c] via-[#1a5f8a] to-[#11496c]"></div>
      
      {/* Subtle Decorative Elements */}
      <div className="absolute inset-0 opacity-30">
         <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
         <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 relative z-10">
         <div className="flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-md">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
               <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-300">Live Consultation Available</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight max-w-2xl">
               Consult the <span className="text-emerald-400">Best Doctors</span> Online
            </h1>
            <p className="text-white/70 text-xs md:text-sm font-medium max-w-lg">
               Expert medical advice from the comfort of your home within 10 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
               <button 
                 onClick={() => navigate('/patient/doctors')}
                 className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] md:text-xs px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 w-full sm:w-auto uppercase tracking-widest"
               >
                  Book Appointment
               </button>
               <button 
                 onClick={() => navigate('/patient/specialties')}
                 className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] md:text-xs px-6 py-3 rounded-xl transition-all border border-white/10 backdrop-blur-md active:scale-95 w-full sm:w-auto uppercase tracking-widest"
               >
                  View Specialists
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}

export default HeroBanner
