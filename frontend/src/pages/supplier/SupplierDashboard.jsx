// frontend/src/pages/supplier/SupplierDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCube, HiClipboardList, HiEye, HiClock, HiChatAlt2, HiPlusCircle, HiCheckCircle, HiTruck, HiStar
} from 'react-icons/hi';
import MerchantStockAlert from '../../components/MerchantStockAlert';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const SupplierDashboard = () => {
  const { user } = useAuth();
  const { showError } = useToast();

  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    alerts: {}
  });

  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('supplier/dashboard/stats');
      const dashboardStats = statsRes.data.data;

      setStats({
        totalProducts: dashboardStats.products.total,
        approvedProducts: dashboardStats.products.approved,
        pendingProducts: dashboardStats.products.pending,
        rejectedProducts: dashboardStats.products.rejected,
        totalOrders: dashboardStats.orders.total,
        totalRevenue: dashboardStats.revenue,
        pendingOrders: dashboardStats.orders.pending,
        alerts: dashboardStats.alerts,
        recentOrders: dashboardStats.recentOrders
      });

      const productsRes = await api.get('products/my/products?limit=5');
      const products = productsRes.data.data || productsRes.data || [];
      setRecentProducts(products);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: HiCube,
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Approved Products',
      value: stats.approvedProducts,
      icon: HiCheckCircle,
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingProducts,
      icon: HiClock,
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: HiClipboardList,
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Avg Rating',
      value: user?.stats?.avgRating?.toFixed(1) || '0.0',
      icon: HiStar,
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/supplier/reviews'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your products and business</p>
        </div>

        {/* Pending Orders Alert */}
        {stats.pendingOrders > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-start">
              <HiClock className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-red-800">
                  {stats.pendingOrders} New Order{stats.pendingOrders !== 1 ? 's' : ''} Pending!
                </h3>
                <Link to="/supplier/orders?status=pending" className="text-sm font-bold text-red-800 underline mt-2 inline-block">
                  Process Orders Now →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alerts */}
        <div className="space-y-4 mb-8">
          <MerchantStockAlert
            products={stats.alerts?.criticalStockProducts}
            type="critical"
            role="supplier"
          />
          <MerchantStockAlert
            products={stats.alerts?.lowStockProducts}
            type="low"
            role="supplier"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgLight} p-3 rounded-lg`}>
                    <Icon className={`w-8 h-8 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/supplier/products/add" className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-all">
              <HiPlusCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">Add Product</p>
                <p className="text-sm opacity-80 text-white">Create listing</p>
              </div>
            </Link>
            <Link to="/supplier/products" className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-all">
              <HiCube className="w-6 h-6" />
              <div>
                <p className="font-semibold">My Products</p>
                <p className="text-sm opacity-80 text-white">Manage inventory</p>
              </div>
            </Link>
            <Link to="/supplier/orders" className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-all">
              <HiClipboardList className="w-6 h-6" />
              <div>
                <p className="font-semibold">Orders</p>
                <p className="text-sm opacity-80 text-white">Track shipments</p>
              </div>
            </Link>
            <Link to="/supplier/wholesale-inquiries" className="flex items-center gap-3 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-all">
              <HiChatAlt2 className="w-6 h-6" />
              <div>
                <p className="font-semibold">Inquiries</p>
                <p className="text-sm opacity-80 text-white">Bulk requests</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/supplier/orders" className="text-blue-600 hover:underline text-sm font-medium">View All</Link>
            </div>
            {stats.recentOrders?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map(order => (
                  <Link key={order._id} to={`/supplier/orders/${order._id}`} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all">
                    <div className={`p-2 rounded-lg ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                      {order.status === 'pending' ? <HiClock className="w-5 h-5" /> : <HiTruck className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="font-bold text-gray-900 truncate">{order.orderNumber}</p>
                        <p className="font-bold text-gray-900 truncate">₹{order.totalAmount}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{order.customer?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            )}
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Products</h2>
              <Link to="/supplier/products" className="text-blue-600 hover:underline text-sm font-medium">View All</Link>
            </div>
            {recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map(product => (
                  <div key={product._id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                    <img src={product.images?.[0]?.url || '/placeholder.png'} alt="" className="w-12 h-12 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-gray-500">₹{product.price} • Stock: {product.stockSummary}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${product.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {product.approvalStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No products yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;