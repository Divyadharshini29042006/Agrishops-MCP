// backend/src/controllers/admin/dashboardController.js
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import WholesaleInquiry from '../../models/WholesaleInquiry.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ✅ OPTIMIZED: Combined aggregation for all dashboard stats
    const statsResult = await User.aggregate([
      {
        $facet: {
          userStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                pendingApprovals: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $in: ['$role', ['retailer', 'supplier']] },
                          { $eq: ['$isApproved', false] },
                          { $eq: ['$isActive', true] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                newThisMonth: {
                  $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] }
                },
                customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
                retailers: { $sum: { $cond: [{ $and: [{ $eq: ['$role', 'retailer'] }, { $eq: ['$isApproved', true] }] }, 1, 0] } },
                suppliers: { $sum: { $cond: [{ $and: [{ $eq: ['$role', 'supplier'] }, { $eq: ['$isApproved', true] }] }, 1, 0] } },
                admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    const productStatsResult = await Product.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $and: ['$isActive', { $eq: ['$approvalStatus', 'approved'] }] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $and: ['$isActive', { $eq: ['$approvalStatus', 'pending'] }] }, 1, 0] } },
                lowStock: { $sum: { $cond: [{ $and: ['$isActive', { $eq: ['$approvalStatus', 'approved'] }, { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }] }, 1, 0] } },
                newThisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    const orderStatsResult = await Order.aggregate([
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } },
                totalRevenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalAmount', 0] } },
                monthRevenue: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', thirtyDaysAgo] }, { $ne: ['$status', 'cancelled'] }] }, '$totalAmount', 0] } }
              }
            }
          ]
        }
      }
    ]);

    const inquiryStatsResult = await WholesaleInquiry.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    const uStats = statsResult[0].userStats[0] || {};
    const pStats = productStatsResult[0].stats[0] || {};
    const oStats = orderStatsResult[0].stats[0] || {};
    const iStats = inquiryStatsResult[0] || { total: 0, pending: 0, completed: 0 };

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: uStats.total || 0,
          active: uStats.active || 0,
          pendingApprovals: uStats.pendingApprovals || 0,
          byRole: {
            customers: uStats.customers || 0,
            retailers: uStats.retailers || 0,
            suppliers: uStats.suppliers || 0,
            admins: uStats.admins || 0
          },
          newThisMonth: uStats.newThisMonth || 0
        },
        products: {
          total: pStats.total || 0,
          active: pStats.active || 0,
          pending: pStats.pending || 0,
          lowStock: pStats.lowStock || 0,
          newThisMonth: pStats.newThisMonth || 0
        },
        orders: {
          total: oStats.total || 0,
          pending: oStats.pending || 0,
          completed: oStats.completed || 0,
          thisMonth: oStats.thisMonth || 0
        },
        revenue: {
          total: oStats.totalRevenue || 0,
          thisMonth: oStats.monthRevenue || 0
        },
        wholesale: {
          total: iStats.total || 0,
          pending: iStats.pending || 0,
          completed: iStats.completed || 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get recent activity
 * @route   GET /api/admin/dashboard/activity
 * @access  Private (Admin only)
 */
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Recent user registrations
    const recentUsers = await User.find()
      .select('name email role createdAt isApproved')
      .sort('-createdAt')
      .limit(Number(limit));

    // Recent products
    const recentProducts = await Product.find()
      .select('name seller category approvalStatus createdAt')
      .populate('seller', 'name')
      .populate('category', 'name')
      .sort('-createdAt')
      .limit(Number(limit));

    // Recent orders
    const recentOrders = await Order.find()
      .select('orderNumber customer totalAmount status createdAt')
      .populate('customer', 'name email')
      .sort('-createdAt')
      .limit(Number(limit));

    // Recent wholesale inquiries
    const recentInquiries = await WholesaleInquiry.find()
      .select('inquiryNumber customer product status createdAt')
      .populate('customer', 'name')
      .populate('product', 'name')
      .sort('-createdAt')
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: {
        recentUsers,
        recentProducts,
        recentOrders,
        recentInquiries
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
};

/**
 * @desc    Get sales analytics
 * @route   GET /api/admin/dashboard/analytics
 * @access  Private (Admin only)
 */
export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    // Daily revenue
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Populate product names
    await Product.populate(topProducts, { path: '_id', select: 'name images' });

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      period: `Last ${period} days`,
      data: {
        dailyRevenue,
        topProducts,
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales analytics',
      error: error.message
    });
  }
};

export default {
  getDashboardStats,
  getRecentActivity,
  getSalesAnalytics
};