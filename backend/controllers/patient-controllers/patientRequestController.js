const asyncHandler = require('../../middleware/asyncHandler');
const mongoose = require('mongoose');
const Request = require('../../models/Request');
const Prescription = require('../../models/Prescription');
const Patient = require('../../models/Patient');
const Order = require('../../models/Order');
const { createOrder } = require('../../services/paymentService');
const { getIO } = require('../../config/socket');
// Admin notification service - using notifyAdminsOfPatientRequest for patient requests

// Helper functions
const buildPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// POST /api/patients/requests
exports.createRequest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { type, prescriptionId, visitType, patientAddress } = req.body;

  if (!type || !['order_medicine', 'book_test_visit'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request type',
    });
  }

  // Get patient data
  const Patient = require('../../models/Patient');
  const patient = await Patient.findById(id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found',
    });
  }

  // Get prescription if provided
  let prescription = null;
  if (prescriptionId) {
    prescription = await Prescription.findOne({
      _id: prescriptionId,
      patientId: id,
    });
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }
  }

  const request = await Request.create({
    patientId: id,
    type,
    prescriptionId: prescriptionId || null,
    prescription: prescription ? prescription.toObject() : null,
    visitType: type === 'book_test_visit' ? visitType : null,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientPhone: patient.phone,
    patientEmail: patient.email,
    patientAddress: patientAddress || patient.address,
    status: 'pending',
    paymentStatus: 'pending',
  });

  // Emit real-time event to admin
  try {
    const io = getIO();
    io.to('admins').emit('request:created', {
      request: await Request.findById(request._id)
        .populate('patientId', 'firstName lastName phone email'),
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send email notification to admin
  try {
    const { notifyAdminsOfPatientRequest } = require('../../services/adminNotificationService');
    await notifyAdminsOfPatientRequest({
      request,
      patient,
    }).catch((error) => console.error('Error sending admin patient request notification:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  // Create in-app notifications
  try {
    const { createRequestNotification, createAdminNotification } = require('../../services/notificationService');
    const populatedRequest = await Request.findById(request._id)
      .populate('patientId', 'firstName lastName phone email');

    // Notify patient
    await createRequestNotification({
      userId: id,
      userType: 'patient',
      request: populatedRequest,
      eventType: 'created',
    }).catch((error) => console.error('Error creating patient request notification:', error));

    // Notify all admins
    const Admin = require('../../models/Admin');
    const admins = await Admin.find({});
    const patientName = `${patient.firstName} ${patient.lastName}`.trim();
    const requestTypeLabel = type === 'order_medicine' ? 'Medicine Order' : 'Test Visit Booking';
    
    for (const admin of admins) {
      await createAdminNotification({
        userId: admin._id,
        userType: 'admin',
        eventType: 'request_created',
        data: {
          requestId: request._id,
          patientId: id,
          patientName: patientName,
          patientEmail: patient.email,
          patientPhone: patient.phone,
          requestType: type,
          requestTypeLabel: requestTypeLabel,
          patientAddress: request.patientAddress || patient.address,
          prescriptionId: prescriptionId || null,
          visitType: type === 'book_test_visit' ? visitType : null,
          requestDate: request.createdAt,
        },
        actionUrl: `/admin/requests`,
      }).catch((error) => console.error('Error creating admin notification:', error));
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }


  return res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: request,
  });
});

// GET /api/patients/requests
exports.getRequests = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const { status, type } = req.query;
  const { page, limit, skip } = buildPagination(req);

  const filter = { patientId: id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate({
        path: 'prescriptionId',
        populate: [
          {
            path: 'doctorId',
            select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
          },
          {
            path: 'patientId',
            select: 'firstName lastName dateOfBirth gender phone email address',
          },
          {
            path: 'consultationId',
            select: 'consultationDate diagnosis symptoms investigations advice followUpDate',
          },
        ],
      })
      .populate('adminResponse.labs')
      .populate('adminResponse.pharmacies')
      .populate('adminResponse.tests.labId')
      .populate({
        path: 'orders',
        populate: {
          path: 'providerId',
          select: 'labName pharmacyName name address phone email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Request.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

// GET /api/patients/requests/:id
exports.getRequestById = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const requestId = req.params.id; // Route parameter is :id

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  })
    .populate({
      path: 'prescriptionId',
      populate: [
        {
          path: 'doctorId',
          select: 'firstName lastName specialization profileImage phone email clinicDetails digitalSignature',
        },
        {
          path: 'patientId',
          select: 'firstName lastName dateOfBirth gender phone email address',
        },
        {
          path: 'consultationId',
          select: 'consultationDate diagnosis symptoms investigations advice followUpDate',
        },
      ],
    })
    .populate({
      path: 'orders',
      populate: {
        path: 'providerId',
        select: 'labName pharmacyName name address phone email'
      }
    })
    .populate('adminResponse.labs')
    .populate('adminResponse.pharmacies')
    .populate('adminResponse.tests.labId');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
  });
});

// POST /api/patients/requests/:id/payment/order - Create payment order for request
exports.createRequestPaymentOrder = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const requestId = req.params.id; // Route parameter is :id

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Request must be accepted by admin before payment',
    });
  }

  if (request.paymentConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Payment already confirmed for this request',
    });
  }

  const totalAmount = request.adminResponse?.totalAmount || 0;
  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total amount is not set or invalid. Please wait for admin to create the bill.',
    });
  }

  // Create Razorpay order
  const order = await createOrder(totalAmount, 'INR', {
    requestId: request._id.toString(),
    patientId: id,
    type: request.type,
  });

  return res.status(200).json({
    success: true,
    message: 'Payment order created successfully',
    data: {
      orderId: order.orderId,
      amount: order.amount / 100, // Convert from paise to rupees
      currency: order.currency,
      requestId: request._id,
      totalAmount: totalAmount,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '', // Return Razorpay key ID for frontend
    },
  });
});

// POST /api/patients/requests/:id/payment
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const requestId = req.params.id; // Route parameter is :id
  const { paymentId, paymentMethod, orderId, signature } = req.body;

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Request must be accepted before payment',
    });
  }

  if (request.paymentConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Payment already confirmed',
    });
  }

  // Verify payment if paymentId provided
  let paymentVerified = false;
  if (paymentId && paymentMethod === 'razorpay') {
    const { verifyPayment, getPaymentDetails } = require('../../services/paymentService');
    const { orderId } = req.body;

    if (!orderId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Signature are required for Razorpay payment verification',
      });
    }

    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);
    if (paymentDetails.payment.status !== 'captured' && paymentDetails.payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
      });
    }

    paymentVerified = true;
  } else if (!paymentId) {
    // For cash or other payment methods, allow direct confirmation
    paymentVerified = true;
  }

  if (!paymentVerified) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed',
    });
  }

  request.paymentStatus = 'paid';
  request.paymentConfirmed = true;
  request.paymentId = paymentId || null;
  request.razorpayOrderId = req.body.orderId || null;
  request.paidAt = new Date();
  request.status = 'confirmed';
  await request.save();

  // Get patient data for email
  const patient = await Patient.findById(id);

  // Distribute money to pharmacies and labs based on their items
  const WalletTransaction = require('../../models/WalletTransaction');
  const Pharmacy = require('../../models/Pharmacy');
  const Laboratory = require('../../models/Laboratory');
  const io = getIO();

  // Group medicines by pharmacy and distribute money
  let totalPharmacyCommission = 0; // Track total commission from all pharmacies
  if (request.adminResponse.medicines && request.adminResponse.medicines.length > 0) {
    const pharmacyGroups = {};
    request.adminResponse.medicines.forEach((med) => {
      const pharmId = med.pharmacyId?.toString() || med.pharmacyId;
      if (!pharmId) {
        console.warn('Medicine missing pharmacyId:', med);
        return;
      }
      if (!pharmacyGroups[pharmId]) {
        pharmacyGroups[pharmId] = [];
      }
      pharmacyGroups[pharmId].push(med);
    });

    for (const [pharmacyId, medicines] of Object.entries(pharmacyGroups)) {
      // Calculate pharmacy's total amount
      const pharmacyTotal = medicines.reduce((sum, med) => sum + ((med.price || 0) * (med.quantity || 1)), 0);

      // Calculate pharmacy earning after commission using .env config
      const { calculateProviderEarning } = require('../../utils/commissionConfig');
      const { earning: pharmacyEarning, commission, commissionRate } = calculateProviderEarning(
        pharmacyTotal,
        'pharmacy'
      );

      // Accumulate commission for admin
      totalPharmacyCommission += commission || 0;

      // Get pharmacy's current wallet balance
      const latestTransaction = await WalletTransaction.findOne({
        userId: pharmacyId,
        userType: 'pharmacy',
        status: 'completed',
      }).sort({ createdAt: -1 });

      const currentBalance = latestTransaction?.balance || 0;
      const newBalance = currentBalance + pharmacyEarning;

      // Ensure pharmacyId is valid before creating transaction
      if (!pharmacyId || !mongoose.Types.ObjectId.isValid(pharmacyId)) {
        console.error('Invalid pharmacyId for wallet transaction', { pharmacyId, pharmacyGroup: medicines });
        continue;
      }

      const pharmacyObjectId = new mongoose.Types.ObjectId(pharmacyId);

      // Create wallet transaction for pharmacy earning
      await WalletTransaction.create({
        userId: pharmacyObjectId,
        userType: 'pharmacy',
        type: 'earning',
        amount: pharmacyEarning,
        balance: newBalance,
        status: 'completed',
        description: `Payment received for medicines from patient ${patient.firstName} ${patient.lastName} - Request ${request._id} (Commission: ${(commissionRate * 100).toFixed(1)}%)`,
        referenceId: request._id.toString(),
        requestId: request._id,
        metadata: {
          totalAmount: pharmacyTotal,
          commission,
          commissionRate,
          earning: pharmacyEarning,
          medicinesCount: medicines.length,
        },
      });

      // Create wallet credit notification for pharmacy
      try {
        const { createWalletNotification } = require('../../services/notificationService');
        const pharmacyData = await Pharmacy.findById(pharmacyId).select('pharmacyName email');
        await createWalletNotification({
          userId: pharmacyId,
          userType: 'pharmacy',
          amount: pharmacyEarning,
          eventType: 'payment_received',
          sendEmail: true,
          user: pharmacyData,
        }).catch((error) => console.error('Error creating pharmacy payment credit notification:', error));
      } catch (error) {
        console.error('Error creating pharmacy wallet credit notification:', error);
      }

      // Emit real-time event to pharmacy
      try {
        io.to(`pharmacy-${pharmacyId}`).emit('wallet:credited', {
          amount: pharmacyEarning,
          balance: newBalance,
          requestId: request._id,
          commission,
          commissionRate,
          pharmacyTotal,
        });
        // Notify pharmacy that a paid request is available in their request order section
        io.to(`pharmacy-${pharmacyId}`).emit('request:assigned', {
          request: await Request.findById(request._id)
            .populate('patientId', 'firstName lastName phone address'),
        });
        io.to(`pharmacy-${pharmacyId}`).emit('request:payment:confirmed', {
          requestId: request._id,
          pharmacyTotal,
          pharmacyEarning,
        });
      } catch (error) {
        console.error('Socket.IO error:', error);
      }

      // Create in-app notification for pharmacy about new paid request
      try {
        const { createRequestNotification } = require('../../services/notificationService');
        const populatedRequest = await Request.findById(request._id)
          .populate('patientId', 'firstName lastName phone email')
          .populate({
            path: 'prescriptionId',
            populate: [
              {
                path: 'doctorId',
                select: 'firstName lastName specialization',
              },
              {
                path: 'patientId',
                select: 'firstName lastName',
              },
            ],
          });

        const patientName = patient.firstName && patient.lastName
          ? `${patient.firstName} ${patient.lastName}`
          : patient.firstName || 'Patient';

        await createRequestNotification({
          userId: pharmacyId,
          userType: 'pharmacy',
          request: populatedRequest,
          eventType: 'assigned',
          pharmacy: await require('../../models/Pharmacy').findById(pharmacyId).select('pharmacyName email'),
          patient,
        }).catch((error) => console.error('Error creating pharmacy request notification:', error));
      } catch (error) {
        console.error('Error creating pharmacy notification:', error);
      }
    }
  }

  // Group tests by lab and distribute money
  // Check both 'tests' and 'investigations' for backward compatibility
  let totalLabCommission = 0; // Track total commission from all labs
  const labTests = request.adminResponse.tests || request.adminResponse.investigations || [];
  if (labTests.length > 0) {
    const labGroups = {};
    labTests.forEach((test) => {
      // Handle both test formats: 
      // 1. {labId, name, price} - from investigations array
      // 2. {labId, test: {name, price}} - from selectedTestsFromLab
      // 3. {name, price} - without labId (use first lab from adminResponse.labs)
      let labId = test.labId?.toString() || test.labId;

      // If no labId in test, try to get from adminResponse.labs (first lab)
      if (!labId && request.adminResponse.labs && request.adminResponse.labs.length > 0) {
        const firstLab = request.adminResponse.labs[0];
        labId = firstLab.labId?.toString() || firstLab.id?.toString() || firstLab._id?.toString();
      }

      if (!labId) {
        // If still no labId, skip this test
        console.warn('Test missing labId:', test);
        return;
      }

      if (!labGroups[labId]) {
        labGroups[labId] = [];
      }
      labGroups[labId].push(test);
    });

    for (const [labId, tests] of Object.entries(labGroups)) {
      // Calculate lab's total amount
      // Handle both test formats: {price} or investigations format
      const labTotal = tests.reduce((sum, test) => {
        const testPrice = test.price || test.test?.price || 0;
        return sum + Number(testPrice);
      }, 0);

      // Calculate laboratory earning after commission using .env config
      const { calculateProviderEarning } = require('../../utils/commissionConfig');
      const { earning: labEarning, commission, commissionRate } = calculateProviderEarning(
        labTotal,
        'laboratory'
      );

      // Accumulate commission for admin
      totalLabCommission += commission || 0;

      // Get lab's current wallet balance
      const latestTransaction = await WalletTransaction.findOne({
        userId: labId,
        userType: 'laboratory',
        status: 'completed',
      }).sort({ createdAt: -1 });

      const currentBalance = latestTransaction?.balance || 0;
      const newBalance = currentBalance + labEarning;

      // Ensure labId is valid before creating transaction
      if (!labId || !mongoose.Types.ObjectId.isValid(labId)) {
        console.error('Invalid labId for wallet transaction', { labId, labGroup: tests });
        continue;
      }

      const labObjectId = new mongoose.Types.ObjectId(labId);

      // Create wallet transaction for lab earning
      await WalletTransaction.create({
        userId: labObjectId,
        userType: 'laboratory',
        type: 'earning',
        amount: labEarning,
        balance: newBalance,
        status: 'completed',
        description: `Payment received for tests from patient ${patient.firstName} ${patient.lastName} - Request ${request._id} (Commission: ${(commissionRate * 100).toFixed(1)}%)`,
        referenceId: request._id.toString(),
        requestId: request._id,
        metadata: {
          totalAmount: labTotal,
          commission,
          commissionRate,
          earning: labEarning,
          testsCount: tests.length,
        },
      });

      // Create wallet credit notification for laboratory
      try {
        const { createWalletNotification } = require('../../services/notificationService');
        const labData = await Laboratory.findById(labId).select('labName email');
        await createWalletNotification({
          userId: labId,
          userType: 'laboratory',
          amount: labEarning,
          eventType: 'payment_received',
          sendEmail: true,
          user: labData,
        }).catch((error) => console.error('Error creating laboratory payment credit notification:', error));
      } catch (error) {
        console.error('Error creating laboratory wallet credit notification:', error);
      }

      // Emit real-time event to lab
      try {
        io.to(`laboratory-${labId}`).emit('wallet:credited', {
          amount: labEarning,
          balance: newBalance,
          requestId: request._id,
          commission,
          commissionRate,
          labTotal,
        });
        io.to(`laboratory-${labId}`).emit('request:assigned', {
          request: await Request.findById(request._id)
            .populate('patientId', 'firstName lastName phone address'),
        });
      } catch (error) {
        console.error('Socket.IO error:', error);
      }
    }
  }

  // Don't create orders yet - orders will be created after pharmacy/lab actions on requests
  // Requests are already visible to pharmacy/lab via their request endpoints

  // Create transaction record for patient
  const Transaction = require('../../models/Transaction');
  const totalAmount = request.adminResponse.totalAmount || 0;

  const patientTransaction = await Transaction.create({
    userId: id,
    userType: 'patient',
    type: 'payment',
    amount: totalAmount,
    status: 'completed',
    description: `Payment for ${request.type === 'order_medicine' ? 'medicine order' : 'test booking'}`,
    referenceId: request._id.toString(),
    category: request.type === 'order_medicine' ? 'medicine' : 'test',
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: paymentId || null,
    metadata: {
      requestId: request._id.toString(),
      orderId: req.body.orderId || null,
      razorpayPaymentId: paymentId || null,
    },
  });

  // Don't create orders immediately - orders will be created when pharmacy/lab accepts the request
  // This follows the same flow as labs: request goes to provider's request order section first
  const ordersCreated = []

  // Only create lab orders immediately for lab visits, not home collection
  // For home collection and pharmacy orders, they will be created when provider accepts the request
  if (request.visitType === 'lab') {
    const labGroups = {}
    labTests.forEach((test) => {
      const labId = test.labId
      if (!labId) return
      if (!labGroups[labId]) {
        labGroups[labId] = []
      }
      labGroups[labId].push(test)
    })
    for (const [labId, tests] of Object.entries(labGroups)) {
      const items = tests.map(test => ({
        name: test.test?.name || test.name || test.testName || 'Investigation',
        quantity: test.quantity || 1,
        price: test.price || test.test?.price || 0,
        total: (test.price || test.test?.price || 0) * (test.quantity || 1),
      }))
      const totalAmount = items.reduce((s, item) => s + (item.total || 0), 0)
      
      // Create order for lab visit (not home collection)
      if (!mongoose.Types.ObjectId.isValid(labId)) continue
      const labObjectId = new mongoose.Types.ObjectId(labId)
      const existing = await Order.findOne({
        requestId: request._id,
        providerId: labObjectId,
        providerType: 'laboratory',
      })
      if (!existing) {
        const newOrder = await Order.create({
          patientId: request.patientId,
          providerId: labObjectId,
          providerType: 'laboratory',
          requestId: request._id,
          items,
          totalAmount,
          status: 'pending',
          paymentStatus: 'paid',
          paymentMethod: paymentMethod || 'razorpay',
          paymentId: paymentId || null,
        })
        ordersCreated.push(newOrder._id)
    }
  }
  }

  // Note: Pharmacy orders will be created when pharmacy accepts the request via confirmRequestOrder endpoint
  // This ensures requests appear in pharmacy's request order section first (same flow as labs)

  if (ordersCreated.length > 0) {
    request.orders = Array.from(new Set([...(request.orders || []), ...ordersCreated]))
    await request.save()
  }

  // Create admin transactions (payment received + commission earned)
  // Fetch an admin to associate the transaction with
  const Admin = require('../../models/Admin');
  const admin = await Admin.findOne();
  // If no admin found, we still need a valid ObjectId for the required userId field
  const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

  // Calculate total commission from all providers
  const totalCommission = totalPharmacyCommission + totalLabCommission;

  // Create admin transaction for full payment received (for revenue tracking)
  await Transaction.create({
    userId: adminId,
    userType: 'admin',
    type: 'payment',
    amount: totalAmount,
    status: 'completed',
    description: `Payment received from patient for ${request.type === 'order_medicine' ? 'medicine order' : 'test booking'} - Request ${request._id}`,
    referenceId: request._id.toString(),
    category: request.type === 'order_medicine' ? 'medicine' : 'test',
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: paymentId || null,
    metadata: {
      patientId: id,
      requestId: request._id.toString(),
      orderId: req.body.orderId || null,
      razorpayPaymentId: paymentId || null,
      totalAmount: totalAmount,
      totalCommission: totalCommission,
      pharmacyCommission: totalPharmacyCommission,
      labCommission: totalLabCommission,
    },
  });

  // Create admin commission transaction (if commission exists)
  if (totalCommission > 0) {
    // Get admin's current wallet balance
    const latestAdminTransaction = await WalletTransaction.findOne({
      userId: adminId,
      userType: 'admin',
      status: 'completed',
    }).sort({ createdAt: -1 });

    const adminCurrentBalance = latestAdminTransaction?.balance || 0;
    const adminNewBalance = adminCurrentBalance + totalCommission;

    // Create wallet transaction for admin commission
    await WalletTransaction.create({
      userId: adminId,
      userType: 'admin',
      type: 'commission',
      amount: totalCommission,
      balance: adminNewBalance,
      status: 'completed',
      description: `Commission earned from ${request.type === 'order_medicine' ? 'pharmacy order' : 'lab booking'} - Request ${request._id} (Pharmacy: ₹${totalPharmacyCommission.toFixed(2)}, Lab: ₹${totalLabCommission.toFixed(2)})`,
      referenceId: request._id.toString(),
      requestId: request._id,
      metadata: {
        totalCommission,
        pharmacyCommission: totalPharmacyCommission,
        labCommission: totalLabCommission,
        totalAmount: totalAmount,
        patientId: id,
      },
    });

    // Emit real-time event to admins
    try {
      io.to('admins').emit('wallet:commission:credited', {
        amount: totalCommission,
        balance: adminNewBalance,
        requestId: request._id,
        pharmacyCommission: totalPharmacyCommission,
        labCommission: totalLabCommission,
      });
    } catch (error) {
      console.error('Socket.IO error for admin commission:', error);
    }
  }

  // Create in-app notifications
  try {
    const { createRequestNotification, createAdminNotification, sendNotificationEmail } = require('../../services/notificationService');
    const populatedRequest = await Request.findById(request._id)
      .populate('patientId', 'firstName lastName phone email');

    // Notify patient
    await createRequestNotification({
      userId: id,
      userType: 'patient',
      request: populatedRequest,
      eventType: 'confirmed',
    }).catch((error) => console.error('Error creating patient request confirmation notification:', error));

    // Notify all admins
    const Admin = require('../../models/Admin');
    const admins = await Admin.find({});
    for (const admin of admins) {
      await createAdminNotification({
        userId: admin._id,
        userType: 'admin',
        eventType: 'request_confirmed',
        data: {
          requestId: request._id,
          patientId: id,
          amount: totalAmount,
        },
      }).catch((error) => console.error('Error creating admin notification:', error));

      await createAdminNotification({
        userId: admin._id,
        userType: 'admin',
        eventType: 'payment_received',
        data: {
          amount: totalAmount,
          requestId: request._id,
          patientId: id,
        },
      }).catch((error) => console.error('Error creating admin payment notification:', error));
    }

    // Notify pharmacies assigned to this request when payment is confirmed
    if (request.adminResponse?.pharmacies && request.adminResponse.pharmacies.length > 0) {
      for (const pharmId of request.adminResponse.pharmacies) {
        try {
          const pharmacy = await Pharmacy.findById(pharmId).select('pharmacyName email');
          if (pharmacy) {
            const patientName = patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.firstName || 'Patient';
            
            // Create in-app notification
            await createRequestNotification({
              userId: pharmId,
              userType: 'pharmacy',
              request: populatedRequest,
              eventType: 'payment_received',
              patient,
              pharmacy,
            }).catch((error) => console.error('Error creating pharmacy payment notification:', error));
            
            // Send email notification
            await sendNotificationEmail({
              userId: pharmId,
              userType: 'pharmacy',
              title: 'Payment Received - New Order',
              message: `Payment of ₹${totalAmount} received from ${patientName} for order request (Request ID: ${request._id}). Please check your request orders.`,
              user: pharmacy,
            }).catch((error) => console.error('Error sending pharmacy payment email:', error));
          }
        } catch (error) {
          console.error(`Error notifying pharmacy ${pharmId}:`, error);
        }
      }
    }

    // Notify laboratories assigned to this request when payment is confirmed
    if (request.adminResponse?.labs && request.adminResponse.labs.length > 0) {
      for (const labId of request.adminResponse.labs) {
        try {
          const laboratory = await Laboratory.findById(labId).select('labName email');
          if (laboratory) {
            const patientName = patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.firstName || 'Patient';
            
            // Create in-app notification
            await createRequestNotification({
              userId: labId,
              userType: 'laboratory',
              request: populatedRequest,
              eventType: 'payment_received',
              patient,
              laboratory,
            }).catch((error) => console.error('Error creating laboratory payment notification:', error));
            
            // Send email notification
            await sendNotificationEmail({
              userId: labId,
              userType: 'laboratory',
              title: 'Payment Received - New Test Booking',
              message: `Payment of ₹${totalAmount} received from ${patientName} for test booking request (Request ID: ${request._id}). Please check your request orders.`,
              user: laboratory,
            }).catch((error) => console.error('Error sending laboratory payment email:', error));
          }
        } catch (error) {
          console.error(`Error notifying laboratory ${labId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }

  // Emit real-time event
  try {
    io.to('admins').emit('request:confirmed', {
      request: await Request.findById(request._id),
    });
    io.to('admins').emit('admin:payment:received', {
      type: request.type === 'order_medicine' ? 'medicine' : 'test',
      amount: totalAmount,
      requestId: request._id,
      patientId: id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  // Send payment confirmation email
  try {
    const { sendPaymentConfirmationEmail } = require('../../services/notificationService');
    await sendPaymentConfirmationEmail({
      patient,
      amount: totalAmount, // Pass amount directly
      orderId: orders.length > 0 ? (orders[0]._id || orders[0].id) : null, // Pass orderId for reference
      transaction: patientTransaction, // Also pass transaction for additional data
      order: orders.length > 0 ? orders[0] : null,
    }).catch((error) => console.error('Error sending payment confirmation email:', error));
  } catch (error) {
    console.error('Error sending email notifications:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Payment confirmed. Requests have been sent to pharmacies and laboratories.',
    data: {
      request,
    },
  });
});

// DELETE /api/patients/requests/:id
exports.cancelRequest = asyncHandler(async (req, res) => {
  const { id } = req.auth;
  const requestId = req.params.id; // Route parameter is :id

  const request = await Request.findOne({
    _id: requestId,
    patientId: id,
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found',
    });
  }

  if (request.status === 'completed' || request.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Request already completed or cancelled',
    });
  }

  request.status = 'cancelled';
  await request.save();

  // Emit real-time event
  try {
    const io = getIO();
    io.to('admins').emit('request:cancelled', {
      requestId: request._id,
    });
  } catch (error) {
    console.error('Socket.IO error:', error);
  }

  return res.status(200).json({
    success: true,
    message: 'Request cancelled successfully',
  });
});

