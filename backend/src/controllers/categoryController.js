// backend/src/controllers/categoryController.js - UPDATED FOR HIERARCHICAL CATEGORIES
import Category from '../models/Category.js';

/**
 * @desc    Get all categories with hierarchical filters
 * @route   GET /api/categories?level=main&parent=xxxxx
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    const { level, parent, categoryType, isActive } = req.query;

    const query = {};
    
    // ✅ Filter by level (main, sub, type)
    if (level) {
      query.level = level;
    }
    
    // ✅ Filter by parent (for getting subcategories)
    if (parent) {
      query.parent = parent;
    }
    
    // Filter by category type
    if (categoryType) {
      query.categoryType = categoryType;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .populate('parent', 'name level')
      .sort('displayOrder');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

/**
 * @desc    Get category tree (main -> sub -> type)
 * @route   GET /api/categories/tree
 * @access  Public
 */
export const getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getCategoryTree();
    
    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error.message
    });
  }
};

/**
 * @desc    Get subcategories by parent ID
 * @route   GET /api/categories/subcategories/:parentId
 * @access  Public
 */
export const getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const subcategories = await Category.find({ 
      parent: parentId, 
      isActive: true 
    }).sort('displayOrder');

    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name level categoryType');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get children if any
    const children = await Category.find({ parent: category._id, isActive: true })
      .sort('displayOrder');

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        children
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private (Admin only)
 */
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin only)
 */
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin only)
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const hasChildren = await Category.countDocuments({ parent: category._id });
    if (hasChildren > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.'
      });
    }

    // Soft delete - just mark as inactive
    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

export default {
  getCategories,
  getCategoryTree,
  getSubcategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};