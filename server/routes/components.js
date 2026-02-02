const express = require('express');
const Component = require('../models/Component');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/components - Get all components (public with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, stockStatus, supplierID } = req.query;

    // Build query object
    const query = {};
    if (category) {
      query.category = category;
    }
    if (stockStatus !== undefined) {
      query.stockStatus = stockStatus === 'true';
    }
    if (supplierID) {
      query.supplierID = supplierID;
    }

    const components = await Component.find(query).populate('supplierID', 'name email').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: components.length,
      data: components,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/components/:id - Get single component
router.get('/:id', async (req, res) => {
  try {
    const component = await Component.findById(req.params.id).populate('supplierID', 'name email');

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.json({
      success: true,
      data: component,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/components - Create component (Admin/Supplier only)
router.post('/', protect, authorize('admin', 'supplier'), async (req, res) => {
  try {
    const { name, category, price, specifications, compatibility, url, stockStatus } = req.body;

    // Validation
    if (!name || !category || price === undefined || !specifications) {
      return res.status(400).json({ message: 'Please provide name, category, price, and specifications' });
    }

    // Set supplierID if user is supplier
    const supplierID = req.user.role === 'supplier' ? req.user._id : req.body.supplierID || null;

    const component = await Component.create({
      name,
      category,
      price,
      specifications,
      compatibility: compatibility || '',
      url: url || '',
      stockStatus: stockStatus !== undefined ? stockStatus : true,
      supplierID,
    });

    const populatedComponent = await Component.findById(component._id).populate('supplierID', 'name email');

    res.status(201).json({
      success: true,
      data: populatedComponent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/components/:id - Update component (Admin/Supplier)
router.put('/:id', protect, authorize('admin', 'supplier'), async (req, res) => {
  try {
    let component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Suppliers can update any component (they manage the inventory)
    // If updating and component has no supplier, assign it to the current supplier
    if (req.user.role === 'supplier') {
      // Always set supplierID to current supplier when they update
      component.supplierID = req.user._id;
    }

    // Update fields
    const { name, category, price, specifications, compatibility, url, stockStatus } = req.body;

    if (name) component.name = name;
    if (category) component.category = category;
    if (price !== undefined) component.price = price;
    if (specifications) component.specifications = specifications;
    if (compatibility !== undefined) component.compatibility = compatibility;
    if (url !== undefined) component.url = url;
    if (stockStatus !== undefined) component.stockStatus = stockStatus;

    // Admin can change supplierID
    if (req.user.role === 'admin' && req.body.supplierID !== undefined) {
      component.supplierID = req.body.supplierID || null;
    }

    await component.save();

    const populatedComponent = await Component.findById(component._id).populate('supplierID', 'name email');

    res.json({
      success: true,
      data: populatedComponent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/components/:id - Delete component (Admin/Supplier - suppliers can only delete their own)
router.delete('/:id', protect, authorize('admin', 'supplier'), async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Suppliers can delete any component (they manage the inventory)

    await Component.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Component deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
