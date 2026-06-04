import React from 'react'
import { IoArrowForwardOutline } from 'react-icons/io5'

const TestsGrid = ({ title, items }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl md:text-xl font-bold text-slate-800">{title}</h2>
      <button className="text-slate-500 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
         See all <IoArrowForwardOutline className="h-4 w-4" />
      </button>
    </div>
    <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {items.map((item, idx) => (
        <div key={idx} className="min-w-[140px] md:min-w-0 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col items-center gap-3 md:gap-4 hover:shadow-lg transition-all group shrink-0">
           <div className="h-28 w-full md:h-36 rounded-2xl bg-slate-50 overflow-hidden group-hover:scale-105 transition-transform duration-500 border-2 border-white shadow-sm">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
           </div>
           <div className="text-center space-y-1">
              <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">{item.name}</h3>
              <p className="text-xs md:text-sm text-[#11496c] font-black">Starting @ ₹{item.price}</p>
           </div>
           <button className="w-full py-2.5 md:py-4 bg-[#11496c] text-white text-[10px] md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-[#0d3a52] transition-colors shadow-lg shadow-[#11496c]/10">
              Book Appointment
           </button>
        </div>
      ))}
    </div>
  </div>
)

const RadiologyTests = () => (
  <TestsGrid 
    title="Radiology Tests"
    items={[
      { name: 'Digital X-ray', price: 250, image: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=200' },
      { name: 'Ultrasound', price: 935, image: 'https://images.unsplash.com/photo-1579154235602-3c35bd799656?auto=format&fit=crop&q=80&w=200' },
      { name: 'CT Scan', price: 1500, image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200' },
    ]}
  />
)

export default RadiologyTests
export { TestsGrid }
