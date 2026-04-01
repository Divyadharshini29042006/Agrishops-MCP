// frontend/src/pages/admin/AdminDashboard.jsx - WITH PENDING APPROVAL ALERTS
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiUsers, 
  HiShoppingBag, 
  HiShoppingCart, 
  HiCurrencyRupee,
  HiClock,
  HiExclamationCircle,
  HiCheckCircle,
  HiTrendingUp,
  HiUserGroup,
  HiClipboardList,
  HiBell,
  HiArrowRight
} from 'react-icons/hi';
import api from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: {
      total: 0,
      active: 0,
      pendingApprovals: 0,
      byRole: {
        customers: 0,
        retailers: 0,
        suppliers: 0,
        admins: 0
      }
    },
    products: {
      total: 0,
      active: 0,
      pending: 0,
      lowStock: 0
    },
    orders: {
      total: 0,
      pending: 0,
      completed: 0
    },
    revenue: {
      total: 0,
      thisMonth: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 2 minutes to check for new approvals
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsRes = await api.get('/admin/dashboard/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // Fetch recent activity
      try {
        const activityRes = await api.get('/admin/dashboard/activity');
        if (activityRes.data.success) {
          // Combine all activity types
          const allActivity = [];
          
          // Add recent users
          activityRes.data.data.recentUsers?.forEach(user => {
            allActivity.push({
              type: 'user',
              title: user.isApproved ? 'New User Registered' : 'User Awaiting Approval',
              description: `${user.name} (${user.role})`,
              timestamp: user.createdAt,
              urgent: !user.isApproved
            });
          });

          // Add recent products
          activityRes.data.data.recentProducts?.forEach(product => {
            allActivity.push({
              type: 'product',
              title: product.approvalStatus === 'pending' ? 'Product Awaiting Approval' : 'New Product Listed',
              description: `${product.name} by ${product.seller?.name}`,
              timestamp: product.createdAt,
              urgent: product.approvalStatus === 'pending'
            });
          });

          // Add recent orders
          activityRes.data.data.recentOrders?.slice(0, 5).forEach(order => {
            allActivity.push({
              type: 'order',
              title: 'New Order Placed',
              description: `Order #${order.orderNumber} - ₹${order.totalAmount}`,
              timestamp: order.createdAt,
              urgent: false
            });
          });

          // Sort by timestamp
          allActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setRecentActivity(allActivity.slice(0, 10));
        }
      } catch (activityError) {
        console.error('Error fetching activity:', activityError);
      }

      // Fetch analytics
      try {
        const analyticsRes = await api.get('/admin/dashboard/analytics');
        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users?.total || 0,
      icon: <HiUsers className="w-8 h-8" />,
      color: 'bg-blue-500',
      link: '/admin/manage-users'
    },
    {
      title: 'Total Products',
      value: stats.products?.total || 0,
      icon: <HiShoppingBag className="w-8 h-8" />,
      color: 'bg-green-500',
      link: '/admin/products'
    },
    {
      title: 'Total Orders',
      value: stats.orders?.total || 0,
      icon: <HiShoppingCart className="w-8 h-8" />,
      color: 'bg-purple-500',
      link: '/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.revenue?.total?.toLocaleString() || 0}`,
      icon: <HiCurrencyRupee className="w-8 h-8" />,
      color: 'bg-yellow-500',
      link: '/admin/analytics'
    },
    {
      title: 'Pending Approvals',
      value: stats.users?.pendingApprovals || 0,
      icon: <HiClock className="w-8 h-8" />,
      color: 'bg-orange-500',
      link: '/admin/user-approval',
      badge: stats.users?.pendingApprovals > 0
    },
    {
      title: 'Low Stock Items',
      value: stats.products?.lowStock || 0,
      icon: <HiExclamationCircle className="w-8 h-8" />,
      color: 'bg-red-500',
      link: '/admin/stock-monitor'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, Admin! Here's what's happening today.
          </p>
        </div>

        {/* 🔥 PENDING APPROVAL ALERT BANNER */}
        {stats.users?.pendingApprovals > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg overflow-hidden animate-pulse-slow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-full p-3">
                    <HiBell className="w-8 h-8 text-orange-600 animate-bounce" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">
                      {stats.users.pendingApprovals} User{stats.users.pendingApprovals > 1 ? 's' : ''} Awaiting Approval!
                    </h3>
                    <p className="text-orange-100">
                      New {stats.users.pendingApprovals > 1 ? 'retailers/suppliers are' : 'retailer/supplier is'} waiting for your review
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/user-approval')}
                  className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  Review Now
                  <HiArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 PENDING PRODUCTS ALERT (Optional) */}
        {stats.products?.pending > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full p-2">
                    <HiShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-lg font-bold">
                      {stats.products.pending} Product{stats.products.pending > 1 ? 's' : ''} Pending Moderation
                    </h3>
                    <p className="text-sm text-blue-100">
                      Review new product listings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/product-moderation')}
                  className="bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  Review
                  <HiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-105 p-6 group relative"
            >
              {/* Badge for pending items */}
              {card.badge && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm animate-bounce">
                  {card.value}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.color} text-white p-4 rounded-lg group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Activity
              </h2>
              <HiClipboardList className="w-6 h-6 text-gray-400" />
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                      activity.urgent 
                        ? 'bg-orange-50 border-l-4 border-orange-500' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'product' ? 'bg-green-100 text-green-600' :
                      activity.type === 'order' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'user' && <HiUserGroup className="w-5 h-5" />}
                      {activity.type === 'product' && <HiShoppingBag className="w-5 h-5" />}
                      {activity.type === 'order' && <HiShoppingCart className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.urgent && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No recent activity
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>

            <div className="space-y-3">
              <Link
                to="/admin/user-approval"
                className={`flex items-center gap-3 p-4 rounded-lg transition-all group relative ${
                  stats.users?.pendingApprovals > 0
                    ? 'bg-orange-50 hover:bg-orange-100 ring-2 ring-orange-500'
                    : 'bg-orange-50 hover:bg-orange-100'
                }`}
              >
                {stats.users?.pendingApprovals > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    {stats.users.pendingApprovals} NEW
                  </span>
                )}
                <HiClock className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Pending Approvals
                  </p>
                  <p className="text-xs text-gray-600">
                    {stats.users?.pendingApprovals || 0} users waiting
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/product-moderation"
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group relative"
              >
                {stats.products?.pending > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {stats.products.pending}
                  </span>
                )}
                <HiCheckCircle className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Moderate Products
                  </p>
                  <p className="text-xs text-gray-600">
                    {stats.products?.pending || 0} pending review
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/stock-monitor"
                className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
              >
                <HiExclamationCircle className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-gray-600">
                    {stats.products?.lowStock || 0} items need attention
                  </p>
                </div>
              </Link>

              <Link
                to="/admin/manage-users"
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <HiUsers className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Manage Users
                  </p>
                  <p className="text-xs text-gray-600">
                    {stats.users?.total || 0} total users
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiTrendingUp className="w-6 h-6 text-green-600" />
              Sales Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.revenue?.thisMonth?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.revenue?.total?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.orders?.completed || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;