const express = require('express');
const Build = require('../models/Build');
const Component = require('../models/Component');
const { protect, authorize } = require('../middleware/auth');
const { checkCompatibility } = require('../utils/compatibilityChecker');

const router = express.Router();

const Transaction = require('../models/Transaction');

// Helper to create transaction record
const createTransaction = async ({ type, buildId, from, to, amount, currency = 'USD', meta = {}, status = 'completed' }) => {
  const tx = await Transaction.create({
    type,
    buildId,
    from,
    to,
    amount,
    currency,
    status,
    meta,
    txId: `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  });
  return tx;
};

// GET /api/builds - Get builds (role-based)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Users see only their own builds
    if (req.user.role === 'user') {
      query.userID = req.user._id;
    }
    // Assemblers see only assigned builds
    else if (req.user.role === 'assembler') {
      query.assemblerID = req.user._id;
    }
    // Admin sees all builds
    // (no query filter for admin)

    // Optional status filter
    if (req.query.status) {
      query.assemblyStatus = req.query.status;
    }

    const builds = await Build.find(query)
      .populate('userID', 'name email')
      .populate('assemblerID', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: builds.length,
      data: builds,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/builds/:id - Get single build
router.get('/:id', protect, async (req, res) => {
  try {
    const build = await Build.findById(req.params.id)
      .populate('userID', 'name email')
      .populate('assemblerID', 'name email')
      .populate('components.componentID');

    if (!build) {
      return res.status(404).json({ message: 'Build not found' });
    }

    // Check access permissions
    if (
      req.user.role === 'user' &&
      build.userID._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (
      req.user.role === 'assembler' &&
      (!build.assemblerID || build.assemblerID._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: build,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds - Create PC build (User only)
router.post('/', protect, authorize('user'), async (req, res) => {
  try {
    const { componentIDs } = req.body;

    if (!componentIDs || !Array.isArray(componentIDs) || componentIDs.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of component IDs' });
    }

    // Fetch all components
    const components = await Component.find({
      _id: { $in: componentIDs },
      stockStatus: true,
    });

    if (components.length !== componentIDs.length) {
      return res.status(400).json({ message: 'One or more components not found or out of stock' });
    }

    // Build component array for build
    const buildComponents = components.map((comp) => ({
      componentID: comp._id,
      componentName: comp.name,
      category: comp.category,
      price: comp.price,
      specifications: comp.specifications,
      compatibility: comp.compatibility,
    }));

    // Calculate total price
    const totalPrice = buildComponents.reduce((sum, comp) => sum + comp.price, 0);

    // Check compatibility
    const compatibilityResult = checkCompatibility(buildComponents);

    // Create build
    const build = await Build.create({
      userID: req.user._id,
      components: buildComponents.map(({ componentID, componentName, category, price }) => ({
        componentID,
        componentName,
        category,
        price,
      })),
      totalPrice,
      compatibilityCheck: compatibilityResult,
      isCompatible: compatibilityResult.isCompatible,
      assemblyStatus: 'Pending',
    });

    const populatedBuild = await Build.findById(build._id)
      .populate('userID', 'name email')
      .populate('components.componentID');

    res.status(201).json({
      success: true,
      data: populatedBuild,
      compatibility: compatibilityResult,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds/:id/pay - Simulated payment for a build (User)
router.post('/:id/pay', protect, authorize('user'), async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: 'Build not found' });

    // Only owner can pay
    if (build.userID.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay for your own build' });
    }

    // If already paid
    if (build.payment && build.payment.status === 'paid') {
      return res.json({ success: true, message: 'Build already paid', data: build });
    }

    // Simulate payment capture
    const amount = build.totalPrice || 0;
    const paymentId = `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Update build payment info
    build.payment = build.payment || {};
    build.payment.status = 'paid';
    build.payment.totalAmount = amount;
    build.payment.paidAmount = amount;
    build.payment.currency = 'USD';
    build.payment.paymentRecords = build.payment.paymentRecords || [];
    build.payment.paymentRecords.push({
      paymentId,
      provider: 'simulated',
      amount,
      status: 'succeeded',
      method: req.body.method || 'card-sim',
      meta: req.body.meta || {},
      createdAt: new Date(),
    });

    // Calculate assembler payout (10%)
    const payoutAmount = Math.round((amount * 0.1 + Number.EPSILON) * 100) / 100;
    build.assemblerPayout = build.assemblerPayout || {};
    build.assemblerPayout.amount = payoutAmount;
    build.assemblerPayout.paid = false;

    await build.save();

    // Create transaction: user -> admin
    const tx = await createTransaction({
      type: 'payment',
      buildId: build._id,
      from: 'user',
      to: 'admin',
      amount,
      currency: 'USD',
      meta: { paymentId },
    });

    res.json({
      success: true,
      message: 'Payment successful (simulated)',
      data: build,
      transaction: tx,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds/:id/forward - Admin forwards assembler payout (10%)
router.post('/:id/forward', protect, authorize('admin'), async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: 'Build not found' });

    if (!build.payment || build.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Build not paid yet' });
    }

    if (!build.assemblerID) {
      return res.status(400).json({ message: 'Build not assigned to an assembler' });
    }

    if (build.assemblerPayout && build.assemblerPayout.paid) {
      return res.status(400).json({ message: 'Payout already forwarded' });
    }

    const payoutAmount = (build.assemblerPayout && build.assemblerPayout.amount) || Math.round((build.totalPrice * 0.1 + Number.EPSILON) * 100) / 100;

    // Simulate payout
    const tx = await createTransaction({
      type: 'payout',
      buildId: build._id,
      from: 'admin',
      to: 'assembler',
      amount: payoutAmount,
      currency: 'USD',
      meta: { assemblerID: build.assemblerID.toString() },
    });

    build.assemblerPayout = build.assemblerPayout || {};
    build.assemblerPayout.paid = true;
    build.assemblerPayout.paidAt = new Date();
    build.assemblerPayout.transactionId = tx.txId;
    build.payment.escrowReleased = true;

    await build.save();

    res.json({ success: true, message: 'Payout forwarded to assembler (simulated)', transaction: tx, data: build });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds/:id/release-final - Admin releases remaining 90% to assembler
router.post('/:id/release-final', protect, authorize('admin'), async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: 'Build not found' });

    if (!build.payment || build.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Build not paid yet' });
    }

    if (!build.assemblerID) {
      return res.status(400).json({ message: 'Build not assigned to an assembler' });
    }

    if (!build.assemblerPayout || !build.assemblerPayout.paid) {
      return res.status(400).json({ message: 'Advance payout not forwarded yet' });
    }

    if (build.assemblerPayout.finalPaid) {
      return res.status(400).json({ message: 'Final payout already forwarded' });
    }

    if (build.assemblyStatus !== 'Completed') {
      return res.status(400).json({ message: 'Build is not completed yet' });
    }

    const total = Number(build.totalPrice || 0);
    const advance = Number(build.assemblerPayout.amount || 0);
    const finalAmount = Math.round(((total - advance) + Number.EPSILON) * 100) / 100;

    const tx = await createTransaction({
      type: 'payout',
      buildId: build._id,
      from: 'admin',
      to: 'assembler',
      amount: finalAmount,
      currency: 'USD',
      meta: { assemblerID: build.assemblerID.toString(), kind: 'final' },
    });

    build.assemblerPayout.finalPaid = true;
    build.assemblerPayout.finalPaidAt = new Date();
    build.assemblerPayout.finalTransactionId = tx.txId;
    // Mark payment settled
    build.payment.status = 'settled';

    await build.save();

    res.json({ success: true, message: 'Final payout released (simulated)', transaction: tx, data: build });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds/:id/refund - Admin issues refund (full or partial)
router.post('/:id/refund', protect, authorize('admin'), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: 'Build not found' });

    if (!build.payment || build.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Build not paid or already refunded' });
    }

    const refundAmount = Number(amount || build.payment.paidAmount || 0);
    if (refundAmount <= 0) {
      return res.status(400).json({ message: 'Invalid refund amount' });
    }

    // Create refund transaction (admin -> user)
    const tx = await createTransaction({
      type: 'refund',
      buildId: build._id,
      from: 'admin',
      to: 'user',
      amount: refundAmount,
      currency: 'USD',
      meta: { reason },
    });

    // Update build payment records and status
    build.payment.paidAmount = Math.max(0, (build.payment.paidAmount || 0) - refundAmount);
    build.payment.paymentRecords.push({
      paymentId: tx.txId,
      provider: 'simulated',
      amount: -refundAmount,
      status: 'succeeded',
      method: 'refund',
      meta: { reason },
      createdAt: new Date(),
    });

    // Add refund request record
    build.refundRequests = build.refundRequests || [];
    build.refundRequests.push({
      amount: refundAmount,
      reason: reason || '',
      status: 'processed',
      createdAt: new Date(),
      processedBy: req.user._id.toString(),
    });

    // Update overall payment status
    if (build.payment.paidAmount <= 0) {
      build.payment.status = 'refunded';
    } else {
      build.payment.status = 'partial_refund';
    }

    await build.save();

    res.json({ success: true, message: 'Refund processed (simulated)', transaction: tx, data: build });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/builds/:id/status - Update assembly status (Assembler/Admin)
router.put('/:id/status', protect, authorize('assembler', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Assembling', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Pending, Assembling, or Completed' });
    }

    const build = await Build.findById(req.params.id);

    if (!build) {
      return res.status(404).json({ message: 'Build not found' });
    }

    // Assemblers can only update assigned builds
    if (
      req.user.role === 'assembler' &&
      (!build.assemblerID || build.assemblerID.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'You can only update assigned builds' });
    }

    // Auto-assign assembler if status changes to Assembling
    if (status === 'Assembling' && !build.assemblerID) {
      build.assemblerID = req.user._id;
    }

    build.assemblyStatus = status;
    await build.save();

    const populatedBuild = await Build.findById(build._id)
      .populate('userID', 'name email')
      .populate('assemblerID', 'name email')
      .populate('components.componentID');

    res.json({
      success: true,
      data: populatedBuild,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/builds/:id/assign - Assign build to assembler (Admin only)
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { assemblerID } = req.body;

    if (!assemblerID) {
      return res.status(400).json({ message: 'Please provide assemblerID' });
    }

    const build = await Build.findById(req.params.id);

    if (!build) {
      return res.status(404).json({ message: 'Build not found' });
    }

    // Verify assembler exists and has correct role
    const User = require('../models/User');
    const assembler = await User.findById(assemblerID);
    if (!assembler || assembler.role !== 'assembler') {
      return res.status(400).json({ message: 'Invalid assembler ID or user is not an assembler' });
    }

    build.assemblerID = assemblerID;
    if (build.assemblyStatus === 'Pending') {
      build.assemblyStatus = 'Assembling';
    }

    await build.save();

    const populatedBuild = await Build.findById(build._id)
      .populate('userID', 'name email')
      .populate('assemblerID', 'name email')
      .populate('components.componentID');

    res.json({
      success: true,
      data: populatedBuild,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/builds/:id - Delete build (User can delete own, Admin can delete any)
router.delete('/:id', protect, async (req, res) => {
  try {
    const build = await Build.findById(req.params.id);

    if (!build) {
      return res.status(404).json({ message: 'Build not found' });
    }

    // Users can only delete their own builds, Admin can delete any
    if (req.user.role !== 'admin' && build.userID.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own builds' });
    }

    await Build.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Build deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
