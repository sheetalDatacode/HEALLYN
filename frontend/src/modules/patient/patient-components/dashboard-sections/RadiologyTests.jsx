import React, { useState, useEffect } from 'react'
import { IoArrowForwardOutline } from 'react-icons/io5'
import { getAllTests } from '../../patient-services/patientService'

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1579154235602-3c35bd799656?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=200'
]

const HARDCODED_TESTS = [
  { name: 'Digital X-ray', price: 250, image: DEFAULT_IMAGES[0] },
  { name: 'Ultrasound', price: 935, image: DEFAULT_IMAGES[1] },
  { name: 'CT Scan', price: 1500, image: DEFAULT_IMAGES[2] },
]

const TestsGrid = ({ title, items, loading }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl md:text-xl font-bold text-slate-800">{title}</h2>
      <button className="text-slate-500 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
         See all <IoArrowForwardOutline className="h-4 w-4" />
      </button>
    </div>
    
    {loading ? (
      <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 pb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[140px] md:min-w-0 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col items-center gap-3 md:gap-4 animate-pulse shrink-0">
            <div className="h-28 w-full md:h-36 rounded-2xl bg-slate-200"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            <div className="h-10 w-full bg-slate-200 rounded-xl mt-1"></div>
          </div>
        ))}
      </div>
    ) : items.length === 0 ? (
      <div className="text-center text-slate-500 py-8 bg-white rounded-3xl border border-slate-100">
        No tests available at the moment.
      </div>
    ) : (
      <div className="flex overflow-x-auto overflow-y-hidden pb-6 scrollbar-hide gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="min-w-[140px] md:min-w-0 bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col items-center gap-3 md:gap-4 hover:shadow-lg transition-all group shrink-0">
             <div className="h-28 w-full md:h-36 rounded-2xl bg-slate-50 overflow-hidden group-hover:scale-105 transition-transform duration-500 border-2 border-white shadow-sm">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
             </div>
             <div className="text-center space-y-1">
                <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight line-clamp-1" title={item.name}>{item.name}</h3>
                <p className="text-xs md:text-sm text-[#11496c] font-black">Starting @ ₹{item.price}</p>
             </div>
             <button className="w-full py-2.5 md:py-4 bg-[#11496c] text-white text-[10px] md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-[#0d3a52] transition-colors shadow-lg shadow-[#11496c]/10">
                Book Appointment
             </button>
          </div>
        ))}
      </div>
    )}
  </div>
)

const RadiologyTests = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true)
        const res = await getAllTests({ limit: 4 })
        if (res.success && res.data && res.data.length > 0) {
          // Map backend tests and add fallback images
          const formattedTests = res.data.map((t, index) => ({
            id: t._id,
            name: t.name,
            price: t.price,
            image: DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]
          }))
          setTests(formattedTests)
        } else {
          setTests([]) // Set empty to show empty state
        }
      } catch (err) {
        console.error('Failed to fetch tests:', err)
        setTests([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchTests()
  }, [])

  return (
    <TestsGrid 
      title="Radiology Tests"
      items={tests}
      loading={loading}
    />
  )
}

export default RadiologyTests
export { TestsGrid }
