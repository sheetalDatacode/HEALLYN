const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorProfile.jsx');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split(/\r?\n/);

const extractComponent = () => {
    const startPattern = "{/* KYC & Verification */}";
    const startIndex = lines.findIndex(l => l.includes(startPattern));

    // Support history component starts here
    const supportHistoryStart = lines.findIndex(l => l.includes('// Support History Component'));
    
    // We want the lines from KYC & Verification all the way to the end of the section grid
    const sectionEndIndex = lines.findIndex(l => l.trim() === '</section>');
    const endIndex = sectionEndIndex - 3; // "</div></div></section>" structure

    if (startIndex === -1 || endIndex === -1 || supportHistoryStart === -1) {
        console.error("Could not find boundaries!");
        return null;
    }

    const componentLines = lines.slice(startIndex, endIndex + 1);
    const supportHistoryLines = lines.slice(supportHistoryStart);

    // Remove the export default DoctorProfile from the end of supportHistoryLines
    const cleanSupportHistoryLines = supportHistoryLines.filter(l => !l.includes('export default DoctorProfile'));

    const newComponent = `import React, { useState, useEffect } from 'react'
import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoShieldCheckmarkOutline,
  IoImageOutline,
  IoTrashOutline,
  IoDocumentTextOutline,
  IoEyeOutline,
  IoDownloadOutline
} from 'react-icons/io5'

const VerificationAndDocuments = (props) => {
  const {
    activeSection,
    setActiveSection,
    isEditing,
    formData,
    formatDate,
    handleSignatureUpload,
    handleRemoveSignature,
    normalizeImageUrl,
    getSupportHistory,
    useToast
  } = props;

  return (
    <>
${componentLines.join('\n')}
    </>
  );
};

${cleanSupportHistoryLines.join('\n')}

export default VerificationAndDocuments;
`;

    const destPath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'profile', 'VerificationAndDocuments.jsx');
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destPath, newComponent);
    
    const propsString = `            <VerificationAndDocuments
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              formatDate={formatDate}
              handleSignatureUpload={handleSignatureUpload}
              handleRemoveSignature={handleRemoveSignature}
              normalizeImageUrl={normalizeImageUrl}
              getSupportHistory={getSupportHistory}
              useToast={useToast}
            />`;

    let newLines = [
        ...lines.slice(0, startIndex),
        propsString,
        ...lines.slice(endIndex + 1, supportHistoryStart)
    ];
    
    // Make sure we put the export default DoctorProfile back
    newLines.push('export default DoctorProfile');

    console.log(`Successfully extracted VerificationAndDocuments!`);
    return newLines;
};

let finalLines = extractComponent();

if (finalLines) {
    const linesWithImports = [];
    let importsAdded = false;
    for (const line of finalLines) {
        if (line.includes("import SessionsAndTimings") && !importsAdded) {
            linesWithImports.push(line);
            linesWithImports.push("import VerificationAndDocuments from '../doctor-components/profile/VerificationAndDocuments'");
            importsAdded = true;
        } else {
            linesWithImports.push(line);
        }
    }
    fs.writeFileSync(filePath, linesWithImports.join('\n'));
}
