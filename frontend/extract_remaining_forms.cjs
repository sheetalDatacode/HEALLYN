const fs = require('fs');
const path = require('path');

const loginFilePath = path.join(__dirname, 'src', 'modules', 'doctor', 'doctor-pages', 'DoctorLogin.jsx');

let content = fs.readFileSync(loginFilePath, 'utf8');
let lines = content.split(/\r?\n/);

const extractForm = (moduleName, startPattern, endPatternStr, propsString, componentName, destPath) => {
    const startIndex = lines.findIndex(l => l.includes(startPattern));
    const endIndex = lines.findIndex(l => l.includes(endPatternStr));

    if (startIndex === -1 || endIndex === -1) {
        console.error(`Could not find boundaries for ${componentName}. Start: ${startIndex}, End: ${endIndex}`);
        return;
    }

    const formLines = lines.slice(startIndex + 1, endIndex);

    const newComponent = `import { motion } from 'framer-motion'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoAddOutline,
  IoMedicalOutline,
  IoLanguageOutline,
  IoVideocamOutline,
  IoCloseOutline,
  IoBriefcaseOutline,
  IoSchoolOutline
} from 'react-icons/io5'

const ${componentName} = ({
  signupStep,
  totalSignupSteps,
  handleModeChange,
  isSubmitting,
  handlePreviousStep,
  handleNextStep,
  handleDocumentUpload,
  ...props
}) => {
  const {
    ${moduleName}SignupData,
    handle${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}SignupSubmit,
    handle${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}SignupChange,
    addOperatingHour,
    removeOperatingHour,
    handleOperatingHourChange
  } = props;

  return (
${formLines.join('\n')}
  );
};

export default ${componentName};
`;

    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destPath, newComponent);

    // Replace in lines
    lines = [
        ...lines.slice(0, startIndex + 1),
        propsString,
        ...lines.slice(endIndex)
    ];

    console.log(`Successfully extracted ${componentName}!`);
};

// 1. Pharmacy
extractForm(
    'pharmacy',
    "            ) : selectedModule === 'pharmacy' ? (",
    "            ) : selectedModule === 'laboratory' ? (",
    `              <PharmacySignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handlePharmacySignupSubmit={handlePharmacySignupSubmit}
                pharmacySignupData={pharmacySignupData}
                handlePharmacySignupChange={handlePharmacySignupChange}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
                addOperatingHour={addOperatingHour}
                removeOperatingHour={removeOperatingHour}
                handleOperatingHourChange={handleOperatingHourChange}
              />`,
    'PharmacySignupForm',
    path.join(__dirname, 'src', 'modules', 'pharmacy', 'pharmacy-components', 'login', 'PharmacySignupForm.jsx')
);

// 2. Laboratory
extractForm(
    'laboratory',
    "            ) : selectedModule === 'laboratory' ? (",
    "            ) : selectedModule === 'nurse' ? (",
    `              <LaboratorySignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handleLaboratorySignupSubmit={handleLaboratorySignupSubmit}
                laboratorySignupData={laboratorySignupData}
                handleLaboratorySignupChange={handleLaboratorySignupChange}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
              />`,
    'LaboratorySignupForm',
    path.join(__dirname, 'src', 'modules', 'laboratory', 'laboratory-components', 'login', 'LaboratorySignupForm.jsx')
);

// 3. Nurse
extractForm(
    'nurse',
    "            ) : selectedModule === 'nurse' ? (",
    "            ) : null}",
    `              <NurseSignupForm
                signupStep={signupStep}
                totalSignupSteps={totalSignupSteps}
                handleNurseSignupSubmit={handleNurseSignupSubmit}
                nurseSignupData={nurseSignupData}
                handleNurseSignupChange={handleNurseSignupChange}
                handleDocumentUpload={handleDocumentUpload}
                isSubmitting={isSubmitting}
                handlePreviousStep={handlePreviousStep}
                handleNextStep={handleNextStep}
                handleModeChange={handleModeChange}
              />`,
    'NurseSignupForm',
    path.join(__dirname, 'src', 'modules', 'nurse', 'nurse-components', 'login', 'NurseSignupForm.jsx')
);

// Add imports
const finalLines = [];
let importsAdded = false;
for (const line of lines) {
    if (line.includes("import DoctorSignupForm") && !importsAdded) {
        finalLines.push(line);
        finalLines.push("import PharmacySignupForm from '../../pharmacy/pharmacy-components/login/PharmacySignupForm'");
        finalLines.push("import LaboratorySignupForm from '../../laboratory/laboratory-components/login/LaboratorySignupForm'");
        finalLines.push("import NurseSignupForm from '../../nurse/nurse-components/login/NurseSignupForm'");
        importsAdded = true;
    } else {
        finalLines.push(line);
    }
}

fs.writeFileSync(loginFilePath, finalLines.join('\n'));
console.log("All remaining forms extracted successfully!");
