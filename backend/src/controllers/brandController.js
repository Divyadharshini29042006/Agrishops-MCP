// backend/src/controllers/brandController.js - FIXED FOR RETAILERS
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import fs from 'fs';
import path from 'path';

/**
 * @desc    Upload brand logo (Supplier AND Retailer) - AUTO APPROVED
 * @route   POST /api/brands/upload
 * @access  Private (Supplier/Retailer only)
 */
export const uploadBrandLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ FIXED: Allow both suppliers AND retailers
    if (user.role !== 'supplier' && user.role !== 'retailer') {
      return res.status(403).json({
        success: false,
        message: 'Only suppliers and retailers can upload brand logos'
      });
    }

    // ✅ Check if account is approved
    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account must be approved by admin before uploading a brand logo'
      });
    }

    // Delete old logo if exists
    if (user.businessDetails?.brandLogo?.filename) {
      const oldPath = path.join('uploads', user.businessDetails.brandLogo.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // ✅ Save new logo - AUTO APPROVE
    user.businessDetails.brandLogo = {
      url: `http://localhost:5000/uploads/${req.file.filename}`,
      filename: req.file.filename,
      uploadedAt: new Date()
    };
    user.businessDetails.brandLogoStatus = 'approved'; // ✅ Auto-approve
    user.businessDetails.showOnHomepage = true;        // ✅ Show on homepage immediately
    user.businessDetails.displayOrder = user.businessDetails.displayOrder || 0; // Keep existing priority or set to 0

    await user.save();

    // ✅ Send success notification to user
    try {
      await Notification.create({
        user: user._id,
        type: 'brand_logo_approved',
        title: 'Brand Logo Uploaded Successfully',
        message: 'Your brand logo is now live on the homepage!',
        priority: 'medium'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Brand logo uploaded successfully! It is now visible on the homepage.',
      data: {
        brandLogo: user.businessDetails.brandLogo,
        status: 'approved',
        showOnHomepage: true
      },
      businessDetails: user.businessDetails // ✅ Return full businessDetails for frontend update
    });
  } catch (error) {
    console.error('Upload brand logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading brand logo',
      error: error.message
    });
  }
};

/**
 * @desc    Get brand logo status
 * @route   GET /api/brands/my-logo
 * @access  Private (Supplier/Retailer only)
 */
export const getMyBrandLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('businessDetails.brandLogo businessDetails.brandLogoStatus businessDetails.showOnHomepage businessDetails.displayOrder');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        logo: user.businessDetails.brandLogo,
        status: user.businessDetails.brandLogoStatus || 'none',
        showOnHomepage: user.businessDetails.showOnHomepage || false,
        displayOrder: user.businessDetails.displayOrder || 0
      }
    });
  } catch (error) {
    console.error('Get brand logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand logo',
      error: error.message
    });
  }
};

/**
 * @desc    Delete brand logo
 * @route   DELETE /api/brands/my-logo
 * @access  Private (Supplier/Retailer only)
 */
export const deleteBrandLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete file from uploads folder
    if (user.businessDetails?.brandLogo?.filename) {
      const filePath = path.join('uploads', user.businessDetails.brandLogo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear logo data
    user.businessDetails.brandLogo = undefined;
    user.businessDetails.brandLogoStatus = 'none';
    user.businessDetails.showOnHomepage = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Brand logo deleted successfully',
      businessDetails: user.businessDetails // ✅ Return updated businessDetails
    });
  } catch (error) {
    console.error('Delete brand logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting brand logo',
      error: error.message
    });
  }
};

export default {
  uploadBrandLogo,
  getMyBrandLogo,
  deleteBrandLogo
};