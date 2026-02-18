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

    // Calculate new payment distribution
    const adminCommission = Math.round((amount * 0.03 + Number.EPSILON) * 100) / 100; // 3%
    const assemblerCommission = Math.round((amount * 0.07 + Number.EPSILON) * 100) / 100; // 7%
    const escrowAmount = Math.round((amount * 0.90 + Number.EPSILON) * 100) / 100; // 90%

    // Update build payment info
    build.payment = build.payment || {};
    build.payment.status = 'paid';
    build.payment.totalAmount = amount;
    build.payment.paidAmount = amount;
    build.payment.currency = 'USD';
    build.payment.adminCommission = adminCommission;
    build.payment.assemblerCommission = assemblerCommission;
    build.payment.escrowAmount = escrowAmount;
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

    await build.save();

    // Create transaction: user -> admin (full payment)
    const paymentTx = await createTransaction({
      type: 'payment',
      buildId: build._id,
      from: 'user',
      to: 'admin',
      amount,
      currency: 'USD',
      meta: { paymentId },
    });

    // Immediately pay assembler commission (7%)
    if (build.assemblerID) {
      const assemblerTx = await createTransaction({
        type: 'payout',
        buildId: build._id,
        from: 'admin',
        to: 'assembler',
        amount: assemblerCommission,
        currency: 'USD',
        meta: { assemblerID: build.assemblerID.toString(), kind: 'commission' },
      });

      build.payment.assemblerCommissionPaid = true;
      build.payment.assemblerCommissionPaidAt = new Date();
      build.payment.assemblerCommissionTxId = assemblerTx.txId;
      await build.save();
    }

    res.json({
      success: true,
      message: 'Payment successful (simulated). Admin commission: 3%, Assembler commission: 7%, Escrow: 90%',
      data: build,
      transaction: paymentTx,
      distribution: {
        adminCommission,
        assemblerCommission,
        escrowAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds/:id/distribute-suppliers - Admin distributes escrow to suppliers proportionally (only when completed)
router.post('/:id/distribute-suppliers', protect, authorize('admin'), async (req, res) => {
  try {
    const build = await Build.findById(req.params.id).populate('components.componentID');
    if (!build) return res.status(404).json({ message: 'Build not found' });

    if (!build.payment || build.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Build not paid yet' });
    }

    if (build.assemblyStatus !== 'Completed') {
      return res.status(400).json({ message: 'Build must be completed before distributing to suppliers' });
    }

    if (build.payment.escrowDistributed) {
      return res.status(400).json({ message: 'Supplier payouts already distributed' });
    }

    const Component = require('../models/Component');
    const escrowAmount = Number(build.payment.escrowAmount) || 0;
    const totalComponentPrice = build.components.reduce((sum, comp) => sum + Number(comp.price || 0), 0);

    console.log(`[Manual Distribution] Build ${build._id}: escrowAmount=${escrowAmount}, totalComponentPrice=${totalComponentPrice}`);

    if (totalComponentPrice === 0) {
      return res.status(400).json({ message: 'No components in build or total price is zero' });
    }

    if (escrowAmount === 0) {
      return res.status(400).json({ message: 'Escrow amount is zero. Build may not be paid or escrow already distributed.' });
    }

    // Calculate proportional payouts for each supplier
    const supplierPayouts = [];
    const supplierMap = new Map(); // supplierID -> { amount, components }
    let componentsWithoutSuppliers = 0;

    // Populate component supplierIDs
    for (const buildComp of build.components) {
      const component = await Component.findById(buildComp.componentID);
      if (!component) {
        console.warn(`[Manual Distribution] Component ${buildComp.componentID} not found`);
        componentsWithoutSuppliers++;
        continue;
      }
      if (!component.supplierID) {
        console.warn(`[Manual Distribution] Component ${buildComp.componentName} (${buildComp.componentID}) has no supplierID`);
        componentsWithoutSuppliers++;
        continue;
      }

      const componentPrice = Number(buildComp.price || 0);
      const supplierId = component.supplierID.toString();
      const componentRatio = componentPrice / totalComponentPrice;
      const supplierAmount = Math.round((escrowAmount * componentRatio + Number.EPSILON) * 100) / 100;

      console.log(`[Manual Distribution] Component: ${buildComp.componentName}, Price: $${componentPrice}, Ratio: ${(componentRatio * 100).toFixed(2)}%, Supplier Amount: $${supplierAmount}`);

      if (supplierMap.has(supplierId)) {
        const existing = supplierMap.get(supplierId);
        existing.amount += supplierAmount;
        existing.components.push({
          componentID: buildComp.componentID,
          componentName: buildComp.componentName,
          price: componentPrice,
        });
      } else {
        supplierMap.set(supplierId, {
          amount: supplierAmount,
          components: [{
            componentID: buildComp.componentID,
            componentName: buildComp.componentName,
            price: componentPrice,
          }],
        });
      }
    }

    if (componentsWithoutSuppliers > 0) {
      console.warn(`[Manual Distribution] ${componentsWithoutSuppliers} components without suppliers were skipped`);
    }

    console.log(`[Manual Distribution] Found ${supplierMap.size} unique suppliers to pay`);

    // Create payouts and transactions
    const transactions = [];
    let totalDistributed = 0;
    for (const [supplierId, data] of supplierMap.entries()) {
      // Validate amount before creating transaction
      if (!data.amount || data.amount <= 0 || isNaN(data.amount)) {
        console.error(`[Manual Distribution] Invalid supplier amount for supplier ${supplierId}: ${data.amount}`);
        continue; // Skip suppliers with invalid amounts
      }

      console.log(`[Manual Distribution] Paying supplier ${supplierId}: $${data.amount} for ${data.components.length} component(s)`);

      const tx = await createTransaction({
        type: 'payout',
        buildId: build._id,
        from: 'admin',
        to: 'supplier',
        amount: data.amount,
        currency: 'USD',
        meta: { supplierID: supplierId, kind: 'escrow_distribution' },
      });

      // Store payout record (using first component as representative)
      supplierPayouts.push({
        supplierID: supplierId,
        amount: data.amount,
        componentID: data.components[0].componentID,
        componentName: data.components[0].componentName,
        paid: true,
        paidAt: new Date(),
        transactionId: tx.txId,
      });

      transactions.push(tx);
      totalDistributed += data.amount;
    }

    console.log(`[Manual Distribution] Total distributed: $${totalDistributed.toFixed(2)} out of $${escrowAmount.toFixed(2)} escrow`);

    if (supplierPayouts.length === 0) {
      return res.status(400).json({ 
        message: 'No valid supplier payouts created. Check if components have supplierIDs assigned.' 
      });
    }

    // Update build
    build.supplierPayouts = supplierPayouts;
    build.payment.escrowDistributed = true;
    build.payment.status = 'settled';
    await build.save();

    res.json({
      success: true,
      message: `Supplier payouts distributed: ${supplierPayouts.length} suppliers paid from escrow`,
      data: build,
      transactions,
      payouts: supplierPayouts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/builds/:id/refund - Admin issues refund (90% escrow only, if build not completed)
router.post('/:id/refund', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ message: 'Build not found' });

    if (!build.payment || build.payment.status !== 'paid') {
      return res.status(400).json({ message: 'Build not paid or already refunded' });
    }

    // If build is completed, refunds are not allowed
    if (build.assemblyStatus === 'Completed') {
      return res.status(400).json({ message: 'Refunds are not allowed for completed builds' });
    }

    // Refund 90% escrow amount (3% admin + 7% assembler commissions are non-refundable)
    const refundAmount = build.payment.escrowAmount || 0;
    if (refundAmount <= 0) {
      return res.status(400).json({ message: 'No escrow amount to refund' });
    }

    // Create refund transaction (admin -> user)
    const tx = await createTransaction({
      type: 'refund',
      buildId: build._id,
      from: 'admin',
      to: 'user',
      amount: refundAmount,
      currency: 'USD',
      meta: { reason, note: '90% escrow refunded. 3% admin + 7% assembler commissions are non-refundable.' },
    });

    // Update build payment records and status
    build.payment.escrowAmount = 0; // Escrow refunded
    build.payment.paidAmount = Math.max(0, (build.payment.paidAmount || 0) - refundAmount);
    build.payment.paymentRecords.push({
      paymentId: tx.txId,
      provider: 'simulated',
      amount: -refundAmount,
      status: 'succeeded',
      method: 'refund',
      meta: { reason, note: 'Escrow refund' },
      createdAt: new Date(),
    });

    // Add refund request record
    build.refundRequests = build.refundRequests || [];
    build.refundRequests.push({
      amount: refundAmount,
      reason: reason || 'Escrow refund (90%)',
      status: 'processed',
      createdAt: new Date(),
      processedBy: req.user._id.toString(),
    });

    // Update overall payment status
    build.payment.status = 'refunded';

    await build.save();

    res.json({
      success: true,
      message: `Refund processed: $${refundAmount} (90% escrow). Admin commission (3%) and assembler commission (7%) are non-refundable.`,
      transaction: tx,
      data: build,
    });
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

    const build = await Build.findById(req.params.id).populate('components.componentID');

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
      
      // If build is paid and assembler commission hasn't been paid yet, pay it now
      if (build.payment && build.payment.status === 'paid' && !build.payment.assemblerCommissionPaid && build.payment.assemblerCommission > 0) {
        const assemblerTx = await createTransaction({
          type: 'payout',
          buildId: build._id,
          from: 'admin',
          to: 'assembler',
          amount: build.payment.assemblerCommission,
          currency: 'USD',
          meta: { assemblerID: req.user._id.toString(), kind: 'commission' },
        });

        build.payment.assemblerCommissionPaid = true;
        build.payment.assemblerCommissionPaidAt = new Date();
        build.payment.assemblerCommissionTxId = assemblerTx.txId;
      }
    }

    const wasCompleted = build.assemblyStatus === 'Completed';
    build.assemblyStatus = status;

    // Auto-trigger supplier distribution when status changes to Completed
    if (status === 'Completed' && !wasCompleted && build.payment && build.payment.status === 'paid' && !build.payment.escrowDistributed) {
      const Component = require('../models/Component');
      const escrowAmount = Number(build.payment.escrowAmount) || 0;
      const totalComponentPrice = build.components.reduce((sum, comp) => sum + Number(comp.price || 0), 0);

      console.log(`[Supplier Distribution] Build ${build._id}: escrowAmount=${escrowAmount}, totalComponentPrice=${totalComponentPrice}`);

      if (totalComponentPrice > 0 && escrowAmount > 0) {
        // Calculate proportional payouts for each supplier
        const supplierPayouts = [];
        const supplierMap = new Map();
        let componentsWithoutSuppliers = 0;

        // Populate component supplierIDs
        for (const buildComp of build.components) {
          const component = await Component.findById(buildComp.componentID);
          if (!component) {
            console.warn(`[Supplier Distribution] Component ${buildComp.componentID} not found`);
            componentsWithoutSuppliers++;
            continue;
          }
          if (!component.supplierID) {
            console.warn(`[Supplier Distribution] Component ${buildComp.componentName} (${buildComp.componentID}) has no supplierID`);
            componentsWithoutSuppliers++;
            continue;
          }

          const componentPrice = Number(buildComp.price || 0);
          const supplierId = component.supplierID.toString();
          const componentRatio = componentPrice / totalComponentPrice;
          const supplierAmount = Math.round((escrowAmount * componentRatio + Number.EPSILON) * 100) / 100;

          console.log(`[Supplier Distribution] Component: ${buildComp.componentName}, Price: $${componentPrice}, Ratio: ${(componentRatio * 100).toFixed(2)}%, Supplier Amount: $${supplierAmount}`);

          if (supplierMap.has(supplierId)) {
            const existing = supplierMap.get(supplierId);
            existing.amount += supplierAmount;
            existing.components.push({
              componentID: buildComp.componentID,
              componentName: buildComp.componentName,
              price: componentPrice,
            });
          } else {
            supplierMap.set(supplierId, {
              amount: supplierAmount,
              components: [{
                componentID: buildComp.componentID,
                componentName: buildComp.componentName,
                price: componentPrice,
              }],
            });
          }
        }

        if (componentsWithoutSuppliers > 0) {
          console.warn(`[Supplier Distribution] ${componentsWithoutSuppliers} components without suppliers were skipped`);
        }

        console.log(`[Supplier Distribution] Found ${supplierMap.size} unique suppliers to pay`);

        // Create payouts and transactions
        let totalDistributed = 0;
        for (const [supplierId, data] of supplierMap.entries()) {
          // Validate amount before creating transaction
          if (!data.amount || data.amount <= 0 || isNaN(data.amount)) {
            console.error(`[Auto Distribution] Invalid supplier amount for supplier ${supplierId}: ${data.amount}`);
            continue; // Skip suppliers with invalid amounts
          }

          console.log(`[Auto Distribution] Paying supplier ${supplierId}: $${data.amount} for ${data.components.length} component(s)`);

          const tx = await createTransaction({
            type: 'payout',
            buildId: build._id,
            from: 'admin',
            to: 'supplier',
            amount: data.amount,
            currency: 'USD',
            meta: { supplierID: supplierId, kind: 'escrow_distribution', auto: true },
          });

          supplierPayouts.push({
            supplierID: supplierId,
            amount: data.amount,
            componentID: data.components[0].componentID,
            componentName: data.components[0].componentName,
            paid: true,
            paidAt: new Date(),
            transactionId: tx.txId,
          });

          totalDistributed += data.amount;
        }

        console.log(`[Auto Distribution] Total distributed: $${totalDistributed.toFixed(2)} out of $${escrowAmount.toFixed(2)} escrow`);

        if (supplierPayouts.length === 0) {
          console.error(`[Auto Distribution] No valid supplier payouts created! Check if components have supplierIDs.`);
          // Don't mark as distributed if no payouts were created
        } else {
          build.supplierPayouts = supplierPayouts;
          build.payment.escrowDistributed = true;
          build.payment.status = 'settled';
        }
      }
    }

    await build.save();

    const populatedBuild = await Build.findById(build._id)
      .populate('userID', 'name email')
      .populate('assemblerID', 'name email')
      .populate('components.componentID');

    res.json({
      success: true,
      data: populatedBuild,
      message: status === 'Completed' && !wasCompleted && build.payment?.escrowDistributed
        ? 'Build completed and supplier payouts distributed automatically'
        : 'Status updated',
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

    // If build is paid and assembler commission hasn't been paid yet, pay it now
    if (build.payment && build.payment.status === 'paid' && !build.payment.assemblerCommissionPaid && build.payment.assemblerCommission > 0) {
      const assemblerTx = await createTransaction({
        type: 'payout',
        buildId: build._id,
        from: 'admin',
        to: 'assembler',
        amount: build.payment.assemblerCommission,
        currency: 'USD',
        meta: { assemblerID: assemblerID.toString(), kind: 'commission' },
      });

      build.payment.assemblerCommissionPaid = true;
      build.payment.assemblerCommissionPaidAt = new Date();
      build.payment.assemblerCommissionTxId = assemblerTx.txId;
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
