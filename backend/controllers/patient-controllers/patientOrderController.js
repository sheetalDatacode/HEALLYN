const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const Patient = require('../../models/Patient');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const {
  sendOrderConfirmationEmail,
  sendProviderNewOrderNotification,
} = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/patients/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, providerType } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;
  if (providerType) filter.providerType = providerType;

  
  

  const countTest = await Order.countDocuments({ patientId: id });
  

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('providerId', 'pharmacyName labName address name')
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

// GET /api/patients/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const orderId = req.params.id;

  const order = await Order.findOne({
    _id: orderId,
    patientId: id,
  })
    .populate('providerId', 'labName pharmacyName name address')
    .populate('prescriptionId');

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

// POST /api/patients/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { providerId, providerType, items, deliveryOption, deliveryAddress, prescriptionId } = req.body;

  if (!providerId || !providerType || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Provider ID, provider type, and items are required',
    });
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const order = await Order.create({
    patientId: id,
    providerId,
    providerType,
    items: items.map(item => ({
      ...item,
      total: item.price * item.quantity,
    })),
    totalAmount,
    deliveryOption: deliveryOption || 'pickup',
    deliveryAddress,
    prescriptionId,
    status: 'pending',
    paymentStatus: 'pending',
  });

  // Get patient and provider data for email
  const patient = await Patient.findById(id);
  const provider =
    providerType === 'pharmacy'
      ? await Pharmacy.findById(providerId)
      : await Laboratory.findById(providerId);

  // Emit real-time event
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to(`${providerType}-${providerId}`).emit('order:created', {
      order: await Order.findById(order._id).populate('patientId', 'firstName lastName phone'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notifications
  try {
    const populatedOrder = await Order.findById(order._id).populate('providerId');

    // Send confirmation to patient
    await sendOrderConfirmationEmail({
      patient,
      order: populatedOrder,
      provider,
      providerType,
    }).catch((error) => console.error('Error sending order confirmation email:', error));

    // Send notification to provider
    await sendProviderNewOrderNotification({
      provider,
      order: populatedOrder,
      patient,
      providerType,
    }).catch((error) => console.error('Error sending provider new order notification:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: await Order.findById(order._id).populate('providerId'),
  });
});

