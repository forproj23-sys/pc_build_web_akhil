const express = require('express');
const Build = require('../models/Build');
const Component = require('../models/Component');
const { protect, authorize } = require('../middleware/auth');
const { checkCompatibility } = require('../utils/compatibilityChecker');

const router = express.Router();

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
