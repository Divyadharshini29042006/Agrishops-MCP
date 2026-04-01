// backend/src/controllers/orderController.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';
import { sendOrderStatusUpdateEmail } from '../services/emailService.js';
import User from '../models/User.js';

/**
 * @desc    Create new order from cart
 * @route   POST /api/orders
 * @access  Private (Customer only)
 */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod = 'cod',
      orderType = 'retail'
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    // Validate delivery address
    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.phone ||
      !deliveryAddress.addressLine1 || !deliveryAddress.city ||
      !deliveryAddress.state || !deliveryAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Complete delivery address is required'
      });
    }

    // Process each item and calculate totals
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      if (!product.isActive || product.approvalStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available`
        });
      }

      // Reduce stock
      product.stock -= item.quantity;
      product.soldQuantity += item.quantity;
      await product.save();

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        seller: product.seller
      });
    }

    // Calculate totals
    const deliveryCharge = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + deliveryCharge + tax;

    // Create order
    const order = await Order.create({
      customer: req.user._id,
      items: processedItems,
      deliveryAddress,
      orderType,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'completed'
      },
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      status: 'pending'
    });

    // Update user stats
    req.user.stats.totalOrders += 1;
    req.user.stats.totalSpent += totalAmount;
    await req.user.save();

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] }
    );

    // Create notifications for sellers
    const sellers = [...new Set(processedItems.map(item => item.seller.toString()))];
    for (const sellerId of sellers) {
      await Notification.create({
        user: sellerId,
        type: 'order_placed',
        title: 'New Order Received',
        message: `You have received a new order #${order.orderNumber}`,
        relatedOrder: order._id,
        priority: 'high'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

/**
 * @desc    Get customer's orders
 * @route   GET /api/orders/my-orders
 * @access  Private (Customer)
 */
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments({ customer: req.user._id });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

/**
 * @desc    Get single order details
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name businessDetails.businessName')
      .populate({ path: 'items.product', select: 'name images category', strictPopulate: false })
      .populate({ path: 'items.seller', select: 'name businessDetails.businessName', strictPopulate: false });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has permission to view this order
    const isCustomer = order.customer && order.customer._id.toString() === req.user._id.toString();
    const isSeller = (order.seller && order.seller._id.toString() === req.user._id.toString()) || 
                    order.items.some(item => item.seller && item.seller._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller's received orders
 * @route   GET /api/orders/received
 * @access  Private (Retailer/Supplier)
 */
export const getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find({
      'items.seller': req.user._id
    })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments({ 'items.seller': req.user._id });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Seller/Admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permission
    const isSeller = order.items.some(item =>
      item.seller.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    // Update specific timestamps
    if (status === 'shipped') {
      order.shippedAt = new Date();
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }
      // Set estimated delivery (7 days from now)
      order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.payment.status = 'completed'; // Mark payment as completed on delivery
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user._id;
    }

    await order.save();

    // Notify customer
    let notificationMessage = '';
    if (status === 'confirmed') notificationMessage = 'Your order has been confirmed';
    if (status === 'shipped') notificationMessage = `Your order has been shipped. Tracking: ${trackingNumber || 'N/A'}`;
    if (status === 'delivered') notificationMessage = 'Your order has been delivered';
    if (status === 'cancelled') notificationMessage = 'Your order has been cancelled';

    if (notificationMessage) {
      await Notification.create({
        user: order.customer,
        type: 'order_status_update',
        title: 'Order Status Updated',
        message: notificationMessage,
        relatedOrder: order._id,
        priority: 'high'
      });

      // Send Email Notification
      try {
        const customer = await User.findById(order.customer).select('name email');
        if (customer) {
          await sendOrderStatusUpdateEmail(
            customer.email,
            customer.name,
            order.orderNumber,
            status,
            trackingNumber
          );
        }
      } catch (emailError) {
        console.error('Error sending order status email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel order
 * @route   DELETE /api/orders/:id
 * @access  Private (Customer/Admin)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permission
    const isCustomer = order.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Can only cancel if not shipped
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered'
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          soldQuantity: -item.quantity
        }
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason || 'Cancelled by customer';

    order.statusHistory.push({
      status: 'cancelled',
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/admin/orders
 * @access  Private (Admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find()
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments();

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all orders',
      error: error.message
    });
  }
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
};