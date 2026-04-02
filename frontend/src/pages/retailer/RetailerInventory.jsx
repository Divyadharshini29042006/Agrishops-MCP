// frontend/src/pages/retailer/RetailerInventory.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HiSearch, HiFilter, HiPencil, HiExclamationCircle,
  HiClock, HiCheckCircle, HiTrendingDown, HiRefresh,
  HiPlus, HiMinus, HiX
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';

const RetailerInventory = () => {
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [editStockModal, setEditStockModal] = useState({ show: false, product: null });
  const [stockQuantity, setStockQuantity] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    fetchInventory();
  }, [statusFilter, searchQuery, sortBy, page]);

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (statusFilter !== 'all') {
      setSearchParams({ status: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/retailer/inventory', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery || undefined,
          sortBy,
          page,
          limit: LIMIT,
        },
      });
      setProducts(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalProducts(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const openEditStockModal = (product) => {
    setEditStockModal({ show: true, product });
    setStockQuantity(product.stock);
  };

  const closeEditStockModal = () => {
    setEditStockModal({ show: false, product: null });
    setStockQuantity(0);
  };

  const handleUpdateStock = async (operation) => {
    try {
      setUpdating(true);
      const product = editStockModal.product;

      await api.put(`/api/retailer/inventory/${product._id}/stock`, {
        quantity: stockQuantity,
        operation, // 'set' or 'add'
      });

      showSuccess('Stock updated successfully');
      fetchInventory();
      closeEditStockModal();
    } catch (error) {
      console.error('Error updating stock:', error);
      showError(error.response?.data?.message || 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  const getExpiryStatus = (product) => {
    if (!product.hasExpiry || !product.expiryDate) return null;

    const today = new Date();
    const expiryDate = new Date(product.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', daysLeft: 0, color: 'red' };
    } else if (daysLeft <= 3) {
      return { status: 'critical', daysLeft, color: 'red' };
    } else if (daysLeft <= 7) {
      return { status: 'warning', daysLeft, color: 'orange' };
    }
    return { status: 'ok', daysLeft, color: 'green' };
  };

  const statusFilters = [
    { label: 'All Products', value: 'all', icon: HiCheckCircle },
    { label: 'Low Stock', value: 'low_stock', icon: HiTrendingDown },
    { label: 'Expiring Soon', value: 'expiring', icon: HiClock },
    { label: 'Expired', value: 'expired', icon: HiExclamationCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Inventory</h1>
            <p className="text-gray-600 mt-1">Manage your product stock</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchInventory}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <HiRefresh className="w-5 h-5" />
              Refresh
            </button>
            <Link
              to="/retailer/suppliers/products"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              <HiPlus className="w-5 h-5" />
              Buy from Suppliers
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${statusFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Sort */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="md:w-64">
              <div className="relative">
                <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                >
                  <option value="created_desc">Newest First</option>
                  <option value="stock_asc">Stock: Low to High</option>
                  <option value="stock_desc">Stock: High to Low</option>
                  <option value="expiry_asc">Expiry: Soonest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <HiCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by purchasing products from suppliers'}
            </p>
            <Link
              to="/retailer/suppliers/products"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <HiPlus className="w-5 h-5" />
              Browse Supplier Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Expiry
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
                  {products.map((product) => {
                    const expiryStatus = getExpiryStatus(product);
                    const isLowStock = product.isLowStock;

                    return (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={getPublicImageUrl(product.images?.[0]?.url) || '/placeholder-product.png'}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {product.category?.main?.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            ₹{product.pricing?.finalPrice || product.price || 0}
                          </p>
                          <p className="text-sm text-gray-500">per {product.unit}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <div className="flex flex-col gap-1">
                            {/* Overall Badge */}
                            <div className="flex items-center mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${product.isCriticalStock ? 'bg-red-100 text-red-700' :
                                  product.isLowStock ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {product.isCriticalStock ? 'Critical' : product.isLowStock ? 'Low Stock' : 'In Stock'}
                              </span>
                            </div>

                            {/* Per-variant Dots */}
                            <div className="flex flex-wrap gap-2">
                              {product.variantStockStatus?.map((v, i) => (
                                <div key={i} className="flex items-center gap-1 group relative" title={`${v.size}: ${v.stock} packets`}>
                                  <div className={`w-2 h-2 rounded-full ${v.isCritical ? 'bg-red-500 animate-pulse' :
                                      v.isLow ? 'bg-orange-500' :
                                        'bg-green-500'
                                    }`} />
                                  <span className="text-[10px] text-gray-500 font-medium">{v.size}</span>

                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">
                                    {v.stock} packets available
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.hasExpiry && expiryStatus ? (
                            <div>
                              <p className={`text-sm font-medium ${expiryStatus.status === 'expired' ? 'text-red-600' :
                                expiryStatus.status === 'critical' ? 'text-red-600' :
                                  expiryStatus.status === 'warning' ? 'text-orange-600' :
                                    'text-gray-900'
                                }`}>
                                {new Date(product.expiryDate).toLocaleDateString()}
                              </p>
                              {expiryStatus.status !== 'ok' && (
                                <p className={`text-xs mt-1 ${expiryStatus.status === 'expired' ? 'text-red-600' :
                                  expiryStatus.status === 'critical' ? 'text-red-600' :
                                    'text-orange-600'
                                  }`}>
                                  {expiryStatus.status === 'expired'
                                    ? 'Expired!'
                                    : `${expiryStatus.daysLeft} days left`
                                  }
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No expiry</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${product.approvalStatus === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : product.approvalStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            {product.approvalStatus === 'approved' ? (
                              <HiCheckCircle className="w-4 h-4" />
                            ) : (
                              <HiClock className="w-4 h-4" />
                            )}
                            {product.approvalStatus.charAt(0).toUpperCase() + product.approvalStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openEditStockModal(product)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            <HiPencil className="w-4 h-4" />
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalProducts)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{totalProducts}</span> products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
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
                      onClick={() => setPage(item)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === item
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Edit Stock Modal */}
        {editStockModal.show && editStockModal.product && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Update Stock</h3>
                <button
                  onClick={closeEditStockModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Product</p>
                <p className="font-semibold text-gray-900">{editStockModal.product.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Current Stock: {editStockModal.product.stock} {editStockModal.product.unit}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Stock Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStockQuantity(Math.max(0, stockQuantity - 10))}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <HiMinus className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => setStockQuantity(stockQuantity + 10)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <HiPlus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Click +/- for quick adjustments of 10 units
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStock('set')}
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {updating ? 'Updating...' : 'Set Stock'}
                </button>
                <button
                  onClick={closeEditStockModal}
                  disabled={updating}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerInventory;