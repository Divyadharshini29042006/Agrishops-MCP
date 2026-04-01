// backend/src/controllers/admin/productModerationController.js - FIXED
import Product from '../../models/Product.js';
import Notification from '../../models/Notification.js';

/**
 * @desc Get all products with filters (ADMIN VIEW - FIXED CATEGORY POPULATION)
 * @route GET /api/admin/products
 * @access Private (Admin only)
 */
export const getAllProducts = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      seller, 
      search,
      page = 1, 
      limit = 20,
      sort = '-createdAt',
      hasExpiry,
      isLowStock 
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Filter by approval status
    if (status) {
      query.approvalStatus = status;
    }

    // Filter by category
    if (category) {
      query['category.main'] = category;
    }

    // Filter by seller
    if (seller) {
      query.seller = seller;
    }

    // Search by product name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by expiry
    if (hasExpiry === 'true') {
      query.hasExpiry = true;
      query.expiryDate = { $exists: true };
    }

    // Filter by low stock
    if (isLowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);

    // ✅ CRITICAL FIX: Proper population with fallback
    const products = await Product.find(query)
      .populate({
        path: 'category.main',
        select: 'name slug categoryType',
        strictPopulate: false // ✅ Don't fail if category is null
      })
      .populate({
        path: 'category.sub',
        select: 'name slug',
        strictPopulate: false
      })
      .populate({
        path: 'category.type',
        select: 'name slug',
        strictPopulate: false
      })
      .populate({
        path: 'category.variety',
        select: 'name description',
        strictPopulate: false
      })
      .populate({
        path: 'seller',
        select: 'name email businessDetails.businessName businessDetails.brandLogo'
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(); // ✅ Use lean() for better performance

    // Get total count
    const total = await Product.countDocuments(query);

    // ✅ FIX: Transform data to handle missing categories
    const transformedProducts = products.map(product => ({
      ...product,
      categoryName: product.category?.main?.name || 'N/A',
      categorySlug: product.category?.main?.slug || null,
      categoryType: product.category?.main?.categoryType || null,
      businessName: product.seller?.businessDetails?.businessName || product.seller?.name || 'Unknown',
      // ✅ Ensure image URL is correct
      mainImage: product.images?.[0]?.url || product.images?.[0] || '/placeholder.png'
    }));

    res.status(200).json({
      success: true,
      data: transformedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

/**
 * @desc Get single product details (ADMIN VIEW)
 * @route GET /api/admin/products/:id
 * @access Private (Admin only)
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category.main', 'name categoryType description slug')
      .populate('category.sub', 'name description slug')
      .populate('category.type', 'name slug')
      .populate('category.variety', 'name description characteristics')
      .populate('seller', 'name email phone businessDetails location');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

/**
 * @desc Approve product
 * @route PUT /api/admin/products/:id/approve
 * @access Private (Admin only)
 */
export const approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Product is already approved'
      });
    }

    product.approvalStatus = 'approved';
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    
    if (req.body.notes) {
      product.approvalNotes = {
        ...product.approvalNotes,
        productApproval: req.body.notes
      };
    }

    await product.save();

    // Notify seller
    await Notification.create({
      user: product.seller._id,
      type: 'product_approved',
      title: 'Product Approved',
      message: `Your product "${product.name}" has been approved and is now live!`,
      relatedProduct: product._id
    });

    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      data: product
    });

  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving product',
      error: error.message
    });
  }
};

/**
 * @desc Reject product
 * @route PUT /api/admin/products/:id/reject
 * @access Private (Admin only)
 */
export const rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.approvalStatus = 'rejected';
    product.rejectionReason = reason;
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();

    await product.save();

    // Notify seller
    await Notification.create({
      user: product.seller._id,
      type: 'product_rejected',
      title: 'Product Rejected',
      message: `Your product "${product.name}" was rejected. Reason: ${reason}`,
      relatedProduct: product._id,
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'Product rejected',
      data: product
    });

  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting product',
      error: error.message
    });
  }
};

/**
 * @desc Delete product (Admin only - permanent delete)
 * @route DELETE /api/admin/products/:id
 * @access Private (Admin only)
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

/**
 * @desc Get pending products for approval
 * @route GET /api/admin/products/pending
 * @access Private (Admin only)
 */
export const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({ approvalStatus: 'pending', isActive: true })
      .populate({
        path: 'category.main',
        select: 'name slug categoryType',
        strictPopulate: false
      })
      .populate({
        path: 'category.sub',
        select: 'name slug',
        strictPopulate: false
      })
      .populate({
        path: 'category.type',
        select: 'name slug',
        strictPopulate: false
      })
      .populate({
        path: 'category.variety',
        select: 'name description',
        strictPopulate: false
      })
      .populate({
        path: 'seller',
        select: 'name email businessDetails.businessName businessDetails.brandLogo'
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments({ approvalStatus: 'pending', isActive: true });

    const transformedProducts = products.map(product => ({
      ...product,
      categoryName: product.category?.main?.name || 'N/A',
      categorySlug: product.category?.main?.slug || null,
      categoryType: product.category?.main?.categoryType || null,
      businessName: product.seller?.businessDetails?.businessName || product.seller?.name || 'Unknown',
      mainImage: product.images?.[0]?.url || product.images?.[0] || '/placeholder.png'
    }));

    res.status(200).json({
      success: true,
      data: transformedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get pending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending products',
      error: error.message
    });
  }
};

/**
 * @desc Get product statistics
 * @route GET /api/admin/products/stats
 * @access Private (Admin only)
 */
export const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const pendingProducts = await Product.countDocuments({ approvalStatus: 'pending', isActive: true });
    const approvedProducts = await Product.countDocuments({ approvalStatus: 'approved', isActive: true });
    const rejectedProducts = await Product.countDocuments({ approvalStatus: 'rejected', isActive: true });

    // Low stock products (stock <= lowStockThreshold)
    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      approvalStatus: 'approved',
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoonProducts = await Product.countDocuments({
      isActive: true,
      approvalStatus: 'approved',
      hasExpiry: true,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    });

    // Out of stock
    const outOfStockProducts = await Product.countDocuments({
      isActive: true,
      approvalStatus: 'approved',
      stock: 0
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalProducts,
        pending: pendingProducts,
        approved: approvedProducts,
        rejected: rejectedProducts,
        lowStock: lowStockProducts,
        expiringSoon: expiringSoonProducts,
        outOfStock: outOfStockProducts
      }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
};

/**
 * @desc Get product alerts (low stock, expiring soon, out of stock)
 * @route GET /api/admin/products/alerts
 * @access Private (Admin only)
 */
export const getProductAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = { isActive: true, approvalStatus: 'approved' };

    if (type === 'lowStock') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    } else if (type === 'expiringSoon') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query.hasExpiry = true;
      query.expiryDate = { $lte: thirtyDaysFromNow, $gte: new Date() };
    } else if (type === 'outOfStock') {
      query.stock = 0;
    } else {
      // All alerts
      query.$or = [
        { $expr: { $lte: ['$stock', '$lowStockThreshold'] } },
        { stock: 0 },
        {
          hasExpiry: true,
          expiryDate: {
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            $gte: new Date()
          }
        }
      ];
    }

    const products = await Product.find(query)
      .populate({
        path: 'category.main',
        select: 'name slug categoryType',
        strictPopulate: false
      })
      .populate({
        path: 'seller',
        select: 'name email businessDetails.businessName'
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(query);

    const transformedProducts = products.map(product => {
      let alertType = 'unknown';
      let alertMessage = '';

      if (product.stock === 0) {
        alertType = 'outOfStock';
        alertMessage = 'Out of stock';
      } else if (product.stock <= product.lowStockThreshold) {
        alertType = 'lowStock';
        alertMessage = `Low stock (${product.stock} remaining)`;
      } else if (product.hasExpiry && product.expiryDate) {
        const daysUntilExpiry = Math.ceil((product.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        alertType = 'expiringSoon';
        alertMessage = `Expires in ${daysUntilExpiry} days`;
      }

      return {
        ...product,
        alertType,
        alertMessage,
        categoryName: product.category?.main?.name || 'N/A',
        businessName: product.seller?.businessDetails?.businessName || product.seller?.name || 'Unknown',
        mainImage: product.images?.[0]?.url || product.images?.[0] || '/placeholder.png'
      };
    });

    res.status(200).json({
      success: true,
      data: transformedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get product alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product alerts',
      error: error.message
    });
  }
};

export default {
  getAllProducts,
  getProductById,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getProductStats,
  getProductAlerts
};
