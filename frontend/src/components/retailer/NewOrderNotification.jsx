// frontend/src/components/retailer/NewOrderNotification.jsx
import { useEffect, useState } from 'react';
import { HiCheckCircle, HiX } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const NewOrderNotification = ({ order, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    // Play notification sound
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch {
      console.log('Audio not available');
    }

    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-green-500 p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-full animate-bounce">
            <HiCheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg">New Order Received! 🎉</h4>
            <p className="text-sm text-gray-600 mt-1">
              Order #{order.orderNumber}
            </p>
            <p className="text-sm text-gray-600">
              From: {order.customer?.name}
            </p>
            <p className="text-lg font-bold text-green-600 mt-2">
              ₹{order.totalAmount}
            </p>
            <Link
              to={`/retailer/orders/${order._id}`}
              className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              View Order
            </Link>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderNotification;