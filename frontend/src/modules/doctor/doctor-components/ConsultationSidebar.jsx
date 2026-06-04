import React from 'react';
import { IoTimeOutline, IoPersonOutline, IoArrowBackOutline } from 'react-icons/io5';

const ConsultationSidebar = ({
  filterParam,
  getFilterLabel,
  filteredConsultations,
  selectedConsultation,
  setSelectedConsultation,
  isManuallySelectedRef,
  getConsultationById,
  transformConsultationData,
  formatDateTime,
  getTypeIcon,
  getModeLabel,
  navigate,
  location
}) => {
  return (
    <>
      {/* Filter Header */}
      {filterParam !== 'all' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{getFilterLabel()}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {filteredConsultations.length} {filteredConsultations.length === 1 ? 'consultation' : 'consultations'} found
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.history.pushState({}, '', '/doctor/consultations')}
              className="text-sm font-medium text-[#11496c] hover:text-[#0d3a52]"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Consultations List View */}
      {!selectedConsultation && filteredConsultations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">
            {filterParam !== 'all' ? getFilterLabel() : 'Active Consultations'}
          </h2>
          <div className="space-y-3">
            {filteredConsultations.map((consultation) => (
              <div
                key={consultation.id}
                onClick={async () => {
                  isManuallySelectedRef.current = true;
                  try {
                    const response = await getConsultationById(consultation.id);
                    if (response.success && response.data) {
                      const refreshedConsultation = transformConsultationData(response.data);
                      setSelectedConsultation(refreshedConsultation);
                    } else {
                      setSelectedConsultation(consultation);
                    }
                  } catch (error) {
                    console.error('Error refreshing consultation:', error);
                    setSelectedConsultation(consultation);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#11496c]/30 active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={consultation.patientImage}
                    alt={consultation.patientName}
                    className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900">{consultation.patientName}</h3>
                        <p className="mt-1 text-sm text-slate-600">{consultation.reason}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        consultation.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : consultation.status === 'waiting' || consultation.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : consultation.status === 'in-progress' || consultation.status === 'called'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {consultation.status === 'in-progress' ? 'IN-PROGRESS' : 
                         consultation.status === 'called' ? 'IN-PROGRESS' :
                         consultation.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <IoTimeOutline className="h-4 w-4" />
                        <span>{formatDateTime(consultation.appointmentTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{consultation.age} years • {consultation.gender}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#11496c] font-medium">
                        {(() => {
                          const ModeIcon = getTypeIcon(consultation.consultationMode);
                          return (
                            <>
                              <ModeIcon className="h-3.5 w-3.5" />
                              <span>{getModeLabel(consultation.consultationMode)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Consultations Message */}
      {!selectedConsultation && filteredConsultations.length === 0 && !location.state?.loadSavedData && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <IoPersonOutline className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No Patient Selected</h3>
          <p className="mt-2 text-sm text-slate-600">
            Please call a patient from the queue to start consultation.
          </p>
          <button
            type="button"
            onClick={() => navigate('/doctor/patients')}
            className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
          >
            <IoArrowBackOutline className="h-4 w-4" />
            Go to Patient Queue
          </button>
        </div>
      )}
    </>
  );
};

export default ConsultationSidebar;
