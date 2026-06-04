const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorProfile.jsx');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split(/\r?\n/);

const extractComponent = (startPattern, endPatternStr, propsString, componentName, destPath, imports) => {
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
${imports}

const ${componentName} = (props) => {
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

// 1. DoctorPersonalInformation
extractComponent(
    "{/* Doctor Personal Information */}",
    "            </div>",
    `            <DoctorPersonalInformation
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
            />`,
    'DoctorPersonalInformation',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'profile', 'DoctorPersonalInformation.jsx'),
    `import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoMailOutline,
  IoCallOutline
} from 'react-icons/io5'`
);

// 2. ProfessionalDetails
extractComponent(
    "{/* Professional Details */}",
    "            </div>",
    `            <ProfessionalDetails
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              handleArrayItemChange={handleArrayItemChange}
              handleArrayRemove={handleArrayRemove}
              handleArrayAdd={handleArrayAdd}
              languageInputRef={languageInputRef}
            />`,
    'ProfessionalDetails',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'profile', 'ProfessionalDetails.jsx'),
    `import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoTrashOutline,
  IoSchoolOutline,
  IoAddOutline,
  IoLanguageOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoVideocamOutline
} from 'react-icons/io5'`
);

// 3. ClinicInformation
extractComponent(
    "{/* Clinic Information */}",
    "            </div>",
    `            <ClinicInformation
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              formatAddress={formatAddress}
            />`,
    'ClinicInformation',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'profile', 'ClinicInformation.jsx'),
    `import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoLocationOutline
} from 'react-icons/io5'`
);

// 4. SessionsAndTimings
extractComponent(
    "{/* Sessions & Timings */}",
    "            </div>",
    `            <SessionsAndTimings
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              handleArrayItemChange={handleArrayItemChange}
              handleArrayRemove={handleArrayRemove}
              handleArrayAdd={handleArrayAdd}
              formatTimeTo12Hour={formatTimeTo12Hour}
            />`,
    'SessionsAndTimings',
    path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'profile', 'SessionsAndTimings.jsx'),
    `import {
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoCalendarOutline,
  IoAddOutline
} from 'react-icons/io5'`
);

// We will skip VerificationAndDocuments as a single extract for now because it encompasses multiple different blocks at the bottom of the right column that might not share the exact same enclosing </div> structure.

// Add imports to DoctorProfile.jsx
const finalLines = [];
let importsAdded = false;
for (const line of lines) {
    if (line.includes("import { useToast }") && !importsAdded) {
        finalLines.push(line);
        finalLines.push("import DoctorPersonalInformation from '../doctor-components/profile/DoctorPersonalInformation'");
        finalLines.push("import ProfessionalDetails from '../doctor-components/profile/ProfessionalDetails'");
        finalLines.push("import ClinicInformation from '../doctor-components/profile/ClinicInformation'");
        finalLines.push("import SessionsAndTimings from '../doctor-components/profile/SessionsAndTimings'");
        importsAdded = true;
    } else {
        finalLines.push(line);
    }
}

fs.writeFileSync(filePath, finalLines.join('\n'));
console.log("Extraction complete for DoctorProfile.jsx!");
