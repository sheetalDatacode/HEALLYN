/**
 * Seed Data Script for Pharmacy Module
 * 
 * This script seeds the database with:
 * - Multiple pharmacies (approved, pending statuses)
 * - Pharmacy profiles with complete address, timings, delivery options
 * - Medicine records (linked to pharmacies)
 * - PharmacyService records
 * - Orders (medicine orders from patients)
 * - Requests (order_medicine)
 * - WalletTransactions (earnings from orders)
 * - WithdrawalRequests
 * - Notifications for pharmacies
 * - Support tickets
 * 
 * Run with: node backend/scripts/seeddata-pharmacy.js
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
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const PharmacyService = require('../models/PharmacyService');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
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
    let patient = await Patient.findOne({ email: `pharmpatient${i}@example.com` });
    if (!patient) {
      patient = await Patient.create({
        firstName: `PharmPatient${i}`,
        lastName: 'User',
        email: `pharmpatient${i}@example.com`,
        phone: `+91-9876546${String(100 + i).slice(-3)}`,
        password: 'Patient@123',
        dateOfBirth: new Date(1990 + i, 0, 1),
        gender: i % 2 === 0 ? 'female' : 'male',
        address: {
          line1: `${300 + i} Medicine Street`,
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
const seedPharmacyData = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Get or create admin
    const admin = await getOrCreateAdmin();
    
    
    
    // Create placeholder profile images for pharmacies
    const pharmacyProfileImages = [];
    for (let i = 1; i <= 4; i++) {
      const imageUrl = createPlaceholderImage('profiles', `pharmacy_profile_seed_${i}.png`);
      pharmacyProfileImages.push(imageUrl);
    }
    
    const pharmacies = [
      {
        pharmacyName: 'City Pharmacy',
        ownerName: 'Rajesh Kumar',
        email: 'citypharmacy@healiinn.com',
        phone: '+91-9876543301',
        password: 'Pharmacy@123',
        licenseNumber: 'PHARM-CITY-001',
        gstNumber: '29ABCDE1234P1Z5',
        profileImage: pharmacyProfileImages[0],
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
        deliveryOptions: ['pickup', 'delivery', 'both'],
        serviceRadiusKm: 10,
        timings: [
          { day: 'Monday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Tuesday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Wednesday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Thursday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Friday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Saturday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Sunday', startTime: '09:00', endTime: '21:00', isOpen: true },
        ],
        contactPerson: {
          name: 'Amit',
          phone: '+91-9876543302',
          email: 'contact@citypharmacy.com',
        },
        bio: 'Leading pharmacy with wide range of medicines and home delivery service.',
        rating: 4.6,
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        isActive: true,
      },
      {
        pharmacyName: 'Health Care Pharmacy',
        ownerName: 'Priya Sharma',
        email: 'healthpharmacy@healiinn.com',
        phone: '+91-9876543303',
        password: 'Pharmacy@123',
        licenseNumber: 'PHARM-HEALTH-001',
        gstNumber: '29ABCDE1234P2Z6',
        profileImage: pharmacyProfileImages[1],
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
        deliveryOptions: ['pickup', 'delivery'],
        serviceRadiusKm: 8,
        timings: [
          { day: 'Monday', startTime: '09:00', endTime: '21:00', isOpen: true },
          { day: 'Tuesday', startTime: '09:00', endTime: '21:00', isOpen: true },
          { day: 'Wednesday', startTime: '09:00', endTime: '21:00', isOpen: true },
          { day: 'Thursday', startTime: '09:00', endTime: '21:00', isOpen: true },
          { day: 'Friday', startTime: '09:00', endTime: '21:00', isOpen: true },
          { day: 'Saturday', startTime: '09:00', endTime: '20:00', isOpen: true },
          { day: 'Sunday', startTime: '10:00', endTime: '20:00', isOpen: true },
        ],
        contactPerson: {
          name: 'Sunita',
          phone: '+91-9876543304',
          email: 'contact@healthpharmacy.com',
        },
        bio: 'Trusted pharmacy providing quality medicines with excellent customer service.',
        rating: 4.5,
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        isActive: true,
      },
      {
        pharmacyName: 'MediCare Pharmacy',
        ownerName: 'Amit Patel',
        email: 'medicarepharmacy@healiinn.com',
        phone: '+91-9876543305',
        password: 'Pharmacy@123',
        licenseNumber: 'PHARM-MED-001',
        gstNumber: '29ABCDE1234P3Z7',
        profileImage: pharmacyProfileImages[2],
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
        deliveryOptions: ['pickup', 'delivery'],
        serviceRadiusKm: 12,
        timings: [
          { day: 'Monday', startTime: '08:00', endTime: '23:00', isOpen: true },
          { day: 'Tuesday', startTime: '08:00', endTime: '23:00', isOpen: true },
          { day: 'Wednesday', startTime: '08:00', endTime: '23:00', isOpen: true },
          { day: 'Thursday', startTime: '08:00', endTime: '23:00', isOpen: true },
          { day: 'Friday', startTime: '08:00', endTime: '23:00', isOpen: true },
          { day: 'Saturday', startTime: '08:00', endTime: '22:00', isOpen: true },
          { day: 'Sunday', startTime: '09:00', endTime: '22:00', isOpen: true },
        ],
        contactPerson: {
          name: 'Vikram',
          phone: '+91-9876543306',
          email: 'contact@medicarepharmacy.com',
        },
        bio: '24/7 pharmacy service with quick delivery and competitive prices.',
        rating: 4.7,
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        isActive: true,
      },
      {
        pharmacyName: 'Prime Pharmacy',
        ownerName: 'Neha Reddy',
        email: 'primepharmacy@healiinn.com',
        phone: '+91-9876543307',
        password: 'Pharmacy@123',
        licenseNumber: 'PHARM-PRIME-001',
        gstNumber: '29ABCDE1234P4Z8',
        profileImage: pharmacyProfileImages[3],
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
        deliveryOptions: ['pickup'],
        serviceRadiusKm: 5,
        timings: [
          { day: 'Monday', startTime: '09:00', endTime: '20:00', isOpen: true },
          { day: 'Tuesday', startTime: '09:00', endTime: '20:00', isOpen: true },
          { day: 'Wednesday', startTime: '09:00', endTime: '20:00', isOpen: true },
          { day: 'Thursday', startTime: '09:00', endTime: '20:00', isOpen: true },
          { day: 'Friday', startTime: '09:00', endTime: '20:00', isOpen: true },
          { day: 'Saturday', startTime: '09:00', endTime: '19:00', isOpen: true },
        ],
        contactPerson: {
          name: 'Ramesh',
          phone: '+91-9876543308',
          email: 'contact@primepharmacy.com',
        },
        bio: 'Premium pharmacy with specialized medicines and expert consultation.',
        rating: 4.4,
        status: APPROVAL_STATUS.PENDING,
        isActive: true,
      },
    ];
    
    const createdPharmacies = [];
    for (const pharmacy of pharmacies) {
      const created = await createOrSkip(Pharmacy, pharmacy, 'email');
      createdPharmacies.push(created);
    }
    
    // Get approved pharmacies
    const approvedPharmacies = createdPharmacies.filter(p => p.status === APPROVAL_STATUS.APPROVED);
    
    
    const medicines = [];
    
    const medicineData = [
      { name: 'Paracetamol 500mg', dosage: '500mg', manufacturer: 'Cipla', price: 25, quantity: 500, category: 'Pain Relief', prescriptionRequired: false },
      { name: 'Amoxicillin 250mg', dosage: '250mg', manufacturer: 'Sun Pharma', price: 45, quantity: 300, category: 'Antibiotic', prescriptionRequired: true },
      { name: 'Azithromycin 500mg', dosage: '500mg', manufacturer: 'Lupin', price: 120, quantity: 200, category: 'Antibiotic', prescriptionRequired: true },
      { name: 'Cetirizine 10mg', dosage: '10mg', manufacturer: 'Dr. Reddy\'s', price: 35, quantity: 400, category: 'Antihistamine', prescriptionRequired: false },
      { name: 'Omeprazole 20mg', dosage: '20mg', manufacturer: 'Torrent', price: 55, quantity: 250, category: 'Antacid', prescriptionRequired: false },
      { name: 'Metformin 500mg', dosage: '500mg', manufacturer: 'Zydus', price: 40, quantity: 300, category: 'Diabetes', prescriptionRequired: true },
      { name: 'Atorvastatin 10mg', dosage: '10mg', manufacturer: 'Cadila', price: 65, quantity: 200, category: 'Cholesterol', prescriptionRequired: true },
      { name: 'Amlodipine 5mg', dosage: '5mg', manufacturer: 'Mankind', price: 50, quantity: 250, category: 'Hypertension', prescriptionRequired: true },
      { name: 'Ibuprofen 400mg', dosage: '400mg', manufacturer: 'Cipla', price: 30, quantity: 350, category: 'Pain Relief', prescriptionRequired: false },
      { name: 'Dolo 650mg', dosage: '650mg', manufacturer: 'Micro Labs', price: 28, quantity: 400, category: 'Pain Relief', prescriptionRequired: false },
      { name: 'Montelukast 10mg', dosage: '10mg', manufacturer: 'Glenmark', price: 75, quantity: 150, category: 'Asthma', prescriptionRequired: true },
      { name: 'Pantoprazole 40mg', dosage: '40mg', manufacturer: 'Sun Pharma', price: 60, quantity: 200, category: 'Antacid', prescriptionRequired: false },
    ];
    
    for (let i = 0; i < medicineData.length; i++) {
      const medData = medicineData[i];
      const pharmacy = approvedPharmacies[i % approvedPharmacies.length];
      
      const medicine = await Medicine.create({
        pharmacyId: pharmacy._id,
        ...medData,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        batchNumber: `BATCH-${Date.now()}-${i}`,
        isActive: true,
      });
      medicines.push(medicine);
      
    }
    
    
    const pharmacyServices = [];
    
    for (const pharmacy of approvedPharmacies) {
      const services = [
        {
          pharmacyId: pharmacy._id,
          name: 'Prescription Fulfillment',
          description: 'Complete prescription medicine delivery',
          category: 'prescription',
          price: 0,
          available: true,
          deliveryOptions: ['pickup', 'delivery'],
          serviceRadius: pharmacy.serviceRadiusKm || 10,
        },
        {
          pharmacyId: pharmacy._id,
          name: 'Medicine Consultation',
          description: 'Expert consultation on medicines and dosage',
          category: 'consultation',
          price: 100,
          available: true,
          deliveryOptions: ['pickup'],
          serviceRadius: 0,
        },
        {
          pharmacyId: pharmacy._id,
          name: 'Express Delivery',
          description: 'Same day delivery service',
          category: 'delivery',
          price: 50,
          available: true,
          deliveryOptions: ['delivery'],
          serviceRadius: pharmacy.serviceRadiusKm || 10,
        },
      ];
      
      for (const service of services) {
        const pharmacyService = await PharmacyService.create(service);
        pharmacyServices.push(pharmacyService);
      }
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
        medications: [
          {
            name: medicines[i % medicines.length].name,
            dosage: medicines[i % medicines.length].dosage,
            frequency: 'Twice daily',
            duration: '5 days',
            quantity: 10,
          },
        ],
        status: 'active',
        sharedWith: [
          {
            pharmacyId: approvedPharmacies[i % approvedPharmacies.length]._id,
            sharedAt: new Date(),
          },
        ],
      });
      prescriptions.push(prescription);
    }
    
    
    const orders = [];
    
    for (let i = 0; i < patients.length && i < 8; i++) {
      const patient = patients[i];
      const pharmacy = approvedPharmacies[i % approvedPharmacies.length];
      const medicine1 = medicines[i % medicines.length];
      const medicine2 = medicines[(i + 1) % medicines.length];
      const prescription = prescriptions[i % prescriptions.length];
      
      const orderItems = [
        {
          name: medicine1.name,
          quantity: 2,
          price: medicine1.price,
          total: medicine1.price * 2,
          medicineId: medicine1._id,
        },
        {
          name: medicine2.name,
          quantity: 1,
          price: medicine2.price,
          total: medicine2.price,
          medicineId: medicine2._id,
        },
      ];
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
      const orderStatuses = ['pending', 'accepted', 'processing', 'ready', 'delivered'];
      const status = orderStatuses[i % orderStatuses.length];
      
      const order = await Order.create({
        patientId: patient._id,
        providerId: pharmacy._id,
        providerType: 'pharmacy',
        prescriptionId: prescription._id,
        items: orderItems,
        totalAmount,
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
    
    
    
    
    const requests = [];
    
    for (let i = 0; i < patients.length && i < 3; i++) {
      const patient = patients[i];
      const pharmacy = approvedPharmacies[i % approvedPharmacies.length];
      const medicine1 = medicines[i % medicines.length];
      const medicine2 = medicines[(i + 1) % medicines.length];
      const prescription = prescriptions[i % prescriptions.length];
      
      const request = await Request.create({
        patientId: patient._id,
        type: 'order_medicine',
        prescriptionId: prescription._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        patientAddress: patient.address,
        status: i === 0 ? 'completed' : i === 1 ? 'confirmed' : 'pending',
        adminResponse: i === 0 || i === 1 ? {
          medicines: [
            {
              pharmacyId: pharmacy._id,
              pharmacyName: pharmacy.pharmacyName,
              name: medicine1.name,
              dosage: medicine1.dosage,
              quantity: 2,
              price: medicine1.price,
            },
            {
              pharmacyId: pharmacy._id,
              pharmacyName: pharmacy.pharmacyName,
              name: medicine2.name,
              dosage: medicine2.dosage,
              quantity: 1,
              price: medicine2.price,
            },
          ],
          totalAmount: (medicine1.price * 2) + medicine2.price,
          message: 'Medicines available',
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
      const { earning } = calculateProviderEarning(order.totalAmount, 'pharmacy');
      
      // Calculate current balance
      const existingEarnings = await WalletTransaction.aggregate([
        {
          $match: {
            userId: order.providerId,
            userType: 'pharmacy',
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
            userType: 'pharmacy',
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
        userType: 'pharmacy',
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
    
    for (let i = 0; i < approvedPharmacies.length && i < 2; i++) {
      const pharmacy = approvedPharmacies[i];
      
      const withdrawalStatuses = [WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED];
      const amounts = [5000, 10000];
      
      for (let j = 0; j < 2; j++) {
        const status = withdrawalStatuses[j];
        const amount = amounts[j];
        
        const withdrawalRequest = await WithdrawalRequest.create({
          userId: pharmacy._id,
          userType: 'pharmacy',
          amount,
          payoutMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: `876543210${i}${j}`,
              ifscCode: 'SBI0001234',
              bankName: 'State Bank of India',
              accountHolderName: pharmacy.ownerName,
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
        description: `Payment for medicine order`,
        referenceId: `TXN-ORD-${order._id.toString().slice(-6)}`,
        category: 'medicine',
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
        description: `Pharmacy order payment received from patient`,
        referenceId: `TXN-ADM-ORD-${order._id.toString().slice(-6)}`,
        category: 'medicine',
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
    
    for (const pharmacy of approvedPharmacies) {
      const pharmacyNotifications = [
        {
          userId: pharmacy._id,
          userType: 'pharmacy',
          type: 'order',
          title: 'New Medicine Order',
          message: 'A new medicine order has been placed.',
          priority: 'high',
          read: false,
        },
        {
          userId: pharmacy._id,
          userType: 'pharmacy',
          type: 'request',
          title: 'New Medicine Request',
          message: 'A new medicine order request has been received.',
          priority: 'medium',
          read: false,
        },
        {
          userId: pharmacy._id,
          userType: 'pharmacy',
          type: 'wallet',
          title: 'Earning Credited',
          message: 'Your earning from order has been credited to wallet.',
          priority: 'medium',
          read: true,
          readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
        {
          userId: pharmacy._id,
          userType: 'pharmacy',
          type: 'withdrawal',
          title: 'Withdrawal Request Approved',
          message: 'Your withdrawal request has been approved.',
          priority: 'high',
          read: false,
        },
      ];
      
      for (const notification of pharmacyNotifications) {
        await Notification.create(notification);
        notifications.push(notification);
      }
    }
    
    
    
    
    const supportTickets = [];
    
    for (let i = 0; i < approvedPharmacies.length && i < 2; i++) {
      const pharmacy = approvedPharmacies[i];
      const ticket = await SupportTicket.create({
        userId: pharmacy._id,
        userType: 'pharmacy',
        subject: `Support Request ${i + 1}`,
        message: `I need help with ${i === 0 ? 'order management' : 'inventory update'}.`,
        status: i === 0 ? 'open' : 'in_progress',
        priority: i === 0 ? 'high' : 'medium',
      });
      supportTickets.push(ticket);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding pharmacy data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedPharmacyData();

