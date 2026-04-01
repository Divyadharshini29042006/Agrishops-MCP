// frontend/src/components/ProductCard.jsx - FINAL FIX: Spacing, Icons, Better Styling
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiStar, HiChevronDown, HiX, HiLightningBolt } from 'react-icons/hi';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { showSuccess } = useToast();

  const [showVariantModal, setShowVariantModal] = useState(false);
  const [addingVariant, setAddingVariant] = useState(null);
  const [imgError, setImgError] = useState(false);

  // ✅ Get product image — /uploads/ paths are proxied by Vite to the backend.
  // External http/https URLs are used as-is.
  // Ignore placeholder URLs if they exist in the data from previous legacy scripts
  const rawImage = product.images?.[0]?.url || '';
  const isPlaceholder = rawImage.includes('placehold.co');
  const productImage = isPlaceholder ? '' : rawImage;

  // ✅ Calculate discount percentage
  const basePrice = product.pricing?.basePrice || 0;
  const finalPrice = product.pricing?.finalPrice || 0;
  const discountPercentage = basePrice > finalPrice
    ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
    : 0;

  // ✅ Calculate savings
  const savings = basePrice - finalPrice;

  // ✅ Get default variant/size
  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
  const displaySize = defaultVariant
    ? `${defaultVariant.quantity} ${defaultVariant.unit}`
    : product.unit || 'Standard';

  // ✅ Get total variants count
  const variantsCount = product.variants?.length || 0;

  // ✅ Handle size dropdown click
  const handleSizeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (variantsCount > 1) {
      setShowVariantModal(true);
    }
  };

  // ✅ Handle add to cart from modal
  const handleAddToCartVariant = async (variant) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingVariant(variant._id);
    const result = await addToCart(product._id, 1);
    setAddingVariant(null);

    if (result.success) {
      showSuccess(`Added ${variant.size} to cart!`);
      setShowVariantModal(false);
    }
  };

  return (
    <>
      <Link
        to={`/products/${product._id}`}
        className="group block bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
      >
        {/* ✅ Image Container - FIXED HEIGHT */}
        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
          {/* ✅ DISCOUNT BADGE */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                {discountPercentage}% OFF
              </span>
            </div>
          )}

          {/* Product Image or Fallback */}
          {productImage && !imgError ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
              <span className="text-4xl mb-2">🌱</span>
              <span className="text-xs text-green-700 font-medium text-center px-2 line-clamp-2">{product.name}</span>
            </div>
          )}
        </div>

        {/* Product Info - FIXED STRUCTURE */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Product Name - FIXED HEIGHT */}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-green-600 transition-colors h-10 mb-2">
            {product.name}
          </h3>

          {/* ✅ PRICING */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-xl font-bold text-gray-900">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {basePrice > finalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{basePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* ✅ SAVINGS - WITH ICON INSTEAD OF EMOJI */}
          {savings > 0 && (
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mb-3">
              <HiLightningBolt className="w-3.5 h-3.5" />
              <span>Save ₹{savings.toLocaleString('en-IN')}</span>
            </p>
          )}

          {/* ✅ SIZE DROPDOWN - REDUCED GAP (gap-1 instead of justify-between) */}
          <div className="mt-auto">
            <div className="flex items-center gap-1 text-sm mb-2">
              <span className="text-gray-600">Size</span>
              <button
                onClick={handleSizeClick}
                className={`flex items-center gap-0.5 font-semibold ${variantsCount > 1
                  ? 'text-gray-900 hover:text-green-600 cursor-pointer'
                  : 'text-gray-900'
                  }`}
              >
                <span>{displaySize}</span>
                {variantsCount > 1 && (
                  <HiChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Rating */}
            {product.rating?.average > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <HiStar className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  <span className="text-xs font-semibold text-gray-700 ml-1">
                    {product.rating.average.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ({product.rating.count})
                </span>
              </div>
            )}

            {/* Stock Status */}
            {product.stock === 0 && (
              <div className="text-center py-1.5 bg-red-50 border border-red-200 rounded-lg mt-2">
                <p className="text-xs font-semibold text-red-600">Out of Stock</p>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* ✅ VARIANT MODAL - EXACTLY LIKE KISAN SHOP IMAGE 3 */}
      {showVariantModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setShowVariantModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-4">
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-16 h-16 object-contain bg-white rounded-lg border-2 border-gray-200 shadow-sm"
                />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                  <p className="text-sm text-gray-500">Select size and add to cart</p>
                </div>
              </div>
              <button
                onClick={() => setShowVariantModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
                <span className="w-1 h-5 bg-green-600 rounded-full"></span>
                Choose a Size
              </h3>
              <div className="space-y-3">
                {product.variants?.map((variant) => (
                  <div
                    key={variant._id}
                    className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all"
                  >
                    {/* Size Name */}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">{variant.size}</p>
                      {variant.stock > 0 && variant.stock < 10 && (
                        <p className="text-xs text-orange-600 mt-1">Only {variant.stock} left!</p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            ₹{variant.finalPrice.toFixed(0)}
                          </span>
                          {variant.basePrice > variant.finalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{variant.basePrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {variant.discountPercentage > 0 && (
                          <p className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-end mt-1">
                            <HiLightningBolt className="w-3 h-3" />
                            Save ₹{(variant.basePrice - variant.finalPrice).toFixed(0)}
                          </p>
                        )}
                      </div>

                      {/* Discount Badge */}
                      {variant.discountPercentage > 0 && (
                        <span className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-300">
                          {variant.discountPercentage}% OFF
                        </span>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCartVariant(variant)}
                        disabled={addingVariant === variant._id || variant.stock === 0}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-md hover:shadow-lg"
                      >
                        {addingVariant === variant._id ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Adding...
                          </span>
                        ) : variant.stock === 0 ? (
                          'Out of Stock'
                        ) : (
                          'Add to Cart'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;