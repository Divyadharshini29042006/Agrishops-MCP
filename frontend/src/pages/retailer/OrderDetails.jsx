// frontend/src/pages/retailer/OrderDetails.jsx - WITH DELIVERY CONFIRMATION
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiArrowLeft, HiCheckCircle, HiClock, HiTruck, HiUser,
  HiLocationMarker, HiPhone, HiMail, HiCurrencyRupee,
  HiX, HiCash, HiCreditCard
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false); // ⭐ NEW
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [deliveryNote, setDeliveryNote] = useState(''); // ⭐ NEW

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/retailer/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is the seller
  const isSeller = () => {
    if (!order || !user) return false;
    return order.seller?._id === user._id || order.seller === user._id;
  };

  // Check if current user is the buyer
  const isBuyer = () => {
    if (!order || !user) return false;
    return order.customer?._id === user._id || order.customer === user._id;
  };

  // ⭐ NEW FUNCTION - Handle delivery confirmation by buyer (retailer)
  const handleConfirmDelivery = async () => {
    try {
      setUpdating(true);
      
      await api.patch(`/api/retailer/purchases/${id}/confirm-delivery`, {
        note: deliveryNote,
      });

      showSuccess('Order marked as delivered successfully!');
      setShowDeliveryModal(false);
      setDeliveryNote('');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      showError(error.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      
      await api.put(`/api/retailer/orders/${id}/status`, {
        status: newStatus,
        note: statusNote,
        trackingNumber: newStatus === 'shipped' ? trackingNumber : undefined,
      });

      showSuccess(`Order status updated to ${newStatus}`);
      setShowUpdateModal(false);
      setStatusNote('');
      setTrackingNumber('');
      setNewStatus('');
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
      
      await api.put(`/api/retailer/orders/${id}/status`, {
        status: 'cancelled',
        note: cancellationReason,
      });

      showSuccess('Order cancelled successfully');
      setShowCancelModal(false);
      setCancellationReason('');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'delivered',
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Confirm Order',
      confirmed: 'Start Processing',
      processing: 'Mark as Shipped',
      shipped: 'Mark as Delivered',
    };
    return labels[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ['pending', 'confirmed', 'processing', 'shipped'].includes(status);
  };

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed', 'processing'].includes(status);
  };

  // ⭐ NEW - Check if buyer can confirm delivery
  const canConfirmDelivery = () => {
    return isBuyer() && order.status === 'shipped';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      confirmed: 'blue',
      processing: 'purple',
      shipped: 'indigo',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: HiClock,
      confirmed: HiCheckCircle,
      processing: HiTruck,
      shipped: HiTruck,
      delivered: HiCheckCircle,
      cancelled: HiX,
    };
    return icons[status] || HiClock;
  };

  const getPaymentIcon = (method) => {
    const icons = {
      cod: HiCash,
      online: HiCreditCard,
      stripe: HiCreditCard,
      upi: HiCreditCard,
    };
    return icons[method] || HiCurrencyRupee;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HiX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h3>
          <Link
            to="/retailer/orders"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);
  const StatusIcon = getStatusIcon(order.status);
  const PaymentIcon = getPaymentIcon(order.paymentMethod);

  // Determine the display user (customer or seller based on role)
  const displayUser = isSeller() ? order.customer : order.seller;
  const displayUserLabel = isSeller() ? 'Customer' : 'Supplier';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            to="/retailer/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Orders</span>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isSeller() ? 'Order Details' : 'Purchase Details'}
              </h1>
              <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {/* Role Badge */}
              <div className="mt-2">
                {isSeller() ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300">
                    You are the SELLER
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
                    You are the BUYER
                  </span>
                )}
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`px-6 py-3 rounded-xl bg-${statusColor}-100 border-2 border-${statusColor}-300`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-6 h-6 text-${statusColor}-700`} />
                <span className={`text-lg font-bold text-${statusColor}-700 uppercase`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ NEW - Delivery Confirmation Alert for Buyers */}
        {canConfirmDelivery() && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HiTruck className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">
                  📦 Order Shipped - Awaiting Delivery Confirmation
                </h3>
                <p className="text-green-700 mb-4">
                  Your supplier has shipped this order. Once you receive the products, please confirm delivery below.
                </p>
                <button
                  onClick={() => setShowDeliveryModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Confirm Delivery Received
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Progress</h2>
          <div className="flex items-center justify-between">
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status, index, array) => {
              const isActive = array.indexOf(order.status) >= index;
              const isCurrent = order.status === status;
              const StatusIconComponent = getStatusIcon(status);
              
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent 
                        ? `bg-${statusColor}-600 border-${statusColor}-600`
                        : isActive
                        ? 'bg-green-600 border-green-600'
                        : 'bg-gray-200 border-gray-300'
                    }`}>
                      {isActive ? (
                        <StatusIconComponent className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-gray-500 font-bold">{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs font-semibold mt-2 capitalize ${
                      isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {status}
                    </p>
                  </div>
                  {index < array.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      array.indexOf(order.status) > index ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder-product.png'}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{item.productName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          ₹{item.price?.toFixed(2)} × {item.quantity} {item.product?.unit || 'unit'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                        <p className="text-xl font-bold text-gray-900">
                          ₹{item.subtotal?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-700">
                    <span className="text-sm">Subtotal</span>
                    <span className="font-semibold">₹{order.subtotal?.toFixed(2)}</span>
                  </div>
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="text-sm">Delivery Charge</span>
                      <span className="font-semibold">₹{order.deliveryCharge?.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="text-sm">GST (18%)</span>
                      <span className="font-semibold">₹{order.tax?.toFixed(2)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Discount</span>
                      <span className="font-semibold">- ₹{order.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-300 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                      <span className="text-3xl font-bold text-green-600">
                        ₹{order.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Status History</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.statusHistory.map((history, index) => {
                      const HistoryIcon = getStatusIcon(history.status);
                      return (
                        <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <HistoryIcon className="w-5 h-5 text-purple-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 capitalize">
                              {history.status.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(history.updatedAt).toLocaleString('en-IN')}
                            </p>
                            {history.note && (
                              <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                📝 {history.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer/Supplier Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`px-6 py-4 ${isSeller() ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HiUser className="w-5 h-5" />
                  {displayUserLabel} Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                  <p className="font-semibold text-gray-900 text-lg">{displayUser?.name}</p>
                </div>
                <div className="flex items-start gap-2">
                  <HiMail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm text-gray-900 break-all">{displayUser?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HiPhone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{displayUser?.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HiLocationMarker className="w-5 h-5" />
                  Delivery Address
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <p className="font-bold text-gray-900 text-lg">{order.deliveryAddress?.fullName}</p>
                  <p className="text-gray-700">{order.deliveryAddress?.addressLine1}</p>
                  {order.deliveryAddress?.addressLine2 && (
                    <p className="text-gray-700">{order.deliveryAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-700">
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                  </p>
                  {order.deliveryAddress?.landmark && (
                    <p className="text-sm text-gray-600 italic">📍 {order.deliveryAddress.landmark}</p>
                  )}
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                      <HiPhone className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold">{order.deliveryAddress?.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PaymentIcon className="w-5 h-5" />
                  Payment Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <PaymentIcon className="w-6 h-6 text-gray-700" />
                    <span className="font-bold text-gray-900 text-lg uppercase">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                       order.paymentMethod === 'stripe' ? 'Stripe Payment' :
                       order.paymentMethod === 'online' ? 'Online Payment' :
                       order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Payment Status</p>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
                    order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700 border border-green-300' :
                    order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700 border border-red-300' :
                    'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  }`}>
                    {order.paymentStatus === 'completed' ? <HiCheckCircle className="w-5 h-5" /> :
                     order.paymentStatus === 'failed' ? <HiX className="w-5 h-5" /> :
                     <HiClock className="w-5 h-5" />}
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>

                {order.paymentDetails?.transactionId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-700 mb-2 font-semibold">Transaction ID</p>
                    <p className="font-mono text-sm font-bold text-blue-900 break-all">
                      {order.paymentDetails.transactionId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <HiTruck className="w-5 h-5" />
                    Tracking Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
                    <p className="text-xs text-indigo-700 mb-2 font-semibold uppercase tracking-wide">
                      Tracking Number
                    </p>
                    <p className="font-mono font-bold text-indigo-900 text-lg break-all">
                      {order.trackingNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS - SELLER (can update status) */}
            {isSeller() && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Seller Actions</h2>
                </div>
                <div className="p-6 space-y-3">
                  {canUpdateStatus(order.status) && (
                    <button
                      onClick={() => {
                        setNewStatus(getNextStatus(order.status));
                        setShowUpdateModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <HiCheckCircle className="w-6 h-6" />
                      {getNextStatusLabel(order.status)}
                    </button>
                  )}
                  
                  {canCancelOrder(order.status) && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <HiX className="w-6 h-6" />
                      Cancel Order
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <HiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-semibold">Order Completed!</p>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <HiX className="w-12 h-12 text-red-600 mx-auto mb-2" />
                      <p className="text-red-700 font-semibold">Order Cancelled</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ⭐ ACTION BUTTONS - BUYER (can confirm delivery) */}
            {isBuyer() && !isSeller() && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Buyer Actions</h2>
                </div>
                <div className="p-6 space-y-3">
                  {canConfirmDelivery() && (
                    <button
                      onClick={() => setShowDeliveryModal(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <HiCheckCircle className="w-6 h-6" />
                      Confirm Delivery Received
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <HiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-semibold">Delivery Confirmed!</p>
                      <p className="text-sm text-green-600 mt-1">You received this order successfully</p>
                    </div>
                  )}

                  {!canConfirmDelivery() && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <HiClock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-bold text-blue-900 mb-1">Waiting for Shipment</h3>
                          <p className="text-sm text-blue-700">
                            Your supplier is processing this order. You'll be able to confirm delivery once it's shipped.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <HiX className="w-12 h-12 text-red-600 mx-auto mb-2" />
                      <p className="text-red-700 font-semibold">Order Cancelled</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Status Modal (For Sellers) */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Update Order Status
              </h3>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 text-sm mb-1">Change status to:</p>
                <p className="font-bold text-purple-700 text-xl capitalize">{newStatus}</p>
              </div>

              {newStatus === 'shipped' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tracking Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Note (Optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add any notes about this status change..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setStatusNote('');
                    setTrackingNumber('');
                    setNewStatus('');
                  }}
                  disabled={updating}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105"
                >
                  {updating ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ⭐ NEW - Confirm Delivery Modal (For Buyers) */}
        {showDeliveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Confirm Delivery
                </h3>
                <p className="text-gray-600">
                  Have you received all items from this order in good condition?
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700 font-medium mb-2">
                  ✓ By confirming delivery, you acknowledge that:
                </p>
                <ul className="text-xs text-green-600 space-y-1 list-disc list-inside">
                  <li>All items have been received</li>
                  <li>Products are in good condition</li>
                  <li>Payment will be processed (if COD)</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Note (Optional)
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Any feedback about the delivery..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setDeliveryNote('');
                  }}
                  disabled={updating}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105"
                >
                  {updating ? 'Confirming...' : 'Yes, Confirm Delivery'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiX className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Cancel Order
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to cancel this order?
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows="4"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                  disabled={updating}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={updating || !cancellationReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:transform-none"
                >
                  {updating ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;