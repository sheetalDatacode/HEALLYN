import React from 'react'
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoMailOutline,
  IoCallOutline
} from 'react-icons/io5'

const DoctorPersonalInformation = (props) => {
  const {
    activeSection,
    setActiveSection,
    isEditing,
    formData,
    handleInputChange,
    handleArrayAdd,
    handleArrayRemove,
    handleArrayItemChange,
    languageInputRef,
    formatDate,
    formatAddress,
    formatTimeTo12Hour,
    handleSignatureUpload,
    handleRemoveSignature
  } = props;

  return (
    <>
            {/* Doctor Personal Information */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Doctor Personal Information</h2>
                {(activeSection === 'personal' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'personal' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">
                          {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoMailOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{formData.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoCallOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{formData.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
    </>
  );
};

export default DoctorPersonalInformation;
