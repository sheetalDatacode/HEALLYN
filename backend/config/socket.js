const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenService');
const { getModelForRole } = require('../utils/getModelForRole');
const Call = require('../models/Call');
const Appointment = require('../models/Appointment');
const {
  getRtpCapabilities,
  createWebRtcTransport,
  connectTransport,
  createProducer,
  createConsumer,
  resumeConsumer,
  getProducersForCall,
  getCallIdForTransport,
  getCallIdForRouter,
  getTransport,
  cleanupCall,
  getIceServers,
} = require('./mediasoup');

let io;

const initializeSocket = (server) => {
  // Determine allowed origins
  // Build a comprehensive list of allowed origins
  const baseOrigins = process.env.SOCKET_IO_CORS_ORIGIN
    ? process.env.SOCKET_IO_CORS_ORIGIN.split(',').map(origin => origin.trim())
    : process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  // Add production domains if not already included
  const productionOrigins = [
    'https://healiinnx.vercel.app',
    'https://www.healiinnx.vercel.app',
    'https://heallyn.vercel.app',
    'https://www.heallyn.vercel.app',
  ];

  // Combine and deduplicate origins
  const allowedOrigins = [...new Set([...baseOrigins, ...productionOrigins])];

  // In development, allow all localhost origins
  const isDevelopment = process.env.NODE_ENV !== 'production';

  io = new Server(server, {
    cors: {
      origin: isDevelopment
        ? (origin, callback) => {
          // Allow all localhost origins in development
          if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
        : (origin, callback) => {
          // In production, check against allowed origins
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.warn('Socket.IO connection rejected: No token provided');
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token format first
      if (typeof token !== 'string' || token.trim().length === 0) {
        console.warn('Socket.IO connection rejected: Invalid token format');
        return next(new Error('Authentication error: Invalid token format'));
      }

      const decoded = await verifyAccessToken(token);

      if (!decoded || !decoded.id || !decoded.role) {
        console.warn('Socket.IO connection rejected: Invalid token payload');
        return next(new Error('Authentication error: Invalid token payload'));
      }

      const Model = getModelForRole(decoded.role);

      if (!Model) {
        console.warn(`Socket.IO connection rejected: Invalid role (${decoded.role})`);
        return next(new Error('Authentication error: Invalid role'));
      }

      const user = await Model.findById(decoded.id).select('-password');

      if (!user) {
        console.warn(`Socket.IO connection rejected: User not found (${decoded.role}:${decoded.id})`);
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = { id: decoded.id, role: decoded.role, user };
      
      next();
    } catch (error) {
      // More specific error handling
      if (error.name === 'JsonWebTokenError') {
        console.warn('Socket.IO connection rejected: Invalid token format', {
          name: error.name,
          message: error.message,
        });
        return next(new Error('Authentication error: Invalid token'));
      }

      if (error.name === 'TokenExpiredError') {
        console.warn('Socket.IO connection rejected: Token expired', {
          name: error.name,
          message: error.message,
        });
        return next(new Error('Authentication error: Token expired'));
      }

      if (error.message?.includes('Token missing') || error.message?.includes('Token invalid')) {
        console.warn('Socket.IO connection rejected:', error.message);
        return next(error);
      }

      console.error('Socket.IO authentication error:', {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, user } = socket.user;

    

    // Join role-specific room (ensure id is string)
    const userIdStr = id.toString();
    const userRoom = `${role}-${userIdStr}`;
    socket.join(userRoom);
    

    // For patients, also log which rooms they're in
    if (role === 'patient') {
      socket.rooms.forEach(room => {
        
      });
    }

    // Join general rooms for broadcasting
    if (role === 'doctor') {
      socket.join('doctors');
    } else if (role === 'pharmacy') {
      socket.join('pharmacies');
    } else if (role === 'laboratory') {
      socket.join('laboratories');
    } else if (role === 'admin') {
      socket.join('admins');
    } else if (role === 'patient') {
      socket.join('patients');
    }

    // Handle appointment events
    socket.on('appointment:subscribe', (appointmentId) => {
      socket.join(`appointment-${appointmentId}`);
    });

    socket.on('appointment:unsubscribe', (appointmentId) => {
      socket.leave(`appointment-${appointmentId}`);
    });

    // Handle order events
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order-${orderId}`);
    });

    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(`order-${orderId}`);
    });

    // Handle request events
    socket.on('request:subscribe', (requestId) => {
      socket.join(`request-${requestId}`);
    });

    socket.on('request:unsubscribe', (requestId) => {
      socket.leave(`request-${requestId}`);
    });

    // ========== Call Events ==========

    // Test event to verify socket is working
    socket.on('test:ping', (data, callback) => {
      
      if (typeof callback === 'function') {
        callback({ pong: true, timestamp: Date.now() });
      }
    });

    // Doctor initiates call
    socket.on('call:initiate', async (data, callback) => {
      
      
      try {
        if (role !== 'doctor') {
          console.warn(`📞 [call:initiate] Rejected - not a doctor. Role: ${role}`);
          return socket.emit('call:error', { message: 'Only doctors can initiate calls' });
        }

        const { appointmentId } = data;
        if (!appointmentId) {
          return socket.emit('call:error', { message: 'appointmentId is required' });
        }

        // Verify appointment exists and belongs to this doctor
        const appointment = await Appointment.findById(appointmentId).populate('patientId', 'firstName lastName');
        if (!appointment) {
          return socket.emit('call:error', { message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== id) {
          return socket.emit('call:error', { message: 'Unauthorized: Appointment does not belong to you' });
        }

        if (appointment.consultationMode !== 'call') {
          return socket.emit('call:error', { message: 'Audio call is only available for call consultation mode' });
        }

        // Check if there's already an active call for this appointment
        const existingCall = await Call.findOne({
          appointmentId,
          status: { $in: ['initiated', 'accepted'] },
        });

        if (existingCall) {
          const errorMsg = 'A call is already in progress for this appointment';
          socket.emit('call:error', { message: errorMsg });
          if (typeof callback === 'function') {
            callback({ error: errorMsg });
          }
          return;
        }

        // Create call record
        const call = new Call({
          appointmentId,
          doctorId: id,
          patientId: appointment.patientId,
          status: 'initiated',
        });
        await call.save();

        // Join call room
        socket.join(`call-${call.callId}`);

        // Send invite to patient
        const io = getIO();
        // Convert patientId to string to ensure consistent format
        const patientIdStr = appointment.patientId.toString();
        const patientRoom = `patient-${patientIdStr}`;
        

        // Check if patient is in the room
        const patientRoomSockets = await io.in(patientRoom).fetchSockets();
        

        // Also try emitting to all patient sockets to debug
        const allPatientSockets = await io.in('patients').fetchSockets();
        

        // Emit to specific patient room (primary method)
        io.to(patientRoom).emit('call:invite', {
          callId: call.callId,
          appointmentId,
          doctorName: user.firstName + ' ' + (user.lastName || ''),
        });

        

        // ALWAYS also emit to 'patients' room as fallback to ensure delivery
        // This ensures the event is received even if the patient's socket room assignment is delayed
        io.to('patients').emit('call:invite', {
          callId: call.callId,
          appointmentId,
          doctorName: user.firstName + ' ' + (user.lastName || ''),
          patientId: patientIdStr, // Include patientId so frontend can filter
        });
        

        // Log warning if no sockets in specific room (for debugging)
        if (patientRoomSockets.length === 0) {
          console.warn(`⚠️ No sockets found in patient room ${patientRoom}, but broadcast sent to 'patients' room as fallback`);
        }

        socket.emit('call:initiated', { callId: call.callId });
        

        // Send acknowledgment if callback provided
        if (typeof callback === 'function') {
          callback({ callId: call.callId, success: true });
          
        }

        // Send acknowledgment if callback provided
        if (typeof callback === 'function') {
          callback({ callId: call.callId, success: true });
        }
      } catch (error) {
        console.error('Error in call:initiate:', error);
        const errorMessage = error.message || 'Failed to initiate call';
        socket.emit('call:error', { message: errorMessage });

        // Send error in callback if provided
        if (typeof callback === 'function') {
          callback({ error: errorMessage });
        }
      }
    });

    // Patient accepts call
    socket.on('call:accept', async (data, callback) => {
      
      try {
        if (role !== 'patient') {
          const error = { message: 'Only patients can accept calls' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        const { callId } = data;
        if (!callId) {
          const error = { message: 'callId is required' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        const call = await Call.findOne({ callId });
        if (!call) {
          const error = { message: 'Call not found' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        if (call.patientId.toString() !== id) {
          const error = { message: 'Unauthorized: This call is not for you' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        if (call.status !== 'initiated') {
          const error = { message: `Call cannot be accepted. Current status: ${call.status}` };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        // Update call status
        call.status = 'accepted';
        call.startTime = new Date();
        await call.save();

        // Join call room
        socket.join(`call-${callId}`);
        

        // Create router for this call
        await getRtpCapabilities(callId);
        

        // Notify doctor
        const io = getIO();
        const doctorIdStr = call.doctorId.toString();
        const doctorRoom = `doctor-${doctorIdStr}`;
        

        // Get number of sockets in the room for debugging
        const room = io.sockets.adapter.rooms.get(doctorRoom);
        const socketCount = room ? room.size : 0;
        

        io.to(doctorRoom).emit('call:accepted', {
          callId,
          appointmentId: call.appointmentId,
        });
        

        // Notify patient (the one who accepted)
        socket.emit('call:accepted', { callId });
        

        // Send callback if provided
        if (typeof callback === 'function') {
          callback({ success: true, callId });
        }
      } catch (error) {
        console.error('Error in call:accept:', error);
        const errorMessage = { message: error.message || 'Failed to accept call' };
        socket.emit('call:error', errorMessage);
        if (typeof callback === 'function') {
          callback({ error: errorMessage.message });
        }
      }
    });

    // Patient declines call
    socket.on('call:decline', async (data, callback) => {
      
      try {
        if (role !== 'patient') {
          const error = { message: 'Only patients can decline calls' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        const { callId } = data;
        if (!callId) {
          const error = { message: 'callId is required' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        const call = await Call.findOne({ callId });
        if (!call) {
          const error = { message: 'Call not found' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        if (call.patientId.toString() !== id) {
          const error = { message: 'Unauthorized: This call is not for you' };
          socket.emit('call:error', error);
          if (typeof callback === 'function') {
            callback({ error: error.message });
          }
          return;
        }

        if (call.status === 'ended' || call.status === 'declined') {
          const result = { success: true, callId, message: 'Call already declined or ended' };
          socket.emit('call:declined', { callId });
          if (typeof callback === 'function') {
            callback(result);
          }
          return;
        }

        // Update call status
        call.status = 'declined';
        await call.save();
        

        // Notify doctor
        const io = getIO();
        const doctorIdStrDecline = call.doctorId.toString();
        const doctorRoomDecline = `doctor-${doctorIdStrDecline}`;
        const callRoomDecline = `call-${callId}`;
        const eventData = { callId };

        // Emit to call room (primary method - both parties should be in this room)
        io.to(callRoomDecline).emit('call:declined', eventData);
        

        // Emit to specific doctor room (primary method)
        io.to(doctorRoomDecline).emit('call:declined', eventData);
        

        // Also emit to 'doctors' room as fallback to ensure delivery
        io.to('doctors').emit('call:declined', { ...eventData, doctorId: doctorIdStrDecline });
        

        // Notify patient (the one who declined)
        socket.emit('call:declined', eventData);
        

        // Send callback if provided
        if (typeof callback === 'function') {
          callback({ success: true, callId });
        }
      } catch (error) {
        console.error('Error in call:decline:', error);
        const errorMessage = { message: error.message || 'Failed to decline call' };
        socket.emit('call:error', errorMessage);
        if (typeof callback === 'function') {
          callback({ error: errorMessage.message });
        }
      }
    });

    // End call (either party)
    socket.on('call:end', async (data) => {
      try {
        const { callId } = data;
        if (!callId) {
          return socket.emit('call:error', { message: 'callId is required' });
        }

        const call = await Call.findOne({ callId });
        if (!call) {
          return socket.emit('call:error', { message: 'Call not found' });
        }

        // Verify user is part of this call
        const isDoctor = role === 'doctor' && call.doctorId.toString() === id;
        const isPatient = role === 'patient' && call.patientId.toString() === id;

        if (!isDoctor && !isPatient) {
          return socket.emit('call:error', { message: 'Unauthorized' });
        }

        if (call.status === 'ended') {
          return; // Already ended
        }

        // End call
        await call.endCall();

        // Cleanup mediasoup resources (may not exist if call was in 'initiated' status)
        try {
          await cleanupCall(callId);
        } catch (cleanupError) {
          // Log error but continue - call is already marked as ended in DB
          // This can happen if call was in 'initiated' status and no mediasoup resources exist
          console.warn(`📞 [call:end] Cleanup warning for callId ${callId}:`, cleanupError.message);
        }

        // Notify all participants (always emit even if cleanup had issues)
        const io = getIO();
        const eventData = { callId };

        
        
        

        // Emit to call room (primary method - both parties should be in this room)
        const callRoom = `call-${callId}`;
        io.to(callRoom).emit('call:ended', eventData);
        

        // Also emit to specific user rooms as fallback to ensure delivery
        const doctorIdStr = call.doctorId.toString();
        const patientIdStr = call.patientId.toString();
        const doctorRoom = `doctor-${doctorIdStr}`;
        const patientRoom = `patient-${patientIdStr}`;

        io.to(doctorRoom).emit('call:ended', eventData);
        

        io.to(patientRoom).emit('call:ended', eventData);
        

        // Also emit to general role rooms as additional fallback
        io.to('doctors').emit('call:ended', { ...eventData, doctorId: doctorIdStr });
        io.to('patients').emit('call:ended', { ...eventData, patientId: patientIdStr });
        

        // Emit directly to the socket that initiated the end (redundant but ensures delivery)
        socket.emit('call:ended', eventData);
      } catch (error) {
        console.error('Error in call:end:', error);
        socket.emit('call:error', { message: error.message || 'Failed to end call' });
      }
    });

    // Join call room explicitly (for new sockets or late joiners)
    socket.on('call:joinRoom', async (data, callback) => {
      try {
        const { callId } = data;
        if (!callId) {
          console.warn(`📞 [call:joinRoom] Missing callId from ${role} ${id}`);
          return callback({ error: 'callId is required' });
        }

        
        const call = await Call.findOne({ callId });
        if (!call) {
          console.warn(`📞 [call:joinRoom] Call not found: ${callId}`);
          return callback({ error: 'Call not found' });
        }

        // Verify user is part of this call
        const isDoctor = role === 'doctor' && call.doctorId.toString() === id;
        const isPatient = role === 'patient' && call.patientId.toString() === id;

        if (!isDoctor && !isPatient) {
          console.warn(`📞 [call:joinRoom] Unauthorized: ${role} ${id} not part of call ${callId}`);
          return callback({ error: 'Unauthorized' });
        }

        // Join call room
        socket.join(`call-${callId}`);
        
        

        callback({ success: true, callId });
      } catch (error) {
        console.error(`📞 [call:joinRoom] Error:`, error);
        callback({ error: error.message || 'Failed to join call room' });
      }
    });

    // Patient has successfully joined the call (mediasoup connected)
    socket.on('call:joined', async (data, callback) => {
      
      
      
      

      try {
        if (role !== 'patient') {
          console.warn(`📞 [call:joined] Rejected - not a patient. Role: ${role}`);
          if (typeof callback === 'function') {
            callback({ error: 'Only patients can join calls' });
          }
          return;
        }

        const { callId } = data;
        if (!callId) {
          console.warn('📞 [call:joined] callId is required');
          if (typeof callback === 'function') {
            callback({ error: 'callId is required' });
          }
          return;
        }

        const call = await Call.findOne({ callId }).populate('doctorId', 'firstName lastName');
        if (!call) {
          console.warn(`📞 [call:joined] Call not found: ${callId}`);
          if (typeof callback === 'function') {
            callback({ error: 'Call not found' });
          }
          return;
        }

        

        if (call.patientId.toString() !== id) {
          console.warn(`📞 [call:joined] Unauthorized - call does not belong to patient ${id}. Call patientId: ${call.patientId}`);
          if (typeof callback === 'function') {
            callback({ error: 'Unauthorized' });
          }
          return;
        }

        // Verify patient is in the call room
        const callRoom = `call-${callId}`;
        if (!socket.rooms.has(callRoom)) {
          console.warn(`📞 [call:joined] Patient not in call room, joining now...`);
          socket.join(callRoom);
        }
        
        

        // Notify doctor that patient has actually joined
        const io = getIO();
        const doctorId = call.doctorId._id || call.doctorId;
        const doctorIdStr = doctorId.toString();
        const doctorRoom = `doctor-${doctorIdStr}`;

        
        
        

        // Get all rooms to debug
        

        // Get number of sockets in the room for debugging
        const room = io.sockets.adapter.rooms.get(doctorRoom);
        const socketCount = room ? room.size : 0;
        

        // Also check which sockets are in the room
        if (socketCount > 0) {
          const socketsInRoom = await io.in(doctorRoom).fetchSockets();
          
        } else {
          console.warn(`📞 [call:joined] ⚠️ WARNING: No doctor sockets found in room ${doctorRoom}!`);
          console.warn(`📞 [call:joined] This means the doctor is not connected or not in the room.`);
        }

        const eventData = {
          callId,
          appointmentId: call.appointmentId,
          doctorId: doctorIdStr, // Always include doctorId for filtering
        };
        

        // Emit to specific doctor room (primary method)
        io.to(doctorRoom).emit('call:patientJoined', eventData);
        

        // ALWAYS also emit to 'doctors' room as a fallback to ensure delivery
        // This ensures the event is received even if the doctor's socket room assignment is delayed
        io.to('doctors').emit('call:patientJoined', eventData);
        

        if (typeof callback === 'function') {
          callback({ success: true, callId });
        }
      } catch (error) {
        console.error('📞 [call:joined] Error processing call:joined:', error);
        console.error('📞 [call:joined] Error stack:', error.stack);
        if (typeof callback === 'function') {
          callback({ error: error.message || 'Failed to process join' });
        }
      }
    });

    // Leave call (cleanup on disconnect)
    socket.on('call:leave', async (data) => {
      try {
        const { callId } = data;
        if (callId) {
          socket.leave(`call-${callId}`);
        }
      } catch (error) {
        console.error('Error in call:leave:', error);
      }
    });

    // ========== mediasoup Events ==========

    // Get RTP capabilities
    socket.on('mediasoup:getRtpCapabilities', async (data, callback) => {
      try {
        const { callId } = data;
        if (!callId) {
          return callback({ error: 'callId is required' });
        }

        const rtpCapabilities = await getRtpCapabilities(callId);
        const iceServers = getIceServers();

        callback({
          rtpCapabilities,
          iceServers,
        });
      } catch (error) {
        console.error('Error in mediasoup:getRtpCapabilities:', error);
        callback({ error: error.message || 'Failed to get RTP capabilities' });
      }
    });

    // Create WebRTC transport
    socket.on('mediasoup:createWebRtcTransport', async (data, callback) => {
      try {
        const { callId, options } = data;
        if (!callId) {
          return callback({ error: 'callId is required' });
        }

        const transport = await createWebRtcTransport(callId, options);
        callback({ transport });
      } catch (error) {
        console.error('Error in mediasoup:createWebRtcTransport:', error);
        callback({ error: error.message || 'Failed to create transport' });
      }
    });

    // Connect transport
    socket.on('mediasoup:connectTransport', async (data, callback) => {
      try {
        const { transportId, dtlsParameters, callId } = data;
        
        

        if (!transportId || !dtlsParameters) {
          console.error(`📞 [mediasoup:connectTransport] ❌ Missing required parameters:`, {
            hasTransportId: !!transportId,
            hasDtlsParameters: !!dtlsParameters
          });
          return callback({ error: 'transportId and dtlsParameters are required' });
        }

        

        await connectTransport(transportId, dtlsParameters);
        
        callback({ success: true });
      } catch (error) {
        console.error(`📞 [mediasoup:connectTransport] ❌ Error connecting transport:`, error);
        console.error(`📞 [mediasoup:connectTransport] Error details:`, {
          message: error.message,
          stack: error.stack,
          transportId: data?.transportId
        });
        callback({ error: error.message || 'Failed to connect transport' });
      }
    });

    // Produce audio
    socket.on('mediasoup:produce', async (data, callback) => {
      try {
        const { transportId, rtpParameters, kind } = data;
        if (!transportId || !rtpParameters || !kind) {
          return callback({ error: 'transportId, rtpParameters, and kind are required' });
        }

        if (kind !== 'audio') {
          return callback({ error: 'Only audio is supported' });
        }

        
        const producerCreateStartTime = Date.now();
        const producer = await createProducer(transportId, rtpParameters, kind);
        const producerCreateDuration = Date.now() - producerCreateStartTime;
        

        // DIAGNOSTIC: Log producer creation details
        

        // Notify other participants about new producer
        // CRITICAL FIX: Get callId from transport mapping instead of relying on socket rooms
        // This fixes the race condition where socket might not be in room yet
        let callId = null;

        // Method 1: Try transport-to-callId mapping (most reliable)
        callId = getCallIdForTransport(transportId);
        if (callId) {
          
        } else {
          // Method 2: Try router lookup (fallback)
          const transport = getTransport(transportId);
          if (transport && transport.router) {
            callId = getCallIdForRouter(transport.router);
            if (callId) {
              
            } else {
              
            }
          } else {
            
          }
        }

        // Method 3: Fallback to socket rooms (for backward compatibility)
        if (!callId) {
          const callRooms = Array.from(socket.rooms).filter(room => room.startsWith('call-'));
          if (callRooms.length > 0) {
            callId = callRooms[0].replace('call-', '');
            
          }
        }

        // Emit event if we found a callId
        if (callId) {
          const io = getIO();
          const callRoom = `call-${callId}`;

          // DIAGNOSTIC: Check how many sockets are in the call room
          const room = io.sockets.adapter.rooms.get(callRoom);
          const socketCount = room ? room.size : 0;

          
          

          io.to(callRoom).emit('mediasoup:newProducer', {
            producerId: producer.id,
            kind: producer.kind,
          });

          

          // DIAGNOSTIC: Verify event was actually sent
          if (socketCount === 0) {
            console.warn(`🔍 [DIAGNOSTIC] ⚠️ WARNING: Event emitted to empty room! No sockets in ${callRoom}`);
            console.warn(`🔍 [DIAGNOSTIC] This means the other party may not receive the producer notification`);
          }
        } else {
          console.error(`📞 [mediasoup:produce] ❌ WARNING: Could not determine callId for transport ${transportId}. Event NOT emitted!`);
          console.error(`🔍 [DIAGNOSTIC] CallId lookup failed:`, {
            transportId: transportId,
            socketId: socket.id,
            socketRooms: Array.from(socket.rooms),
            lookupMethods: {
              transportMapping: 'failed',
              routerLookup: 'failed',
              socketRooms: 'failed'
            }
          });
          // Still return success for producer creation, but log the issue
        }

        callback({ producer });
      } catch (error) {
        console.error('📞 [mediasoup:produce] Error:', error);
        callback({ error: error.message || 'Failed to produce' });
      }
    });

    // Consume remote audio
    socket.on('mediasoup:consume', async (data, callback) => {
      try {
        const { transportId, producerId, rtpCapabilities, callId } = data;
        if (!transportId || !producerId || !rtpCapabilities || !callId) {
          return callback({ error: 'transportId, producerId, rtpCapabilities, and callId are required' });
        }

        const consumer = await createConsumer(transportId, producerId, rtpCapabilities, callId);
        callback({ consumer });
      } catch (error) {
        console.error('Error in mediasoup:consume:', error);
        callback({ error: error.message || 'Failed to consume' });
      }
    });

    // Resume consumer (consumers are paused by default in mediasoup)
    socket.on('mediasoup:resumeConsumer', async (data, callback) => {
      try {
        const { consumerId } = data;
        if (!consumerId) {
          return callback({ error: 'consumerId is required' });
        }

        await resumeConsumer(consumerId);
        callback({ success: true });
      } catch (error) {
        console.error('Error in mediasoup:resumeConsumer:', error);
        callback({ error: error.message || 'Failed to resume consumer' });
      }
    });

    // Get existing producers for a call
    socket.on('mediasoup:getProducers', async (data, callback) => {
      try {
        const { callId } = data;
        if (!callId) {
          return callback({ error: 'callId is required' });
        }

        const existingProducers = getProducersForCall(callId);
        
        callback({ producers: existingProducers });
      } catch (error) {
        console.error('Error in mediasoup:getProducers:', error);
        callback({ error: error.message || 'Failed to get producers' });
      }
    });

    // ========== P2P WebRTC Events (Fallback for 1-to-1 calls) ==========

    // Get ICE servers for P2P (includes TURN if configured)
    socket.on('p2p:getIceServers', (data, callback) => {
      try {
        const iceServers = getIceServers();
        if (typeof callback === 'function') {
          callback({ iceServers });
        }
      } catch (error) {
        console.error('Error in p2p:getIceServers:', error);
        if (typeof callback === 'function') {
          callback({ error: error.message || 'Failed to get ICE servers' });
        }
      }
    });

    // Handle P2P offer
    socket.on('p2p:offer', async (data, callback) => {
      try {
        const { callId, offer } = data;
        if (!callId || !offer) {
          if (typeof callback === 'function') {
            return callback({ error: 'callId and offer are required' });
          }
          return;
        }

        // Verify user is part of this call
        const call = await Call.findOne({ callId });
        if (!call) {
          if (typeof callback === 'function') {
            return callback({ error: 'Call not found' });
          }
          return;
        }

        const isDoctor = role === 'doctor' && call.doctorId.toString() === id;
        const isPatient = role === 'patient' && call.patientId.toString() === id;
        if (!isDoctor && !isPatient) {
          if (typeof callback === 'function') {
            return callback({ error: 'Unauthorized' });
          }
          return;
        }

        // Forward offer to the other party
        const io = getIO();
        const otherPartyId = isDoctor ? call.patientId.toString() : call.doctorId.toString();
        const otherPartyRoom = isDoctor ? `patient-${otherPartyId}` : `doctor-${otherPartyId}`;

        
        io.to(otherPartyRoom).emit('p2p:offer', {
          callId,
          offer,
          from: id,
          fromRole: role
        });

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (error) {
        console.error('Error in p2p:offer:', error);
        if (typeof callback === 'function') {
          callback({ error: error.message || 'Failed to handle offer' });
        }
      }
    });

    // Handle P2P answer
    socket.on('p2p:answer', async (data, callback) => {
      try {
        const { callId, answer } = data;
        if (!callId || !answer) {
          if (typeof callback === 'function') {
            return callback({ error: 'callId and answer are required' });
          }
          return;
        }

        // Verify user is part of this call
        const call = await Call.findOne({ callId });
        if (!call) {
          if (typeof callback === 'function') {
            return callback({ error: 'Call not found' });
          }
          return;
        }

        const isDoctor = role === 'doctor' && call.doctorId.toString() === id;
        const isPatient = role === 'patient' && call.patientId.toString() === id;
        if (!isDoctor && !isPatient) {
          if (typeof callback === 'function') {
            return callback({ error: 'Unauthorized' });
          }
          return;
        }

        // Forward answer to the other party
        const io = getIO();
        const otherPartyId = isDoctor ? call.patientId.toString() : call.doctorId.toString();
        const otherPartyRoom = isDoctor ? `patient-${otherPartyId}` : `doctor-${otherPartyId}`;

        
        io.to(otherPartyRoom).emit('p2p:answer', {
          callId,
          answer,
          from: id,
          fromRole: role
        });

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (error) {
        console.error('Error in p2p:answer:', error);
        if (typeof callback === 'function') {
          callback({ error: error.message || 'Failed to handle answer' });
        }
      }
    });

    // Handle P2P ICE candidate
    socket.on('p2p:iceCandidate', async (data, callback) => {
      try {
        const { callId, candidate } = data;
        if (!callId || !candidate) {
          if (typeof callback === 'function') {
            return callback({ error: 'callId and candidate are required' });
          }
          return;
        }

        // Verify user is part of this call
        const call = await Call.findOne({ callId });
        if (!call) {
          if (typeof callback === 'function') {
            return callback({ error: 'Call not found' });
          }
          return;
        }

        const isDoctor = role === 'doctor' && call.doctorId.toString() === id;
        const isPatient = role === 'patient' && call.patientId.toString() === id;
        if (!isDoctor && !isPatient) {
          if (typeof callback === 'function') {
            return callback({ error: 'Unauthorized' });
          }
          return;
        }

        // Forward ICE candidate to the other party
        const io = getIO();
        const otherPartyId = isDoctor ? call.patientId.toString() : call.doctorId.toString();
        const otherPartyRoom = isDoctor ? `patient-${otherPartyId}` : `doctor-${otherPartyId}`;

        
        io.to(otherPartyRoom).emit('p2p:iceCandidate', {
          callId,
          candidate,
          from: id,
          fromRole: role
        });

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (error) {
        console.error('Error in p2p:iceCandidate:', error);
        if (typeof callback === 'function') {
          callback({ error: error.message || 'Failed to handle ICE candidate' });
        }
      }
    });

    socket.on('disconnect', async () => {
      

      // Cleanup: Leave all call rooms and handle any active calls
      const callRooms = Array.from(socket.rooms).filter(room => room.startsWith('call-'));
      for (const room of callRooms) {
        const callId = room.replace('call-', '');
        try {
          const call = await Call.findOne({ callId });
          if (call && (call.status === 'accepted' || call.status === 'initiated')) {
            // If call is active or initiated, end it
            await call.endCall();
            await cleanupCall(callId);

            // Notify other participant
            const io = getIO();
            io.to(room).emit('call:ended', { callId, reason: 'participant_disconnected' });

            // Also emit to user rooms as fallback
            const doctorIdStr = call.doctorId.toString();
            const patientIdStr = call.patientId.toString();
            io.to(`doctor-${doctorIdStr}`).emit('call:ended', { callId, reason: 'participant_disconnected' });
            io.to(`patient-${patientIdStr}`).emit('call:ended', { callId, reason: 'participant_disconnected' });
          }
        } catch (error) {
          console.error(`Error cleaning up call ${callId} on disconnect:`, error);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

// Helper functions to emit events
const emitToUser = (userId, role, event, data) => {
  if (io) {
    io.to(`${role}-${userId}`).emit(event, data);
  }
};

const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRoom,
  emitToAll,
};

