// backend/src/controllers/admin/userManagementController.js - FIXED FOR RETAILERS ON HOMEPAGE
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import {
  sendSellerApprovalEmail,
  sendSellerRejectionEmail
} from '../../services/emailService.js';

/**
 * @desc    Get all users with pagination and filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const status = req.query.status;
    const search = req.query.search;

    let query = {};

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by status
    if (status) {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'pending') {
        query.isApproved = false;
      }
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * @desc    Get pending user approvals
 * @route   GET /api/admin/users/pending
 * @access  Private (Admin only)
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isApproved: false,
      role: { $in: ['retailer', 'supplier'] }
    })
      .select('name email phone role businessDetails createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
};

/**
 * @desc    Approve user
 * @route   PUT /api/admin/users/:id/approve
 * @access  Private (Admin only)
 */
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    user.isApproved = true;
    user.isActive = true;
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    await user.save();

    // Send approval email
    try {
      await sendSellerApprovalEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    // Send notification
    try {
      await Notification.create({
        user: user._id,
        type: 'account_approved',
        title: 'Account Approved',
        message: 'Your account has been approved. You can now access all features.',
        priority: 'high'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: user
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user',
      error: error.message
    });
  }
};

/**
 * @desc    Reject user
 * @route   PUT /api/admin/users/:id/reject
 * @access  Private (Admin only)
 */
export const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    // Send rejection email
    try {
      await sendSellerRejectionEmail(user.email, user.name, reason);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    // Delete the user after sending email
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User rejected and removed successfully'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user status (active/inactive)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    if (!isActive) {
      user.deactivatedAt = new Date();
    }
    await user.save();

    // Send notification
    try {
      await Notification.create({
        user: user._id,
        type: isActive ? 'account_activated' : 'account_deactivated',
        title: isActive ? 'Account Activated' : 'Account Deactivated',
        message: `Your account has been ${isActive ? 'activated' : 'deactivated'}.`,
        priority: 'medium'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/admin/users/stats
 * @access  Private (Admin only)
 */
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const pendingApprovals = await User.countDocuments({
      isApproved: false,
      role: { $in: ['retailer', 'supplier'] }
    });

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        pendingApprovals,
        roleBreakdown: roleStats,
        monthlyRegistrations
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get pending brand logo approvals
 * @route   GET /api/admin/brands/pending
 * @access  Private (Admin only)
 */
export const getPendingBrandLogos = async (req, res) => {
  try {
    const pendingBrands = await User.find({
      role: { $in: ['supplier', 'retailer'] },  // ✅ Both roles
      'businessDetails.brandLogoStatus': 'pending',
      isApproved: true,
      isActive: true
    })
      .select('name email businessDetails createdAt')
      .sort('-businessDetails.brandLogo.uploadedAt');

    res.status(200).json({
      success: true,
      count: pendingBrands.length,
      data: pendingBrands
    });
  } catch (error) {
    console.error('Get pending brand logos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending brand logos',
      error: error.message
    });
  }
};

/**
 * @desc    Approve brand logo
 * @route   PUT /api/admin/brands/:id/approve
 * @access  Private (Admin only)
 */
export const approveBrandLogo = async (req, res) => {
  try {
    const { showOnHomepage, displayOrder } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Allow both suppliers and retailers
    if (user.role !== 'supplier' && user.role !== 'retailer') {
      return res.status(400).json({
        success: false,
        message: 'Only suppliers and retailers can have brand logos'
      });
    }

    if (!user.businessDetails?.brandLogo?.url) {
      return res.status(400).json({
        success: false,
        message: 'No brand logo uploaded'
      });
    }

    // Update logo status
    user.businessDetails.brandLogoStatus = 'approved';
    user.businessDetails.showOnHomepage = showOnHomepage !== undefined ? showOnHomepage : true;
    user.businessDetails.displayOrder = displayOrder || 0;

    await user.save();

    // Send notification
    try {
      await Notification.create({
        user: user._id,
        type: 'brand_logo_approved',
        title: 'Brand Logo Approved',
        message: 'Your brand logo has been approved and is now visible on the homepage!',
        priority: 'high'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Brand logo approved successfully',
      data: user
    });
  } catch (error) {
    console.error('Approve brand logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving brand logo',
      error: error.message
    });
  }
};

/**
 * @desc    Reject brand logo
 * @route   PUT /api/admin/brands/:id/reject
 * @access  Private (Admin only)
 */
export const rejectBrandLogo = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update logo status
    user.businessDetails.brandLogoStatus = 'rejected';
    user.businessDetails.brandLogoRejectionReason = reason;
    user.businessDetails.showOnHomepage = false;

    await user.save();

    // Send notification
    try {
      await Notification.create({
        user: user._id,
        type: 'brand_logo_rejected',
        title: 'Brand Logo Rejected',
        message: `Your brand logo was rejected. Reason: ${reason}`,
        priority: 'high'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Brand logo rejected',
      data: user
    });
  } catch (error) {
    console.error('Reject brand logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting brand logo',
      error: error.message
    });
  }
};

/**
 * @desc    Update brand display settings
 * @route   PUT /api/admin/brands/:id/display
 * @access  Private (Admin only)
 */
export const updateBrandDisplay = async (req, res) => {
  try {
    const { showOnHomepage, displayOrder } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.businessDetails.brandLogoStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Brand logo must be approved first'
      });
    }

    if (showOnHomepage !== undefined) {
      user.businessDetails.showOnHomepage = showOnHomepage;
    }

    if (displayOrder !== undefined) {
      user.businessDetails.displayOrder = displayOrder;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Brand display settings updated',
      data: user
    });
  } catch (error) {
    console.error('Update brand display error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand display',
      error: error.message
    });
  }
};

/**
 * @desc    Get all approved brands for homepage
 * @route   GET /api/brands/homepage
 * @access  Public
 */
export const getHomepageBrands = async (req, res) => {
  try {
    // ✅ FIXED: Include BOTH suppliers AND retailers
    const brands = await User.find({
      role: { $in: ['supplier', 'retailer'] },  // ✅ Both supplier and retailer
      'businessDetails.brandLogo': { $exists: true },
      'businessDetails.brandLogo.url': { $exists: true, $ne: null }, // ✅ Ensure logo URL exists
      'businessDetails.brandLogoStatus': 'approved',
      'businessDetails.showOnHomepage': true,  // ✅ Only show brands marked for homepage
      isActive: true,
      isApproved: true  // ✅ Only approved accounts
    })
      .select('name role businessDetails.businessName businessDetails.brandLogo businessDetails.displayOrder')
      .sort('businessDetails.displayOrder -createdAt')  // ✅ Sort by displayOrder (ascending), then newest first
      .limit(50);  // ✅ Increased limit to show more brands

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error('Get homepage brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homepage brands',
      error: error.message
    });
  }
};

export default {
  getAllUsers,
  getPendingApprovals,
  approveUser,
  rejectUser,
  updateUserStatus,
  deleteUser,
  getUserStats,
  getPendingBrandLogos,
  approveBrandLogo,
  rejectBrandLogo,
  updateBrandDisplay,
  getHomepageBrands
};