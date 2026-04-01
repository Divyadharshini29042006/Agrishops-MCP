// frontend/src/pages/customer/WholesaleInquiries.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiClock, HiCheckCircle, HiXCircle, HiDocumentText } from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const WholesaleInquiries = () => {
  const { showSuccess, showError } = useToast();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/wholesale/my-inquiries');
      setInquiries(response.data.data);
    } catch {
      showError('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (inquiryId) => {
    try {
      await api.patch(`/api/wholesale/${inquiryId}/respond`, {
        accepted: true,
        message: 'I accept this quote',
      });
      showSuccess('Quote accepted! Supplier will contact you.');
      fetchInquiries();
    } catch {
      showError('Failed to accept quote');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: HiClock, text: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
      quoted: { icon: HiDocumentText, text: 'Quote Received', class: 'bg-blue-100 text-blue-700' },
      accepted: { icon: HiCheckCircle, text: 'Accepted', class: 'bg-green-100 text-green-700' },
      rejected: { icon: HiXCircle, text: 'Rejected', class: 'bg-red-100 text-red-700' },
      expired: { icon: HiXCircle, text: 'Expired', class: 'bg-gray-100 text-gray-500' },
      completed: { icon: HiCheckCircle, text: 'Completed', class: 'bg-indigo-100 text-indigo-700' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wholesale Inquiries</h1>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries yet</h3>
            <p className="text-gray-600">When you request bulk orders, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={inquiry.product?.images?.[0]?.url || '/placeholder.png'}
                    alt={inquiry.product?.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{inquiry.product?.name}</h3>
                        <p className="text-sm text-gray-600">
                          Supplier: {inquiry.supplier?.businessDetails?.businessName || inquiry.supplier?.name}
                        </p>
                      </div>
                      {getStatusBadge(inquiry.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-4">
                      <div>
                        <p className="text-xs text-gray-600">Quantity</p>
                        <p className="font-semibold">{inquiry.quantity} {inquiry.product?.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Inquiry Date</p>
                        <p className="font-semibold">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-600 mb-1">Your Message:</p>
                      <p className="text-sm text-gray-900">{inquiry.message}</p>
                    </div>

                    {inquiry.status === 'quoted' && inquiry.supplierResponse && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-blue-900">
                              💰 Quote: ₹{inquiry.supplierResponse.quotedPrice?.toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-700">Min. Bulk Qty: {inquiry.supplierResponse.minimumBulkQuantity || 100}</p>
                          </div>
                          {inquiry.acceptanceExpiresAt && (
                            <div className="text-right">
                              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Expires In:</p>
                              <p className="text-sm font-black text-red-600">
                                {Math.max(0, Math.floor((new Date(inquiry.acceptanceExpiresAt) - new Date()) / (1000 * 60 * 60)))}h{' '}
                                {Math.max(0, Math.floor(((new Date(inquiry.acceptanceExpiresAt) - new Date()) / (1000 * 60)) % 60))}m
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-blue-700 mb-4 bg-white/50 p-2 rounded border border-blue-100 italic">
                          "{inquiry.supplierResponse.message}"
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptQuote(inquiry._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all"
                          >
                            Accept Quote
                          </button>
                          <button
                            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-lg border border-gray-300 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {inquiry.status === 'accepted' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4 shadow-sm border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-green-900 text-lg">✅ Quote Accepted!</h4>
                            <p className="text-sm text-green-700 mt-1">
                              You can now proceed to secure payment and finalize your bulk order.
                            </p>
                          </div>
                          <Link
                            to={`/wholesale/checkout/${inquiry._id}`}
                            className="bg-green-600 hover:bg-green-700 text-white font-black px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                          >
                            PROCEED TO CHECKOUT
                          </Link>
                        </div>
                      </div>
                    )}

                    {inquiry.status === 'rejected' && inquiry.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 border-l-4 border-l-red-500">
                        <p className="text-xs text-red-600 font-bold uppercase mb-1">Supplier's Reason for Rejection:</p>
                        <p className="text-sm text-red-800 italic">"{inquiry.rejectionReason}"</p>
                      </div>
                    )}

                    {inquiry.status === 'expired' && (
                      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4 opacity-75">
                        <p className="text-sm text-gray-600">
                          ⚠️ This quote has expired. Stock reservations have been released. Please submit a new inquiry if you're still interested.
                        </p>
                      </div>
                    )}

                    {inquiry.status === 'completed' && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 border-l-4 border-l-indigo-500">
                        <p className="text-sm text-indigo-700 font-semibold">
                          🎉 This bulk order has been successfully completed.
                          {inquiry.orderId && (
                            <Link to={`/my-orders/${inquiry.orderId}`} className="ml-2 underline font-bold">View Order Details</Link>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WholesaleInquiries;