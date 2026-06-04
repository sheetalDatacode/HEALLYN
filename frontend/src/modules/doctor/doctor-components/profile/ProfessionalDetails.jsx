import React from 'react'
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoTrashOutline,
  IoSchoolOutline,
  IoAddOutline,
  IoLanguageOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoVideocamOutline
} from 'react-icons/io5'

const ProfessionalDetails = (props) => {
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
            {/* Professional Details */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'professional' ? null : 'professional')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Professional Details</h2>
                {(activeSection === 'professional' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'professional' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Specialization
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.specialization}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        License Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.licenseNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Experience (Years)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.experienceYears || 0} years</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Consultation Fee
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.consultationFee}
                          onChange={(e) => handleInputChange('consultationFee', parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">₹{formData.consultationFee || 0}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Qualification
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.qualification || ''}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        placeholder="e.g., MBBS, MD (Cardiology)"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{formData.qualification || 'Not set'}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows="2"
                        placeholder="Write about your experience and expertise..."
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 leading-snug">{formData.bio || 'Not set'}</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="pt-4 sm:pt-5 border-t border-slate-200">
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Education</h3>
                    {formData.education && formData.education.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {formData.education.map((edu, index) => (
                          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Institution"
                                    value={edu.institution || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'institution', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Degree"
                                    value={edu.degree || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'degree', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Year"
                                    value={edu.year || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'year', parseInt(e.target.value) || '')}
                                    className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('education', index)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                  >
                                    <IoTrashOutline className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">{edu.institution}</p>
                                  <p className="mt-0.5 text-[10px] text-slate-600 truncate">{edu.degree}</p>
                                  {edu.year && (
                                    <p className="mt-0.5 text-[10px] text-slate-500">Year: {edu.year}</p>
                                  )}
                                </div>
                                <IoSchoolOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No education records</p>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('education', { institution: '', degree: '', year: '' })}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <IoAddOutline className="h-3.5 w-3.5" />
                        Add Education
                      </button>
                    )}
                  </div>

                  {/* Languages & Consultation Modes */}
                  <div className="pt-4 sm:pt-5 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-slate-900">Languages</h3>
                        {formData.languages && formData.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.languages.map((lang, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#11496c]"
                              >
                                <IoLanguageOutline className="h-2.5 w-2.5 shrink-0" />
                                {lang}
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('languages', index)}
                                    className="ml-0.5 text-[#11496c] hover:text-[#0a2d3f] shrink-0"
                                  >
                                    <IoCloseOutline className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No languages added</p>
                        )}
                        {isEditing && (
                          <div className="mt-2 flex gap-1.5">
                            <input
                              ref={languageInputRef}
                              type="text"
                              placeholder="Add language"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  handleArrayAdd('languages', e.target.value.trim())
                                  e.target.value = ''
                                }
                              }}
                              className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (languageInputRef.current && languageInputRef.current.value && languageInputRef.current.value.trim()) {
                                  handleArrayAdd('languages', languageInputRef.current.value.trim())
                                  languageInputRef.current.value = ''
                                }
                              }}
                              className="flex items-center justify-center rounded-md bg-[#11496c] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0d3a52] shrink-0"
                            >
                              <IoAddOutline className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-slate-900">Consultation Modes</h3>
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            {['in_person', 'call', 'audio', 'chat', 'video'].map((mode) => (
                              <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={formData.consultationModes?.includes(mode) || false}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleArrayAdd('consultationModes', mode)
                                    } else {
                                      const index = formData.consultationModes?.indexOf(mode)
                                      if (index !== undefined && index !== -1) {
                                        handleArrayRemove('consultationModes', index)
                                      }
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c] shrink-0"
                                />
                                {mode === 'in_person' ? (
                                  <IoPersonOutline className="h-3.5 w-3.5 text-slate-600 shrink-0 group-hover:text-[#11496c]" />
                                ) : mode === 'call' || mode === 'audio' ? (
                                  <IoCallOutline className="h-3.5 w-3.5 text-slate-600 shrink-0 group-hover:text-[#11496c]" />
                                ) : mode === 'chat' ? (
                                  <IoMailOutline className="h-3.5 w-3.5 text-slate-600 shrink-0 group-hover:text-[#11496c]" />
                                ) : (
                                  <IoVideocamOutline className="h-3.5 w-3.5 text-slate-600 shrink-0 group-hover:text-[#11496c]" />
                                )}
                                <span className="text-xs font-medium text-slate-900 capitalize group-hover:text-[#11496c]">
                                  {mode === 'in_person' ? 'In Person' : mode === 'video' ? 'Video Call' : mode.replace('_', ' ')}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.consultationModes && formData.consultationModes.length > 0 ? (
                              formData.consultationModes.map((mode, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                                >
                                  {mode === 'in_person' ? (
                                    <IoPersonOutline className="h-2.5 w-2.5 shrink-0" />
                                  ) : mode === 'call' || mode === 'audio' ? (
                                    <IoCallOutline className="h-2.5 w-2.5 shrink-0" />
                                  ) : mode === 'chat' ? (
                                    <IoMailOutline className="h-2.5 w-2.5 shrink-0" />
                                  ) : mode === 'video' ? (
                                    <IoVideocamOutline className="h-2.5 w-2.5 shrink-0" />
                                  ) : (
                                    <IoPersonOutline className="h-2.5 w-2.5 shrink-0" />
                                  )}
                                  {mode === 'in_person' ? 'In Person' : mode === 'video' ? 'Video Call' : mode.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500">No consultation modes set</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
    </>
  );
};

export default ProfessionalDetails;
