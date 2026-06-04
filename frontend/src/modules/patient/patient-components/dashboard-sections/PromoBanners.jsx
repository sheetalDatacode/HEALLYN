import React from 'react'
import { IoCall, IoChatbubbleEllipsesOutline, IoFlashOutline, IoArrowForwardOutline } from 'react-icons/io5'

const PromoBanners = ({ rewardsConfig }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     <div className="bg-gradient-to-r from-[#11496c] to-[#0d3a52] rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-[#11496c]/20">
        <div className="relative z-10">
           <h3 className="text-2xl font-bold leading-tight max-w-[250px] mb-8">
              Talk to our health advisors now for <span className="text-blue-300">attractive discounts</span> on your Bookings
           </h3>
           <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-white text-[#11496c] font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-slate-50 transition-colors">
                 <IoCall className="h-5 w-5" /> Call Now
              </button>
              <button className="flex-1 bg-[#ffffff20] backdrop-blur-md text-white font-black text-sm py-4 rounded-2xl border border-white/30 flex items-center justify-center gap-3 hover:bg-[#ffffff30] transition-colors">
                 <IoChatbubbleEllipsesOutline className="h-5 w-5" /> Chat With Us
              </button>
           </div>
        </div>
        <img 
           src="https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_23-2147896177.jpg" 
           alt="" 
           className="absolute right-[-20px] bottom-0 h-[150%] object-contain opacity-40 mix-blend-overlay hidden md:block"
        />
     </div>

     <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl border border-slate-700">
        <div className="relative z-10 space-y-6 h-full flex flex-col justify-between">
           <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tight leading-none">Refer &<br />Earn Rewards</h3>
              <div className="bg-[#11496c] p-4 rounded-2xl shadow-inner border border-slate-700">
                 <IoFlashOutline className="h-10 w-10 text-amber-400" />
              </div>
           </div>
           <p className="text-sm text-slate-400 font-medium max-w-[280px]">
              Get ₹{rewardsConfig?.referralBonus || 200} Heallyn cash on each referral and ₹{rewardsConfig?.loginBonus || 200} on first login!
           </p>
           <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all hover:scale-110">
              <IoArrowForwardOutline className="h-6 w-6" />
           </button>
        </div>
        <img 
           src="https://img.freepik.com/free-vector/cash-back-concept-illustration_114360-3209.jpg" 
           alt="" 
           className="absolute right-0 bottom-0 h-[130%] object-contain opacity-20 hidden md:block"
        />
     </div>
  </div>
)

export default PromoBanners
