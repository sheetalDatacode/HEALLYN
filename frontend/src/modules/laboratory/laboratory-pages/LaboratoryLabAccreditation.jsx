import { IoShieldCheckmarkOutline, IoCheckmarkCircleOutline, IoDocumentTextOutline, IoArrowBackOutline, IoFlaskOutline, IoStarOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LaboratoryLabAccreditation = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-white relative -mx-8 -my-8 px-8 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10">
        {/* Back Button */}
        <div className="max-w-5xl mx-auto px-8 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-[#11496c] hover:bg-white/80 transition-all duration-300 hover:shadow-md mb-6"
          >
            <IoArrowBackOutline className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
        </div>
        
        <div className="max-w-5xl mx-auto px-8 pb-16">
          {/* Animated Header */}
          <div className={`mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl transform hover:scale-110 transition-transform duration-300">
                <IoShieldCheckmarkOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Laboratory Accreditation
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Quality standards and certification requirements
                </p>
              </div>
            </div>
          </div>

          {/* Content with Animations */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 p-10 space-y-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Overview */}
            <section>
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-l-4 border-purple-500 shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                    <IoShieldCheckmarkOutline className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Accreditation Standards</h2>
                    <p className="text-slate-700 leading-relaxed text-lg">
                      Heallyn requires all laboratories to maintain valid accreditation and certifications. 
                      This ensures quality standards, regulatory compliance, and patient safety across all test results.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Required Accreditations */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                  <IoCheckmarkCircleOutline className="h-6 w-6" />
                </div>
                Required Accreditations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { 
                    title: 'CLIA Certification', 
                    desc: 'Clinical Laboratory Improvement Amendments (CLIA) certification is required for all laboratories performing clinical testing.',
                    icon: IoFlaskOutline,
                    color: 'blue'
                  },
                  { 
                    title: 'CAP Accreditation', 
                    desc: 'College of American Pathologists (CAP) accreditation demonstrates excellence in laboratory quality and patient care.',
                    icon: IoStarOutline,
                    color: 'emerald'
                  },
                  { 
                    title: 'State Licensing', 
                    desc: 'Valid state laboratory licenses are required and must be kept current. License numbers must be verified during registration.',
                    icon: IoDocumentTextOutline,
                    color: 'purple'
                  },
                  { 
                    title: 'ISO Certification', 
                    desc: 'ISO 15189 or ISO 17025 certification demonstrates international quality standards for medical laboratories.',
                    icon: IoShieldCheckmarkOutline,
                    color: 'amber'
                  }
                ].map((item, idx) => {
                  const colorClasses = {
                    blue: 'from-blue-50 to-white border-blue-200 bg-blue-500',
                    emerald: 'from-emerald-50 to-white border-emerald-200 bg-emerald-500',
                    purple: 'from-purple-50 to-white border-purple-200 bg-purple-500',
                    amber: 'from-amber-50 to-white border-amber-200 bg-amber-500'
                  }
                  const classes = colorClasses[item.color].split(' ')
                  return (
                    <div 
                      key={idx}
                      className={`bg-gradient-to-br ${classes[0]} ${classes[1]} rounded-2xl p-6 border-2 ${classes[2]} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${classes[3]} text-white mb-4 group-hover:scale-110 transition-transform`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-3">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Verification Process */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                Verification Process
              </h2>
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                <p className="text-slate-700 font-semibold mb-4 text-lg">During registration, you must provide:</p>
                <div className="space-y-3">
                  {[
                    'Valid accreditation certificates and license numbers',
                    'Expiration dates for all certifications',
                    'Accreditation body information (CLIA, CAP, etc.)',
                    'Quality assurance documentation',
                    'Proof of compliance with regulatory standards'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                      <IoCheckmarkCircleOutline className="h-6 w-6 text-purple-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <p className="text-slate-700 font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Maintenance Requirements */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                  <IoDocumentTextOutline className="h-6 w-6" />
                </div>
                Maintenance Requirements
              </h2>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
                <p className="text-slate-700 leading-relaxed mb-4">
                  Laboratories must maintain their accreditations and update their information on the platform:
                </p>
                <ul className="space-y-3">
                  {[
                    'Renew certifications before expiration dates',
                    'Update accreditation status in your profile',
                    'Notify us of any changes to accreditation status',
                    'Maintain quality control records',
                    'Participate in proficiency testing programs'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <IoCheckmarkCircleOutline className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Accreditation Badge */}
            <section className={`bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoShieldCheckmarkOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Quality Assurance</h3>
                  <p className="text-purple-50 mb-4">
                    Accreditation ensures that laboratories meet the highest standards of quality, accuracy, and reliability in diagnostic testing.
                  </p>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <p className="text-sm text-purple-50">
                      All accredited laboratories on Heallyn are verified and regularly audited to maintain quality standards.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaboratoryLabAccreditation

