// frontend/src/pages/retailer/BrowseSupplierProducts.jsx
import { useState, useEffect } from 'react';
import {
  HiSearch, HiFilter, HiShoppingCart, HiX,
  HiCheckCircle, HiInformationCircle
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';

const BrowseSupplierProducts = () => {
  const { showSuccess, showError, showInfo } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [purchaseModal, setPurchaseModal] = useState({ show: false, product: null });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  // ✅ MONITOR QUANTITY FOR WHOLESALE HINT
  useEffect(() => {
    if (purchaseModal.show && purchaseModal.product) {
      const threshold = purchaseModal.product.bulkOrder?.minQuantity || 100;
      if (quantity >= threshold) {
        showInfo(
          `You're ordering ${quantity} ${purchaseModal.product.unit}. For better pricing on large volumes, try our Wholesale Inquiry system!`,
          { id: 'wholesale-hint' } // Prevent multiple toasts
        );
      }
    }
  }, [quantity, purchaseModal.show, purchaseModal.product]);

  useEffect(() => {
    fetchCategories();
    fetchSupplierProducts();
  }, [categoryFilter, searchQuery, priceRange]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSupplierProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/retailer/suppliers/products', {
        params: {
          category: categoryFilter || undefined,
          search: searchQuery || undefined,
          minPrice: priceRange.min || undefined,
          maxPrice: priceRange.max || undefined,
        },
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching supplier products:', error);
      showError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openPurchaseModal = (product) => {
    setPurchaseModal({ show: true, product });
    setQuantity(10); // Default bulk quantity
    setNotes('');
  };

  const closePurchaseModal = () => {
    setPurchaseModal({ show: false, product: null });
    setQuantity(1);
    setNotes('');
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      const product = purchaseModal.product;

      if (quantity > product.stock) {
        showError(`Only ${product.stock} ${product.unit} available in stock`);
        return;
      }

      const minQty = product.bulkMinQuantity || 100;
      if (quantity < minQty) {
        showError(`Wholesale orders require a minimum of ${minQty} ${product.unit}`);
        return;
      }

      await api.post('/api/retailer/purchase-from-supplier', {
        productId: product._id,
        quantity,
        notes,
      });

      showSuccess(`Purchase order created for ${quantity} ${product.unit} of ${product.name}!`);
      showInfo('The supplier will process your order soon. Check your orders page.');

      closePurchaseModal();
      fetchSupplierProducts(); // Refresh to update stock
    } catch (error) {
      console.error('Error creating purchase order:', error);
      showError(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setPurchasing(false);
    }
  };

  const calculateTotal = () => {
    if (!purchaseModal.product) return 0;
    return purchaseModal.product.pricing.finalPrice * quantity;
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buy from Suppliers</h1>
          <p className="text-gray-600 mt-1">Browse wholesale products and stock your inventory</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <HiInformationCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-800">Wholesale Pricing</h3>
              <p className="text-sm text-blue-700 mt-1">
                Purchase products in bulk from verified suppliers at wholesale prices.
                These products will be added to your inventory for retail sale.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <div className="relative">
                <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter(cat => cat.level === 'main')
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setPriceRange({ min: '', max: '' });
                }}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <HiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {searchQuery || categoryFilter
                ? 'Try adjusting your search or filters'
                : 'No supplier products available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={getPublicImageUrl(product.images?.[0]?.url) || '/placeholder-product.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.pricing?.hasOffer && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {product.pricing.discount}% OFF
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                    {product.name}
                  </h3>

                  {/* Supplier Info */}
                  <div className="flex items-center gap-2 mb-3">
                    {product.seller?.businessDetails?.brandLogo?.url ? (
                      <img
                        src={getPublicImageUrl(product.seller.businessDetails.brandLogo.url)}
                        alt={product.seller.name}
                        className="w-6 h-6 object-contain rounded"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {product.seller?.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600">
                      {product.seller?.businessDetails?.businessName || product.seller?.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {product.pricing?.hasOffer ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ₹{product.pricing.finalPrice}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.pricing.basePrice}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{product.pricing?.finalPrice || product.price}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">per {product.unit}</p>
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-600">
                      Stock: <span className="font-semibold">{product.stock}</span> {product.unit}
                    </span>
                    {product.category?.main?.name && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {product.category.main.name}
                      </span>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={() => openPurchaseModal(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <HiShoppingCart className="w-5 h-5" />
                    {product.stock === 0 ? 'Out of Stock' : 'Purchase Wholesale'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Purchase Modal */}
        {purchaseModal.show && purchaseModal.product && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-2xl font-bold text-gray-900">Purchase Order</h3>
                <button
                  onClick={closePurchaseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Product Info */}
                <div className="flex gap-4">
                  <img
                    src={getPublicImageUrl(purchaseModal.product.images?.[0]?.url) || '/placeholder-product.png'}
                    alt={purchaseModal.product.name}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {purchaseModal.product.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Supplier: {purchaseModal.product.seller?.businessDetails?.businessName || purchaseModal.product.seller?.name}
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{purchaseModal.product.pricing.finalPrice}
                      </span>
                      <span className="text-sm text-gray-500">per {purchaseModal.product.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity ({purchaseModal.product.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={purchaseModal.product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className={`text-xs mt-2 ${quantity < (purchaseModal.product.bulkMinQuantity || 100) ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    Minimum Wholesale: {purchaseModal.product.bulkMinQuantity || 100} {purchaseModal.product.unit} | Available: {purchaseModal.product.stock} {purchaseModal.product.unit}
                  </p>

                  {/* Wholesale Hint */}
                  {quantity >= (purchaseModal.product.bulkOrder?.minQuantity || 100) && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 flex items-start gap-2">
                      <HiInformationCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Buying in bulk?</p>
                        <p>Consider using our <strong>Wholesale Inquiry</strong> system to negotiate better prices directly with the supplier.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special requirements or notes..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price per {purchaseModal.product.unit}:</span>
                    <span className="font-semibold">₹{purchaseModal.product.pricing.finalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-semibold">{quantity} {purchaseModal.product.unit}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <HiInformationCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold mb-1">Purchase Order Information:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>This is a wholesale purchase from the supplier</li>
                        <li>Products will be added to your inventory after delivery</li>
                        <li>Payment terms will be discussed with the supplier</li>
                        <li>Delivery time depends on supplier processing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={closePurchaseModal}
                  disabled={purchasing}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || quantity > purchaseModal.product.stock || quantity < (purchaseModal.product.bulkMinQuantity || 100)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      Confirm Purchase
                    </>
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

export default BrowseSupplierProducts;