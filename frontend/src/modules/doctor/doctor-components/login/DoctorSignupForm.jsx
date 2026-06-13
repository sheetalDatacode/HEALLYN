import { motion } from 'framer-motion'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoMedicalOutline,
  IoSchoolOutline,
  IoLanguageOutline,
  IoDocumentTextOutline,
  IoCloseOutline,
  IoAddOutline,
} from 'react-icons/io5'

const DoctorSignupForm = ({
  signupStep,
  totalSignupSteps,
  handleDoctorSignupSubmit,
  doctorSignupData,
  setDoctorSignupData,
  handleDoctorSignupChange,
  categories = [],
  subcategories = [],
  isSubmitting,
  handlePreviousStep,
  handleNextStep,
  handleModeChange,
}) => {
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);

  // Filter subcategories based on selected category and search term
  const filteredSubcategories = subcategories.filter(sub => {
    // Show subcategories that belong to the selected category
    if (doctorSignupData.category && sub.category !== doctorSignupData.category) {
      return false;
    }
    // Filter by search term
    if (subcategorySearch && !sub.name.toLowerCase().includes(subcategorySearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSubcategorySelect = (sub) => {
    const currentSubs = doctorSignupData.subcategories || [];
    // If not already selected
    if (!currentSubs.includes(sub._id)) {
      handleDoctorSignupChange({
        target: { name: 'subcategories', value: [...currentSubs, sub._id] }
      });
    }
    setSubcategorySearch('');
    setShowSubcategoryDropdown(false);
  };

  const handleCustomSubcategoryAdd = () => {
    if (subcategorySearch.trim()) {
      const currentSubs = doctorSignupData.subcategories || [];
      handleDoctorSignupChange({
        target: { name: 'subcategories', value: [...currentSubs, subcategorySearch.trim()] }
      });
      setSubcategorySearch('');
      setShowSubcategoryDropdown(false);
    }
  };

  const removeSubcategory = (subValue) => {
    const currentSubs = doctorSignupData.subcategories || [];
    handleDoctorSignupChange({
      target: { name: 'subcategories', value: currentSubs.filter(s => s !== subValue) }
    });
  };

  // Helper to get subcategory name for display
  const getSubcategoryName = (subValue) => {
    const found = subcategories.find(s => s._id === subValue);
    return found ? found.name : subValue; // If not found, it's a dynamically added string
  };
  return (
              <motion.div
                key="signup-doctor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${signupStep === step
                            ? 'bg-[#11496c] text-white scale-110 shadow-md shadow-[#11496c]/30'
                            : signupStep > step
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {signupStep > step ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div
                            className={`h-1.5 w-12 sm:w-16 rounded-full transition-all duration-300 ${signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Step {signupStep} of {totalSignupSteps}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {signupStep === 1 && 'Basic Information'}
                      {signupStep === 2 && 'Professional Details'}
                      {signupStep === 3 && 'Additional Information'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleDoctorSignupSubmit} className="flex flex-col gap-5 sm:gap-6">
                  {/* Step 1: Basic Information */}
                  {signupStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Basic Information</h3>
                        <p className="text-xs text-slate-500">Let's start with your essential details</p>
                      </div>
                      {/* Basic Information */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="firstName"
                              name="firstName"
                              type="text"
                              value={doctorSignupData.firstName}
                              onChange={handleDoctorSignupChange}
                              required
                              placeholder="John"
                              maxLength={50}
                              minLength={2}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={doctorSignupData.lastName}
                            onChange={handleDoctorSignupChange}
                            placeholder="Doe"
                            maxLength={50}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="doctor-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="doctor-email"
                              name="email"
                              type="email"
                              value={doctorSignupData.email}
                              onChange={handleDoctorSignupChange}
                              autoComplete="email"
                              required
                              placeholder="you@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="doctor-phone" className="text-sm font-semibold text-slate-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="doctor-phone"
                              name="phone"
                              type="tel"
                              value={doctorSignupData.phone}
                              onChange={handleDoctorSignupChange}
                              autoComplete="tel"
                              required
                              placeholder="9876543210"
                              maxLength={10}
                              inputMode="numeric"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 2: Professional Information */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Professional Information</h3>
                        <p className="text-xs text-slate-500">Tell us about your professional background</p>
                      </div>
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="category" className="text-sm font-semibold text-slate-700">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c] z-10">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <select
                              id="category"
                              name="category"
                              value={doctorSignupData.category}
                              onChange={handleDoctorSignupChange}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            >
                              <option value="">Select a category</option>
                              {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="subcategories" className="text-sm font-semibold text-slate-700">
                            Symptoms / Subcategories <span className="text-red-500">*</span>
                          </label>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(doctorSignupData.subcategories || []).map((subVal, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 rounded-full bg-[#11496c] px-3 py-1 text-xs font-semibold text-white"
                              >
                                {getSubcategoryName(subVal)}
                                <button
                                  type="button"
                                  onClick={() => removeSubcategory(subVal)}
                                  className="hover:text-slate-200"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c] z-10">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              type="text"
                              value={subcategorySearch}
                              onChange={(e) => {
                                setSubcategorySearch(e.target.value);
                                setShowSubcategoryDropdown(true);
                              }}
                              onFocus={() => setShowSubcategoryDropdown(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && showSubcategoryDropdown) {
                                  e.preventDefault();
                                  if (filteredSubcategories.length > 0) {
                                    handleSubcategorySelect(filteredSubcategories[0]);
                                  } else if (subcategorySearch.trim()) {
                                    handleCustomSubcategoryAdd();
                                  }
                                } else if (e.key === 'Escape') {
                                  setShowSubcategoryDropdown(false);
                                }
                              }}
                              placeholder={doctorSignupData.category ? "Type to search symptoms..." : "Please select a category first"}
                              disabled={!doctorSignupData.category}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                            {subcategorySearch && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSubcategorySearch('')
                                  setShowSubcategoryDropdown(false)
                                }}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 z-10"
                              >
                                <IoCloseOutline className="h-4 w-4" />
                              </button>
                            )}

                            {showSubcategoryDropdown && doctorSignupData.category && (
                              <div
                                className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
                              >
                                {filteredSubcategories.length > 0 ? (
                                  <div className="py-1">
                                    {filteredSubcategories.map((sub) => (
                                      <button
                                        key={sub._id}
                                        type="button"
                                        onClick={() => handleSubcategorySelect(sub)}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-[#11496c] hover:text-white transition-colors flex items-center gap-2"
                                      >
                                        <IoMedicalOutline className="h-4 w-4 flex-shrink-0" />
                                        <span>{sub.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="px-4 py-3 text-sm text-slate-500">
                                    No matching symptoms found.
                                  </div>
                                )}
                                
                                {subcategorySearch.trim() &&
                                  !filteredSubcategories.some(s => s.name.toLowerCase() === subcategorySearch.trim().toLowerCase()) && (
                                    <div className="border-t border-slate-200">
                                      <button
                                        type="button"
                                        onClick={handleCustomSubcategoryAdd}
                                        className="w-full px-4 py-2.5 text-left text-sm text-[#11496c] hover:bg-[#11496c] hover:text-white transition-colors flex items-center gap-2 font-medium"
                                      >
                                        <IoAddOutline className="h-4 w-4 flex-shrink-0" />
                                        <span>Add "{subcategorySearch.trim()}" (Press Enter)</span>
                                      </button>
                                    </div>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Select multiple symptoms from list or type to add "Other"
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="gender" className="text-sm font-semibold text-slate-700">
                            Gender <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            value={doctorSignupData.gender}
                            onChange={handleDoctorSignupChange}
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="licenseNumber" className="text-sm font-semibold text-slate-700">
                            License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="licenseNumber"
                              name="licenseNumber"
                              type="text"
                              value={doctorSignupData.licenseNumber}
                              onChange={handleDoctorSignupChange}
                              required
                              placeholder="Enter your medical license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="experienceYears" className="text-sm font-semibold text-slate-700">
                            Experience (Years)
                          </label>
                          <input
                            id="experienceYears"
                            name="experienceYears"
                            type="number"
                            min="0"
                            value={doctorSignupData.experienceYears}
                            onChange={handleDoctorSignupChange}
                            placeholder="5"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="qualification" className="text-sm font-semibold text-slate-700">
                            Qualification
                          </label>
                          <input
                            id="qualification"
                            name="qualification"
                            value={doctorSignupData.qualification}
                            onChange={handleDoctorSignupChange}
                            placeholder="MBBS, MD, etc."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="bio" className="text-sm font-semibold text-slate-700">
                            Bio
                          </label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={doctorSignupData.bio}
                            onChange={handleDoctorSignupChange}
                            rows="3"
                            placeholder="Tell us about your professional background..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="consultationFee" className="text-sm font-semibold text-slate-700">
                            Consultation Fee (₹)
                          </label>
                          <input
                            id="consultationFee"
                            name="consultationFee"
                            type="number"
                            min="0"
                            step="1"
                            value={doctorSignupData.consultationFee}
                            onChange={handleDoctorSignupChange}
                            placeholder="500"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </section>

                      {/* Consultation Modes */}
                      <section>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Consultation Modes
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                            <input
                              type="checkbox"
                              name="consultationModes"
                              value="in_person"
                              checked={doctorSignupData.consultationModes.includes('in_person')}
                              onChange={handleDoctorSignupChange}
                              className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                            />
                            <IoPersonOutline className="h-5 w-5 text-slate-600" />
                            <span className="text-sm text-slate-700 capitalize">In Person</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                            <input
                              type="checkbox"
                              name="consultationModes"
                              value="call"
                              checked={doctorSignupData.consultationModes.includes('call')}
                              onChange={handleDoctorSignupChange}
                              className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                            />
                            <IoCallOutline className="h-5 w-5 text-slate-600" />
                            <span className="text-sm text-slate-700 capitalize">Call</span>
                          </label>
                        </div>
                      </section>

                      {/* Languages */}
                      <section>
                        <label htmlFor="languages" className="text-sm font-semibold text-slate-700 mb-2 block">
                          Languages Spoken
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {doctorSignupData.languages.map((lang, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 rounded-full bg-[#11496c] px-3 py-1 text-xs font-semibold text-white"
                            >
                              {lang}
                              <button
                                type="button"
                                onClick={() => removeLanguage(lang)}
                                className="hover:text-slate-200"
                                aria-label={`Remove ${lang}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoLanguageOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="languages"
                            name="languages"
                            type="text"
                            placeholder="Enter language and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleDoctorSignupChange({ target: { name: 'languages', value: e.target.value } })
                                e.target.value = ''
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </section>

                      {/* Education */}
                      <section>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Education
                          </label>
                          <button
                            type="button"
                            onClick={addEducationEntry}
                            className="text-xs font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                          >
                            + Add Education
                          </button>
                        </div>
                        <div className="space-y-3">
                          {doctorSignupData.education.map((edu, index) => (
                            <div key={index} className="grid gap-3 sm:gap-4 sm:grid-cols-3 p-3 rounded-xl bg-slate-50">
                              <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                  <IoSchoolOutline className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <input
                                  name={`education.${index}.institution`}
                                  value={edu.institution}
                                  onChange={handleDoctorSignupChange}
                                  placeholder="Institution"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                                />
                              </div>
                              <input
                                name={`education.${index}.degree`}
                                value={edu.degree}
                                onChange={handleDoctorSignupChange}
                                placeholder="Degree"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                              <div className="flex gap-2">
                                <input
                                  name={`education.${index}.year`}
                                  type="number"
                                  value={edu.year}
                                  onChange={handleDoctorSignupChange}
                                  placeholder="Year"
                                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                                />
                                {doctorSignupData.education.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeEducationEntry(index)}
                                    className="px-3 text-red-500 hover:text-red-700 transition"
                                    aria-label="Remove education entry"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Clinic Details & Terms */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Clinic Details</h3>
                        <p className="text-xs text-slate-500">Tell us about your clinic or practice</p>
                      </div>
                      {/* Clinic Details */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoLocationOutline className="h-5 w-5 text-[#11496c]" />
                          Clinic Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="clinicDetails.name" className="text-sm font-semibold text-slate-700">
                              Clinic Name
                            </label>
                            <input
                              id="clinicDetails.name"
                              name="clinicDetails.name"
                              value={doctorSignupData.clinicDetails.name}
                              onChange={handleDoctorSignupChange}
                              placeholder="ABC Medical Clinic"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <label htmlFor="clinicDetails.address.line1" className="text-sm font-semibold text-slate-700">
                                Address Line 1
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                  <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <input
                                  id="clinicDetails.address.line1"
                                  name="clinicDetails.address.line1"
                                  value={doctorSignupData.clinicDetails.address.line1}
                                  onChange={handleDoctorSignupChange}
                                  placeholder="123 Health Street"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.line2" className="text-sm font-semibold text-slate-700">
                                Address Line 2 (optional)
                              </label>
                              <input
                                id="clinicDetails.address.line2"
                                name="clinicDetails.address.line2"
                                value={doctorSignupData.clinicDetails.address.line2}
                                onChange={handleDoctorSignupChange}
                                placeholder="Apartment or suite"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.city" className="text-sm font-semibold text-slate-700">
                                City
                              </label>
                              <input
                                id="clinicDetails.address.city"
                                name="clinicDetails.address.city"
                                value={doctorSignupData.clinicDetails.address.city}
                                onChange={handleDoctorSignupChange}
                                placeholder="Mumbai"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.state" className="text-sm font-semibold text-slate-700">
                                State
                              </label>
                              <input
                                id="clinicDetails.address.state"
                                name="clinicDetails.address.state"
                                value={doctorSignupData.clinicDetails.address.state}
                                onChange={handleDoctorSignupChange}
                                placeholder="Maharashtra"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.postalCode" className="text-sm font-semibold text-slate-700">
                                Postal Code
                              </label>
                              <input
                                id="clinicDetails.address.postalCode"
                                name="clinicDetails.address.postalCode"
                                value={doctorSignupData.clinicDetails.address.postalCode}
                                onChange={handleDoctorSignupChange}
                                placeholder="400001"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.country" className="text-sm font-semibold text-slate-700">
                                Country
                              </label>
                              <input
                                id="clinicDetails.address.country"
                                name="clinicDetails.address.country"
                                value={doctorSignupData.clinicDetails.address.country}
                                onChange={handleDoctorSignupChange}
                                placeholder="India"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Document Uploads */}
                      <section>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                            Upload Documents (PDF)
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            Upload your professional documents for verification (License, Certificates, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'doctor')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {doctorSignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({doctorSignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {doctorSignupData.documents.map((doc, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] flex-shrink-0" />
                                      <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index, 'doctor')}
                                      className="ml-2 text-red-500 hover:text-red-700 transition flex-shrink-0"
                                      aria-label={`Remove ${doc.name}`}
                                    >
                                      <IoCloseOutline className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Terms */}
                      <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={doctorSignupData.termsAccepted}
                          onChange={handleDoctorSignupChange}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                        />
                        <span>
                          I have read and agree to Heallyn's{' '}
                          <Link to="/terms" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            terms of service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            privacy policy
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="flex gap-3">
                      {signupStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePreviousStep}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2"
                        >
                          Previous
                        </button>
                      )}
                      {signupStep < totalSignupSteps ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          Next
                          <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || !doctorSignupData.termsAccepted}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Signup
                              <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Sign in instead
                  </button>
                </p>
              </motion.div>
  );
};

export default DoctorSignupForm;
