/**
 * Script to Add Medicines to a Specific Pharmacy
 * 
 * This script adds medicines to a pharmacy identified by phone number
 * 
 * Run with: node backend/scripts/add-medicines-to-pharmacy.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

// Medicine data to add - 50 real Indian medicines with 40+ different types
const medicinesData = [
  // Analgesics & Antipyretics
  {
    name: 'Paracetamol',
    dosage: '500mg',
    quantity: 200,
    price: 2.50,
    manufacturer: 'Cipla Ltd',
    category: 'Analgesic',
    prescriptionRequired: false,
  },
  {
    name: 'Dolo 650',
    dosage: '650mg',
    quantity: 100,
    price: 3.00,
    manufacturer: 'Micro Labs',
    category: 'Analgesic',
    prescriptionRequired: false,
  },
  {
    name: 'Crocin Advance',
    dosage: '500mg',
    quantity: 150,
    price: 2.75,
    manufacturer: 'GSK',
    category: 'Analgesic',
    prescriptionRequired: false,
  },
  
  // NSAIDs
  {
    name: 'Ibuprofen',
    dosage: '400mg',
    quantity: 100,
    price: 3.00,
    manufacturer: 'Zydus Cadila',
    category: 'NSAID',
    prescriptionRequired: false,
  },
  {
    name: 'Diclofenac',
    dosage: '50mg',
    quantity: 30,
    price: 2.75,
    manufacturer: 'Novartis',
    category: 'NSAID',
    prescriptionRequired: false,
  },
  {
    name: 'Aceclofenac',
    dosage: '100mg',
    quantity: 30,
    price: 4.50,
    manufacturer: 'Intas Pharmaceuticals',
    category: 'NSAID',
    prescriptionRequired: false,
  },
  {
    name: 'Naproxen',
    dosage: '250mg',
    quantity: 30,
    price: 5.00,
    manufacturer: 'Cipla Ltd',
    category: 'NSAID',
    prescriptionRequired: false,
  },
  
  // Antibiotics
  {
    name: 'Amoxicillin',
    dosage: '250mg',
    quantity: 30,
    price: 5.00,
    manufacturer: 'Dr. Reddy\'s',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Amoxicillin',
    dosage: '500mg',
    quantity: 30,
    price: 8.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Azithromycin',
    dosage: '500mg',
    quantity: 6,
    price: 8.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Ciprofloxacin',
    dosage: '500mg',
    quantity: 10,
    price: 7.50,
    manufacturer: 'Ranbaxy',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Cefixime',
    dosage: '200mg',
    quantity: 10,
    price: 12.00,
    manufacturer: 'Lupin',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  {
    name: 'Doxycycline',
    dosage: '100mg',
    quantity: 10,
    price: 6.50,
    manufacturer: 'Sun Pharma',
    category: 'Antibiotic',
    prescriptionRequired: true,
  },
  
  // Antacids & PPIs
  {
    name: 'Omeprazole',
    dosage: '20mg',
    quantity: 30,
    price: 3.50,
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  {
    name: 'Pantoprazole',
    dosage: '40mg',
    quantity: 30,
    price: 4.00,
    manufacturer: 'Sun Pharma',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  {
    name: 'Rabeprazole',
    dosage: '20mg',
    quantity: 30,
    price: 4.50,
    manufacturer: 'Lupin',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  {
    name: 'Esomeprazole',
    dosage: '40mg',
    quantity: 30,
    price: 5.50,
    manufacturer: 'Dr. Reddy\'s',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  {
    name: 'Ranitidine',
    dosage: '150mg',
    quantity: 30,
    price: 2.00,
    manufacturer: 'Zydus Cadila',
    category: 'Antacid',
    prescriptionRequired: false,
  },
  
  // Antihistamines
  {
    name: 'Cetirizine',
    dosage: '10mg',
    quantity: 50,
    price: 1.75,
    manufacturer: 'Sun Pharma',
    category: 'Antihistamine',
    prescriptionRequired: false,
  },
  {
    name: 'Levocetirizine',
    dosage: '5mg',
    quantity: 30,
    price: 2.00,
    manufacturer: 'Dr. Reddy\'s',
    category: 'Antihistamine',
    prescriptionRequired: false,
  },
  {
    name: 'Fexofenadine',
    dosage: '120mg',
    quantity: 30,
    price: 3.50,
    manufacturer: 'Cipla Ltd',
    category: 'Antihistamine',
    prescriptionRequired: false,
  },
  {
    name: 'Loratadine',
    dosage: '10mg',
    quantity: 30,
    price: 2.25,
    manufacturer: 'Glenmark',
    category: 'Antihistamine',
    prescriptionRequired: false,
  },
  
  // Antihypertensives
  {
    name: 'Amlodipine',
    dosage: '5mg',
    quantity: 30,
    price: 3.75,
    manufacturer: 'Glenmark',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
  {
    name: 'Losartan',
    dosage: '50mg',
    quantity: 30,
    price: 3.25,
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
  {
    name: 'Telmisartan',
    dosage: '40mg',
    quantity: 30,
    price: 4.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
  {
    name: 'Metoprolol',
    dosage: '50mg',
    quantity: 30,
    price: 3.50,
    manufacturer: 'Sun Pharma',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
  {
    name: 'Atenolol',
    dosage: '50mg',
    quantity: 30,
    price: 2.50,
    manufacturer: 'Zydus Cadila',
    category: 'Antihypertensive',
    prescriptionRequired: true,
  },
  
  // Antidiabetics
  {
    name: 'Metformin',
    dosage: '500mg',
    quantity: 60,
    price: 2.25,
    manufacturer: 'USV Ltd',
    category: 'Antidiabetic',
    prescriptionRequired: true,
  },
  {
    name: 'Glibenclamide',
    dosage: '5mg',
    quantity: 30,
    price: 1.50,
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Antidiabetic',
    prescriptionRequired: true,
  },
  {
    name: 'Gliclazide',
    dosage: '80mg',
    quantity: 30,
    price: 2.75,
    manufacturer: 'Sun Pharma',
    category: 'Antidiabetic',
    prescriptionRequired: true,
  },
  
  // Cholesterol Lowering
  {
    name: 'Atorvastatin',
    dosage: '10mg',
    quantity: 30,
    price: 4.50,
    manufacturer: 'Lupin',
    category: 'Cholesterol',
    prescriptionRequired: true,
  },
  {
    name: 'Rosuvastatin',
    dosage: '10mg',
    quantity: 30,
    price: 5.00,
    manufacturer: 'Cipla Ltd',
    category: 'Cholesterol',
    prescriptionRequired: true,
  },
  
  // Antiasthmatic
  {
    name: 'Montelukast',
    dosage: '10mg',
    quantity: 30,
    price: 6.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antiasthmatic',
    prescriptionRequired: true,
  },
  {
    name: 'Salbutamol',
    dosage: '2mg',
    quantity: 30,
    price: 1.50,
    manufacturer: 'Cipla Ltd',
    category: 'Antiasthmatic',
    prescriptionRequired: true,
  },
  
  // Antifungal
  {
    name: 'Fluconazole',
    dosage: '150mg',
    quantity: 1,
    price: 15.00,
    manufacturer: 'Cipla Ltd',
    category: 'Antifungal',
    prescriptionRequired: true,
  },
  {
    name: 'Clotrimazole',
    dosage: '1%',
    quantity: 1,
    price: 25.00,
    manufacturer: 'Glenmark',
    category: 'Antifungal',
    prescriptionRequired: false,
  },
  
  // Antiviral
  {
    name: 'Acyclovir',
    dosage: '400mg',
    quantity: 10,
    price: 8.50,
    manufacturer: 'Cipla Ltd',
    category: 'Antiviral',
    prescriptionRequired: true,
  },
  
  // Antidepressants
  {
    name: 'Sertraline',
    dosage: '50mg',
    quantity: 30,
    price: 5.50,
    manufacturer: 'Sun Pharma',
    category: 'Antidepressant',
    prescriptionRequired: true,
  },
  {
    name: 'Escitalopram',
    dosage: '10mg',
    quantity: 30,
    price: 6.00,
    manufacturer: 'Lupin',
    category: 'Antidepressant',
    prescriptionRequired: true,
  },
  
  // Anticonvulsants
  {
    name: 'Phenytoin',
    dosage: '100mg',
    quantity: 30,
    price: 4.00,
    manufacturer: 'Zydus Cadila',
    category: 'Anticonvulsant',
    prescriptionRequired: true,
  },
  {
    name: 'Carbamazepine',
    dosage: '200mg',
    quantity: 30,
    price: 3.75,
    manufacturer: 'Sun Pharma',
    category: 'Anticonvulsant',
    prescriptionRequired: true,
  },
  
  // Antiemetics
  {
    name: 'Ondansetron',
    dosage: '4mg',
    quantity: 10,
    price: 3.50,
    manufacturer: 'Cipla Ltd',
    category: 'Antiemetic',
    prescriptionRequired: true,
  },
  {
    name: 'Domperidone',
    dosage: '10mg',
    quantity: 30,
    price: 2.00,
    manufacturer: 'Sun Pharma',
    category: 'Antiemetic',
    prescriptionRequired: false,
  },
  
  // Laxatives
  {
    name: 'Bisacodyl',
    dosage: '5mg',
    quantity: 30,
    price: 1.50,
    manufacturer: 'Zydus Cadila',
    category: 'Laxative',
    prescriptionRequired: false,
  },
  {
    name: 'Lactulose',
    dosage: '10ml',
    quantity: 1,
    price: 45.00,
    manufacturer: 'Abbott',
    category: 'Laxative',
    prescriptionRequired: false,
  },
  
  // Antispasmodics
  {
    name: 'Dicyclomine',
    dosage: '10mg',
    quantity: 30,
    price: 2.25,
    manufacturer: 'Cipla Ltd',
    category: 'Antispasmodic',
    prescriptionRequired: false,
  },
  {
    name: 'Drotaverine',
    dosage: '40mg',
    quantity: 30,
    price: 2.50,
    manufacturer: 'Sun Pharma',
    category: 'Antispasmodic',
    prescriptionRequired: false,
  },
  
  // Vitamins & Supplements
  {
    name: 'Vitamin D3',
    dosage: '60000 IU',
    quantity: 4,
    price: 25.00,
    manufacturer: 'USV Ltd',
    category: 'Vitamin',
    prescriptionRequired: false,
  },
  {
    name: 'Calcium Carbonate',
    dosage: '500mg',
    quantity: 30,
    price: 3.00,
    manufacturer: 'Cipla Ltd',
    category: 'Supplement',
    prescriptionRequired: false,
  },
  {
    name: 'Folic Acid',
    dosage: '5mg',
    quantity: 30,
    price: 1.25,
    manufacturer: 'Sun Pharma',
    category: 'Vitamin',
    prescriptionRequired: false,
  },
  
  // Thyroid
  {
    name: 'Levothyroxine',
    dosage: '50mcg',
    quantity: 30,
    price: 2.75,
    manufacturer: 'Abbott',
    category: 'Thyroid',
    prescriptionRequired: true,
  },
  
  // Diuretics
  {
    name: 'Furosemide',
    dosage: '40mg',
    quantity: 30,
    price: 1.50,
    manufacturer: 'Cipla Ltd',
    category: 'Diuretic',
    prescriptionRequired: true,
  },
  
  // Muscle Relaxants
  {
    name: 'Thiocolchicoside',
    dosage: '4mg',
    quantity: 30,
    price: 3.00,
    manufacturer: 'Sun Pharma',
    category: 'Muscle Relaxant',
    prescriptionRequired: false,
  },
  
  // Anticoagulants
  {
    name: 'Aspirin',
    dosage: '75mg',
    quantity: 30,
    price: 1.00,
    manufacturer: 'Bayer',
    category: 'Anticoagulant',
    prescriptionRequired: false,
  },
  {
    name: 'Clopidogrel',
    dosage: '75mg',
    quantity: 30,
    price: 4.50,
    manufacturer: 'Cipla Ltd',
    category: 'Anticoagulant',
    prescriptionRequired: true,
  },
];

const addMedicinesToPharmacy = async () => {
  try {
    // Connect to database
    await connectDB();
    

    // Phone number to find pharmacy
    const phoneNumber = '7724817688';
    
    // Find pharmacy by phone number
    const pharmacy = await Pharmacy.findOne({ phone: phoneNumber });
    
    if (!pharmacy) {
      console.error(`❌ Pharmacy with phone number ${phoneNumber} not found!`);
      
      const allPharmacies = await Pharmacy.find({}).select('pharmacyName phone email').limit(10);
      allPharmacies.forEach(p => {
        
      });
      process.exit(1);
    }

    
    
    
    

    // Add medicines
    let addedCount = 0;
    let skippedCount = 0;

    for (const medicineData of medicinesData) {
      try {
        // Check if medicine already exists for this pharmacy
        const existing = await Medicine.findOne({
          pharmacyId: pharmacy._id,
          name: medicineData.name,
          dosage: medicineData.dosage,
        });

        if (existing) {
          
          skippedCount++;
          continue;
        }

        // Create medicine
        const medicine = await Medicine.create({
          pharmacyId: pharmacy._id,
          name: medicineData.name,
          dosage: medicineData.dosage,
          manufacturer: medicineData.manufacturer,
          quantity: medicineData.quantity,
          price: medicineData.price,
          category: medicineData.category,
          prescriptionRequired: medicineData.prescriptionRequired,
          isActive: true,
        });

        
        addedCount++;
      } catch (error) {
        if (error.code === 11000) {
          
          skippedCount++;
        } else {
          console.error(`❌ Error adding ${medicineData.name}:`, error.message);
        }
      }
    }

    // Summary
    
    
    
    
    
    

    // Get total medicines count for this pharmacy
    const totalMedicines = await Medicine.countDocuments({
      pharmacyId: pharmacy._id,
      isActive: true,
    });
    

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
addMedicinesToPharmacy();

