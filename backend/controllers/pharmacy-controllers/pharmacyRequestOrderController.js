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

// GET /api/pharmacy/request-orders
exports.getRequestOrders = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  // Find requests where this pharmacy is in admin response
  // Include 'confirmed' status (payment confirmed) so pharmacy can see and accept paid requests
  const filter = {
    type: 'order_medicine',
    status: { $in: ['accepted', 'confirmed'] },
    paymentConfirmed: true, // Only show requests where payment is confirmed
    'adminResponse.medicines.pharmacyId': id,
  };

  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('patientId', 'firstName lastName phone address')
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

// GET /api/pharmacy/request-orders/:id
exports.getRequestOrderById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    type: 'order_medicine',
    paymentConfirmed: true, // Only show requests with confirmed payment
    'adminResponse.medicines.pharmacyId': id,
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

// PATCH /api/pharmacy/request-orders/:id/confirm
exports.confirmRequestOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;

  const request = await Request.findOne({
    _id: requestId,
    type: 'order_medicine',
    paymentConfirmed: true, // Only allow confirming requests with confirmed payment
    'adminResponse.medicines.pharmacyId': id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request order not found',
    });
  }

  // Find or create order for this pharmacy
  let order = await Order.findOne({
    requestId: request._id,
    providerId: id,
    providerType: 'pharmacy',
  });

  if (!order) {
    // Create order from request medicines for this pharmacy
    const pharmacyMedicines = request.adminResponse.medicines.filter(
      med => med.pharmacyId.toString() === id.toString()
    );

    const items = pharmacyMedicines.map(med => ({
      name: med.name,
      quantity: med.quantity,
      price: med.price,
      total: med.price * med.quantity,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    order = await Order.create({
      patientId: request.patientId,
      providerId: id,
      providerType: 'pharmacy',
      requestId: request._id,
      items,
      totalAmount,
      deliveryOption: 'home_delivery',
      deliveryAddress: request.patientAddress,
      status: 'pending',
      paymentStatus: request.paymentStatus || 'paid', // Use paid status since payment is already confirmed
    });

    // Add order to request
    if (!request.orders) request.orders = [];
    request.orders.push(order._id);
    await request.save();
  }

  order.status = 'accepted';
  await order.save();

  // Get pharmacy and patient data for notifications
  const Pharmacy = require('../../models/Pharmacy');
  const Patient = require('../../models/Patient');
  const pharmacy = await Pharmacy.findById(id);
  const patient = await Patient.findById(request.patientId);

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${request.patientId}`).emit('order:confirmed', {
      orderId: order._id,
      pharmacyId: id,
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

    // Notify patient that request was confirmed by pharmacy
    await createRequestNotification({
      userId: request.patientId,
      userType: 'patient',
      request: populatedRequest,
      eventType: 'confirmed',
      pharmacy,
    }).catch((error) => console.error('Error creating patient request confirmation notification:', error));

    // Also create order notification for patient
    const populatedOrder = await Order.findById(order._id)
      .populate('patientId', 'firstName lastName phone email');
    await createOrderNotification({
      userId: request.patientId,
      userType: 'patient',
      order: populatedOrder,
      eventType: 'confirmed',
      pharmacy,
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

// PATCH /api/pharmacy/request-orders/:id/status
exports.updateRequestOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { requestId } = req.params;
  const { status } = req.body;

  const order = await Order.findOne({
    requestId,
    providerId: id,
    providerType: 'pharmacy',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  order.status = status;
  await order.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${order.patientId}`).emit('order:status:updated', {
      orderId: order._id,
      status,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

