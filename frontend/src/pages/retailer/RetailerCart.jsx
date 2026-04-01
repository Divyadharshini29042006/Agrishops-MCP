// frontend/src/pages/retailer/RetailerCart.jsx - WHOLESALE CART
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiShoppingCart, HiTrash, HiMinus, HiPlus, HiArrowLeft,
  HiCheckCircle, HiExclamationCircle, HiCreditCard, HiCash
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import { useCart } from '../../hooks/useCart';
import api from '../../services/api';

const RetailerCart = () => {
  const { cart, loading, updateQuantity: updateCartQuantity, removeFromCart, clearCart } = useCart();
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // Cart is automatically loaded by CartContext
  }, []);

  const handleQuantityUpdate = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const result = await updateCartQuantity(itemId, newQuantity);
    if (!result.success) {
      showToast(result.error || 'Failed to update quantity', 'error');
    }
  };

  const handleRemoveItem = async (itemId) => {
    const result = await removeFromCart(itemId);
    if (!result.success) {
      showToast(result.error || 'Failed to remove item', 'error');
    }
  };

  const handleCheckout = async () => {
    // Validate address
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode || !deliveryAddress.phone) {
      showToast('Please fill in all delivery address fields', 'error');
      return;
    }

    setProcessingCheckout(true);
    try {
      const response = await api.post('/retailer/orders', {
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        deliveryAddress,
        paymentMethod,
        totalAmount: calculateTotal()
      });

      if (response.data.success) {
        showToast('Order placed successfully!', 'success');
        await clearCart(); // Clear cart after successful order
        navigate('/retailer/orders');
      } else {
        showToast(response.data.message || 'Failed to place order', 'error');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      const errorMsg = error.response?.data?.message || 'Failed to place order';
      showToast(errorMsg, 'error');
    } finally {
      setProcessingCheckout(false);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/retailer/suppliers"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Wholesale Cart</h1>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <HiShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Browse supplier products to add items</p>
            <Link
              to="/retailer/suppliers"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Cart Items ({cart.length})
                </h2>

                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4 py-4 border-b last:border-b-0"
                  >
                    {/* Product Image */}
                    <img
                      src={item.product.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Supplier: {item.product.supplier?.businessName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Stock: {item.product.stock} units available
                      </p>
                      <p className="text-lg font-bold text-purple-600 mt-2">
                        ₹{item.product.price.toLocaleString()} / {item.product.unit}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleQuantityUpdate(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <HiMinus className="w-4 h-4 text-gray-700" />
                        </button>
                        <span className="font-semibold text-gray-900 min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityUpdate(item._id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <HiPlus className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                        >
                          <HiTrash className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.pincode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Pincode"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>GST (18%):</span>
                    <span className="font-semibold">₹{calculateTax().toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-purple-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <HiCash className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Cash on Delivery</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <HiCreditCard className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Online Payment</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processingCheckout}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingCheckout ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-2">
                    <HiExclamationCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <strong>Wholesale Order:</strong> This is a bulk purchase from suppliers.
                      Delivery may take 3-7 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerCart;