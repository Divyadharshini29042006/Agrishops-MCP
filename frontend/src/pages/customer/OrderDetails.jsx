// frontend/src/pages/customer/OrderDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft, HiCheckCircle, HiClock, HiTruck, HiXCircle,
  HiLocationMarker, HiPhone, HiUser, HiShoppingBag, HiRefresh,
  HiCurrencyRupee, HiDocumentText, HiChevronRight
} from 'react-icons/hi';
import api from '../../services/api';
import useToast from '../../hooks/useToast';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showError('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      await api.delete(`/orders/${id}`);
      showSuccess('Order cancelled successfully');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: HiClock, text: 'Pending', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
      confirmed: { icon: HiCheckCircle, text: 'Confirmed', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
      processing: { icon: HiTruck, text: 'Processing', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
      shipped: { icon: HiTruck, text: 'Shipped', color: 'indigo', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
      delivered: { icon: HiCheckCircle, text: 'Delivered', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
      cancelled: { icon: HiXCircle, text: 'Cancelled', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
          <HiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link to="/orders" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
            <HiArrowLeft className="w-5 h-5" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors py-2">
            <HiArrowLeft className="w-5 h-5" /> Back to Orders
          </Link>
          <button 
            onClick={fetchOrderDetails}
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            title="Refresh details"
          >
            <HiRefresh className="w-5 h-5" />
          </button>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-green-600 to-green-700 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-green-100 text-sm uppercase tracking-wider font-semibold mb-1">Order Number</p>
                <h1 className="text-3xl font-black">{order.orderNumber}</h1>
                <p className="text-green-100 mt-1 text-sm">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl text-sm font-bold border-2 bg-white ${statusConfig.textColor} ${statusConfig.borderColor} shadow-lg`}>
                  {statusConfig.text.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Delivery Address */}
              <div>
                <h2 className="text-gray-900 font-bold flex items-center gap-2 mb-4">
                  <HiLocationMarker className="text-green-600 w-5 h-5" /> Delivery Address
                </h2>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">{order.deliveryAddress.fullName}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.deliveryAddress.addressLine1}
                    {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                    <br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                    <br />
                    <span className="flex items-center gap-1 mt-2 font-medium">
                      <HiPhone className="w-4 h-4" /> {order.deliveryAddress.phone}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h2 className="text-gray-900 font-bold flex items-center gap-2 mb-4">
                  <HiCurrencyRupee className="text-green-600 w-5 h-5" /> Payment Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>GST (5%)</span>
                    <span>₹{order.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Delivery Charge</span>
                    <span className={order.deliveryCharge === 0 ? 'text-green-600 font-bold' : ''}>
                      {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge?.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-green-600 text-xl">₹{order.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-gray-400 font-medium">
                    <span>Method: <span className="uppercase text-gray-600">{order.paymentMethod}</span></span>
                    <span>Status: <span className="uppercase text-gray-600">{order.paymentStatus}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-gray-900 font-bold flex items-center gap-2">
              <HiDocumentText className="text-green-600 w-5 h-5" /> Items ({order.items?.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item, index) => (
              <div key={index} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  <img
                    src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Retail Product</p>
                  <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{item.productName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Qty: <strong className="text-gray-800">{item.quantity}</strong></span>
                    <span>Price: <strong className="text-gray-800">₹{item.price?.toFixed(2)}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{item.subtotal?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Actions */}
        {order.status === 'pending' && (
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl border-2 border-red-50 font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <HiXCircle className="w-5 h-5" />
              {cancelling ? 'Cancelling...' : 'Cancel This Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
