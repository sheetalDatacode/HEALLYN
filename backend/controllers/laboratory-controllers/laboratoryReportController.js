const asyncHandler = require('../../middleware/asyncHandler');
const LabReport = require('../../models/LabReport');
const Order = require('../../models/Order');
const { generateLabReportPDF, uploadLabReportPDF } = require('../../services/pdfService');
const Laboratory = require('../../models/Laboratory');
const Patient = require('../../models/Patient');
const { getIO } = require('../../config/socket');
const { sendLabReportReadyEmail } = require('../../services/notificationService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/laboratory/reports
exports.getReports = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { laboratoryId: id };
  if (status) filter.status = status;

  const [reports, total] = await Promise.all([
    LabReport.find(filter)
      .populate('patientId', 'firstName lastName phone profileImage')
      .populate('orderId', 'createdAt totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/laboratory/reports
exports.createReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  let { orderId, testName, results, notes, pdfFileUrl } = req.body;
  const uploadedFile = req.file; // PDF file from multer

  // Parse results if it comes as a string (multipart/form-data)
  if (typeof results === 'string') {
    try {
      results = JSON.parse(results);
    } catch (e) {
      console.error('Error parsing results JSON:', e);
      results = [];
    }
  }

  if (!orderId || !testName) {
    return res.status(400).json({
      success: false,
      message: 'Order ID and test name are required',
    });
  }

  // Verify order belongs to laboratory
  const order = await Order.findOne({
    _id: orderId,
    providerId: id,
    providerType: 'laboratory',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  const prescriptionId = order.prescriptionId || null;

  // Check if report already exists
  // Check if report already exists
  let report = await LabReport.findOne({ orderId });

  if (report) {
    // If report exists, update it (Upsert behavior)
    // Verify it belongs to this laboratory
    if (report.laboratoryId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report',
      });
    }

    report.testName = testName;
    if (results) report.results = results;
    if (notes) report.notes = notes;
    // Update other fields as needed
    await report.save();
  } else {
    // Create new report
    const reportData = {
      orderId,
      patientId: order.patientId,
      laboratoryId: id,
      prescriptionId,
      testName,
      results: results || [],
      notes: notes || '',
      status: 'pending',
      reportDate: new Date(),
    };
    report = await LabReport.create(reportData);
  }

  // Get laboratory and patient data (needed for PDF and notifications)
  const laboratory = await Laboratory.findById(id);
  const patient = await Patient.findById(order.patientId);

  // Handle PDF: Use uploaded file if provided, otherwise generate
  let pdfUrl = pdfFileUrl || null;
  try {
    if (uploadedFile) {
      // Use uploaded PDF file
      const { uploadPDF: uploadPDFService } = require('../../services/fileUploadService');
      const result = await uploadPDFService(uploadedFile, 'reports', 'lab_report');
      pdfUrl = result.url;
    } else if (!pdfFileUrl) {
      // Generate PDF if no file uploaded and no URL provided
      const pdfBuffer = await generateLabReportPDF(
        { ...reportData, createdAt: report.createdAt },
        laboratory.toObject(),
        patient.toObject()
      );
      pdfUrl = await uploadLabReportPDF(pdfBuffer, 'healiinn/reports', `report_${report._id}`);
    }

    if (pdfUrl) {
      report.pdfFileUrl = pdfUrl;
      report.status = 'completed';
      await report.save();
    }
  } catch (error) {
    console.error('PDF upload/generation error:', error);
    // Continue even if PDF fails
  }

  // Update order status to completed when report is ready
  order.status = 'completed';
  await order.save();

  // Emit real-time events
  try {
    const io = getIO();
    const populatedReport = await LabReport.findById(report._id)
      .populate('laboratoryId', 'labName')
      .populate('orderId');

    // Notify patient about report ready
    io.to(`patient-${order.patientId}`).emit('report:created', {
      report: populatedReport,
    });

    // Notify patient about order completion
    io.to(`patient-${order.patientId}`).emit('order:completed', {
      orderId: order._id,
      order: order,
      report: populatedReport,
    });

    // Notify admin about order completion
    io.to('admins').emit('order:completed', {
      orderId: order._id,
      order: order,
      report: populatedReport,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Create in-app notifications
  try {
    const { createReportNotification, createOrderNotification, createAdminNotification } = require('../../services/notificationService');
    const Patient = require('../../models/Patient');
    const populatedReport = await LabReport.findById(report._id)
      .populate('laboratoryId', 'labName')
      .populate('orderId');
    const patient = await Patient.findById(order.patientId);

    // Notify patient about report
    await createReportNotification({
      userId: order.patientId,
      userType: 'patient',
      report: populatedReport,
      laboratory: populatedReport.laboratoryId,
    }).catch((error) => console.error('Error creating patient report notification:', error));

    // Notify patient about order completion
    await createOrderNotification({
      userId: order.patientId,
      userType: 'patient',
      order,
      eventType: 'completed',
      laboratory: populatedReport.laboratoryId,
    }).catch((error) => console.error('Error creating patient order notification:', error));

    // Notify admin
    const Admin = require('../../models/Admin');
    const admins = await Admin.find({});
    for (const admin of admins) {
      await createAdminNotification({
        userId: admin._id,
        userType: 'admin',
        eventType: 'order_completed',
        data: {
          orderId: order._id,
          patientId: order.patientId,
          laboratoryId: id,
        },
      }).catch((error) => console.error('Error creating admin notification:', error));
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Send email notifications to patient
  try {
    const populatedReport = await LabReport.findById(report._id)
      .populate('patientId', 'firstName lastName')
      .populate('orderId');

    // Send report ready email
    await sendLabReportReadyEmail({
      patient,
      report: populatedReport,
      laboratory,
    }).catch((error) => console.error('Error sending lab report ready email:', error));

    // Send order completion email
    const { sendOrderStatusUpdateEmail } = require('../../services/notificationService');
    await sendOrderStatusUpdateEmail({
      patient,
      order: order,
      status: 'completed',
      message: 'Your lab test order has been completed and the report is ready.',
    }).catch((error) => console.error('Error sending order completion email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: await LabReport.findById(report._id)
      .populate('patientId', 'firstName lastName')
      .populate('orderId'),
  });
});

// GET /api/laboratory/reports/:id
exports.getReportById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;

  const report = await LabReport.findOne({
    _id: reportId,
    laboratoryId: id,
  })
    .populate('patientId', 'firstName lastName phone profileImage dateOfBirth')
    .populate('orderId', 'createdAt totalAmount')
    .populate('prescriptionId');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
});

// PATCH /api/laboratory/reports/:id
exports.updateReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;
  const { results, notes, status } = req.body;

  const report = await LabReport.findOne({
    _id: reportId,
    laboratoryId: id,
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  if (report.status === 'completed' || report.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed or cancelled report',
    });
  }

  if (results) report.results = results;
  if (notes) report.notes = notes;
  if (status) report.status = status;

  await report.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to(`patient-${report.patientId}`).emit('report:updated', {
      report: await LabReport.findById(report._id),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: report,
  });
});

