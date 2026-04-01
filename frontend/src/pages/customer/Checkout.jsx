// frontend/src/pages/customer/Checkout.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft, HiShieldCheck, HiTruck, HiCreditCard,
  HiLocationMarker, HiUser, HiPhone, HiCheckCircle
} from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { cart, cartSubtotal, cartTax, cartTotal, loadCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (!loading && cart.length === 0) {
      // Don't redirect immediately — wait for cart to load
    }
  }, [cart, loading]);

  const deliveryCharge = cartSubtotal >= 500 ? 0 : 40;
  const orderTotal = cartSubtotal + cartTax + deliveryCharge;

  const validate = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Full name is required';
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.trim())) e.phone = 'Valid 10-digit phone is required';
    if (!address.addressLine1.trim()) e.addressLine1 = 'Address is required';
    if (!address.city.trim()) e.city = 'City is required';
    if (!address.state.trim()) e.state = 'State is required';
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) e.pincode = 'Valid 6-digit pincode is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildOrderItems = () =>
    cart.map(item => ({
      product: item.product?._id,
      quantity: item.quantity,
    }));

  const handleRazorpayPayment = async () => {
    try {
      setLoading(true);

      // 1. Get Razorpay key
      const keyRes = await api.get('payment/key');
      const razorpayKey = keyRes.data.key;

      // 2. Create Razorpay order on backend
      const orderRes = await api.post('payment/create-order', { amount: orderTotal });
      const razorpayOrder = orderRes.data.order;

      // 3. Open Razorpay checkout popup
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'AgriShop',
        description: 'Agricultural Products Order',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            // 4. Verify payment on backend → creates DB order
            const verifyRes = await api.post('payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                items: buildOrderItems(),
                deliveryAddress: address,
              },
            });

            if (verifyRes.data.success) {
              showSuccess('🎉 Payment successful! Order placed.');
              navigate('/orders');
            }
          } catch (err) {
            showError(err?.response?.data?.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email || '',
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showError('Payment cancelled');
          },
        },
      };

      // Load Razorpay SDK if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      showError(err?.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  const handleCodOrder = async () => {
    try {
      setLoading(true);
      const res = await api.post('payment/cod', {
        items: buildOrderItems(),
        deliveryAddress: address,
      });

      if (res.data.success) {
        showSuccess('✅ Order placed! Pay on delivery.');
        navigate('/orders');
      }
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) {
      showError('Your cart is empty');
      return;
    }
    if (paymentMethod === 'online') {
      handleRazorpayPayment();
    } else {
      handleCodOrder();
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  if (cart.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link to="/products" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-4 transition-colors">
            <HiArrowLeft className="w-5 h-5" /> Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left: Address + Payment ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <HiLocationMarker className="w-5 h-5 text-green-600" /> Delivery Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      className={inputClass('fullName')}
                      value={address.fullName}
                      onChange={e => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      className={inputClass('phone')}
                      value={address.phone}
                      onChange={e => setAddress({ ...address, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                    <input
                      className={inputClass('addressLine1')}
                      value={address.addressLine1}
                      onChange={e => setAddress({ ...address, addressLine1: e.target.value })}
                      placeholder="House No., Street, Area"
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      className={inputClass('addressLine2')}
                      value={address.addressLine2}
                      onChange={e => setAddress({ ...address, addressLine2: e.target.value })}
                      placeholder="Colony, Landmark (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      className={inputClass('city')}
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      placeholder="City"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      className={inputClass('state')}
                      value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      placeholder="State"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      className={inputClass('pincode')}
                      value={address.pincode}
                      onChange={e => setAddress({ ...address, pincode: e.target.value })}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <HiCreditCard className="w-5 h-5 text-green-600" /> Payment Method
                </h2>

                <div className="space-y-3">
                  {/* Online */}
                  <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMethod === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="mt-1 accent-green-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">Pay Online</span>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">RECOMMENDED</span>
                      </div>
                      <p className="text-sm text-gray-500">UPI, Credit/Debit Card, Net Banking via Razorpay</p>
                      <div className="flex items-center gap-2 mt-2">
                        <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-4 h-4" onError={e => e.target.style.display='none'} />
                        <span className="text-xs text-gray-400">Secured by Razorpay</span>
                        <HiShieldCheck className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </label>

                  {/* COD */}
                  <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-green-600"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Cash on Delivery</p>
                      <p className="text-sm text-gray-500">Pay when your order arrives at your doorstep</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1">
                  {cart.map(item => {
                    const price = item.product?.pricing?.finalPrice || 0;
                    const imgUrl = item.product?.images?.[0]?.url;
                    const fullImg = imgUrl
                      ? imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`
                      : '/placeholder.png';

                    return (
                      <div key={item._id} className="flex items-center gap-3">
                        <img src={fullImg} alt={item.product?.name} className="w-12 h-12 object-contain rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product?.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">₹{(price * item.quantity).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span><span>₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>GST (5%)</span><span>₹{cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery</span>
                    <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                      {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-green-600">₹{orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={loading || cart.length === 0}
                  className="w-full mt-5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    paymentMethod === 'online'
                      ? `Pay ₹${orderTotal.toFixed(2)} Online`
                      : `Place COD Order • ₹${orderTotal.toFixed(2)}`
                  )}
                </button>

                {/* Trust badges */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <HiShieldCheck className="w-4 h-4 text-green-500" />
                    <span>100% Safe & Secure Payments</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <HiTruck className="w-4 h-4 text-green-500" />
                    <span>Free delivery on orders above ₹500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
