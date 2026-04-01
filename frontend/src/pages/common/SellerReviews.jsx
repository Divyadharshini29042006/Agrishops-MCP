import { useState, useEffect } from 'react';
import { HiStar, HiRefresh, HiUser, HiShoppingBag, HiChat, HiX, HiCurrencyRupee, HiLocationMarker, HiPhone, HiMail, HiClock, HiCheckCircle, HiTruck, HiCube } from 'react-icons/hi';
import { getReviewsForTarget } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const SellerReviews = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Order Quick View
  const [orderData, setOrderData] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?._id) {
        fetchReviews();
    }
  }, [user?._id, currentPage]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await getReviewsForTarget(user._id, {
        page: currentPage,
        limit: itemsPerPage
      });
      setReviews(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      showError('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setOrderLoading(true);
      setIsModalOpen(true);
      
      const endpoint = user.role === 'supplier' ? `/supplier/orders/${orderId}` : `/retailer/orders/${orderId}`;
      const response = await api.get(endpoint);
      setOrderData(response.data.data);
    } catch (error) {
      console.error('Fetch order error:', error);
      showError('Failed to load order details');
      setIsModalOpen(false);
    } finally {
      setOrderLoading(false);
    }
  };

  const closeOrderModal = () => {
    setIsModalOpen(false);
    setOrderData(null);
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar 
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-[#F59E0B]' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  const RatingPercentage = ({ star, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-gray-600 w-4">{star}</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#F59E0B] rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-400 w-10 text-right">{Math.round(percentage)}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Business Reputation</h1>
            <p className="text-gray-600 mt-1">See what your customers are saying about your service</p>
          </div>
          <button 
            onClick={() => { setCurrentPage(1); fetchReviews(); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 text-gray-700 font-bold shadow-sm transition-all active:scale-95"
          >
            <HiRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feedback
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Aggregate Rating</h3>
                <div className="flex items-end gap-3 mb-2">
                    <span className="text-6xl font-black text-gray-900">{user?.stats?.avgRating?.toFixed(1) || '0.0'}</span>
                    <div className="mb-2">
                        <StarRating rating={Math.round(user?.stats?.avgRating || 0)} />
                        <p className="text-sm font-bold text-gray-400 mt-1">{user?.stats?.totalReviews || 0} Total Reviews</p>
                    </div>
                </div>
                
                <hr className="my-8 border-gray-100" />
                
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(star => (
                    <RatingPercentage 
                      key={star} 
                      star={star} 
                      count={reviews.filter(r => Math.round(r.rating) === star).length}
                      total={reviews.length}
                    />
                  ))}
                </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 text-white shadow-xl shadow-green-100">
                <HiChat className="w-10 h-10 opacity-50 mb-4" />
                <h4 className="text-xl font-bold mb-2">Why ratings matter?</h4>
                <p className="text-green-50 opacity-90 text-sm leading-relaxed">
                    Higher ratings increase your visibility on the platform and build trust with new customers. 
                    Supplying quality products on time is the best way to earn 5 stars!
                </p>
            </div>
          </div>

          {/* Review List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <HiChat className="text-blue-600" />
                        Customer Feedback
                    </h3>
                </div>

                <div className="divide-y divide-gray-50">
                    {loading && currentPage === 1 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-8 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
                                <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                            </div>
                        ))
                    ) : reviews.length === 0 ? (
                        <div className="p-20 text-center">
                            <HiChat className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">No reviews received yet.</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                          <div key={review._id} className="p-8 hover:bg-gray-50/50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-black text-sm">
                                        {review.userId?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{review.userId?.name || 'Verified Customer'}</p>
                                        <button 
                                            onClick={() => fetchOrderDetails(review.orderId?._id || review.orderId)}
                                            className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest hover:text-blue-600 transition-colors outline-none"
                                        >
                                            <HiShoppingBag className="w-3 h-3" />
                                            {review.orderId?.orderNumber ? (
                                                <span>Order #{review.orderId.orderNumber}</span>
                                            ) : (
                                                <span>View Order Details</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col md:items-end">
                                    <StarRating rating={review.rating} />
                                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative">
                                <span className="absolute -top-3 left-6 bg-white px-2 text-2xl text-gray-200 font-serif">“</span>
                                <p className="text-gray-700 font-medium italic leading-relaxed">
                                    {review.comment || <span className="text-gray-400 italic">"No text feedback provided by the customer."</span>}
                                </p>
                            </div>
                          </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                          className="px-6 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-300 disabled:opacity-50 text-sm font-bold text-gray-700 transition-all"
                        >
                          Previous
                        </button>
                        <span className="text-sm font-black text-gray-600">Page {currentPage} of {totalPages}</span>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                          className="px-6 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-300 disabled:opacity-50 text-sm font-bold text-gray-700 transition-all"
                        >
                          Next
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Quick View Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeOrderModal}></div>
          
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
             {/* Modal Header */}
             <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                   <h2 className="text-2xl font-black text-gray-900 leading-tight">Order Insight</h2>
                   <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">
                      {orderLoading ? 'Fetching data...' : `Order #${orderData?.orderNumber || '...'}`}
                   </p>
                </div>
                <button 
                   onClick={closeOrderModal}
                   className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                >
                   <HiX className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {orderLoading ? (
                   <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="mt-6 text-gray-400 font-bold">Synchronizing order history...</p>
                   </div>
                ) : orderData ? (
                   <div className="space-y-10">
                      {/* Order Status & Total */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-blue-50 rounded-[2rem] p-6">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Transaction Total</p>
                            <p className="text-3xl font-black text-blue-900">₹{orderData.totalAmount?.toLocaleString()}</p>
                         </div>
                         <div className={`rounded-[2rem] p-6 ${
                            orderData.status === 'delivered' ? 'bg-green-50 text-green-900' : 'bg-orange-50 text-orange-900'
                         }`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                               orderData.status === 'delivered' ? 'text-green-400' : 'text-orange-400'
                            }`}>Current Status</p>
                            <p className="text-xl font-black capitalize flex items-center gap-2">
                               {orderData.status === 'delivered' ? <HiCheckCircle className="w-6 h-6" /> : <HiClock className="w-6 h-6" />}
                               {orderData.status}
                            </p>
                         </div>
                      </div>

                      {/* Customer Details */}
                      <div>
                         <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                            Logistics & Customer
                         </h3>
                         <div className="bg-gray-50 rounded-[2rem] p-8 border-2 border-gray-100">
                            <div className="flex items-center gap-4 mb-6">
                               <div className="w-14 h-14 rounded-[1.25rem] bg-white border-2 border-gray-100 flex items-center justify-center text-xl font-black text-blue-600 shadow-sm">
                                  {orderData.customer?.name?.charAt(0) || orderData.deliveryAddress?.fullName?.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-lg font-black text-gray-900">{orderData.customer?.name || orderData.deliveryAddress?.fullName}</p>
                                  <div className="flex items-center gap-4 mt-1">
                                     <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><HiPhone /> {orderData.deliveryAddress?.phone}</span>
                                     <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><HiMail /> {orderData.customer?.email}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-start gap-3 pt-6 border-t-2 border-white/50 text-gray-600">
                               <HiLocationMarker className="w-5 h-5 text-gray-300 mt-1" />
                               <p className="text-sm font-medium leading-relaxed">
                                  {orderData.deliveryAddress?.addressLine1}, {orderData.deliveryAddress?.city},<br />
                                  {orderData.deliveryAddress?.state} - {orderData.deliveryAddress?.pincode}
                               </p>
                            </div>
                         </div>
                      </div>

                      {/* Items List */}
                      <div>
                         <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-orange-600 rounded-full"></div>
                            Bundle Contents
                         </h3>
                         <div className="space-y-3">
                            {orderData.items?.map((item, idx) => (
                               <div key={idx} className="flex items-center justify-between p-5 bg-white border-2 border-gray-100 rounded-3xl hover:border-gray-200 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <HiCube className="w-6 h-6" />
                                     </div>
                                     <div>
                                        <p className="font-bold text-gray-900">{item.productName || item.product?.name}</p>
                                        <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                                     </div>
                                  </div>
                                  <p className="font-black text-gray-900">₹{item.subtotal?.toLocaleString()}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-20">
                      <HiX className="w-16 h-16 text-red-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">Critical connection error. Data unavailable.</p>
                   </div>
                )}
             </div>

             {/* Modal Footer */}
             <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <p className="text-xs text-gray-400 font-bold max-w-[60%] italic">
                   Note: This view is for reference only. For delivery management, please use the main orders module.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                        window.open(`/${user.role}/orders/${orderData?._id}`, '_blank');
                    }}
                    className="px-6 py-3 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:border-gray-300 transition-all active:scale-95 text-sm"
                  >
                    Open Full
                  </button>
                  <button 
                    onClick={closeOrderModal}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all active:scale-95 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReviews;
