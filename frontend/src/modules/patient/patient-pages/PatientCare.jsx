import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  IoSearchOutline,
  IoArrowForwardOutline,
  IoCallOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5'
import { getPatientProfile, getDoctorCategories, getDoctorSubcategories } from '../patient-services/patientService'
import PatientSidebar from '../patient-components/PatientSidebar'

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const SpecialtyCard = ({ specialty, onClick }) => (
  <button
    onClick={() => onClick(specialty)}
    className="group flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl md:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:border-[#11496c]/20 transition-all duration-300 active:scale-95 w-full"
  >
    <div
      className="w-full aspect-square rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center relative"
      style={{ backgroundColor: specialty.color }}
    >
      <img
        src={specialty.image}
        alt={specialty.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
    </div>
    <span className="text-[10px] md:text-xs font-bold text-slate-700 text-center leading-tight line-clamp-2">
      {specialty.name}
    </span>
  </button>
)

const SymptomCard = ({ symptom, onClick }) => (
  <button
    onClick={() => onClick(symptom)}
    className="group flex flex-col items-center gap-1.5 md:gap-2 p-2.5 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#11496c]/20 transition-all duration-300 active:scale-95 w-full"
  >
    <div
      className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300"
      style={{ backgroundColor: symptom.iconBg || '#f1f5f9' }}
    >
      {symptom.image ? (
        <img src={symptom.image} alt={symptom.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xl md:text-2xl">{symptom.emoji || '🩺'}</span>
      )}
    </div>
    <span className="text-[9px] md:text-[11px] font-bold text-slate-600 text-center leading-tight line-clamp-2">
      {symptom.name}
    </span>
  </button>
)

const SectionHeader = ({ title, onViewAll }) => (
  <div className="flex items-center justify-between mb-4 md:mb-6">
    <h2 className="text-base md:text-xl font-black text-slate-900">{title}</h2>
    <button
      onClick={onViewAll}
      className="flex items-center gap-1 text-[#11496c] text-xs md:text-sm font-bold hover:underline transition-all"
    >
      View All <IoChevronForwardOutline className="h-3.5 w-3.5" />
    </button>
  </div>
)

const SpecialtyShimmer = () => (
  <div className="flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl md:rounded-[24px] border border-slate-100 shadow-sm w-full animate-pulse">
    <div className="w-full aspect-square rounded-xl md:rounded-2xl bg-slate-200" />
    <div className="w-3/4 h-3 md:h-4 bg-slate-200 rounded mt-1" />
  </div>
)

const SymptomShimmer = () => (
  <div className="flex flex-col items-center gap-1.5 md:gap-2 p-2.5 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100 shadow-sm w-full animate-pulse">
    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-200" />
    <div className="w-full h-2 md:h-3 bg-slate-200 rounded mt-1" />
  </div>
)

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const PatientCare = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showAllSpecialties, setShowAllSpecialties] = useState(false)
  const [categories, setCategories] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(true)
  const toggleButtonRef = useRef(null)

  const navItems = [
    { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: () => null },
    { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: () => null },
    { id: 'care', label: 'Care', to: '/patient/care', Icon: () => null },
    { id: 'history', label: 'History', to: '/patient/history', Icon: () => null },
    { id: 'support', label: 'Support', to: '/patient/support', Icon: () => null },
    { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: () => null },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const { getAuthToken } = await import('../../../utils/apiClient')
        const token = getAuthToken('patient')
        if (!token) { navigate('/patient/login'); return }
        
        // Fetch profile
        const profileRes = await getPatientProfile()
        if (profileRes.success && profileRes.data) {
          const patient = profileRes.data.patient || profileRes.data
          setProfile(patient)
        }

        // Fetch Categories & Symptoms
        const [catRes, sympRes] = await Promise.all([
          getDoctorCategories(),
          getDoctorSubcategories()
        ])
        
        if (catRes.success) {
          setCategories(catRes.data)
        }
        if (sympRes.success) {
          setSymptoms(sympRes.data)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [navigate])

  const handleSpecialtyClick = (specialty) => {
    navigate(`/patient/specialties/${specialty.id || specialty._id}/doctors`)
  }

  const handleSymptomClick = (symptom) => {
    navigate(`/patient/doctors?symptom=${symptom.id || symptom._id}`)
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutPatient } = await import('../patient-services/patientService')
      await logoutPatient()
    } catch {
      const { clearPatientTokens } = await import('../patient-services/patientService')
      clearPatientTokens()
    }
    setTimeout(() => navigate('/patient/login', { replace: true }), 500)
  }

  // Filter by search
  const filteredSpecialties = categories.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredSymptoms = symptoms.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayedSpecialties = showAllSpecialties ? filteredSpecialties : filteredSpecialties.slice(0, 6)

  return (
    <section className="bg-[#f8fafc] min-h-screen pb-32 overflow-x-hidden">

      {/* Mobile Search Hint */}
      <div className="md:hidden px-4 pt-4">
        <div className="relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search for 'Orthopedic surgeon'..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c] shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 flex flex-col gap-8 md:gap-12">

        {/* ── Section 1: Consult by Speciality ── */}
        <section>
          <SectionHeader
            title="Consult Doctor by Speciality"
            onViewAll={() => navigate('/patient/specialties')}
          />
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {loading 
                ? Array(6).fill(0).map((_, i) => <SpecialtyShimmer key={i} />)
                : displayedSpecialties.map(specialty => (
                    <SpecialtyCard
                      key={specialty._id || specialty.id}
                      specialty={specialty}
                      onClick={handleSpecialtyClick}
                    />
                  ))
              }
            </div>
            {filteredSpecialties.length > 6 && (
              <button
                onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                className="mt-4 w-full py-3 text-sm font-bold text-[#11496c] border-2 border-dashed border-[#11496c]/30 rounded-2xl hover:bg-[#11496c]/5 transition-colors flex items-center justify-center gap-2"
              >
                {showAllSpecialties ? 'Show Less' : `Show All ${filteredSpecialties.length} Specialities`}
                <IoChevronForwardOutline className={`h-4 w-4 transition-transform ${showAllSpecialties ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </section>

        {/* ── Section 2: Expert Dietitians Promo ── */}
        <section>
          <div className="relative overflow-hidden rounded-[24px] md:rounded-[32px] bg-gradient-to-r from-[#0d7377] to-[#14a085] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-teal-900/20">
            {/* Text */}
            <div className="flex flex-col gap-3 z-10 max-w-xs md:max-w-sm">
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-3 py-1 w-fit backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Verified Experts</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                Expert Dietitians
              </h3>
              <p className="text-sm text-white/80 font-medium">
                Book Diet Consultation @ Rs.299 only!
              </p>
              <button
                onClick={() => navigate('/patient/specialties/dietitian/doctors')}
                className="bg-white text-[#0d7377] font-black text-sm px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-all active:scale-95 shadow-lg w-fit"
              >
                Schedule Now
              </button>
            </div>
            {/* Illustration */}
            <div className="absolute right-0 bottom-0 h-full flex items-end pointer-events-none">
              <img
                src="https://img.freepik.com/free-vector/diet-plan-concept-illustration_114360-6514.jpg"
                alt=""
                className="h-[140%] w-auto object-contain opacity-90 mix-blend-luminosity hidden md:block"
              />
            </div>
            {/* Mobile illustration */}
            <img
              src="https://img.freepik.com/free-vector/diet-plan-concept-illustration_114360-6514.jpg"
              alt=""
              className="h-24 w-auto object-contain opacity-70 mix-blend-luminosity md:hidden self-end absolute right-4 bottom-0"
            />
            {/* Decorative blobs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 right-40 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />
          </div>
        </section>

        {/* ── Section 3: Consult by Health Symptom ── */}
        <section>
          <SectionHeader
            title="Consult Doctor by Health Symptom"
            onViewAll={() => navigate('/patient/doctors')}
          />
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
              {loading
                ? Array(12).fill(0).map((_, i) => <SymptomShimmer key={i} />)
                : filteredSymptoms.map(symptom => (
                    <SymptomCard
                      key={symptom._id || symptom.id}
                      symptom={symptom}
                      onClick={handleSymptomClick}
                    />
                  ))
              }
            </div>
          </div>
        </section>

        {/* ── Section 4: Talk to Advisor CTA ── */}
        <section className="mb-4">
          <div className="bg-gradient-to-r from-[#11496c] to-[#0d3a52] rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#11496c]/20 relative overflow-hidden">
            <div className="z-10">
              <h3 className="text-xl md:text-2xl font-black text-white mb-2">
                Talk to our health advisors
              </h3>
              <p className="text-white/70 text-sm font-medium max-w-sm">
                Get personalized healthcare guidance and attractive discounts on bookings.
              </p>
            </div>
            <div className="flex gap-3 shrink-0 z-10">
              <button
                onClick={() => navigate('/patient/support')}
                className="flex items-center gap-2 bg-white text-[#11496c] font-black text-sm px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-lg"
              >
                <IoCallOutline className="h-5 w-5" />
                Call Now
              </button>
              <button
                onClick={() => navigate('/patient/doctors')}
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-black text-sm px-6 py-3 rounded-2xl hover:bg-white/20 transition-all active:scale-95 backdrop-blur-md"
              >
                Find Doctors <IoArrowForwardOutline className="h-4 w-4" />
              </button>
            </div>
            {/* Decorative */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl" />
          </div>
        </section>

      </div>

      {/* Sidebar */}
      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </section>
  )
}

export default PatientCare
