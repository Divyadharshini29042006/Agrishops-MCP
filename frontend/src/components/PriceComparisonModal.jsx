import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiX, HiLightningBolt, HiExclamationCircle, HiExternalLink, HiArrowRight } from 'react-icons/hi';
import api from '../services/api';

const PriceComparisonModal = ({ product, onClose }) => {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, [product._id]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${product._id}/compare`);
      setComparisonData(response.data.data);
    } catch (err) {
      console.error('Fetch comparison error:', err);
      setError('Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = product.pricing.finalPrice;
  const hasComparison = comparisonData.length > 0;
  
  // Find the lowest price among other sellers
  const lowestOtherPrice = hasComparison 
    ? Math.min(...comparisonData.map(p => p.pricing.finalPrice)) 
    : null;
    
  // Global best price (including current)
  const bestPrice = lowestOtherPrice !== null 
    ? Math.min(lowestOtherPrice, currentPrice) 
    : currentPrice;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Compare Prices Across Sellers</h3>
            <p className="text-sm text-gray-500 mt-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <HiX className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Fetching best prices...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <HiExclamationCircle className="w-6 h-6" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparison Table */}
              <div className="overflow-hidden border border-gray-100 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Seller</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {/* Current Seller */}
                    <tr className={currentPrice === bestPrice ? "bg-green-50/50" : ""}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">
                          {product.seller?.businessDetails?.businessName || product.seller?.name}
                          <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">Current</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{product.seller?.location?.city || 'India'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{product.unit || 'Standard'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">₹{currentPrice.toFixed(0)}</span>
                          {currentPrice === bestPrice && (
                            <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">Best Deal</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-600">{product.stock}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-xs font-bold text-gray-400 italic">Current View</span>
                      </td>
                    </tr>

                    {/* Other Sellers */}
                    {comparisonData.map((item) => (
                      <tr 
                        key={item._id} 
                        className={`group ${item.pricing.finalPrice === bestPrice ? "bg-green-50/50" : "hover:bg-gray-50"} transition-colors`}
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">
                            {item.seller?.businessDetails?.businessName || item.seller?.name}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.seller?.location?.city || 'India'}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.unit || item.variants?.[0]?.size || 'Standard'}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-lg">₹{item.pricing.finalPrice.toFixed(0)}</span>
                            {item.pricing.finalPrice === bestPrice && (
                              <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">Best Deal</span>
                            )}
                          </div>
                          {item.pricing.finalPrice < currentPrice && (
                            <p className="text-[10px] text-green-700 font-bold mt-1">
                              Save ₹{(currentPrice - item.pricing.finalPrice).toFixed(0)}!
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-600">{item.stock}</td>
                        <td className="px-4 py-4 text-right">
                          <Link 
                            to={`/products/${item._id}`}
                            onClick={onClose}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm ${
                              item.pricing.finalPrice === bestPrice
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                          >
                            View Deal
                            <HiArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {comparisonData.length === 0 && !loading && (
                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">No other sellers available for this specific variety</p>
                </div>
              )}

              {/* Best Saving Message */}
              {hasComparison && lowestOtherPrice < currentPrice && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <HiLightningBolt className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900">Smart Savings Found!</h4>
                    <p className="text-sm text-orange-800 leading-relaxed">
                      Better prices found from other verified retailers. You can save up to <span className="font-bold text-lg">₹{(currentPrice - lowestOtherPrice).toFixed(0)}</span> by choosing the best deal above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium italic">
            * Comparison reflects current marketplace data for identical varieties.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonModal;
