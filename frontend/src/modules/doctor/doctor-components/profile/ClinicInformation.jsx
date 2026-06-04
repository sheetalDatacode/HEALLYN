import React from 'react'
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoLocationOutline
} from 'react-icons/io5'

const ClinicInformation = (props) => {
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
            {/* Clinic Information */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'clinic' ? null : 'clinic')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Clinic Information</h2>
                {(activeSection === 'clinic' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'clinic' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Clinic Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.clinicDetails?.name || ''}
                        onChange={(e) => handleInputChange('clinicDetails.name', e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{formData.clinicDetails?.name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Clinic Address
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={formData.clinicDetails?.address?.line1 || ''}
                          onChange={(e) => handleInputChange('clinicDetails.address.line1', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2 (Optional)"
                          value={formData.clinicDetails?.address?.line2 || ''}
                          onChange={(e) => handleInputChange('clinicDetails.address.line2', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={formData.clinicDetails?.address?.city || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.city', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={formData.clinicDetails?.address?.state || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.state', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={formData.clinicDetails?.address?.postalCode || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.postalCode', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={formData.clinicDetails?.address?.country || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.country', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                        <IoLocationOutline className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span className="break-words font-medium">{formatAddress(formData.clinicDetails?.address)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
    </>
  );
};

export default ClinicInformation;
