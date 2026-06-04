/**
 * Script to Add 70 Tests to Specific Laboratory
 * 
 * This script finds a laboratory by phone number (7999267233) and adds 70 tests to it
 * 
 * Run with: node backend/scripts/addTestsToSpecificLab.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const Laboratory = require('../models/Laboratory');
const Test = require('../models/Test');

// 70 Comprehensive Test Data - Only required fields (name, price) and optional fields
const testData = [
  // Hematology Tests (10 tests)
  { name: 'Complete Blood Count (CBC)', price: 300, category: 'Hematology', description: 'Complete blood count test including RBC, WBC, platelets, hemoglobin', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Hemoglobin (Hb)', price: 150, category: 'Hematology', description: 'Hemoglobin level test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Platelet Count', price: 200, category: 'Hematology', description: 'Platelet count test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'ESR (Erythrocyte Sedimentation Rate)', price: 100, category: 'Hematology', description: 'ESR test for inflammation', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Blood Group & Rh Factor', price: 150, category: 'Hematology', description: 'Blood group and Rh factor test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'WBC Differential Count', price: 250, category: 'Hematology', description: 'White blood cell differential count', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'RBC Count', price: 150, category: 'Hematology', description: 'Red blood cell count', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'PCV (Packed Cell Volume)', price: 150, category: 'Hematology', description: 'Hematocrit test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'MCV, MCH, MCHC', price: 200, category: 'Hematology', description: 'Red cell indices', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Peripheral Smear', price: 200, category: 'Hematology', description: 'Blood smear examination', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  
  // Biochemistry Tests (15 tests)
  { name: 'Blood Sugar (Fasting)', price: 150, category: 'Biochemistry', description: 'Fasting blood sugar test', preparationInstructions: '8-12 hours fasting required', reportTime: 'Same day' },
  { name: 'Blood Sugar (Post Prandial)', price: 150, category: 'Biochemistry', description: 'Post meal blood sugar test', preparationInstructions: '2 hours after meal', reportTime: 'Same day' },
  { name: 'HbA1c Test', price: 500, category: 'Biochemistry', description: 'Diabetes control test (3 months average)', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Lipid Profile', price: 400, category: 'Biochemistry', description: 'Complete cholesterol and lipid test', preparationInstructions: '12 hours fasting required', reportTime: 'Next day' },
  { name: 'Liver Function Test (LFT)', price: 500, category: 'Biochemistry', description: 'Complete liver function test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Kidney Function Test (KFT)', price: 450, category: 'Biochemistry', description: 'Complete kidney function test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Uric Acid', price: 200, category: 'Biochemistry', description: 'Uric acid level test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Creatinine', price: 200, category: 'Biochemistry', description: 'Creatinine level test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'BUN (Blood Urea Nitrogen)', price: 200, category: 'Biochemistry', description: 'BUN test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Serum Bilirubin', price: 250, category: 'Biochemistry', description: 'Bilirubin level test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'SGOT (AST)', price: 200, category: 'Biochemistry', description: 'Aspartate aminotransferase test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'SGPT (ALT)', price: 200, category: 'Biochemistry', description: 'Alanine aminotransferase test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Alkaline Phosphatase', price: 250, category: 'Biochemistry', description: 'ALP level test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Total Protein', price: 200, category: 'Biochemistry', description: 'Total protein test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Albumin', price: 200, category: 'Biochemistry', description: 'Albumin level test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  
  // Hormone Tests (10 tests)
  { name: 'Thyroid Function Test (TFT)', price: 600, category: 'Hormone', description: 'Complete thyroid hormone test (T3, T4, TSH)', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'TSH (Thyroid Stimulating Hormone)', price: 300, category: 'Hormone', description: 'TSH test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'T3 (Triiodothyronine)', price: 300, category: 'Hormone', description: 'T3 hormone test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'T4 (Thyroxine)', price: 300, category: 'Hormone', description: 'T4 hormone test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Testosterone', price: 500, category: 'Hormone', description: 'Testosterone level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Cortisol', price: 500, category: 'Hormone', description: 'Cortisol level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Prolactin', price: 400, category: 'Hormone', description: 'Prolactin level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'FSH (Follicle Stimulating Hormone)', price: 400, category: 'Hormone', description: 'FSH test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'LH (Luteinizing Hormone)', price: 400, category: 'Hormone', description: 'LH test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Estradiol', price: 500, category: 'Hormone', description: 'Estradiol level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Vitamin Tests (5 tests)
  { name: 'Vitamin D Test', price: 800, category: 'Vitamins', description: 'Vitamin D (25-OH) level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin B12 Test', price: 700, category: 'Vitamins', description: 'Vitamin B12 level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin B9 (Folic Acid)', price: 600, category: 'Vitamins', description: 'Folic acid level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin C', price: 500, category: 'Vitamins', description: 'Vitamin C level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Vitamin A', price: 600, category: 'Vitamins', description: 'Vitamin A level test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Cardiology Tests (5 tests)
  { name: 'ECG (Electrocardiogram)', price: 200, category: 'Cardiology', description: 'ECG test for heart function', preparationInstructions: 'No special preparation', reportTime: 'Immediate' },
  { name: 'Echocardiography', price: 1500, category: 'Cardiology', description: 'Echo test for heart structure', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Treadmill Test (TMT)', price: 2000, category: 'Cardiology', description: 'Stress test for heart', preparationInstructions: 'Fasting required, wear comfortable clothes', reportTime: 'Same day' },
  { name: 'Holter Monitoring', price: 2500, category: 'Cardiology', description: '24-hour heart monitoring', preparationInstructions: 'No special preparation', reportTime: 'After 24 hours' },
  { name: 'Stress Echo', price: 3000, category: 'Cardiology', description: 'Stress echocardiography', preparationInstructions: 'Fasting required', reportTime: 'Same day' },
  
  // Radiology Tests (10 tests)
  { name: 'Chest X-Ray', price: 400, category: 'Radiology', description: 'Chest X-Ray test', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'X-Ray Abdomen', price: 400, category: 'Radiology', description: 'Abdominal X-Ray', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'X-Ray Spine', price: 500, category: 'Radiology', description: 'Spine X-Ray', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'X-Ray Limb', price: 300, category: 'Radiology', description: 'Limb X-Ray', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
  { name: 'Ultrasound Abdomen', price: 800, category: 'Radiology', description: 'Abdominal ultrasound', preparationInstructions: '6-8 hours fasting required', reportTime: 'Same day' },
  { name: 'Ultrasound Pelvis', price: 800, category: 'Radiology', description: 'Pelvic ultrasound', preparationInstructions: 'Full bladder required', reportTime: 'Same day' },
  { name: 'Ultrasound Whole Abdomen', price: 1000, category: 'Radiology', description: 'Complete abdominal ultrasound', preparationInstructions: '6-8 hours fasting required', reportTime: 'Same day' },
  { name: 'CT Scan Head', price: 3000, category: 'Radiology', description: 'CT scan of head', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'CT Scan Chest', price: 3500, category: 'Radiology', description: 'CT scan of chest', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'MRI Brain', price: 5000, category: 'Radiology', description: 'MRI of brain', preparationInstructions: 'No metal objects', reportTime: 'Next day' },
  
  // Infectious Disease Tests (8 tests)
  { name: 'COVID-19 RT-PCR', price: 500, category: 'Infectious Disease', description: 'COVID-19 RT-PCR test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'COVID-19 Rapid Antigen', price: 300, category: 'Infectious Disease', description: 'COVID-19 rapid test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Dengue Test', price: 600, category: 'Infectious Disease', description: 'Dengue NS1 Antigen test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Malaria Test', price: 200, category: 'Infectious Disease', description: 'Malaria parasite test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Typhoid Test', price: 300, category: 'Infectious Disease', description: 'Typhoid Widal test', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
  { name: 'Hepatitis B Test', price: 400, category: 'Infectious Disease', description: 'Hepatitis B surface antigen test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'Hepatitis C Test', price: 400, category: 'Infectious Disease', description: 'Hepatitis C antibody test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'HIV Test', price: 500, category: 'Infectious Disease', description: 'HIV 1 & 2 antibody test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Tumor Marker Tests (5 tests)
  { name: 'PSA (Prostate Specific Antigen)', price: 600, category: 'Tumor Markers', description: 'PSA test for prostate cancer screening', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'CA 125', price: 800, category: 'Tumor Markers', description: 'CA 125 tumor marker test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'CA 19-9', price: 800, category: 'Tumor Markers', description: 'CA 19-9 tumor marker test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'CEA (Carcinoembryonic Antigen)', price: 700, category: 'Tumor Markers', description: 'CEA tumor marker test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  { name: 'AFP (Alpha Fetoprotein)', price: 600, category: 'Tumor Markers', description: 'AFP tumor marker test', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
  
  // Other Tests (2 tests)
  { name: 'Urine Routine & Microscopy', price: 150, category: 'Other', description: 'Complete urine analysis', preparationInstructions: 'First morning urine sample', reportTime: 'Same day' },
  { name: 'Stool Routine', price: 200, category: 'Other', description: 'Stool analysis', preparationInstructions: 'Fresh stool sample', reportTime: 'Same day' },
];

// Main function to add tests
const addTestsToSpecificLab = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Find laboratory with phone number 7999267233
    const phoneNumber = '7999267233';
    const phoneVariations = [
      phoneNumber,
      `+91-${phoneNumber}`,
      `+91${phoneNumber}`,
      `91${phoneNumber}`,
      `0${phoneNumber}`,
    ];
    
    
    
    const laboratory = await Laboratory.findOne({
      $or: phoneVariations.map(phone => ({ phone }))
    });
    
    if (!laboratory) {
      
      
      process.exit(1);
    }
    
    
    
    
    
    
    // Add tests to laboratory
    
    
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const testInfo of testData) {
      try {
        // Check if test already exists for this lab
        const existingTest = await Test.findOne({
          laboratoryId: laboratory._id,
          name: testInfo.name,
        });
        
        if (existingTest) {
          
          skippedCount++;
          continue;
        }
        
        // Create new test with only required fields (name, price) and optional fields
        const test = await Test.create({
          laboratoryId: laboratory._id,
          name: testInfo.name,
          price: testInfo.price,
          description: testInfo.description || undefined,
          category: testInfo.category || undefined,
          preparationInstructions: testInfo.preparationInstructions || undefined,
          reportTime: testInfo.reportTime || undefined,
          isActive: true,
        });
        
        
        addedCount++;
      } catch (error) {
        console.error(`❌ Error creating test "${testInfo.name}":`, error.message);
        errorCount++;
      }
    }
    
    
    
    
    
    
    
    // Get final count of tests for this lab
    const finalTestCount = await Test.countDocuments({
      laboratoryId: laboratory._id,
      isActive: true,
    });
    
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in script:', error);
    process.exit(1);
  }
};

// Run the script
addTestsToSpecificLab();

