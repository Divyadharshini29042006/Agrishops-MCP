// frontend/src/pages/retailer/RetailerOrders.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HiSearch, HiEye, HiCheckCircle, HiClock,
  HiTruck, HiXCircle, HiRefresh, HiShoppingBag, HiUserGroup
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import NewOrderNotification from '../../components/retailer/NewOrderNotification';

const RetailerOrders = () => {
  const { showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab state - 'received' or 'purchases'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'received');
  
  // Received Orders State (customers buying from me)
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [receivedCounts, setReceivedCounts] = useState({});
  
  // My Purchases State (me buying from suppliers)
  const [myPurchases, setMyPurchases] = useState([]);
  const [purchasesCounts, setPurchasesCounts] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();

    // Poll for new received orders every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'received') {
        checkForNewOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, statusFilter, searchQuery, currentPage]);

  useEffect(() => {
    // Update URL when filter or tab changes
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (activeTab !== 'received') params.tab = activeTab;
    setSearchParams(params);
  }, [statusFilter, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'received') {
        // Fetch orders from customers (I'm the seller)
        const response = await api.get('/api/retailer/orders', {
          params: {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: searchQuery || undefined,
            page: currentPage,
            limit: itemsPerPage
          },
        });
        setReceivedOrders(response.data.data);
        setReceivedCounts(response.data.counts);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || response.data.data.length);
        
        if (lastOrderCount === 0) {
          setLastOrderCount(response.data.counts.all);
        }
      } else {
        // Fetch orders I placed with suppliers (I'm the buyer)
        const response = await api.get('/api/retailer/purchases', {
          params: {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: searchQuery || undefined,
            page: currentPage,
            limit: itemsPerPage
          },
        });
        setMyPurchases(response.data.data);
        setPurchasesCounts(response.data.counts);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewOrders = async () => {
    try {
      const response = await api.get('/api/retailer/orders', {
        params: { status: 'pending', limit: 1 },
      });
      
      const currentCount = response.data.counts.all;
      
      if (currentCount > lastOrderCount) {
        const newOrder = response.data.data[0];
        setNewOrderNotification(newOrder);
        setLastOrderCount(currentCount);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: HiClock,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      confirmed: {
        icon: HiCheckCircle,
        text: 'Confirmed',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      processing: {
        icon: HiTruck,
        text: 'Processing',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
      },
      shipped: {
        icon: HiTruck,
        text: 'Shipped',
        className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      },
      delivered: {
        icon: HiCheckCircle,
        text: 'Delivered',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      cancelled: {
        icon: HiXCircle,
        text: 'Cancelled',
        className: 'bg-red-100 text-red-700 border-red-200',
      },
    };

    const badge = badges[status] || badges.pending;
    const IconComponent = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
        <IconComponent className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const statusFilters = [
    { label: 'All Orders', value: 'all', count: activeTab === 'received' ? receivedCounts.all : purchasesCounts.all },
    { label: 'Pending', value: 'pending', count: activeTab === 'received' ? receivedCounts.pending : purchasesCounts.pending },
    { label: 'Confirmed', value: 'confirmed', count: activeTab === 'received' ? receivedCounts.confirmed : purchasesCounts.confirmed },
    { label: 'Processing', value: 'processing', count: activeTab === 'received' ? receivedCounts.processing : purchasesCounts.processing },
    { label: 'Shipped', value: 'shipped', count: activeTab === 'received' ? receivedCounts.shipped : purchasesCounts.shipped },
    { label: 'Delivered', value: 'delivered', count: activeTab === 'received' ? receivedCounts.delivered : purchasesCounts.delivered },
    { label: 'Cancelled', value: 'cancelled', count: activeTab === 'received' ? receivedCounts.cancelled : purchasesCounts.cancelled },
  ];

  const currentOrders = activeTab === 'received' ? receivedOrders : myPurchases;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* New Order Notification */}
        {newOrderNotification && (
          <NewOrderNotification
            order={newOrderNotification}
            onClose={() => setNewOrderNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'received' 
                ? 'Manage orders from your customers' 
                : 'Track your purchases from suppliers'}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <HiRefresh className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Main Tabs - Received vs Purchases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('received');
                setStatusFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === 'received'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <HiUserGroup className="w-5 h-5" />
              Received Orders
              {receivedCounts.all > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'received' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {receivedCounts.all}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('purchases');
                setStatusFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
                activeTab === 'purchases'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <HiShoppingBag className="w-5 h-5" />
              My Purchases
              {purchasesCounts.all > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'purchases' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {purchasesCounts.all}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  statusFilter === filter.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === filter.value
                      ? 'bg-white/20'
                      : 'bg-white'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search by order number or ${activeTab === 'received' ? 'customer' : 'supplier'} name...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Orders List */}
        {currentOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <HiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : activeTab === 'received' 
                  ? 'Customer orders will appear here'
                  : 'Your supplier purchases will appear here'}
            </p>
            {activeTab === 'purchases' && (
              <Link
                to="/retailer/suppliers"
                className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <HiShoppingBag className="w-5 h-5" />
                Browse Suppliers
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      {activeTab === 'received' ? 'Customer' : 'Supplier'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentOrders.map((order) => {
                    const displayUser = activeTab === 'received' ? order.customer : order.seller;
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{order.orderType}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{displayUser?.name}</p>
                          <p className="text-xs text-gray-500">{displayUser?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{order.items?.length || 0} items</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">₹{order.totalAmount?.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{order.paymentMethod?.toUpperCase()}</p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/retailer/orders/${order._id}`}
                            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                          >
                            <HiEye className="w-4 h-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
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
                        ? 'bg-purple-600 text-white shadow-sm'
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
    </div>
  );
};

export default RetailerOrders;