const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorPatients.jsx');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split(/\r?\n/);

const extractComponent = (startPattern, endPatternStr, propsString, componentName, destPath) => {
    const startIndex = lines.findIndex(l => l.includes(startPattern));
    let endIndex = -1;

    if (startIndex !== -1) {
        // Find the matching end tag after the start index
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
import {
  IoCloseOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5'

const ${componentName} = (props) => {
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

// 1. Extract Medical History Modal
extractComponent(
    "{/* Medical History Modal */}",
    "      )}",
    `      <MedicalHistoryModal 
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        selectedPatient={selectedPatient}
        medicalHistory={medicalHistory}
        formatDate={formatDate}
      />`,
    'MedicalHistoryModal',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'patients', 'MedicalHistoryModal.jsx')
);

// 2. Extract Cancel Session Modal
extractComponent(
    "{/* Cancel Session Modal */}",
    "      )}",
    `      <CancelSessionModal
        showCancelSessionModal={showCancelSessionModal}
        setShowCancelSessionModal={setShowCancelSessionModal}
        currentSession={currentSession}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        handleCancelSession={handleCancelSession}
        formatDate={formatDate}
      />`,
    'CancelSessionModal',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'patients', 'CancelSessionModal.jsx')
);

// Add imports
const finalLines = [];
let importsAdded = false;
for (const line of lines) {
    if (line.includes("import { useToast }") && !importsAdded) {
        finalLines.push(line);
        finalLines.push("import MedicalHistoryModal from '../doctor-components/patients/MedicalHistoryModal'");
        finalLines.push("import CancelSessionModal from '../doctor-components/patients/CancelSessionModal'");
        importsAdded = true;
    } else {
        finalLines.push(line);
    }
}

fs.writeFileSync(filePath, finalLines.join('\n'));
console.log("Extraction complete for DoctorPatients.jsx modals!");
