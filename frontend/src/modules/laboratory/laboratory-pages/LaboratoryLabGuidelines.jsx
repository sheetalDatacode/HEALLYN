import { IoFlaskOutline, IoCheckmarkCircleOutline, IoInformationCircleOutline, IoArrowBackOutline, IoTimeOutline, IoPeopleOutline, IoShieldCheckmarkOutline, IoChatbubbleOutline, IoWarningOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const LaboratoryLabGuidelines = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white relative -mx-8 -my-8 px-8 py-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl transform hover:scale-110 transition-transform duration-300">
                <IoFlaskOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Laboratory Guidelines
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Best practices for diagnostic laboratories
                </p>
              </div>
            </div>
          </div>

          {/* Content with Animations */}
          <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 p-10 space-y-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Introduction */}
            <section>
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border-l-4 border-blue-500 shadow-lg">
                <div className="flex items-start gap-4">
                  <IoInformationCircleOutline className="h-8 w-8 text-blue-600 shrink-0 mt-1" />
                  <p className="text-slate-700 leading-relaxed text-lg">
                    These guidelines are designed to help diagnostic laboratories provide accurate and reliable test results 
                    through the Heallyn platform while maintaining the highest standards of laboratory practice and quality assurance.
                  </p>
                </div>
              </div>
            </section>

            {/* Quality Standards */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                  <IoCheckmarkCircleOutline className="h-6 w-6" />
                </div>
                Quality Standards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                      <IoShieldCheckmarkOutline className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Test Accuracy</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Follow standardized testing protocols',
                      'Maintain calibrated equipment',
                      'Perform quality control checks regularly',
                      'Document all test procedures accurately'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700 group/item">
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                      <IoFlaskOutline className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Report Generation</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Generate clear and comprehensive reports',
                      'Include all required test parameters',
                      'Ensure timely report delivery',
                      'Maintain report confidentiality'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-700 group/item">
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
                Best Practices
              </h2>
              <div className="space-y-4">
                {[
                  { icon: IoTimeOutline, title: 'Timely Processing', desc: 'Process test orders promptly and deliver results within agreed timeframes. Communicate any delays to patients and healthcare providers.', color: 'blue' },
                  { icon: IoPeopleOutline, title: 'Patient Communication', desc: 'Maintain clear communication with patients regarding test requirements, sample collection, and result delivery.', color: 'emerald' },
                  { icon: IoShieldCheckmarkOutline, title: 'Data Security', desc: 'Ensure all patient data and test results are handled securely in compliance with HIPAA and other regulations.', color: 'purple' },
                  { icon: IoFlaskOutline, title: 'Inventory Management', desc: 'Maintain adequate supplies and equipment. Track inventory levels and order supplies in advance.', color: 'amber' }
                ].map((item, idx) => {
                  const colorClasses = {
                    blue: 'from-blue-50 to-white border-blue-200 bg-blue-500',
                    emerald: 'from-emerald-50 to-white border-emerald-200 bg-emerald-500',
                    purple: 'from-purple-50 to-white border-purple-200 bg-purple-500',
                    amber: 'from-amber-50 to-white border-amber-200 bg-amber-500'
                  }
                  const classes = colorClasses[item.color]
                  return (
                    <div key={idx} className={`bg-gradient-to-br ${classes.split(' ')[0]} ${classes.split(' ')[1]} rounded-2xl p-6 border-2 ${classes.split(' ')[2]} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${classes.split(' ')[3]} text-white shadow-lg`}>
                          <item.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-slate-800 mb-2">{item.title}</h3>
                          <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Compliance Section */}
            <section className={`bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoShieldCheckmarkOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Regulatory Compliance</h3>
                  <p className="text-emerald-50 mb-4">
                    All laboratories must maintain compliance with relevant regulatory standards including CLIA, CAP, and state licensing requirements.
                  </p>
                  <ul className="space-y-2 text-emerald-50">
                    <li className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                      <span>Maintain valid licenses and certifications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                      <span>Follow CLIA quality standards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                      <span>Comply with HIPAA regulations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaboratoryLabGuidelines

