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

const PharmacySignupForm = ({
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
    pharmacySignupData,
    handlePharmacySignupSubmit,
    handlePharmacySignupChange,
    addOperatingHour,
    removeOperatingHour,
    handleOperatingHourChange
  } = props;

  return (
              <motion.div
                key="signup-pharmacy"
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

                <form onSubmit={handlePharmacySignupSubmit} className="flex flex-col gap-5 sm:gap-6">
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
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="pharmacyName" className="text-sm font-semibold text-slate-700">
                            Pharmacy Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacyName"
                              name="pharmacyName"
                              type="text"
                              value={pharmacySignupData.pharmacyName}
                              onChange={handlePharmacySignupChange}
                              required
                              placeholder="ABC Pharmacy"
                              maxLength={100}
                              minLength={2}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="ownerName" className="text-sm font-semibold text-slate-700">
                            Owner Name
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="ownerName"
                              name="ownerName"
                              value={pharmacySignupData.ownerName}
                              onChange={handlePharmacySignupChange}
                              placeholder="John Doe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pharmacy-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacy-email"
                              name="email"
                              type="email"
                              value={pharmacySignupData.email}
                              onChange={handlePharmacySignupChange}
                              autoComplete="email"
                              required
                              placeholder="pharmacy@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pharmacy-phone" className="text-sm font-semibold text-slate-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacy-phone"
                              name="phone"
                              type="tel"
                              value={pharmacySignupData.phone}
                              onChange={handlePharmacySignupChange}
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

                  {/* Step 2: Business Details */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Business Details</h3>
                        <p className="text-xs text-slate-500">Help us understand your business better</p>
                      </div>
                      {/* License & GST */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pharmacy-licenseNumber" className="text-sm font-semibold text-slate-700">
                            License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacy-licenseNumber"
                              name="licenseNumber"
                              type="text"
                              value={pharmacySignupData.licenseNumber}
                              onChange={handlePharmacySignupChange}
                              required
                              placeholder="Enter your pharmacy license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="gstNumber" className="text-sm font-semibold text-slate-700">
                            GST Number
                          </label>
                          <input
                            id="gstNumber"
                            name="gstNumber"
                            value={pharmacySignupData.gstNumber}
                            onChange={handlePharmacySignupChange}
                            placeholder="GST123456789"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </section>

                      {/* Address */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoLocationOutline className="h-5 w-5 text-[#11496c]" />
                          Address
                        </h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label htmlFor="address.line1" className="text-sm font-semibold text-slate-700">
                              Address Line 1
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="address.line1"
                                name="address.line1"
                                value={pharmacySignupData.address.line1}
                                onChange={handlePharmacySignupChange}
                                placeholder="123 Pharmacy Street"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.line2" className="text-sm font-semibold text-slate-700">
                              Address Line 2 (optional)
                            </label>
                            <input
                              id="address.line2"
                              name="address.line2"
                              value={pharmacySignupData.address.line2}
                              onChange={handlePharmacySignupChange}
                              placeholder="Apartment or suite"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.city" className="text-sm font-semibold text-slate-700">
                              City
                            </label>
                            <input
                              id="address.city"
                              name="address.city"
                              value={pharmacySignupData.address.city}
                              onChange={handlePharmacySignupChange}
                              placeholder="Mumbai"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.state" className="text-sm font-semibold text-slate-700">
                              State
                            </label>
                            <input
                              id="address.state"
                              name="address.state"
                              value={pharmacySignupData.address.state}
                              onChange={handlePharmacySignupChange}
                              placeholder="Maharashtra"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.postalCode" className="text-sm font-semibold text-slate-700">
                              Postal Code
                            </label>
                            <input
                              id="address.postalCode"
                              name="address.postalCode"
                              value={pharmacySignupData.address.postalCode}
                              onChange={handlePharmacySignupChange}
                              placeholder="400001"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.country" className="text-sm font-semibold text-slate-700">
                              Country
                            </label>
                            <input
                              id="address.country"
                              name="address.country"
                              value={pharmacySignupData.address.country}
                              onChange={handlePharmacySignupChange}
                              placeholder="India"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                      {/* Operating Timings */}
                      <section>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="timings" className="text-sm font-semibold text-slate-700">
                            Operating Timings
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoTimeOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="timings"
                              name="timings"
                              value={pharmacySignupData.timings}
                              onChange={handlePharmacySignupChange}
                              placeholder="9:00 AM - 9:00 PM"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Contact Person & Terms */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Contact Person</h3>
                        <p className="text-xs text-slate-500">Who should we contact for business matters?</p>
                      </div>
                      {/* Contact Person */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoPersonOutline className="h-5 w-5 text-[#11496c]" />
                          Contact Person
                        </h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="contactPerson.name" className="text-sm font-semibold text-slate-700">
                              Name
                            </label>
                            <input
                              id="contactPerson.name"
                              name="contactPerson.name"
                              value={pharmacySignupData.contactPerson.name}
                              onChange={handlePharmacySignupChange}
                              placeholder="John Doe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="contactPerson.phone" className="text-sm font-semibold text-slate-700">
                              Phone
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="contactPerson.phone"
                                name="contactPerson.phone"
                                value={pharmacySignupData.contactPerson.phone}
                                onChange={handlePharmacySignupChange}
                                placeholder="9876543210"
                                maxLength={10}
                                inputMode="numeric"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label htmlFor="contactPerson.email" className="text-sm font-semibold text-slate-700">
                              Email
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="contactPerson.email"
                                name="contactPerson.email"
                                type="email"
                                value={pharmacySignupData.contactPerson.email}
                                onChange={handlePharmacySignupChange}
                                placeholder="contact@example.com"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
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
                            Upload your business documents for verification (License, GST Certificate, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'pharmacy')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {pharmacySignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({pharmacySignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {pharmacySignupData.documents.map((doc, index) => (
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
                                      onClick={() => removeDocument(index, 'pharmacy')}
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
                          checked={pharmacySignupData.termsAccepted}
                          onChange={handlePharmacySignupChange}
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
                          disabled={isSubmitting || !pharmacySignupData.termsAccepted}
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

export default PharmacySignupForm;
