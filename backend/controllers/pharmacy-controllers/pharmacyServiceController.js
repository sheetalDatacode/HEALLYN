const asyncHandler = require('../../middleware/asyncHandler');
const PharmacyService = require('../../models/PharmacyService');

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/pharmacy/services
exports.getServices = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { category, available } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { pharmacyId: id };
  if (category) filter.category = category;
  if (available !== undefined) filter.available = available === 'true';

  const [services, total] = await Promise.all([
    PharmacyService.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    PharmacyService.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// POST /api/pharmacy/services
exports.addService = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { name, description, category, price, duration, deliveryOptions, serviceRadius } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Service name is required',
    });
  }

  const service = await PharmacyService.create({
    pharmacyId: id,
    name,
    description,
    category: category || 'prescription',
    price: price || 0,
    duration,
    deliveryOptions: deliveryOptions || [],
    serviceRadius: serviceRadius || 0,
    available: true,
  });

  return res.status(201).json({
    success: true,
    message: 'Service added successfully',
    data: service,
  });
});

// PATCH /api/pharmacy/services/:id
exports.updateService = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { serviceId } = req.params;
  const updateData = req.body;

  const service = await PharmacyService.findOne({
    _id: serviceId,
    pharmacyId: id,
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  Object.assign(service, updateData);
  await service.save();

  return res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    data: service,
  });
});

// DELETE /api/pharmacy/services/:id
exports.deleteService = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { serviceId } = req.params;

  const service = await PharmacyService.findOne({
    _id: serviceId,
    pharmacyId: id,
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  await PharmacyService.findByIdAndDelete(serviceId);

  return res.status(200).json({
    success: true,
    message: 'Service deleted successfully',
  });
});

// PATCH /api/pharmacy/services/:id/toggle
exports.toggleService = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { serviceId } = req.params;

  const service = await PharmacyService.findOne({
    _id: serviceId,
    pharmacyId: id,
  });

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found',
    });
  }

  service.available = !service.available;
  await service.save();

  return res.status(200).json({
    success: true,
    message: `Service ${service.available ? 'enabled' : 'disabled'}`,
    data: service,
  });
});

