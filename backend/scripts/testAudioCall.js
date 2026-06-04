/**
 * Audio Call Feature Test Script
 * 
 * This script tests the complete audio call flow:
 * 1. Doctor initiates call
 * 2. Patient receives invite
 * 3. Patient accepts call
 * 4. Call ends
 * 
 * Usage: node scripts/testAudioCall.js
 */

/**
 * Audio Call Feature Test Script
 * 
 * This script tests the complete audio call flow:
 * 1. Doctor initiates call
 * 2. Patient receives invite
 * 3. Patient accepts call
 * 4. Call ends
 * 
 * Usage: 
 *   node scripts/testAudioCall.js
 * 
 * Environment Variables (optional):
 *   TEST_DOCTOR_PHONE - Phone number of existing doctor (default: first doctor in DB)
 *   TEST_PATIENT_PHONE - Phone number of existing patient (default: first patient in DB)
 *   TEST_DOCTOR_ID - Doctor MongoDB ID (alternative to phone)
 *   TEST_PATIENT_ID - Patient MongoDB ID (alternative to phone)
 *   TEST_OTP - OTP code to use (default: '123456' - works if USE_RANDOM_OTP is not set to 'true')
 *   USE_RANDOM_OTP - Set to 'true' to use random OTPs (then you must provide TEST_OTP with received OTP)
 * 
 * Examples:
 *   # Use first available doctor and patient (with default OTP 123456)
 *   node scripts/testAudioCall.js
 * 
 *   # Use specific users by phone number
 *   TEST_DOCTOR_PHONE=9876543201 TEST_PATIENT_PHONE=9876544001 node scripts/testAudioCall.js
 * 
 *   # Use specific users by ID
 *   TEST_DOCTOR_ID=507f1f77bcf86cd799439011 TEST_PATIENT_ID=507f1f77bcf86cd799439012 node scripts/testAudioCall.js
 * 
 *   # If using random OTP (USE_RANDOM_OTP=true), provide the received OTP
 *   USE_RANDOM_OTP=true TEST_OTP=456789 node scripts/testAudioCall.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { io } = require('socket.io-client');
const Call = require('../models/Call');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';

// Test configuration
// You can specify existing users by phone number, or leave empty to use first available users
const TEST_CONFIG = {
  doctorPhone: process.env.TEST_DOCTOR_PHONE || null, // null = use first available doctor
  patientPhone: process.env.TEST_PATIENT_PHONE || null, // null = use first available patient
  doctorId: process.env.TEST_DOCTOR_ID || null, // Optional: specify doctor by ID
  patientId: process.env.TEST_PATIENT_ID || null, // Optional: specify patient by ID
  testOtp: process.env.TEST_OTP || '123456', // Default test OTP (123456 unless USE_RANDOM_OTP=true)
};

let doctorToken = null;
let patientToken = null;
let doctorSocket = null;
let patientSocket = null;
let testAppointment = null;
let testCall = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  
}

function logStep(step, message) {
  log(`\n[Step ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logSuccess('Connected to MongoDB');
  } catch (error) {
    logError(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

// Normalize phone number (same logic as loginOtpService)
function normalizePhone(phone) {
  if (!phone) return null;
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // If it starts with 0, remove it
  if (cleaned.startsWith('0')) {
    return cleaned.substring(1);
  }
  return cleaned;
}

// Find existing doctor or patient
async function findUser(role, phone = null, userId = null) {
  try {
    const Model = role === 'doctor' ? Doctor : Patient;
    let user = null;

    if (userId) {
      user = await Model.findById(userId);
      if (!user) {
        throw new Error(`${role} with ID ${userId} not found`);
      }
    } else if (phone) {
      const normalizedPhone = normalizePhone(phone);
      user = await Model.findOne({ phone: normalizedPhone });
      if (!user) {
        throw new Error(`${role} with phone ${phone} not found`);
      }
    } else {
      // Find first available user
      user = await Model.findOne().sort({ createdAt: 1 });
      if (!user) {
        throw new Error(`No ${role} found in database. Please create at least one ${role}.`);
      }
      logInfo(`Using first available ${role}: ${user.phone} (${user._id})`);
    }

    if (!user.phone) {
      throw new Error(`${role} does not have a phone number. Phone is required for OTP authentication.`);
    }

    return user;
  } catch (error) {
    logError(`Error finding ${role}: ${error.message}`);
    throw error;
  }
}

// Request OTP for login
async function requestOtp(phone, role) {
  try {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new Error('Phone number is required');
    }

    const response = await fetch(`${API_BASE_URL}/${role === 'doctor' ? 'doctors' : 'patients'}/auth/login/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone }),
    });

    const data = await response.json();
    if (data.success) {
      return normalizedPhone;
    }
    throw new Error(data.message || 'Failed to request OTP');
  } catch (error) {
    logError(`OTP request failed for ${role}: ${error.message}`);
    throw error;
  }
}

// Verify OTP and get token
async function loginWithOtp(phone, otp, role) {
  try {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !otp) {
      throw new Error('Phone number and OTP are required');
    }

    const response = await fetch(`${API_BASE_URL}/${role === 'doctor' ? 'doctors' : 'patients'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, otp }),
    });

    const data = await response.json();
    if (data.success && data.data?.tokens?.accessToken) {
      return data.data.tokens.accessToken;
    }
    throw new Error(data.message || 'Login failed');
  } catch (error) {
    logError(`Login failed for ${role}: ${error.message}`);
    throw error;
  }
}

// Find or create test appointment
async function findOrCreateTestAppointment(doctor, patient) {
  try {
    // Find an existing appointment with call mode
    let appointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      consultationMode: 'call',
      status: { $in: ['called', 'in-consultation', 'in_progress'] },
    });

    if (!appointment) {
      // Try to find any appointment with call mode (even if status is different)
      appointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: patient._id,
        consultationMode: 'call',
      });

      if (appointment) {
        // Update status to make it testable
        appointment.status = 'called';
        await appointment.save();
        logInfo('Updated existing appointment status to "called" for testing');
      } else {
        // Create a test appointment
        appointment = new Appointment({
          doctorId: doctor._id,
          patientId: patient._id,
          appointmentDate: new Date(),
          time: '10:00 AM',
          consultationMode: 'call',
          status: 'called',
          reason: 'Test audio call',
        });
        await appointment.save();
        logInfo('Created test appointment');
      }
    } else {
      logInfo('Using existing test appointment');
    }

    logInfo(`Appointment ID: ${appointment._id}, Status: ${appointment.status}`);
    return appointment;
  } catch (error) {
    logError(`Error finding/creating appointment: ${error.message}`);
    throw error;
  }
}

// Connect socket
function connectSocket(token, role) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: false,
    });

    socket.on('connect', () => {
      logSuccess(`${role} socket connected: ${socket.id}`);
      // Wait a bit for room joining to complete on server side
      setTimeout(() => {
        resolve(socket);
      }, 500);
    });

    socket.on('connect_error', (error) => {
      logError(`${role} socket connection failed: ${error.message}`);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      logWarning(`${role} socket disconnected: ${reason}`);
    });

    // Listen for any call-related events to debug and capture early events
    socket.onAny((eventName, ...args) => {
      if (eventName.startsWith('call:') || eventName.startsWith('mediasoup:')) {
        logInfo(`📞 ${role} socket received event: ${eventName}`, JSON.stringify(args, null, 2));
        
        // Capture patient invite if it arrives early (before test sets up listener)
        if (role === 'Patient' && eventName === 'call:invite' && args[0]) {
          pendingPatientInvite = args[0];
          logInfo(`📞 Captured early call:invite for patient:`, args[0]);
          if (patientInviteResolve) {
            patientInviteResolve(args[0]);
            patientInviteResolve = null;
          }
        }
      }
    });
  });
}

// Test 1: Doctor initiates call
async function testDoctorInitiatesCall() {
  logStep(1, 'Doctor initiates call');

  return new Promise((resolve, reject) => {
    let callInitiated = false;
    let callError = null;

    // Listen for call:initiated event
    doctorSocket.once('call:initiated', (data) => {
      logSuccess(`Doctor received call:initiated - callId: ${data.callId}`);
      testCall = { callId: data.callId };
      callInitiated = true;
      resolve(data);
    });

    // Listen for errors
    doctorSocket.once('call:error', (data) => {
      callError = data.message;
      logError(`Doctor received call:error: ${data.message}`);
      reject(new Error(data.message));
    });

    // Emit call:initiate
    logInfo(`Emitting call:initiate for appointmentId: ${testAppointment._id}`);
    doctorSocket.emit('call:initiate', { appointmentId: testAppointment._id.toString() }, (response) => {
      if (response && response.error) {
        logError(`Server error: ${response.error}`);
        reject(new Error(response.error));
      } else if (response && response.callId) {
        logSuccess(`Server acknowledged call:initiate - callId: ${response.callId}`);
        testCall = { callId: response.callId };
        if (!callInitiated) {
          resolve(response);
        }
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!callInitiated && !callError) {
        reject(new Error('Timeout: call:initiate did not complete'));
      }
    }, 10000);
  });
}

// Store for patient invite (in case it arrives before we set up the listener)
let pendingPatientInvite = null;
let patientInviteResolve = null;

// Test 2: Patient receives invite
async function testPatientReceivesInvite() {
  logStep(2, 'Patient receives call invite');

  // Check if we already received the invite (race condition handling)
  if (pendingPatientInvite && pendingPatientInvite.callId === testCall.callId) {
    logSuccess(`Patient already received call:invite (captured earlier):`, pendingPatientInvite);
    const invite = pendingPatientInvite;
    pendingPatientInvite = null;
    return Promise.resolve(invite);
  }

  return new Promise((resolve, reject) => {
    // Set up listener
    const inviteHandler = (data) => {
      logSuccess(`Patient received call:invite:`, data);
      if (data.callId === testCall.callId) {
        clearTimeout(timeoutId);
        patientSocket.off('call:invite', inviteHandler);
        patientSocket.off('call:error', errorHandler);
        resolve(data);
      } else {
        logWarning(`Call ID mismatch. Expected: ${testCall.callId}, Got: ${data.callId}`);
      }
    };

    patientSocket.on('call:invite', inviteHandler);
    
    // Also listen for any errors
    const errorHandler = (data) => {
      logError(`Patient received error:`, data);
    };
    patientSocket.on('call:error', errorHandler);

    // Log that we're waiting for invite
    logInfo(`Waiting for call:invite event for callId: ${testCall.callId}`);
    logInfo(`Patient socket connected: ${patientSocket.connected}, ID: ${patientSocket.id}`);

    // Timeout after 15 seconds
    const timeoutId = setTimeout(() => {
      patientSocket.off('call:invite', inviteHandler);
      patientSocket.off('call:error', errorHandler);
      reject(new Error('Timeout: Patient did not receive call:invite. Check backend logs to see if invite was sent.'));
    }, 15000);
  });
}

// Test 3: Patient accepts call
async function testPatientAcceptsCall() {
  logStep(3, 'Patient accepts call');

  return new Promise((resolve, reject) => {
    let callAccepted = false;

    // Listen for call:accepted event
    patientSocket.once('call:accepted', (data) => {
      logSuccess(`Patient received call:accepted:`, data);
      callAccepted = true;
      resolve(data);
    });

    // Listen for errors
    patientSocket.once('call:error', (data) => {
      logError(`Patient received call:error: ${data.message}`);
      reject(new Error(data.message));
    });

    // Doctor should also receive call:accepted
    doctorSocket.once('call:accepted', (data) => {
      logSuccess(`Doctor received call:accepted:`, data);
    });

    // Emit call:accept
    logInfo(`Patient emitting call:accept for callId: ${testCall.callId}`);
    patientSocket.emit('call:accept', { callId: testCall.callId }, (response) => {
      if (response && response.error) {
        logError(`Server error: ${response.error}`);
        reject(new Error(response.error));
      } else if (response && response.callId) {
        logSuccess(`Server acknowledged call:accept`);
        if (!callAccepted) {
          resolve(response);
        }
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!callAccepted) {
        reject(new Error('Timeout: call:accept did not complete'));
      }
    }, 10000);
  });
}

// Test 4: Verify call record in database
async function testCallRecordInDB() {
  logStep(4, 'Verify call record in database');

  try {
    const call = await Call.findOne({ callId: testCall.callId });
    if (!call) {
      throw new Error('Call record not found in database');
    }

    logSuccess('Call record found in database');
    logInfo(`Call details:`, {
      callId: call.callId,
      status: call.status,
      appointmentId: call.appointmentId.toString(),
      doctorId: call.doctorId.toString(),
      patientId: call.patientId.toString(),
      startTime: call.startTime,
    });

    if (call.status !== 'accepted') {
      throw new Error(`Expected status 'accepted', got '${call.status}'`);
    }

    if (!call.startTime) {
      throw new Error('startTime is not set');
    }

    logSuccess('Call record is valid');
    return call;
  } catch (error) {
    logError(`Database verification failed: ${error.message}`);
    throw error;
  }
}

// Test 5: End call
async function testEndCall() {
  logStep(5, 'End call');

  return new Promise((resolve, reject) => {
    let callEnded = false;

    // Both should receive call:ended
    const handleCallEnded = (data) => {
      if (data.callId === testCall.callId) {
        logSuccess(`Received call:ended for callId: ${data.callId}`);
        callEnded = true;
        if (!callEnded) {
          resolve(data);
        }
      }
    };

    doctorSocket.once('call:ended', handleCallEnded);
    patientSocket.once('call:ended', handleCallEnded);

    // Emit call:end from doctor
    logInfo(`Doctor emitting call:end for callId: ${testCall.callId}`);
    doctorSocket.emit('call:end', { callId: testCall.callId });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!callEnded) {
        reject(new Error('Timeout: call:end did not complete'));
      } else {
        resolve();
      }
    }, 10000);
  });
}

// Test 6: Verify call ended in database
async function testCallEndedInDB() {
  logStep(6, 'Verify call ended in database');

  try {
    const call = await Call.findOne({ callId: testCall.callId });
    if (!call) {
      throw new Error('Call record not found');
    }

    logSuccess('Call record found');
    logInfo(`Call details:`, {
      status: call.status,
      startTime: call.startTime,
      endTime: call.endTime,
      durationSeconds: call.durationSeconds,
    });

    if (call.status !== 'ended') {
      throw new Error(`Expected status 'ended', got '${call.status}'`);
    }

    if (!call.endTime) {
      throw new Error('endTime is not set');
    }

    if (!call.durationSeconds && call.durationSeconds !== 0) {
      throw new Error('durationSeconds is not set');
    }

    logSuccess('Call ended successfully and recorded in database');
    return call;
  } catch (error) {
    logError(`Database verification failed: ${error.message}`);
    throw error;
  }
}

// Cleanup
async function cleanup() {
  logStep('Cleanup', 'Cleaning up test resources');

  if (doctorSocket) {
    doctorSocket.disconnect();
    logInfo('Doctor socket disconnected');
  }

  if (patientSocket) {
    patientSocket.disconnect();
    logInfo('Patient socket disconnected');
  }

  // Optionally delete test call record
  if (testCall && testCall.callId) {
    try {
      await Call.deleteOne({ callId: testCall.callId });
      logInfo('Test call record deleted');
    } catch (error) {
      logWarning(`Failed to delete test call: ${error.message}`);
    }
  }

  await mongoose.disconnect();
  logSuccess('Disconnected from MongoDB');
}

// Main test function
async function runTests() {
  try {
    log('\n🧪 Starting Audio Call Feature Tests\n', 'cyan');
    log('=' .repeat(60), 'cyan');

    // Connect to database
    await connectDB();

    // Find existing users
    logStep('Setup', 'Finding existing doctor and patient');
    const doctor = await findUser('doctor', TEST_CONFIG.doctorPhone, TEST_CONFIG.doctorId);
    logSuccess(`Found doctor: ${doctor.phone} (${doctor._id})`);
    
    const patient = await findUser('patient', TEST_CONFIG.patientPhone, TEST_CONFIG.patientId);
    logSuccess(`Found patient: ${patient.phone} (${patient._id})`);

    // Login with OTP
    logStep('Setup', 'Requesting OTP and logging in as doctor and patient');
    
    // Request OTP for doctor
    const doctorPhone = normalizePhone(doctor.phone);
    logInfo(`Requesting OTP for doctor: ${doctorPhone}`);
    await requestOtp(doctorPhone, 'doctor');
    logSuccess('OTP requested for doctor');
    
    // Request OTP for patient
    const patientPhone = normalizePhone(patient.phone);
    logInfo(`Requesting OTP for patient: ${patientPhone}`);
    await requestOtp(patientPhone, 'patient');
    logSuccess('OTP requested for patient');
    
    // Wait a bit for OTP to be processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Login with OTP (default test OTP is 123456)
    logInfo(`Using test OTP: ${TEST_CONFIG.testOtp}`);
    try {
      doctorToken = await loginWithOtp(doctorPhone, TEST_CONFIG.testOtp, 'doctor');
      logSuccess('Doctor logged in');
    } catch (error) {
      logError(`Failed to login as doctor. Make sure OTP is correct (default: 123456).`);
      logInfo(`Doctor phone: ${doctorPhone}`);
      logInfo(`If using random OTP, set TEST_OTP environment variable with the received OTP.`);
      throw error;
    }
    
    try {
      patientToken = await loginWithOtp(patientPhone, TEST_CONFIG.testOtp, 'patient');
      logSuccess('Patient logged in');
    } catch (error) {
      logError(`Failed to login as patient. Make sure OTP is correct (default: 123456).`);
      logInfo(`Patient phone: ${patientPhone}`);
      logInfo(`If using random OTP, set TEST_OTP environment variable with the received OTP.`);
      throw error;
    }

    // Find or create test appointment
    testAppointment = await findOrCreateTestAppointment(doctor, patient);
    logSuccess(`Using appointment: ${testAppointment._id}`);

    // Connect sockets
    logStep('Setup', 'Connecting sockets');
    doctorSocket = await connectSocket(doctorToken, 'Doctor');
    patientSocket = await connectSocket(patientToken, 'Patient');

    // Wait for sockets to stabilize and rooms to be joined
    logInfo('Waiting for sockets to join rooms...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
    
    // Verify sockets are connected
    if (!doctorSocket.connected) {
      throw new Error('Doctor socket is not connected');
    }
    if (!patientSocket.connected) {
      throw new Error('Patient socket is not connected');
    }
    logSuccess('Both sockets connected and ready');

    // Set up patient invite listener BEFORE initiating call (to avoid race condition)
    logInfo('Setting up patient invite listener before call initiation...');
    let patientInviteReceived = false;
    let patientInviteData = null;
    
    const earlyInviteHandler = (data) => {
      if (data && data.callId) {
        logInfo(`📞 Patient invite received early: callId=${data.callId}`);
        patientInviteReceived = true;
        patientInviteData = data;
      }
    };
    patientSocket.on('call:invite', earlyInviteHandler);

    // Run tests
    await testDoctorInitiatesCall();
    logInfo('Waiting for call:invite to be sent to patient...');
    
    // Wait a bit for invite to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if we already received the invite
    if (patientInviteReceived && patientInviteData && patientInviteData.callId === testCall.callId) {
      logStep(2, 'Patient receives call invite');
      logSuccess(`Patient already received call:invite (captured early):`, patientInviteData);
      patientSocket.off('call:invite', earlyInviteHandler);
      // Continue to next test
    } else {
      // Remove early handler and use the test function
      patientSocket.off('call:invite', earlyInviteHandler);
      await testPatientReceivesInvite();
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    await testPatientAcceptsCall();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testCallRecordInDB();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testEndCall();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testCallEndedInDB();

    log('\n' + '='.repeat(60), 'cyan');
    log('\n🎉 All tests passed!\n', 'green');

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    logError(`\nTest failed: ${error.message}`);
    logError(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  cleanup().then(() => process.exit(1));
});

process.on('SIGINT', async () => {
  logWarning('\nTest interrupted by user');
  await cleanup();
  process.exit(0);
});

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };

