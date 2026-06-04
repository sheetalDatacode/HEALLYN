require('dotenv').config();
const connectDB = require('../config/db');
const Test = require('../models/Test');
const Laboratory = require('../models/Laboratory');

(async () => {
  await connectDB();
  const lab = await Laboratory.findOne({ phone: '7724817688' });
  if (lab) {
    const totalTests = await Test.countDocuments({ laboratoryId: lab._id, isActive: true });
    
    
    const tests = await Test.find({ laboratoryId: lab._id, isActive: true })
      .select('name price category')
      .sort({ name: 1 })
      .limit(30);
    
    tests.forEach((t, i) => );
  } else {
    
  }
  process.exit(0);
})();

