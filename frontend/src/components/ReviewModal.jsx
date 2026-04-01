// frontend/src/components/ReviewModal.jsx
import { useState } from 'react';
import { HiStar, HiX } from 'react-icons/hi';
import { createReview } from '../services/reviewService';
import useToast from '../hooks/useToast';

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const { showSuccess, showError } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showError('Please select a star rating');
      return;
    }

    try {
      setIsSubmitting(true);
      await createReview({
        orderId: order._id,
        rating,
        comment
      });
      
      showSuccess('Thank you for your feedback!');
      onReviewSubmitted(order._id);
      onClose();
    } catch (error) {
      console.error('Submit review error:', error);
      showError(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-md bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Rate Your Order</h3>
            <p className="text-xs text-gray-500 mt-1">Order ID: {order.orderNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Star Selection */}
          <div className="flex flex-col items-center mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">How was your experience?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <HiStar 
                    className={`w-10 h-10 ${
                      (hover || rating) >= star ? 'text-[#F59E0B]' : 'text-[#D1D5DB]'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-semibold text-[#EF6C00] mt-2 italic shadow-sm">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
              </p>
            )}
          </div>

          {/* Comment Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Details (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the product quality, delivery, and service..."
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFCC80] focus:border-[#EF6C00] outline-none text-sm min-h-[120px] transition-all"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-[10px] ${comment.length >= 950 ? 'text-red-500' : 'text-gray-400'}`}>
                {comment.length}/1000 characters
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className={`w-full py-3.5 rounded-lg font-bold text-sm transition-all shadow-sm ${
              isSubmitting || rating === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-[#FFF3E0] text-[#EF6C00] border border-[#FFCC80] hover:shadow-md'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#EF6C00] border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
