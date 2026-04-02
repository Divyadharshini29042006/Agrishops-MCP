// frontend/src/pages/customer/ProductDetails.jsx - FIXED: Price updates with variant + No supplier message
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiShoppingCart, HiStar, HiTruck, HiShieldCheck, HiUsers,
  HiChevronLeft, HiChevronRight, HiX, HiInformationCircle,
  HiExclamationCircle, HiCheckCircle, HiLightningBolt,
  HiBeaker, HiChevronDown, HiChevronUp,
  HiDocumentText, HiLightBulb, HiQuestionMarkCircle, HiChartBar
} from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';
import ProductCard from '../../components/ProductCard';
import BulkOrderModal from '../../components/BulkOrderModal';
import Skeleton from '../../components/Skeleton';
import PriceComparisonModal from '../../components/PriceComparisonModal';

// ✅ HELPER COMPONENT FOR SPECIFICATIONS
const SpecRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 font-semibold text-sm text-right">{value}</span>
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [adding, setAdding] = useState(false);

  // ✅ Quantity and Seller State
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [allSellers, setAllSellers] = useState([]); // Store ALL sellers
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // ✅ BULK ORDER THRESHOLD LOGIC (WEIGHT-BASED)
  const [totalWeightKg, setTotalWeightKg] = useState(0);
  const [isBulk, setIsBulk] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  // ✅ Auto-detect weight and bulk status
  useEffect(() => {
    if (selectedVariant && selectedQuantity && product) {
      // Extract numeric weight from size string (e.g. "100 gm" -> 100)
      const weightMatch = selectedVariant.size.match(/(\d+(\.\d+)?)/);
      let variantWeight = weightMatch ? parseFloat(weightMatch[0]) : 0;
      
      // Determine if it's kg or gm
      const unit = selectedVariant.unit.toLowerCase();
      if (unit === 'kg' || unit === 'liter' || unit === 'bag' || unit === 'packet' && variantWeight < 10) {
          // If it's a large unit, ensure it's in grams for calculation
          // Note: Some products might have "1 kg" as size but unit as "packet"
          if (unit === 'kg' || unit === 'liter' || selectedVariant.size.toLowerCase().includes('kg')) {
              variantWeight *= 1000;
          }
      }
      
      const totalGrams = variantWeight * parseInt(selectedQuantity);
      const weightKg = totalGrams / 1000;
      setTotalWeightKg(weightKg);

      // Thresholds based on Category Type
      const catType = product.category?.main?.categoryType || '';
      let threshold = 5; // Default 5kg (Bio Fertilizers / Pesticides)
      if (catType === 'seeds') threshold = 1; // 1kg (Seeds)
      
      setIsBulk(weightKg >= threshold);
    }
  }, [selectedVariant, selectedQuantity, product]);

  // ✅ Auto-select seller when bulk status changes
  useEffect(() => {
    if (allSellers.length > 0) {
      if (isBulk) {
        // Bulk order - auto-select first supplier
        const firstSupplier = allSellers.find(o => o.role === 'supplier');
        if (firstSupplier) {
          setSelectedSeller(firstSupplier.seller._id);
        }
      } else {
        // Small order - auto-select first retailer
        const firstRetailer = allSellers.find(o => o.role === 'retailer');
        if (firstRetailer) {
          setSelectedSeller(firstRetailer.seller._id);
        }
      }
    }
  }, [isBulk, allSellers]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      // ✅ NEW: Use aggregated endpoint to get everything in one call
      const response = await api.get(`/api/products/${id}/details`);
      const { product: productData, otherSellers, similarProducts: similar } = response.data.data;

      setProduct(productData);
      setSimilarProducts(similar.filter(p => p._id !== id));

      // ✅ Process seller options
      const sellerOptions = (otherSellers || []).map(p => ({
        seller: p.seller,
        product: p,
        role: p.seller.role,
        pricing: p.pricing,
        variants: p.variants || [],
        stock: p.stock
      }));

      // Add main product's seller as an option
      const mainSellerOption = {
        seller: productData.seller,
        product: productData,
        role: productData.seller.role,
        pricing: productData.pricing,
        variants: productData.variants || [],
        stock: productData.stock
      };

      // Combine and remove duplicates by seller ID
      const allOptions = [mainSellerOption, ...sellerOptions];
      const uniqueOptions = allOptions.filter((option, index, self) =>
        index === self.findIndex((t) => t.seller._id === option.seller._id)
      );

      setAllSellers(uniqueOptions);

      // ✅ Set default variant
      if (productData.variants && productData.variants.length > 0) {
        const defaultVar = productData.variants.find(v => v.isDefault) || productData.variants[0];
        setSelectedVariant(defaultVar);
      } else {
        setSelectedVariant(null);
      }

      // Auto-select seller based on initial state
      if (uniqueOptions.length > 0) {
        setSelectedSeller(productData.seller._id);
      }

    } catch (error) {
      console.error('Error fetching product details:', error);
      showError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };



  // ✅ Get currently selected seller's product
  const getSelectedSellerProduct = () => {
    return allSellers.find(o => o.seller._id === selectedSeller);
  };

  // ✅ NEW: Get current price based on selected variant
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return {
        basePrice: selectedVariant.basePrice,
        finalPrice: selectedVariant.finalPrice,
        discount: selectedVariant.discountPercentage || 0
      };
    }

    return {
      basePrice: product.pricing.basePrice,
      finalPrice: product.pricing.finalPrice,
      discount: product.pricing.discount || 0
    };
  };

  // ✅ Calculate bulk savings
  const calculateBulkSavings = () => {
    if (allSellers.length < 2 || !isBulk) return null;

    const supplier = allSellers.find(o => o.role === 'supplier');
    const retailer = allSellers.find(o => o.role === 'retailer');

    if (!supplier || !retailer) return null;

    const supplierPrice = (supplier.pricing.finalPrice || 0) * selectedQuantity;
    const retailerPrice = (retailer.pricing.finalPrice || 0) * selectedQuantity;
    const savings = retailerPrice - supplierPrice;

    return {
      supplier,
      retailer,
      supplierPrice,
      retailerPrice,
      savings: savings > 0 ? savings : 0,
    };
  };

  // ✅ Check if suppliers are available
  const hasSuppliersAvailable = () => {
    return allSellers.some(o => o.role === 'supplier');
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const selectedProduct = getSelectedSellerProduct();
    if (!selectedProduct) {
      showError('Please select a seller');
      return;
    }

    if (selectedProduct.stock < selectedQuantity) {
      showError('Not enough stock available');
      return;
    }

    setAdding(true);
    const result = await addToCart(selectedProduct.product._id, selectedQuantity);
    setAdding(false);

    if (result.success) {
      showSuccess(`Added ${selectedQuantity} item(s) to cart!`);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    await handleAddToCart();
    navigate(user?.role === 'retailer' ? '/retailer/cart' : '/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton width="60px" />
            <span className="text-gray-300">›</span>
            <Skeleton width="100px" />
            <span className="text-gray-300">›</span>
            <Skeleton width="150px" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Gallery Skeleton */}
            <div className="space-y-4">
              <Skeleton variant="rectangular" height="500px" className="rounded-xl" />
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} variant="rectangular" width="80px" height="80px" className="rounded-lg" />
                ))}
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="space-y-4">
                <Skeleton width="40%" height="1.5rem" />
                <Skeleton width="80%" height="2.5rem" />
                <div className="flex gap-4">
                  <Skeleton width="120px" height="2rem" />
                  <Skeleton width="80px" height="2rem" />
                </div>
              </div>
              <Skeleton height="100px" className="rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton height="50px" />
                <Skeleton height="50px" />
              </div>
              <Skeleton height="60px" className="rounded-xl" />
            </div>
          </div>

          {/* Similar Products Skeleton */}
          <div className="mt-12">
            <Skeleton width="200px" height="2rem" className="mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-3">
                  <Skeleton variant="rectangular" height="200px" className="rounded-xl" />
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <Link to="/products" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Get current pricing (variant or base)
  const currentPricing = getCurrentPrice();
  const discountPercentage = currentPricing.discount
    ? Math.round(currentPricing.discount)
    : 0;

  const selectedSellerProduct = getSelectedSellerProduct();
  const bulkSavings = calculateBulkSavings();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-green-600">
            {product.category?.main?.name}
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium line-clamp-1">
            {product.name}
          </span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded">
                    {discountPercentage}% OFF
                  </span>
                </div>
              )}
              <img
                src={getPublicImageUrl(product.images?.[selectedImage]?.url) || '/placeholder-product.png'}
                alt={product.name}
                className="w-full h-full object-contain p-8"
                loading="lazy"
              />

              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev =>
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <HiChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev =>
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <HiChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                </>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${selectedImage === index
                      ? 'border-green-600'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={getPublicImageUrl(img.url)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Title & Brand */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600">
                Brand: <span className="font-semibold">{product.seller?.businessDetails?.businessName || 'Generic'}</span>
              </p>
            </div>

            {/* Rating */}
            {product.rating?.average > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <HiStar
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(product.rating.average)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-900">
                  {product.rating.average.toFixed(1)}
                </span>
                <span className="text-gray-600">
                  ({product.rating.count} reviews)
                </span>
              </div>
            )}

            {/* ✅ Price Display - UPDATES WITH VARIANT SELECTION */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-green-700">
                  ₹{currentPricing.finalPrice.toFixed(0)}
                </span>
                {currentPricing.basePrice > currentPricing.finalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ₹{currentPricing.basePrice.toFixed(0)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">Inclusive of all taxes</p>
              {currentPricing.basePrice > currentPricing.finalPrice && (
                <p className="text-sm text-green-700 font-semibold flex items-center gap-1">
                  <HiLightningBolt className="w-4 h-4" />
                  You save ₹{(currentPricing.basePrice - currentPricing.finalPrice).toFixed(0)}!
                </p>
              )}
              
              {/* ✅ PRICE COMPARISON TRIGGER */}
              {product.sellerType === 'retailer' && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border-2 border-green-500 text-green-700 font-bold rounded-lg hover:bg-green-50 transition-all active:scale-95 shadow-sm"
                >
                  <HiChartBar className="w-5 h-5" />
                  Compare Prices from Other Sellers
                </button>
              )}
            </div>

            {/* ✅ VARIANTS - 2x2 GRID */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Available Sizes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.variants.map((variant, index) => {
                    const variantDiscount = variant.basePrice > variant.finalPrice
                      ? Math.round(((variant.basePrice - variant.finalPrice) / variant.basePrice) * 100)
                      : 0;

                    return (
                      <button
                        key={variant._id || index}
                        onClick={() => setSelectedVariant(variant)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${selectedVariant?._id === variant._id
                          ? 'bg-green-600 border-green-600 text-white shadow-lg scale-105'
                          : 'bg-white border-gray-200 hover:border-green-400 hover:shadow-md'
                          }`}
                      >
                        {variantDiscount > 0 && (
                          <span className={`absolute -top-2 -right-2 text-xs font-bold px-2 py-0.5 rounded ${selectedVariant?._id === variant._id
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-orange-500 text-white'
                            }`}>
                            {variantDiscount}% OFF
                          </span>
                        )}
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-bold text-base ${selectedVariant?._id === variant._id ? 'text-white' : 'text-gray-900'}`}>
                            {variant.size}
                          </p>
                          {/* Stock Dot */}
                          <div className={`w-2 h-2 rounded-full ${variant.stock < (product.sellerType === 'supplier' ? 10 : 20) ? 'bg-red-500 animate-pulse' :
                              variant.stock < (product.sellerType === 'supplier' ? 25 : 50) ? 'bg-orange-500' :
                                'bg-green-500'
                            }`} />
                        </div>
                        <p className={`text-lg font-bold ${selectedVariant?._id === variant._id ? 'text-white' : 'text-green-700'}`}>
                          ₹{variant.finalPrice}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          {variant.basePrice > variant.finalPrice ? (
                            <p className={`text-xs line-through ${selectedVariant?._id === variant._id ? 'text-green-100' : 'text-gray-400'}`}>
                              ₹{variant.basePrice}
                            </p>
                          ) : <div />}
                          <p className={`text-[10px] font-bold ${selectedVariant?._id === variant._id ? 'text-white' : 'text-gray-500'
                            }`}>
                            {variant.stock} {product.sellerType === 'supplier' ? 'Bags' : 'Pkts'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ✅ QUANTITY INPUT WITH CALCULATION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={selectedSellerProduct?.stock || 999}
                  value={selectedQuantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setSelectedQuantity('');
                      return;
                    }
                    const num = Number(value);
                    if (!isNaN(num) && num >= 1) {
                      setSelectedQuantity(num);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || Number(e.target.value) < 1) {
                      setSelectedQuantity(1);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-green-500 rounded-lg text-lg font-semibold focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Enter quantity"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity(prev => Math.min((prev || 1) + 1, selectedSellerProduct?.stock || 999))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity(prev => Math.max((prev || 1) - 1, 1))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ✅ PRICE CALCULATION - USES SELECTED VARIANT PRICE */}
              {selectedSellerProduct && selectedQuantity > 0 && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedQuantity} × ₹{currentPricing.finalPrice.toFixed(0)}
                    </span>
                    <span className="text-xl font-bold text-green-700">
                      = ₹{(currentPricing.finalPrice * selectedQuantity).toFixed(0)}
                    </span>
                  </div>
                  {currentPricing.basePrice > currentPricing.finalPrice && (
                    <>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-green-200">
                        <span className="text-xs text-gray-500">Original price:</span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{(currentPricing.basePrice * selectedQuantity).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                          <HiLightningBolt className="w-3 h-3" />
                          Total savings:
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          ₹{((currentPricing.basePrice - currentPricing.finalPrice) * selectedQuantity).toFixed(0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedSellerProduct && selectedQuantity > selectedSellerProduct.stock && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <HiExclamationCircle className="w-4 h-4" />
                  Only {selectedSellerProduct.stock} units available
                </p>
              )}
            </div>

            {/* ✅ BULK ORDER SECTION - WEIGHT-BASED */}
            {isBulk && (
              <div>
                <div className="border-2 rounded-xl p-4 bg-blue-50 border-blue-300 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                      <HiLightningBolt className="w-6 h-6 text-yellow-500 animate-bounce" />
                      Bulk Order Detected!
                    </h3>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      TOTAL WEIGHT: {totalWeightKg.toFixed(1)} KG
                    </span>
                  </div>

                  <p className="text-xs text-blue-800 mb-4 font-medium">
                    You've reached the bulk threshold ({product.category?.main?.categoryType === 'seeds' ? '1kg' : '5kg'}). Compare suppliers for the best wholesale price.
                  </p>

                  {/* ✅ SMART COMPARISON BUTTON */}
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="w-full mb-4 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-200 active:scale-95"
                  >
                    <HiChartBar className="w-6 h-6" />
                    Open Smart Supplier Comparison
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Switch back to retailer
                        const firstRetailer = allSellers.find(o => o.role === 'retailer');
                        if (firstRetailer) setSelectedSeller(firstRetailer.seller._id);
                      }}
                      className="flex-1 text-xs text-blue-700 hover:text-blue-800 font-bold px-4 py-2 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 transition-all"
                    >
                      Buy Regular Packets
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ INFO: Bulk pricing available */}
            {!isBulk && hasSuppliersAvailable() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 flex items-center gap-2">
                  <HiInformationCircle className="w-5 h-5 flex-shrink-0" />
                  <span>
                    💡 Add more to reach {product.category?.main?.categoryType === 'seeds' ? '1kg' : '5kg'} for wholesale pricing
                  </span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || !selectedSellerProduct || selectedSellerProduct.stock === 0 || selectedQuantity > selectedSellerProduct.stock}
                  className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 border-green-600 text-green-600 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <HiShoppingCart className="w-6 h-6" />
                  {adding ? 'Adding...' : (selectedSellerProduct?.stock === 0 || (selectedVariant && selectedVariant.stock === 0)) ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedSellerProduct || selectedSellerProduct.stock === 0 || selectedQuantity > selectedSellerProduct.stock}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  ⚡ Buy Now
                </button>
              </div>

              {/* ✅ PROMINENT BULK SUPPLY BUTTON (Supplier only) */}
              {product.seller?.role === 'supplier' && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-400 text-blue-700 font-bold py-3 rounded-xl transition-all"
                >
                  <HiUsers className="w-5 h-5" />
                  Request Bulk Supply Quote
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap md:grid md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 min-w-[120px]">
                <HiTruck className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500">Fast & Reliable</p>
                  <p className="text-xs md:text-sm font-semibold text-gray-900">Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[120px]">
                <HiShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500">Safe Payment</p>
                  <p className="text-xs md:text-sm font-semibold text-gray-900">COD / UPI</p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[120px]">
                <HiUsers className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500">10 Lakh+</p>
                  <p className="text-xs md:text-sm font-semibold text-gray-900">Farmers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>

        {/* ✅ DYNAMIC AGRICULTURAL SPECIFICATIONS */}
        {(product.pesticideDetails || product.seedDetails) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {product.category?.main?.name?.toLowerCase().includes('seed') ? (
                <><HiInformationCircle className="text-green-600" /> Seed Specifications</>
              ) : (
                <><HiBeaker className="text-orange-600" /> Technical Specifications</>
              )}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {/* Pesticide Specifics */}
              {product.pesticideDetails && (
                <>
                  <SpecRow label="Technical Content" value={product.pesticideDetails.technicalContent} />
                  <SpecRow label="Formulation Type" value={product.pesticideDetails.formulationType} />
                  <SpecRow label="Mode of Action" value={product.pesticideDetails.modeOfAction} />
                  <SpecRow label="Target Pests" value={product.pesticideDetails.controls?.join(', ')} />
                  <SpecRow label="Dosage" value={product.pesticideDetails.dosage} />
                  <SpecRow label="Waiting Period" value={product.pesticideDetails.waitingPeriod ? `${product.pesticideDetails.waitingPeriod} Days` : null} />
                </>
              )}
              
              {/* Seed Specifics */}
              {product.seedDetails && (
                <>
                  <SpecRow label="Germination Rate" value={product.seedDetails.germinationRate ? `${product.seedDetails.germinationRate}%` : null} />
                  <SpecRow label="Sowing Depth" value={product.seedDetails.sowingDepth} />
                  <SpecRow label="Plant Spacing" value={product.seedDetails.plantSpacing} />
                  <SpecRow label="Harvest Time" value={product.seedDetails.harvestTime} />
                  <SpecRow label="Hybrid Variety" value={product.seedDetails.hybrid ? 'Yes' : 'No'} />
                </>
              )}

              {/* General Ag Fields */}
              <SpecRow label="Suitable Seasons" value={product.seasons?.join(', ')} />
              <SpecRow label="Organic Certified" value={product.organicCertified ? 'Yes' : 'No'} />
              <SpecRow label="Target Crops" value={product.suitableFor?.join(', ')} />
            </div>
          </div>
        )}

        {/* ✅ APPLICATION TIPS SECTION */}
        {product.applicationTips && product.applicationTips.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-8 mb-12">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              <HiLightBulb className="text-yellow-500" />
              Professional Application Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.applicationTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 bg-white/60 p-4 rounded-lg border border-white">
                  <HiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-900 text-sm font-medium">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ FAQ SECTION */}
        {product.faq && product.faq.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <HiQuestionMarkCircle className="text-purple-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {product.faq.map((item, index) => (
                <details key={index} className="group border-b border-gray-100 last:border-0 pb-4">
                  <summary className="flex items-center justify-between cursor-pointer list-none py-2">
                    <span className="font-bold text-gray-800 pr-4 group-open:text-purple-600 transition-colors">
                      {item.question}
                    </span>
                    <HiChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-3 text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-purple-500">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ✅ DISCLAIMER */}
        {product.disclaimer && (
          <div className="bg-gray-100 rounded-xl p-6 mb-12 border border-gray-200">
            <div className="flex items-start gap-3">
              <HiShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-500 italic leading-relaxed">
                <strong>Disclaimer:</strong> {product.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarProducts.map((similarProduct) => (
                <ProductCard key={similarProduct._id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Order Modal */}
      {showBulkModal && (
        <BulkOrderModal
          product={product}
          selectedVariant={selectedVariant}
          quantity={selectedQuantity}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {/* ✅ PRICE COMPARISON MODAL */}
      {showCompareModal && (
        <PriceComparisonModal
          product={product}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
};

export default ProductDetails;