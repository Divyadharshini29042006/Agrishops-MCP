// frontend/src/components/retailer/ExpiryAlert.jsx
import { HiOutlineExclamation } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const ExpiryAlert = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
      <div className="flex items-start">
        <HiOutlineExclamation className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-orange-800">
            {products.length} Product{products.length !== 1 ? 's' : ''} Expiring Soon
          </h3>
          <div className="mt-2 space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="text-sm text-orange-700 flex items-center justify-between bg-orange-100 p-2 rounded"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-xs bg-orange-200 px-2 py-1 rounded-full">
                  {product.daysLeft} day{product.daysLeft !== 1 ? 's' : ''} left
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/retailer/inventory?status=expiring"
            className="text-sm font-medium text-orange-800 underline mt-3 inline-block"
          >
            View All Expiring Products →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExpiryAlert;