const Nurse = require('../../models/Nurse');
const asyncHandler = require('../../middleware/asyncHandler');
const { createAccessToken, createRefreshToken, verifyRefreshToken, blacklistToken, decodeToken } = require('../../utils/tokenService');
const { sendSignupAcknowledgementEmail } = require('../../services/emailService');
const { requestLoginOtp, verifyLoginOtp } = require('../../services/loginOtpService');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { notifyAdminsOfPendingSignup } = require('../../services/adminNotificationService');
const { ROLES, APPROVAL_STATUS } = require('../../utils/constants');
const { uploadFile } = require('../../services/fileUploadService');

const parseName = ({ fullName, firstName, lastName, name }) => {
  if (firstName) {
    return {
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : '',
    };
  }

  if (fullName || name) {
    const nameToParse = (fullName || name).trim();
    const parts = nameToParse.split(/\s+/);
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
  const payload = { id: user._id, role: ROLES.NURSE };
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

exports.registerNurse = asyncHandler(async (req, res) => {
  const {
    fullName,
    name,
    firstName,
    lastName,
    email,
    phone,
    gender,
    address,
    qualification,
    experienceYears,
    specialization,
    fees,
    registrationNumber,
    registrationCouncilName,
    bio,
    availability,
    documents,
    nursingCertificate, // For backward compatibility
    registrationCertificate, // For backward compatibility
    profileImage,
  } = req.body;

  const resolvedName = parseName({ fullName, name, firstName, lastName });

  // Validate required fields
  if (!resolvedName.firstName || !email || !phone || !qualification || !registrationNumber || !registrationCouncilName) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing. Provide name/fullName/firstName, email, phone, qualification, registrationNumber, and registrationCouncilName.',
    });
  }

  // Validate address
  if (!address || !address.line1 || !address.city || !address.state || !address.postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Complete address is required (line1, city, state, postalCode).',
    });
  }

  // Check for existing email
  const existingEmail = await Nurse.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  // Check for existing phone
  const existingPhone = await Nurse.findOne({ phone });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'Phone number already registered.' });
  }

  // Check for existing registration number
  const existingRegistration = await Nurse.findOne({ registrationNumber });
  if (existingRegistration) {
    return res.status(400).json({ success: false, message: 'Registration number already registered.' });
  }

  let profileImageUrl = profileImage && typeof profileImage === 'string' && profileImage.startsWith('http') ? profileImage : null;

  // Handle multipart form data file uploads
  if (req.files) {
    if (req.files.profileImage) {
      try {
        const uploadResult = await uploadFile(req.files.profileImage, 'profiles', 'nurse');
        profileImageUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading profile image:', error);
        // Don't fail registration if profile image fails
      }
    }
  }

  // Handle base64 or URL strings if provided in body
  if (profileImage && !profileImageUrl) {
    if (typeof profileImage === 'string' && profileImage.startsWith('http')) {
      profileImageUrl = profileImage;
    }
  }

  // Process documents: convert base64 to files and upload to uploads/documents folder
  // Check if documents is in body (base64 array) or if old format (nursingCertificate, registrationCertificate)
  let processedDocuments = [];

  if (documents && Array.isArray(documents) && documents.length > 0) {
    // New format: array of base64 documents
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
              'nurse_doc'
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
  } else if (nursingCertificate || registrationCertificate) {
    // Old format: handle individual certificate fields (for backward compatibility with multipart form data)
    if (req.files) {
      if (req.files.nursingCertificate) {
        try {
          const uploadResult = await uploadFile(req.files.nursingCertificate, 'documents', 'nurse');
          processedDocuments.push({
            name: 'Nursing Certificate',
            fileUrl: uploadResult.url,
            uploadedAt: new Date(),
          });
        } catch (error) {
          console.error('Error uploading nursing certificate:', error);
        }
      }

      if (req.files.registrationCertificate) {
        try {
          const uploadResult = await uploadFile(req.files.registrationCertificate, 'documents', 'nurse');
          processedDocuments.push({
            name: 'Registration Certificate',
            fileUrl: uploadResult.url,
            uploadedAt: new Date(),
          });
        } catch (error) {
          console.error('Error uploading registration certificate:', error);
        }
      }
    }
  }

  // Parse fees
  let feesValue = undefined;
  if (fees !== undefined && fees !== null && fees !== '') {
    const parsedFees = parseFloat(String(fees));
    if (!isNaN(parsedFees) && isFinite(parsedFees)) {
      feesValue = parsedFees;
    }
  }

  // Parse availability
  let availabilityArray = [];
  if (availability !== undefined && availability !== null) {
    if (typeof availability === 'string') {
      try {
        const parsed = JSON.parse(availability);
        availabilityArray = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // If parsing fails, try comma-separated string
        if (availability.includes(',')) {
          availabilityArray = availability.split(',').map(s => s.trim()).filter(s => s);
        } else if (availability.trim()) {
          availabilityArray = [availability.trim()];
        }
      }
    } else if (Array.isArray(availability)) {
      availabilityArray = availability;
    }
  }
  // Validate availability days
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  availabilityArray = availabilityArray.filter(day => validDays.includes(day));

  // Create nurse document
  const nurseData = {
    firstName: resolvedName.firstName,
    lastName: resolvedName.lastName || '',
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    gender: gender || undefined,
    qualification: qualification.trim(),
    experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
    specialization: specialization ? specialization.trim() : undefined,
    fees: feesValue,
    registrationNumber: registrationNumber.trim(),
    registrationCouncilName: registrationCouncilName.trim(),
    address: {
      line1: address.line1.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
      country: address.country || 'India',
    },
    bio: bio ? bio.trim() : undefined,
    availability: availabilityArray,
    profileImage: profileImageUrl,
    documents: processedDocuments,
    status: APPROVAL_STATUS.PENDING,
  };

  const nurse = await Nurse.create(nurseData);

  // Send acknowledgement email
  try {
    await sendSignupAcknowledgementEmail({
      email: nurse.email,
      name: `${nurse.firstName} ${nurse.lastName}`.trim(),
      role: 'Nurse',
    });
  } catch (error) {
    console.error('Error sending signup acknowledgement email:', error);
    // Don't fail registration if email fails
  }

  // Notify admins
  try {
    await notifyAdminsOfPendingSignup({
      role: ROLES.NURSE,
      entity: nurse,
    });
  } catch (error) {
    console.error('Error notifying admins:', error);
    // Don't fail registration if notification fails
  }

  return res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Please wait for admin approval.',
    data: {
      nurse: {
        id: nurse._id,
        firstName: nurse.firstName,
        lastName: nurse.lastName,
        email: nurse.email,
        phone: nurse.phone,
        status: nurse.status,
      },
    },
  });
});

// Request OTP for login
exports.requestLoginOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required.',
    });
  }

  const result = await requestLoginOtp({ role: ROLES.NURSE, phone });

  return res.status(200).json({
    success: true,
    message: result.message,
    data: {
      phone: result.phone,
    },
  });
});

// Verify OTP and login
exports.loginNurse = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required.',
    });
  }

  const result = await verifyLoginOtp({ role: ROLES.NURSE, phone, otp });
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

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = buildAuthResponse(user);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      nurse: user,
      tokens,
    },
  });
});

exports.getNurseProfile = asyncHandler(async (req, res) => {
  const nurse = await getProfileByRoleAndId(ROLES.NURSE, req.auth.id);

  return res.status(200).json({ success: true, data: nurse });
});

exports.updateNurseProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Handle dot notation keys from FormData (e.g., 'address.line1' -> address: { line1: ... })
  // When FormData is sent with dot notation, Express doesn't automatically parse them into nested objects
  const addressFields = {};
  Object.keys(updates).forEach(key => {
    if (key.startsWith('address.')) {
      const fieldName = key.replace('address.', '');
      addressFields[fieldName] = updates[key];
      delete updates[key];
    }
  });

  // Reconstruct address object if any address fields were found
  if (Object.keys(addressFields).length > 0) {
    updates.address = {
      ...(updates.address || {}),
      ...addressFields,
    };
  }

  // Handle name parsing
  if (updates.fullName && !updates.firstName) {
    const resolvedName = parseName({ fullName: updates.fullName });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  if (updates.name && !updates.firstName) {
    const resolvedName = parseName({ name: updates.name });
    updates.firstName = resolvedName.firstName;
    updates.lastName = resolvedName.lastName;
  }

  // Handle fees
  if (updates.fees !== undefined && updates.fees !== null && updates.fees !== '') {
    const feeValue = parseFloat(String(updates.fees));
    if (!isNaN(feeValue) && isFinite(feeValue)) {
      updates.fees = feeValue;
    } else {
      updates.fees = undefined;
    }
  }

  // Handle availability - always process if provided (even if empty array)
  if (updates.availability !== undefined) {
    if (typeof updates.availability === 'string') {
      try {
        const parsed = JSON.parse(updates.availability);
        // Ensure it's an array
        updates.availability = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // If parsing fails, try comma-separated string
        console.error('Error parsing availability:', e);
        if (updates.availability.includes(',')) {
          updates.availability = updates.availability.split(',').map(s => s.trim()).filter(s => s);
        } else if (updates.availability.trim()) {
          // Single day string
          updates.availability = [updates.availability.trim()];
        } else {
          // Empty string means empty array
          updates.availability = [];
        }
      }
    } else if (Array.isArray(updates.availability)) {
      // Already an array, validate and filter
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      updates.availability = updates.availability.filter(day => validDays.includes(day));
    } else {
      // Invalid format, set to empty array
      updates.availability = [];
    }
  }

  // Handle bio - trim if provided
  if (updates.bio !== undefined) {
    if (updates.bio === null) {
      updates.bio = '';
    } else {
      updates.bio = String(updates.bio).trim();
    }
  }

  // Handle file uploads if provided
  

  // Initialize documents array if not present
  if (!updates.documents || !Array.isArray(updates.documents)) {
    updates.documents = [];
  }

  if (req.files) {
    if (req.files.nursingCertificate) {
      try {
        // Handle both array and single file formats from multer
        const certificateFile = Array.isArray(req.files.nursingCertificate)
          ? req.files.nursingCertificate[0]
          : req.files.nursingCertificate;
        
        const uploadResult = await uploadFile(certificateFile, 'documents', 'nurse');
        
        
        // Add to documents array with proper structure
        updates.documents.push({
          name: 'Nursing Certificate',
          fileUrl: uploadResult.url,
          uploadedAt: new Date(),
        });
      } catch (error) {
        console.error('❌ Error uploading nursing certificate:', error);
      }
    }

    if (req.files.registrationCertificate) {
      try {
        // Handle both array and single file formats from multer
        const certificateFile = Array.isArray(req.files.registrationCertificate)
          ? req.files.registrationCertificate[0]
          : req.files.registrationCertificate;
        
        const uploadResult = await uploadFile(certificateFile, 'documents', 'nurse');
        
        
        // Add to documents array with proper structure
        updates.documents.push({
          name: 'Registration Certificate',
          fileUrl: uploadResult.url,
          uploadedAt: new Date(),
        });
      } catch (error) {
        console.error('❌ Error uploading registration certificate:', error);
      }
    }

    if (req.files.profileImage) {
      try {
        

        // Handle both array and single file formats from multer
        const profileImageFile = Array.isArray(req.files.profileImage)
          ? req.files.profileImage[0]
          : req.files.profileImage;

        const uploadResult = await uploadFile(profileImageFile, 'profiles', 'nurse');
        
        updates.profileImage = uploadResult.url;

        // Don't set documents.profileImage - that's for certificates
      } catch (error) {
        console.error('❌ Error uploading profile image:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
    } else {
      
    }
  } else {
    
  }

  // Clean up name fields
  delete updates.fullName;
  delete updates.name;

  const nurse = await updateProfileByRoleAndId(ROLES.NURSE, req.auth.id, updates);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: nurse,
  });
});

exports.logoutNurse = asyncHandler(async (req, res) => {
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
    const nurse = await Nurse.findById(decoded.id);

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(nurse, 'isActive') && nurse.isActive === false) {
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

    const payload = { id: nurse._id, role: ROLES.NURSE };
    const newAccessToken = createAccessToken(payload);
    const newRefreshToken = createRefreshToken(payload);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
  }
});

// Get nurse by ID (for admin or self)
exports.getNurseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const nurse = await Nurse.findById(id).select('-password');

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

