import React from 'react';
import { IoMedicalOutline, IoFlaskOutline, IoEyeOutline, IoDownloadOutline } from 'react-icons/io5';

const PatientHistoryTab = ({
  patientHistory,
  selectedConsultation,
  formatDate,
  handleViewLabReport,
  handleDownloadLabReport,
  sharedLabReports
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-4 shadow-md shadow-slate-200/50">
      <h3 className="mb-4 sm:mb-5 lg:mb-3 text-base sm:text-lg lg:text-base font-bold text-slate-900">Patient Medical History</h3>
      {patientHistory ? (
        <div className="space-y-6">
          {/* Personal Info */}
          {patientHistory.personalInfo && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Personal Information
              </h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-600">Blood Group</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {patientHistory.personalInfo?.bloodGroup || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {patientHistory.personalInfo?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vitals Records */}
          {(() => {
            try {
              const vitalsRecords = [];
              if (patientHistory?.consultations && Array.isArray(patientHistory.consultations)) {
                patientHistory.consultations.forEach((consultation) => {
                  if (consultation.vitals) {
                    const hasVitalsData = consultation.vitals.bloodPressure?.systolic || 
                                          consultation.vitals.temperature || 
                                          consultation.vitals.pulse || 
                                          consultation.vitals.heartRate ||
                                          consultation.vitals.respiratoryRate ||
                                          consultation.vitals.oxygenSaturation ||
                                          consultation.vitals.spo2 ||
                                          consultation.vitals.weight ||
                                          consultation.vitals.height ||
                                          consultation.vitals.bmi;
                    
                    if (hasVitalsData) {
                      const consultationDate = consultation.consultationDate || consultation.createdAt || consultation.updatedAt;
                      const dateObj = consultationDate ? new Date(consultationDate) : new Date();
                      
                      vitalsRecords.push({
                        ...consultation.vitals,
                        consultationId: consultation._id || consultation.id,
                        date: consultationDate,
                        dateObj: dateObj,
                        recordedAt: consultation.vitals.recordedAt || dateObj.toLocaleString('en-US'),
                      });
                    }
                  }
                });
              }
              
              if (vitalsRecords.length === 0) {
                const historyKey = `patientHistory_${selectedConsultation?.patientId}`;
                const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '{}');
                const localStorageVitals = savedHistory.vitalsRecords || [];
                vitalsRecords.push(...localStorageVitals.map(v => ({
                  ...v,
                  dateObj: v.date ? new Date(v.date) : new Date()
                })));
              }
              
              vitalsRecords.sort((a, b) => {
                const dateA = a.dateObj || (a.date ? new Date(a.date) : new Date(0));
                const dateB = b.dateObj || (b.date ? new Date(b.date) : new Date(0));
                return dateB - dateA;
              });
              
              if (vitalsRecords.length > 0) {
                return (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                      Vitals Records
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {vitalsRecords.map((vital, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-600">
                              {vital.recordedAt || formatDate(vital.date)}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic && (
                              <div><p className="text-slate-600">BP</p><p className="font-semibold text-slate-900">{vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg</p></div>
                            )}
                            {vital.temperature && (
                              <div><p className="text-slate-600">Temp</p><p className="font-semibold text-slate-900">{vital.temperature} °F</p></div>
                            )}
                            {(vital.pulse || vital.heartRate) && (
                              <div><p className="text-slate-600">Pulse</p><p className="font-semibold text-slate-900">{vital.pulse || vital.heartRate} bpm</p></div>
                            )}
                            {vital.respiratoryRate && (
                              <div><p className="text-slate-600">RR</p><p className="font-semibold text-slate-900">{vital.respiratoryRate} /min</p></div>
                            )}
                            {(vital.oxygenSaturation || vital.spo2) && (
                              <div><p className="text-slate-600">SpO2</p><p className="font-semibold text-slate-900">{vital.oxygenSaturation || vital.spo2}%</p></div>
                            )}
                            {vital.weight && (
                              <div><p className="text-slate-600">Weight</p><p className="font-semibold text-slate-900">{vital.weight} kg</p></div>
                            )}
                            {vital.height && (
                              <div><p className="text-slate-600">Height</p><p className="font-semibold text-slate-900">{vital.height} cm</p></div>
                            )}
                            {vital.bmi && (
                              <div><p className="text-slate-600">BMI</p><p className="font-semibold text-slate-900">{vital.bmi}</p></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (error) {
              console.error('Error loading vitals records:', error);
            }
            return null;
          })()}

          {/* Previous Consultations */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Previous Consultations
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(() => {
                const consultations = patientHistory?.consultations || patientHistory?.previousConsultations || [];
                
                if (Array.isArray(consultations) && consultations.length > 0) {
                  const sortedConsultations = [...consultations].sort((a, b) => {
                    const dateA = new Date(a.consultationDate || a.date || a.createdAt || 0);
                    const dateB = new Date(b.consultationDate || b.date || b.createdAt || 0);
                    return dateB - dateA;
                  });
                  
                  return sortedConsultations.map((consult, idx) => {
                    let doctorName = 'Unknown Doctor';
                    if (consult.doctorId) {
                      if (typeof consult.doctorId === 'object') {
                        if (consult.doctorId.firstName && consult.doctorId.lastName) {
                          doctorName = `Dr. ${consult.doctorId.firstName} ${consult.doctorId.lastName}`;
                        } else if (consult.doctorId.name) {
                          doctorName = consult.doctorId.name;
                        }
                      } else {
                        doctorName = 'Current Doctor';
                      }
                    } else if (consult.doctor) {
                      doctorName = typeof consult.doctor === 'string' ? consult.doctor : `Dr. ${consult.doctor.name || 'Unknown'}`;
                    }
                    
                    const diagnosis = consult.diagnosis && consult.diagnosis.trim() !== '' ? consult.diagnosis : 'No diagnosis recorded';
                    const date = consult.consultationDate || consult.date || consult.createdAt || consult.updatedAt;
                    const medications = consult.medications || [];
                    const advice = consult.advice || '';
                    const investigations = consult.investigations || [];
                    
                    return (
                      <div key={consult._id || consult.id || idx} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm sm:text-base font-semibold text-slate-900">{diagnosis}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(date)}</p>
                            <p className="mt-1 text-xs text-slate-600">{doctorName}</p>
                            
                            {advice && advice.trim() !== '' && (
                              <div className="mt-2 rounded bg-blue-50 border border-blue-200 p-2">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Advice</p>
                                <p className="text-xs text-blue-800">{advice}</p>
                              </div>
                            )}
                            
                            {medications.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-slate-700 mb-1">Medications ({medications.length})</p>
                                <div className="flex flex-wrap gap-1">
                                  {medications.map((med, medIdx) => {
                                    const medName = typeof med === 'string' ? med : med.name || 'Unknown';
                                    return (
                                      <span key={medIdx} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                        {medName}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {investigations.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-slate-700 mb-1">Investigations ({investigations.length})</p>
                                <div className="flex flex-wrap gap-1">
                                  {investigations.map((inv, invIdx) => {
                                    const invName = typeof inv === 'string' ? inv : inv.name || inv.testName || 'Unknown';
                                    return (
                                      <span key={invIdx} className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                        {invName}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                }
                
                return <p className="text-sm text-slate-500">No previous consultations</p>;
              })()}
            </div>
          </div>

          {/* Lab Reports */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Lab Reports
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sharedLabReports && sharedLabReports.length > 0 && sharedLabReports.map((report, idx) => (
                <div key={`shared-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-base text-slate-900 mb-1">{report.testName || report.reportName || 'Lab Report'}</p>
                      {report.result && <p className="text-sm text-slate-700 mb-1">{report.result}</p>}
                      {report.date && <p className="text-xs text-slate-600 mb-2">{formatDate(report.date)}</p>}
                      {report.status && (
                        <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          report.status === 'Normal' || report.status === 'ready' || report.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {report.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleViewLabReport(report); }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <IoEyeOutline className="h-3.5 w-3.5" /><span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDownloadLabReport(report); }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52]"
                    >
                      <IoDownloadOutline className="h-3.5 w-3.5" /><span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {patientHistory.labReports && Array.isArray(patientHistory.labReports) && patientHistory.labReports.length > 0 ? (
                patientHistory.labReports.map((report, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-base text-slate-900 mb-1">{report.testName}</p>
                        {report.result && <p className="text-sm text-slate-700 mb-1">{report.result}</p>}
                        {report.date && <p className="text-xs text-slate-600 mb-2">{formatDate(report.date)}</p>}
                        {report.status && (
                          <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            report.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {report.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleViewLabReport(report)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <IoEyeOutline className="h-3.5 w-3.5" /><span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadLabReport(report)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52]"
                      >
                        <IoDownloadOutline className="h-3.5 w-3.5" /><span>Download</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : null}
              
              {(!sharedLabReports || sharedLabReports.length === 0) && (!patientHistory.labReports || patientHistory.labReports.length === 0) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                  <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">No lab reports available</p>
                  <p className="text-xs text-slate-500 mt-1">Patient can share lab reports with you</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <IoMedicalOutline className="mx-auto h-16 w-16 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">No medical history available</p>
          <p className="mt-1 text-xs text-slate-500">This appears to be the patient's first visit</p>
        </div>
      )}
    </div>
  );
};

export default PatientHistoryTab;
