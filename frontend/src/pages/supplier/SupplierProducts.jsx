// frontend/src/pages/supplier/SupplierProducts.jsx - WITH IMAGE CAROUSEL
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlusCircle, HiPencil, HiTrash, HiEye, HiSearch,
  HiFilter, HiCheckCircle, HiClock, HiXCircle, HiChevronLeft, HiChevronRight
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const SupplierProducts = () => {
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mainCategoryFilter, setMainCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [typeCategoryFilter, setTypeCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, productId: null, productName: '' });
  const [detailsModal, setDetailsModal] = useState({ show: false, product: null });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New state to hold all system categories
  const [systemMainCategories, setSystemMainCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchMainCategories();
  }, []);

  const fetchMainCategories = async () => {
    try {
      const response = await api.get('/api/categories?level=main');
      setSystemMainCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching main categories:', error);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, statusFilter, mainCategoryFilter, subCategoryFilter, typeCategoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // ✅ Request all products (no pagination for supplier's own list)
      const response = await api.get('/api/products/my/products?limit=500');
      const data = response.data.data || response.data || [];
      console.log('Fetched products:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.approvalStatus === statusFilter);
    }

    if (mainCategoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.main?.name === mainCategoryFilter);
    }

    if (subCategoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.sub?.name === subCategoryFilter);
    }

    if (typeCategoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.type?.name === typeCategoryFilter);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDelete = async (productId) => {
    try {
      setDeleting(true);
      await api.delete(`/api/products/${productId}`);
      showSuccess('Product deleted successfully');
      setProducts(prev => prev.filter(p => p._id !== productId));
      setDeleteModal({ show: false, productId: null, productName: '' });
    } catch (error) {
      console.error('Error deleting product:', error);
      showError(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const openDetailsModal = (product) => {
    setDetailsModal({ show: true, product });
    setCurrentImageIndex(0); // Reset to first image
  };

  const nextImage = () => {
    if (detailsModal.product?.images) {
      setCurrentImageIndex((prev) =>
        prev === detailsModal.product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (detailsModal.product?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? detailsModal.product.images.length - 1 : prev - 1
      );
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: {
        icon: HiCheckCircle,
        text: 'Approved',
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      pending: {
        icon: HiClock,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      rejected: {
        icon: HiXCircle,
        text: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-200'
      }
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

  const statusCounts = {
    all: products.length,
    approved: products.filter(p => p.approvalStatus === 'approved').length,
    pending: products.filter(p => p.approvalStatus === 'pending').length,
    rejected: products.filter(p => p.approvalStatus === 'rejected').length,
  };

  // ✅ Derive filter options from ALL loaded products (now all 30+ are loaded)
  const mainCategories = Array.from(new Set(systemMainCategories.map(p => p.name).filter(Boolean))).sort();
  const subCategories = mainCategoryFilter === 'all'
    ? []
    : Array.from(new Set(
      products
        .filter(p => p.category?.main?.name === mainCategoryFilter)
        .map(p => p.category?.sub?.name)
        .filter(Boolean)
    )).sort();
  const typeCategories = subCategoryFilter === 'all'
    ? []
    : Array.from(new Set(
      products
        .filter(p => p.category?.main?.name === mainCategoryFilter && p.category?.sub?.name === subCategoryFilter)
        .map(p => p.category?.type?.name)
        .filter(Boolean)
    )).sort();

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || mainCategoryFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600 mt-1">Manage your product listings</p>
          </div>
          <Link
            to="/supplier/products/add"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <HiPlusCircle className="w-5 h-5" />
            Add New Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'All Products', value: statusCounts.all, filter: 'all', color: 'blue' },
            { label: 'Approved', value: statusCounts.approved, filter: 'approved', color: 'green' },
            { label: 'Pending', value: statusCounts.pending, filter: 'pending', color: 'yellow' },
            { label: 'Rejected', value: statusCounts.rejected, filter: 'rejected', color: 'red' },
          ].map((stat) => (
            <button
              key={stat.filter}
              onClick={() => setStatusFilter(stat.filter)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${statusFilter === stat.filter
                ? `border-${stat.color}-600 bg-${stat.color}-50`
                : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${statusFilter === stat.filter ? `text-${stat.color}-600` : 'text-gray-900'
                }`}>
                {stat.value}
              </p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <div className="w-full md:w-40">
                <div className="relative">
                  <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={mainCategoryFilter}
                    onChange={(e) => {
                      setMainCategoryFilter(e.target.value);
                      setSubCategoryFilter('all');
                      setTypeCategoryFilter('all');
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white text-sm"
                  >
                    <option value="all">Main Categories</option>
                    {mainCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {mainCategoryFilter !== 'all' && subCategories.length > 0 && (
                <div className="w-full md:w-40">
                  <select
                    value={subCategoryFilter}
                    onChange={(e) => {
                      setSubCategoryFilter(e.target.value);
                      setTypeCategoryFilter('all');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white text-sm"
                  >
                    <option value="all">Sub Categories</option>
                    {subCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {subCategoryFilter !== 'all' && typeCategories.length > 0 && (
                <div className="w-full md:w-40">
                  <select
                    value={typeCategoryFilter}
                    onChange={(e) => setTypeCategoryFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white text-sm"
                  >
                    <option value="all">Types</option>
                    {typeCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="w-full md:w-40">
              <div className="relative">
                <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <HiPlusCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding your first product to the catalog'
                }
              </p>
              {!hasActiveFilters && (
                <Link
                  to="/supplier/products/add"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <HiPlusCircle className="w-5 h-5" />
                  Add Your First Product
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.images?.[0]?.url || product.images?.[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          ₹{product.pricing?.basePrice || product.price || 0}
                        </p>
                        <p className="text-sm text-gray-500">per {product.unit}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                              <div key={i} className="flex items-center gap-1 group relative" title={`${v.size}: ${v.stock} bags`}>
                                <div className={`w-2 h-2 rounded-full ${v.isCritical ? 'bg-red-500 animate-pulse' :
                                    v.isLow ? 'bg-orange-500' :
                                      'bg-green-500'
                                  }`} />
                                <span className="text-[10px] text-gray-500 font-medium">{v.size}</span>

                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity">
                                  {v.stock} bags available
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(product.approvalStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-medium">{product.views || 0}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailsModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <HiEye className="w-5 h-5" />
                          </button>
                          <Link
                            to={`/supplier/products/edit/${product._id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <HiPencil className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal({
                              show: true,
                              productId: product._id,
                              productName: product.name
                            })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination UI */}
        {filteredProducts.length > itemsPerPage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1)
                .filter(p => p === 1 || p === Math.ceil(filteredProducts.length / itemsPerPage) || Math.abs(p - currentPage) <= 1)
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
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ✅ PRODUCT DETAILS MODAL WITH IMAGE CAROUSEL */}
        {detailsModal.show && detailsModal.product && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
                <button
                  onClick={() => setDetailsModal({ show: false, product: null })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiXCircle className="w-7 h-7" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* ✅ IMAGE CAROUSEL */}
                {detailsModal.product.images && detailsModal.product.images.length > 0 && (
                  <div className="relative">
                    {/* Main Image */}
                    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={detailsModal.product.images[currentImageIndex]?.url || detailsModal.product.images[currentImageIndex]}
                        alt={`${detailsModal.product.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/600x400?text=Image+Error';
                        }}
                      />

                      {/* Navigation Arrows (only show if multiple images) */}
                      {detailsModal.product.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                            title="Previous Image"
                          >
                            <HiChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                            title="Next Image"
                          >
                            <HiChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {detailsModal.product.images.length}
                      </div>
                    </div>

                    {/* Thumbnail Navigation (only show if multiple images) */}
                    {detailsModal.product.images.length > 1 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {detailsModal.product.images.map((image, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-gray-300 hover:border-blue-400'
                              }`}
                          >
                            <img
                              src={image.url || image}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/80?text=Error';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Basic Info */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{detailsModal.product.name}</h4>
                  <p className="text-gray-600">{detailsModal.product.description}</p>
                </div>

                {/* Pricing & Stock */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">Price</p>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{detailsModal.product.pricing?.basePrice || detailsModal.product.price || 0}
                    </p>
                    <p className="text-sm text-green-600">per {detailsModal.product.unit}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-1">Stock</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {detailsModal.product.stock}
                    </p>
                    <p className="text-sm text-blue-600">{detailsModal.product.unit} available</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-700 font-medium mb-1">Status</p>
                    <div className="mt-2">
                      {getStatusBadge(detailsModal.product.approvalStatus)}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 mb-3">Additional Information</h5>

                  {detailsModal.product.category?.main?.name && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-32">Category:</span>
                      <span className="text-sm text-gray-900">{detailsModal.product.category.main.name}</span>
                    </div>
                  )}

                  {detailsModal.product.brand && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-32">Brand:</span>
                      <span className="text-sm text-gray-900">{detailsModal.product.brand}</span>
                    </div>
                  )}

                  {detailsModal.product.seasons && detailsModal.product.seasons.length > 0 && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-32">Seasons:</span>
                      <span className="text-sm text-gray-900 capitalize">
                        {detailsModal.product.seasons.join(', ')}
                      </span>
                    </div>
                  )}

                  {detailsModal.product.usageType && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-32">Usage Type:</span>
                      <span className="text-sm text-gray-900 capitalize">{detailsModal.product.usageType}</span>
                    </div>
                  )}

                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Views:</span>
                    <span className="text-sm text-gray-900">{detailsModal.product.views || 0} views</span>
                  </div>

                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Created:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(detailsModal.product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
                <Link
                  to={`/supplier/products/edit/${detailsModal.product._id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Edit Product
                </Link>
                <button
                  onClick={() => setDetailsModal({ show: false, product: null })}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <HiTrash className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Product</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this product?
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-6">
                "{deleteModal.productName}"
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, productId: null, productName: '' })}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.productId)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierProducts;