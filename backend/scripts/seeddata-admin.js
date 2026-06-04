/**
 * Seed Data Script for Admin Module
 * 
 * This script seeds the database with:
 * - Admin users (super admin + regular admins)
 * - AdminSettings (platform settings, payment settings, notification settings)
 * - Specialty records (Cardiology, Dermatology, Pediatrics, etc.)
 * - Support tickets from all user types
 * - Notifications for admin
 * 
 * Run with: node backend/scripts/seeddata-admin.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Admin = require('../models/Admin');
const AdminSettings = require('../models/AdminSettings');
const Specialty = require('../models/Specialty');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Pharmacy = require('../models/Pharmacy');
const Laboratory = require('../models/Laboratory');
const { APPROVAL_STATUS } = require('../utils/constants');

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
const createOrSkip = async (Model, data, identifier = 'name') => {
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

// Main seed function
const seedAdminData = async () => {
  try {
    
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (uncomment if needed)
    // await Admin.deleteMany({});
    // await AdminSettings.deleteMany({});
    // await Specialty.deleteMany({});
    // await SupportTicket.deleteMany({});
    // await Notification.deleteMany({ userType: 'admin' });
    
    
    
    // Create placeholder profile images for admins
    const adminProfileImages = [];
    for (let i = 1; i <= 3; i++) {
      const imageUrl = createPlaceholderImage('profiles', `admin_profile_seed_${i}.png`);
      adminProfileImages.push(imageUrl);
    }
    
    // Create platform logo
    const platformLogo = createPlaceholderImage('images', 'platform_logo_seed.png');
    
    // Create Super Admin
    const superAdmin = await createOrSkip(Admin, {
      name: 'Super Admin',
      email: 'superadmin@healiinn.com',
      phone: '+91-9876543210',
      password: 'Admin@123', // Will be hashed by pre-save hook
      isSuperAdmin: true,
      permissions: ['all'],
      isActive: true,
      profileImage: adminProfileImages[0],
    }, 'email');
    
    // Create Regular Admins
    const admin1 = await createOrSkip(Admin, {
      name: 'Admin User 1',
      email: 'admin1@healiinn.com',
      phone: '+91-9876543211',
      password: 'Admin@123',
      isSuperAdmin: false,
      permissions: ['users', 'appointments', 'orders'],
      isActive: true,
      profileImage: adminProfileImages[1],
    }, 'email');
    
    const admin2 = await createOrSkip(Admin, {
      name: 'Admin User 2',
      email: 'admin2@healiinn.com',
      phone: '+91-9876543212',
      password: 'Admin@123',
      isSuperAdmin: false,
      permissions: ['support', 'settings', 'revenue'],
      isActive: true,
      profileImage: adminProfileImages[2],
    }, 'email');
    
    
    
    // Create or get AdminSettings
    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        autoVerifyDoctors: false,
        autoVerifyPharmacies: false,
        autoVerifyLaboratories: false,
        requireTwoFactor: false,
        maintenanceMode: false,
        maintenanceMessage: '',
        platformSettings: {
          name: 'Healiinn',
          logo: platformLogo,
          primaryColor: '#4F46E5',
          secondaryColor: '#10B981',
          contactEmail: 'contact@healiinn.com',
          contactPhone: '+91-1800-123-4567',
          supportEmail: 'support@healiinn.com',
        },
        paymentSettings: {
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
          razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
          commissionRate: {
            doctor: 0.1, // 10%
            pharmacy: 0.1, // 10%
            laboratory: 0.2, // 20%
            nurse: 0.2, // 20%
          },
        },
        notificationSettings: {
          appointmentReminder: true,
          orderStatusUpdate: true,
          paymentConfirmation: true,
          prescriptionReady: true,
          reportReady: true,
        },
      });
      
    } else {
      
    }
    
    
    
    const specialties = [
      { name: 'Cardiology', description: 'Heart and cardiovascular system', icon: 'heart', doctorCount: 0 },
      { name: 'Dermatology', description: 'Skin, hair, and nails', icon: 'skin', doctorCount: 0 },
      { name: 'Pediatrics', description: 'Children\'s health', icon: 'child', doctorCount: 0 },
      { name: 'Orthopedics', description: 'Bones, joints, and muscles', icon: 'bone', doctorCount: 0 },
      { name: 'Neurology', description: 'Brain and nervous system', icon: 'brain', doctorCount: 0 },
      { name: 'Gynecology', description: 'Women\'s reproductive health', icon: 'female', doctorCount: 0 },
      { name: 'General Medicine', description: 'General health and wellness', icon: 'medical', doctorCount: 0 },
      { name: 'Psychiatry', description: 'Mental health and behavioral disorders', icon: 'mind', doctorCount: 0 },
      { name: 'Ophthalmology', description: 'Eye care and vision', icon: 'eye', doctorCount: 0 },
      { name: 'ENT', description: 'Ear, Nose, and Throat', icon: 'ear', doctorCount: 0 },
      { name: 'Gastroenterology', description: 'Digestive system', icon: 'stomach', doctorCount: 0 },
      { name: 'Pulmonology', description: 'Lungs and respiratory system', icon: 'lungs', doctorCount: 0 },
      { name: 'Endocrinology', description: 'Hormones and metabolism', icon: 'hormone', doctorCount: 0 },
      { name: 'Oncology', description: 'Cancer treatment', icon: 'cancer', doctorCount: 0 },
      { name: 'Urology', description: 'Urinary tract and male reproductive system', icon: 'urinary', doctorCount: 0 },
    ];
    
    const createdSpecialties = [];
    for (const specialty of specialties) {
      const created = await createOrSkip(Specialty, specialty, 'name');
      createdSpecialties.push(created);
    }
    
    
    
    // Get some users for support tickets (create if they don't exist)
    let patient = await Patient.findOne();
    let doctor = await Doctor.findOne();
    let pharmacy = await Pharmacy.findOne();
    let laboratory = await Laboratory.findOne();
    
    // Create dummy users if they don't exist (for support tickets)
    if (!patient) {
      patient = await Patient.create({
        firstName: 'Test',
        lastName: 'Patient',
        email: 'testpatient@example.com',
        phone: '+91-9999999999',
        password: 'Patient@123',
      });
    }
    
    if (!doctor) {
      doctor = await Doctor.create({
        firstName: 'Test',
        lastName: 'Doctor',
        email: 'testdoctor@example.com',
        phone: '+91-9999999998',
        password: 'Doctor@123',
        specialization: 'General Medicine',
        gender: 'male',
        licenseNumber: 'TEST-DOC-001',
        status: APPROVAL_STATUS.APPROVED,
      });
    }
    
    if (!pharmacy) {
      pharmacy = await Pharmacy.create({
        pharmacyName: 'Test Pharmacy',
        ownerName: 'Test Owner',
        email: 'testpharmacy@example.com',
        phone: '+91-9999999997',
        password: 'Pharmacy@123',
        licenseNumber: 'TEST-PHARM-001',
        status: APPROVAL_STATUS.APPROVED,
      });
    }
    
    if (!laboratory) {
      laboratory = await Laboratory.create({
        labName: 'Test Laboratory',
        ownerName: 'Test Owner',
        email: 'testlab@example.com',
        phone: '+91-9999999996',
        password: 'Lab@123',
        licenseNumber: 'TEST-LAB-001',
        status: APPROVAL_STATUS.APPROVED,
      });
    }
    
    const supportTickets = [
      {
        userId: patient._id,
        userType: 'patient',
        subject: 'Unable to book appointment',
        message: 'I am having trouble booking an appointment with a doctor. The payment is not going through.',
        status: 'open',
        priority: 'high',
      },
      {
        userId: patient._id,
        userType: 'patient',
        subject: 'Prescription not received',
        message: 'I completed my consultation but did not receive the prescription. Please help.',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: admin1._id,
      },
      {
        userId: doctor._id,
        userType: 'doctor',
        subject: 'Wallet withdrawal issue',
        message: 'My withdrawal request has been pending for more than 5 days. Please process it.',
        status: 'open',
        priority: 'high',
      },
      {
        userId: pharmacy._id,
        userType: 'pharmacy',
        subject: 'Order status update',
        message: 'I need help updating the order status for a patient order.',
        status: 'resolved',
        priority: 'low',
        assignedTo: admin2._id,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: laboratory._id,
        userType: 'laboratory',
        subject: 'Report upload issue',
        message: 'I am unable to upload lab reports. The file upload is failing.',
        status: 'open',
        priority: 'medium',
      },
      {
        userId: patient._id,
        userType: 'patient',
        subject: 'Lab report not accessible',
        message: 'I cannot access my lab report that was uploaded yesterday.',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: admin1._id,
      },
    ];
    
    for (const ticket of supportTickets) {
      await createOrSkip(SupportTicket, ticket, '_id');
    }
    
    
    
    
    const notifications = [
      {
        userId: superAdmin._id,
        userType: 'admin',
        type: 'system',
        title: 'New Doctor Registration',
        message: 'A new doctor has registered and is awaiting approval.',
        priority: 'medium',
        read: false,
      },
      {
        userId: superAdmin._id,
        userType: 'admin',
        type: 'system',
        title: 'New Pharmacy Registration',
        message: 'A new pharmacy has registered and is awaiting approval.',
        priority: 'medium',
        read: false,
      },
      {
        userId: admin1._id,
        userType: 'admin',
        type: 'support',
        title: 'New Support Ticket',
        message: 'A new support ticket has been created by a patient.',
        priority: 'high',
        read: false,
      },
      {
        userId: admin2._id,
        userType: 'admin',
        type: 'system',
        title: 'Withdrawal Request',
        message: 'A doctor has requested a wallet withdrawal.',
        priority: 'medium',
        read: true,
        readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ];
    
    for (const notification of notifications) {
      await Notification.create(notification);
    }
    
    
    
    
    
    
    
    
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAdminData();

