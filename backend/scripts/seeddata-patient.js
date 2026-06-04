/**
 * Seed Data Script for Patient Module
 * 
 * This script seeds the database with:
 * - Multiple patients with complete profiles (medical history, allergies, emergency contacts)
 * - Patient favorites (doctors, laboratories, pharmacies)
 * - Appointments (linked to doctors from seeddata-doctor)
 * - Consultations (linked to appointments)
 * - Prescriptions (linked to consultations)
 * - Orders (medicine orders from pharmacies, test orders from laboratories)
 * - Requests (order_medicine, book_test_visit)
 * - LabReports (linked to orders)
 * - Transactions (payments for appointments, orders)
 * - Reviews (for doctors)
 * - Notifications for patients
 * - Support tickets
 * 
 * Run with: node backend/scripts/seeddata-patient.js
 * 
 * Note: Requires Doctor, Pharmacy, Laboratory to exist (will create if not exist)
 */

require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Pharmacy = require('../models/Pharmacy');
const Laboratory = require('../models/Laboratory');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const Request = require('../models/Request');
const LabReport = require('../models/LabReport');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const Medicine = require('../models/Medicine');
const Test = require('../models/Test');
const WalletTransaction = require('../models/WalletTransaction');
const Admin = require('../models/Admin');
const { APPROVAL_STATUS } = require('../utils/constants');
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

// Helper to get or create providers
const getOrCreateProviders = async () => {
  // Get or create doctors
  let doctors = await Doctor.find({ status: APPROVAL_STATUS.APPROVED }).limit(5);
  if (doctors.length === 0) {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne() || await Admin.create({
      name: 'Super Admin',
      email: 'admin@healiinn.com',
      password: 'Admin@123',
      isSuperAdmin: true,
    });
    
    doctors = [
      await Doctor.create({
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'dr.rajesh@healiinn.com',
        phone: '+91-9876543201',
        password: 'Doctor@123',
        specialization: 'Cardiology',
        gender: 'male',
        licenseNumber: 'DOC-CARD-001',
        status: APPROVAL_STATUS.APPROVED,
        approvedBy: admin._id,
      }),
    ];
  }
  
  // Get or create pharmacy
  let pharmacy = await Pharmacy.findOne({ status: APPROVAL_STATUS.APPROVED });
  if (!pharmacy) {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne() || await Admin.create({
      name: 'Super Admin',
      email: 'admin@healiinn.com',
      password: 'Admin@123',
      isSuperAdmin: true,
    });
    
    pharmacy = await Pharmacy.create({
      pharmacyName: 'City Pharmacy',
      ownerName: 'Pharmacy Owner',
      email: 'pharmacy@healiinn.com',
      phone: '+91-9876543301',
      password: 'Pharmacy@123',
      licenseNumber: 'PHARM-001',
      status: APPROVAL_STATUS.APPROVED,
      approvedBy: admin._id,
    });
  }
  
  // Get or create laboratory
  let laboratory = await Laboratory.findOne({ status: APPROVAL_STATUS.APPROVED });
  if (!laboratory) {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne() || await Admin.create({
      name: 'Super Admin',
      email: 'admin@healiinn.com',
      password: 'Admin@123',
      isSuperAdmin: true,
    });
    
    laboratory = await Laboratory.create({
      labName: 'City Laboratory',
      ownerName: 'Lab Owner',
      email: 'lab@healiinn.com',
      phone: '+91-9876543401',
      password: 'Lab@123',
      licenseNumber: 'LAB-001',
      status: APPROVAL_STATUS.APPROVED,
      approvedBy: admin._id,
    });
  }
  
  return { doctors, pharmacy, laboratory };
};

// Main seed function
const seedPatientData = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Get or create providers
    const { doctors, pharmacy, laboratory } = await getOrCreateProviders();
    
    
    
    // Create placeholder profile images
    const profileImages = [];
    for (let i = 1; i <= 6; i++) {
      const imageUrl = createPlaceholderImage('profiles', `patient_profile_seed_${i}.png`);
      profileImages.push(imageUrl);
    }
    
    const patients = [
      {
        firstName: 'Amit',
        lastName: 'Sharma',
        email: 'amit.sharma@example.com',
        phone: '+91-9876544001',
        password: 'Patient@123',
        dateOfBirth: new Date(1990, 5, 15),
        gender: 'male',
        bloodGroup: 'A+',
        profileImage: profileImages[0],
        address: {
          line1: '123 MG Road',
          line2: 'Near Metro Station',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        emergencyContact: {
          name: 'Priya Sharma',
          phone: '+91-9876544002',
          relation: 'Wife',
        },
        medicalHistory: [
          {
            condition: 'Hypertension',
            notes: 'Controlled with medication',
            diagnosedAt: new Date(2020, 0, 1),
          },
        ],
        allergies: ['Penicillin'],
        isActive: true,
      },
      {
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@example.com',
        phone: '+91-9876544003',
        password: 'Patient@123',
        dateOfBirth: new Date(1992, 8, 20),
        gender: 'female',
        bloodGroup: 'B+',
        profileImage: profileImages[1],
        address: {
          line1: '456 Indiranagar',
          line2: 'Near Metro',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
        },
        emergencyContact: {
          name: 'Amit Patel',
          phone: '+91-9876544004',
          relation: 'Husband',
        },
        medicalHistory: [
          {
            condition: 'Diabetes Type 2',
            notes: 'Well controlled',
            diagnosedAt: new Date(2019, 5, 1),
          },
        ],
        allergies: [],
        isActive: true,
      },
      {
        firstName: 'Rahul',
        lastName: 'Kumar',
        email: 'rahul.kumar@example.com',
        phone: '+91-9876544005',
        password: 'Patient@123',
        dateOfBirth: new Date(1988, 2, 10),
        gender: 'male',
        bloodGroup: 'O+',
        profileImage: profileImages[2],
        address: {
          line1: '789 Koramangala',
          line2: '5th Block',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560095',
          country: 'India',
        },
        emergencyContact: {
          name: 'Sunita Kumar',
          phone: '+91-9876544006',
          relation: 'Mother',
        },
        medicalHistory: [],
        allergies: ['Dust', 'Pollen'],
        isActive: true,
      },
      {
        firstName: 'Sneha',
        lastName: 'Reddy',
        email: 'sneha.reddy@example.com',
        phone: '+91-9876544007',
        password: 'Patient@123',
        dateOfBirth: new Date(1995, 11, 5),
        gender: 'female',
        bloodGroup: 'AB+',
        profileImage: profileImages[3],
        address: {
          line1: '321 Whitefield',
          line2: 'ITPL Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560066',
          country: 'India',
        },
        emergencyContact: {
          name: 'Ravi Reddy',
          phone: '+91-9876544008',
          relation: 'Father',
        },
        medicalHistory: [
          {
            condition: 'Asthma',
            notes: 'Mild, controlled with inhaler',
            diagnosedAt: new Date(2021, 3, 1),
          },
        ],
        allergies: ['Dust'],
        isActive: true,
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@example.com',
        phone: '+91-9876544009',
        password: 'Patient@123',
        dateOfBirth: new Date(1993, 6, 25),
        gender: 'male',
        bloodGroup: 'A-',
        profileImage: profileImages[4],
        address: {
          line1: '555 Jayanagar',
          line2: '4th Block',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560011',
          country: 'India',
        },
        emergencyContact: {
          name: 'Anita Singh',
          phone: '+91-9876544010',
          relation: 'Sister',
        },
        medicalHistory: [],
        allergies: [],
        isActive: true,
      },
      {
        firstName: 'Anjali',
        lastName: 'Gupta',
        email: 'anjali.gupta@example.com',
        phone: '+91-9876544011',
        password: 'Patient@123',
        dateOfBirth: new Date(1991, 4, 12),
        gender: 'female',
        bloodGroup: 'B-',
        profileImage: profileImages[5],
        address: {
          line1: '777 Malleswaram',
          line2: 'Near Temple',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560003',
          country: 'India',
        },
        emergencyContact: {
          name: 'Rajesh Gupta',
          phone: '+91-9876544012',
          relation: 'Husband',
        },
        medicalHistory: [
          {
            condition: 'Migraine',
            notes: 'Occasional episodes',
            diagnosedAt: new Date(2022, 1, 1),
          },
        ],
        allergies: [],
        isActive: true,
      },
    ];
    
    const createdPatients = [];
    for (const patient of patients) {
      const created = await createOrSkip(Patient, patient, 'email');
      createdPatients.push(created);
    }
    
    
    
    // Set favorites for patients
    for (let i = 0; i < createdPatients.length; i++) {
      const patient = createdPatients[i];
      patient.favorites = {
        doctors: doctors.slice(0, 2).map(d => d._id),
        laboratories: [laboratory._id],
        pharmacies: [pharmacy._id],
      };
      await patient.save();
    }
    
    
    
    const appointments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < createdPatients.length && i < doctors.length; i++) {
      const patient = createdPatients[i];
      const doctor = doctors[i % doctors.length];
      
      const appointmentDates = [
        new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // Past - completed
        new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // Past - completed
        new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Future - scheduled
        new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Future - confirmed
      ];
      
      const appointmentStatuses = ['completed', 'completed', 'scheduled', 'confirmed'];
      const times = ['09:00', '10:30', '11:00', '14:00'];
      
      for (let j = 0; j < 4; j++) {
        const appointment = await Appointment.create({
          patientId: patient._id,
          doctorId: doctor._id,
          appointmentDate: appointmentDates[j],
          time: times[j],
          appointmentType: j % 2 === 0 ? 'New' : 'Follow-up',
          status: appointmentStatuses[j],
          reason: 'Regular checkup',
          duration: 20,
          fee: doctor.consultationFee || 500,
          paymentStatus: appointmentStatuses[j] === 'completed' ? 'paid' : appointmentStatuses[j] === 'scheduled' ? 'pending' : 'paid',
          tokenNumber: j + 1,
          queueStatus: appointmentStatuses[j] === 'completed' ? 'completed' : 'waiting',
        });
        appointments.push(appointment);
      }
    }
    
    
    
    
    const consultations = [];
    
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    for (const appointment of completedAppointments) {
      const consultation = await Consultation.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        consultationDate: appointment.appointmentDate,
        status: 'completed',
        diagnosis: 'General health checkup - All parameters normal',
        vitals: {
          bloodPressure: '120/80',
          temperature: '98.6°F',
          heartRate: '72 bpm',
          weight: '70 kg',
          height: '170 cm',
          spo2: '98%',
          bmi: '24.2',
        },
        medications: [
          {
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '3 days',
            instructions: 'Take after meals',
          },
        ],
        investigations: [
          {
            testName: 'Complete Blood Count',
            notes: 'Routine checkup',
          },
        ],
        advice: 'Maintain a healthy diet and exercise regularly.',
      });
      consultations.push(consultation);
      
      appointment.consultationId = consultation._id;
      await appointment.save();
    }
    
    
    
    
    const prescriptions = [];
    
    for (const consultation of consultations) {
      const prescription = await Prescription.create({
        consultationId: consultation._id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        medications: consultation.medications.map(med => ({
          ...med,
          quantity: 10,
        })),
        notes: 'Take medications as prescribed.',
        status: 'active',
        expiryDate: new Date(consultation.consultationDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        sharedWith: [
          {
            pharmacyId: pharmacy._id,
            sharedAt: new Date(),
          },
        ],
      });
      prescriptions.push(prescription);
      
      consultation.prescriptionId = prescription._id;
      await consultation.save();
    }
    
    
    
    
    const medicines = [];
    
    const medicineData = [
      { name: 'Paracetamol 500mg', dosage: '500mg', manufacturer: 'Cipla', price: 25, quantity: 100 },
      { name: 'Amoxicillin 250mg', dosage: '250mg', manufacturer: 'Sun Pharma', price: 45, quantity: 50 },
      { name: 'Azithromycin 500mg', dosage: '500mg', manufacturer: 'Lupin', price: 120, quantity: 30 },
      { name: 'Cetirizine 10mg', dosage: '10mg', manufacturer: 'Dr. Reddy\'s', price: 35, quantity: 80 },
      { name: 'Omeprazole 20mg', dosage: '20mg', manufacturer: 'Torrent', price: 55, quantity: 60 },
    ];
    
    for (const medData of medicineData) {
      let medicine = await Medicine.findOne({ pharmacyId: pharmacy._id, name: medData.name });
      if (!medicine) {
        medicine = await Medicine.create({
          pharmacyId: pharmacy._id,
          ...medData,
        });
      }
      medicines.push(medicine);
    }
    
    
    
    
    const tests = [];
    
    const testData = [
      { name: 'Complete Blood Count (CBC)', description: 'Complete blood count test', price: 300, category: 'Hematology' },
      { name: 'Blood Sugar (Fasting)', description: 'Fasting blood sugar test', price: 150, category: 'Biochemistry' },
      { name: 'Lipid Profile', description: 'Cholesterol and lipid test', price: 400, category: 'Biochemistry' },
      { name: 'Liver Function Test (LFT)', description: 'Liver function test', price: 500, category: 'Biochemistry' },
      { name: 'Thyroid Function Test (TFT)', description: 'Thyroid hormone test', price: 600, category: 'Hormone' },
    ];
    
    for (const testDataItem of testData) {
      let test = await Test.findOne({ laboratoryId: laboratory._id, name: testDataItem.name });
      if (!test) {
        test = await Test.create({
          laboratoryId: laboratory._id,
          ...testDataItem,
        });
      }
      tests.push(test);
    }
    
    
    
    
    const orders = [];
    
    // Medicine orders
    for (let i = 0; i < createdPatients.length && i < 3; i++) {
      const patient = createdPatients[i];
      const prescription = prescriptions[i % prescriptions.length];
      
      const orderItems = [
        {
          name: medicines[0].name,
          quantity: 2,
          price: medicines[0].price,
          total: medicines[0].price * 2,
          medicineId: medicines[0]._id,
        },
        {
          name: medicines[1].name,
          quantity: 1,
          price: medicines[1].price,
          total: medicines[1].price,
          medicineId: medicines[1]._id,
        },
      ];
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
      
      const order = await Order.create({
        patientId: patient._id,
        providerId: pharmacy._id,
        providerType: 'pharmacy',
        prescriptionId: prescription._id,
        items: orderItems,
        totalAmount,
        status: i === 0 ? 'delivered' : i === 1 ? 'ready' : 'processing',
        deliveryOption: i % 2 === 0 ? 'home_delivery' : 'pickup',
        deliveryAddress: patient.address,
        paymentStatus: 'paid',
        paymentMethod: 'razorpay',
        paymentId: `pay_${Date.now()}_${i}`,
        ...(i === 0 && { deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      });
      orders.push(order);
    }
    
    // Test orders
    for (let i = 0; i < createdPatients.length && i < 3; i++) {
      const patient = createdPatients[i];
      const prescription = prescriptions[i % prescriptions.length];
      
      const orderItems = [
        {
          name: tests[0].name,
          quantity: 1,
          price: tests[0].price,
          total: tests[0].price,
          testId: tests[0]._id,
        },
      ];
      
      const order = await Order.create({
        patientId: patient._id,
        providerId: laboratory._id,
        providerType: 'laboratory',
        prescriptionId: prescription._id,
        items: orderItems,
        totalAmount: tests[0].price,
        status: i === 0 ? 'delivered' : i === 1 ? 'ready' : 'accepted',
        deliveryOption: 'pickup',
        paymentStatus: 'paid',
        paymentMethod: 'razorpay',
        paymentId: `pay_${Date.now()}_lab_${i}`,
        ...(i === 0 && { deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
      });
      orders.push(order);
    }
    
    
    
    
    const requests = [];
    
    // Medicine request
    const medicineRequest = await Request.create({
      patientId: createdPatients[0]._id,
      type: 'order_medicine',
      prescriptionId: prescriptions[0]._id,
      patientName: `${createdPatients[0].firstName} ${createdPatients[0].lastName}`,
      patientPhone: createdPatients[0].phone,
      patientEmail: createdPatients[0].email,
      patientAddress: createdPatients[0].address,
      status: 'completed',
      adminResponse: {
        medicines: [
          {
            pharmacyId: pharmacy._id,
            pharmacyName: pharmacy.pharmacyName,
            name: medicines[0].name,
            quantity: 2,
            price: medicines[0].price,
          },
        ],
        totalAmount: medicines[0].price * 2,
        message: 'Medicines available at City Pharmacy',
      },
      paymentStatus: 'paid',
      paymentId: `pay_req_${Date.now()}`,
      orders: [orders[0]._id],
    });
    requests.push(medicineRequest);
    
    // Test request
    const testRequest = await Request.create({
      patientId: createdPatients[1]._id,
      type: 'book_test_visit',
      prescriptionId: prescriptions[1]._id,
      visitType: 'home',
      patientName: `${createdPatients[1].firstName} ${createdPatients[1].lastName}`,
      patientPhone: createdPatients[1].phone,
      patientEmail: createdPatients[1].email,
      patientAddress: createdPatients[1].address,
      status: 'completed',
      adminResponse: {
        tests: [
          {
            labId: laboratory._id,
            labName: laboratory.labName,
            testName: tests[0].name,
            price: tests[0].price,
          },
        ],
        totalAmount: tests[0].price,
        message: 'Test booking confirmed',
      },
      paymentStatus: 'paid',
      paymentId: `pay_req_test_${Date.now()}`,
      orders: [orders[3]._id],
    });
    requests.push(testRequest);
    
    
    
    
    const labReports = [];
    
    const completedLabOrders = orders.filter(o => o.providerType === 'laboratory' && o.status === 'delivered');
    for (const order of completedLabOrders) {
      const labReport = await LabReport.create({
        orderId: order._id,
        patientId: order.patientId,
        laboratoryId: order.providerId,
        prescriptionId: order.prescriptionId,
        testName: order.items[0].name,
        results: [
          {
            parameter: 'Hemoglobin',
            value: '14.5',
            unit: 'g/dL',
            normalRange: '12-16',
            status: 'normal',
          },
          {
            parameter: 'WBC Count',
            value: '7000',
            unit: '/μL',
            normalRange: '4000-11000',
            status: 'normal',
          },
          {
            parameter: 'Platelet Count',
            value: '250000',
            unit: '/μL',
            normalRange: '150000-450000',
            status: 'normal',
          },
        ],
        status: 'completed',
        reportDate: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
        notes: 'All parameters within normal range',
        isShared: true,
        sharedWith: [
          {
            doctorId: order.prescriptionId ? (await Prescription.findById(order.prescriptionId))?.doctorId : doctors[0]._id,
            sharedAt: new Date(),
          },
        ],
      });
      labReports.push(labReport);
    }
    
    
    
    
    const transactions = [];
    
    // Get admin for admin transactions
    let admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      admin = await Admin.create({
        name: 'Super Admin',
        email: 'admin@healiinn.com',
        password: 'Admin@123',
        isSuperAdmin: true,
        isActive: true,
      });
    }
    
    // Appointment transactions
    for (const appointment of completedAppointments) {
      if (appointment.paymentStatus === 'paid') {
        // Patient transaction
        const patientTransaction = await Transaction.create({
          userId: appointment.patientId,
          userType: 'patient',
          type: 'payment',
          amount: appointment.fee,
          status: 'completed',
          description: `Payment for appointment`,
          referenceId: `TXN-APT-${appointment._id.toString().slice(-6)}`,
          category: 'appointment',
          paymentMethod: 'razorpay',
          paymentId: `pay_${Date.now()}_${appointment._id.toString().slice(-6)}`,
          appointmentId: appointment._id,
          metadata: {
            patientId: appointment.patientId,
          },
        });
        transactions.push(patientTransaction);
        
        // Admin transaction (payment received)
        const adminTransaction = await Transaction.create({
          userId: admin._id,
          userType: 'admin',
          type: 'payment',
          amount: appointment.fee,
          status: 'completed',
          description: `Appointment payment received from patient`,
          referenceId: `TXN-ADM-APT-${appointment._id.toString().slice(-6)}`,
          category: 'appointment',
          paymentMethod: 'razorpay',
          paymentId: patientTransaction.paymentId,
          appointmentId: appointment._id,
          metadata: {
            patientId: appointment.patientId,
          },
        });
        transactions.push(adminTransaction);
        
        // Doctor wallet transaction (earning)
        const { earning } = calculateProviderEarning(appointment.fee, 'doctor');
        
        // Calculate current balance
        const existingEarnings = await WalletTransaction.aggregate([
          {
            $match: {
              userId: appointment.doctorId,
              userType: 'doctor',
              type: 'earning',
              status: 'completed',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        
        const existingWithdrawals = await WalletTransaction.aggregate([
          {
            $match: {
              userId: appointment.doctorId,
              userType: 'doctor',
              type: 'withdrawal',
              status: 'completed',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        
        const currentBalance = (existingEarnings[0]?.total || 0) - (existingWithdrawals[0]?.total || 0);
        const newBalance = currentBalance + earning;
        
        await WalletTransaction.create({
          userId: appointment.doctorId,
          userType: 'doctor',
          type: 'earning',
          amount: earning,
          balance: newBalance,
          status: 'completed',
          description: `Earning from appointment #${appointment._id.toString().slice(-6)}`,
          referenceId: `APT-${appointment._id.toString().slice(-6)}`,
          appointmentId: appointment._id,
        });
      }
    }
    
    // Order transactions
    for (const order of orders) {
      if (order.paymentStatus === 'paid') {
        // Patient transaction
        const patientTransaction = await Transaction.create({
          userId: order.patientId,
          userType: 'patient',
          type: 'payment',
          amount: order.totalAmount,
          status: 'completed',
          description: `Payment for ${order.providerType} order`,
          referenceId: `TXN-ORD-${order._id.toString().slice(-6)}`,
          category: order.providerType === 'pharmacy' ? 'medicine' : 'test',
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
          userId: admin._id,
          userType: 'admin',
          type: 'payment',
          amount: order.totalAmount,
          status: 'completed',
          description: `${order.providerType} order payment received from patient`,
          referenceId: `TXN-ADM-ORD-${order._id.toString().slice(-6)}`,
          category: order.providerType === 'pharmacy' ? 'medicine' : 'test',
          paymentMethod: order.paymentMethod || 'razorpay',
          paymentId: order.paymentId,
          orderId: order._id,
          metadata: {
            patientId: order.patientId,
          },
        });
        transactions.push(adminTransaction);
        
        // Provider wallet transaction (earning)
        const { earning } = calculateProviderEarning(order.totalAmount, order.providerType);
        
        // Calculate current balance
        const existingEarnings = await WalletTransaction.aggregate([
          {
            $match: {
              userId: order.providerId,
              userType: order.providerType,
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
              userType: order.providerType,
              type: 'withdrawal',
              status: 'completed',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        
        const currentBalance = (existingEarnings[0]?.total || 0) - (existingWithdrawals[0]?.total || 0);
        const newBalance = currentBalance + earning;
        
        await WalletTransaction.create({
          userId: order.providerId,
          userType: order.providerType,
          type: 'earning',
          amount: earning,
          balance: newBalance,
          status: 'completed',
          description: `Earning from ${order.providerType} order #${order._id.toString().slice(-6)}`,
          referenceId: `ORD-${order._id.toString().slice(-6)}`,
          orderId: order._id,
        });
      }
    }
    
    
    
    
    const reviews = [];
    
    for (let i = 0; i < completedAppointments.length && i < 5; i++) {
      const appointment = completedAppointments[i];
      const rating = [5, 4, 5, 4, 5][i % 5];
      const comments = [
        'Excellent doctor, very patient and understanding.',
        'Good consultation, helpful advice.',
        'Best doctor I have consulted. Highly recommended!',
        'Professional and knowledgeable.',
        'Great experience, will visit again.',
      ];
      
      const review = await Review.create({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        rating,
        comment: comments[i % comments.length],
        status: 'approved',
      });
      reviews.push(review);
    }
    
    
    
    
    const notifications = [];
    
    for (const patient of createdPatients) {
      const patientNotifications = [
        {
          userId: patient._id,
          userType: 'patient',
          type: 'appointment',
          title: 'Appointment Confirmed',
          message: 'Your appointment has been confirmed.',
          priority: 'medium',
          read: false,
        },
        {
          userId: patient._id,
          userType: 'patient',
          type: 'prescription',
          title: 'Prescription Ready',
          message: 'Your prescription is ready for download.',
          priority: 'high',
          read: false,
        },
        {
          userId: patient._id,
          userType: 'patient',
          type: 'order',
          title: 'Order Status Update',
          message: 'Your order status has been updated.',
          priority: 'medium',
          read: true,
          readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
        {
          userId: patient._id,
          userType: 'patient',
          type: 'report',
          title: 'Lab Report Ready',
          message: 'Your lab report is ready for download.',
          priority: 'high',
          read: false,
        },
      ];
      
      for (const notification of patientNotifications) {
        await Notification.create(notification);
        notifications.push(notification);
      }
    }
    
    
    
    
    const supportTickets = [];
    
    for (let i = 0; i < createdPatients.length && i < 2; i++) {
      const patient = createdPatients[i];
      const ticket = await SupportTicket.create({
        userId: patient._id,
        userType: 'patient',
        subject: `Support Request ${i + 1}`,
        message: `I need help with ${i === 0 ? 'appointment booking' : 'prescription access'}.`,
        status: i === 0 ? 'open' : 'in_progress',
        priority: i === 0 ? 'high' : 'medium',
      });
      supportTickets.push(ticket);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding patient data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedPatientData();

