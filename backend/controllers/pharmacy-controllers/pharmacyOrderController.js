const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Patient = require('../../models/Patient');
const Pharmacy = require('../../models/Pharmacy');
const { getIO } = require('../../config/socket');
const {
  sendOrderStatusUpdateEmail,
  sendProviderNewOrderNotification,
} = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/pharmacy/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, dateFrom, dateTo } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { providerId: id, providerType: 'pharmacy' };
  if (status) filter.status = status;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('patientId', 'firstName lastName phone email address')
      .populate('prescriptionId')
      .populate({
        path: 'items.medicineId',
        select: 'name dosage brand',
        model: 'Medicine'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/pharmacy/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    providerId: id,
    providerType: 'pharmacy',
  })
    .populate('patientId')
    .populate('prescriptionId')
    .populate('requestId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: order,
  });
});

// PATCH /api/pharmacy/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { id: orderId } = req.params;
  const { status } = req.body;

  // Valid statuses for pharmacy orders
  const validStatuses = [
    'pending',
    'prescription_received',
    'medicine_collected',
    'packed',
    'ready_to_be_picked',
    'picked_up',
    'delivered',
    'completed',
    'cancelled',
    // Legacy statuses for backward compatibility
    'accepted',
    'processing',
    'ready',
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required',
    });
  }

  const order = await Order.findOne({
    _id: orderId,
    providerId: id,
    providerType: 'pharmacy',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  if (order.status === 'completed' || order.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or cancelled order',
    });
  }

  const oldStatus = order.status;
  order.status = status;
  if (status === 'delivered' || status === 'completed') {
    order.deliveredAt = new Date();
  }
  await order.save();

  // Get patient and pharmacy data for email
  const patient = await Patient.findById(order.patientId);
  const pharmacy = await Pharmacy.findById(id);

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

  // Send email notification if status changed
  if (oldStatus !== status) {
    try {
      await sendOrderStatusUpdateEmail({
        patient,
        order,
        pharmacy,
        status,
      }).catch((error) => console.error('Error sending order status update email:', error));
    } catch (error) {
      console.error('Error sending email notifications:', error);
    }

    // Create in-app notifications
    try {
      const { createOrderNotification } = require('../../services/notificationService');
      let eventType = status;
      // Map new pharmacy statuses to notification event types
      if (status === 'prescription_received' || status === 'medicine_collected' || status === 'packed') {
        eventType = 'processing';
      } else if (status === 'ready_to_be_picked' || status === 'picked_up') {
        eventType = 'ready';
      } else if (status === 'delivered' || status === 'completed') {
        eventType = 'completed';
      } else if (status === 'accepted' || status === 'processing') {
        eventType = 'confirmed';
      }

      // Notify patient
      await createOrderNotification({
        userId: order.patientId,
        userType: 'patient',
        order,
        eventType,
        pharmacy,
      }).catch((error) => console.error('Error creating patient order notification:', error));
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
});

