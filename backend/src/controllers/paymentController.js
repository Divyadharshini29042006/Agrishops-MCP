// backend/src/controllers/paymentController.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';

let razorpay;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys missing in environment variables');
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

/**
 * @desc    Return Razorpay Key ID to frontend
 * @route   GET /api/payment/key
 * @access  Private (Customer)
 */
export const getRazorpayKey = (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
};

/**
 * @desc    Create a Razorpay order
 * @route   POST /api/payment/create-order
 * @access  Private (Customer)
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay needs paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await getRazorpayInstance().orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature & create DB order
 * @route   POST /api/payment/verify
 * @access  Private (Customer)
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData, // { items, deliveryAddress }
    } = req.body;

    // 1. Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // 2. Create the actual DB order (reuse logic from orderController)
    const { items, deliveryAddress } = orderData;

    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product || !product.isActive || product.approvalStatus !== 'approved') {
        return res.status(400).json({ success: false, message: `Product unavailable: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      product.stock -= item.quantity;
      product.soldQuantity = (product.soldQuantity || 0) + item.quantity;
      await product.save();

      const price = product.pricing?.finalPrice || product.price || 0;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price,
        subtotal: itemTotal,
        seller: product.seller,
      });
    }

    const deliveryCharge = subtotal >= 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + deliveryCharge + tax;

    const order = await Order.create({
      customer: req.user._id,
      seller: processedItems[0]?.seller,        // Required by model
      items: processedItems,
      deliveryAddress,
      orderType: 'retail',
      paymentMethod: 'online',
      paymentStatus: 'completed',
      paymentDetails: {
        transactionId: razorpay_payment_id,
        paymentGateway: 'razorpay',
        paidAt: new Date(),
      },
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      status: 'confirmed',
    });

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Notify sellers
    const sellerIds = [...new Set(processedItems.map(i => i.seller?.toString()).filter(Boolean))];
    for (const sellerId of sellerIds) {
      await Notification.create({
        user: sellerId,
        type: 'order_placed',
        title: 'New Order Received',
        message: `New paid order #${order.orderNumber} received`,
        relatedOrder: order._id,
        priority: 'high',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment verified and order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Create COD order directly (no Razorpay)
 * @route   POST /api/payment/cod
 * @access  Private (Customer)
 */
export const createCodOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!deliveryAddress?.fullName || !deliveryAddress?.phone ||
      !deliveryAddress?.addressLine1 || !deliveryAddress?.city ||
      !deliveryAddress?.state || !deliveryAddress?.pincode) {
      return res.status(400).json({ success: false, message: 'Complete delivery address is required' });
    }

    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product || !product.isActive || product.approvalStatus !== 'approved') {
        return res.status(400).json({ success: false, message: `Product unavailable: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        });
      }

      product.stock -= item.quantity;
      product.soldQuantity = (product.soldQuantity || 0) + item.quantity;
      await product.save();

      const price = product.pricing?.finalPrice || product.price || 0;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price,
        subtotal: itemTotal,
        seller: product.seller,
      });
    }

    const deliveryCharge = subtotal >= 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + deliveryCharge + tax;

    const order = await Order.create({
      customer: req.user._id,
      seller: processedItems[0]?.seller,        // Required by model
      items: processedItems,
      deliveryAddress,
      orderType: 'retail',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      status: 'pending',
    });

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Notify sellers
    const sellerIds = [...new Set(processedItems.map(i => i.seller?.toString()).filter(Boolean))];
    for (const sellerId of sellerIds) {
      await Notification.create({
        user: sellerId,
        type: 'order_placed',
        title: 'New COD Order',
        message: `New COD order #${order.orderNumber} received`,
        relatedOrder: order._id,
        priority: 'high',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully (Cash on Delivery)',
      data: order,
    });
  } catch (error) {
    console.error('COD order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing COD order',
      error: error.message,
    });
  }
};
