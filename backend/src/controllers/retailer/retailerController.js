// backend/src/controllers/retailer/retailerController.js

import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';

/**
 * @desc    Get retailer dashboard stats
 * @route   GET /api/retailer/dashboard/stats
 * @access  Private (Retailer only)
 */
export const getRetailerDashboardStats = async (req, res) => {
  try {
    const retailerId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // ✅ OPTIMIZED: Combined aggregation for all order/revenue stats
    const orderResults = await Order.aggregate([
      { $match: { seller: retailerId } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalCount: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                pendingCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                }
              }
            }
          ],
          today: [
            { $match: { createdAt: { $gte: today } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
          ],
          week: [
            { $match: { createdAt: { $gte: weekAgo } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
          ],
          month: [
            { $match: { createdAt: { $gte: monthAgo } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
          ]
        }
      }
    ]);

    const orderStats = orderResults[0];

    // ✅ NEW: Simple packet-based low stock query
    const lowStockQuery = {
      seller: retailerId,
      isActive: true,
      variants: {
        $elemMatch: { stock: { $lt: 50 } }
      }
    };

    // ✅ OPTIMIZED: Combined aggregation for inventory stats
    const inventoryStatsResult = await Product.aggregate([
      { $match: { seller: retailerId, isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: "$variants",
                      as: "v",
                      in: { $lt: ["$$v.stock", 50] }
                    }
                  }
                },
                1,
                0
              ]
            }
          },
          criticalStock: {
            $sum: {
              $cond: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: "$variants",
                      as: "v",
                      in: { $lt: ["$$v.stock", 20] }
                    }
                  }
                },
                1,
                0
              ]
            }
          },
          expiring: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$hasExpiry', true] },
                    { $lte: ['$expiryDate', sevenDaysFromNow] },
                    { $gte: ['$expiryDate', today] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$hasExpiry', true] },
                    { $lt: ['$expiryDate', today] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const invStats = inventoryStatsResult[0] || {
      total: 0,
      lowStock: 0,
      criticalStock: 0,
      expiring: 0,
      expired: 0
    };

    // Fetch alert details (limited to 5 each)
    const criticalStockDetails = await Product.find({
      seller: retailerId,
      isActive: true,
      variants: { $elemMatch: { stock: { $lt: 20 } } }
    }).limit(5);

    const lowStockDetails = await Product.find({
      seller: retailerId,
      isActive: true,
      variants: { $elemMatch: { stock: { $gte: 20, $lt: 50 } } }
    }).limit(5);

    const expiringDetails = await Product.find({
      seller: retailerId,
      isActive: true,
      hasExpiry: true,
      expiryDate: { $lte: sevenDaysFromNow, $gte: today }
    }).limit(5).select('name expiryDate');

    const expiredDetails = await Product.find({
      seller: retailerId,
      isActive: true,
      hasExpiry: true,
      expiryDate: { $lt: today }
    }).limit(5).select('name expiryDate');

    // Top products
    const topProducts = await Product.find({
      seller: retailerId,
      isActive: true,
    })
      .sort({ soldQuantity: -1 })
      .limit(5)
      .select('name soldQuantity pricing.finalPrice images');

    // Recent orders
    const recentOrders = await Order.find({ seller: retailerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email');

    // Recent purchases
    const recentPurchases = await Order.find({ customer: retailerId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('seller', 'name businessName');

    res.status(200).json({
      success: true,
      data: {
        inventory: {
          total: invStats.total,
          lowStock: invStats.lowStock,
          criticalStock: invStats.criticalStock,
          expiring: invStats.expiring,
          expired: invStats.expired,
        },
        orders: {
          total: orderStats.totals[0]?.totalCount || 0,
          pending: orderStats.totals[0]?.pendingCount || 0,
          today: orderStats.today[0]?.count || 0,
          week: orderStats.week[0]?.count || 0,
          month: orderStats.month[0]?.count || 0,
        },
        revenue: {
          total: orderStats.totals[0]?.totalRevenue || 0,
          today: orderStats.today[0]?.revenue || 0,
          week: orderStats.week[0]?.revenue || 0,
          month: orderStats.month[0]?.revenue || 0,
        },
        alerts: {
          criticalStockProducts: criticalStockDetails.map(p => ({
            id: p._id,
            name: p.name,
            variantStockStatus: p.variantStockStatus,
            stockSummary: p.stockSummary
          })),
          lowStockProducts: lowStockDetails.map(p => ({
            id: p._id,
            name: p.name,
            variantStockStatus: p.variantStockStatus,
            stockSummary: p.stockSummary
          })),
          expiringProducts: expiringDetails.map(p => ({
            id: p._id,
            name: p.name,
            expiryDate: p.expiryDate,
            daysLeft: Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24)),
          })),
          expiredProducts: expiredDetails.map(p => ({
            id: p._id,
            name: p.name,
            expiryDate: p.expiryDate,
          })),
        },
        topProducts,
        recentOrders,
        recentPurchases,
      },
    });
  } catch (error) {
    console.error('Get retailer dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};

/**
 * @desc    Get retailer's inventory
 * @route   GET /api/retailer/inventory
 * @access  Private (Retailer only)
 */
export const getRetailerInventory = async (req, res) => {
  try {
    const { status, search, sortBy, page = 1, limit = 10 } = req.query;
    const retailerId = req.user._id;

    const query = { seller: retailerId };

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'isActive') {
        query.isActive = true;
      } else if (status === 'isInactive') {
        query.isActive = false;
      } else if (status === 'low_stock') {
        // Low stock: at least one variant is below 50 packets
        query.variants = {
          $elemMatch: { stock: { $lt: 50 } }
        };
      } else if (status === 'critical_stock') {
        // Critical stock: at least one variant is below 20 packets
        query.variants = {
          $elemMatch: { stock: { $lt: 20 } }
        };
      } else if (status === 'expiring') {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        query.hasExpiry = true;
        query.expiryDate = { $gte: new Date(), $lte: sevenDaysFromNow };
      } else if (status === 'expired') {
        query.hasExpiry = true;
        query.expiryDate = { $lt: new Date() };
      } else {
        query.approvalStatus = status;
      }
    }

    // Search
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc': sortOptions = { 'pricing.finalPrice': 1 }; break;
        case 'price_desc': sortOptions = { 'pricing.finalPrice': -1 }; break;
        case 'stock_asc': sortOptions = { stock: 1 }; break;
        case 'stock_desc': sortOptions = { stock: -1 }; break;
        case 'created_asc': sortOptions = { createdAt: 1 }; break;
        case 'created_desc': sortOptions = { createdAt: -1 }; break;
        default: sortOptions = { createdAt: -1 };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('category.main category.sub category.type', 'name');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get retailer inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message,
    });
  }
};

/**
 * @desc    Update stock quantity
 * @route   PUT /api/retailer/inventory/:id/stock
 * @access  Private (Retailer only)
 */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'set'

    // Verify ownership first
    const existing = await Product.findOne({ _id: id, seller: req.user._id }).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Use findOneAndUpdate with $set to bypass the pre-save hook that
    // recalculates stock from variants — otherwise product.save() overwrites
    // the manual stock change back to the sum of variant stocks.
    const newStock = operation === 'add'
      ? existing.stock + quantity
      : Math.max(0, quantity);

    const updated = await Product.findOneAndUpdate(
      { _id: id, seller: req.user._id },
      { $set: { stock: newStock } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message,
    });
  }
};

/**
 * @desc    Get products from suppliers (wholesale catalog)
 * @route   GET /api/retailer/suppliers/products
 * @access  Private (Retailer only)
 */
export const getSupplierProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    let query = {
      approvalStatus: 'approved',
      isActive: true,
    };

    // Only get products from suppliers (not other retailers)
    const suppliers = await User.find({ role: 'supplier', isApproved: true });
    const supplierIds = suppliers.map(s => s._id);
    query.seller = { $in: supplierIds };

    // Filter by category
    if (category) {
      query['category.main'] = category;
    }

    // Search
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Price range
    if (minPrice || maxPrice) {
      query['pricing.finalPrice'] = {};
      if (minPrice) query['pricing.finalPrice'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.finalPrice'].$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('seller', 'name businessDetails')
      .populate('category.main category.sub category.type', 'name');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get supplier products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier products',
      error: error.message,
    });
  }
};

/**
 * @desc    Create bulk purchase order from supplier
 * @route   POST /api/retailer/purchase-from-supplier
 * @access  Private (Retailer only)
 */
export const purchaseFromSupplier = async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    const retailerId = req.user._id;

    // Get product
    const product = await Product.findById(productId).populate('seller');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if seller is a supplier
    if (product.seller.role !== 'supplier') {
      return res.status(400).json({
        success: false,
        message: 'Can only purchase from suppliers',
      });
    }

    // ✅ NEW: Bulk minimum quantity validation
    const minQty = product.bulkMinQuantity || 100;
    if (quantity < minQty) {
      return res.status(400).json({
        success: false,
        message: `Wholesale orders require a minimum quantity of ${minQty} ${product.unit}.`,
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`,
      });
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${Date.now()}${String(orderCount + 1).padStart(4, "0")}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: retailerId,
      seller: product.seller._id,
      items: [{
        product: product._id,
        productName: product.name,
        quantity,
        price: product.pricing.finalPrice,
        subtotal: product.pricing.finalPrice * quantity,
      }],
      deliveryAddress: req.user.businessDetails?.address || {
        fullName: req.user.name,
        phone: req.user.phone,
        addressLine1: 'Business Address',
        city: 'City',
        state: 'State',
        pincode: '000000',
      },
      orderType: 'wholesale',
      paymentMethod: 'cod',
      subtotal: product.pricing.finalPrice * quantity,
      totalAmount: product.pricing.finalPrice * quantity,
      customerNote: notes,
    });

    // ✅ FLAG LARGE ORDERS: Log or flag large orders for review if above threshold
    const bulkThreshold = product.bulkOrder?.minQuantity || 100;
    if (quantity >= bulkThreshold) {
      console.log(`📢 LARGE ORDER DETECTED: Retailer ${req.user.name} ordered ${quantity} units (Threshold: ${bulkThreshold})`);
      // Future: Set a flag on the order record for priority/review
    }

    // Update supplier's product stock
    product.stock -= quantity;
    await product.save();

    // Notify supplier
    await Notification.create({
      user: product.seller._id,
      type: 'order_placed',
      title: 'New Bulk Order Received',
      message: `Retailer ${req.user.name} ordered ${quantity} ${product.unit} of ${product.name}`,
      relatedOrder: order._id,
      priority: 'high',
      actionUrl: `/supplier/orders/${order._id}`,
      actionText: 'View Order',
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Purchase from supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message,
    });
  }
};

/**
 * @desc    Check for expiring products and create alerts
 * @route   POST /api/retailer/check-expiry-alerts
 * @access  Private (Retailer only)
 */
export const checkExpiryAlerts = async (req, res) => {
  try {
    const retailerId = req.user._id;
    const today = new Date();

    // Get products expiring in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringProducts = await Product.find({
      seller: retailerId,
      hasExpiry: true,
      expiryDate: {
        $gte: today,
        $lte: sevenDaysFromNow,
      },
      isActive: true,
    });

    // Create notifications for products expiring in 3 days or less
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    for (const product of expiringProducts) {
      const daysLeft = Math.ceil((new Date(product.expiryDate) - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 3) {
        // Check if notification already exists
        const existingNotification = await Notification.findOne({
          user: retailerId,
          relatedProduct: product._id,
          type: 'product_expiring_soon',
          createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) },
        });

        if (!existingNotification) {
          await Notification.create({
            user: retailerId,
            type: 'product_expiring_soon',
            title: 'Product Expiring Soon!',
            message: `${product.name} will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            relatedProduct: product._id,
            priority: daysLeft <= 1 ? 'urgent' : 'high',
            actionUrl: `/retailer/inventory`,
            actionText: 'View Inventory',
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Expiry check completed',
      data: {
        expiringCount: expiringProducts.length,
      },
    });
  } catch (error) {
    console.error('Check expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check expiry alerts',
      error: error.message,
    });
  }
};

export default {
  getRetailerDashboardStats,
  getRetailerInventory,
  updateStock,
  getSupplierProducts,
  purchaseFromSupplier,
  checkExpiryAlerts,
};