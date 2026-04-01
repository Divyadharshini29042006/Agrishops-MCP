import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiStar, HiSearch, HiRefresh, HiUser, HiShoppingBag, HiExternalLink } from 'react-icons/hi';
import { getAllReviewsAdmin } from '../../services/reviewService';
import useToast from '../../hooks/useToast';

const AdminReviews = () => {
  const { showError } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, [currentPage]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await getAllReviewsAdmin({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });
      setReviews(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      showError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar 
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-[#F59E0B]' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Reviews & Ratings</h1>
            <p className="text-gray-600 mt-1">Monitor customer feedback for all retailers and suppliers</p>
          </div>
          <button 
            onClick={() => { setCurrentPage(1); fetchReviews(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters/Search */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
             <div className="relative max-w-md">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search by User or Seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                />
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider">
                  <th className="px-6 py-4 border-b">Order Info</th>
                  <th className="px-6 py-4 border-b">Customer</th>
                  <th className="px-6 py-4 border-b">Target Seller</th>
                  <th className="px-6 py-4 border-b">Rating & Comment</th>
                  <th className="px-6 py-4 border-b">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-8">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-gray-500">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <HiShoppingBag className="text-gray-400 w-4 h-4" />
                          <span className="font-medium text-blue-600 hover:underline">
                            {review.orderId ? (
                              <Link to="/admin/orders">
                                #{review.orderId.orderNumber}
                              </Link>
                            ) : (
                              <span className="text-gray-900">#N/A</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                            {review.userId?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.userId?.name}</p>
                            <p className="text-xs text-gray-500">{review.userId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{review.targetId?.businessDetails?.businessName || review.targetId?.name}</span>
                          <span className={`text-[10px] uppercase font-bold w-fit px-1.5 py-0.5 rounded mt-1 ${
                            review.targetType === 'supplier' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {review.targetType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <StarRating rating={review.rating} />
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2 italic">
                          {review.comment ? `"${review.comment}"` : <span className="text-gray-400">No comment provided</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 text-sm"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 text-sm"
                >
                  Next
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
