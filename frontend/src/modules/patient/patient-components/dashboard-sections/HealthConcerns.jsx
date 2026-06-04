import React from 'react'
import { IoArrowForwardOutline } from 'react-icons/io5'

const HealthConcerns = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl md:text-xl font-bold text-slate-800">Health Concerns</h2>
      <button className="text-slate-500 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
         See all <IoArrowForwardOutline className="h-4 w-4" />
      </button>
    </div>
    <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:gap-6">
      {[
        { name: 'Digestion', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400' },
        { name: 'Infection', image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400' },
        { name: 'Pregnancy', image: 'https://images.unsplash.com/photo-1559839734-2b71f1e3c770?auto=format&fit=crop&q=80&w=400' },
        { name: 'Skin Care', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400' },
        { name: 'Heart Health', image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80&w=400' },
        { name: 'Bone Health', image: 'https://images.unsplash.com/photo-1579154235602-3c35bd799656?auto=format&fit=crop&q=80&w=400' },
      ].map((item, idx) => (
        <div key={idx} className="relative min-w-[120px] md:min-w-[140px] aspect-[4/5] rounded-[24px] overflow-hidden group cursor-pointer shadow-md shrink-0">
           <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
           <div className="absolute bottom-4 left-0 right-0 px-3 flex flex-col items-center gap-2">
              <span className="text-white text-xs md:text-sm font-black text-center">{item.name}</span>
              <button className="w-full py-2 bg-[#11496c]/40 backdrop-blur-md border border-white/30 text-white text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-[#11496c]/60 transition-colors">
                Explore
              </button>
           </div>
        </div>
      ))}
    </div>
  </div>
)

export default HealthConcerns
