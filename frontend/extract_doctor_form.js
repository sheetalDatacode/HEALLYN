const fs = require('fs');
const path = require('path');

const loginFilePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorLogin.jsx');
const newFormPath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-components', 'login', 'DoctorSignupForm.jsx');

let content = fs.readFileSync(loginFilePath, 'utf8');
const lines = content.split('\n');

// Find start and end
const startPattern = "            ) : selectedModule === 'doctor' ? (";
const endPattern = "            ) : selectedModule === 'pharmacy' ? (";

const startIndex = lines.findIndex(l => l.includes(startPattern));
const endIndex = lines.findIndex(l => l.includes(endPattern));

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries.");
    process.exit(1);
}

// Extract the form
const formLines = lines.slice(startIndex + 1, endIndex);

// Build the new component
const newComponent = `import { motion } from 'framer-motion'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoMedicalOutline,
  IoSchoolOutline,
  IoLanguageOutline,
  IoDocumentTextOutline,
  IoCloseOutline,
  IoAddOutline,
} from 'react-icons/io5'

const DoctorSignupForm = ({
  signupStep,
  totalSignupSteps,
  handleDoctorSignupSubmit,
  doctorSignupData,
  setDoctorSignupData,
  handleDoctorSignupChange,
  showSpecializationDropdown,
  setShowSpecializationDropdown,
  specializationDropdownRef,
  specializationSearchTerm,
  setSpecializationSearchTerm,
  availableSpecializations,
  filteredSpecializations,
  specializationInputRef,
  addEducationEntry,
  removeEducationEntry,
  removeLanguage,
  handleDocumentUpload,
  isSubmitting,
  handlePreviousStep,
  handleNextStep,
  handleModeChange,
}) => {
  return (
${formLines.join('\n')}
  );
};

export default DoctorSignupForm;
`;

// Create directory if it doesn't exist
const dir = path.dirname(newFormPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(newFormPath, newComponent);

// Build props string
const propsString = `              <DoctorSignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handleDoctorSignupSubmit={handleDoctorSignupSubmit}
                doctorSignupData={doctorSignupData}
                setDoctorSignupData={setDoctorSignupData}
                handleDoctorSignupChange={handleDoctorSignupChange}
                showSpecializationDropdown={showSpecializationDropdown}
                setShowSpecializationDropdown={setShowSpecializationDropdown}
                specializationDropdownRef={specializationDropdownRef}
                specializationSearchTerm={specializationSearchTerm}
                setSpecializationSearchTerm={setSpecializationSearchTerm}
                availableSpecializations={availableSpecializations}
                filteredSpecializations={filteredSpecializations}
                specializationInputRef={specializationInputRef}
                addEducationEntry={addEducationEntry}
                removeEducationEntry={removeEducationEntry}
                removeLanguage={removeLanguage}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
              />`;

// Replace in original file
const newLines = [
    ...lines.slice(0, startIndex + 1),
    propsString,
    ...lines.slice(endIndex)
];

// Ensure import is added at the top
const finalLines = [];
let imported = false;
for (const line of newLines) {
    if (line.includes("import LoginForm") && !imported) {
        finalLines.push(line);
        finalLines.push("import DoctorSignupForm from '../doctor-components/login/DoctorSignupForm'");
        imported = true;
    } else {
        finalLines.push(line);
    }
}

fs.writeFileSync(loginFilePath, finalLines.join('\n'));
console.log("Successfully extracted DoctorSignupForm!");
