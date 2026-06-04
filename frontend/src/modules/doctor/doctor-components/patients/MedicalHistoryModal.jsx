import React from 'react'
import {
  IoCloseOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5'

const MedicalHistoryModal = (props) => {
  const {
    showHistoryModal,
    setShowHistoryModal,
    selectedPatient,
    medicalHistory,
    formatDate,
    showCancelSessionModal,
    setShowCancelSessionModal,
    currentSession,
    cancelReason,
    setCancelReason,
    handleCancelSession,
  } = props;

  return (
    <>
      {/* Medical History Modal */}
      {showHistoryModal && selectedPatient && medicalHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistoryModal(false)
            }
          }}
        >
          <div className="relative w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPatient.patientImage}
                  alt={selectedPatient.patientName}
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedPatient.patientName}</h2>
                  <p className="text-xs text-slate-600">
                    {selectedPatient.age} years • {selectedPatient.gender}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Personal Information */}
              {medicalHistory.personalInfo && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Personal Information
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="grid gap-2 grid-cols-2">
                      {medicalHistory.personalInfo.bloodGroup && (
                        <div>
                          <p className="text-xs text-slate-600">Blood Group</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {medicalHistory.personalInfo.bloodGroup}
                          </p>
                        </div>
                      )}
                      {medicalHistory.personalInfo.phone && (
                        <div>
                          <p className="text-xs text-slate-600">Phone</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {medicalHistory.personalInfo.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Conditions */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Conditions
                </h3>
                {medicalHistory.conditions && medicalHistory.conditions.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.conditions.map((condition, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{condition.name || condition}</p>
                        {condition.diagnosedDate && (
                          <p className="text-xs text-slate-600 mt-1">
                            Since {formatDate(condition.diagnosedDate)} • {condition.status || 'Active'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">No known conditions</p>
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Allergies
                </h3>
                {medicalHistory.allergies && medicalHistory.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.allergies.map((allergy, idx) => (
                      <div key={idx} className="rounded-lg bg-red-50 p-3">
                        <p className="text-sm font-semibold text-red-900">{allergy.name || allergy}</p>
                        {allergy.severity && (
                          <p className="text-xs text-red-700 mt-1">
                            {allergy.severity} • {allergy.reaction || ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-slate-500">No known allergies</p>
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Current Medications
                </h3>
                {medicalHistory.medications && medicalHistory.medications.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.medications.map((med, idx) => (
                      <div key={idx} className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">
                          {med.name || med}
                        </p>
                        {med.dosage && med.frequency && (
                          <p className="text-xs text-emerald-700 mt-1">
                            {med.dosage} • {med.frequency}
                          </p>
                        )}
                        {med.startDate && (
                          <p className="text-xs text-emerald-600 mt-1">Since {formatDate(med.startDate)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-slate-500">No current medications</p>
                  </div>
                )}
              </div>

              {/* Vitals Records */}
              {(() => {
                try {
                  const historyKey = `patientHistory_${selectedPatient?.patientId}`
                  const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '{}')
                  const vitalsRecords = savedHistory.vitalsRecords || []
                  
                  if (vitalsRecords.length > 0) {
                    return (
                      <div>
                        <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Vitals Records
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {vitalsRecords.map((vital, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-600">
                                  {vital.recordedAt || formatDate(vital.date)}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic && (
                                  <div>
                                    <p className="text-slate-600">BP</p>
                                    <p className="font-semibold text-slate-900">
                                      {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                                    </p>
                                  </div>
                                )}
                                {vital.temperature && (
                                  <div>
                                    <p className="text-slate-600">Temp</p>
                                    <p className="font-semibold text-slate-900">{vital.temperature} °F</p>
                                  </div>
                                )}
                                {vital.pulse && (
                                  <div>
                                    <p className="text-slate-600">Pulse</p>
                                    <p className="font-semibold text-slate-900">{vital.pulse} bpm</p>
                                  </div>
                                )}
                                {vital.respiratoryRate && (
                                  <div>
                                    <p className="text-slate-600">RR</p>
                                    <p className="font-semibold text-slate-900">{vital.respiratoryRate} /min</p>
                                  </div>
                                )}
                                {vital.oxygenSaturation && (
                                  <div>
                                    <p className="text-slate-600">SpO2</p>
                                    <p className="font-semibold text-slate-900">{vital.oxygenSaturation}%</p>
                                  </div>
                                )}
                                {vital.weight && (
                                  <div>
                                    <p className="text-slate-600">Weight</p>
                                    <p className="font-semibold text-slate-900">{vital.weight} kg</p>
                                  </div>
                                )}
                                {vital.height && (
                                  <div>
                                    <p className="text-slate-600">Height</p>
                                    <p className="font-semibold text-slate-900">{vital.height} cm</p>
                                  </div>
                                )}
                                {vital.bmi && (
                                  <div>
                                    <p className="text-slate-600">BMI</p>
                                    <p className="font-semibold text-slate-900">{vital.bmi}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                } catch (error) {
                  console.error('Error loading vitals records:', error)
                }
                return null
              })()}

              {/* Previous Consultations */}
              {medicalHistory.previousConsultations && medicalHistory.previousConsultations.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Previous Consultations
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {medicalHistory.previousConsultations.map((consult, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{consult.diagnosis}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(consult.date)}</p>
                            <p className="mt-1 text-xs text-slate-600">Dr. {consult.doctor}</p>
                            {consult.medications && consult.medications.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {consult.medications.map((med, medIdx) => (
                                  <span
                                    key={medIdx}
                                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                  >
                                    {med}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Reports */}
              {medicalHistory.labReports && medicalHistory.labReports.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Lab Reports
                  </h3>
                  <div className="space-y-2">
                    {medicalHistory.labReports.map((report, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{report.testName}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(report.date)}</p>
                            <p className="mt-1 text-xs font-medium text-slate-900">{report.result}</p>
                            <span
                              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                report.status === 'Normal'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Visit */}
              {medicalHistory.lastVisit && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Last Visit
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-700">{formatDate(medicalHistory.lastVisit)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalHistoryModal;
