// backend/src/controllers/retailer/retailerOrderController.js - COMPLETE WITH DELIVERY CONFIRMATION

import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import { sendOrderStatusUpdateEmail } from '../../services/emailService.js';

/**
 * @desc    Get retailer's received orders from customers
 * @route   GET /api/retailer/orders
 * @access  Private (Retailer only)
 */
export const getRetailerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const retailerId = req.user._id;

    let query = {
      seller: retailerId,
    };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by order number or customer name
    if (search) {
      const customers = await User.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');

      const customerIds = customers.map(c => c._id);

      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customerIds } },
      ];
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images');

    const total = await Order.countDocuments(query);

    // Get order counts by status
    const statusCounts = await Order.aggregate([
      { $match: { seller: retailerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      all: total,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: orders,
      counts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get retailer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

/**
 * @desc    Get retailer's purchases from suppliers (orders where retailer is the BUYER)
 * @route   GET /api/retailer/purchases
 * @access  Private (Retailer only)
 */
export const getRetailerPurchases = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const retailerId = req.user._id;

    let query = {
      customer: retailerId, // Retailer is the CUSTOMER/BUYER here
    };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by order number or supplier name
    if (search) {
      const suppliers = await User.find({
        name: { $regex: search, $options: 'i' },
        role: { $in: ['supplier', 'retailer'] }, // Can buy from both
      }).select('_id');

      const supplierIds = suppliers.map(s => s._id);

      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { seller: { $in: supplierIds } },
      ];
    }

    const skip = (page - 1) * limit;

    const purchases = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('seller', 'name email phone businessName') // Populate supplier info
      .populate('items.product', 'name images unit');

    const total = await Order.countDocuments(query);

    // Get purchase counts by status
    const statusCounts = await Order.aggregate([
      { $match: { customer: retailerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      all: total,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: purchases,
      counts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get retailer purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single purchase details (orders where retailer is the buyer)
 * @route   GET /api/retailer/purchases/:id
 * @access  Private (Retailer only)
 */
export const getPurchaseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const retailerId = req.user._id;

    // Retailer can view purchases where they are the CUSTOMER
    const purchase = await Order.findOne({
      _id: id,
      customer: retailerId,
    })
      .populate('customer', 'name email phone')
      .populate('seller', 'name email phone businessName')
      .populate('items.product', 'name images unit')
      .populate('statusHistory.updatedBy', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found or you are not authorized to view it',
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error('Get purchase details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase details',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single order details
 * @route   GET /api/retailer/orders/:id
 * @access  Private (Retailer only)
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const retailerId = req.user._id;

    // Retailer can view orders where they are either SELLER or CUSTOMER
    const order = await Order.findOne({
      _id: id,
      $or: [
        { seller: retailerId },
        { customer: retailerId },
      ],
    })
      .populate('customer', 'name email phone')
      .populate('seller', 'name email phone businessName')
      .populate('items.product', 'name images unit')
      .populate('statusHistory.updatedBy', 'name');

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
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/retailer/orders/:id/status
 * @access  Private (Retailer only)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber } = req.body;
    const retailerId = req.user._id;

    const order = await Order.findOne({
      _id: id,
      seller: retailerId, // Only seller can update status
    }).populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized',
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // Update order
    order.status = status;

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (status === 'shipped') {
      order.shippedAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'completed';
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelledBy = retailerId;
      order.cancellationReason = note;

      // Restore stock for cancelled orders
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    // Add to status history
    order.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: retailerId,
      note,
    });

    await order.save();

    // Notify customer
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'confirmed':
        notificationTitle = 'Order Confirmed';
        notificationMessage = `Your order #${order.orderNumber} has been confirmed`;
        break;
      case 'processing':
        notificationTitle = 'Order Being Processed';
        notificationMessage = `Your order #${order.orderNumber} is being prepared`;
        break;
      case 'shipped':
        notificationTitle = 'Order Shipped';
        notificationMessage = `Your order #${order.orderNumber} has been shipped`;
        if (trackingNumber) {
          notificationMessage += `. Tracking: ${trackingNumber}`;
        }
        break;
      case 'delivered':
        notificationTitle = 'Order Delivered';
        notificationMessage = `Your order #${order.orderNumber} has been delivered`;
        break;
      case 'cancelled':
        notificationTitle = 'Order Cancelled';
        notificationMessage = `Your order #${order.orderNumber} has been cancelled`;
        break;
    }

    await Notification.create({
      user: order.customer._id,
      type: `order_${status}`,
      title: notificationTitle,
      message: notificationMessage,
      relatedOrder: order._id,
      priority: status === 'cancelled' ? 'high' : 'medium',
      actionUrl: `/orders/${order._id}`,
      actionText: 'View Order',
    });

    // Send Email Notification
    try {
      await sendOrderStatusUpdateEmail(
        order.customer.email,
        order.customer.name,
        order.orderNumber,
        status,
        trackingNumber
      );
    } catch (emailError) {
      console.error('Error sending order status email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

/**
 * ⭐ NEW FUNCTION - Retailer confirms delivery of their purchase
 * @desc    Confirm delivery of purchase (buyer marks as delivered)
 * @route   PATCH /api/retailer/purchases/:id/confirm-delivery
 * @access  Private (Retailer only - must be buyer)
 */
export const confirmPurchaseDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const retailerId = req.user._id;

    // Find the order where retailer is the BUYER (customer)
    const purchase = await Order.findOne({
      _id: id,
      customer: retailerId, // Retailer must be the buyer
    })
      .populate('customer', 'name email')
      .populate('seller', 'name email');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found or you are not authorized',
      });
    }

    // Check if order is in shipped status
    if (purchase.status !== 'shipped') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm delivery. Order status is ${purchase.status}. Must be 'shipped' to confirm delivery.`,
      });
    }

    // Update order status to delivered
    purchase.status = 'delivered';
    purchase.deliveredAt = new Date();

    // Update payment status if COD
    if (purchase.paymentMethod === 'cod') {
      purchase.paymentStatus = 'completed';
    }

    // Add to status history
    purchase.statusHistory.push({
      status: 'delivered',
      updatedAt: new Date(),
      updatedBy: retailerId,
      note: note || 'Delivery confirmed by buyer',
    });

    // ✅ STOCK MIGRATION: Add purchased items to Retailer's inventory
    for (const item of purchase.items) {
      const supplierProduct = await Product.findById(item.product);
      if (!supplierProduct) continue;

      // Check if retailer already has this product (match by name and category)
      let retailerProduct = await Product.findOne({
        seller: retailerId,
        name: supplierProduct.name,
        'category.main': supplierProduct.category.main,
        'category.sub': supplierProduct.category.sub,
      });

      if (retailerProduct) {
        // Update existing product stock
        retailerProduct.stock += item.quantity;
        // If variants exist, we'd need more complex matching, 
        // but for now we update the main stock and default variant
        if (retailerProduct.variants && retailerProduct.variants.length > 0) {
          const defVariant = retailerProduct.variants.find(v => v.isDefault) || retailerProduct.variants[0];
          defVariant.stock += item.quantity;
        }
        await retailerProduct.save();
      } else {
        // Create new product for retailer based on supplier's product
        const productData = supplierProduct.toObject();
        delete productData._id;
        delete productData.id;
        delete productData.createdAt;
        delete productData.updatedAt;

        // Update ownership and status
        productData.seller = retailerId;
        productData.stock = item.quantity;
        productData.soldQuantity = 0;
        productData.approvalStatus = 'approved'; // Inherit approved status
        productData.isActive = true;

        // Add a margin to pricing (e.g., 20%)
        productData.pricing.basePrice = Math.round(supplierProduct.pricing.finalPrice * 1.2);
        productData.pricing.finalPrice = productData.pricing.basePrice;
        productData.pricing.hasOffer = false;

        // Reset views/ratings
        productData.views = 0;
        productData.rating = { average: 0, count: 0 };

        // Handle variants if any
        if (productData.variants) {
          productData.variants.forEach(v => {
            v.stock = v.isDefault ? item.quantity : 0;
            v.basePrice = Math.round(v.basePrice * 1.2);
            v.finalPrice = v.basePrice;
          });
        }

        await Product.create(productData);
      }
    }

    await purchase.save();

    // Notify the supplier that delivery was confirmed
    await Notification.create({
      user: purchase.seller._id,
      type: 'order_delivered',
      title: 'Delivery Confirmed',
      message: `${purchase.customer.name} confirmed delivery of order #${purchase.orderNumber}`,
      relatedOrder: purchase._id,
      priority: 'medium',
      actionUrl: `/supplier/orders/${purchase._id}`,
      actionText: 'View Order',
    });

    // Populate for response
    await purchase.populate('items.product', 'name images unit');

    res.status(200).json({
      success: true,
      message: 'Delivery confirmed successfully',
      data: purchase,
    });
  } catch (error) {
    console.error('Confirm purchase delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm delivery',
      error: error.message,
    });
  }
};

/**
 * @desc    Add seller note to order
 * @route   PUT /api/retailer/orders/:id/note
 * @access  Private (Retailer only)
 */
export const addOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const retailerId = req.user._id;

    const order = await Order.findOne({
      _id: id,
      seller: retailerId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.sellerNote = note;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: order,
    });
  } catch (error) {
    console.error('Add order note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message,
    });
  }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/retailer/orders/stats
 * @access  Private (Retailer only)
 */
export const getOrderStats = async (req, res) => {
  try {
    const retailerId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Today's orders (received from customers)
    const todayOrders = await Order.countDocuments({
      seller: retailerId,
      createdAt: { $gte: today },
    });

    // Pending orders (received from customers)
    const pendingOrders = await Order.countDocuments({
      seller: retailerId,
      status: 'pending',
    });

    // Revenue stats (from selling)
    const revenueStats = await Order.aggregate([
      {
        $match: {
          seller: retailerId,
          paymentStatus: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          todayRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', today] }, '$totalAmount', 0],
            },
          },
          weekRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', weekAgo] }, '$totalAmount', 0],
            },
          },
          monthRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', monthAgo] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        revenue,
      },
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message,
    });
  }
};

export default {
  getRetailerOrders,
  getRetailerPurchases,
  getPurchaseDetails,
  getOrderDetails,
  updateOrderStatus,
  addOrderNote,
  getOrderStats,
  confirmPurchaseDelivery, // ⭐ NEW EXPORT
};