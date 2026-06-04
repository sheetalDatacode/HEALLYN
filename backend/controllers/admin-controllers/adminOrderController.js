const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/admin/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const { type, status, provider } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (type) filter.providerType = type;
  if (status) filter.status = status;
  if (provider) filter.providerId = provider;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('patientId', 'firstName lastName phone')
      .populate('providerId', 'pharmacyName labName name')
      .populate('prescriptionId')
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

// GET /api/admin/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate('patientId')
    .populate('providerId')
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

// PATCH /api/admin/orders/:id
exports.updateOrder = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;
  const updateData = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  Object.assign(order, updateData);
  await order.save();

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`patient-${order.patientId}`).emit('order:updated', {
      order: await Order.findById(order._id),
    });
    io.to(`${order.providerType}-${order.providerId}`).emit('order:updated', {
      order: await Order.findById(order._id),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Order updated successfully',
    data: order,
  });
});

