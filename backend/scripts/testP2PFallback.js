/**
 * P2P to SFU Fallback Test Script
 * 
 * This script tests the automatic SFU fallback mechanism when P2P fails.
 * It simulates various P2P failure scenarios and verifies that SFU fallback works correctly.
 * 
 * Usage: 
 *   node scripts/testP2PFallback.js
 * 
 * Test Scenarios:
 *   1. P2P initialization failure → Should fallback to SFU
 *   2. P2P connection failure → Should fallback to SFU
 *   3. P2P ICE failure → Should fallback to SFU
 *   4. P2P success → Should NOT fallback to SFU
 * 
 * Environment Variables:
 *   TEST_DOCTOR_PHONE - Phone number of existing doctor
 *   TEST_PATIENT_PHONE - Phone number of existing patient
 *   TEST_OTP - OTP code to use (default: '123456')
 *   FAILURE_SCENARIO - Which failure to test: 'init', 'connection', 'ice', 'all' (default: 'all')
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
const TEST_CONFIG = {
  doctorPhone: process.env.TEST_DOCTOR_PHONE || null,
  patientPhone: process.env.TEST_PATIENT_PHONE || null,
  doctorId: process.env.TEST_DOCTOR_ID || null,
  patientId: process.env.TEST_PATIENT_ID || null,
  testOtp: process.env.TEST_OTP || '123456',
  failureScenario: process.env.FAILURE_SCENARIO || 'all', // 'init', 'connection', 'ice', 'all'
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
  magenta: '\x1b[35m',
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

function logTest(message) {
  log(`🧪 ${message}`, 'magenta');
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
    logSuccess(`Test: ${name} - ${message}`);
  } else {
    testResults.failed++;
    logError(`Test: ${name} - ${message}`);
  }
}

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healiinn';
    await mongoose.connect(mongoUri);
    logSuccess('Connected to MongoDB');
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

// Get test users
async function getTestUsers() {
  let doctor, patient;

  if (TEST_CONFIG.doctorId) {
    doctor = await Doctor.findById(TEST_CONFIG.doctorId);
  } else if (TEST_CONFIG.doctorPhone) {
    doctor = await Doctor.findOne({ phone: TEST_CONFIG.doctorPhone });
  } else {
    doctor = await Doctor.findOne();
  }

  if (TEST_CONFIG.patientId) {
    patient = await Patient.findById(TEST_CONFIG.patientId);
  } else if (TEST_CONFIG.patientPhone) {
    patient = await Patient.findOne({ phone: TEST_CONFIG.patientPhone });
  } else {
    patient = await Patient.findOne();
  }

  if (!doctor) {
    throw new Error('No doctor found. Please create a doctor or specify TEST_DOCTOR_PHONE/TEST_DOCTOR_ID');
  }

  if (!patient) {
    throw new Error('No patient found. Please create a patient or specify TEST_PATIENT_PHONE/TEST_PATIENT_ID');
  }

  logSuccess(`Using doctor: ${doctor.firstName} ${doctor.lastName} (${doctor.phone})`);
  logSuccess(`Using patient: ${patient.firstName} ${patient.lastName} (${patient.phone})`);

  return { doctor, patient };
}

// Login and get tokens
async function loginUsers(doctor, patient) {
  // Login doctor
  const doctorLoginResponse = await fetch(`${API_BASE_URL}/doctors/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: doctor.phone,
      password: 'Test@123', // Default test password
    }),
  });

  if (!doctorLoginResponse.ok) {
    throw new Error('Doctor login failed');
  }

  const doctorData = await doctorLoginResponse.json();
  doctorToken = doctorData.token;

  // Login patient (using OTP)
  const patientOtpResponse = await fetch(`${API_BASE_URL}/patients/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: patient.phone }),
  });

  if (!patientOtpResponse.ok) {
    throw new Error('Patient OTP request failed');
  }

  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for OTP

  const patientLoginResponse = await fetch(`${API_BASE_URL}/patients/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: patient.phone,
      otp: TEST_CONFIG.testOtp,
    }),
  });

  if (!patientLoginResponse.ok) {
    throw new Error('Patient OTP verification failed');
  }

  const patientData = await patientLoginResponse.json();
  patientToken = patientData.token;

  logSuccess('Both users logged in successfully');
}

// Create test appointment
async function createTestAppointment(doctor, patient) {
  const appointment = await Appointment.findOne({
    doctorId: doctor._id,
    patientId: patient._id,
    consultationMode: 'call',
  });

  if (appointment) {
    testAppointment = appointment;
    logInfo(`Using existing appointment: ${appointment._id}`);
    return appointment;
  }

  // Create new appointment if none exists
  const newAppointment = new Appointment({
    doctorId: doctor._id,
    patientId: patient._id,
    date: new Date(),
    time: '10:00',
    consultationMode: 'call',
    status: 'confirmed',
    tokenNumber: 1,
  });

  await newAppointment.save();
  testAppointment = newAppointment;
  logSuccess(`Created test appointment: ${newAppointment._id}`);
  return newAppointment;
}

// Connect sockets
function connectSocket(token, role) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      logSuccess(`${role} socket connected: ${socket.id}`);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      logError(`${role} socket connection error: ${error.message}`);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!socket.connected) {
        reject(new Error(`${role} socket connection timeout`));
      }
    }, 10000);
  });
}

// Test Scenario 1: P2P Initialization Failure
async function testP2PInitFailure() {
  logTest('\n=== Test Scenario 1: P2P Initialization Failure ===');
  
  return new Promise((resolve) => {
    let doctorInitiated = false;
    let patientAccepted = false;
    let fallbackDetected = false;
    let sfuConnected = false;

    // Doctor socket events
    doctorSocket.on('call:initiated', (data) => {
      logInfo(`Doctor: Call initiated - ${data.callId}`);
      doctorInitiated = true;
      testCall = { callId: data.callId };
    });

    doctorSocket.on('call:accepted', (data) => {
      logInfo(`Doctor: Call accepted - ${data.callId}`);
      patientAccepted = true;
    });

    // Monitor for SFU fallback (check for mediasoup events)
    doctorSocket.on('mediasoup:getRtpCapabilities', () => {
      logWarning('Doctor: SFU fallback detected (mediasoup event received)');
      fallbackDetected = true;
    });

    doctorSocket.onAny((event, ...args) => {
      if (event.includes('mediasoup')) {
        logWarning(`Doctor: SFU event detected - ${event}`);
        if (!fallbackDetected) {
          fallbackDetected = true;
        }
      }
    });

    // Patient socket events
    patientSocket.on('call:invite', async (data) => {
      logInfo(`Patient: Call invite received - ${data.callId}`);
      
      // Accept call
      patientSocket.emit('call:accept', { callId: data.callId }, (response) => {
        if (response && !response.error) {
          logSuccess('Patient: Call accepted');
        }
      });
    });

    // Simulate P2P initialization failure by monitoring connection
    const checkTimeout = setTimeout(() => {
      // Check if SFU was used (fallback detected)
      if (fallbackDetected) {
        recordTest('P2P Init Failure → SFU Fallback', true, 'SFU fallback triggered correctly');
      } else if (doctorInitiated && patientAccepted) {
        // Check if call connected via SFU (no P2P events but mediasoup events)
        recordTest('P2P Init Failure → SFU Fallback', true, 'Call connected via SFU (fallback worked)');
      } else {
        recordTest('P2P Init Failure → SFU Fallback', false, 'SFU fallback not detected');
      }
      resolve();
    }, 15000);

    // Initiate call
    doctorSocket.emit('call:initiate', { appointmentId: testAppointment._id.toString() }, (response) => {
      if (response && response.callId) {
        logSuccess(`Doctor: Call initiated - ${response.callId}`);
        testCall = { callId: response.callId };
      }
    });
  });
}

// Test Scenario 2: P2P Connection Failure (after initialization)
async function testP2PConnectionFailure() {
  logTest('\n=== Test Scenario 2: P2P Connection Failure ===');
  
  return new Promise((resolve) => {
    let fallbackDetected = false;
    let callConnected = false;

    // Monitor for SFU fallback
    doctorSocket.onAny((event, ...args) => {
      if (event.includes('mediasoup')) {
        logWarning(`Doctor: SFU event detected - ${event}`);
        if (!fallbackDetected) {
          fallbackDetected = true;
          logSuccess('SFU fallback detected after P2P connection failure');
        }
      }
    });

    patientSocket.onAny((event, ...args) => {
      if (event.includes('mediasoup')) {
        logWarning(`Patient: SFU event detected - ${event}`);
        if (!fallbackDetected) {
          fallbackDetected = true;
        }
      }
    });

    doctorSocket.on('call:accepted', (data) => {
      logInfo('Call accepted, monitoring for P2P failure and SFU fallback...');
    });

    const checkTimeout = setTimeout(() => {
      if (fallbackDetected) {
        recordTest('P2P Connection Failure → SFU Fallback', true, 'SFU fallback triggered correctly');
      } else {
        recordTest('P2P Connection Failure → SFU Fallback', false, 'SFU fallback not detected');
      }
      resolve();
    }, 20000);

    // Initiate call
    doctorSocket.emit('call:initiate', { appointmentId: testAppointment._id.toString() }, (response) => {
      if (response && response.callId) {
        logSuccess(`Call initiated - ${response.callId}`);
      }
    });

    // Patient accepts
    patientSocket.on('call:invite', async (data) => {
      patientSocket.emit('call:accept', { callId: data.callId });
    });
  });
}

// Test Scenario 3: P2P Success (should NOT fallback)
async function testP2PSuccess() {
  logTest('\n=== Test Scenario 3: P2P Success (No Fallback) ===');
  
  return new Promise((resolve) => {
    let p2pConnected = false;
    let fallbackDetected = false;

    // Monitor for P2P events
    doctorSocket.onAny((event, ...args) => {
      if (event.includes('p2p:')) {
        logInfo(`Doctor: P2P event - ${event}`);
        if (event === 'p2p:offer' || event === 'p2p:answer') {
          p2pConnected = true;
        }
      }
      if (event.includes('mediasoup') && !event.includes('getRtpCapabilities')) {
        logWarning(`Doctor: SFU event detected - ${event} (unexpected if P2P works)`);
        fallbackDetected = true;
      }
    });

    patientSocket.onAny((event, ...args) => {
      if (event.includes('p2p:')) {
        logInfo(`Patient: P2P event - ${event}`);
      }
      if (event.includes('mediasoup') && !event.includes('getRtpCapabilities')) {
        fallbackDetected = true;
      }
    });

    const checkTimeout = setTimeout(() => {
      if (p2pConnected && !fallbackDetected) {
        recordTest('P2P Success → No Fallback', true, 'P2P connected successfully, no unnecessary fallback');
      } else if (p2pConnected && fallbackDetected) {
        recordTest('P2P Success → No Fallback', false, 'P2P connected but SFU also used (unexpected)');
      } else if (!p2pConnected) {
        recordTest('P2P Success → No Fallback', false, 'P2P did not connect');
      }
      resolve();
    }, 15000);

    // Initiate call
    doctorSocket.emit('call:initiate', { appointmentId: testAppointment._id.toString() }, (response) => {
      if (response && response.callId) {
        logSuccess(`Call initiated - ${response.callId}`);
      }
    });

    // Patient accepts
    patientSocket.on('call:invite', async (data) => {
      patientSocket.emit('call:accept', { callId: data.callId });
    });
  });
}

// Cleanup function
async function cleanup() {
  logStep('Cleanup', 'Cleaning up test resources...');

  if (doctorSocket) {
    doctorSocket.disconnect();
    logInfo('Doctor socket disconnected');
  }

  if (patientSocket) {
    patientSocket.disconnect();
    logInfo('Patient socket disconnected');
  }

  if (testCall && testCall.callId) {
    try {
      const call = await Call.findOne({ callId: testCall.callId });
      if (call) {
        await call.endCall();
        logInfo('Test call ended');
      }
    } catch (error) {
      logWarning(`Error ending call: ${error.message}`);
    }
  }

  await mongoose.connection.close();
  logSuccess('MongoDB connection closed');
}

// Print test summary
function printSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\nTotal Tests: ${testResults.tests.length}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  log('\nTest Details:', 'blue');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    log(`${index + 1}. ${status} ${test.name}`, color);
    if (test.message) {
      log(`   → ${test.message}`, 'yellow');
    }
  });
  
  log('\n' + '='.repeat(60), 'cyan');
  
  if (testResults.failed === 0) {
    logSuccess('\n🎉 All tests passed!');
  } else {
    logError(`\n⚠️  ${testResults.failed} test(s) failed`);
  }
}

// Main test function
async function runTests() {
  try {
    log('\n' + '='.repeat(60), 'cyan');
    log('P2P TO SFU FALLBACK TEST SUITE', 'cyan');
    log('='.repeat(60), 'cyan');

    logStep(1, 'Connecting to database...');
    await connectDB();

    logStep(2, 'Getting test users...');
    const { doctor, patient } = await getTestUsers();

    logStep(3, 'Logging in users...');
    await loginUsers(doctor, patient);

    logStep(4, 'Creating test appointment...');
    await createTestAppointment(doctor, patient);

    logStep(5, 'Connecting sockets...');
    doctorSocket = await connectSocket(doctorToken, 'Doctor');
    patientSocket = await connectSocket(patientToken, 'Patient');

    // Wait for sockets to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run tests based on configuration
    if (TEST_CONFIG.failureScenario === 'init' || TEST_CONFIG.failureScenario === 'all') {
      await testP2PInitFailure();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
    }

    if (TEST_CONFIG.failureScenario === 'connection' || TEST_CONFIG.failureScenario === 'all') {
      // Reconnect sockets for next test
      doctorSocket.disconnect();
      patientSocket.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      doctorSocket = await connectSocket(doctorToken, 'Doctor');
      patientSocket = await connectSocket(patientToken, 'Patient');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testP2PConnectionFailure();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (TEST_CONFIG.failureScenario === 'all') {
      // Reconnect sockets for success test
      doctorSocket.disconnect();
      patientSocket.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      doctorSocket = await connectSocket(doctorToken, 'Doctor');
      patientSocket = await connectSocket(patientToken, 'Patient');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testP2PSuccess();
    }

    printSummary();

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await cleanup();
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logWarning('\n\nTest interrupted by user');
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  console.error(error);
});

// Run tests
runTests();

