// frontend/src/components/retailer/StockAlert.jsx
import { HiExclamation } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const StockAlert = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
      <div className="flex items-start">
        <HiExclamation className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-yellow-800">
            {products.length} Product{products.length !== 1 ? 's' : ''} Low on Stock
          </h3>
          <div className="mt-2 space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded space-y-2"
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{product.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variantStockStatus?.map((v, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded ${v.isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      <span className="text-xs">{v.size}{v.unit}: {v.stock}</span>
                      <span className="font-bold">{v.isLow ? '⚠️ Restock' : '✅ OK'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/retailer/inventory?status=low_stock"
            className="text-sm font-medium text-yellow-800 underline mt-3 inline-block"
          >
            Restock These Products →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StockAlert;