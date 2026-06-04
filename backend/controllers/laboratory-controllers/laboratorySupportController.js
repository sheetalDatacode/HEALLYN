const asyncHandler = require('../../middleware/asyncHandler');
const SupportTicket = require('../../models/SupportTicket');
const Laboratory = require('../../models/Laboratory');
const Admin = require('../../models/Admin');
const { 
  sendSupportTicketNotification, 
  sendAdminSupportTicketNotification,
  createSupportTicketNotification,
  createAdminSupportTicketNotification,
} = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// POST /api/laboratory/support
exports.createSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { subject, message, priority } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message are required',
    });
  }

  const ticket = await SupportTicket.create({
    userId: id,
    userType: 'laboratory',
    subject,
    message,
    priority: priority || 'medium',
    status: 'open',
  });

  // Get laboratory data for notifications
  const laboratory = await Laboratory.findById(id);

  // Emit real-time event to admins
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    io.to('admins').emit('support:ticket:created', {
      ticket: await SupportTicket.findById(ticket._id)
        .populate('userId', 'labName ownerName email phone'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email and in-app notifications
  try {
    // Send confirmation email to laboratory
    if (laboratory) {
      await sendSupportTicketNotification({
        user: laboratory,
        ticket,
        userType: 'laboratory',
        isResponse: false,
      }).catch((error) => console.error('Error sending support ticket email to laboratory:', error));
      
      // Create in-app notification for laboratory
      await createSupportTicketNotification({
        userId: id,
        userType: 'laboratory',
        ticket,
        eventType: 'created',
      }).catch((error) => console.error('Error creating support ticket notification:', error));
    }

    // Send notification to all admins (email and in-app)
    const admins = await Admin.find({ isActive: true }).select('email name');
    
    for (const admin of admins) {
      // Send email notification
      await sendAdminSupportTicketNotification({
        admin,
        ticket,
        user: laboratory,
        userType: 'laboratory',
      }).catch((error) => console.error(`Error sending admin support ticket email to ${admin.email}:`, error));
      
      // Create in-app notification for admin
      await createAdminSupportTicketNotification({
        adminId: admin._id,
        ticket,
        user: laboratory,
        userType: 'laboratory',
      }).catch((error) => console.error(`Error creating admin support ticket notification:`, error));
    }
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: ticket,
  });
});

// GET /api/laboratory/support
exports.getSupportTickets = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, priority } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { userId: id, userType: 'laboratory' };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/laboratory/support/history
exports.getSupportHistory = asyncHandler(async (req, res) => {
  const { id } = req.auth;

  const tickets = await SupportTicket.find({
    userId: id,
    userType: 'laboratory',
    status: { $in: ['resolved', 'closed'] },
  })
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json({
    success: true,
    data: tickets,
  });
});

