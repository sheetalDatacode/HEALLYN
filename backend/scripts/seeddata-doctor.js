/**
 * Seed Data Script for Doctor Module
 * 
 * This script seeds the database with:
 * - Multiple doctors with different specializations (approved, pending, rejected statuses)
 * - Doctor profiles with complete clinic details, availability, education, languages
 * - Sessions (scheduled, live, completed, cancelled)
 * - Appointments (scheduled, confirmed, completed, cancelled) linked to patients
 * - Consultations linked to appointments
 * - Prescriptions linked to consultations
 * - Reviews from patients
 * - WalletTransactions (earnings from appointments)
 * - WithdrawalRequests (pending, approved, paid, rejected)
 * - Notifications for doctors
 * 
 * Run with: node backend/scripts/seeddata-doctor.js
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
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Session = require('../models/Session');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Review = require('../models/Review');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const { APPROVAL_STATUS, SESSION_STATUS, WITHDRAWAL_STATUS } = require('../utils/constants');
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
    let patient = await Patient.findOne({ email: `patient${i}@example.com` });
    if (!patient) {
      patient = await Patient.create({
        firstName: `Patient${i}`,
        lastName: 'User',
        email: `patient${i}@example.com`,
        phone: `+91-9876543${String(100 + i).slice(-3)}`,
        password: 'Patient@123',
        dateOfBirth: new Date(1990 + i, 0, 1),
        gender: i % 2 === 0 ? 'female' : 'male',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4],
        address: {
          line1: `${100 + i} Main Street`,
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
const seedDoctorData = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Get or create admin
    const admin = await getOrCreateAdmin();
    
    
    
    // Create placeholder profile images for doctors
    const profileImages = [];
    const signatureImages = [];
    for (let i = 1; i <= 7; i++) {
      const profileUrl = createPlaceholderImage('profiles', `doctor_profile_seed_${i}.png`);
      const signatureUrl = createPlaceholderImage('profiles', `doctor_signature_seed_${i}.png`);
      profileImages.push(profileUrl);
      signatureImages.push(signatureUrl);
    }
    
    const doctors = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'dr.rajesh@healiinn.com',
        phone: '+91-9876543201',
        password: 'Doctor@123',
        specialization: 'Cardiology',
        gender: 'male',
        licenseNumber: 'DOC-CARD-001',
        experienceYears: 15,
        qualification: 'MBBS, MD (Cardiology)',
        profileImage: profileImages[0],
        digitalSignature: signatureImages[0],
        education: [
          { institution: 'AIIMS Delhi', degree: 'MBBS', year: 2005 },
          { institution: 'AIIMS Delhi', degree: 'MD Cardiology', year: 2010 },
        ],
        languages: ['Hindi', 'English'],
        consultationModes: ['in_person', 'call'],
        clinicDetails: {
          name: 'Heart Care Clinic',
          address: {
            line1: '123 MG Road',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.5946, 12.9716], // [lng, lat]
          },
          locationSource: 'gps',
        },
        bio: 'Experienced cardiologist with 15 years of practice. Specialized in heart diseases and preventive cardiology.',
        consultationFee: 800,
        averageConsultationMinutes: 20,
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '13:00' },
          { day: 'Tuesday', startTime: '09:00', endTime: '13:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '13:00' },
          { day: 'Thursday', startTime: '09:00', endTime: '13:00' },
          { day: 'Friday', startTime: '09:00', endTime: '13:00' },
        ],
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.5,
        isActive: true,
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'dr.priya@healiinn.com',
        phone: '+91-9876543202',
        password: 'Doctor@123',
        specialization: 'Dermatology',
        gender: 'female',
        licenseNumber: 'DOC-DERM-001',
        profileImage: profileImages[1],
        digitalSignature: signatureImages[1],
        experienceYears: 10,
        qualification: 'MBBS, MD (Dermatology)',
        education: [
          { institution: 'Kasturba Medical College', degree: 'MBBS', year: 2010 },
          { institution: 'AIIMS Delhi', degree: 'MD Dermatology', year: 2015 },
        ],
        languages: ['Hindi', 'English', 'Kannada'],
        consultationModes: ['in_person', 'call', 'chat'],
        clinicDetails: {
          name: 'Skin Care Clinic',
          address: {
            line1: '456 Brigade Road',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560025',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.6100, 12.9716],
          },
          locationSource: 'gps',
        },
        bio: 'Expert dermatologist specializing in skin diseases, cosmetic dermatology, and hair disorders.',
        consultationFee: 600,
        averageConsultationMinutes: 15,
        availability: [
          { day: 'Monday', startTime: '10:00', endTime: '14:00' },
          { day: 'Wednesday', startTime: '10:00', endTime: '14:00' },
          { day: 'Friday', startTime: '10:00', endTime: '14:00' },
          { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
        ],
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.7,
        isActive: true,
      },
      {
        firstName: 'Amit',
        lastName: 'Patel',
        email: 'dr.amit@healiinn.com',
        phone: '+91-9876543203',
        password: 'Doctor@123',
        specialization: 'Pediatrics',
        gender: 'male',
        licenseNumber: 'DOC-PED-001',
        profileImage: profileImages[2],
        digitalSignature: signatureImages[2],
        experienceYears: 12,
        qualification: 'MBBS, MD (Pediatrics)',
        education: [
          { institution: 'Bangalore Medical College', degree: 'MBBS', year: 2008 },
          { institution: 'AIIMS Delhi', degree: 'MD Pediatrics', year: 2013 },
        ],
        languages: ['Hindi', 'English', 'Kannada'],
        consultationModes: ['in_person', 'call'],
        clinicDetails: {
          name: 'Kids Care Clinic',
          address: {
            line1: '789 Indiranagar',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.6400, 12.9784],
          },
          locationSource: 'gps',
        },
        bio: 'Pediatrician with expertise in child health, development, and common childhood illnesses.',
        consultationFee: 500,
        averageConsultationMinutes: 20,
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00' },
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
          { day: 'Friday', startTime: '09:00', endTime: '17:00' },
        ],
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.8,
        isActive: true,
      },
      {
        firstName: 'Sunita',
        lastName: 'Reddy',
        email: 'dr.sunita@healiinn.com',
        phone: '+91-9876543204',
        password: 'Doctor@123',
        specialization: 'Gynecology',
        gender: 'female',
        licenseNumber: 'DOC-GYN-001',
        profileImage: profileImages[3],
        digitalSignature: signatureImages[3],
        experienceYears: 18,
        qualification: 'MBBS, MD (Gynecology)',
        education: [
          { institution: 'Osmania Medical College', degree: 'MBBS', year: 2002 },
          { institution: 'AIIMS Delhi', degree: 'MD Gynecology', year: 2007 },
        ],
        languages: ['Hindi', 'English', 'Telugu'],
        consultationModes: ['in_person', 'call'],
        clinicDetails: {
          name: 'Women\'s Health Clinic',
          address: {
            line1: '321 Koramangala',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560095',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.6270, 12.9352],
          },
          locationSource: 'gps',
        },
        bio: 'Senior gynecologist with extensive experience in women\'s health and reproductive medicine.',
        consultationFee: 700,
        averageConsultationMinutes: 25,
        availability: [
          { day: 'Monday', startTime: '10:00', endTime: '14:00' },
          { day: 'Tuesday', startTime: '10:00', endTime: '14:00' },
          { day: 'Thursday', startTime: '10:00', endTime: '14:00' },
          { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
        ],
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.6,
        isActive: true,
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'dr.vikram@healiinn.com',
        phone: '+91-9876543205',
        password: 'Doctor@123',
        specialization: 'General Medicine',
        gender: 'male',
        licenseNumber: 'DOC-GEN-001',
        profileImage: profileImages[4],
        digitalSignature: signatureImages[4],
        experienceYears: 20,
        qualification: 'MBBS, MD (General Medicine)',
        education: [
          { institution: 'Grant Medical College', degree: 'MBBS', year: 2000 },
          { institution: 'AIIMS Delhi', degree: 'MD General Medicine', year: 2005 },
        ],
        languages: ['Hindi', 'English'],
        consultationModes: ['in_person', 'call', 'audio'],
        clinicDetails: {
          name: 'General Medicine Clinic',
          address: {
            line1: '555 Whitefield',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560066',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.7498, 12.9698],
          },
          locationSource: 'gps',
        },
        bio: 'Experienced general physician providing comprehensive primary healthcare services.',
        consultationFee: 400,
        averageConsultationMinutes: 15,
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '18:00' },
          { day: 'Tuesday', startTime: '09:00', endTime: '18:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '18:00' },
          { day: 'Thursday', startTime: '09:00', endTime: '18:00' },
          { day: 'Friday', startTime: '09:00', endTime: '18:00' },
          { day: 'Saturday', startTime: '09:00', endTime: '13:00' },
        ],
        status: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        approvedBy: admin._id,
        rating: 4.4,
        isActive: true,
      },
      {
        firstName: 'Neha',
        lastName: 'Gupta',
        email: 'dr.neha@healiinn.com',
        phone: '+91-9876543206',
        password: 'Doctor@123',
        specialization: 'Orthopedics',
        gender: 'female',
        licenseNumber: 'DOC-ORTH-001',
        profileImage: profileImages[5],
        digitalSignature: signatureImages[5],
        experienceYears: 14,
        qualification: 'MBBS, MS (Orthopedics)',
        education: [
          { institution: 'Kasturba Medical College', degree: 'MBBS', year: 2006 },
          { institution: 'AIIMS Delhi', degree: 'MS Orthopedics', year: 2011 },
        ],
        languages: ['Hindi', 'English'],
        consultationModes: ['in_person', 'call'],
        clinicDetails: {
          name: 'Bone & Joint Clinic',
          address: {
            line1: '888 Jayanagar',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560011',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.5800, 12.9279],
          },
          locationSource: 'gps',
        },
        bio: 'Orthopedic surgeon specializing in joint replacement, sports medicine, and fracture treatment.',
        consultationFee: 900,
        averageConsultationMinutes: 30,
        availability: [
          { day: 'Monday', startTime: '10:00', endTime: '14:00' },
          { day: 'Wednesday', startTime: '10:00', endTime: '14:00' },
          { day: 'Friday', startTime: '10:00', endTime: '14:00' },
        ],
        status: APPROVAL_STATUS.PENDING,
        rating: 0,
        isActive: true,
      },
      {
        firstName: 'Ramesh',
        lastName: 'Iyer',
        email: 'dr.ramesh@healiinn.com',
        phone: '+91-9876543207',
        password: 'Doctor@123',
        specialization: 'Neurology',
        gender: 'male',
        licenseNumber: 'DOC-NEURO-001',
        profileImage: profileImages[6],
        digitalSignature: signatureImages[6],
        experienceYears: 16,
        qualification: 'MBBS, MD (Neurology)',
        education: [
          { institution: 'Madras Medical College', degree: 'MBBS', year: 2004 },
          { institution: 'AIIMS Delhi', degree: 'MD Neurology', year: 2009 },
        ],
        languages: ['Hindi', 'English', 'Tamil'],
        consultationModes: ['in_person', 'call'],
        clinicDetails: {
          name: 'Neuro Care Clinic',
          address: {
            line1: '222 Malleswaram',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560003',
            country: 'India',
          },
          location: {
            type: 'Point',
            coordinates: [77.5700, 13.0049],
          },
          locationSource: 'gps',
        },
        bio: 'Neurologist with expertise in brain disorders, epilepsy, and stroke management.',
        consultationFee: 1000,
        averageConsultationMinutes: 30,
        availability: [
          { day: 'Tuesday', startTime: '10:00', endTime: '14:00' },
          { day: 'Thursday', startTime: '10:00', endTime: '14:00' },
          { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
        ],
        status: APPROVAL_STATUS.REJECTED,
        rejectionReason: 'Incomplete documentation',
        rating: 0,
        isActive: false,
      },
    ];
    
    const createdDoctors = [];
    for (const doctor of doctors) {
      const created = await createOrSkip(Doctor, doctor, 'email');
      createdDoctors.push(created);
    }
    
    // Get approved doctors for further data creation
    const approvedDoctors = createdDoctors.filter(d => d.status === APPROVAL_STATUS.APPROVED);
    
    
    const patients = await getOrCreatePatients(10);
    
    
    const sessions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < approvedDoctors.length && i < 3; i++) {
      const doctor = approvedDoctors[i];
      
      // Create sessions for different dates
      const sessionDates = [
        new Date(today.getTime() + i * 24 * 60 * 60 * 1000), // Today + i days
        new Date(today.getTime() + (i + 7) * 24 * 60 * 60 * 1000), // Next week
      ];
      
      for (const sessionDate of sessionDates) {
        const session = await Session.create({
          doctorId: doctor._id,
          date: sessionDate,
          sessionStartTime: '09:00',
          sessionEndTime: '13:00',
          maxTokens: 20,
          status: sessionDate < today ? SESSION_STATUS.COMPLETED : SESSION_STATUS.SCHEDULED,
          currentToken: sessionDate < today ? 15 : 0,
          appointments: [],
        });
        sessions.push(session);
        
      }
    }
    
    
    const appointments = [];
    
    for (let i = 0; i < approvedDoctors.length && i < 3; i++) {
      const doctor = approvedDoctors[i];
      const session = sessions[i * 2] || sessions[0];
      const patient = patients[i % patients.length];
      
      const appointmentStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
      const appointmentDates = [
        new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // Past
        new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // Past
        new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Future
        new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // Future
      ];
      
      for (let j = 0; j < 4; j++) {
        const status = appointmentStatuses[j];
        const appointmentDate = appointmentDates[j];
        const time = ['09:00', '10:00', '11:00', '12:00'][j];
        
        const appointment = await Appointment.create({
          patientId: patient._id,
          doctorId: doctor._id,
          sessionId: session._id,
          appointmentDate,
          time,
          appointmentType: j % 2 === 0 ? 'New' : 'Follow-up',
          status,
          reason: 'Regular checkup',
          duration: doctor.averageConsultationMinutes || 20,
          fee: doctor.consultationFee || 500,
          paymentStatus: status === 'completed' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
          tokenNumber: j + 1,
          queueStatus: status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'waiting',
        });
        appointments.push(appointment);
        
        // Update session appointments array
        session.appointments.push(appointment._id);
        await session.save();
      }
    }
    
    
    
    
    const consultations = [];
    
    // Create consultations for completed appointments
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
        advice: 'Maintain a healthy diet and exercise regularly. Follow up in 2 weeks if symptoms persist.',
        followUpDate: new Date(appointment.appointmentDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      });
      consultations.push(consultation);
      
      // Update appointment with consultation ID
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
        notes: 'Take medications as prescribed. Complete the full course.',
        status: 'active',
        expiryDate: new Date(consultation.consultationDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      });
      prescriptions.push(prescription);
      
      // Update consultation with prescription ID
      consultation.prescriptionId = prescription._id;
      await consultation.save();
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
    
    
    
    
    const walletTransactions = [];
    
    // Calculate earnings for completed appointments
    for (const appointment of completedAppointments) {
      if (appointment.paymentStatus === 'paid') {
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
        
        const walletTransaction = await WalletTransaction.create({
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
        walletTransactions.push(walletTransaction);
      }
    }
    
    
    
    
    const withdrawalRequests = [];
    
    for (let i = 0; i < approvedDoctors.length && i < 3; i++) {
      const doctor = approvedDoctors[i];
      
      const withdrawalStatuses = [WITHDRAWAL_STATUS.PENDING, WITHDRAWAL_STATUS.APPROVED, WITHDRAWAL_STATUS.PAID];
      const amounts = [5000, 10000, 15000];
      
      for (let j = 0; j < 3; j++) {
        const status = withdrawalStatuses[j];
        const amount = amounts[j];
        
        const withdrawalRequest = await WithdrawalRequest.create({
          userId: doctor._id,
          userType: 'doctor',
          amount,
          payoutMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: `123456789${i}${j}`,
              ifscCode: 'HDFC0001234',
              bankName: 'HDFC Bank',
              accountHolderName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            },
          },
          status,
          ...(status === WITHDRAWAL_STATUS.APPROVED && {
            approvedAt: new Date(Date.now() - (3 - j) * 24 * 60 * 60 * 1000),
            processedBy: admin._id,
          }),
          ...(status === WITHDRAWAL_STATUS.PAID && {
            approvedAt: new Date(Date.now() - (5 - j) * 24 * 60 * 60 * 1000),
            processedAt: new Date(Date.now() - (4 - j) * 24 * 60 * 60 * 1000),
            processedBy: admin._id,
            payoutReference: `TXN-${Date.now()}-${i}-${j}`,
          }),
        });
        withdrawalRequests.push(withdrawalRequest);
        
        // Create withdrawal wallet transaction for paid requests
        if (status === WITHDRAWAL_STATUS.PAID) {
          const existingEarnings = await WalletTransaction.aggregate([
            {
              $match: {
                userId: doctor._id,
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
                userId: doctor._id,
                userType: 'doctor',
                type: 'withdrawal',
                status: 'completed',
              },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]);
          
          const currentBalance = (existingEarnings[0]?.total || 0) - (existingWithdrawals[0]?.total || 0);
          const newBalance = currentBalance - amount;
          
          await WalletTransaction.create({
            userId: doctor._id,
            userType: 'doctor',
            type: 'withdrawal',
            amount,
            balance: newBalance,
            status: 'completed',
            description: `Withdrawal request #${withdrawalRequest._id.toString().slice(-6)}`,
            referenceId: `WD-${withdrawalRequest._id.toString().slice(-6)}`,
            withdrawalRequestId: withdrawalRequest._id,
          });
        }
      }
    }
    
    
    
    
    const transactions = [];
    
    // Get admin for admin transactions
    let adminForTransactions = await Admin.findOne({ isActive: true });
    if (!adminForTransactions) {
      adminForTransactions = admin;
    }
    
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
          userId: adminForTransactions._id,
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
      }
    }
    
    
    
    
    const notifications = [];
    
    for (const doctor of approvedDoctors) {
      const doctorNotifications = [
        {
          userId: doctor._id,
          userType: 'doctor',
          type: 'appointment',
          title: 'New Appointment Booked',
          message: 'A new appointment has been booked for tomorrow.',
          priority: 'medium',
          read: false,
        },
        {
          userId: doctor._id,
          userType: 'doctor',
          type: 'consultation',
          title: 'Consultation Completed',
          message: 'Your consultation has been marked as completed.',
          priority: 'low',
          read: true,
          readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          userId: doctor._id,
          userType: 'doctor',
          type: 'wallet',
          title: 'Earning Credited',
          message: 'Your earning from appointment has been credited to wallet.',
          priority: 'medium',
          read: false,
        },
        {
          userId: doctor._id,
          userType: 'doctor',
          type: 'withdrawal',
          title: 'Withdrawal Request Approved',
          message: 'Your withdrawal request has been approved and will be processed soon.',
          priority: 'high',
          read: false,
        },
      ];
      
      for (const notification of doctorNotifications) {
        await Notification.create(notification);
        notifications.push(notification);
      }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctor data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDoctorData();

