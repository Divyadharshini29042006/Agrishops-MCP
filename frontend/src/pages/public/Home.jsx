// frontend/src/pages/public/Home.jsx - WITH PRODUCT CAROUSELS (hyphen slugs)
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiShieldCheck,
  HiTruck,
  HiCreditCard,
  HiSupport,
  HiChevronLeft,
  HiChevronRight,
  HiArrowRight,
  HiX
} from 'react-icons/hi';
import { GiWheat } from 'react-icons/gi';
import ProductCard from '../../components/ProductCard';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';

// Product Card is now imported from components

// ─────────────────────────────────────────────
// Helper: Product Carousel Section
// ─────────────────────────────────────────────
const ProductCarousel = ({ title, categorySlug, viewAllLink }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams({ limit: 10, sort: '-createdAt' });
        if (categorySlug) params.set('category', categorySlug);
        const res = await api.get(`/api/products?${params.toString()}`);
        const data = res.data.data || [];
        setProducts(data);
      } catch (err) {
        console.error(`Error fetching ${title} products:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categorySlug, title]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-6 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
          >
            View All <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white border border-gray-300 shadow-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50"
          >
            <HiChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-56 h-80 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map(product => (
                <div key={product._id} className="flex-shrink-0 w-56">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Right Arrow */}
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white border border-gray-300 shadow-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50"
          >
            <HiChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// Main Home Component
// ─────────────────────────────────────────────
const Home = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [brands, setBrands] = useState([]);
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Hero Carousel Images
  const heroSlides = [
    {
      image: '/images/hero/hero_main.png',
      title: 'Premium Quality Seeds',
      subtitle: 'High-yielding, disease-resistant seeds for every season',
      badge: 'Trusted by 50,000+ Farmers'
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=600&fit=crop',
      title: 'Advanced Crop Protection',
      subtitle: 'Effective Fungicides & Insecticides for healthy harvests',
      badge: 'Scientific Agricultural Solutions'
    },
    {
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&h=600&fit=crop',
      title: 'Organic Bio-Pesticides',
      subtitle: 'Eco-friendly and natural solutions for sustainable farming',
      badge: '100% Original Products'
    }
  ];

  // Categories
  const categories = [
    { name: 'Vegetable Seeds', image: '/images/categories/vegetable_seeds.png', link: '/products?category=vegetable-seeds' },
    { name: 'Fruit Seeds', image: '/images/categories/fruit_seeds.png', link: '/products?category=fruit-seeds' },
    { name: 'Flower Seeds', image: '/images/categories/flower_seeds.png', link: '/products?category=flower-seeds' },
    { name: 'Bio Pesticides', image: '/images/categories/bio_pesticides.png', link: '/products?category=bio-pesticides' },
    { name: 'Chemical Pesticides', image: '/images/categories/chemical_pesticides.png', link: '/products?category=chemical-pesticides' },
  ];

  // Product carousel sections (matching reference image)
  const productSections = [
    { title: 'Vegetable Seeds', categorySlug: 'vegetable-seeds', viewAll: '/products?category=vegetable-seeds' },
    { title: 'Crop Protection', categorySlug: 'crop-protection', viewAll: '/products?category=crop-protection' },
    { title: 'Flower Seeds', categorySlug: 'flower-seeds', viewAll: '/products?category=flower-seeds' },
    { title: 'Fruit Seeds', categorySlug: 'fruit-seeds', viewAll: '/products?category=fruit-seeds' },
    { title: 'Bio Pesticides', categorySlug: 'bio-pesticides', viewAll: '/products?category=bio-pesticides' },
    { title: 'Chemical Pesticides', categorySlug: 'chemical-pesticides', viewAll: '/products?category=chemical-pesticides' },
  ];

  const features = [
    { icon: <HiShieldCheck className="w-12 h-12" />, title: '100% Original Products', description: 'Trusted brands only' },
    { icon: <HiTruck className="w-12 h-12" />, title: 'Free Delivery*', description: 'On eligible orders' },
    { icon: <HiCreditCard className="w-12 h-12" />, title: 'Secure Payments', description: 'Encrypted checkout' },
    { icon: <HiSupport className="w-12 h-12" />, title: 'Expert Support', description: "We're here to help" },
  ];

  // Auto-rotate hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/api/brands/homepage');
        if (response.data.success) setBrands(response.data.data || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, []);

  // Auto-rotate brands
  useEffect(() => {
    if (brands.length > 5) {
      const timer = setInterval(() => {
        setCurrentBrandIndex(prev => {
          const next = prev + 5;
          return next >= brands.length ? 0 : next;
        });
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [brands.length]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);

  const nextBrand = () => {
    if (brands.length > 5) {
      setCurrentBrandIndex(prev => {
        const next = prev + 5;
        return next >= brands.length ? 0 : next;
      });
    }
  };

  const prevBrand = () => {
    if (brands.length > 5) {
      setCurrentBrandIndex(prev => {
        const p = prev - 5;
        return p < 0 ? Math.floor((brands.length - 1) / 5) * 5 : p;
      });
    }
  };

  const handleBrandClick = (brand) => {
    if (user?.role === 'supplier') {
      setSelectedBrand(brand);
      setShowSupplierModal(true);
    } else {
      const brandName = brand.businessDetails?.businessName || brand.name;
      navigate(`/products?brand=${encodeURIComponent(brandName)}`);
    }
  };

  return (
    <div className="w-full">
      {/* ── Hero Carousel ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative h-[450px] md:h-[550px] lg:h-[650px]">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute inset-0">
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              </div>
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-full">
                  <div className="max-w-3xl space-y-6 text-white">
                    <span className="bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full inline-flex items-center gap-2 shadow-lg">
                      <GiWheat className="text-lg" /> {slide.badge}
                    </span>
                    <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-lg">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-100 leading-relaxed max-w-2xl drop-shadow-md">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Link to="/products" className="group bg-white hover:bg-gray-50 text-green-700 font-bold px-10 py-4 rounded-lg transform transition-all duration-300 hover:scale-105 shadow-xl text-center text-lg border-2 border-white hover:shadow-2xl flex items-center justify-center gap-2">
                        <span>SHOP NOW</span>
                        <HiArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                      <Link to="/register" className="group bg-white hover:bg-gray-50 text-green-700 font-bold px-10 py-4 rounded-lg transform transition-all duration-300 hover:scale-105 shadow-xl text-center text-lg border-2 border-white hover:shadow-2xl flex items-center justify-center gap-2">
                        <span>BECOME A SELLER</span>
                        <HiArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl transition-all duration-300 z-10 backdrop-blur-sm hover:scale-110">
            <HiChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl transition-all duration-300 z-10 backdrop-blur-sm hover:scale-110">
            <HiChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-3 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-10 shadow-lg' : 'bg-white/50 hover:bg-white/75 w-3'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bar ── */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 group text-center md:text-left">
                <div className="text-green-600 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 bg-green-50 p-3 rounded-full">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop by Categories ── */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Shop by Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-8">
            {categories.map((cat, index) => (
              <Link key={index} to={cat.link} className="group flex flex-col items-center">
                <div className="relative w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 mb-2 transform transition-all duration-300 group-hover:scale-105">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300 border-2 border-white">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors duration-300 text-center">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Carousels by Category ── */}
      {productSections.map(section => (
        <ProductCarousel
          key={section.categorySlug}
          title={section.title}
          categorySlug={section.categorySlug}
          viewAllLink={section.viewAll}
        />
      ))}

      {/* ── Featured Brands ── */}
      {brands.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full">✨ Trusted Partners</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 mt-4">Featured Brands</h2>
              <p className="text-lg text-gray-600">Trusted by farmers across India</p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12">
                {brands.slice(currentBrandIndex, currentBrandIndex + 5).map(brand => (
                  <div key={brand._id} onClick={() => handleBrandClick(brand)} className="group flex flex-col items-center cursor-pointer">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 mb-4 transform transition-all duration-300 group-hover:scale-105">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300 border-4 border-white">
                        <div
                          className="w-full h-full bg-white bg-center bg-cover bg-no-repeat transform transition-transform duration-500 group-hover:scale-110"
                          style={{ backgroundImage: `url(${getPublicImageUrl(brand.businessDetails?.brandLogo?.url)})`, backgroundSize: 'contain' }}
                        />
                        <div className="absolute inset-0 bg-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300 text-center line-clamp-2">
                      {brand.businessDetails?.businessName || brand.name}
                    </h3>
                  </div>
                ))}
              </div>

              {brands.length > 5 && (
                <>
                  <button onClick={prevBrand} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-10">
                    <HiChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={nextBrand} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-white hover:bg-gray-50 text-gray-800 p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-10">
                    <HiChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {brands.length > 5 && (
              <div className="flex justify-center gap-3 mt-12">
                {Array.from({ length: Math.ceil(brands.length / 5) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBrandIndex(index * 5)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${Math.floor(currentBrandIndex / 5) === index ? 'bg-green-600 w-12 shadow-md' : 'bg-gray-300 w-2.5 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Stats ── */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-green-700 to-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2 transform transition-all duration-300 hover:scale-105">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">10,000+</div>
              <div className="text-green-100 text-base md:text-lg font-medium">{t('home.stats.products')}</div>
            </div>
            <div className="space-y-2 transform transition-all duration-300 hover:scale-105">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">50,000+</div>
              <div className="text-green-100 text-base md:text-lg font-medium">{t('home.stats.happyFarmers')}</div>
            </div>
            <div className="space-y-2 transform transition-all duration-300 hover:scale-105">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">{brands.length}+</div>
              <div className="text-green-100 text-base md:text-lg font-medium">Trusted Brands</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">Ready to Start Selling?</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Join thousands of successful sellers and grow your agricultural business with us.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold px-10 md:px-12 py-4 md:py-5 rounded-lg transform transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl text-base md:text-lg"
          >
            <span>Become a Seller Today</span>
            <HiArrowRight className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:translate-x-2" />
          </Link>
        </div>
      </section>

      {/* ── Supplier Modal ── */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSupplierModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <button onClick={() => setShowSupplierModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <HiX className="w-6 h-6 text-gray-500" />
            </button>

            {selectedBrand?.businessDetails?.brandLogo?.url && (
              <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-green-100 shadow-lg">
                <div className="w-full h-full bg-white bg-center bg-contain bg-no-repeat" style={{ backgroundImage: `url(${getPublicImageUrl(selectedBrand.businessDetails.brandLogo.url)})` }} />
              </div>
            )}

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedBrand?.businessDetails?.businessName || 'Brand'}</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-900 font-medium mb-2">
                  {selectedBrand?.role === 'retailer' ? 'Retail Products Available' : 'Wholesale Products Available'}
                </p>
                <p className="text-blue-700 text-sm">
                  {selectedBrand?.role === 'retailer'
                    ? 'This is a retailer brand. You can view their retail products and contact them for bulk orders.'
                    : 'As a supplier, you can view wholesale products from this brand. Contact them directly for bulk orders and wholesale pricing.'}
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSupplierModal(false);
                    const brandName = selectedBrand?.businessDetails?.businessName || selectedBrand?.name;
                    navigate(`/products?brand=${encodeURIComponent(brandName)}`);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {selectedBrand?.role === 'retailer' ? 'View Products' : 'View Wholesale Products'}
                </button>
                <button onClick={() => setShowSupplierModal(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;