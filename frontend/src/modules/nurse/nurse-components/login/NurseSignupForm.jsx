import { motion } from 'framer-motion'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoAddOutline,
  IoMedicalOutline,
  IoLanguageOutline,
  IoVideocamOutline,
  IoCloseOutline,
  IoBriefcaseOutline,
  IoSchoolOutline
} from 'react-icons/io5'

const NurseSignupForm = ({
  signupStep,
  totalSignupSteps,
  handleModeChange,
  isSubmitting,
  handlePreviousStep,
  handleNextStep,
  handleDocumentUpload,
  ...props
}) => {
  const {
    nurseSignupData,
    handleNurseSignupSubmit,
    handleNurseSignupChange,
    addOperatingHour,
    removeOperatingHour,
    handleOperatingHourChange
  } = props;

  return (
              <motion.div
                key="signup-nurse"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3, 4].map((step) => (
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
                        {step < 4 && (
                          <div
                            className={`h-1.5 w-8 sm:w-12 rounded-full transition-all duration-300 ${signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
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
                      {signupStep === 1 && 'Basic Details'}
                      {signupStep === 2 && 'Address Details'}
                      {signupStep === 3 && 'Professional Details'}
                      {signupStep === 4 && 'Document Uploads'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleNurseSignupSubmit} className="flex flex-col gap-5 sm:gap-6" encType="multipart/form-data">
                  {/* Step 1: Basic Details */}
                  {signupStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">🧑‍⚕️ Basic Details</h3>
                        <p className="text-xs text-slate-500">Let's start with your essential details</p>
                      </div>
                      {/* Basic Information */}
                      <section className="grid gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-fullName" className="text-sm font-semibold text-slate-700">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-fullName"
                              name="fullName"
                              type="text"
                              value={nurseSignupData.fullName}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="Enter your full name"
                              minLength={2}
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-email"
                              name="email"
                              type="email"
                              value={nurseSignupData.email}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="you@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-phone" className="text-sm font-semibold text-slate-700">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-phone"
                              name="phone"
                              type="tel"
                              value={nurseSignupData.phone}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="9876543210"
                              maxLength={10}
                              inputMode="numeric"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 2: Address Details */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">📍 Address Details</h3>
                        <p className="text-xs text-slate-500">Enter your complete address</p>
                      </div>
                      {/* Address */}
                      <section className="grid gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.line1" className="text-sm font-semibold text-slate-700">
                            Complete Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-address.line1"
                              name="address.line1"
                              type="text"
                              value={nurseSignupData.address.line1}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="Street address, building name, etc."
                              maxLength={200}
                              minLength={5}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.city" className="text-sm font-semibold text-slate-700">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-address.city"
                            name="address.city"
                            type="text"
                            value={nurseSignupData.address.city}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="Mumbai"
                            maxLength={100}
                            minLength={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.state" className="text-sm font-semibold text-slate-700">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-address.state"
                            name="address.state"
                            type="text"
                            value={nurseSignupData.address.state}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="Maharashtra"
                            maxLength={100}
                            minLength={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.postalCode" className="text-sm font-semibold text-slate-700">
                            Pincode <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-address.postalCode"
                            name="address.postalCode"
                            type="text"
                            value={nurseSignupData.address.postalCode}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="400001"
                            maxLength={6}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Professional Details */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">🎓 Professional Details</h3>
                        <p className="text-xs text-slate-500">VERY IMPORTANT for admin verification</p>
                      </div>
                      {/* Professional Details */}
                      <section className="grid gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-qualification" className="text-sm font-semibold text-slate-700">
                            Qualification <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoSchoolOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-qualification"
                              name="qualification"
                              type="text"
                              value={nurseSignupData.qualification}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="GNM, B.Sc Nursing, ANM, D.Pharm, etc."
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-experienceYears" className="text-sm font-semibold text-slate-700">
                            Experience (in years)
                          </label>
                          <input
                            id="nurse-experienceYears"
                            name="experienceYears"
                            type="number"
                            value={nurseSignupData.experienceYears}
                            onChange={handleNurseSignupChange}
                            min="0"
                            max="50"
                            placeholder="5"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-specialization" className="text-sm font-semibold text-slate-700">
                            Specialization <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <select
                              id="nurse-specialization"
                              name="specialization"
                              value={nurseSignupData.specialization}
                              onChange={handleNurseSignupChange}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 appearance-none"
                            >
                              <option value="Home Care Nurse">Home Care Nurse</option>
                            </select>
                            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 pr-3">
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-fees" className="text-sm font-semibold text-slate-700">
                            Fees (₹)
                          </label>
                          <input
                            id="nurse-fees"
                            name="fees"
                            type="number"
                            min="0"
                            max="999999"
                            step="1"
                            value={nurseSignupData.fees}
                            onChange={handleNurseSignupChange}
                            placeholder="500"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-registrationNumber" className="text-sm font-semibold text-slate-700">
                            Registration Number / License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-registrationNumber"
                              name="registrationNumber"
                              type="text"
                              value={nurseSignupData.registrationNumber}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="Enter your registration/license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-registrationCouncilName" className="text-sm font-semibold text-slate-700">
                            Registration Council/Board Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-registrationCouncilName"
                            name="registrationCouncilName"
                            type="text"
                            value={nurseSignupData.registrationCouncilName}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="e.g., Indian Nursing Council, State Nursing Council"
                            maxLength={100}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 4: Document Uploads & Terms */}
                  {signupStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">📄 Document Uploads</h3>
                        <p className="text-xs text-slate-500">Proof Verification - Upload your certificates</p>
                      </div>
                      {/* Document Uploads */}
                      <section>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                            Upload Documents (PDF)
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            Upload your professional documents for verification (Nursing Certificate, Registration Certificate, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'nurse')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {nurseSignupData.documents && nurseSignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({nurseSignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {nurseSignupData.documents.map((doc, index) => (
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
                                      onClick={() => removeDocument(index, 'nurse')}
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
                          checked={nurseSignupData.termsAccepted}
                          onChange={handleNurseSignupChange}
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
                          disabled={isSubmitting || !nurseSignupData.termsAccepted}
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

export default NurseSignupForm;
