const asyncHandler = require('../../middleware/asyncHandler');
const Prescription = require('../../models/Prescription');
const Consultation = require('../../models/Consultation');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/patients/prescriptions
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .populate({
        path: 'doctorId',
        select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
      })
      .populate({
        path: 'patientId',
        select: 'firstName lastName dateOfBirth gender phone email address',
      })
      .populate('consultationId', 'consultationDate diagnosis symptoms investigations advice followUpDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/prescriptions/:id
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patientId: id,
  })
    .populate('doctorId', 'firstName lastName specialization profileImage licenseNumber')
    .populate('consultationId', 'consultationDate diagnosis vitals');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: prescription,
  });
});

// GET /api/patients/reports
exports.getReports = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { page, limit, skip } = buildPagination(req);

  const LabReport = require('../../models/LabReport');

  const [reports, total] = await Promise.all([
    LabReport.find({ patientId: id })
      .populate('laboratoryId', 'labName address')
      .populate('orderId', 'createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments({ patientId: id }),
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

// GET /api/patients/reports/:id/download
exports.downloadReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;

  const LabReport = require('../../models/LabReport');

  const report = await LabReport.findOne({
    _id: reportId,
    patientId: id,
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  if (!report.pdfFileUrl) {
    return res.status(404).json({
      success: false,
      message: 'Report PDF not available',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      pdfUrl: report.pdfFileUrl,
    },
  });
});

// POST /api/patients/reports/:id/share
exports.shareReport = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { reportId } = req.params;
  const { doctorId, consultationId } = req.body;

  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: 'Doctor ID is required',
    });
  }

  const LabReport = require('../../models/LabReport');
  const Doctor = require('../../models/Doctor');
  const Consultation = require('../../models/Consultation');

  // Verify report belongs to patient
  const report = await LabReport.findOne({
    _id: reportId,
    patientId: id,
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  // Verify consultation if provided
  if (consultationId) {
    const consultation = await Consultation.findOne({
      _id: consultationId,
      patientId: id,
      doctorId: doctorId,
    });
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found or does not match doctor',
      });
    }
  }

  // Check if already shared with this doctor
  const alreadyShared = report.sharedWith?.some(
    (share) => share.doctorId.toString() === doctorId.toString()
  );

  if (!alreadyShared) {
    // Add to sharedWith array
    if (!report.sharedWith) {
      report.sharedWith = [];
    }
    report.sharedWith.push({
      doctorId,
      sharedAt: new Date(),
      consultationId: consultationId || null,
    });
    report.isShared = true;
    await report.save();
  }

  // Emit real-time event to doctor
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    const populatedReport = await LabReport.findById(report._id)
      .populate('laboratoryId', 'labName')
      .populate('patientId', 'firstName lastName');
    
    io.to(`doctor-${doctorId}`).emit('report:shared', {
      report: populatedReport,
      patientId: id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Report shared successfully with doctor',
    data: report,
  });
});

