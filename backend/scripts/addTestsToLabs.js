/**
 * Script to Add Tests to Laboratories
 * 
 * This script finds laboratories by phone number and adds multiple tests to them
 * 
 * Run with: node backend/scripts/addTestsToLabs.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const Laboratory = require('../models/Laboratory');
const Test = require('../models/Test');

// Comprehensive test data
const testData = [
  // Hematology Tests
  { name: 'Complete Blood Count (CBC)', description: 'Complete blood count test including RBC, WBC, platelets, hemoglobin', price: 300, category: 'Hematology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Hemoglobin (Hb)', description: 'Hemoglobin level test', price: 150, category: 'Hematology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Platelet Count', description: 'Platelet count test', price: 200, category: 'Hematology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'ESR (Erythrocyte Sedimentation Rate)', description: 'ESR test for inflammation', price: 100, category: 'Hematology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Blood Group & Rh Factor', description: 'Blood group and Rh factor test', price: 150, category: 'Hematology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  
  // Biochemistry Tests
  { name: 'Blood Sugar (Fasting)', description: 'Fasting blood sugar test', price: 150, category: 'Biochemistry', preparationInstructions: '8-12 hours fasting required', reportTime: 'Same day' },
  { name: 'Blood Sugar (Post Prandial)', description: 'Post meal blood sugar test', price: 150, category: 'Biochemistry', preparationInstructions: '2 hours after meal', reportTime: 'Same day' },
  { name: 'HbA1c Test', description: 'Diabetes control test (3 months average)', price: 500, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Lipid Profile', description: 'Complete cholesterol and lipid test', price: 400, category: 'Biochemistry', preparationInstructions: '12 hours fasting required', reportTime: 'Next day' },
  { name: 'Liver Function Test (LFT)', description: 'Complete liver function test', price: 500, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Kidney Function Test (KFT)', description: 'Complete kidney function test', price: 450, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Uric Acid', description: 'Uric acid level test', price: 200, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Creatinine', description: 'Creatinine level test', price: 200, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'BUN (Blood Urea Nitrogen)', description: 'BUN test', price: 200, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  
  // Hormone Tests
  { name: 'Thyroid Function Test (TFT)', description: 'Complete thyroid hormone test (T3, T4, TSH)', price: 600, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'TSH (Thyroid Stimulating Hormone)', description: 'TSH test', price: 300, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'T3 (Triiodothyronine)', description: 'T3 hormone test', price: 300, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'T4 (Thyroxine)', description: 'T4 hormone test', price: 300, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Testosterone', description: 'Testosterone level test', price: 500, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Cortisol', description: 'Cortisol level test', price: 500, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Vitamin Tests
  { name: 'Vitamin D Test', description: 'Vitamin D (25-OH) level test', price: 800, category: 'Vitamins', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin B12 Test', description: 'Vitamin B12 level test', price: 700, category: 'Vitamins', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin B9 (Folic Acid)', description: 'Folic acid level test', price: 600, category: 'Vitamins', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin C', description: 'Vitamin C level test', price: 500, category: 'Vitamins', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Cardiology Tests
  { name: 'ECG (Electrocardiogram)', description: 'ECG test for heart function', price: 200, category: 'Cardiology', preparationInstructions: 'No special preparation', reportTime: 'Immediate' },
  { name: 'Echocardiography', description: 'Echo test for heart structure', price: 1500, category: 'Cardiology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Treadmill Test (TMT)', description: 'Stress test for heart', price: 2000, category: 'Cardiology', preparationInstructions: 'Fasting required, wear comfortable clothes', reportTime: 'Same day' },
  { name: 'Holter Monitoring', description: '24-hour heart monitoring', price: 2500, category: 'Cardiology', preparationInstructions: 'No special preparation', reportTime: 'After 24 hours' },
  
  // Radiology Tests
  { name: 'Chest X-Ray', description: 'Chest X-Ray test', price: 400, category: 'Radiology', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'X-Ray Abdomen', description: 'Abdominal X-Ray', price: 400, category: 'Radiology', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'X-Ray Spine', description: 'Spine X-Ray', price: 500, category: 'Radiology', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'X-Ray Limb', description: 'Limb X-Ray', price: 300, category: 'Radiology', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'Ultrasound Abdomen', description: 'Abdominal ultrasound', price: 800, category: 'Radiology', preparationInstructions: '6-8 hours fasting required', reportTime: 'Same day' },
  { name: 'Ultrasound Pelvis', description: 'Pelvic ultrasound', price: 800, category: 'Radiology', preparationInstructions: 'Full bladder required', reportTime: 'Same day' },
  { name: 'Ultrasound Whole Abdomen', description: 'Complete abdominal ultrasound', price: 1000, category: 'Radiology', preparationInstructions: '6-8 hours fasting required', reportTime: 'Same day' },
  { name: 'CT Scan Head', description: 'CT scan of head', price: 3000, category: 'Radiology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'CT Scan Chest', description: 'CT scan of chest', price: 3500, category: 'Radiology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'MRI Brain', description: 'MRI of brain', price: 5000, category: 'Radiology', preparationInstructions: 'No metal objects', reportTime: 'Next day' },
  
  // Infectious Disease Tests
  { name: 'COVID-19 RT-PCR', description: 'COVID-19 RT-PCR test', price: 500, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'COVID-19 Rapid Antigen', description: 'COVID-19 rapid test', price: 300, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Dengue Test', description: 'Dengue NS1 Antigen test', price: 600, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Malaria Test', description: 'Malaria parasite test', price: 200, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Typhoid Test', description: 'Typhoid Widal test', price: 300, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Hepatitis B Test', description: 'Hepatitis B surface antigen test', price: 400, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Hepatitis C Test', description: 'Hepatitis C antibody test', price: 400, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'HIV Test', description: 'HIV 1 & 2 antibody test', price: 500, category: 'Infectious Disease', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Tumor Marker Tests
  { name: 'PSA (Prostate Specific Antigen)', description: 'PSA test for prostate cancer screening', price: 600, category: 'Tumor Markers', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'CA 125', description: 'CA 125 tumor marker test', price: 800, category: 'Tumor Markers', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'CA 19-9', description: 'CA 19-9 tumor marker test', price: 800, category: 'Tumor Markers', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'CEA (Carcinoembryonic Antigen)', description: 'CEA tumor marker test', price: 700, category: 'Tumor Markers', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Other Tests
  { name: 'Urine Routine & Microscopy', description: 'Complete urine analysis', price: 150, category: 'Other', preparationInstructions: 'First morning urine sample', reportTime: 'Same day' },
  { name: 'Stool Routine', description: 'Stool analysis', price: 200, category: 'Other', preparationInstructions: 'Fresh stool sample', reportTime: 'Same day' },
  { name: 'Semen Analysis', description: 'Semen analysis test', price: 500, category: 'Other', preparationInstructions: '3-5 days abstinence required', reportTime: 'Next day' },
  { name: 'Pap Smear', description: 'Cervical cancer screening', price: 600, category: 'Other', preparationInstructions: 'No preparation needed', reportTime: 'Next day' },
];

// Main function to add tests
const addTestsToLabs = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Find laboratories with phone number 7724817688
    const phoneNumber = '7724817688';
    const phoneVariations = [
      phoneNumber,
      `+91-${phoneNumber}`,
      `+91${phoneNumber}`,
      `91${phoneNumber}`,
      `0${phoneNumber}`,
    ];
    
    
    
    const laboratories = await Laboratory.find({
      $or: phoneVariations.map(phone => ({ phone }))
    });
    
    if (laboratories.length === 0) {
      
      
      
      // If no labs found with that phone, get all approved labs
      const allLabs = await Laboratory.find({ status: 'approved', isActive: true }).limit(10);
      if (allLabs.length === 0) {
        
        process.exit(1);
      }
      
      
      
      // Add tests to all approved labs
      for (const lab of allLabs) {
        await addTestsToLab(lab);
      }
    } else {
      
      laboratories.forEach((lab, index) => {
        
      });
      
      
      // Add tests to each laboratory
      for (const lab of laboratories) {
        await addTestsToLab(lab);
      }
    }
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding tests to laboratories:', error);
    process.exit(1);
  }
};

// Function to add tests to a specific laboratory
const addTestsToLab = async (lab) => {
  try {
    
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const testInfo of testData) {
      // Check if test already exists for this lab
      const existingTest = await Test.findOne({
        laboratoryId: lab._id,
        name: testInfo.name,
      });
      
      if (existingTest) {
        
        skippedCount++;
        continue;
      }
      
      // Create new test
      const test = await Test.create({
        laboratoryId: lab._id,
        ...testInfo,
        isActive: true,
      });
      
      
      addedCount++;
    }
    
    
    
    
    
  } catch (error) {
    console.error(`❌ Error adding tests to ${lab.labName}:`, error.message);
  }
};

// Run the script
addTestsToLabs();

