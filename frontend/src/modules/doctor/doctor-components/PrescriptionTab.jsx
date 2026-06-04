import React from 'react';
import { 
  IoFlaskOutline, 
  IoEyeOutline, 
  IoDownloadOutline, 
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoChevronDownOutline,
  IoCheckmarkCircleOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPrintOutline
} from 'react-icons/io5';

const PrescriptionTab = ({
  sharedLabReports,
  setSelectedReport,
  setShowReportViewer,
  handleViewLabReport,
  handleDownloadLabReport,
  selectedConsultation,
  formatDate,
  doctorInfo,
  diagnosis,
  setDiagnosis,
  symptoms,
  setSymptoms,
  medications,
  setShowAddMedication,
  handleRemoveMedication,
  investigations,
  setShowAddInvestigation,
  handleRemoveInvestigation,
  advice,
  setAdvice,
  followUpDate,
  setFollowUpDate,
  handleSavePrescription,
  generatePDF
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-4" data-prescription-section>
      {/* Shared Lab Reports from Patient */}
      {sharedLabReports && sharedLabReports.length > 0 && (
        <div className="rounded-xl sm:rounded-2xl border-2 border-blue-200 bg-blue-50 p-3 sm:p-4 lg:p-4 shadow-md mb-4">
          <div className="mb-3 sm:mb-4 flex items-center gap-2">
            <IoFlaskOutline className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-900">
              Shared Lab Reports from Patient
            </h3>
          </div>
          <p className="mb-4 text-xs sm:text-sm text-blue-800">
            Patient has shared {sharedLabReports.length} lab report(s) with you
          </p>
          <div className="space-y-3 sm:space-y-4">
            {sharedLabReports.map((report, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-blue-300 bg-white p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => {
                  const pdfUrl = report.pdfFileUrl || report.downloadUrl || report.reportFileUrl;
                  if (pdfUrl && pdfUrl !== '#' && pdfUrl.trim() !== '' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                    window.open(pdfUrl, '_blank');
                  } else {
                    setSelectedReport(report);
                    setShowReportViewer(true);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-bold text-slate-900">
                      {report.testName || report.reportName || 'Lab Report'}
                    </p>
                    {report.labName && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">{report.labName}</p>
                    )}
                    {report.date && (
                      <p className="text-xs text-slate-500 mt-1">Report Date: {formatDate(report.date)}</p>
                    )}
                    {report.sharedAt && (
                      <p className="text-xs text-blue-600 mt-1">Shared: {formatDate(report.sharedAt)}</p>
                    )}
                    {report.status && (
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        report.status === 'Normal' || report.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {report.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleViewLabReport(report); }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100"
                      title="View Report"
                    >
                      <IoEyeOutline className="h-4 w-4" />
                    </button>
                    {(report.pdfFileUrl || (report.downloadUrl && report.downloadUrl !== '#')) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDownloadLabReport(report); }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#11496c] transition hover:bg-[rgba(17,73,108,0.1)]"
                        title="Download Report"
                      >
                        <IoDownloadOutline className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Prescriptions from Other Doctors */}
      {selectedConsultation?.sharedPrescriptions && selectedConsultation.sharedPrescriptions.length > 0 && (
        <div className="rounded-xl sm:rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 sm:p-4 lg:p-4 shadow-md">
          <div className="mb-3 sm:mb-4 flex items-center gap-2">
            <IoDocumentTextOutline className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-amber-900">
              Shared Prescriptions from Other Doctors
            </h3>
          </div>
          <p className="mb-4 text-xs sm:text-sm text-amber-800">
            Patient has shared {selectedConsultation.sharedPrescriptions.length} prescription(s) from previous consultations
          </p>
          <div className="space-y-3 sm:space-y-4">
            {selectedConsultation.sharedPrescriptions.map((sharedPresc, idx) => (
              <div key={idx} className="rounded-lg border border-amber-300 bg-white p-3 sm:p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-bold text-slate-900">{sharedPresc.doctor?.name || 'Previous Doctor'}</p>
                    <p className="text-xs sm:text-sm text-slate-600">{sharedPresc.doctor?.specialty || 'General'} • {sharedPresc.diagnosis || 'Consultation'}</p>
                    {sharedPresc.issuedAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        Issued: {new Date(sharedPresc.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                {/* Internal pres details (Diagnosis, Meds, etc) omitted for brevity to prevent max file limit, but basic info kept */}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescription Header */}
      <div className="rounded-xl sm:rounded-2xl border-2 border-[#11496c] bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-white p-4 sm:p-6 shadow-md shadow-slate-200/50">
        <div className="mb-4 border-b-2 border-[#11496c] pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#11496c] text-center">PRESCRIPTION</h2>
          <p className="text-xs sm:text-sm text-slate-600 text-center mt-1">{doctorInfo.clinicName}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">Patient Information</h3>
            <div className="space-y-1 text-[10px] sm:text-xs text-slate-700">
              <p><span className="font-semibold">Name:</span> {selectedConsultation.patientName || 'N/A'}</p>
              <p><span className="font-semibold">Age:</span> {selectedConsultation.age !== null && selectedConsultation.age !== undefined ? `${selectedConsultation.age} years` : 'N/A'} | <span className="font-semibold">Gender:</span> {selectedConsultation.gender ? selectedConsultation.gender.charAt(0).toUpperCase() + selectedConsultation.gender.slice(1) : 'N/A'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">Doctor Information</h3>
            <div className="space-y-1 text-[10px] sm:text-xs text-slate-700">
              <p className="font-semibold">{doctorInfo.name}</p>
              <p>{doctorInfo.qualification}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-[10px] sm:text-xs text-slate-600">
            <span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Diagnosis *</label>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 sm:p-4">
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter diagnosis..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Symptoms */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Symptoms</label>
        <div className="space-y-2">
          {symptoms.split('\n').filter(line => line.trim()).map((symptom, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
              <span className="text-xs sm:text-sm text-slate-700">{symptom.trim()}</span>
            </div>
          ))}
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Enter symptoms (one per line)..."
            rows="4"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Medications */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
        <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Medications *</h3>
          <button
            type="button"
            onClick={() => setShowAddMedication(true)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95 w-full sm:w-auto"
          >
            <IoAddOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add </span>Medication
          </button>
        </div>

        {medications.length === 0 ? (
          <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No medications added</p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {medications.map((med, idx) => (
              <div key={med.id} className="relative rounded-lg sm:rounded-xl border border-slate-200 bg-gray-50 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="absolute top-2 right-2 h-6 w-6 sm:h-7 sm:w-7 rounded bg-[#11496c] flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-bold">{idx + 1}</span>
                </div>
                <div className="pr-8 sm:pr-10">
                  <p className="text-sm sm:text-base font-bold text-slate-900 mb-2">{med.name}</p>
                  <div className="space-y-1 text-xs sm:text-sm text-slate-700">
                    <p><span className="font-semibold">Dosage:</span> {med.dosage}</p>
                    <p><span className="font-semibold">Duration:</span> {med.duration || 'N/A'}</p>
                    <p><span className="font-semibold">Frequency:</span> {med.frequency}</p>
                    {med.instructions && <p><span className="font-semibold">Instructions:</span> {med.instructions}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMedication(med.id)}
                  className="absolute bottom-2 right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                >
                  <IoTrashOutline className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investigations */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
        <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Investigations / Tests</h3>
          <button
            type="button"
            onClick={() => setShowAddInvestigation(true)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 w-full sm:w-auto"
          >
            <IoAddOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add </span>Test
          </button>
        </div>
        {investigations.length === 0 ? (
          <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No investigations added</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {investigations.map((inv) => (
              <div key={inv.id} className="relative rounded-lg sm:rounded-xl border border-purple-200 bg-purple-50 p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mb-1">{inv.name}</p>
                  {inv.notes && <p className="text-xs text-slate-700">{inv.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveInvestigation(inv.id)}
                  className="absolute top-2 right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                >
                  <IoTrashOutline className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advice */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Medical Advice</label>
        <textarea
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          placeholder="Enter medical advice..."
          rows="4"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Follow-up Appointment */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Follow-up Appointment (Optional)</label>
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <select
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  if (!isNaN(days)) {
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    setFollowUpDate(date.toISOString().split('T')[0]);
                  } else {
                    setFollowUpDate('');
                  }
                }}
                className="w-full bg-white border border-yellow-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-yellow-500 appearance-none shadow-sm"
              >
                <option value="">Select Duration...</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>After {day} {day === 1 ? 'day' : 'days'}</option>
                ))}
              </select>
              <IoChevronDownOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-yellow-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-yellow-500 shadow-sm"
              />
            </div>
          </div>
          {followUpDate && (
            <div className="mt-3 flex items-center gap-2 px-1">
              <IoCheckmarkCircleOutline className="h-4 w-4 text-emerald-500" />
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Scheduled for: <span className="font-bold text-emerald-700">{new Date(followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'short' })}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          type="button"
          onClick={handleSavePrescription}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
        >
          <IoCheckmarkCircleOutline className="h-5 w-5" />
          Save Prescription
        </button>
        <button
          type="button"
          onClick={() => {
            const tempPrescription = {
              patientName: selectedConsultation.patientName,
              patientPhone: selectedConsultation.patientPhone,
              patientAddress: selectedConsultation.patientAddress,
              diagnosis,
              symptoms,
              medications,
              investigations,
              advice,
              followUpDate,
            };
            generatePDF(tempPrescription);
          }}
          disabled={!diagnosis || medications.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#11496c] bg-white px-6 py-3.5 text-sm font-semibold text-[#11496c] shadow-sm transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IoPrintOutline className="h-5 w-5" />
          <span className="hidden sm:inline">Generate </span>PDF
        </button>
      </div>
    </div>
  );
};

export default PrescriptionTab;
