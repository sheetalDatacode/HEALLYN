const asyncHandler = require('../../middleware/asyncHandler');
const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/labs/leads
exports.getLeads = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { startDate, endDate, status, limit: limitParam } = req.query;
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100);

  const filter = { providerId: id, providerType: 'laboratory' };
  if (status) {
    // Handle comma-separated status values
    const statusArray = status.split(',').map(s => s.trim()).filter(s => s);
    if (statusArray.length === 1) {
      filter.status = statusArray[0];
    } else if (statusArray.length > 1) {
      filter.status = { $in: statusArray };
    }
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const orders = await Order.find(filter)
    .populate('patientId', 'firstName lastName phone email address')
    .populate('prescriptionId')
    .sort({ createdAt: -1 })
    .limit(limit);

  return res.status(200).json({
    success: true,
    data: orders,
  });
});

// GET /api/labs/leads/:id
exports.getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { leadId } = req.params;

  const order = await Order.findOne({
    _id: leadId,
    providerId: id,
    providerType: 'laboratory',
  })
    .populate('patientId', 'firstName lastName phone email address')
    .populate('prescriptionId')
    .populate('requestId');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: order,
  });
});

// PATCH /api/labs/leads/:id/status
exports.updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { leadId } = req.params;
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
      message: 'Valid status is required',
    });
  }

  // Try to find order by _id first
  let order = await Order.findOne({
    _id: leadId,
    providerId: id,
    providerType: 'laboratory',
  });

  // If not found by _id, try finding by requestId (in case frontend passes request ID)
  if (!order) {
    const Request = require('../../models/Request');
    const request = await Request.findOne({
      _id: leadId,
      type: 'book_test_visit',
      $or: [
        { 'adminResponse.tests.labId': id },
        { 'adminResponse.labs': id },
        { 'adminResponse.labs.labId': id }, // Keep for legacy/inconsistent structures
      ],
    });

    if (request) {
      

      // Find or create order from request
      order = await Order.findOne({
        requestId: request._id,
        providerId: id,
        providerType: 'laboratory',
      });

      // If order doesn't exist, create it (regardless of request status)
      if (!order) {
        

        // Create order from request
        const Patient = require('../../models/Patient');
        const patient = await Patient.findById(request.patientId);

        // Extract items from request - handle different request structures
        let items = [];
        const adminResponse = request.adminResponse || {};
        const tests = adminResponse.tests || [];

        // Filter tests for this specific lab
        const labTests = tests.filter(test =>
          test.labId?.toString() === id.toString() ||
          test.lab?.toString() === id.toString()
        );

        if (labTests.length > 0) {
          items = labTests.map(test => ({
            name: test.testName || test.name || 'Test',
            quantity: 1,
            price: test.price || 0,
            total: test.price || 0,
            testId: test.testId || null,
          }));
        } else if (request.testName) {
          // Fallback if no specific tests found
          items = [{
            name: request.testName || 'Lab Test',
            quantity: 1,
            price: request.totalAmount || adminResponse.totalAmount || 0,
            total: request.totalAmount || adminResponse.totalAmount || 0,
          }];
        } else {
          // Default item if nothing found
          items = [{
            name: 'Lab Test',
            quantity: 1,
            price: 0,
            total: 0,
          }];
        }

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
          prescriptionId: request.prescriptionId,
          status: 'pending',
          paymentStatus: request.paymentStatus || 'pending',
        });

        

        // Add order to request
        if (!request.orders) request.orders = [];
        request.orders.push(order._id);
        await request.save();
      } else {
        
      }
    } else {
      
    }
  } else {
    
  }

  if (!order) {
    
    // Log available orders for debugging
    const availableOrders = await Order.find({ providerId: id, providerType: 'laboratory' }).select('_id requestId status').limit(5);
    

    return res.status(404).json({
      success: false,
      message: 'Order not found. Please ensure the order has been created.',
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

