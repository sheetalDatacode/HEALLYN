require('dotenv').config();
const connectDB = require('../config/db');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

(async () => {
  await connectDB();
  const pharmacy = await Pharmacy.findOne({ phone: '7999267233' });
  if (pharmacy) {
    const medicines = await Medicine.find({ pharmacyId: pharmacy._id, isActive: true })
      .select('name dosage price quantity manufacturer category')
      .sort({ name: 1 })
      .limit(10);
    
    
    
    medicines.forEach(m => {
      
    });
  }
  process.exit(0);
})();

