const asyncHandler = require('../../middleware/asyncHandler');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { ROLES } = require('../../utils/constants');

// GET /api/laboratory/auth/me
exports.getLaboratoryProfile = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const profile = await getProfileByRoleAndId(ROLES.LABORATORY, id);

  return res.status(200).json({
    success: true,
    data: profile,
  });
});

// PATCH /api/laboratory/auth/me
exports.updateLaboratoryProfile = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const updateData = req.body;

  const updatedProfile = await updateProfileByRoleAndId(ROLES.LABORATORY, id, updateData);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

