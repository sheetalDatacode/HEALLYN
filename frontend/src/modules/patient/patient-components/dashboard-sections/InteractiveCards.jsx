import React from 'react'
import { IoShieldCheckmarkOutline } from 'react-icons/io5'

const InteractiveCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-slate-50 rounded-2xl">
              <IoShieldCheckmarkOutline className="h-6 w-6 text-[#11496c]" />
           </div>
           <div className="flex flex-col">
              <span className="text-base font-bold text-slate-700">Enable do not disturb Status</span>
              <span className="text-[10px] text-slate-400">Stop receiving promotional calls</span>
           </div>
        </div>
        <div className="relative inline-flex h-7 w-12 items-center rounded-full bg-slate-200 transition-colors cursor-pointer">
           <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform translate-x-1 shadow-sm"></span>
        </div>
     </div>

     <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex items-center justify-between gap-6">
        <div className="space-y-1">
           <span className="text-[10px] font-black text-[#11496c] uppercase tracking-widest">Featured Test</span>
           <h3 className="text-xl font-bold text-slate-900">Food Intolerance Test</h3>
           <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900">₹5499</span>
              <span className="text-sm text-slate-400 line-through">₹18330</span>
           </div>
        </div>
        <button className="px-8 py-4 bg-[#11496c] text-white font-black rounded-2xl shadow-lg shadow-[#11496c]/20 hover:bg-[#0d3a52] transition-all active:scale-95">
           Book Now
        </button>
     </div>
  </div>
)

export default InteractiveCards
