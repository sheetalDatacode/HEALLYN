const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorConsultations.jsx');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

const startPattern = "{activeTab === 'prescription' && (";
const endPattern = "{/* History Tab */}";

const startIndex = lines.findIndex(l => l.includes(startPattern));
const endIndex = lines.findIndex(l => l.includes(endPattern));

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries.");
    process.exit(1);
}

const propsString = `                {activeTab === 'prescription' && (
                  <PrescriptionTab
                    sharedLabReports={sharedLabReports}
                    setSelectedReport={setSelectedReport}
                    setShowReportViewer={setShowReportViewer}
                    handleViewLabReport={handleViewLabReport}
                    handleDownloadLabReport={handleDownloadLabReport}
                    selectedConsultation={selectedConsultation}
                    formatDate={formatDate}
                    doctorInfo={doctorInfo}
                    diagnosis={diagnosis}
                    setDiagnosis={setDiagnosis}
                    symptoms={symptoms}
                    setSymptoms={setSymptoms}
                    medications={medications}
                    setShowAddMedication={setShowAddMedication}
                    handleRemoveMedication={handleRemoveMedication}
                    investigations={investigations}
                    setShowAddInvestigation={setShowAddInvestigation}
                    handleRemoveInvestigation={handleRemoveInvestigation}
                    advice={advice}
                    setAdvice={setAdvice}
                    followUpDate={followUpDate}
                    setFollowUpDate={setFollowUpDate}
                    handleSavePrescription={handleSavePrescription}
                    generatePDF={generatePDF}
                  />
                )}`;

// Replace in lines
lines = [
    ...lines.slice(0, startIndex),
    propsString,
    ...lines.slice(endIndex)
];

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Successfully integrated PrescriptionTab!");
