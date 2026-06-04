const asyncHandler = require('../../middleware/asyncHandler');
const { getProfileByRoleAndId, updateProfileByRoleAndId } = require('../../services/profileService');
const { ROLES } = require('../../utils/constants');

// GET /api/pharmacy/auth/me
exports.getPharmacyProfile = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const profile = await getProfileByRoleAndId(ROLES.PHARMACY, id);

  return res.status(200).json({
    success: true,
    data: profile,
  });
});

// PATCH /api/pharmacy/auth/me
exports.updatePharmacyProfile = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const updateData = req.body;

  const updatedProfile = await updateProfileByRoleAndId(ROLES.PHARMACY, id, updateData);

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

