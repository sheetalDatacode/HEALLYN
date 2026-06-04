const { getModelForRole, ROLES } = require('../utils/getModelForRole');
const { deleteFile } = require('./fileUploadService');

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Extract file path from URL
 * @param {String} url - File URL (e.g., '/uploads/profiles/image.jpg' or 'http://...')
 * @returns {String|null} - File path relative to upload directory or null if external URL
 */
const extractFilePathFromUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // If it's an external URL (http/https), don't delete it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return null;
  }

  // If it starts with /uploads/, remove that prefix
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '');
  }

  // If it already looks like a relative path, return as is
  if (url.includes('/') && !url.startsWith('/')) {
    return url;
  }

  return null;
};

/**
 * Delete old file if it exists and is different from new file
 * @param {String} oldUrl - Old file URL
 * @param {String} newUrl - New file URL
 */
const deleteOldFileIfNeeded = async (oldUrl, newUrl) => {
  // Only delete if old and new URLs are different
  if (!oldUrl || !newUrl || oldUrl === newUrl) {
    return;
  }

  const oldFilePath = extractFilePathFromUrl(oldUrl);
  
  // Only delete if it's a local file (not external URL)
  if (!oldFilePath) {
    return;
  }

  try {
    await deleteFile(oldFilePath);
    
  } catch (error) {
    // Don't throw error, just log it - file deletion failure shouldn't block profile update
    console.error(`⚠️ Failed to delete old file (${oldFilePath}):`, error.message);
  }
};

/**
 * Delete old files from documents object when new documents are uploaded
 * @param {Object} oldDocuments - Old documents object
 * @param {Object} newDocuments - New documents object
 */
const deleteOldDocumentFiles = async (oldDocuments, newDocuments) => {
  if (!oldDocuments || !newDocuments || typeof oldDocuments !== 'object' || typeof newDocuments !== 'object') {
    return;
  }

  // Check each document field
  for (const [key, newDoc] of Object.entries(newDocuments)) {
    const oldDoc = oldDocuments[key];
    
    if (!oldDoc) continue;

    // Handle different document structures
    let oldUrl = null;
    let newUrl = null;

    // Old document URL extraction
    if (typeof oldDoc === 'string') {
      oldUrl = oldDoc;
    } else if (oldDoc.imageUrl) {
      oldUrl = oldDoc.imageUrl;
    } else if (oldDoc.url) {
      oldUrl = oldDoc.url;
    } else if (oldDoc.fileUrl) {
      oldUrl = oldDoc.fileUrl;
    }

    // New document URL extraction
    if (typeof newDoc === 'string') {
      newUrl = newDoc;
    } else if (newDoc.imageUrl) {
      newUrl = newDoc.imageUrl;
    } else if (newDoc.url) {
      newUrl = newDoc.url;
    } else if (newDoc.fileUrl) {
      newUrl = newDoc.fileUrl;
    }

    // Delete old file if URLs are different
    if (oldUrl && newUrl && oldUrl !== newUrl) {
      await deleteOldFileIfNeeded(oldUrl, newUrl);
    }
  }
};

const toPlainObject = (value) => (value && typeof value.toObject === 'function' ? value.toObject() : value);

const ensureUniqueField = async (Model, field, value, currentId, message) => {
  if (!value) {
    return;
  }

  const existing = await Model.findOne({ [field]: value, _id: { $ne: currentId } });

  if (existing) {
    throw createError(409, message || `${field} already in use.`);
  }
};

const mergeObjects = (existingValue, newValue) => {
  if (!newValue || typeof newValue !== 'object') {
    return existingValue;
  }

  const base = existingValue ? toPlainObject(existingValue) : {};
  return { ...base, ...newValue };
};

const applyPatientUpdates = async (doc, updates, Model) => {
  const allowedScalars = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup', 'profileImage'];
  const mergeFields = ['address', 'emergencyContact'];
  const arrayReplaceFields = ['allergies'];

  if (updates.email && updates.email !== doc.email) {
    await ensureUniqueField(Model, 'email', updates.email, doc._id, 'Email already registered.');
    doc.email = updates.email.toLowerCase().trim();
  }

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  // Delete old profile image if new one is being uploaded
  if (updates.profileImage && doc.profileImage && doc.profileImage !== updates.profileImage) {
    await deleteOldFileIfNeeded(doc.profileImage, updates.profileImage);
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  mergeFields.forEach((field) => {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  });

  for (const field of arrayReplaceFields) {
    if (updates[field] !== undefined) {
      // For documents field, delete old files before replacing
      if (field === 'documents' && doc[field] && Array.isArray(updates[field])) {
        await deleteOldDocumentFiles(doc[field], updates[field]);
      }
      doc[field] = updates[field];
      doc.markModified(field);
    }
  }
};

const applyDoctorUpdates = async (doc, updates, Model) => {
  const allowedScalars = [
    'firstName',
    'lastName',
    'experienceYears',
    'bio',
    'specialization',
    'gender',
    'consultationFee',
    'profileImage',
    'qualification',
    'licenseNumber',
    'averageConsultationMinutes',
    'isActive',
  ];
  const mergeFields = ['clinicDetails', 'digitalSignature'];
  const arrayReplaceFields = ['education', 'languages', 'consultationModes', 'availableTimings', 'availability', 'documents'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  // Delete old profile image if new one is being uploaded
  if (updates.profileImage && doc.profileImage && doc.profileImage !== updates.profileImage) {
    await deleteOldFileIfNeeded(doc.profileImage, updates.profileImage);
  }

  // Delete old digital signature if new one is being uploaded
  if (updates.digitalSignature && doc.digitalSignature) {
    const oldSignature = typeof doc.digitalSignature === 'string' 
      ? doc.digitalSignature 
      : doc.digitalSignature.imageUrl || doc.digitalSignature.url;
    const newSignature = typeof updates.digitalSignature === 'string'
      ? updates.digitalSignature
      : updates.digitalSignature.imageUrl || updates.digitalSignature.url;
    
    if (oldSignature && newSignature && oldSignature !== newSignature) {
      await deleteOldFileIfNeeded(oldSignature, newSignature);
    }
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  for (const field of mergeFields) {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  }

  for (const field of arrayReplaceFields) {
    if (updates[field] !== undefined) {
      // For documents field, delete old files before replacing
      if (field === 'documents' && doc[field] && Array.isArray(updates[field])) {
        await deleteOldDocumentFiles(doc[field], updates[field]);
      }
      doc[field] = updates[field];
      doc.markModified(field);
    }
  }
  
  // If availability is updated, log it for debugging
  if (updates.availability !== undefined) {
    
  }
};

const applyLaboratoryUpdates = async (doc, updates, Model) => {
  const allowedScalars = ['labName', 'ownerName', 'profileImage', 'bio', 'gender', 'gstNumber', 'licenseNumber'];
  const mergeFields = ['address', 'contactPerson', 'operatingHours'];
  const arrayReplaceFields = ['timings', 'testsOffered', 'documents'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  // Delete old profile image if new one is being uploaded
  if (updates.profileImage && doc.profileImage && doc.profileImage !== updates.profileImage) {
    await deleteOldFileIfNeeded(doc.profileImage, updates.profileImage);
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  for (const field of mergeFields) {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  }

  for (const field of arrayReplaceFields) {
    if (updates[field] !== undefined) {
      // For documents field, delete old files before replacing
      if (field === 'documents' && doc[field] && Array.isArray(updates[field])) {
        await deleteOldDocumentFiles(doc[field], updates[field]);
      }
      doc[field] = updates[field];
      doc.markModified(field);
    }
  }
};

const applyPharmacyUpdates = async (doc, updates, Model) => {
  const allowedScalars = ['pharmacyName', 'ownerName', 'gstNumber', 'profileImage', 'bio'];
  const mergeFields = ['address', 'contactPerson'];
  const arrayReplaceFields = ['deliveryOptions', 'timings', 'documents'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  // Delete old profile image if new one is being uploaded
  if (updates.profileImage && doc.profileImage && doc.profileImage !== updates.profileImage) {
    await deleteOldFileIfNeeded(doc.profileImage, updates.profileImage);
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  for (const field of mergeFields) {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  }

  for (const field of arrayReplaceFields) {
    if (updates[field] !== undefined) {
      // For documents field, delete old files before replacing
      if (field === 'documents' && doc[field] && Array.isArray(updates[field])) {
        await deleteOldDocumentFiles(doc[field], updates[field]);
      }
      doc[field] = updates[field];
      doc.markModified(field);
    }
  }
};

const applyNurseUpdates = async (doc, updates, Model) => {
  const allowedScalars = [
    'firstName',
    'lastName',
    'gender',
    'qualification',
    'experienceYears',
    'specialization',
    'fees',
    'registrationNumber',
    'registrationCouncilName',
    'bio',
    'profileImage',
  ];
  const mergeFields = ['address'];
  const arrayReplaceFields = ['availability', 'documents'];

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  // Delete old profile image if new one is being uploaded
  if (updates.profileImage && doc.profileImage && doc.profileImage !== updates.profileImage) {
    await deleteOldFileIfNeeded(doc.profileImage, updates.profileImage);
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  for (const field of mergeFields) {
    if (updates[field] !== undefined) {
      doc[field] = mergeObjects(doc[field], updates[field]);
      doc.markModified(field);
    }
  }

  for (const field of arrayReplaceFields) {
    if (updates[field] !== undefined) {
      // For documents field, delete old files before replacing
      if (field === 'documents' && doc[field] && Array.isArray(updates[field])) {
        await deleteOldDocumentFiles(doc[field], updates[field]);
      }
      doc[field] = updates[field];
      doc.markModified(field);
    }
  }
};

const applyAdminUpdates = async (doc, updates, Model, { requester } = {}) => {
  const allowedScalars = ['name', 'phone', 'profileImage'];

  if (updates.email && updates.email !== doc.email) {
    throw createError(400, 'Email cannot be changed.');
  }

  if (updates.phone && updates.phone !== doc.phone) {
    await ensureUniqueField(Model, 'phone', updates.phone, doc._id, 'Phone number already registered.');
    doc.phone = updates.phone;
  }

  // Delete old profile image if new one is being uploaded
  if (updates.profileImage && doc.profileImage && doc.profileImage !== updates.profileImage) {
    await deleteOldFileIfNeeded(doc.profileImage, updates.profileImage);
  }

  allowedScalars.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      doc[field] = updates[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(updates, 'permissions')) {
    if (!requester || !requester.isSuperAdmin) {
      throw createError(403, 'Only super admins can update permissions.');
    }
    doc.permissions = Array.isArray(updates.permissions) ? updates.permissions : [];
    doc.markModified('permissions');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'isActive')) {
    if (!requester || !requester.isSuperAdmin || String(doc._id) === String(requester._id)) {
      throw createError(403, 'Only super admins can change active status of other admins.');
    }
    doc.isActive = Boolean(updates.isActive);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'isSuperAdmin')) {
    if (!requester || !requester.isSuperAdmin || String(doc._id) === String(requester._id)) {
      throw createError(403, 'Only super admins can modify super admin status of other admins.');
    }
    doc.isSuperAdmin = Boolean(updates.isSuperAdmin);
  }
};

const updateHandlers = {
  [ROLES.PATIENT]: applyPatientUpdates,
  [ROLES.DOCTOR]: applyDoctorUpdates,
  [ROLES.LABORATORY]: applyLaboratoryUpdates,
  [ROLES.PHARMACY]: applyPharmacyUpdates,
  [ROLES.NURSE]: applyNurseUpdates,
  [ROLES.ADMIN]: applyAdminUpdates,
};

const getProfileByRoleAndId = async (role, id) => {
  const Model = getModelForRole(role);
  const document = await Model.findById(id).select('-password');

  if (!document) {
    throw createError(404, `${role} not found`);
  }

  return document;
};

const updateProfileByRoleAndId = async (role, id, updates, options = {}) => {
  const Model = getModelForRole(role);
  const document = await Model.findById(id);

  if (!document) {
    throw createError(404, `${role} not found`);
  }

  const handler = updateHandlers[role];

  if (!handler) {
    throw createError(400, 'Profile updates are not supported for this role.');
  }

  await handler(document, updates, Model, options);

  await document.save();
  
  // If doctor availability was updated, log it
  if (role === ROLES.DOCTOR && updates.availability !== undefined) {
    const savedDoc = await Model.findById(id);
    
    
  }

  return Model.findById(id).select('-password');
};

module.exports = {
  getProfileByRoleAndId,
  updateProfileByRoleAndId,
};


