const express = require('express');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories - Get all active categories (public, but suppliers need auth for read-only)
router.get('/', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const query = {};
    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/categories - Create category (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const categoryExists = await Category.findOne({ 
      name: name.trim().toUpperCase() 
    });
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim().toUpperCase(),
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, description, isActive } = req.body;

    if (name && name.trim()) {
      // Check if new name conflicts with existing category
      const existingCategory = await Category.findOne({ 
        name: name.trim().toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      
      category.name = name.trim().toUpperCase();
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is being used by any components
    const Component = require('../models/Component');
    const componentsUsingCategory = await Component.countDocuments({ 
      category: category.name 
    });

    if (componentsUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It is being used by ${componentsUsingCategory} component(s). Please remove or reassign those components first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
