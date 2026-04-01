// frontend/src/pages/customer/Cart.jsx - COMPLETE SHOPPING CART
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiShoppingCart, HiTrash, HiPlus, HiMinus, HiArrowLeft,
  HiShieldCheck, HiTruck, HiCreditCard
} from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const {
    cart,
    loading,
    loadCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    cartCount,
  } = useCart();

  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(prev => ({ ...prev, [itemId]: true }));
    await updateQuantity(itemId, newQuantity);
    setUpdating(prev => ({ ...prev, [itemId]: false }));
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(itemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Clear all items from cart?')) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showError('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  // Group cart items by seller
  const groupedCart = cart.reduce((groups, item) => {
    const sellerId = item.product?.seller?._id || 'unknown';
    const sellerName = item.product?.seller?.businessDetails?.businessName || 
                      item.product?.seller?.name || 
                      'Unknown Seller';
    const sellerRole = item.product?.seller?.role || 'seller';

    if (!groups[sellerId]) {
      groups[sellerId] = {
        sellerName,
        sellerRole,
        items: [],
        subtotal: 0,
      };
    }

    const itemSubtotal = (item.product?.pricing?.finalPrice || 0) * item.quantity;
    groups[sellerId].items.push(item);
    groups[sellerId].subtotal += itemSubtotal;

    return groups;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
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
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </h1>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 font-semibold text-sm"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">
                Looks like you haven't added anything to your cart yet. Start shopping!
              </p>
              <Link
                to="/products"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedCart).map(([sellerId, group]) => (
                <div key={sellerId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Seller Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          group.sellerRole === 'supplier'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {group.sellerRole === 'supplier' ? '🏭 SUPPLIER' : '💼 RETAILER'}
                        </span>
                        <span className="font-semibold text-gray-900">{group.sellerName}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        Subtotal: <span className="font-bold text-gray-900">₹{group.subtotal.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Items from this seller */}
                  <div className="divide-y divide-gray-200">
                    {group.items.map((item) => (
                      <div key={item._id} className="p-6">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <Link
                            to={`/products/${item.product?._id}`}
                            className="flex-shrink-0"
                          >
                            <img
                              src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                              alt={item.product?.name}
                              className="w-24 h-24 object-contain bg-gray-50 rounded-lg border border-gray-200"
                            />
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${item.product?._id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-green-600 line-clamp-2"
                            >
                              {item.product?.name}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.product?.brand && `Brand: ${item.product.brand}`}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              {/* Price */}
                              <div>
                                <p className="text-lg font-bold text-gray-900">
                                  ₹{item.product?.pricing?.finalPrice?.toFixed(2)}
                                </p>
                                {item.product?.pricing?.basePrice > item.product?.pricing?.finalPrice && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ₹{item.product?.pricing?.basePrice?.toFixed(2)}
                                  </p>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || updating[item._id]}
                                  className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <HiMinus className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="w-12 text-center font-semibold text-gray-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                  disabled={updating[item._id]}
                                  className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <HiPlus className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item._id)}
                                className="ml-auto text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove item"
                              >
                                <HiTrash className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Item Subtotal */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                Item Subtotal: <span className="font-bold text-gray-900">
                                  ₹{((item.product?.pricing?.finalPrice || 0) * item.quantity).toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-semibold">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>GST (18%)</span>
                    <span className="font-semibold">₹{cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Charges</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Proceed to Checkout
                </button>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <HiShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Safe and Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <HiTruck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Free Delivery on orders above ₹500</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <HiCreditCard className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">COD / UPI / Cards Accepted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continue Shopping CTA */}
        {cart.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Need more products?</h3>
            <p className="mb-4 opacity-90">Explore our wide range of agricultural products</p>
            <Link
              to="/products"
              className="inline-block bg-white text-green-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;