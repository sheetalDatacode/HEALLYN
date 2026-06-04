/**
 * Audio Call Flow Verification Script
 * 
 * Verifies 5 specific scenarios:
 * 1. Doctor calls, cuts before patient joins.
 * 2. Doctor calls, patient declines.
 * 3. Doctor calls, patient joins (Test functionality).
 * 4. Doctor calls, patient joins, doctor cuts.
 * 5. Doctor calls, patient joins, patient cuts.
 * 
 * Usage: node scripts/verifyAudioCallFlows.js
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

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Configuration
const TEST_CONFIG = {
    doctorPhone: process.env.TEST_DOCTOR_PHONE,
    patientPhone: process.env.TEST_PATIENT_PHONE,
    testOtp: process.env.TEST_OTP || '123456',
};

// Global State
let doctorToken, patientToken;
let doctorSocket, patientSocket;
let testAppointment;
let doctorUser, patientUser;

// --- Helpers (Reused/Adapted) ---

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logSuccess('Connected to MongoDB');
    } catch (error) {
        logError(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
}

function normalizePhone(phone) {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
}

async function findUser(role) {
    const Model = role === 'doctor' ? Doctor : Patient;
    const phone = role === 'doctor' ? TEST_CONFIG.doctorPhone : TEST_CONFIG.patientPhone;
    let user;
    if (phone) {
        user = await Model.findOne({ phone: normalizePhone(phone) });
    } else {
        user = await Model.findOne().sort({ createdAt: 1 });
    }
    if (!user) throw new Error(`No ${role} found.`);
    return user;
}

async function requestOtp(phone, role) {
    const response = await fetch(`${API_BASE_URL}/${role === 'doctor' ? 'doctors' : 'patients'}/auth/login/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    });
    return response.json();
}

async function loginWithOtp(phone, otp, role) {
    const response = await fetch(`${API_BASE_URL}/${role === 'doctor' ? 'doctors' : 'patients'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
    });
    const data = await response.json();
    if (data.success && data.data?.tokens?.accessToken) return data.data.tokens.accessToken;
    throw new Error(data.message || 'Login failed');
}

async function setupTestUsers() {
    doctorUser = await findUser('doctor');
    patientUser = await findUser('patient');
    logInfo(`Doctor: ${doctorUser.phone}, Patient: ${patientUser.phone}`);

    await requestOtp(normalizePhone(doctorUser.phone), 'doctor');
    await requestOtp(normalizePhone(patientUser.phone), 'patient');
    // slight delay
    await new Promise(r => setTimeout(r, 500));

    doctorToken = await loginWithOtp(normalizePhone(doctorUser.phone), TEST_CONFIG.testOtp, 'doctor');
    patientToken = await loginWithOtp(normalizePhone(patientUser.phone), TEST_CONFIG.testOtp, 'patient');
    logSuccess('Logged in both users');
}

async function setupAppointment() {
    testAppointment = await Appointment.findOne({
        doctorId: doctorUser._id,
        patientId: patientUser._id,
        consultationMode: 'call',
        status: { $in: ['called', 'in-consultation', 'in_progress', 'scheduled', 'waiting'] }
    });

    if (!testAppointment) {
        testAppointment = await Appointment.create({
            doctorId: doctorUser._id,
            patientId: patientUser._id,
            appointmentDate: new Date(),
            time: '10:00 AM',
            consultationMode: 'call',
            status: 'called',
            reason: 'Test audio call verify',
        });
        logInfo('Created new test appointment');
    } else {
        // Ensure status is valid for calling
        testAppointment.status = 'called';
        testAppointment.consultationMode = 'call';
        await testAppointment.save();
        logInfo(`Using existing appointment: ${testAppointment._id}`);
    }

    // Cleanup calls for this appointment to avoid 'call in progress' errors
    await Call.deleteMany({ appointmentId: testAppointment._id });
    logInfo('Cleared existing calls for appointment');
}

function connectSocket(token, role) {
    return new Promise((resolve, reject) => {
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['polling', 'websocket'],
            reconnection: false,
        });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => reject(err));
    });
}

async function connectSockets() {
    doctorSocket = await connectSocket(doctorToken, 'Doctor');
    patientSocket = await connectSocket(patientToken, 'Patient');
    logSuccess('Sockets connected');
    // Allow room join
    await new Promise(r => setTimeout(r, 1000));
}

// --- Scenarios ---

// Helper to initiate call
function initiateCall(socket, appointmentId) {
    return new Promise((resolve, reject) => {
        logInfo('Sending call:initiate event...');
        // Add timeout
        const timer = setTimeout(() => reject(new Error('initiateCall timeout')), 10000);

        socket.emit('call:initiate', { appointmentId: appointmentId.toString() }, (resp) => {
            clearTimeout(timer);
            if (resp?.error) reject(resp.error);
            else resolve(resp);
        });
    });
}

// 1. Doctor calls, cuts before patient joins
async function runScenario1() {
    logStep('Scenario 1', 'Doctor calls, cuts before patient joins');

    // Setup listeners first
    const invitePromise = new Promise(resolve => {
        patientSocket.once('call:invite', (data) => {
            logInfo(`Patient received invite for ${data.callId}`);
            resolve(data);
        });
    });

    // 1. Doctor initiates
    const initResp = await initiateCall(doctorSocket, testAppointment._id);
    const callId = initResp.callId;
    logInfo(`Call initiated: ${callId}`);

    // Wait for invite (filtering by proper callId if needed, but here assuming sequential)
    const invite = await Promise.race([
        invitePromise,
        new Promise((_, r) => setTimeout(() => r(new Error('Timeout waiting for invite')), 5000))
    ]);
    if (invite.callId !== callId) throw new Error(`Invite callId mismatch: ${invite.callId}`);
    logSuccess('Patient received invite');

    // Setup ended listener BEFORE emitting end
    const endedPromise = new Promise(resolve => {
        patientSocket.on('call:ended', (data) => {
            logInfo(`Patient received call:ended: ${JSON.stringify(data)}`);
            if (data.callId === callId) {
                patientSocket.off('call:ended'); // clean up
                resolve(data);
            }
        });
    });

    // 2. Doctor ends call immediately (before patient accept)
    logInfo('Doctor ending call now...');
    doctorSocket.emit('call:end', { callId });

    // 3. Verify patient receives call:ended
    try {
        await Promise.race([
            endedPromise,
            new Promise((_, r) => setTimeout(() => r(new Error('Timeout waiting for call:ended')), 5000))
        ]);
        logSuccess('Patient received call:ended');
    } catch (e) {
        logError(e.message);
        throw e;
    }

    // Verify DB
    const call = await Call.findOne({ callId });
    if (call.status === 'ended') logSuccess('DB Status: ended');
    else logError(`DB Status expected ended, got ${call.status}`);

    await new Promise(r => setTimeout(r, 1000)); // Cool down
}

// 2. Doctor calls, patient declines
async function runScenario2() {
    logStep('Scenario 2', 'Doctor calls, patient declines');

    // Setup invite listener
    const invitePromise = new Promise(resolve => {
        patientSocket.once('call:invite', resolve);
    });

    const initResp = await initiateCall(doctorSocket, testAppointment._id);
    const callId = initResp.callId;
    logInfo(`Call initiated: ${callId}`);

    // Wait for invite
    const invite = await invitePromise;
    if (invite.callId !== callId) throw new Error('Invite callId mismatch');

    // Setup declined listener
    const declinedPromise = new Promise(resolve => {
        doctorSocket.once('call:declined', (data) => {
            if (data.callId === callId) resolve(data);
        });
    });

    // Patient declines
    logInfo('Patient declining call...');
    patientSocket.emit('call:decline', { callId });

    // Verify Doctor receives call:declined
    try {
        await Promise.race([
            declinedPromise,
            new Promise((_, r) => setTimeout(() => r(new Error('Timeout waiting for call:declined')), 5000))
        ]);
        logSuccess('Doctor received call:declined');
    } catch (e) {
        logError(e.message);
        throw e;
    }

    const call = await Call.findOne({ callId });
    if (call.status === 'declined') logSuccess('DB Status: declined');
    else logError(`DB Status expected declined, got ${call.status}`);

    await new Promise(r => setTimeout(r, 1000));
}

// 3. Doctor calls, patient joins (Just connection setup, we can't test audio quality here)
async function runScenario3() {
    logStep('Scenario 3', 'Doctor calls, patient joins');

    const initResp = await initiateCall(doctorSocket, testAppointment._id);
    const callId = initResp.callId;

    // Wait for invite
    await new Promise(resolve => {
        patientSocket.once('call:invite', (data) => {
            if (data.callId === callId) resolve(data);
        });
    });

    // Patient accepts
    logInfo('Patient accepting call...');
    patientSocket.emit('call:accept', { callId });

    // Verify Doctor gets call:accepted
    const acceptedDoctorPromise = new Promise(resolve => doctorSocket.once('call:accepted', resolve));

    await acceptedDoctorPromise;
    logSuccess('Doctor received call:accepted');

    // In a real flow, client emits 'call:joined' after WebRTC.
    // We should simulate that to "Start" the call fully in the eyes of the backend/doctor UI logic if relevant.
    // Looking at code: Doctor waits for 'call:patientJoined'.
    patientSocket.emit('call:joined', { callId }); // Patient emits this after Mediasoup connect

    const patientJoinedPromise = new Promise(resolve => doctorSocket.once('call:patientJoined', resolve));
    await patientJoinedPromise;
    logSuccess('Doctor received call:patientJoined');

    const call = await Call.findOne({ callId });
    if (call.status === 'accepted') logSuccess('DB Status: accepted'); // Status usually stays accepted until ended
    else logError(`DB Status expected accepted, got ${call.status}`);

    // We will leave this call "active" to be ended by next scenarios? No, let's end it clean.
    doctorSocket.emit('call:end', { callId });
    await new Promise(r => setTimeout(r, 1000));
}

// 4. Doctor calls, patient joins, Doctor cuts
async function runScenario4() {
    logStep('Scenario 4', 'Doctor calls, patient joins, Doctor cuts');

    // Setup Call
    const invitePromise = new Promise(r => patientSocket.once('call:invite', r));
    const initResp = await initiateCall(doctorSocket, testAppointment._id);
    const callId = initResp.callId;

    await invitePromise;

    const acceptedPromise = new Promise(r => doctorSocket.once('call:accepted', r));
    patientSocket.emit('call:accept', { callId });
    await acceptedPromise;

    patientSocket.emit('call:joined', { callId });

    // Setup ended listener
    const endedPromise = new Promise(resolve => patientSocket.once('call:ended', resolve));

    // Doctor Cuts
    logInfo('Doctor ending call...');
    doctorSocket.emit('call:end', { callId });

    // Verify Patient receives call:ended
    await endedPromise;
    logSuccess('Patient received call:ended');

    const call = await Call.findOne({ callId });
    if (call.status === 'ended') logSuccess('DB Status: ended');
    else logError(`DB Status expected ended, got ${call.status}`);

    await new Promise(r => setTimeout(r, 1000));
}

// 5. Doctor calls, patient joins, Patient cuts
async function runScenario5() {
    logStep('Scenario 5', 'Doctor calls, patient joins, Patient cuts');

    // Setup Call
    const invitePromise = new Promise(r => patientSocket.once('call:invite', r));
    const initResp = await initiateCall(doctorSocket, testAppointment._id);
    const callId = initResp.callId;

    await invitePromise;

    const acceptedPromise = new Promise(r => doctorSocket.once('call:accepted', r));
    patientSocket.emit('call:accept', { callId });
    await acceptedPromise;

    patientSocket.emit('call:joined', { callId });

    // Setup ended listener
    const endedPromise = new Promise(resolve => doctorSocket.once('call:ended', resolve));

    // Patient Cuts
    logInfo('Patient ending call...');
    patientSocket.emit('call:end', { callId });

    // Verify Doctor receives call:ended
    await endedPromise;
    logSuccess('Doctor received call:ended');

    const call = await Call.findOne({ callId });
    if (call.status === 'ended') logSuccess('DB Status: ended');
    else logError(`DB Status expected ended, got ${call.status}`);

    await new Promise(r => setTimeout(r, 1000));
}


async function runTests() {
    try {
        log('\n🧪 Starting Detailed Audio Call Flow Verification\n', 'cyan');
        await connectDB();
        await setupTestUsers();
        await setupAppointment();
        await connectSockets();

        await runScenario1();
        await runScenario2();
        await runScenario3();
        await runScenario4();
        await runScenario5();

        log('\n🎉 All scenarios verified successfully!', 'green');
        process.exit(0);
    } catch (error) {
        logError(`\nTest failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

runTests();
