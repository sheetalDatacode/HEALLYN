import React, { useState, useEffect } from 'react'
import { IoArrowForwardOutline } from 'react-icons/io5'
import { getAllMedicines } from '../../patient-services/patientService'

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
  'https://images.unsplash.com/photo-1550572017-edb7fd483427?w=400&q=80',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80'
]

const HARDCODED_SUPPLEMENTS = [
  { id: 1, name: 'DIABEAT-EASE', price: 1095, oldPrice: 2299, image: DEFAULT_IMAGES[0] },
  { id: 2, name: 'HEART-UP', price: 728, oldPrice: 1618, image: DEFAULT_IMAGES[1] },
  { id: 3, name: 'LIV-UP', price: 728, oldPrice: 1618, image: DEFAULT_IMAGES[2] },
  { id: 4, name: 'IMMUNO-BOOST', price: 899, oldPrice: 1499, image: DEFAULT_IMAGES[3] },
  { id: 5, name: 'JOINT-CARE', price: 1250, oldPrice: 1800, image: DEFAULT_IMAGES[4] },
]

const HealthSupplementsSection = ({ navigate }) => {
  const [supplements, setSupplements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true)
        const res = await getAllMedicines({ limit: 5 })
        if (res.success && res.data && res.data.length > 0) {
          // Map backend medicines and add fallback images
          const formattedMedicines = res.data.map((m, index) => ({
            id: m._id,
            name: m.name,
            price: m.price,
            oldPrice: Math.round(m.price * 1.5), // Dummy old price for UI
            image: DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]
          }))
          setSupplements(formattedMedicines)
        } else {
          setSupplements([]) // Set empty to show empty state
        }
      } catch (err) {
        console.error('Failed to fetch medicines:', err)
        setSupplements([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchMedicines()
  }, [])

  return (
    <div className="bg-[#e0f2f1]/40 rounded-[24px] p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-800">Health Supplements</h2>
          <p className="text-[10px] md:text-sm text-slate-500 font-medium">Choose from a wide range for healthy living</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[#11496c] text-xs md:text-lg font-black italic">HerbVed</span>
           <span className="text-[8px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">by Heallyn</span>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 md:gap-8 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[120px] md:min-w-0 bg-white rounded-3xl p-3 md:p-3 shadow-sm border border-slate-100 flex flex-col items-center animate-pulse">
              <div className="h-24 md:h-32 w-full bg-slate-200 rounded-xl mb-3"></div>
              <div className="h-3 w-3/4 bg-slate-200 rounded mb-2"></div>
              <div className="flex items-center gap-2 mt-2 w-full justify-center">
                <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : supplements.length === 0 ? (
        <div className="text-center text-slate-500 py-8 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
          No health supplements available at the moment.
        </div>
      ) : (
        <div className="flex gap-3 md:gap-8 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-6">
          {supplements.map(item => (
            <div key={item.id} className="min-w-[120px] md:min-w-0 bg-white rounded-3xl p-3 md:p-3 shadow-sm border border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="h-24 md:h-32 w-full flex items-center justify-center mb-3">
                 <img src={item.image} alt={item.name} className="h-full object-contain hover:scale-105 transition-transform" />
              </div>
              <h3 className="text-[10px] md:text-[10px] font-black text-slate-800 text-center uppercase tracking-tight line-clamp-1" title={item.name}>{item.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                 <span className="text-xs md:text-base font-black text-slate-900">₹{item.price}</span>
                 {item.oldPrice && <span className="text-[9px] md:text-xs text-slate-400 line-through">₹{item.oldPrice}</span>}
              </div>
            </div>
          ))}
          <div className="min-w-[120px] md:min-w-0 bg-white/50 rounded-3xl p-3 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-white/80 transition-colors cursor-pointer">
             <IoArrowForwardOutline className="h-5 w-5 md:h-10 md:w-10 mb-2" />
             <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">View All</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 md:gap-6 pt-2">
         <button className="flex-1 md:flex-none md:px-12 py-3.5 rounded-2xl border-2 border-[#11496c] text-[#11496c] text-[10px] md:text-sm font-black uppercase tracking-widest hover:bg-[#11496c] hover:text-white transition-all active:scale-95">
            Track Orders
         </button>
         <button className="flex-1 md:flex-none md:px-12 py-3.5 rounded-2xl bg-[#11496c] text-white text-[10px] md:text-sm font-black uppercase tracking-widest hover:bg-[#0d3a52] transition-all shadow-lg shadow-[#11496c]/20 active:scale-95">
            Explore HerbVed
         </button>
      </div>
    </div>
  )
}

export default HealthSupplementsSection
