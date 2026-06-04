import React from 'react';
import { IoTimeOutline } from 'react-icons/io5';

const ConsultationHeader = ({
  selectedConsultation,
  formatDate,
  formatDateTime,
  getTypeIcon,
  getModeLabel
}) => {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
      <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
        <img
          src={selectedConsultation.patientImage}
          alt={selectedConsultation.patientName}
          className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-lg sm:rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">{selectedConsultation.patientName}</h3>
          <div className="mt-1 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-600">
            <p>
              {selectedConsultation.age !== null && selectedConsultation.age !== undefined 
                ? `${selectedConsultation.age} years` 
                : 'Age not available'} • {selectedConsultation.gender ? selectedConsultation.gender.charAt(0).toUpperCase() + selectedConsultation.gender.slice(1) : 'N/A'}
            </p>
            <p className="flex items-center gap-1">
              <IoTimeOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="truncate text-[10px] sm:text-xs">
                {selectedConsultation.appointmentDate 
                  ? formatDate(selectedConsultation.appointmentDate) 
                  : formatDateTime(selectedConsultation.appointmentTime)}
              </span>
            </p>
            <div className="flex items-center gap-1.5 font-semibold text-[#11496c]">
              {(() => {
                const ModeIcon = getTypeIcon(selectedConsultation.consultationMode);
                return (
                  <>
                    <ModeIcon className="h-3.5 w-3.5" />
                    <span>{getModeLabel(selectedConsultation.consultationMode)}</span>
                  </>
                );
              })()}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm font-medium text-slate-700 line-clamp-2">{selectedConsultation.reason}</p>
        </div>
      </div>
    </div>
  );
};

export default ConsultationHeader;
