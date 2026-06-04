import React from 'react'
import { IoChevronDown } from 'react-icons/io5'
import img1 from '../../../../assets/images/img1.png'
import img2 from '../../../../assets/images/img2.png'
import img3 from '../../../../assets/images/img3.png'
import img4 from '../../../../assets/images/img4.png'
import img5 from '../../../../assets/images/img5.png'
import img6 from '../../../../assets/images/img6.png'

const ServiceCard = ({ title, subtitle, image, gradient, textColor, btnText = "Consult Now", onClick }) => (
  <div 
    onClick={onClick}
    className="relative p-6 md:p-8 rounded-[32px] overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] active:scale-95 shadow-md border border-slate-100 h-full flex flex-col justify-between"
    style={{ background: gradient }}
  >
    <div className="relative z-10 flex flex-col justify-between h-full max-w-[50%] md:max-w-[52%]">
      <div className="space-y-1.5">
        <h3 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: textColor }}>{title}</h3>
        <p className="text-xs md:text-sm font-bold opacity-75 leading-snug" style={{ color: textColor }}>{subtitle}</p>
      </div>
      
      {/* Button below the text */}
      <div className="mt-4 md:mt-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-300 group-hover:shadow-md transform active:scale-95"
          style={{ 
            backgroundColor: textColor, 
            color: '#ffffff',
          }}
        >
          <span>{btnText}</span>
          <span className="text-sm font-black transition-transform duration-300 group-hover:translate-x-1">»</span>
        </button>
      </div>
    </div>
    
    {image && (
      <img 
        src={image} 
        alt="" 
        className="absolute right-0 bottom-0 h-[85%] md:h-[90%] max-w-[45%] md:max-w-[48%] object-contain object-right-bottom mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500 pointer-events-none z-0"
      />
    )}
  </div>
)

const ServicesSlider = ({ navigate }) => {
  const services = [
    {
      title: "Your Doctor",
      subtitle: "Consult specialist doctors from the comforts of your home",
      image: img1,
      gradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
      textColor: "#e11d48",
      btnText: "Consult Now",
      onClick: () => navigate('/patient/doctors')
    },
    {
      title: "Your Dietitian",
      subtitle: "Book Diet Consultation @ Rs 399 only",
      image: img2,
      gradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      textColor: "#059669",
      btnText: "Book Now",
      onClick: () => navigate('/patient/specialties')
    },
    {
      title: "Your Pharmacy",
      subtitle: "Order medicines & healthcare products online",
      image: img3,
      gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
      textColor: "#7c3aed",
      btnText: "Order Now",
      onClick: () => navigate('/patient/pharmacy')
    },
    {
      title: "Your Labs",
      subtitle: "Book lab tests & health checkups with home sample collection",
      image: img4,
      gradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      textColor: "#0284c7",
      btnText: "Book Now",
      onClick: () => navigate('/patient/reports')
    },
    {
      title: "Your Physician",
      subtitle: "Consult with general physicians for everyday health issues",
      image: img5,
      gradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      textColor: "#d97706",
      btnText: "Consult Now",
      onClick: () => navigate('/patient/doctors')
    },
    {
      title: "Your Diagnosis",
      subtitle: "Get accurate diagnosis with advanced imaging and tests",
      image: img6,
      gradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
      textColor: "#4f46e5",
      btnText: "Book Now",
      onClick: () => navigate('/patient/reports')
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Our Services</h2>
        <div className="flex gap-2">
           <div className="hidden md:flex gap-2">
              <button className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                 <IoChevronDown className="h-5 w-5 rotate-90" />
              </button>
              <button className="p-2 rounded-full border border-slate-200 text-[#11496c] hover:bg-slate-50 transition-colors">
                 <IoChevronDown className="h-5 w-5 -rotate-90" />
              </button>
           </div>
        </div>
      </div>
      
      <div className="flex overflow-x-auto overflow-y-hidden pb-8 scrollbar-hide gap-4 md:gap-6 lg:gap-8 snap-x snap-mandatory">
        {services.map((service, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-[380px] lg:min-w-[420px] h-48 md:h-60 snap-start">
            <ServiceCard {...service} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServicesSlider
export { ServiceCard }
