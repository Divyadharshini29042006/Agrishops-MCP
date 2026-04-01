// backend/src/controllers/supplier/supplierOrderController.js
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import { sendOrderStatusUpdateEmail } from '../../services/emailService.js';

/**
 * @desc    Get all orders for supplier (where supplier is seller)
 * @route   GET /api/supplier/orders
 * @access  Private (Supplier only)
 */
export const getSupplierOrders = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { status, search, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { seller: supplierId };

    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ orderNumber: searchRegex }];

      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');

      if (matchingUsers.length > 0) {
        query.$or.push({ customer: { $in: matchingUsers.map(u => u._id) } });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch orders with necessary population and pagination
    const orders = await Order.find(query)
      .populate('customer', 'name email phone role')
      .populate('seller', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    // ✅ EFFICIENT status counts using aggregation
    const statusCounts = await Order.aggregate([
      { $match: { seller: supplierId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      all: statusCounts.reduce((acc, curr) => acc + curr.count, 0),
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach(sc => {
      if (counts.hasOwnProperty(sc._id)) {
        counts[sc._id] = sc.count;
      }
    });

    res.status(200).json({
      success: true,
      data: orders,
      counts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /api/supplier/orders/:id
 * @access  Private (Supplier only)
 */
export const getSupplierOrderById = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { id } = req.params;

    // Find order and verify supplier is the seller
    const order = await Order.findOne({
      _id: id,
      seller: supplierId,
    })
      .populate('customer', 'name email phone role')
      .populate('seller', 'name email businessName')
      .populate('items.product', 'name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized to view it',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/supplier/orders/:id/status
 * @access  Private (Supplier only)
 */
export const updateSupplierOrderStatus = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Find order and verify supplier is the seller
    const order = await Order.findOne({
      _id: id,
      seller: supplierId,
    }).populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized to update it',
      });
    }

    // Check if order can be updated
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update order status. Order is already ${order.status}`,
      });
    }

    // Validate status progression
    const statusProgression = {
      pending: ['confirmed', 'processing', 'cancelled'],
      confirmed: ['processing', 'shipped', 'cancelled'],
      processing: ['shipped', 'delivered', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
    };

    if (!statusProgression[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // Update order status
    order.status = status;

    // Update payment status for COD orders when delivered
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'completed';
    }

    await order.save();

    // Create notification for customer
    try {
      await Notification.create({
        user: order.customer._id,
        type: `order_${status}`,
        title: 'Order Status Updated',
        message: `Your order #${order.orderNumber} status has been updated to: ${status}`,
        relatedOrder: order._id,
        actionUrl: `/orders/${order._id}`,
        actionText: 'View Order',
      });

      // Send Email Notification
      await sendOrderStatusUpdateEmail(
        order.customer.email,
        order.customer.name,
        order.orderNumber,
        status,
        order.trackingNumber
      );
    } catch (notifError) {
      console.error('Error creating notification or sending email:', notifError);
      // Don't fail the request if notification/email fails
    }

    // ✅ NEW: Supplier Low Stock Alert (< 150 units) on Order Confirmation
    if (status === 'confirmed') {
      try {
        const { sendLowStockEmail } = await import('../../services/emailService.js');
        const supplierUser = await User.findById(supplierId);

        // Loop through each item in the order to check its current stock
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product && product.stock < 150) {

            // Create in-app notification for supplier
            await Notification.create({
              user: supplierId,
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `${product.name} stock has dropped below 150 units (Current: ${product.stock} ${product.unit}). Please restock soon.`,
              relatedProduct: product._id,
              priority: 'urgent',
              actionUrl: `/supplier/products`,
              actionText: 'Manage Inventory',
            });
            console.log(`⚠️ LOW STOCK ALERT: ${product.name} is down to ${product.stock} units.`);

            // Send Email Alert to supplier
            await sendLowStockEmail(
              supplierUser.email,
              supplierUser.name,
              product.name,
              product.stock,
              150
            );
          }
        }
      } catch (err) {
        console.error('Error processing Low Stock Alerts on confirmation:', err);
      }
    }

    // Populate for response
    await order.populate('customer', 'name email phone role');
    await order.populate('seller', 'name email businessName');
    await order.populate('items.product', 'name images price');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

/**
 * @desc    Get supplier dashboard stats
 * @route   GET /api/supplier/dashboard/stats
 * @access  Private (Supplier only)
 */
export const getSupplierDashboardStats = async (req, res) => {
  try {
    const supplierId = req.user._id;

    // ✅ OPTIMIZED: Combined aggregation for order stats and revenue
    const orderResults = await Order.aggregate([
      { $match: { seller: supplierId } },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          revenue: [
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]
        }
      }
    ]);

    const orderStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    const statusResults = orderResults[0].statusCounts;
    statusResults.forEach(stat => {
      orderStats.total += stat.count;
      if (orderStats.hasOwnProperty(stat._id)) {
        orderStats[stat._id] = stat.count;
      }
    });

    const totalRevenue = orderResults[0].revenue[0]?.total || 0;

    // Optimized product counts
    const productStatsResult = await Product.aggregate([
      { $match: { seller: supplierId, isActive: true } },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
          ],
          lowStockCount: [
            {
              $match: {
                variants: { $elemMatch: { stock: { $lt: 25 } } }
              }
            },
            { $count: 'count' }
          ],
          criticalStockCount: [
            {
              $match: {
                variants: { $elemMatch: { stock: { $lt: 10 } } }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const productResults = productStatsResult[0];
    const productStats = {
      total: productResults.statusCounts.reduce((acc, curr) => acc + curr.count, 0),
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    productResults.statusCounts.forEach(stat => {
      if (productStats.hasOwnProperty(stat._id)) {
        productStats[stat._id] = stat.count;
      }
    });

    const lowStockCount = productResults.lowStockCount[0]?.count || 0;
    const criticalStockCount = productResults.criticalStockCount[0]?.count || 0;

    // Fetch alert details
    const criticalStockProducts = await Product.find({
      seller: supplierId,
      isActive: true,
      variants: { $elemMatch: { stock: { $lt: 10 } } }
    }).limit(5).select('name variants');

    const lowStockProducts = await Product.find({
      seller: supplierId,
      isActive: true,
      variants: { $elemMatch: { stock: { $gte: 10, $lt: 25 } } }
    }).limit(5).select('name variants');

    // Get 5 most recent orders (Keep restricted to 5)
    const recentOrders = await Order.find({ seller: supplierId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email');

    res.status(200).json({
      success: true,
      data: {
        orders: orderStats,
        products: productStats,
        revenue: totalRevenue,
        recentOrders,
        alerts: {
          lowStockCount,
          criticalStockCount,
          criticalStockProducts: criticalStockProducts.map(p => ({
            id: p._id,
            name: p.name,
            variantStockStatus: p.variantStockStatus,
            stockSummary: p.stockSummary
          })),
          lowStockProducts: lowStockProducts.map(p => ({
            id: p._id,
            name: p.name,
            variantStockStatus: p.variantStockStatus,
            stockSummary: p.stockSummary
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get supplier dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};

export default {
  getSupplierOrders,
  getSupplierOrderById,
  updateSupplierOrderStatus,
  getSupplierDashboardStats,
};