const asyncHandler = require('../../middleware/asyncHandler');
const Request = require('../../models/Request');
const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/laboratory/request-orders
exports.getRequestOrders = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Find requests where this laboratory is in admin response
  const filter = {
    type: 'book_test_visit',
    status: { $in: ['accepted', 'confirmed'] },
    'adminResponse.tests.labId': id,
  };

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

// GET /api/laboratory/request-orders/:id
exports.getRequestOrderById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    type: { $in: ['book_test_visit', 'lab'] },
    $or: [
      { 'adminResponse.tests.labId': id },
      { 'adminResponse.labs': id }, // Correctly matches if id is in the array of ObjectIds
    ],
  })
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
      message: 'Request order not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
  });
});

// PATCH /api/laboratory/request-orders/:id/confirm
exports.confirmRequestOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: requestId } = req.params;

  // Debug: Log incoming request
  
  
  

  // 1. Find request by ID first (relaxed query)
  let request;
  try {
    request = await Request.findById(requestId).populate('patientId');
    
    if (!request) {
      // Try finding by string ID if ObjectId fails (rare but possible with some setups)
      
      request = await Request.findOne({ _id: requestId }).populate('patientId');
    }
  } catch (err) {
    console.error(`[Lab] DB Error: ${err.message}`);
    return res.status(500).json({ success: false, message: `DB Error: ${err.message}` });
  }

  if (!request) {
    
    // List all requests to debug if DB is empty or has different IDs
    // const allRequests = await Request.find({}, '_id').limit(5);
    // 

    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  // 2. Validate Type
  if (!['book_test_visit', 'lab'].includes(request.type)) {
    
    return res.status(400).json({
      success: false,
      message: 'Invalid request type',
    });
  }

  // 3. Validate Lab Authorization
  // Check if this lab is in the adminResponse
  const adminResponse = request.adminResponse || {};
  const labs = adminResponse.labs || [];
  const tests = adminResponse.tests || [];

  const isLabAuthorized =
    labs.some(lab => lab.toString() === id.toString()) ||
    tests.some(test => test.labId?.toString() === id.toString());

  if (!isLabAuthorized) {
    
    
    
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to confirm this request',
    });
  }

  // Find or create order for this laboratory
  let order = await Order.findOne({
    requestId: request._id,
    providerId: id,
    providerType: 'laboratory',
  });

  if (!order) {
    // Create order from request tests for this laboratory
    // Filter tests for this specific lab
    const labTests = tests.filter(test => test.labId?.toString() === id.toString());

    // If no specific tests found for lab (maybe explicit lab assignment without specific tests listing), 
    // try to find generic tests or handle empty
    const items = labTests.length > 0 ? labTests.map(test => ({
      name: test.testName,
      quantity: 1,
      price: test.price,
      total: test.price,
    })) : [{
      name: request.testName || 'Lab Test',
      quantity: 1,
      price: request.totalAmount || 0,
      total: request.totalAmount || 0
    }]; // Fallback if tests array struct doesn't match

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);



    const patientIdToSave = request.patientId?._id || request.patientId;
    

    order = await Order.create({
      patientId: patientIdToSave,
      providerId: id,
      providerType: 'laboratory',
      requestId: request._id,
      items,
      totalAmount,
      deliveryOption: request.visitType === 'home' ? 'home_delivery' : 'pickup',
      deliveryAddress: request.patientAddress,
      status: 'pending',
      paymentStatus: request.paymentStatus,
    });

    // Add order to request
    if (!request.orders) request.orders = [];
    request.orders.push(order._id);
    await request.save();
  }

  order.status = 'accepted';
  await order.save();

  // Get laboratory and patient data for notifications
  const Laboratory = require('../../models/Laboratory');
  const Patient = require('../../models/Patient');
  const laboratory = await Laboratory.findById(id);
  const patient = await Patient.findById(request.patientId);

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${request.patientId}`).emit('order:confirmed', {
      orderId: order._id,
      laboratoryId: id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create in-app and email notifications
  try {
    const { createRequestNotification, createOrderNotification } = require('../../services/notificationService');
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

    // Notify patient that request was confirmed by lab
    await createRequestNotification({
      userId: request.patientId,
      userType: 'patient',
      request: populatedRequest,
      eventType: 'confirmed',
      laboratory,
    }).catch((error) => console.error('Error creating patient request confirmation notification:', error));

    // Also create order notification for patient
    const populatedOrder = await Order.findById(order._id)
      .populate('patientId', 'firstName lastName phone email');
    await createOrderNotification({
      userId: request.patientId,
      userType: 'patient',
      order: populatedOrder,
      eventType: 'confirmed',
      laboratory,
      patient,
    }).catch((error) => console.error('Error creating patient order confirmation notification:', error));
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request order confirmed',
    data: order,
  });
});

// POST /api/laboratory/request-orders/:id/bill
exports.generateBill = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: requestId } = req.params;
  const { testAmount, deliveryCharge, additionalCharges } = req.body;

  const request = await Request.findOne({
    _id: requestId,
    type: { $in: ['book_test_visit', 'lab'] },
    $or: [
      { 'adminResponse.tests.labId': id },
      { 'adminResponse.labs': id },
    ],
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request order not found',
    });
  }

  const totalAmount = (testAmount || 0) + (deliveryCharge || 0) + (additionalCharges || 0);

  // Update request with billing summary
  if (!request.adminResponse.billingSummary) {
    request.adminResponse.billingSummary = {};
  }
  request.adminResponse.billingSummary = {
    testAmount: testAmount || 0,
    deliveryCharge: deliveryCharge || 0,
    additionalCharges: additionalCharges || 0,
    totalAmount,
  };
  await request.save();

  return res.status(200).json({
    success: true,
    message: 'Bill generated successfully',
    data: {
      billingSummary: request.adminResponse.billingSummary,
    },
  });
});

// PATCH /api/laboratory/request-orders/:id/status
exports.updateRequestOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: requestId } = req.params;
  const { status } = req.body;

  // Valid statuses for laboratory orders
  const validStatuses = [
    // Common statuses
    'pending', 'accepted', 'processing', 'ready', 'delivered', 'cancelled', 'completed',
    // Lab visit flow statuses
    'visit_time', 'sample_collected', 'being_tested', 'reports_being_generated', 'test_successful', 'reports_updated'
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required. Valid statuses: ' + validStatuses.join(', '),
    });
  }

  // Try to find order by requestId first, if not found, try by order _id
  let order = await Order.findOne({
    requestId,
    providerId: id,
    providerType: 'laboratory',
  });

  // If not found by requestId, try finding by order _id (in case frontend passes order ID directly)
  if (!order) {
    order = await Order.findOne({
      _id: requestId,
      providerId: id,
      providerType: 'laboratory',
    });
  }

  if (!order) {
    
    // Log available orders for debugging
    const availableOrders = await Order.find({ providerId: id, providerType: 'laboratory' }).select('_id requestId status').limit(5);
    

    return res.status(404).json({
      success: false,
      message: 'Order not found. Please ensure the order has been created from the request.',
    });
  }

  // Store old status for logging
  const oldStatus = order.status;
  order.status = status;

  // Set timestamps for specific statuses
  if (status === 'reports_updated' || status === 'completed') {
    order.deliveredAt = new Date();
  }

  await order.save();

  // Get patient and laboratory data for notifications
  const Patient = require('../../models/Patient');
  const Laboratory = require('../../models/Laboratory');
  const { createOrderNotification } = require('../../services/notificationService');

  const patient = await Patient.findById(order.patientId);
  const laboratory = await Laboratory.findById(id);

  // Status label mapping for notifications
  const statusLabels = {
    pending: 'Pending',
    visit_time: 'You can now visit the lab',
    sample_collected: 'Sample Collected',
    being_tested: 'Being Tested',
    reports_being_generated: 'Reports Being Generated',
    test_successful: 'Test Successful',
    reports_updated: 'Reports Updated',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${order.patientId}`).emit('order:status:updated', {
      orderId: order._id,
      status,
      oldStatus,
      message: `Order status updated to ${statusLabels[status] || status}`,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create in-app notification for patient
  try {
    await createOrderNotification({
      userId: order.patientId,
      userType: 'patient',
      order,
      eventType: status === 'reports_updated' ? 'completed' : 'status_updated',
      laboratory,
      patient,
      status, // Pass status for proper message generation
    });
  } catch (error) {
    console.error('Error creating order notification:', error);
  }

  // Send email notification if status is important
  if (['reports_updated', 'test_successful', 'sample_collected'].includes(status)) {
    try {
      const { sendOrderStatusUpdateEmail } = require('../../services/notificationService');
      await sendOrderStatusUpdateEmail({
        patient,
        laboratory,
        order,
        status: statusLabels[status] || status,
      });
    } catch (error) {
      console.error('Error sending order status email:', error);
    }
  }

  

  return res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
});

