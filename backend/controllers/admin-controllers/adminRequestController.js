const asyncHandler = require('../../middleware/asyncHandler');
const Request = require('../../models/Request');
const Order = require('../../models/Order');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const { getIO } = require('../../config/socket');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/requests
exports.getRequests = asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('patientId', 'firstName lastName phone email address')
      .populate({
        path: 'prescriptionId',
        populate: [
          {
            path: 'doctorId',
            select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
          },
          {
            path: 'patientId',
            select: 'firstName lastName dateOfBirth gender phone email address',
          },
          {
            path: 'consultationId',
            select: 'consultationDate diagnosis symptoms investigations advice followUpDate',
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Request.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/requests/:id
exports.getRequestById = asyncHandler(async (req, res) => {
  const { id: requestId } = req.params;

  const request = await Request.findById(requestId)
    .populate('patientId')
    .populate({
      path: 'prescriptionId',
      populate: [
        {
          path: 'doctorId',
          select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
        },
        {
          path: 'patientId',
          select: 'firstName lastName dateOfBirth gender phone email address',
        },
        {
          path: 'consultationId',
          select: 'consultationDate diagnosis symptoms investigations advice followUpDate',
        },
      ],
    })
    .populate('orders');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
  });
});

// POST /api/admin/requests/:id/accept
exports.acceptRequest = asyncHandler(async (req, res) => {
  const { id: requestId } = req.params;

  const request = await Request.findById(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request already processed',
    });
  }

  request.status = 'accepted';
  await request.save();

  // Get populated request for notifications
  const populatedRequest = await Request.findById(request._id)
    .populate('patientId', 'firstName lastName phone email')
    .populate({
      path: 'prescriptionId',
      populate: [
        {
          path: 'doctorId',
          select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
        },
        {
          path: 'patientId',
          select: 'firstName lastName dateOfBirth gender phone email address',
        },
        {
          path: 'consultationId',
          select: 'consultationDate diagnosis symptoms investigations advice followUpDate',
        },
      ],
    });

  // Get patient data
  const Patient = require('../../models/Patient');
  const patient = await Patient.findById(request.patientId);

  // Create in-app notification for patient (with email)
  try {
    const { createRequestNotification } = require('../../services/notificationService');
    await createRequestNotification({
      userId: request.patientId,
      userType: 'patient',
      request: populatedRequest,
      eventType: 'confirmed',
      admin: { _id: id },
      patient,
    }).catch((error) => console.error('Error creating patient request accept notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${request.patientId}`).emit('request:accepted', {
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request accepted',
    data: request,
  });
});

// POST /api/admin/requests/:id/respond
exports.respondToRequest = asyncHandler(async (req, res) => {
  const { id: requestId } = req.params;
  const { pharmacy, pharmacies, lab, labs, medicines, tests, message } = req.body;

  const request = await Request.findById(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status !== 'pending' && request.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Cannot respond to this request',
    });
  }

  // Build admin response
  const adminResponse = {
    pharmacy: pharmacy || null,
    pharmacies: pharmacies || [],
    lab: lab || null,
    labs: labs || [],
    medicines: medicines || [],
    tests: tests || [],
    message: message || '',
    responseDate: new Date(),
  };

  // Calculate total amount
  const medicinesTotal = (medicines || []).reduce((sum, med) => sum + (med.price * med.quantity), 0);
  const testsTotal = (tests || []).reduce((sum, test) => sum + test.price, 0);
  adminResponse.totalAmount = medicinesTotal + testsTotal;

  request.adminResponse = adminResponse;
  request.status = 'accepted';
  await request.save();

  // Get patient data for email
  const Patient = require('../../models/Patient');
  const patient = await Patient.findById(request.patientId);

  // Get populated request for notifications and socket events
  const populatedRequest = await Request.findById(request._id)
    .populate('patientId', 'firstName lastName phone')
    .populate({
      path: 'prescriptionId',
      populate: [
        {
          path: 'doctorId',
          select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
        },
        {
          path: 'patientId',
          select: 'firstName lastName dateOfBirth gender phone email address',
        },
        {
          path: 'consultationId',
          select: 'consultationDate diagnosis symptoms investigations advice followUpDate',
        },
      ],
    });

  // Emit real-time event
  try {
    const io = getIO();

    io.to(`patient-${request.patientId}`).emit('request:responded', {
      request: populatedRequest,
    });

    // Notify pharmacies and labs
    if (pharmacies && pharmacies.length > 0) {
      for (const pharm of pharmacies) {
        io.to(`pharmacy-${pharm._id || pharm}`).emit('request:assigned', {
          request: populatedRequest,
        });
      }
    }

    if (labs && labs.length > 0) {
      for (const lab of labs) {
        io.to(`laboratory-${lab._id || lab}`).emit('request:assigned', {
          request: populatedRequest,
        });
      }
    }
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create in-app notifications
  try {
    const { createRequestNotification } = require('../../services/notificationService');
    const Pharmacy = require('../../models/Pharmacy');
    const Laboratory = require('../../models/Laboratory');

    // Notify patient
    await createRequestNotification({
      userId: request.patientId,
      userType: 'patient',
      request: populatedRequest,
      eventType: 'responded',
      admin: { _id: id },
    }).catch((error) => console.error('Error creating patient request notification:', error));

    // Notify pharmacies
    if (pharmacies && pharmacies.length > 0) {
      for (const pharmId of pharmacies) {
        const pharmacy = await Pharmacy.findById(pharmId);
        if (pharmacy) {
          await createRequestNotification({
            userId: pharmId,
            userType: 'pharmacy',
            request: populatedRequest,
            eventType: 'assigned',
            pharmacy,
          }).catch((error) => console.error('Error creating pharmacy notification:', error));
        }
      }
    }

    // Notify laboratories
    if (labs && labs.length > 0) {
      for (const labId of labs) {
        const laboratory = await Laboratory.findById(labId);
        if (laboratory) {
          await createRequestNotification({
            userId: labId,
            userType: 'laboratory',
            request: populatedRequest,
            eventType: 'assigned',
            laboratory,
          }).catch((error) => console.error('Error creating laboratory notification:', error));
        }
      }
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Email notification is already sent via createRequestNotification (sendEmail: true by default)

  return res.status(200).json({
    success: true,
    message: 'Response sent successfully',
    data: request,
  });
});

// POST /api/admin/requests/:id/cancel
exports.cancelRequest = asyncHandler(async (req, res) => {
  const { id: requestId } = req.params;
  const { reason } = req.body;

  const request = await Request.findById(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status === 'completed' || request.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Request already completed or cancelled',
    });
  }

  request.status = 'cancelled';
  await request.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${request.patientId}`).emit('request:cancelled', {
      requestId: request._id,
      reason,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request cancelled successfully',
  });
});

// PATCH /api/admin/requests/:id/status
exports.updateRequestStatus = asyncHandler(async (req, res) => {
  const { id: requestId } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'accepted', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
    });
  }

  const request = await Request.findById(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  request.status = status;
  await request.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${request.patientId}`).emit('request:status:updated', {
      requestId: request._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request status updated',
    data: request,
  });
});

