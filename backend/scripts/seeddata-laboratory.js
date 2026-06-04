/**
 * Seed Data Script for Laboratory Module
 * 
 * This script seeds the database with:
 * - Multiple laboratories (approved, pending statuses)
 * - Laboratory profiles with complete address, timings, tests offered
 * - Test records (linked to laboratories)
 * - Orders (test orders from patients)
 * - LabReports (linked to orders and prescriptions)
 * - Requests (book_test_visit)
 * - WalletTransactions (earnings from orders)
 * - WithdrawalRequests
 * - Notifications for laboratories
 * - Support tickets
 * 
 * Run with: node backend/scripts/seeddata-laboratory.js
 * 
 * Note: Requires Admin users to exist (for approvedBy field)
 *       Will create patients if they don't exist
 */

require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Admin = require('../models/Admin');
const Laboratory = require('../models/Laboratory');
const Test = require('../models/Test');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const LabReport = require('../models/LabReport');
const Request = require('../models/Request');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const Transaction = require('../models/Transaction');
const { APPROVAL_STATUS, WITHDRAWAL_STATUS } = require('../utils/constants');
const { calculateProviderEarning } = require('../utils/commissionConfig');

// Helper function to create a placeholder image file
const createPlaceholderImage = (folder, filename) => {
  const uploadDir = path.join(__dirname, '..', 'upload', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, filename);
  
  // If file already exists, return the URL
  if (fs.existsSync(filePath)) {
    return `/uploads/${folder}/${filename}`;
  }
  
  // Create a simple 1x1 pixel PNG as placeholder (base64 encoded)
  // This is a minimal valid PNG file
  const placeholderPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  fs.writeFileSync(filePath, placeholderPNG);
  return `/uploads/${folder}/${filename}`;
};

// Helper function to handle duplicate errors
const createOrSkip = async (Model, data, identifier = 'email') => {
  try {
    const existing = await Model.findOne({ [identifier]: data[identifier] });
    if (existing) {
      
      return existing;
    }
    const created = await Model.create(data);
    
    return created;
  } catch (error) {
    if (error.code === 11000) {
      
      return await Model.findOne({ [identifier]: data[identifier] });
    }
    throw error;
  }
};

// Helper to get or create admin
const getOrCreateAdmin = async () => {
  let admin = await Admin.findOne({ isSuperAdmin: true });
  if (!admin) {
    admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@healiinn.com',
      phone: '+91-9876543210',
      password: 'Admin@123',
      isSuperAdmin: true,
      permissions: ['all'],
      isActive: true,
    });
  }
  return admin;
};

// Helper to get or create patients
const getOrCreatePatients = async (count = 5) => {
  const patients = [];
  for (let i = 1; i <= count; i++) {
    let patient = await Patient.findOne({ email: `labpatient${i}@example.com` });
    if (!patient) {
      patient = await Patient.create({
        firstName: `LabPatient${i}`,
        lastName: 'User',
        email: `labpatient${i}@example.com`,
        phone: `+91-9876545${String(100 + i).slice(-3)}`,
        password: 'Patient@123',
        dateOfBirth: new Date(1990 + i, 0, 1),
        gender: i % 2 === 0 ? 'female' : 'male',
        address: {
          line1: `${200 + i} Test Street`,
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });
    }
    patients.push(patient);
  }
  return patients;
};

// Main seed function
const seedLaboratoryData = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Get or create admin
    const admin = await getOrCreateAdmin();
    
    
    
    // Create placeholder profile images for laboratories
    const labProfileImages = [];
    for (let i = 1; i <= 4; i++) {
      const imageUrl = createPlaceholderImage('profiles', `lab_profile_seed_${i}.png`);
      labProfileImages.push(imageUrl);
    }
    
    const laboratories = [
      {
        labName: 'City Diagnostic Center',
        ownerName: 'Dr. Ramesh Kumar',
        email: 'citylab@healiinn.com',
        phone: '+91-9876543401',
        password: 'Lab@1234',
        licenseNumber: 'LAB-CITY-001',
        gstNumber: '29ABCDE1234F1Z5',
        gender: 'male',
        profileImage: labProfileImages[0],
        bio: 'Leading diagnostic center with state-of-the-art equipment and experienced technicians.',
        address: {
          line1: '123 MG Road',
          line2: 'Near Metro Station',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          location: {
            type: 'Point',
            coordinates: [77.5946, 12.9716], // [lng, lat]
          },
          locationSource: 'gps',
        },
        testsOffered: [
          { testName: 'Complete Blood Count', price: 300, description: 'CBC test' },
          { testName: 'Blood Sugar (Fasting)', price: 150, description: 'Fasting blood sugar' },
          { testName: 'Lipid Profile', price: 400, description: 'Cholesterol test' },
        ],
        timings: ['09:00 AM - 06:00 PM'],
        contactPerson: {
          name: 'Rajesh',
          phone: '+91-9876543402',
          email: 'contact@citylab.com',
        },
        operatingHours: {
          opening: '09:00',
          closing: '18:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.5,
        isActive: true,
      },
      {
        labName: 'Metro Pathology Lab',
        ownerName: 'Dr. Priya Sharma',
        email: 'metrolab@healiinn.com',
        phone: '+91-9876543403',
        password: 'Lab@1234',
        licenseNumber: 'LAB-METRO-001',
        gstNumber: '29ABCDE1234F2Z6',
        gender: 'female',
        profileImage: labProfileImages[1],
        bio: 'Advanced pathology laboratory providing accurate and timely test results.',
        address: {
          line1: '456 Indiranagar',
          line2: '100 Feet Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          location: {
            type: 'Point',
            coordinates: [77.6400, 12.9784],
          },
          locationSource: 'gps',
        },
        testsOffered: [
          { testName: 'Liver Function Test', price: 500, description: 'LFT test' },
          { testName: 'Thyroid Function Test', price: 600, description: 'TFT test' },
          { testName: 'Kidney Function Test', price: 450, description: 'KFT test' },
        ],
        timings: ['08:00 AM - 08:00 PM'],
        contactPerson: {
          name: 'Amit',
          phone: '+91-9876543404',
          email: 'contact@metrolab.com',
        },
        operatingHours: {
          opening: '08:00',
          closing: '20:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.7,
        isActive: true,
      },
      {
        labName: 'Health Care Diagnostics',
        ownerName: 'Dr. Amit Patel',
        email: 'healthlab@healiinn.com',
        phone: '+91-9876543405',
        password: 'Lab@1234',
        licenseNumber: 'LAB-HEALTH-001',
        gstNumber: '29ABCDE1234F3Z7',
        gender: 'male',
        profileImage: labProfileImages[2],
        bio: 'Comprehensive diagnostic services with home collection facility.',
        address: {
          line1: '789 Koramangala',
          line2: '5th Block',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560095',
          country: 'India',
          location: {
            type: 'Point',
            coordinates: [77.6270, 12.9352],
          },
          locationSource: 'gps',
        },
        testsOffered: [
          { testName: 'Vitamin D Test', price: 800, description: 'Vitamin D level' },
          { testName: 'Vitamin B12 Test', price: 700, description: 'B12 level' },
          { testName: 'HbA1c Test', price: 500, description: 'Diabetes test' },
        ],
        timings: ['07:00 AM - 09:00 PM'],
        contactPerson: {
          name: 'Sunita',
          phone: '+91-9876543406',
          email: 'contact@healthlab.com',
        },
        operatingHours: {
          opening: '07:00',
          closing: '21:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.6,
        isActive: true,
      },
      {
        labName: 'Prime Lab Services',
        ownerName: 'Dr. Neha Reddy',
        email: 'primelab@healiinn.com',
        phone: '+91-9876543407',
        password: 'Lab@1234',
        licenseNumber: 'LAB-PRIME-001',
        gstNumber: '29ABCDE1234F4Z8',
        gender: 'female',
        profileImage: labProfileImages[3],
        bio: 'Premium diagnostic services with quick turnaround time.',
        address: {
          line1: '321 Whitefield',
          line2: 'ITPL Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560066',
          country: 'India',
          location: {
            type: 'Point',
            coordinates: [77.7498, 12.9698],
          },
          locationSource: 'gps',
        },
        testsOffered: [
          { testName: 'ECG', price: 200, description: 'Electrocardiogram' },
          { testName: 'Chest X-Ray', price: 400, description: 'X-Ray test' },
          { testName: 'Ultrasound', price: 800, description: 'USG test' },
        ],
        timings: ['08:00 AM - 07:00 PM'],
        contactPerson: {
          name: 'Vikram',
          phone: '+91-9876543408',
          email: 'contact@primelab.com',
        },
        operatingHours: {
          opening: '08:00',
          closing: '19:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        status: APPROVAL_STATUS.PENDING,
        rating: 0,
        isActive: true,
      },
    ];
    
    const createdLabs = [];
    for (const lab of laboratories) {
      const created = await createOrSkip(Laboratory, lab, 'email');
      createdLabs.push(created);
    }
    
    // Get approved laboratories
    const approvedLabs = createdLabs.filter(l => l.status === APPROVAL_STATUS.APPROVED);
    
    
    const tests = [];
    
    const testData = [
      // For City Diagnostic Center
      { name: 'Complete Blood Count (CBC)', description: 'Complete blood count test including RBC, WBC, platelets', price: 300, category: 'Hematology', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
      { name: 'Blood Sugar (Fasting)', description: 'Fasting blood sugar test', price: 150, category: 'Biochemistry', preparationInstructions: '8-12 hours fasting required', reportTime: 'Same day' },
      { name: 'Lipid Profile', description: 'Cholesterol and lipid test', price: 400, category: 'Biochemistry', preparationInstructions: '12 hours fasting required', reportTime: 'Next day' },
      { name: 'Liver Function Test (LFT)', description: 'Liver function test', price: 500, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
      { name: 'Thyroid Function Test (TFT)', description: 'Thyroid hormone test', price: 600, category: 'Hormone', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
      { name: 'Kidney Function Test (KFT)', description: 'Kidney function test', price: 450, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Same day' },
      { name: 'Vitamin D Test', description: 'Vitamin D level test', price: 800, category: 'Vitamins', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
      { name: 'Vitamin B12 Test', description: 'Vitamin B12 level test', price: 700, category: 'Vitamins', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
      { name: 'HbA1c Test', description: 'Diabetes control test', price: 500, category: 'Biochemistry', preparationInstructions: 'Fasting not required', reportTime: 'Next day' },
      { name: 'ECG', description: 'Electrocardiogram', price: 200, category: 'Cardiology', preparationInstructions: 'No special preparation', reportTime: 'Immediate' },
      { name: 'Chest X-Ray', description: 'Chest X-Ray test', price: 400, category: 'Radiology', preparationInstructions: 'No special preparation', reportTime: 'Same day' },
      { name: 'Ultrasound Abdomen', description: 'Abdominal ultrasound', price: 800, category: 'Radiology', preparationInstructions: '6-8 hours fasting required', reportTime: 'Same day' },
    ];
    
    for (let i = 0; i < testData.length; i++) {
      const testInfo = testData[i];
      const lab = approvedLabs[i % approvedLabs.length];
      
      const test = await Test.create({
        laboratoryId: lab._id,
        ...testInfo,
        isActive: true,
      });
      tests.push(test);
      
    }
    
    
    const patients = await getOrCreatePatients(8);
    
    
    let doctor = await Doctor.findOne({ status: APPROVAL_STATUS.APPROVED });
    if (!doctor) {
      doctor = await Doctor.create({
        firstName: 'Test',
        lastName: 'Doctor',
        email: 'testdoctor@healiinn.com',
        phone: '+91-9999999998',
        password: 'Doctor@123',
        specialization: 'General Medicine',
        gender: 'male',
        licenseNumber: 'TEST-DOC-001',
        status: APPROVAL_STATUS.APPROVED,
        approvedBy: admin._id,
      });
    }
    
    // Create prescriptions for patients
    const prescriptions = [];
    for (let i = 0; i < patients.length && i < 5; i++) {
      const patient = patients[i];
      const consultation = await require('../models/Consultation').create({
        appointmentId: new mongoose.Types.ObjectId(),
        patientId: patient._id,
        doctorId: doctor._id,
        consultationDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        status: 'completed',
        diagnosis: 'Routine checkup',
      });
      
      const prescription = await Prescription.create({
        consultationId: consultation._id,
        patientId: patient._id,
        doctorId: doctor._id,
        medications: [],
        status: 'active',
      });
      prescriptions.push(prescription);
    }
    
    
    const orders = [];
    
    for (let i = 0; i < patients.length && i < 8; i++) {
      const patient = patients[i];
      const lab = approvedLabs[i % approvedLabs.length];
      const test = tests[i % tests.length];
      const prescription = prescriptions[i % prescriptions.length];
      
      const orderItems = [
        {
          name: test.name,
          quantity: 1,
          price: test.price,
          total: test.price,
          testId: test._id,
        },
      ];
      
      const orderStatuses = ['pending', 'accepted', 'processing', 'ready', 'delivered'];
      const status = orderStatuses[i % orderStatuses.length];
      
      const order = await Order.create({
        patientId: patient._id,
        providerId: lab._id,
        providerType: 'laboratory',
        prescriptionId: prescription._id,
        items: orderItems,
        totalAmount: test.price,
        status,
        deliveryOption: i % 2 === 0 ? 'home_delivery' : 'pickup',
        deliveryAddress: patient.address,
        paymentStatus: status === 'delivered' || status === 'ready' ? 'paid' : 'pending',
        paymentMethod: status === 'delivered' || status === 'ready' ? 'razorpay' : undefined,
        paymentId: status === 'delivered' || status === 'ready' ? `pay_${Date.now()}_${i}` : undefined,
        ...(status === 'delivered' && { deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      });
      orders.push(order);
    }
    
    
    
    
    const labReports = [];
    
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'ready');
    for (const order of completedOrders) {
      const test = tests.find(t => t._id.toString() === order.items[0].testId?.toString());
      
      const labReport = await LabReport.create({
        orderId: order._id,
        patientId: order.patientId,
        laboratoryId: order.providerId,
        prescriptionId: order.prescriptionId,
        testName: order.items[0].name,
        results: [
          {
            parameter: 'Test Result',
            value: 'Normal',
            unit: '',
            normalRange: 'Normal',
            status: 'normal',
          },
          {
            parameter: 'Test Value',
            value: 'Within Range',
            unit: '',
            normalRange: 'Normal Range',
            status: 'normal',
          },
        ],
        status: order.status === 'delivered' ? 'completed' : 'pending',
        reportDate: order.status === 'delivered' ? new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000) : new Date(),
        notes: 'Test results are within normal range.',
        isShared: order.status === 'delivered',
        ...(order.status === 'delivered' && {
          sharedWith: [
            {
              doctorId: order.prescriptionId ? (await Prescription.findById(order.prescriptionId))?.doctorId : doctor._id,
              sharedAt: new Date(),
            },
          ],
        }),
      });
      labReports.push(labReport);
    }
    
    
    
    
    const requests = [];
    
    for (let i = 0; i < patients.length && i < 3; i++) {
      const patient = patients[i];
      const lab = approvedLabs[i % approvedLabs.length];
      const test = tests[i % tests.length];
      const prescription = prescriptions[i % prescriptions.length];
      
      const request = await Request.create({
        patientId: patient._id,
        type: 'book_test_visit',
        prescriptionId: prescription._id,
        visitType: i % 2 === 0 ? 'home' : 'lab',
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        patientAddress: patient.address,
        status: i === 0 ? 'completed' : i === 1 ? 'confirmed' : 'pending',
        adminResponse: i === 0 || i === 1 ? {
          tests: [
            {
              labId: lab._id,
              labName: lab.labName,
              testName: test.name,
              price: test.price,
            },
          ],
          totalAmount: test.price,
          message: 'Test booking confirmed',
          responseDate: new Date(),
        } : undefined,
        paymentStatus: i === 0 || i === 1 ? 'paid' : 'pending',
        paymentId: i === 0 || i === 1 ? `pay_req_${Date.now()}_${i}` : undefined,
        orders: i === 0 || i === 1 ? [orders[i]._id] : [],
      });
      requests.push(request);
    }
    
    
    
    
    const walletTransactions = [];
    
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    for (const order of paidOrders) {
      const { earning } = calculateProviderEarning(order.totalAmount, 'laboratory');
      
      // Calculate current balance
      const existingEarnings = await WalletTransaction.aggregate([
        {
          $match: {
            userId: order.providerId,
            userType: 'laboratory',
            type: 'earning',
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      
      const existingWithdrawals = await WalletTransaction.aggregate([
        {
          $match: {
            userId: order.providerId,
            userType: 'laboratory',
            type: 'withdrawal',
            status: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      
      const currentBalance = (existingEarnings[0]?.total || 0) - (existingWithdrawals[0]?.total || 0);
      const newBalance = currentBalance + earning;
      
      const walletTransaction = await WalletTransaction.create({
        userId: order.providerId,
        userType: 'laboratory',
        type: 'earning',
        amount: earning,
        balance: newBalance,
        status: 'completed',
        description: `Earning from order #${order._id.toString().slice(-6)}`,
        referenceId: `ORD-${order._id.toString().slice(-6)}`,
        orderId: order._id,
      });
      walletTransactions.push(walletTransaction);
    }
    
    
    
    
    const withdrawalRequests = [];
    
    for (let i = 0; i < approvedLabs.length && i < 2; i++) {
      const lab = approvedLabs[i];
      
      const withdrawalStatuses = [WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED];
      const amounts = [5000, 10000];
      
      for (let j = 0; j < 2; j++) {
        const status = withdrawalStatuses[j];
        const amount = amounts[j];
        
        const withdrawalRequest = await WithdrawalRequest.create({
          userId: lab._id,
          userType: 'laboratory',
          amount,
          payoutMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: `987654321${i}${j}`,
              ifscCode: 'ICIC0001234',
              bankName: 'ICICI Bank',
              accountHolderName: lab.ownerName,
            },
          },
          status,
          ...(status === WITHDRAWAL_STATUS.APPROVED && {
            approvedAt: new Date(Date.now() - (2 - j) * 24 * 60 * 60 * 1000),
            processedBy: admin._id,
          }),
        });
        withdrawalRequests.push(withdrawalRequest);
      }
    }
    
    
    
    
    const transactions = [];
    
    // Get admin for admin transactions
    let adminForTransactions = await Admin.findOne({ isActive: true });
    if (!adminForTransactions) {
      adminForTransactions = admin;
    }
    
    for (const order of paidOrders) {
      // Patient transaction
      const patientTransaction = await Transaction.create({
        userId: order.patientId,
        userType: 'patient',
        type: 'payment',
        amount: order.totalAmount,
        status: 'completed',
        description: `Payment for lab test order`,
        referenceId: `TXN-ORD-${order._id.toString().slice(-6)}`,
        category: 'test',
        paymentMethod: order.paymentMethod || 'razorpay',
        paymentId: order.paymentId,
        orderId: order._id,
        metadata: {
          patientId: order.patientId,
        },
      });
      transactions.push(patientTransaction);
      
      // Admin transaction (payment received)
      const adminTransaction = await Transaction.create({
        userId: adminForTransactions._id,
        userType: 'admin',
        type: 'payment',
        amount: order.totalAmount,
        status: 'completed',
        description: `Laboratory order payment received from patient`,
        referenceId: `TXN-ADM-ORD-${order._id.toString().slice(-6)}`,
        category: 'test',
        paymentMethod: order.paymentMethod || 'razorpay',
        paymentId: order.paymentId,
        orderId: order._id,
        metadata: {
          patientId: order.patientId,
        },
      });
      transactions.push(adminTransaction);
    }
    
    
    
    
    const notifications = [];
    
    for (const lab of approvedLabs) {
      const labNotifications = [
        {
          userId: lab._id,
          userType: 'laboratory',
          type: 'order',
          title: 'New Test Order',
          message: 'A new test order has been placed.',
          priority: 'high',
          read: false,
        },
        {
          userId: lab._id,
          userType: 'laboratory',
          type: 'request',
          title: 'New Test Request',
          message: 'A new test booking request has been received.',
          priority: 'medium',
          read: false,
        },
        {
          userId: lab._id,
          userType: 'laboratory',
          type: 'wallet',
          title: 'Earning Credited',
          message: 'Your earning from order has been credited to wallet.',
          priority: 'medium',
          read: true,
          readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      ];
      
      for (const notification of labNotifications) {
        await Notification.create(notification);
        notifications.push(notification);
      }
    }
    
    
    
    
    const supportTickets = [];
    
    for (let i = 0; i < approvedLabs.length && i < 2; i++) {
      const lab = approvedLabs[i];
      const ticket = await SupportTicket.create({
        userId: lab._id,
        userType: 'laboratory',
        subject: `Support Request ${i + 1}`,
        message: `I need help with ${i === 0 ? 'report upload' : 'order management'}.`,
        status: i === 0 ? 'open' : 'in_progress',
        priority: i === 0 ? 'high' : 'medium',
      });
      supportTickets.push(ticket);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding laboratory data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedLaboratoryData();

