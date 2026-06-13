const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DoctorCategory = require('./models/DoctorCategory');

// Load env vars
dotenv.config();

const categories = [
  { name: 'General Physician', image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=General+Physician' },
  { name: 'Gynaecology', image: 'https://placehold.co/400x400/fce7f3/be185d?text=Gynaecology' },
  { name: 'Dermatology', image: 'https://placehold.co/400x400/fef3c7/b45309?text=Dermatology' },
  { name: 'Diabetology', image: 'https://placehold.co/400x400/dcfce7/15803d?text=Diabetology' },
  { name: 'Gastroenterology', image: 'https://placehold.co/400x400/f3e8ff/7e22ce?text=Gastroenterology' },
  { name: 'Cardiology', image: 'https://placehold.co/400x400/fee2e2/b91c1c?text=Cardiology' },
  { name: 'Orthopaedics', image: 'https://placehold.co/400x400/e0e7ff/4338ca?text=Orthopaedics' },
  { name: 'Neurology', image: 'https://placehold.co/400x400/ffedd5/c2410c?text=Neurology' },
  { name: 'Paediatrics', image: 'https://placehold.co/400x400/fae8ff/a21caf?text=Paediatrics' },
  { name: 'ENT', image: 'https://placehold.co/400x400/ccfbf1/0f766e?text=ENT' },
  { name: 'Psychiatry', image: 'https://placehold.co/400x400/f4f4f5/3f3f46?text=Psychiatry' },
  { name: 'Urology', image: 'https://placehold.co/400x400/e0f2fe/0284c7?text=Urology' },
];

const seedCategories = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healiinn';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log('✅ MongoDB Connected...');

    let addedCount = 0;

    for (const cat of categories) {
      // Check if category already exists
      const exists = await DoctorCategory.findOne({ name: cat.name });
      if (!exists) {
        await DoctorCategory.create({
          name: cat.name,
          image: cat.image,
          isActive: true
        });
        console.log(`➕ Added: ${cat.name}`);
        addedCount++;
      } else {
        console.log(`⏭️ Skipped: ${cat.name} (Already exists)`);
      }
    }

    console.log(`\n🎉 Seeding completed! Added ${addedCount} new categories.`);
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
