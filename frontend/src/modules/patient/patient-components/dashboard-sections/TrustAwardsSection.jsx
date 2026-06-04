import React from 'react'
import { 
  IoTimeOutline, 
  IoTicketOutline, 
  IoDocumentTextOutline, 
  IoShieldCheckmarkOutline, 
  IoFlashOutline, 
  IoHomeOutline, 
  IoFlaskOutline, 
  IoCall 
} from 'react-icons/io5'

const TrustSection = () => (
  <div className="bg-gradient-to-br from-[#f0fdfa] to-white rounded-[32px] p-6 md:p-8 space-y-6 border border-teal-50 h-full">
     <div className="text-center lg:text-left space-y-2">
        <h2 className="text-2xl md:text-2xl font-bold text-slate-900 leading-tight">
            Why Smart Patients Choose <span className="text-[#11496c]">Heallyn</span> for Seamless Healthcare
        </h2>
        <p className="text-sm text-slate-500 font-medium">Revolutionizing Patient-Doctor Interaction with Smart Technology.</p>
     </div>

     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
           { icon: IoTimeOutline, title: 'Smart Queue Management', color: '#ecfdf5', iconColor: '#059669' },
           { icon: IoTicketOutline, title: 'Real-time Token System', color: '#fef3c7', iconColor: '#d97706' },
           { icon: IoDocumentTextOutline, title: 'Digital Prescriptions', color: '#f0f9ff', iconColor: '#0284c7' },
           { icon: IoShieldCheckmarkOutline, title: 'Secure Health Records', color: '#f5f3ff', iconColor: '#7c3aed' },
           { icon: IoFlashOutline, title: 'Instant Doctor Access', color: '#fff1f2', iconColor: '#e11d48' },
           { icon: IoHomeOutline, title: 'Home Care Services', color: '#f0fdf4', iconColor: '#16a34a' },
           { icon: IoFlaskOutline, title: 'Accredited Lab Tests', color: '#faf5ff', iconColor: '#9333ea' },
           { icon: IoCall, title: '24/7 Priority Support', color: '#f8fafc', iconColor: '#475569' },
        ].map((item, idx) => (
           <div key={idx} className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-slate-50 flex flex-col gap-2 md:gap-3 hover:shadow-md transition-shadow group">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: item.color }}>
                 <item.icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: item.iconColor }} />
              </div>
              <p className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight">{item.title}</p>
           </div>
        ))}
     </div>
  </div>
)

const TrustAwardsSection = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
     <TrustSection />
     <div className="flex flex-col items-center">
        <div className="relative flex flex-col items-center group">
            <div className="absolute inset-0 scale-150 blur-3xl bg-[#11496c]/5 rounded-full"></div>
            <div className="w-56 h-56 md:w-64 md:h-64 border-4 border-[#11496c]/10 rounded-full flex flex-col items-center justify-center p-8 text-center relative bg-white shadow-inner transition-all group-hover:border-[#11496c]/20">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Healthcare Innovation 2025</span>
               <span className="text-6xl font-black text-[#11496c] my-2 transition-transform group-hover:scale-110">No. 1</span>
               <span className="text-xs font-bold text-slate-600">Smart Queue & Token System</span>
               <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-3 rounded-2xl shadow-lg rotate-12 group-hover:rotate-0 transition-all">
                  <IoTicketOutline className="h-5 w-5" />
               </div>
            </div>
            <div className="bg-[#11496c] text-white text-[10px] font-bold px-8 py-3 rounded-full mt-[-25px] relative z-10 shadow-xl border-2 border-white uppercase tracking-widest">
               Our Platform Specialty
            </div>
        </div>
        <div className="text-center mt-8">
           <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Stay Healthy</h2>
           <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-2 mt-2">
              Made with <span className="text-red-500 text-lg">❤</span> By Heallyn Team
           </p>
        </div>
     </div>
  </div>
)

export default TrustAwardsSection
export { TrustSection }
