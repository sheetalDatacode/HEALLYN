const Doctor = require('../../models/Doctor');
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

const parseName = ({ firstName, lastName, name }) => {
  if (firstName) {
    return {
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : lastName,
    };
  }

  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts.shift(),
      lastName: parts.join(' '),
    };
  }

  return { firstName: undefined, lastName: undefined };
};

const buildAuthResponse = (user) => {
  const payload = { id: user._id, role: ROLES.DOCTOR };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    firstName,
    lastName,
    email,
    phone,
    gender,
    category,
    subcategories,
    licenseNumber,
    experienceYears,
    experience,
    education,
    languages,
    consultationModes,
    clinicName,
    clinicAddress,
    clinicDetails,
    clinicLocation,
    clinicCoordinates,
    clinicLatitude,
    clinicLongitude,
    clinicLat,
    clinicLng,
    clinicLocationSource,
    bio,
    documents,
    consultationFee,
    availableTimings,
    profileImage,
  } = req.body;

  const resolvedName = parseName({ name, firstName, lastName });

  if (!resolvedName.firstName || !email || !phone || !category || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide name/firstName, email, phone, category, and license number.',
    });
  }

  const existingEmail = await Doctor.findOne({ email });

  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const existingPhone = await Doctor.findOne({ phone });

  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  const existingLicense = await Doctor.findOne({ licenseNumber });

  if (existingLicense) {
    return res.status(400).json({ success: false, message: 'License number already registered.' });
  }

  let clinicPayload = clinicDetails ? { ...clinicDetails } : {};

  // Remove incomplete location objects (with only type but no coordinates)
  // Since we're not using GPS/map API, location should only be set if coordinates are explicitly provided
  if (clinicPayload.location) {
    const hasValidCoordinates = 
      clinicPayload.location.coordinates && 
      Array.isArray(clinicPayload.location.coordinates) && 
      clinicPayload.location.coordinates.length === 2 &&
      Number.isFinite(clinicPayload.location.coordinates[0]) &&
      Number.isFinite(clinicPayload.location.coordinates[1]);
    
    if (!hasValidCoordinates) {
      delete clinicPayload.location;
      delete clinicPayload.locationSource;
    }
  }

  const rawClinicAddressInput =
    clinicAddress !== undefined ? clinicAddress : clinicPayload.address;

  const {
    address: normalizedClinicAddress,
    addressProvided: clinicAddressProvided,
    location: addressDerivedLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(rawClinicAddressInput);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  if (clinicAddressProvided) {
    if (normalizedClinicAddress) {
      clinicPayload.address = normalizedClinicAddress;
    } else {
      delete clinicPayload.address;
    }
  }

  if (clinicName) {
    clinicPayload.name = clinicName;
  }

  const legacyLocation = parseGeoPoint({
    location: clinicLocation ?? clinicDetails?.location,
    coordinates: clinicCoordinates,
    lat: clinicLat ?? clinicLatitude,
    lng: clinicLng ?? clinicLongitude,
    latitude: clinicLatitude,
    longitude: clinicLongitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  delete clinicPayload.location;
  delete clinicPayload.locationSource;

  let clinicGeoPoint;
  let clinicLocationProvided = false;

  if (legacyLocation.provided) {
    clinicGeoPoint = legacyLocation.point;
    clinicLocationProvided = true;
  } else if (addressLocationProvided && addressDerivedLocation) {
    // Only use address-derived location if it has valid coordinates
    if (addressDerivedLocation.coordinates && 
        Array.isArray(addressDerivedLocation.coordinates) && 
        addressDerivedLocation.coordinates.length === 2) {
      clinicGeoPoint = addressDerivedLocation;
      clinicLocationProvided = true;
    }
  }

  // Only set location if we have valid coordinates
  // Since we're not using GPS/map API, skip location if coordinates are not explicitly provided
  if (clinicGeoPoint && 
      clinicGeoPoint.coordinates && 
      Array.isArray(clinicGeoPoint.coordinates) && 
      clinicGeoPoint.coordinates.length === 2 &&
      Number.isFinite(clinicGeoPoint.coordinates[0]) &&
      Number.isFinite(clinicGeoPoint.coordinates[1])) {
    clinicPayload.location = clinicGeoPoint;
  } else {
    // Ensure location is completely removed if invalid or missing
    delete clinicPayload.location;
    delete clinicPayload.locationSource;
  }

  let locationSourceValue;
  let locationSourceProvided = false;

  if (clinicLocationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(clinicLocationSource);
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceProvided = true;
  } else if (clinicDetails?.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      clinicDetails.locationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
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
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceProvided = true;
  }

  if (locationSourceProvided) {
    if (locationSourceValue) {
      clinicPayload.locationSource = locationSourceValue;
    } else {
      delete clinicPayload.locationSource;
    }
  }

  // Final validation: Ensure location has valid coordinates before saving
  // Since we're not using GPS/map API, completely remove location if coordinates are missing
  if (clinicPayload.location) {
    const hasValidCoordinates = 
      clinicPayload.location.coordinates && 
      Array.isArray(clinicPayload.location.coordinates) && 
      clinicPayload.location.coordinates.length === 2 &&
      Number.isFinite(clinicPayload.location.coordinates[0]) &&
      Number.isFinite(clinicPayload.location.coordinates[1]) &&
      clinicPayload.location.type === 'Point';
    
    if (!hasValidCoordinates) {
      delete clinicPayload.location;
      delete clinicPayload.locationSource;
    }
  }

  // Final cleanup: Remove location completely if it doesn't have valid coordinates
  // This is critical since we're not using GPS/map API - location should only exist with valid coordinates
  if (clinicPayload && clinicPayload.location) {
    if (!clinicPayload.location.coordinates || 
        !Array.isArray(clinicPayload.location.coordinates) || 
        clinicPayload.location.coordinates.length !== 2 ||
        !Number.isFinite(clinicPayload.location.coordinates[0]) ||
        !Number.isFinite(clinicPayload.location.coordinates[1])) {
      delete clinicPayload.location;
      delete clinicPayload.locationSource;
    }
  }

  // Clean up empty clinicDetails object
  if (clinicPayload && Object.keys(clinicPayload).length === 0) {
    clinicPayload = undefined;
  }

  // Ensure clinicDetails.location is completely removed if invalid
  const finalClinicDetails = clinicPayload ? { ...clinicPayload } : undefined;
  if (finalClinicDetails && finalClinicDetails.location) {
    if (!finalClinicDetails.location.coordinates || 
        !Array.isArray(finalClinicDetails.location.coordinates) || 
        finalClinicDetails.location.coordinates.length !== 2) {
      delete finalClinicDetails.location;
      delete finalClinicDetails.locationSource;
    }
  }

  // Ensure consultationFee is properly converted to number without any rounding or modification
  let finalConsultationFee = undefined;
  if (consultationFee !== undefined && consultationFee !== null && consultationFee !== '') {
    // Convert to string first to preserve precision, then parse
    const feeStr = String(consultationFee).trim();
    const feeValue = parseFloat(feeStr);
    
    // Validate the parsed value - preserve exact value without any rounding
    if (!isNaN(feeValue) && isFinite(feeValue) && feeValue >= 0) {
      // Keep exact value - no rounding, no modification
      finalConsultationFee = feeValue;
    }
  }

  

  // Migrate legacy 'video' consultation mode to 'call'
  const migratedConsultationModes = Array.isArray(consultationModes)
    ? consultationModes.map(mode => mode === 'video' ? 'call' : mode)
    : consultationModes;

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
              'doctor_doc'
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

  // Handle dynamic subcategories ("Other" option)
  const processedSubcategories = [];
  if (subcategories && Array.isArray(subcategories)) {
    const DoctorSubcategory = require('../../models/DoctorSubcategory');
    for (const sub of subcategories) {
      if (typeof sub === 'string' && sub.length > 0) {
        // Check if it's a valid ObjectId
        if (sub.match(/^[0-9a-fA-F]{24}$/)) {
          processedSubcategories.push(sub);
        } else {
          // It's a new symptom name, create a new subcategory (unapproved)
          try {
            const newSub = await DoctorSubcategory.create({
              name: sub,
              category,
              isApproved: false, // Needs admin approval
            });
            processedSubcategories.push(newSub._id);
          } catch (err) {
            console.error('Error creating dynamic subcategory:', err);
          }
        }
      }
    }
  }

  const doctor = await Doctor.create({
    firstName: resolvedName.firstName,
    lastName: resolvedName.lastName || '',
    email,
    phone,
    category,
    subcategories: processedSubcategories,
    licenseNumber,
    gender,
    experienceYears: experienceYears ?? experience,
    education,
    languages,
    consultationModes: migratedConsultationModes,
    clinicDetails: finalClinicDetails,
    bio,
    documents: processedDocuments.length > 0 ? processedDocuments : [],
    consultationFee: finalConsultationFee,
    availableTimings: Array.isArray(availableTimings)
      ? availableTimings
      : availableTimings
      ? [availableTimings]
      : undefined,
    profileImage,
    status: APPROVAL_STATUS.PENDING,
  });

  

  await sendSignupAcknowledgementEmail({
    role: ROLES.DOCTOR,
    email: doctor.email,
    name: `${doctor.firstName} ${doctor.lastName}`.trim(),
  });

  await notifyAdminsOfPendingSignup({ role: ROLES.DOCTOR, entity: doctor });

  // Create in-app notifications for all admins
  try {
    const Admin = require('../../models/Admin');
    const { createNotification } = require('../../services/notificationService');
    const admins = await Admin.find({ isActive: true });
    
    const doctorName = `${doctor.firstName} ${doctor.lastName}`.trim();
    
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        userType: 'admin',
        type: 'system',
        title: 'New Doctor Registration',
        message: `Dr. ${doctorName} has registered and is awaiting approval. License: ${doctor.licenseNumber || 'N/A'}`,
        data: {
          providerId: doctor._id,
          providerType: 'doctor',
          providerName: doctorName,
          email: doctor.email,
          phone: doctor.phone,
          licenseNumber: doctor.licenseNumber,
          category: doctor.category,
          address: doctor.clinicDetails?.address || null,
          registrationDate: doctor.createdAt,
        },
        priority: 'medium',
        actionUrl: `/admin/doctors`,
        icon: 'doctor',
        sendEmail: false, // Email already sent via notifyAdminsOfPendingSignup
        emitSocket: true,
      }).catch((error) => console.error(`Error creating admin notification for doctor registration:`, error));
    }
  } catch (error) {
    console.error('Error creating admin notifications for doctor registration:', error);
  }

  return res.status(201).json({
    success: true,
    message: 'Doctor registration submitted for admin approval.',
    data: {
      doctor,
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

  const result = await requestLoginOtp({ role: ROLES.DOCTOR, phone });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: {
      phone: result.phone,
    },
  });
});

// Verify OTP and login
exports.loginDoctor = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required.',
    });
  }

  const result = await verifyLoginOtp({ role: ROLES.DOCTOR, phone, otp });
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
      doctor: user,
      tokens,
    },
  });
});

exports.getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await getProfileByRoleAndId(ROLES.DOCTOR, req.auth.id);

  return res.status(200).json({ success: true, data: doctor });
});

exports.updateDoctorProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  if (updates.name && !updates.firstName) {
    const resolvedName = parseName({ name: updates.name });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  if (updates.experience !== undefined && updates.experienceYears === undefined) {
    updates.experienceYears = updates.experience;
  }

  if (updates.consultationFee !== undefined && updates.consultationFee !== null && updates.consultationFee !== '') {
    const feeValue = parseFloat(String(updates.consultationFee));
    if (!isNaN(feeValue) && isFinite(feeValue)) {
      updates.consultationFee = feeValue;
    }
  }

  if (updates.availableTimings !== undefined && !Array.isArray(updates.availableTimings)) {
    updates.availableTimings = [updates.availableTimings];
  }

  // Migrate legacy 'video' consultation mode to 'call'
  if (updates.consultationModes !== undefined && Array.isArray(updates.consultationModes)) {
    updates.consultationModes = updates.consultationModes.map(mode => mode === 'video' ? 'call' : mode);
  }

  if (updates.clinicAddress !== undefined || updates.clinicName !== undefined) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (updates.clinicName !== undefined) {
      updates.clinicDetails.name = updates.clinicName;
    }
  }

  const rawClinicAddressUpdate =
    updates.clinicAddress !== undefined
      ? updates.clinicAddress
      : updates.clinicDetails?.address;

  const {
    address: normalizedClinicAddress,
    addressProvided: clinicAddressProvided,
    location: addressDerivedLocation,
    locationProvided: addressLocationProvided,
    locationSource: addressLocationSource,
    locationSourceProvided: addressLocationSourceProvided,
    error: addressLocationError,
  } = extractAddressLocation(rawClinicAddressUpdate);

  if (addressLocationError) {
    return res.status(400).json({
      success: false,
      message: addressLocationError,
    });
  }

  if (clinicAddressProvided) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (normalizedClinicAddress) {
      updates.clinicDetails.address = normalizedClinicAddress;
    } else {
      updates.clinicDetails.address = undefined;
    }
  }

  const legacyLocation = parseGeoPoint({
    location: updates.clinicLocation ?? updates.clinicDetails?.location,
    coordinates: updates.clinicCoordinates,
    lat: updates.clinicLat ?? updates.clinicLatitude,
    lng: updates.clinicLng ?? updates.clinicLongitude,
    latitude: updates.clinicLatitude,
    longitude: updates.clinicLongitude,
  });

  if (legacyLocation.error) {
    return res.status(400).json({
      success: false,
      message: legacyLocation.error,
    });
  }

  let locationShouldClear = false;
  let updatedClinicLocation;

  if (legacyLocation.provided) {
    updatedClinicLocation = legacyLocation.point;
    locationShouldClear = legacyLocation.point === null;
  } else if (addressLocationProvided) {
    updatedClinicLocation = addressDerivedLocation;
    locationShouldClear = addressDerivedLocation === null;
  } else if (
    updates.clinicDetails &&
    updates.clinicDetails.location === null
  ) {
    locationShouldClear = true;
  }

  if (updatedClinicLocation || locationShouldClear) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (updatedClinicLocation) {
      updates.clinicDetails.location = updatedClinicLocation;
    } else {
      updates.clinicDetails.location = undefined;
    }
  }

  let locationSourceValue;
  let locationSourceUpdateProvided = false;

  if (updates.clinicLocationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      updates.clinicLocationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceUpdateProvided = true;
  } else if (updates.clinicDetails?.locationSource !== undefined) {
    const normalizedSource = normalizeLocationSource(
      updates.clinicDetails.locationSource
    );
    if (normalizedSource && !LOCATION_SOURCES.includes(normalizedSource)) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      normalizedSource === null ? undefined : normalizedSource;
    locationSourceUpdateProvided = true;
  } else if (addressLocationSourceProvided) {
    if (
      addressLocationSource &&
      !LOCATION_SOURCES.includes(addressLocationSource)
    ) {
      return res.status(400).json({
        success: false,
        message: `clinicLocationSource must be one of: ${LOCATION_SOURCES.join(
          ', '
        )}.`,
      });
    }
    locationSourceValue =
      addressLocationSource === null ? undefined : addressLocationSource;
    locationSourceUpdateProvided = true;
  }

  if (locationSourceUpdateProvided) {
    updates.clinicDetails = updates.clinicDetails || {};
    if (locationSourceValue) {
      updates.clinicDetails.locationSource = locationSourceValue;
    } else {
      updates.clinicDetails.locationSource = undefined;
    }
  }

  delete updates.name;
  delete updates.experience;
  delete updates.clinicName;
  delete updates.clinicAddress;
  delete updates.clinicLocation;
  delete updates.clinicCoordinates;
  delete updates.clinicLatitude;
  delete updates.clinicLongitude;
  delete updates.clinicLat;
  delete updates.clinicLng;
  delete updates.clinicLocationSource;

  const doctor = await updateProfileByRoleAndId(ROLES.DOCTOR, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: doctor,
  });
});

exports.logoutDoctor = asyncHandler(async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  // Blacklist access token if provided
  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.id && decoded.role) {
        await blacklistToken(accessToken, 'access', decoded.id, decoded.role, 'logout');
      }
    } catch (error) {
      
    }
  }

  // Blacklist refresh token if provided
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

// Refresh token endpoint
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
    const doctor = await Doctor.findById(decoded.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(doctor, 'isActive') && doctor.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive.',
      });
    }

    // Token rotation - blacklist old refresh token
    try {
      await blacklistToken(refreshToken, 'refresh', decoded.id, decoded.role, 'refresh');
    } catch (error) {
      
    }

    const payload = { id: doctor._id, role: ROLES.DOCTOR };
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

exports.getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.auth.role;
  const requesterId = String(req.auth.id);

  if (requesterRole !== ROLES.ADMIN && requesterId !== String(id)) {
    const error = new Error('You are not authorized to access this doctor profile.');
    error.status = 403;
    throw error;
  }

  const doctor = await getProfileByRoleAndId(ROLES.DOCTOR, id);

  return res.status(200).json({ success: true, data: doctor });
});

