// frontend/src/pages/admin/StockMonitor.jsx - COMPLETE FIX
import { useState, useEffect } from 'react';
import {
  HiExclamationCircle,
  HiExclamation,
  HiSearch,
  HiFilter,
  HiShoppingBag,
  HiClock,
  HiCheckCircle
} from 'react-icons/hi';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';

export default function StockMonitor() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hasExpiry: false,
    isLowStock: false
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`/admin/products?${params}`);

      if (response.data.success) {
        setProducts(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper: Get image URL with fallback
  const getProductImage = (product) => {
    if (!product.images || product.images.length === 0) {
      return '/placeholder-product.png';
    }

    const firstImage = product.images[0];

    // Handle different image formats
    if (typeof firstImage === 'string') {
      return firstImage;
    }

    return firstImage?.url || '/placeholder-product.png';
  };

  // ✅ Helper: Get category name with fallback
  const getCategoryName = (product) => {
    // Try different paths for category data
    if (product.categoryName) return product.categoryName;
    if (product.category?.main?.name) return product.category.main.name;
    if (product.category?.main) return 'Unknown Category';
    return 'N/A';
  };

  // ✅ Helper: Format expiry date
  const formatExpiryDate = (product) => {
    if (!product.hasExpiry || !product.expiryDate) {
      return 'N/A';
    }

    const expiry = new Date(product.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return <span className="text-red-600 font-semibold">Expired</span>;
    } else if (daysUntilExpiry <= 30) {
      return (
        <span className="text-orange-600 font-semibold">
          {expiry.toLocaleDateString()} ({daysUntilExpiry}d left)
        </span>
      );
    }

    return expiry.toLocaleDateString();
  };

  // ✅ Helper: Get stock status badge — uses backend isLowStock virtual (unit-aware)
  const getStockBadge = (product) => {
    const stock = product.stock || 0;

    if (stock === 0) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
          <HiExclamationCircle className="text-lg" />
          Out of Stock
        </span>
      );
    } else if (product.isLowStock) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1">
          <HiExclamation className="text-lg" />
          Low Stock
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
        <HiCheckCircle className="text-lg" />
        In Stock
      </span>
    );
  };

  // ✅ Helper: Get approval status badge
  const getApprovalBadge = (status) => {
    const badges = {
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: HiCheckCircle,
        label: 'Approved'
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: HiClock,
        label: 'Pending'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: HiExclamationCircle,
        label: 'Rejected'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} rounded-full text-sm font-medium flex items-center gap-1`}>
        <Icon className="text-lg" />
        {badge.label}
      </span>
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Monitor</h1>
          <p className="text-gray-600 mt-1">Track inventory, expiry dates, and product status</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Low Stock Filter */}
          <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.isLowStock}
              onChange={(e) => setFilters({ ...filters, isLowStock: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Low Stock Only</span>
          </label>

          {/* Expiry Filter */}
          <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filters.hasExpiry}
              onChange={(e) => setFilters({ ...filters, hasExpiry: e.target.checked })}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Has Expiry</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <HiShoppingBag className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    {/* Product Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={getPublicImageUrl(getProductImage(product))}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-product.png';
                          }}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getCategoryName(product)}
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.businessName || product.seller?.businessDetails?.businessName || 'Unknown'}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {product.stock || 0} {product.unit || 'units'}
                        </span>
                        {getStockBadge(product)}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₹{product.pricing?.finalPrice || product.price || 0}
                      </div>
                    </td>

                    {/* Expiry */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {formatExpiryDate(product)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApprovalBadge(product.approvalStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of{' '}
              <span className="font-medium">{pagination.total}</span> products
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}