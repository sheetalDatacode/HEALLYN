import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoPulseOutline,
  IoHeartOutline,
  IoArrowForwardOutline,
  IoChevronDown,
} from 'react-icons/io5'
import { TbStethoscope } from 'react-icons/tb'
import { MdOutlineEscalatorWarning } from 'react-icons/md'
import { getDiscoveryDoctors, getDoctorCategories, getDoctorSubcategories, getPatientProfile } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'
import PatientSidebar from '../patient-components/PatientSidebar'

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  if (hasHalfStar) {
    stars.push(
      <svg key="half" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <defs>
          <linearGradient id={`half-fill-${rating}`}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path fill={`url(#half-fill-${rating})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(
      <svg key={`empty-${i}`} className="h-3.5 w-3.5 fill-slate-300 text-slate-300" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  return stars
}

const navItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: () => null },
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: () => null },
  { id: 'transactions', label: 'Transactions', to: '/patient/transactions', Icon: () => null },
  { id: 'history', label: 'History', to: '/patient/history', Icon: () => null },
  { id: 'support', label: 'Support', to: '/patient/support', Icon: () => null },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: () => null },
]

const PatientDoctors = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  
  // Category & Symptom States
  const [categoriesList, setCategoriesList] = useState([{ _id: 'all', name: 'All Categories' }])
  const [subcategoriesList, setSubcategoriesList] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getPatientProfile()
        if (response.success && response.data) {
          const patient = response.data.patient || response.data
          setProfile({ ...patient, address: patient.address || {} })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }
    fetchProfile()
  }, [])

  // Fetch categories & subcategories
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const [catRes, subcatRes] = await Promise.all([
          getDoctorCategories().catch(() => ({ success: false, data: [] })),
          getDoctorSubcategories().catch(() => ({ success: false, data: [] }))
        ]);

        if (catRes.success && catRes.data) {
          setCategoriesList([
            { _id: 'all', name: 'All Categories' },
            ...catRes.data
          ]);
        }
        if (subcatRes.success && subcatRes.data) {
          // Only show approved subcategories to patients
          setSubcategoriesList(subcatRes.data.filter(sub => sub.isApproved));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategoriesData();
  }, [])
  
  // Fetch doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const filters = {
          limit: 1000,
          page: 1,
          _t: Date.now(),
        }
        if (selectedCategory && selectedCategory !== 'all') {
          filters.category = selectedCategory;
        }
        if (selectedSubcategory) {
          filters.subcategory = selectedSubcategory;
        }
        if (searchTerm && searchTerm.trim()) {
          filters.search = searchTerm.trim()
        }
        
        const doctorsResponse = await getDiscoveryDoctors(filters)
        
        if (doctorsResponse && doctorsResponse.success) {
          let doctorsData = Array.isArray(doctorsResponse.data) 
            ? doctorsResponse.data 
            : (doctorsResponse.data?.items || [])
          
          const transformed = doctorsData.map((doctor) => {
            const formatFullAddress = (clinicDetails) => {
              if (!clinicDetails) return 'Location not available'
              const parts = []
              if (clinicDetails.name) parts.push(clinicDetails.name)
              if (clinicDetails.address) {
                const addr = clinicDetails.address
                if (addr.city) parts.push(addr.city)
                if (addr.state) parts.push(addr.state)
              }
              return parts.length > 0 ? parts.join(', ') : 'Location not available'
            }
            
            return {
              id: doctor._id || doctor.id,
              name: doctor.firstName && doctor.lastName
                ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                : doctor.name || 'Dr. Unknown',
              category: doctor.category ? doctor.category.name : (doctor.specialization || 'General'),
              experience: doctor.experienceYears ? `${doctor.experienceYears} years` : 'N/A',
              rating: doctor.rating || 0,
              reviewCount: doctor.reviewCount || 0,
              consultationFee: doctor.consultationFee || 0,
              location: formatFullAddress(doctor.clinicDetails),
              clinicName: doctor.clinicDetails?.name || '',
              nextSlot: 'Today',
              image: doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            }
          })
          setDoctors(transformed)
        }
      } catch (err) {
        setError(err.message || 'Failed to load doctors')
        toast.error('Failed to load doctors')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedCategory, selectedSubcategory, searchTerm, toast])

  useEffect(() => {
    const catFromUrl = searchParams.get('category')
    const subcatFromUrl = searchParams.get('subcategory')
    if (catFromUrl) setSelectedCategory(catFromUrl)
    if (subcatFromUrl) setSelectedSubcategory(subcatFromUrl)
  }, [searchParams])

  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors]
    return filtered.sort((a, b) => b.rating - a.rating)
  }, [doctors])

  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredDoctors.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredDoctors, currentPage])

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage)
  const totalItems = filteredDoctors.length

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory, selectedSubcategory])

  const handleLogout = async () => {
    setIsSidebarOpen(false)
    const { logoutPatient } = await import('../patient-services/patientService')
    await logoutPatient()
    navigate('/patient/login')
  }

  // Get symptoms relevant to selected category
  const availableSymptoms = useMemo(() => {
    if (!subcategoriesList.length) return [];
    if (selectedCategory === 'all') return subcategoriesList;
    return subcategoriesList.filter(sub => sub.category === selectedCategory);
  }, [subcategoriesList, selectedCategory]);

  return (
    <section className="bg-[#f8fafc] min-h-screen pb-32 overflow-x-hidden">

      {/* Hero Banner for Doctors */}
      <div className="w-full bg-[#11496c] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#11496c] via-[#1a5f8a] to-[#11496c]"></div>
        <div className="absolute inset-0 opacity-30">
           <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-emerald-300">Top Rated Specialists</span>
                 </div>
                 <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                    Find Your <span className="text-emerald-400">Perfect Specialist</span>
                 </h1>
                 <p className="text-white/70 text-sm md:text-base font-medium max-w-lg">
                    Book appointments with the best-rated doctors near you and get expert medical care.
                 </p>
              </div>

              {/* Enhanced Search in Banner */}
              <div className="w-full max-w-md relative group">
                 <input
                   type="text"
                   placeholder="Search name or clinic..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] py-5 pl-14 pr-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all text-sm md:text-base"
                 />
                 <IoSearchOutline className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-400" />
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 space-y-10">
        {/* Category Filters - Premium Chips */}
        <div className="space-y-4">
           <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-black text-slate-800">Browse by Category</h2>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{categoriesList.length - 1} Categories</span>
                
                {/* Symptoms Dropdown */}
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-[#11496c] focus:border-[#11496c] block p-2.5 outline-none"
                >
                  <option value="">All Symptoms</option>
                  {availableSymptoms.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                  ))}
                </select>
              </div>
           </div>
           
           <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
              {categoriesList.map((category) => {
                const isSelected = selectedCategory === category._id
                return (
                  <button
                    key={category._id}
                    onClick={() => {
                      setSelectedCategory(category._id)
                      setSelectedSubcategory('') // Reset symptom when category changes
                    }}
                    className={`inline-flex shrink-0 items-center gap-3 rounded-[20px] px-6 py-4 text-sm font-black transition-all border ${
                      isSelected
                        ? 'bg-[#11496c] text-white border-[#11496c] shadow-lg shadow-[#11496c]/20 scale-105'
                        : 'bg-white text-slate-600 border-slate-100 hover:border-[#11496c]/30 hover:bg-slate-50'
                    }`}
                  >
                    <TbStethoscope className={`h-5 w-5 ${isSelected ? 'text-emerald-400' : 'text-[#11496c]'}`} />
                    <span>{category.name}</span>
                  </button>
                )
              })}
           </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
           <p className="text-sm font-bold text-slate-500">
              Showing <span className="text-[#11496c] font-black">{totalItems}</span> expert specialists
           </p>
           <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-widest">Sort by: Relevance</span>
              <IoChevronDown className="h-4 w-4" />
           </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[40px] border border-slate-100 p-8 space-y-6 animate-pulse">
                <div className="flex gap-5">
                   <div className="w-20 h-20 bg-slate-100 rounded-3xl"></div>
                   <div className="flex-1 space-y-3">
                      <div className="h-5 bg-slate-100 rounded-lg w-3/4"></div>
                      <div className="h-3 bg-slate-100 rounded-lg w-1/2"></div>
                   </div>
                </div>
                <div className="h-24 bg-slate-50 rounded-3xl"></div>
                <div className="h-14 bg-slate-100 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[40px] border-2 border-dashed border-red-100 bg-red-50/50 p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <IoPulseOutline className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
               <h3 className="text-xl font-black text-red-900">Connection Issue</h3>
               <p className="text-red-600/70 font-medium">We couldn't load the specialist list. Please try again.</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95">
               Retry Now
            </button>
          </div>
        ) : paginatedDoctors.length === 0 ? (
          <div className="rounded-[40px] border-2 border-dashed border-slate-200 bg-white p-20 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
               <IoSearchOutline className="h-12 w-12" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900">No Specialists Found</h3>
               <p className="text-slate-500 font-medium max-w-md mx-auto">We couldn't find any doctors matching your current search or specialty. Try clearing filters.</p>
            </div>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedSubcategory(''); }} className="text-[#11496c] font-black underline underline-offset-8">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedDoctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
                className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(17,73,108,0.08)] hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col h-full relative"
              >
                {/* Premium Badge for High Rating */}
                {doctor.rating >= 4.5 && (
                  <div className="absolute top-4 right-4 z-10">
                     <div className="bg-[#11496c] text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-[#11496c]/20 uppercase tracking-tighter">Top Rated</div>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1 gap-7">
                  {/* Header: Avatar and Basic Info */}
                  <div className="flex items-start gap-5">
                    <div className="relative flex-shrink-0">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm group-hover:border-emerald-100 transition-colors duration-500">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=f1f5f9&color=11496c&size=128&bold=true`
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-4 border-white h-7 w-7 rounded-full shadow-md flex items-center justify-center">
                         <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                       <div className="flex flex-col">
                          <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-[#11496c] transition-colors leading-tight">{doctor.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-bold text-[#11496c] uppercase tracking-widest">{doctor.category}</span>
                             <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                             <span className="text-[10px] font-bold text-slate-400">{doctor.experience} Exp.</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-1.5 mt-2.5">
                          <div className="flex items-center gap-0.5">{renderStars(doctor.rating)}</div>
                          <span className="text-[10px] font-black text-slate-400 mt-0.5">{doctor.rating}</span>
                       </div>
                    </div>
                  </div>

                  {/* Pricing and Location Grid */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                     <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Consultation Fee</span>
                        <p className="text-sm font-black text-slate-900">₹{doctor.consultationFee}</p>
                     </div>
                     <div className="space-y-1 border-l border-slate-50 pl-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Location</span>
                        <p className="text-xs font-bold text-slate-700 truncate">{doctor.location.split(',')[0]}</p>
                     </div>
                  </div>

                  {/* Availability Card: Glassmorphism Style */}
                  <div className="rounded-2xl p-4 bg-slate-50/50 border border-slate-100 group-hover:bg-[#11496c]/5 group-hover:border-[#11496c]/10 transition-all duration-500">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                              <IoTimeOutline className="h-3.5 w-3.5 text-[#11496c]" />
                           </div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Availability</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">TODAY</span>
                     </div>
                     <p className="text-xs font-black text-slate-800">Next Slot: <span className="text-[#11496c]">10:30 AM</span> onwards</p>
                  </div>

                  {/* Professional CTA Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/patient/doctors/${doctor.id}`); }}
                    className="w-full bg-[#11496c] text-white font-black py-4 px-6 rounded-2xl text-[11px] transition-all shadow-xl shadow-[#11496c]/10 hover:shadow-[#11496c]/30 hover:bg-[#0d3a52] flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-wider"
                  >
                    View Full Profile <IoArrowForwardOutline className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredDoctors.length > 0 && totalPages > 1 && (
          <div className="pt-10 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </div>
        )}
      </div>

      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </section>
  )
}

export default PatientDoctors
