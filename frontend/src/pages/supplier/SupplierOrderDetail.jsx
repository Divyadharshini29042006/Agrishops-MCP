// frontend/src/pages/supplier/SupplierOrderDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiCheckCircle,
  HiClock,
  HiTruck,
  HiUser,
  HiLocationMarker,
  HiPhone,
  HiMail,
  HiCurrencyRupee,
  HiX,
  HiDocumentText,
  HiRefresh,
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const SupplierOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/supplier/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showError('Failed to load order details');
      navigate('/supplier/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      showError('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      await api.patch(`/supplier/orders/${id}/status`, {
        status: selectedStatus,
      });

      showSuccess('Order status updated successfully');
      setShowUpdateModal(false);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      showError(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setUpdating(true);
      await api.patch(`/supplier/orders/${id}/status`, {
        status: 'cancelled',
      });

      showSuccess('Order cancelled successfully');
      setShowCancelModal(false);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || colors.pending;
  };

  const getProgressPercentage = (status) => {
    const progress = {
      pending: 0,
      confirmed: 25,
      processing: 50,
      shipped: 75,
      delivered: 100,
      cancelled: 0,
    };
    return progress[status] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Link
            to="/supplier/orders"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const canUpdateStatus = order.status !== 'delivered' && order.status !== 'cancelled';
  const canCancelOrder = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/supplier/orders"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back to Orders
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
            </div>
            <button
              onClick={fetchOrderDetails}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <HiRefresh className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Order Status Card */}
        <div className="bg-indigo-700 rounded-2xl shadow-sm p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-2">Current Status</p>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(order.status)} bg-white ring-4 ring-indigo-500/20`}>
                  {order.status.toUpperCase()}
                </span>
                <span className="text-3xl">
                  {order.status === 'delivered' ? '✨' : order.status === 'cancelled' ? '🛑' : '🕒'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold mb-2">Order Type</p>
              <p className="text-2xl font-black tracking-tight">{order.orderType?.toUpperCase()}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {order.status !== 'cancelled' && (
            <div className="mt-8">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-indigo-200 font-bold mb-3">
                <span>Pending</span>
                <span>Confirmed</span>
                <span>Processing</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 p-1">
                <div
                  className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${getProgressPercentage(order.status)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-6 py-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <HiDocumentText className="w-5 h-5 text-indigo-400" />
                  </div>
                  Order Items
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Qty: <strong>{item.quantity}</strong></span>
                          <span>×</span>
                          <span>₹{item.price?.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(item.quantity * item.price)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{order.totalAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Amount</span>
                    <span className="text-blue-600">₹{order.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-600 px-6 py-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <HiCurrencyRupee className="w-5 h-5" />
                  </div>
                  Payment Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {order.paymentMethod === 'cod' 
                        ? '💵 Cash on Delivery' 
                        : (order.paymentDetails?.paymentGateway === 'razorpay' ? '💳 Razorpay Payment' : '💳 Stripe Payment')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                  {(order.stripePaymentId || order.paymentDetails?.transactionId) && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                      <p className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                        {order.stripePaymentId || order.paymentDetails?.transactionId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-indigo-600 px-6 py-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <HiUser className="w-5 h-5" />
                  </div>
                  Customer Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{order.customer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <HiMail className="w-4 h-4" />
                    Email
                  </p>
                  <p className="text-gray-900">{order.customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <HiPhone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="text-gray-900">{order.customer?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer Type</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {order.customer?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-amber-600 px-6 py-5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <HiLocationMarker className="w-5 h-5" />
                    </div>
                    Delivery Address
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-900 leading-relaxed">
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                    <br />
                    {order.shippingAddress.pincode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-4">
              <h2 className="text-sm uppercase tracking-wider font-bold text-slate-400 mb-4">Available Actions</h2>

              {canUpdateStatus && (
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-[0.98]"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Update Order Status
                </button>
              )}

              {canCancelOrder && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
                >
                  <HiX className="w-5 h-5" />
                  Cancel This Order
                </button>
              )}

              {!canUpdateStatus && !canCancelOrder && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium text-sm">
                    {order.status === 'delivered'
                      ? '✨ This order has been completed.'
                      : '🛑 This order was cancelled.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Order Status</h3>
            <p className="text-gray-600 mb-4">
              Select the new status for order #{order.orderNumber}
            </p>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            >
              <option value="">Select Status</option>
              {order.status === 'pending' && (
                <>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                </>
              )}
              {order.status === 'processing' && (
                <>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </>
              )}
              {order.status === 'shipped' && (
                <option value="delivered">Delivered</option>
              )}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !selectedStatus}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel order #{order.orderNumber}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={updating}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrderDetails;