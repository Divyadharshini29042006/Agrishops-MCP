// backend/src/controllers/reviewController.js
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * @desc    Create new review for an order
 * @route   POST /api/reviews
 * @access  Private (Customer)
 */
export const createReview = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, rating, comment } = req.body;

    // 1. Validate order exists and belongs to user
    const order = await Order.findById(orderId).populate('seller');
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Unauthorized to rate this order' });
    }

    // 2. Validate order status is delivered
    if (order.status !== 'delivered') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted after delivery' });
    }

    // 3. Check if already rated
    if (order.isRated) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order already reviewed' });
    }

    // 4. Determine target (retailer or supplier)
    const targetType = order.orderType === 'wholesale' ? 'supplier' : 'retailer';
    const targetId = order.seller._id;

    // 5. Create review
    const review = await Review.create([{
      userId: req.user._id,
      orderId,
      targetType,
      targetId,
      rating,
      comment
    }], { session });

    // 6. Update order status
    order.isRated = true;
    await order.save({ session });

    // 7. Update target seller rating stats
    const seller = await User.findById(targetId);
    if (seller) {
      const totalReviews = (seller.stats.totalReviews || 0) + 1;
      const currentAvg = seller.stats.avgRating || 0;
      
      // New average formula: ((oldAvg * oldTotal) + newRating) / newTotal
      const newAvg = ((currentAvg * (totalReviews - 1)) + rating) / totalReviews;
      
      seller.stats.totalReviews = totalReviews;
      seller.stats.avgRating = Number(newAvg.toFixed(1));
      await seller.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review[0]
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Create Review Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all reviews for a specific retailer or supplier
 * @route   GET /api/reviews/target/:targetId
 * @access  Public
 */
export const getReviewsByTarget = async (req, res) => {
  try {
    const { targetId } = req.params;

    const reviews = await Review.find({ targetId })
      .populate('userId', 'name profileImage')
      .populate('orderId', 'orderNumber')
      .sort('-createdAt');

    // Calculate aggregate data for UI if needed
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;

    res.status(200).json({
      success: true,
      data: reviews,
      stats: {
        totalReviews,
        avgRating: Number(avgRating)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all reviews (Admin only)
 * @route   GET /api/reviews/admin/all
 * @access  Private (Admin)
 */
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find()
      .populate('userId', 'name email')
      .populate('targetId', 'name businessDetails.businessName role')
      .populate('orderId', 'orderNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments();

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createReview,
  getReviewsByTarget,
  getAllReviewsAdmin
};
