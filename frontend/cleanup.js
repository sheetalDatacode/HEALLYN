import fs from 'fs';

const filesToDelete = [
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\doctor\\doctor-components\\DoctorHeader.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\doctor\\doctor-components\\DoctorFooter.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\doctor\\doctor-components\\DoctorNavbar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\doctor\\doctor-components\\DoctorSidebar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\doctor\\doctor-components\\DoctorSidebarContext.jsx',

  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\nurse\\nurse-components\\NurseHeader.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\nurse\\nurse-components\\NurseFooter.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\nurse\\nurse-components\\NurseNavbar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\nurse\\nurse-components\\NurseSidebar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\nurse\\nurse-components\\NurseSidebarContext.jsx',

  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\laboratory\\laboratory-components\\LaboratoryHeader.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\laboratory\\laboratory-components\\LaboratoryFooter.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\laboratory\\laboratory-components\\LaboratoryNavbar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\laboratory\\laboratory-components\\LaboratorySidebar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\laboratory\\laboratory-components\\LaboratorySidebarContext.jsx',

  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\pharmacy\\pharmacy-components\\PharmacyNavbar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\pharmacy\\pharmacy-components\\PharmacySidebar.jsx',
  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\pharmacy\\pharmacy-components\\PharmacySidebarContext.jsx',

  'c:\\Users\\HP\\Desktop\\appzeto_first\\HEALLYN\\frontend\\src\\modules\\patient\\patient-components\\PatientFooter.jsx'
];

filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted: ${file}`);
    }
  } catch (err) {
    console.error(`Error deleting ${file}:`, err);
  }
});
