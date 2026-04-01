// frontend/src/pages/admin/ProductModeration.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiEye, HiShoppingBag, HiCurrencyRupee } from 'react-icons/hi';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';

const ProductModeration = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products/pending');
      setPendingProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending products:', error);
      alert('Failed to load pending products');
    } finally {
      setLoading(false);
      setCurrentPage(1); // Reset to first page when data changes
    }
  };

  const handleApprove = async (productId) => {
    if (!confirm('Are you sure you want to approve this product?')) return;

    try {
      setProcessing(true);
      await api.put(`/admin/products/${productId}/approve`);
      alert('Product approved successfully!');
      fetchPendingProducts();
      setShowModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (productId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setProcessing(true);
      await api.put(`/admin/products/${productId}/reject`, { reason });
      alert('Product rejected');
      fetchPendingProducts();
      setShowModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

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
            {t('admin.productModeration')}
          </h1>
          <p className="text-gray-600">
            Review and approve new product listings
          </p>
        </div>

        {/* Pending Count */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <HiShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingProducts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {pendingProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Products Reviewed!
            </h3>
            <p className="text-gray-600">
              No pending product listings to moderate
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingProducts
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* ✅ FIXED: Product Image */}
                <div className="relative h-48 bg-gray-200">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0].url || product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', product.images[0]);
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <HiShoppingBag className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Pending
                  </span>
                </div>

                {/* Product Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      {product.category?.main?.name || product.category?.name || 'Uncategorized'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <HiCurrencyRupee className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-bold text-gray-900">
                      {product.pricing?.basePrice || product.price || 0}
                    </span>
                    <span className="text-sm text-gray-600">
                      / {product.unit}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-4">
                    <p><strong>Seller:</strong> {product.seller?.name || 'Unknown'}</p>
                    <p><strong>Submitted:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <HiEye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleApprove(product._id)}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
                    >
                      <HiCheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(product._id)}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
                    >
                      <HiXCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination UI */}
        {pendingProducts.length > itemsPerPage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, pendingProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{pendingProducts.length}</span> products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              {Array.from({ length: Math.ceil(pendingProducts.length / itemsPerPage) }, (_, i) => i + 1)
                .filter(p => p === 1 || p === Math.ceil(pendingProducts.length / itemsPerPage) || Math.abs(p - currentPage) <= 1)
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
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(pendingProducts.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(pendingProducts.length / itemsPerPage)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ✅ FIXED: Product Detail Modal */}
        {showModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Product Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <HiXCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedProduct.images?.[0]?.url || selectedProduct.images?.[0] || 'https://via.placeholder.com/600x400?text=No+Image'}
                      alt={selectedProduct.name}
                      className="w-full rounded-lg"
                      onError={(e) => {
                        console.error('Modal image failed to load:', selectedProduct.images?.[0]);
                        e.target.src = 'https://via.placeholder.com/600x400?text=Image+Error';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{selectedProduct.name}</h3>
                    <p className="text-2xl font-bold text-green-600 mb-4">
                      ₹{selectedProduct.pricing?.basePrice || selectedProduct.price || 0} / {selectedProduct.unit}
                    </p>
                    <p className="text-gray-700 mb-4">{selectedProduct.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>Category:</strong> {selectedProduct.category?.main?.name || selectedProduct.category?.name || 'N/A'}</p>
                      <p><strong>Stock:</strong> {selectedProduct.stock}</p>
                      <p><strong>Seller:</strong> {selectedProduct.seller?.name}</p>
                      <p><strong>Seller Email:</strong> {selectedProduct.seller?.email}</p>
                      {selectedProduct.expiryDate && (
                        <p><strong>Expiry:</strong> {new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleApprove(selectedProduct._id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve Product
                  </button>
                  <button
                    onClick={() => handleReject(selectedProduct._id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModeration;