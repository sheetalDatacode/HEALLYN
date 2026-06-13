const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DoctorCategory = require('./models/DoctorCategory');
const DoctorSubcategory = require('./models/DoctorSubcategory');

// Load env vars
dotenv.config();

// Symptoms mapped to their corresponding category names
const symptomsData = [
  { name: 'Fever', categoryName: 'General Physician', image: 'https://placehold.co/400x400/fecdd3/e11d48?text=Fever' },
  { name: 'Chest Pain', categoryName: 'Cardiology', image: 'https://placehold.co/400x400/fce7f3/be185d?text=Chest+Pain' },
  { name: 'Cough & Cold', categoryName: 'General Physician', image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Cough+%26+Cold' },
  { name: 'Constipation', categoryName: 'Gastroenterology', image: 'https://placehold.co/400x400/ffedd5/c2410c?text=Constipation' },
  { name: 'Sore Throat', categoryName: 'ENT', image: 'https://placehold.co/400x400/dcfce7/15803d?text=Sore+Throat' },
  { name: 'Infertility', categoryName: 'Gynaecology', image: 'https://placehold.co/400x400/fae8ff/a21caf?text=Infertility' },
  { name: 'Irregular Periods', categoryName: 'Gynaecology', image: 'https://placehold.co/400x400/fee2e2/b91c1c?text=Irregular+Periods' },
  { name: 'Headache', categoryName: 'Neurology', image: 'https://placehold.co/400x400/fef3c7/b45309?text=Headache' },
  { name: 'Back Pain', categoryName: 'Orthopaedics', image: 'https://placehold.co/400x400/e0e7ff/4338ca?text=Back+Pain' },
  { name: 'Diabetes', categoryName: 'Diabetology', image: 'https://placehold.co/400x400/ccfbf1/0f766e?text=Diabetes' },
  { name: 'Anxiety', categoryName: 'Psychiatry', image: 'https://placehold.co/400x400/f3e8ff/7e22ce?text=Anxiety' },
  { name: 'Skin Rash', categoryName: 'Dermatology', image: 'https://placehold.co/400x400/ffedd5/ea580c?text=Skin+Rash' },
];

const seedSubcategories = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healiinn';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log('✅ MongoDB Connected...');

    let addedCount = 0;

    for (const symptom of symptomsData) {
      // Find the parent category by name
      const category = await DoctorCategory.findOne({ name: symptom.categoryName });
      
      if (!category) {
        console.log(`⚠️  Warning: Category '${symptom.categoryName}' not found. Skipping '${symptom.name}'.`);
        continue;
      }

      // Check if this subcategory already exists within this category
      const exists = await DoctorSubcategory.findOne({ 
        name: symptom.name, 
        category: category._id 
      });

      if (!exists) {
        await DoctorSubcategory.create({
          name: symptom.name,
          category: category._id,
          image: symptom.image,
          isApproved: true, // Auto-approve since seeded by admin
          isActive: true
        });
        console.log(`➕ Added Symptom: ${symptom.name} (under ${symptom.categoryName})`);
        addedCount++;
      } else {
        console.log(`⏭️ Skipped Symptom: ${symptom.name} (Already exists in ${symptom.categoryName})`);
      }
    }

    console.log(`\n🎉 Seeding completed! Added ${addedCount} new symptoms (subcategories).`);
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding subcategories:', error);
    process.exit(1);
  }
};

seedSubcategories();
