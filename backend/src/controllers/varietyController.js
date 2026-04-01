// backend/src/controllers/varietyController.js - NEW FILE
import ProductVariety from '../models/ProductVariety.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';


/**
 * @desc    Get varieties by product type (with per-supplier used-variety filtering)
 * @route   GET /api/varieties?productType=:id&status=approved
 * @access  Public (suppplier gets filtered list, guests get all)
 */
export const getVarieties = async (req, res) => {
  try {
    const { productType, status = 'approved' } = req.query;

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: 'Product type ID is required',
      });
    }

    const query = { productType, isActive: true };
    if (status) query.approvalStatus = status;

    const allVarieties = await ProductVariety.find(query)
      .populate('productType', 'name')
      .populate('suggestedBy', 'name businessDetails.businessName')
      .sort('displayOrder name');

    // ✅ If no authenticated user (public/guest), return all varieties
    const sellerId = req.user?._id;
    if (!sellerId) {
      return res.status(200).json({
        success: true,
        count: allVarieties.length,
        data: allVarieties,
        varieties: allVarieties,
        usedVarieties: [],
        totalAvailable: allVarieties.length,
      });
    }

    // ✅ Find all products this supplier already has for this type
    const usedProducts = await Product.find({
      seller: sellerId,
      'category.type': productType,
      approvalStatus: { $in: ['approved', 'pending'] },
    }).select('category.variety name');

    const usedVarietyIds = usedProducts
      .map(p => p.category?.variety?.toString())
      .filter(Boolean);

    // ✅ Split into available and already-used
    const availableVarieties = allVarieties.filter(
      v => !usedVarietyIds.includes(v._id.toString())
    );
    const usedVarieties = allVarieties.filter(
      v => usedVarietyIds.includes(v._id.toString())
    );

    return res.status(200).json({
      success: true,
      count: availableVarieties.length,
      data: availableVarieties,          // backward-compat: old code reads .data
      varieties: availableVarieties,     // new: unused varieties for dropdown
      usedVarieties: usedVarieties,      // new: already-listed varieties
      totalAvailable: availableVarieties.length,
    });
  } catch (error) {
    console.error('Get varieties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching varieties',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single variety by ID
 * @route   GET /api/varieties/:id
 * @access  Public
 */
export const getVarietyById = async (req, res) => {
  try {
    const variety = await ProductVariety.findById(req.params.id)
      .populate('productType', 'name')
      .populate('categoryHierarchy.main', 'name')
      .populate('categoryHierarchy.sub', 'name')
      .populate('categoryHierarchy.type', 'name')
      .populate('suggestedBy', 'name email businessDetails.businessName');

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Variety not found',
      });
    }

    res.status(200).json({
      success: true,
      data: variety,
    });
  } catch (error) {
    console.error('Get variety error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variety',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new variety (suggestion)
 * @route   POST /api/varieties
 * @access  Private (Supplier/Retailer)
 */
export const createVariety = async (req, res) => {
  try {
    const { name, description, productType, categoryHierarchy } = req.body;

    // 1. Check for existing approved or pending version to avoid spam
    const existing = await ProductVariety.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      productType,
      approvalStatus: { $in: ['approved', 'pending'] }
    });

    if (existing) {
      const statusMsg = existing.approvalStatus === 'approved'
        ? 'already exists'
        : 'is already awaiting approval';
      return res.status(400).json({ success: false, message: `Variety "${name}" ${statusMsg}.` });
    }

    // 2. Create the suggestion
    const variety = await ProductVariety.create({
      name,
      description,
      productType,
      categoryHierarchy,
      suggestedBy: req.user._id,
      approvalStatus: 'pending'
    });

    // 3. Notify Admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        user: admin._id,
        type: 'variety_approval_needed',
        title: 'New Variety Suggestion',
        message: `${req.user.name} suggested: ${name}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Variety suggestion submitted for admin approval.',
      data: variety,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve/Reject variety (Admin only)
 * @route   PUT /api/varieties/:id/:action (action = approve or reject)
 */
export const moderateVariety = async (req, res) => {
  try {
    const { action } = req.params;
    const { reason } = req.body;
    const variety = await ProductVariety.findById(req.params.id);

    if (!variety) return res.status(404).json({ success: false, message: 'Variety not found' });

    if (action === 'approve') {
      variety.approvalStatus = 'approved';
      variety.approvedBy = req.user._id;
      variety.approvedAt = new Date();
    } else {
      if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason required' });
      variety.approvalStatus = 'rejected';
      variety.rejectionReason = reason;
      variety.isActive = false;
    }

    await variety.save();

    // Notify Supplier
    await Notification.create({
      user: variety.suggestedBy,
      type: action === 'approve' ? 'variety_approved' : 'variety_rejected',
      title: `Variety ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: action === 'approve'
        ? `Your variety "${variety.name}" is now live!`
        : `Your variety "${variety.name}" was rejected. Reason: ${reason}`,
    });

    res.status(200).json({ success: true, message: `Variety ${action}d successfuly` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve variety (Admin only)
 * @route   PUT /api/varieties/:id/approve
 * @access  Private (Admin only)
 */
export const approveVariety = async (req, res) => {
  try {
    const variety = await ProductVariety.findById(req.params.id);

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Variety not found',
      });
    }

    if (variety.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Variety is already approved',
      });
    }

    variety.approvalStatus = 'approved';
    variety.approvedBy = req.user._id;
    variety.approvedAt = new Date();
    variety.rejectionReason = undefined;
    await variety.save();

    // Notify the supplier who suggested it
    await Notification.create({
      user: variety.suggestedBy,
      type: 'variety_approved',
      title: 'Variety Approved',
      message: `Your variety suggestion "${variety.name}" has been approved! It's now available for all suppliers.`,
      priority: 'high',
    });

    res.status(200).json({
      success: true,
      message: 'Variety approved successfully',
      data: variety,
    });
  } catch (error) {
    console.error('Approve variety error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving variety',
      error: error.message,
    });
  }
};

/**
 * @desc    Reject variety (Admin only)
 * @route   PUT /api/varieties/:id/reject
 * @access  Private (Admin only)
 */
export const rejectVariety = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const variety = await ProductVariety.findById(req.params.id);

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Variety not found',
      });
    }

    variety.approvalStatus = 'rejected';
    variety.rejectionReason = reason;
    variety.isActive = false;
    await variety.save();

    // Notify the supplier
    await Notification.create({
      user: variety.suggestedBy,
      type: 'variety_rejected',
      title: 'Variety Rejected',
      message: `Your variety suggestion "${variety.name}" was rejected. Reason: ${reason}`,
      priority: 'medium',
    });

    res.status(200).json({
      success: true,
      message: 'Variety rejected',
      data: variety,
    });
  } catch (error) {
    console.error('Reject variety error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting variety',
      error: error.message,
    });
  }
};

/**
 * @desc    Get pending variety suggestions (Admin only)
 * @route   GET /api/varieties/pending
 * @access  Private (Admin only)
 */
export const getPendingVarieties = async (req, res) => {
  try {
    const pendingVarieties = await ProductVariety.find({
      approvalStatus: 'pending',
      isActive: true,
    })
      .populate('productType', 'name')
      .populate('categoryHierarchy.main', 'name')
      .populate('categoryHierarchy.sub', 'name')
      .populate('categoryHierarchy.type', 'name')
      .populate('suggestedBy', 'name email businessDetails.businessName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: pendingVarieties.length,
      data: pendingVarieties,
    });
  } catch (error) {
    console.error('Get pending varieties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending varieties',
      error: error.message,
    });
  }
};

// Helper function to get admin user ID
async function getAdminUserId() {
  const User = (await import('../models/User.js')).default;
  const admin = await User.findOne({ role: 'admin' });
  return admin?._id;
}

export default {
  getVarieties,
  getVarietyById,
  createVariety,
  approveVariety,
  rejectVariety,
  getPendingVarieties,
};