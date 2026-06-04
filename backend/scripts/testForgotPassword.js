/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const PasswordResetToken = require('../models/PasswordResetToken');
const { ROLES } = require('../utils/constants');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.SMOKE_TEST_BASE_URL || `http://localhost:${PORT}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const newClient = () =>
  axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true,
  });

const client = newClient();

const randomString = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
const randomPhone = (prefix = '9') => `${prefix}${crypto.randomInt(100000000, 999999999)}`;

const waitForServer = async () => {
  const maxAttempts = Number(process.env.SMOKE_TEST_MAX_ATTEMPTS) || 30;
  const delayMs = Number(process.env.SMOKE_TEST_RETRY_DELAY_MS) || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await client.get('/health');
      if (response.status >= 200 && response.status < 500) {
        
        return true;
      }
    } catch (error) {
      // ignore, server may still be booting
    }

    
    await sleep(delayMs);
  }

  throw new Error(`API not reachable at ${BASE_URL} after ${maxAttempts} attempts`);
};

const ROLE_FLOW = [
  {
    role: ROLES.PATIENT,
    label: 'Patient',
    basePath: '/api/patients/auth',
    signupBody: (email) => ({
      name: 'Forgot Patient',
      email,
      phone: randomPhone('9'),
      password: 'InitialPass123!',
      gender: 'other',
      bloodGroup: 'O+',
    }),
  },
  {
    role: ROLES.DOCTOR,
    label: 'Doctor',
    basePath: '/api/doctors/auth',
    signupBody: (email) => ({
      name: 'Forgot Doctor',
      email,
      phone: randomPhone('7'),
      password: 'InitialPass123!',
      specialization: 'General Physician',
      licenseNumber: randomString('DOC'),
      experienceYears: 3,
      gender: 'male',
      clinicName: 'Forgot Clinic',
      clinicAddress: {
        line1: '12 Health Avenue',
        city: 'Test City',
        state: 'TS',
        postalCode: '410010',
        country: 'India',
      },
      clinicCoordinates: [77.5946, 12.9716],
    }),
  },
  {
    role: ROLES.LABORATORY,
    label: 'Laboratory',
    basePath: '/api/laboratories/auth',
    signupBody: (email) => ({
      labName: 'Forgot Lab',
      ownerName: 'Lab Owner',
      email,
      phone: randomPhone('6'),
      password: 'InitialPass123!',
      licenseNumber: randomString('LAB'),
      servicesOffered: ['Blood Test'],
      address: {
        line1: '123 Lab Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '400001',
        country: 'India',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
      },
    }),
  },
  {
    role: ROLES.PHARMACY,
    label: 'Pharmacy',
    basePath: '/api/pharmacies/auth',
    signupBody: (email) => ({
      pharmacyName: 'Forgot Pharmacy',
      ownerName: 'Pharma Owner',
      email,
      phone: randomPhone('5'),
      password: 'InitialPass123!',
      licenseNumber: randomString('DRUG'),
      gstNumber: '29ABCDE1234F1Z5',
      address: {
        line1: '456 Pharma Avenue',
        city: 'Test City',
        state: 'TS',
        postalCode: '400002',
        country: 'India',
        location: {
          type: 'Point',
          coordinates: [73.858, 18.521],
        },
      },
      deliveryOptions: ['pickup'],
    }),
  },
  {
    role: ROLES.ADMIN,
    label: 'Admin',
    basePath: '/api/admin/auth',
    requiresRegistrationCode: true,
    signupBody: (email, registrationCode) => ({
      name: 'Forgot Admin',
      email,
      phone: randomPhone('8'),
      password: 'InitialPass123!',
      registrationCode,
      isSuperAdmin: false,
    }),
  },
];

const resetPasswordFlow = async ({ role, label, basePath, signupBody, requiresRegistrationCode }) => {
  const email = `${randomString(role)}@example.com`;
  const registrationCode = process.env.ADMIN_REGISTRATION_CODE;

  

  if (requiresRegistrationCode && !registrationCode) {
    
    return { label, status: 'skipped' };
  }

  try {
    await PasswordResetToken.deleteMany({ email, role });

    const signupResponse = await client.post(`${basePath}/signup`, signupBody(email, registrationCode));
    if (signupResponse.status >= 400) {
      
      
      return { label, status: 'failed', step: 'signup' };
    }
    

    const forgotResponse = await client.post(`${basePath}/forgot-password`, { email });
    if (forgotResponse.status !== 200) {
      
      
      return { label, status: 'failed', step: 'forgot' };
    }
    

    const tokenRecord = await PasswordResetToken.findOne({ email, role });
    if (!tokenRecord) {
      
      return { label, status: 'failed', step: 'token-missing' };
    }

    const otp = '112233';
    tokenRecord.otpHash = await bcrypt.hash(otp, 10);
    tokenRecord.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    tokenRecord.attempts = 0;
    tokenRecord.maxAttempts = 5;
    tokenRecord.resetToken = undefined;
    tokenRecord.resetTokenExpiresAt = undefined;
    tokenRecord.verifiedAt = undefined;
    await tokenRecord.save();

    const verifyResponse = await client.post(`${basePath}/verify-otp`, { email, otp });
    if (verifyResponse.status !== 200) {
      
      
      return { label, status: 'failed', step: 'verify-otp' };
    }
    

    const resetToken = verifyResponse.data?.data?.resetToken;
    if (!resetToken) {
      
      return { label, status: 'failed', step: 'reset-token-missing' };
    }

    const newPassword = 'ResetPass456!';
    const resetResponse = await client.post(`${basePath}/reset-password`, {
      email,
      resetToken,
      newPassword,
      confirmPassword: newPassword,
    });

    if (resetResponse.status !== 200) {
      
      
      return { label, status: 'failed', step: 'reset-password' };
    }
    

    const loginResponse = await client.post(`${basePath}/login`, {
      email,
      password: newPassword,
    });

    if (role === ROLES.PATIENT || role === ROLES.ADMIN) {
      if (loginResponse.status !== 200) {
        
        
        return { label, status: 'failed', step: 'login' };
      }
      
    } else if (loginResponse.status === 403 || loginResponse.status === 200) {
      
    } else {
      
      
      return { label, status: 'failed', step: 'login' };
    }

    return { label, status: 'passed' };
  } catch (error) {
    console.error(`[ERROR] ${label} flow`, error);
    return { label, status: 'error', error: error.message };
  } finally {
    await PasswordResetToken.deleteMany({ email, role });
  }
};

const main = async () => {
  
  

  await waitForServer();

  const mongooseUri = process.env.MONGODB_URI;
  if (!mongooseUri) {
    throw new Error('MONGODB_URI is required to inspect password reset tokens');
  }

  await mongoose.connect(mongooseUri);

  const results = [];

  for (const config of ROLE_FLOW) {
    // eslint-disable-next-line no-await-in-loop
    const result = await resetPasswordFlow(config);
    results.push(result);
  }

  await mongoose.disconnect();

  
  results.forEach((item) => {
    
  });

  const failed = results.some((item) => item.status !== 'passed' && item.status !== 'skipped');
  if (failed) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('Unexpected error running forgot-password tests', error);
  process.exit(1);
});


