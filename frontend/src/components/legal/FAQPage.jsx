import { IoHelpCircleOutline, IoArrowBackOutline, IoChevronDownOutline, IoChevronUpOutline, IoSearchOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const FAQPage = ({ faqCategories = [], supportRoute = '/support' }) => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [openCategory, setOpenCategory] = useState(null)
  const [openQuestion, setOpenQuestion] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0)

  return (
    <div className="hidden lg:block min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-[#11496c]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white shadow-xl transform hover:scale-110 transition-transform duration-300">
                <IoHelpCircleOutline className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#11496c] to-blue-600 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h1>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Find answers to common questions
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110">
                <IoSearchOutline className="h-5 w-5 text-slate-400 group-focus-within:text-[#11496c] transition-colors duration-300" />
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border-2 border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#11496c]/20 focus:border-[#11496c] transition-all duration-300 shadow-md hover:shadow-lg hover:border-[#11496c]/50"
              />
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12 bg-white/90 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-500">No questions found matching your search.</p>
              </div>
            ) : (
              filteredCategories.map((category, categoryIndex) => {
                const CategoryIcon = category.icon
                const delayClasses = [
                  'delay-100',
                  'delay-200',
                  'delay-300',
                  'delay-400',
                  'delay-500',
                ]
                const delayClass = delayClasses[categoryIndex] || 'delay-100'
                return (
                  <div
                    key={category.id}
                    className={`transition-all duration-700 ${delayClass} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                            {CategoryIcon && <CategoryIcon className="h-6 w-6" />}
                          </div>
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-slate-900">{category.title}</h2>
                            <p className="text-sm text-slate-500 mt-1">{category.questions.length} questions</p>
                          </div>
                        </div>
                        {openCategory === category.id ? (
                          <IoChevronUpOutline className="h-6 w-6 text-slate-400 transition-transform" />
                        ) : (
                          <IoChevronDownOutline className="h-6 w-6 text-slate-400 transition-transform" />
                        )}
                      </button>

                      {/* Category Questions */}
                      {openCategory === category.id && (
                        <div className="border-t border-slate-100 p-6 space-y-4">
                          {category.questions.map((faq, questionIndex) => (
                            <div
                              key={faq.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all duration-300 hover:shadow-md"
                            >
                              <button
                                onClick={() => setOpenQuestion(openQuestion === faq.id ? null : faq.id)}
                                className="w-full flex items-start justify-between p-5 text-left hover:bg-white/50 transition-colors rounded-xl"
                              >
                                <div className="flex-1 pr-4">
                                  <h3 className="text-base font-semibold text-slate-900 mb-2">{faq.question}</h3>
                                  {openQuestion === faq.id && (
                                    <p className="text-sm text-slate-600 leading-relaxed mt-3 animate-fadeIn">
                                      {faq.answer}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {openQuestion === faq.id ? (
                                    <IoChevronUpOutline className="h-5 w-5 text-[#11496c] transition-transform" />
                                  ) : (
                                    <IoChevronDownOutline className="h-5 w-5 text-slate-400 transition-transform" />
                                  )}
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Contact Section */}
          <div className={`mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-gradient-to-br from-[#11496c] to-[#0d3a52] rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <IoHelpCircleOutline className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
                  <p className="text-slate-200 mb-4">
                    Can't find the answer you're looking for? Our support team is here to help you.
                  </p>
                  <button
                    onClick={() => navigate(supportRoute)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#11496c] font-semibold hover:bg-slate-100 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage
