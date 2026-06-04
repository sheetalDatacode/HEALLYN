const asyncHandler = require('../../middleware/asyncHandler');
const { ROLES, APPROVAL_STATUS } = require('../../utils/constants');
const Doctor = require('../../models/Doctor');
const Pharmacy = require('../../models/Pharmacy');
const Laboratory = require('../../models/Laboratory');
const Nurse = require('../../models/Nurse');
const { sendRoleApprovalEmail } = require('../../services/emailService');

/**
 * Helper to build basic pagination options
 */
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build common search filter for name / email / phone fields
 */
const buildSearchFilter = (search, fields = []) => {
  if (!search || !search.trim() || !fields.length) return {};

  const regex = new RegExp(search.trim(), 'i');

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

// ────────────────────────────────────────────────────────────────
// DOCTORS
// ────────────────────────────────────────────────────────────────

// GET /api/admin/doctors
exports.getDoctors = asyncHandler(async (req, res) => {
  const { status, specialty, sortBy, sortOrder } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};

  if (status && Object.values(APPROVAL_STATUS).includes(status)) {
    filter.status = status;
  }

  if (specialty && specialty.trim()) {
    filter.specialization = new RegExp(specialty.trim(), 'i');
  }

  const searchFilter = buildSearchFilter(req.query.search, [
    'firstName',
    'lastName',
    'email',
    'phone',
    'licenseNumber',
    'specialization',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const sort = {};
  const normalizedSortBy = sortBy || 'createdAt';
  const normalizedSortOrder = sortOrder === 'asc' ? 1 : -1;
  sort[normalizedSortBy] = normalizedSortOrder;

  const [items, total] = await Promise.all([
    Doctor.find(finalFilter).sort(sort).skip(skip).limit(limit),
    Doctor.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/doctors/:id
exports.getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: doctor,
  });
});

// PATCH /api/admin/doctors/:id/verify
exports.verifyDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.auth?.id;

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  doctor.status = APPROVAL_STATUS.APPROVED;
  doctor.rejectionReason = undefined;
  doctor.approvedAt = new Date();
  doctor.approvedBy = adminId;

  await doctor.save();

  // Get admin details for notifications
  const Admin = require('../../models/Admin');
  const admin = await Admin.findById(adminId).select('name email');

  // Send approval email to doctor with admin details
  if (doctor.email) {
    sendRoleApprovalEmail({
      role: 'doctor',
      email: doctor.email,
      status: APPROVAL_STATUS.APPROVED,
      adminName: admin?.name || 'Admin',
      doctorName: `${doctor.firstName} ${doctor.lastName || ''}`.trim(),
      specialization: doctor.specialization,
      approvedAt: doctor.approvedAt,
    }).catch((error) => {
      console.error('Failed to send approval email to doctor:', error);
      // Don't fail the request if email fails
    });
  }

  // Create in-app notification for doctor
  try {
    const { createNotification } = require('../../services/notificationService');
    const doctorName = `${doctor.firstName} ${doctor.lastName || ''}`.trim();
    const adminName = admin?.name || 'Admin';
    
    await createNotification({
      userId: id,
      userType: 'doctor',
      type: 'system',
      title: 'Account Approved',
      message: `Your registration has been approved by ${adminName}. You can now sign in and start using the platform.`,
      data: {
        adminId: adminId,
        adminName: adminName,
        approvedAt: doctor.approvedAt,
        specialization: doctor.specialization,
        doctorName: doctorName,
      },
      priority: 'high',
      actionUrl: '/doctor/dashboard',
      icon: 'approval',
      sendEmail: false, // Email already sent above
      emitSocket: true,
    }).catch((error) => {
      console.error('Error creating doctor approval notification:', error);
    });
  } catch (error) {
    console.error('Error creating doctor approval notification:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Doctor approved successfully.',
    data: doctor,
  });
});

// PATCH /api/admin/doctors/:id/reject
exports.rejectDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.auth?.id;

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found.',
    });
  }

  doctor.status = APPROVAL_STATUS.REJECTED;
  const rejectionReason = reason && String(reason).trim()
    ? String(reason).trim()
    : 'Rejected by admin.';
  doctor.rejectionReason = rejectionReason;
  doctor.approvedAt = undefined;
  doctor.approvedBy = adminId;

  await doctor.save();

  // Send rejection email to doctor
  if (doctor.email) {
    sendRoleApprovalEmail({
      role: 'doctor',
      email: doctor.email,
      status: APPROVAL_STATUS.REJECTED,
      reason: rejectionReason,
    }).catch((error) => {
      console.error('Failed to send rejection email to doctor:', error);
      // Don't fail the request if email fails
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Doctor rejected successfully.',
    data: doctor,
  });
});

// ────────────────────────────────────────────────────────────────
// PHARMACIES
// ────────────────────────────────────────────────────────────────

// GET /api/admin/pharmacies
exports.getPharmacies = asyncHandler(async (req, res) => {
  const { status, sortBy, sortOrder } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};

  if (status && Object.values(APPROVAL_STATUS).includes(status)) {
    filter.status = status;
  }

  const searchFilter = buildSearchFilter(req.query.search, [
    'pharmacyName',
    'ownerName',
    'email',
    'phone',
    'licenseNumber',
    'gstNumber',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const sort = {};
  const normalizedSortBy = sortBy || 'createdAt';
  const normalizedSortOrder = sortOrder === 'asc' ? 1 : -1;
  sort[normalizedSortBy] = normalizedSortOrder;

  const [items, total] = await Promise.all([
    Pharmacy.find(finalFilter).sort(sort).skip(skip).limit(limit),
    Pharmacy.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/pharmacies/:id
exports.getPharmacyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: pharmacy,
  });
});

// PATCH /api/admin/pharmacies/:id/verify
exports.verifyPharmacy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.auth?.id;

  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found.',
    });
  }

  pharmacy.status = APPROVAL_STATUS.APPROVED;
  pharmacy.rejectionReason = undefined;
  pharmacy.approvedAt = new Date();
  pharmacy.approvedBy = adminId;

  await pharmacy.save();

  // Send approval email to pharmacy
  if (pharmacy.email) {
    sendRoleApprovalEmail({
      role: 'pharmacy',
      email: pharmacy.email,
      status: APPROVAL_STATUS.APPROVED,
    }).catch((error) => {
      console.error('Failed to send approval email to pharmacy:', error);
      // Don't fail the request if email fails
    });
  }

  // Create in-app notification for pharmacy approval
  try {
    const { createNotification } = require('../../services/notificationService');
    const Admin = require('../../models/Admin');
    const admin = await Admin.findById(adminId).select('name email');
    
    await createNotification({
      userId: id,
      userType: 'pharmacy',
      type: 'approval',
      title: 'Account Approved',
      message: `Your pharmacy account has been approved by admin${admin?.name ? ` ${admin.name}` : ''}. You can now access all features.`,
      data: {
        approvedBy: adminId,
        approvedAt: pharmacy.approvedAt,
        adminName: admin?.name || 'Admin',
        pharmacyName: pharmacy.pharmacyName,
      },
      priority: 'high',
      actionUrl: '/pharmacy/dashboard',
      icon: 'approval',
      sendEmail: true,
      user: pharmacy,
    }).catch((error) => console.error('Error creating pharmacy approval notification:', error));
  } catch (error) {
    console.error('Error creating pharmacy approval notification:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Pharmacy approved successfully.',
    data: pharmacy,
  });
});

// PATCH /api/admin/pharmacies/:id/reject
exports.rejectPharmacy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.auth?.id;

  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) {
    return res.status(404).json({
      success: false,
      message: 'Pharmacy not found.',
    });
  }

  pharmacy.status = APPROVAL_STATUS.REJECTED;
  const rejectionReason = reason && String(reason).trim()
    ? String(reason).trim()
    : 'Rejected by admin.';
  pharmacy.rejectionReason = rejectionReason;
  pharmacy.approvedAt = undefined;
  pharmacy.approvedBy = adminId;

  await pharmacy.save();

  // Send rejection email to pharmacy
  if (pharmacy.email) {
    sendRoleApprovalEmail({
      role: 'pharmacy',
      email: pharmacy.email,
      status: APPROVAL_STATUS.REJECTED,
      reason: rejectionReason,
    }).catch((error) => {
      console.error('Failed to send rejection email to pharmacy:', error);
      // Don't fail the request if email fails
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Pharmacy rejected successfully.',
    data: pharmacy,
  });
});

// ────────────────────────────────────────────────────────────────
// LABORATORIES
// ────────────────────────────────────────────────────────────────

// GET /api/admin/laboratories
exports.getLaboratories = asyncHandler(async (req, res) => {
  const { status, sortBy, sortOrder } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};

  if (status && Object.values(APPROVAL_STATUS).includes(status)) {
    filter.status = status;
  }

  const searchFilter = buildSearchFilter(req.query.search, [
    'labName',
    'ownerName',
    'email',
    'phone',
    'licenseNumber',
    'gstNumber',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const sort = {};
  const normalizedSortBy = sortBy || 'createdAt';
  const normalizedSortOrder = sortOrder === 'asc' ? 1 : -1;
  sort[normalizedSortBy] = normalizedSortOrder;

  const [items, total] = await Promise.all([
    Laboratory.find(finalFilter).sort(sort).skip(skip).limit(limit),
    Laboratory.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/laboratories/:id
exports.getLaboratoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const laboratory = await Laboratory.findById(id);
  if (!laboratory) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: laboratory,
  });
});

// PATCH /api/admin/laboratories/:id/verify
exports.verifyLaboratory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.auth?.id;

  const laboratory = await Laboratory.findById(id);
  if (!laboratory) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found.',
    });
  }

  laboratory.status = APPROVAL_STATUS.APPROVED;
  laboratory.rejectionReason = undefined;
  laboratory.approvedAt = new Date();
  laboratory.approvedBy = adminId;

  await laboratory.save();

  // Send approval email to laboratory
  if (laboratory.email) {
    sendRoleApprovalEmail({
      role: 'laboratory',
      email: laboratory.email,
      status: APPROVAL_STATUS.APPROVED,
    }).catch((error) => {
      console.error('Failed to send approval email to laboratory:', error);
      // Don't fail the request if email fails
    });
  }

  // Create in-app notification for laboratory approval
  try {
    const { createNotification } = require('../../services/notificationService');
    const Admin = require('../../models/Admin');
    const admin = await Admin.findById(adminId).select('name email');
    
    await createNotification({
      userId: id,
      userType: 'laboratory',
      type: 'approval',
      title: 'Account Approved',
      message: `Your laboratory account has been approved by admin${admin?.name ? ` ${admin.name}` : ''}. You can now access all features.`,
      data: {
        approvedBy: adminId,
        approvedAt: laboratory.approvedAt,
        adminName: admin?.name || 'Admin',
        labName: laboratory.labName,
      },
      priority: 'high',
      actionUrl: '/laboratory/dashboard',
      icon: 'approval',
      sendEmail: true,
      user: laboratory,
    }).catch((error) => console.error('Error creating laboratory approval notification:', error));
  } catch (error) {
    console.error('Error creating laboratory approval notification:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Laboratory approved successfully.',
    data: laboratory,
  });
});

// PATCH /api/admin/laboratories/:id/reject
exports.rejectLaboratory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.auth?.id;

  const laboratory = await Laboratory.findById(id);
  if (!laboratory) {
    return res.status(404).json({
      success: false,
      message: 'Laboratory not found.',
    });
  }

  laboratory.status = APPROVAL_STATUS.REJECTED;
  const rejectionReason = reason && String(reason).trim()
    ? String(reason).trim()
    : 'Rejected by admin.';
  laboratory.rejectionReason = rejectionReason;
  laboratory.approvedAt = undefined;
  laboratory.approvedBy = adminId;

  await laboratory.save();

  // Send rejection email to laboratory
  if (laboratory.email) {
    sendRoleApprovalEmail({
      role: 'laboratory',
      email: laboratory.email,
      status: APPROVAL_STATUS.REJECTED,
      reason: rejectionReason,
    }).catch((error) => {
      console.error('Failed to send rejection email to laboratory:', error);
      // Don't fail the request if email fails
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Laboratory rejected successfully.',
    data: laboratory,
  });
});

// ────────────────────────────────────────────────────────────────
// VERIFICATIONS OVERVIEW
// ────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────
// NURSES
// ────────────────────────────────────────────────────────────────

// GET /api/admin/nurses
exports.getNurses = asyncHandler(async (req, res) => {
  const { status, sortBy, sortOrder } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = {};

  if (status && Object.values(APPROVAL_STATUS).includes(status)) {
    filter.status = status;
  }

  const searchFilter = buildSearchFilter(req.query.search, [
    'firstName',
    'lastName',
    'email',
    'phone',
    'registrationNumber',
    'specialization',
    'qualification',
  ]);

  const finalFilter = Object.keys(searchFilter).length
    ? { $and: [filter, searchFilter] }
    : filter;

  const sort = {};
  const normalizedSortBy = sortBy || 'createdAt';
  const normalizedSortOrder = sortOrder === 'asc' ? 1 : -1;
  sort[normalizedSortBy] = normalizedSortOrder;

  const [items, total] = await Promise.all([
    Nurse.find(finalFilter).sort(sort).skip(skip).limit(limit),
    Nurse.countDocuments(finalFilter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/admin/nurses/:id
exports.getNurseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const nurse = await Nurse.findById(id);
  if (!nurse) {
    return res.status(404).json({
      success: false,
      message: 'Nurse not found.',
    });
  }

  return res.status(200).json({
    success: true,
    data: nurse,
  });
});

// PATCH /api/admin/nurses/:id/verify
exports.verifyNurse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.auth?.id;

  const nurse = await Nurse.findById(id);
  if (!nurse) {
    return res.status(404).json({
      success: false,
      message: 'Nurse not found.',
    });
  }

  nurse.status = APPROVAL_STATUS.APPROVED;
  nurse.rejectionReason = undefined;
  nurse.approvedAt = new Date();
  nurse.approvedBy = adminId;

  await nurse.save();

  // Send approval email to nurse
  if (nurse.email) {
    sendRoleApprovalEmail({
      role: 'nurse',
      email: nurse.email,
      status: APPROVAL_STATUS.APPROVED,
    }).catch((error) => {
      console.error('Failed to send approval email to nurse:', error);
      // Don't fail the request if email fails
    });
  }

  // Create in-app notification for nurse approval
  try {
    const { createNotification } = require('../../services/notificationService');
    const Admin = require('../../models/Admin');
    const admin = await Admin.findById(adminId).select('name email');
    
    await createNotification({
      userId: id,
      userType: 'nurse',
      type: 'approval',
      title: 'Account Approved',
      message: `Your nurse account has been approved by admin${admin?.name ? ` ${admin.name}` : ''}. You can now access all features.`,
      data: {
        approvedBy: adminId,
        approvedAt: nurse.approvedAt,
        adminName: admin?.name || 'Admin',
        nurseName: `${nurse.firstName} ${nurse.lastName}`.trim(),
      },
      priority: 'high',
      actionUrl: '/nurse/dashboard',
      icon: 'approval',
      sendEmail: true,
      user: nurse,
    }).catch((error) => console.error('Error creating nurse approval notification:', error));
  } catch (error) {
    console.error('Error creating nurse approval notification:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Nurse approved successfully.',
    data: nurse,
  });
});

// PATCH /api/admin/nurses/:id/reject
exports.rejectNurse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.auth?.id;

  const nurse = await Nurse.findById(id);
  if (!nurse) {
    return res.status(404).json({
      success: false,
      message: 'Nurse not found.',
    });
  }

  nurse.status = APPROVAL_STATUS.REJECTED;
  const rejectionReason = reason && String(reason).trim()
    ? String(reason).trim()
    : 'Rejected by admin.';
  nurse.rejectionReason = rejectionReason;
  nurse.approvedAt = undefined;
  nurse.approvedBy = adminId;

  await nurse.save();

  // Send rejection email to nurse
  if (nurse.email) {
    sendRoleApprovalEmail({
      role: 'nurse',
      email: nurse.email,
      status: APPROVAL_STATUS.REJECTED,
      reason: rejectionReason,
    }).catch((error) => {
      console.error('Failed to send rejection email to nurse:', error);
      // Don't fail the request if email fails
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Nurse rejected successfully.',
    data: nurse,
  });
});

// ────────────────────────────────────────────────────────────────
// VERIFICATIONS OVERVIEW
// ────────────────────────────────────────────────────────────────

// GET /api/admin/verifications/pending
exports.getPendingVerifications = asyncHandler(async (req, res) => {
  const { type, limit: rawLimit } = req.query;
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 100);

  const baseFilter = { status: APPROVAL_STATUS.PENDING };

  // Select all fields - no need to exclude anything for verification details
  const [doctors, pharmacies, laboratories, nurses] = await Promise.all([
    (type && type !== ROLES.DOCTOR) ? [] : Doctor.find(baseFilter).select('-password').limit(limit).lean(),
    (type && type !== ROLES.PHARMACY) ? [] : Pharmacy.find(baseFilter).select('-password').limit(limit).lean(),
    (type && type !== ROLES.LABORATORY) ? [] : Laboratory.find(baseFilter).select('-password').limit(limit).lean(),
    (type && type !== ROLES.NURSE) ? [] : Nurse.find(baseFilter).select('-password').limit(limit).lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      doctors,
      pharmacies,
      laboratories,
      nurses,
    },
  });
});


