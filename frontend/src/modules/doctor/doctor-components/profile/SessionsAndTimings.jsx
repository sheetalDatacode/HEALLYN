import React from 'react'
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoCalendarOutline,
  IoAddOutline
} from 'react-icons/io5'

const SessionsAndTimings = (props) => {
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

  const stableAverageConsultationMinutes = formData?.averageConsultationMinutes || 20;

  return (
    <>
            {/* Sessions & Timings */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'timings' ? null : 'timings')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Sessions & Timings</h2>
                {(activeSection === 'timings' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'timings' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div>
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Available Timings</h3>
                    {formData.availableTimings && formData.availableTimings.length > 0 ? (
                      <div className="space-y-2">
                        {formData.availableTimings.map((timing, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={timing}
                                  onChange={(e) => {
                                    const updated = [...(formData.availableTimings || [])]
                                    updated[index] = e.target.value
                                    setFormData((prev) => ({ ...prev, availableTimings: updated }))
                                  }}
                                  placeholder="e.g., 09:00 AM - 12:00 PM"
                                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleArrayRemove('availableTimings', index)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                >
                                  <IoTrashOutline className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <IoTimeOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
                                <span className="text-xs font-medium text-slate-900">{timing}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No timings set</p>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          // Add empty string directly to allow user to type
                          setFormData((prev) => ({
                            ...prev,
                            availableTimings: [...(prev.availableTimings || []), ''],
                          }))
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <IoAddOutline className="h-3.5 w-3.5" />
                        Add Timing
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4 sm:pt-5">
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Availability Days</h3>
                    {formData.availability && formData.availability.length > 0 ? (
                      <div className="space-y-2">
                        {formData.availability.map((avail, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <>
                                <select
                                  value={avail.day}
                                  onChange={(e) => handleArrayItemChange('availability', index, 'day', e.target.value)}
                                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="time"
                                    value={avail.startTime}
                                    onChange={(e) => handleArrayItemChange('availability', index, 'startTime', e.target.value)}
                                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                  <span className="text-slate-500 text-[10px]">to</span>
                                  <input
                                    type="time"
                                    value={avail.endTime}
                                    onChange={(e) => handleArrayItemChange('availability', index, 'endTime', e.target.value)}
                                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('availability', index)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                  >
                                    <IoTrashOutline className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <IoCalendarOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
                                <span className="text-xs font-medium text-slate-900">
                                  {avail.day}: {formatTimeTo12Hour(avail.startTime)} - {formatTimeTo12Hour(avail.endTime)}
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No availability set</p>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('availability', { day: 'Monday', startTime: '09:00', endTime: '17:00' })}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <IoAddOutline className="h-3.5 w-3.5" />
                        Add Availability Day
                      </button>
                    )}
                  </div>

                  {/* Average Consultation Minutes */}
                  <div className="border-t border-slate-200 pt-4 sm:pt-5">
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Average Consultation Time Per Patient</h3>
                    <p className="mb-2 text-[10px] sm:text-xs text-slate-500">
                      Set the approximate time (in minutes) you spend per patient during consultations. This helps in scheduling and queue management.
                    </p>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={formData.averageConsultationMinutes ?? ''}
                            onChange={(e) => {
                              const inputValue = e.target.value

                              // Allow empty input while typing
                              if (inputValue === '') {
                                handleInputChange('averageConsultationMinutes', '')
                                return
                              }

                              // Parse the number
                              const numValue = parseInt(inputValue, 10)

                              // If it's a valid number and within range
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 60) {
                                handleInputChange('averageConsultationMinutes', numValue)
                              }
                            }}
                            onBlur={(e) => {
                              // On blur, ensure we have a valid value (default to 20 if empty)
                              const inputValue = e.target.value.trim()
                              if (inputValue === '') {
                                handleInputChange('averageConsultationMinutes', 20)
                              } else {
                                const numValue = parseInt(inputValue, 10)
                                if (isNaN(numValue) || numValue < 0 || numValue > 60) {
                                  handleInputChange('averageConsultationMinutes', 20)
                                } else {
                                  handleInputChange('averageConsultationMinutes', numValue)
                                }
                              }
                            }}
                            className="w-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <span className="text-xs sm:text-sm font-medium text-slate-700">minutes</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Range: 0 - 60 minutes
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
                        <IoTimeOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] shrink-0" />
                        <span className="text-sm sm:text-base font-semibold text-slate-900">
                          {stableAverageConsultationMinutes} minutes per patient
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
    </>
  );
};

export default SessionsAndTimings;
