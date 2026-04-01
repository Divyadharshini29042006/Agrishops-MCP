// frontend/src/pages/customer/CustomerOrders.jsx - MODERN CLEAN DESIGN
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiSearch, HiTruck, HiCheckCircle, HiClock, HiXCircle, 
  HiRefresh, HiEye, HiShoppingBag, HiChevronRight
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import ReviewModal from '../../components/ReviewModal';


const CustomerOrders = () => {
  const { showError } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);


  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/my-orders', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined
        }
      });
      
      setOrders(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalItems(response.data.pagination?.total || (response.data.data?.length || 0));
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = (orderId) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId ? { ...order, isRated: true } : order
      )
    );
  };


  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: HiClock,
        text: 'Pending',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      },
      confirmed: {
        icon: HiCheckCircle,
        text: 'Confirmed',
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      },
      processing: {
        icon: HiTruck,
        text: 'Processing',
        color: 'purple',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200'
      },
      shipped: {
        icon: HiTruck,
        text: 'Shipped',
        color: 'indigo',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200'
      },
      delivered: {
        icon: HiCheckCircle,
        text: 'Delivered',
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      },
      cancelled: {
        icon: HiXCircle,
        text: 'Cancelled',
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      }
    };

    return configs[status] || configs.pending;
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        <IconComponent className="w-3.5 h-3.5" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 text-sm mt-1">View and track your order history</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by Order ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm appearance-none bg-white"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchOrders}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
            >
              <HiRefresh className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <HiShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No orders match your search criteria'
                  : 'Start shopping to see your orders here'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  <HiShoppingBag className="w-5 h-5" />
                  Start Shopping
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <Link
                        to={`/orders/${order._id}`}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm"
                      >
                        <HiEye className="w-4 h-4" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items?.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{item.subtotal?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <p className="text-sm text-gray-600">
                        +{order.items.length - 2} more item(s)
                      </p>
                    )}
                  </div>

                  {/* Order Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Amount</span>
                      <span className="text-xl font-bold text-gray-900">₹{order.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">Payment Method</span>
                      <span className="text-sm font-medium text-gray-900 uppercase">{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-4 flex gap-2">
                    {order.status === 'delivered' && (
                      order.isRated ? (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-lg font-bold text-sm shadow-sm transition-all duration-200">
                          <HiCheckCircle className="w-4 h-4" />
                          ✔ Reviewed
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleReviewClick(order)}
                          className="flex-1 px-4 py-2 bg-[#FFF3E0] text-[#EF6C00] border border-[#FFCC80] hover:shadow-md rounded-lg font-bold text-sm transition-all duration-200"
                        >
                          ⭐ Rate Now
                        </button>
                      )
                    )}
                    {order.status === 'shipped' && order.trackingNumber && (
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors">
                        Track Order
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors">
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{totalItems}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${currentPage === item
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={selectedOrder}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default CustomerOrders;