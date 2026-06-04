const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorPatients.jsx');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split(/\r?\n/);

const extractComponent = (startPattern, endPatternStr, propsString, componentName, destPath, imports) => {
    const startIndex = lines.findIndex(l => l.includes(startPattern));
    let endIndex = -1;

    if (startIndex !== -1) {
        // We'll search for the first line that exactly matches endPatternStr
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i] === endPatternStr) {
                endIndex = i;
                break;
            }
        }
    }

    if (startIndex === -1 || endIndex === -1) {
        console.error(`Could not find boundaries for ${componentName}. Start: ${startIndex}, End: ${endIndex}`);
        return;
    }

    const componentLines = lines.slice(startIndex, endIndex + 1);

    const newComponent = `import React from 'react'
${imports}

const ${componentName} = (props) => {
  const {
    currentSession,
    getSessionStatusColor,
    getSessionStatusText,
    getAverageConsultationMinutes,
    appointments,
    handleStartSession,
    handleEndSession,
    setShowCancelSessionModal,
    loadingSession,
    filteredAppointments,
    formatTime,
    getAppointmentButtons,
    handleCallNext,
    handleVideoCall,
    handleAudioCall,
    handleRecall,
    handleSkip,
    handleNoShow,
    handleComplete,
    handleViewHistory
  } = props;

  return (
    <>
${componentLines.join('\n')}
    </>
  );
};

export default ${componentName};
`;

    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destPath, newComponent);

    lines = [
        ...lines.slice(0, startIndex),
        propsString,
        ...lines.slice(endIndex + 1)
    ];

    console.log(`Successfully extracted ${componentName}!`);
};

// 1. Extract SessionStatusCard
extractComponent(
    "{/* Session Status Card */}",
    "          </div>",
    `          <SessionStatusCard
            currentSession={currentSession}
            getSessionStatusColor={getSessionStatusColor}
            getSessionStatusText={getSessionStatusText}
            getAverageConsultationMinutes={getAverageConsultationMinutes}
            appointments={appointments}
            handleStartSession={handleStartSession}
            handleEndSession={handleEndSession}
            setShowCancelSessionModal={setShowCancelSessionModal}
            loadingSession={loadingSession}
          />`,
    'SessionStatusCard',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'patients', 'SessionStatusCard.jsx'),
    `import {
  IoCalendarOutline,
  IoPlayOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline
} from 'react-icons/io5'`
);

// 2. Extract AppointmentQueue
extractComponent(
    "{/* Appointment Queue */}",
    "          </div>",
    `          <AppointmentQueue
            currentSession={currentSession}
            loadingSession={loadingSession}
            filteredAppointments={filteredAppointments}
            formatTime={formatTime}
            getAppointmentButtons={getAppointmentButtons}
            handleCallNext={handleCallNext}
            handleVideoCall={handleVideoCall}
            handleAudioCall={handleAudioCall}
            handleRecall={handleRecall}
            handleSkip={handleSkip}
            handleNoShow={handleNoShow}
            handleComplete={handleComplete}
            handleViewHistory={handleViewHistory}
          />`,
    'AppointmentQueue',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'patients', 'AppointmentQueue.jsx'),
    `import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoVideocamOutline,
  IoCallOutline,
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoDocumentTextOutline
} from 'react-icons/io5'`
);

// Add imports to DoctorPatients.jsx
const finalLines = [];
let importsAdded = false;
for (const line of lines) {
    if (line.includes("import CancelSessionModal") && !importsAdded) {
        finalLines.push(line);
        finalLines.push("import SessionStatusCard from '../doctor-components/patients/SessionStatusCard'");
        finalLines.push("import AppointmentQueue from '../doctor-components/patients/AppointmentQueue'");
        importsAdded = true;
    } else {
        finalLines.push(line);
    }
}

fs.writeFileSync(filePath, finalLines.join('\n'));
console.log("Extraction complete for SessionStatusCard and AppointmentQueue!");
