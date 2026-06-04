const Laboratory = require('../../models/Laboratory');
const asyncHandler = require('../../middleware/asyncHandler');
const { createAccessToken, createRefreshToken, verifyRefreshToken, blacklistToken, decodeToken } = require('../../utils/tokenService');
const { sendSignupAcknowledgementEmail } = require('../../services/emailService');
const { requestLoginOtp, verifyLoginOtp } = require('../../services/loginOtpService');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { notifyAdminsOfPendingSignup } = require('../../services/adminNotificationService');
const { ROLES, APPROVAL_STATUS } = require('../../utils/constants');
const {
  LOCATION_SOURCES,
  normalizeLocationSource,
  parseGeoPoint,
  extractAddressLocation,
} = require('../../utils/locationUtils');

const buildAuthResponse = (user) => {
  const payload = { id: user._id, role: ROLES.LABORATORY };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerLaboratory = asyncHandler(async (req, res) => {
  const {
    labName,
    ownerName,
    email,
    phone,
    licenseNumber,
    gstNumber,
    address,
    timings,
    contactPerson,
    documents,
    operatingHours,
    profileImage,
    labLogo,
  } = req.body;

  if (!labName || !email || !phone || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide lab name, email, phone, and license number.',
    });
  }

  const existingEmail = await Laboratory.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const existingPhone = await Laboratory.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  const existingLicense = await Laboratory.findOne({ licenseNumber });
  if (existingLicense) {
    return res.status(400).json({ success: false, message: 'License number already registered.' });
  }


  const normalizedTimings = Array.isArray(timings) ? timings : timings ? [timings] : undefined;

  const {
    address: normalizedAddress,
    addressProvided,
    location: addressLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(address);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  const legacyLocation = parseGeoPoint({
    location: req.body.location,
    coordinates: req.body.coordinates,
    lat: req.body.lat ?? req.body.latitude,
    lng: req.body.lng ?? req.body.longitude,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  let laboratoryLocation;
  let shouldClearLocation = false;

  if (legacyLocation.provided) {
    laboratoryLocation = legacyLocation.point;
    shouldClearLocation = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    laboratoryLocation = addressLocation;
    shouldClearLocation = addressLocation === null;
  }

  let addressPayload =
    normalizedAddress || laboratoryLocation || shouldClearLocation || addressLocationSourceProvided
      ? { ...(normalizedAddress || {}) }
      : normalizedAddress;

  // Only set location if we have valid coordinates
  if (laboratoryLocation && laboratoryLocation.coordinates && Array.isArray(laboratoryLocation.coordinates) && laboratoryLocation.coordinates.length === 2) {
    addressPayload = addressPayload || {};
    addressPayload.location = laboratoryLocation;
  } else if (shouldClearLocation && addressPayload) {
    addressPayload.location = undefined;
  } else if (addressPayload) {
    // Ensure location is deleted if invalid
    delete addressPayload.location;
  }

  let locationSourceValue;
  let locationSourceProvided = false;

  if (req.body.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(req.body.locationSource);
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  } else if (addressLocationSourceProvided) {
    if (
      addressLocationSource &&
      !LOCATION_SOURCES.includes(addressLocationSource)
    ) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceProvided = true;
  }

  if (locationSourceProvided) {
    addressPayload = addressPayload || {};
    if (locationSourceValue) {
      addressPayload.locationSource = locationSourceValue;
    } else {
      addressPayload.locationSource = undefined;
    }
  }

  // Final validation: Ensure location has valid coordinates before saving
  // Since we're not using GPS/map API, completely remove location if coordinates are missing
  if (addressPayload && addressPayload.location) {
    const hasValidCoordinates = 
      addressPayload.location.coordinates && 
      Array.isArray(addressPayload.location.coordinates) && 
      addressPayload.location.coordinates.length === 2 &&
      Number.isFinite(addressPayload.location.coordinates[0]) &&
      Number.isFinite(addressPayload.location.coordinates[1]) &&
      addressPayload.location.type === 'Point';
    
    if (!hasValidCoordinates) {
      delete addressPayload.location;
      delete addressPayload.locationSource;
    }
  }

  // Process documents: convert base64 to files and upload to uploads/documents folder
  let processedDocuments = [];
  if (documents && Array.isArray(documents) && documents.length > 0) {
    try {
      const { uploadFromBuffer } = require('../../services/fileUploadService');
      
      for (const doc of documents) {
        if (doc && doc.data && doc.name) {
          try {
            // Extract base64 data (remove data:application/pdf;base64, prefix if present)
            const base64Data = doc.data.includes(',') ? doc.data.split(',')[1] : doc.data;
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Determine mimetype
            const mimetype = doc.type || 'application/pdf';
            const fileName = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
            
            // Upload to uploads/documents folder
            const uploadResult = await uploadFromBuffer(
              buffer,
              fileName,
              mimetype,
              'documents',
              'lab_doc'
            );
            
            processedDocuments.push({
              name: doc.name,
              fileUrl: uploadResult.url,
              uploadedAt: new Date(),
            });
          } catch (docError) {
            console.error(`Error processing document ${doc.name}:`, docError);
            // Continue with other documents even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Error processing documents:', error);
      // Continue signup even if document processing fails
    }
  }

  const laboratory = await Laboratory.create({
    labName,
    ownerName,
    email,
    phone,
    licenseNumber,
    gstNumber,
    address: addressPayload,
    timings: normalizedTimings,
    contactPerson,
    documents: processedDocuments,
    operatingHours,
    profileImage: profileImage || labLogo,
    status: APPROVAL_STATUS.PENDING,
  });

  await sendSignupAcknowledgementEmail({
    role: ROLES.LABORATORY,
    email: laboratory.email,
    name: laboratory.labName,
  });

  await notifyAdminsOfPendingSignup({ role: ROLES.LABORATORY, entity: laboratory });

  // Create in-app notifications for all admins
  try {
    const Admin = require('../../models/Admin');
    const { createNotification } = require('../../services/notificationService');
    const admins = await Admin.find({ isActive: true });
    
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        userType: 'admin',
        type: 'system',
        title: 'New Laboratory Registration',
        message: `${laboratory.labName} (Owner: ${laboratory.ownerName || 'N/A'}) has registered and is awaiting approval. License: ${laboratory.licenseNumber || 'N/A'}, GST: ${laboratory.gstNumber || 'N/A'}`,
        data: {
          providerId: laboratory._id,
          providerType: 'laboratory',
          providerName: laboratory.labName,
          email: laboratory.email,
          phone: laboratory.phone,
          licenseNumber: laboratory.licenseNumber,
          gstNumber: laboratory.gstNumber,
          ownerName: laboratory.ownerName,
          address: laboratory.address || null,
          contactPerson: laboratory.contactPerson || null,
          registrationDate: laboratory.createdAt,
        },
        priority: 'medium',
        actionUrl: `/admin/laboratories`,
        icon: 'laboratory',
        sendEmail: false, // Email already sent via notifyAdminsOfPendingSignup
        emitSocket: true,
      }).catch((error) => console.error(`Error creating admin notification for laboratory registration:`, error));
    }
  } catch (error) {
    console.error('Error creating admin notifications for laboratory registration:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Laboratory registration submitted for admin approval.',
    data: {
      laboratory,
    },
  });
});

// Request login OTP
exports.requestLoginOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required.',
    });
  }

  const result = await requestLoginOtp({ role: ROLES.LABORATORY, phone });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: {
      phone: result.phone,
    },
  });
});

// Verify OTP and login
exports.loginLaboratory = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required.',
    });
  }

  const result = await verifyLoginOtp({ role: ROLES.LABORATORY, phone, otp });
  const { user } = result;

  // Check approval status
  if (user.status && user.status !== APPROVAL_STATUS.APPROVED) {
    return res.status(403).json({
      success: false,
      message: user.status === APPROVAL_STATUS.PENDING
        ? 'Your account is pending admin approval. Please wait for approval before logging in.'
        : 'Your account has been rejected. Please contact support for assistance.',
      data: {
        status: user.status,
      },
    });
  }

  const tokens = buildAuthResponse(user);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      laboratory: user,
      tokens,
    },
  });
});

exports.getLaboratoryProfile = asyncHandler(async (req, res) => {
  const laboratory = await getProfileByRoleAndId(ROLES.LABORATORY, req.auth.id);

  return res.status(200).json({ success: true, data: laboratory });
});

exports.updateLaboratoryProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.timings !== undefined && !Array.isArray(updates.timings)) {
    updates.timings = [updates.timings];
  }

  if (updates.labLogo && !updates.profileImage) {
    updates.profileImage = updates.labLogo;
  }

  const rawAddressUpdate = updates.address;

  const {
    address: normalizedAddress,
    addressProvided,
    location: addressLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(rawAddressUpdate);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  let addressPayload =
    normalizedAddress !== undefined ? { ...normalizedAddress } : undefined;

  if (addressProvided && addressPayload === undefined) {
    addressPayload = {};
  }

  const legacyLocation = parseGeoPoint({
    location: updates.location,
    coordinates: updates.coordinates,
    lat: updates.lat ?? updates.latitude,
    lng: updates.lng ?? updates.longitude,
    latitude: updates.latitude,
    longitude: updates.longitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  let locationValue;
  let shouldClearLocation = false;

  if (legacyLocation.provided) {
    locationValue = legacyLocation.point;
    shouldClearLocation = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    locationValue = addressLocation;
    shouldClearLocation = addressLocation === null;
  } else if (updates.address && updates.address.location === null) {
    shouldClearLocation = true;
  }

  if (locationValue) {
    addressPayload = addressPayload || {};
    addressPayload.location = locationValue;
  } else if (shouldClearLocation && addressPayload) {
    addressPayload.location = undefined;
  }

  let locationSourceValue;
  let locationSourceProvided = false;

  if (updates.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(updates.locationSource);
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  } else if (addressLocationSourceProvided) {
    if (
      addressLocationSource &&
      !LOCATION_SOURCES.includes(addressLocationSource)
    ) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceProvided = true;
  } else if (updates.address && updates.address.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      updates.address.locationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `locationSource must be one of: ${LOCATION_SOURCES.join(', ')}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  }

  if (locationSourceProvided) {
    addressPayload = addressPayload || {};
    if (locationSourceValue) {
      addressPayload.locationSource = locationSourceValue;
    } else {
      addressPayload.locationSource = undefined;
    }
  }

  if (addressPayload !== undefined) {
    updates.address = addressPayload;
  }

  delete updates.location;
  delete updates.coordinates;
  delete updates.lat;
  delete updates.lng;
  delete updates.latitude;
  delete updates.longitude;
  delete updates.locationSource;

  delete updates.labLogo;

  const laboratory = await updateProfileByRoleAndId(ROLES.LABORATORY, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: laboratory,
  });
});

exports.logoutLaboratory = asyncHandler(async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.id && decoded.role) {
        await blacklistToken(accessToken, 'access', decoded.id, decoded.role, 'logout');
      }
    } catch (error) {
      
    }
  }

  if (refreshToken) {
    try {
      const decoded = decodeToken(refreshToken);
      if (decoded && decoded.id && decoded.role) {
        await blacklistToken(refreshToken, 'refresh', decoded.id, decoded.role, 'logout');
      }
    } catch (error) {
      
    }
  }

  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logout successful. All tokens have been revoked.' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required.',
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    const laboratory = await Laboratory.findById(decoded.id);

    if (!laboratory) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(laboratory, 'isActive') && laboratory.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive.',
      });
    }

    try {
      await blacklistToken(refreshToken, 'refresh', decoded.id, decoded.role, 'refresh');
    } catch (error) {
      
    }

    const payload = { id: laboratory._id, role: ROLES.LABORATORY };
    const newAccessToken = createAccessToken(payload);
    const newRefreshToken = createRefreshToken(payload);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please login again.',
      });
    }
    if (error.name === 'TokenRevokedError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked. Please login again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please login again.',
      });
    }
    throw error;
  }
});

exports.getLaboratoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.auth.role;
  const requesterId = String(req.auth.id);

  if (requesterRole !== ROLES.ADMIN && requesterId !== String(id)) {
    const error = new Error('You are not authorized to access this laboratory profile.');
    error.status = 403;
    throw error;
  }

  const laboratory = await getProfileByRoleAndId(ROLES.LABORATORY, id);

  return res.status(200).json({ success: true, data: laboratory });
});

