// frontend/src/pages/customer/Products.jsx - COMPLETE FIX: All 3 issues resolved
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HiSearch, HiFilter, HiX, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import ProductCard from '../../components/ProductCard';
import api from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';
import Skeleton from '../../components/Skeleton';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Get filters from URL
  const categoryFromURL = searchParams.get('category') || '';
  const searchFromURL = searchParams.get('search') || '';

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(categoryFromURL);
  const [searchQuery, setSearchQuery] = useState(searchFromURL);
  const [sortBy, setSortBy] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Dynamic categories and brands
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    brand: false,
    price: false
  });

  useEffect(() => {
    fetchCategoryTree();
  }, []);

  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlBrand = searchParams.get('brand') || '';

    setSelectedCategory(urlCategory);
    setSearchQuery(urlSearch);

    // Handle brand from URL
    if (urlBrand) {
      setSelectedBrands([urlBrand]);
      // Expand brand section when coming from brand filter
      setExpandedSections(prev => ({ ...prev, brand: true }));
    } else {
      setSelectedBrands([]);
    }

    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [selectedCategory, searchQuery, sortBy, priceRange, selectedBrands, page]);

  const fetchCategoryTree = async () => {
    try {
      const response = await api.get('/api/categories/tree');
      if (response.data.success) {
        setCategoryTree(response.data.data || []);

        const flatCategories = [];
        response.data.data.forEach(main => {
          flatCategories.push({
            slug: main.slug,
            name: main.name,
            level: 'main',
            _id: main._id
          });

          if (main.children) {
            main.children.forEach(sub => {
              flatCategories.push({
                slug: sub.slug,
                name: sub.name,
                level: 'sub',
                parent: main.name,
                _id: sub._id
              });

              if (sub.children) {
                sub.children.forEach(type => {
                  flatCategories.push({
                    slug: type.slug,
                    name: type.name,
                    level: 'type',
                    parent: sub.name,
                    _id: type._id
                  });
                });
              }
            });
          }
        });

        setCategories(flatCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15, // Slightly increased limit for better grid filling
      };

      // ✅ FIX: Proper category filtering using category slug
      if (selectedCategory) {
        // Send the slug directly - backend will handle it
        params.category = selectedCategory;
      }

      if (searchQuery) params.search = searchQuery;
      if (sortBy) params.sort = sortBy;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;
      if (selectedBrands.length > 0) params.brands = selectedBrands.join(',');

      console.log('Fetching products with params:', params); // Debug

      const response = await api.get('/api/products', { params, signal });

      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalProducts(response.data.pagination?.total || 0);

        const uniqueBrands = [...new Set(
          response.data.data
            .map(p => p.seller?.businessDetails?.businessName)
            .filter(Boolean)
        )];
        setBrands(uniqueBrands);
      }
    } catch (error) {
      // ✅ Ignore AbortError/CanceledError — these are expected when filters change quickly
      if (error?.code === 'ERR_CANCELED' || error?.name === 'AbortError' || error?.name === 'CanceledError') {
        return; // Don't clear products or update loading on abort
      }
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categorySlug) => {
    console.log('Category changed to:', categorySlug); // Debug
    setSelectedCategory(categorySlug);
    setPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (categorySlug) {
      newParams.set('category', categorySlug);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortBy('');
    setPriceRange({ min: '', max: '' });
    setSelectedBrands([]);
    setPage(1);
    setSearchParams({});
  };

  const applyFilters = () => {
    setShowFilters(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getCurrentCategoryName = () => {
    // If filtering by brand, show brand name
    if (selectedBrands.length > 0) {
      return selectedBrands[0]; // Show the brand name
    }

    if (!selectedCategory) return 'All Products';
    const category = categories.find(cat => cat.slug === selectedCategory);
    return category ? category.name : 'Products';
  };

  // Check if any filters are active
  const hasActiveFilters = selectedCategory || selectedBrands.length > 0 || priceRange.min || priceRange.max;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">
            {getCurrentCategoryName()}
          </span>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getCurrentCategoryName()}
          </h1>
          <p className="text-gray-600">
            {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {/* Filter Button and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-sm md:text-base font-medium text-gray-700 min-h-[44px]"
          >
            <HiFilter className="w-5 h-5" />
            <span>Filter</span>
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm text-sm md:text-base min-h-[44px]"
          >
            <option value="">Sort By</option>
            <option value="pricing.finalPrice">Price: Low to High</option>
            <option value="-pricing.finalPrice">Price: High to Low</option>
            <option value="-rating.average">Highest Rated</option>
            <option value="-createdAt">Newest First</option>
            <option value="-soldQuantity">Best Selling</option>
          </select>
        </div>

        {/* ✅ FIX 1: RIGHT-SIDE FILTER MODAL (Like Kisan Shop) */}
        {showFilters && (
          <div className="fixed inset-0 z-50">
            {/* Dark Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowFilters(false)}
            />

            {/* ✅ Filter Sidebar from RIGHT (Full width on mobile) */}
            <div className="absolute top-0 right-0 bottom-0 w-full md:w-96 bg-white shadow-2xl flex flex-col animate-slideInRight">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <HiFilter className="w-6 h-6 text-gray-900" />
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                  {hasActiveFilters && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiX className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Category Section */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('category')}
                    className="w-full flex items-center justify-between py-3 border-b border-gray-200"
                  >
                    <h3 className="font-bold text-gray-900 text-base">Category</h3>
                    {expandedSections.category ? (
                      <HiChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <HiChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {expandedSections.category && (
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCategory === ''}
                          onChange={() => handleCategoryChange('')}
                          className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                        />
                        <span className="text-gray-700">All Categories</span>
                      </label>

                      {categoryTree.map((mainCat) => (
                        <div key={mainCat._id} className="space-y-1">
                          <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedCategory === mainCat.slug}
                              onChange={() => handleCategoryChange(mainCat.slug)}
                              className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                            />
                            <span className="text-gray-900 font-medium">{mainCat.name}</span>
                          </label>

                          {mainCat.children && mainCat.children.length > 0 && (
                            <div className="ml-8 space-y-1">
                              {mainCat.children.map((subCat) => (
                                <label key={subCat._id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategory === subCat.slug}
                                    onChange={() => handleCategoryChange(subCat.slug)}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{subCat.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand Section */}
                {brands.length > 0 && (
                  <div className="mb-6">
                    <button
                      onClick={() => toggleSection('brand')}
                      className="w-full flex items-center justify-between py-3 border-b border-gray-200"
                    >
                      <h3 className="font-bold text-gray-900 text-base">Brand</h3>
                      {expandedSections.brand ? (
                        <HiChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <HiChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.brand && (
                      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                        {brands.map((brand) => (
                          <label key={brand} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={() => handleBrandToggle(brand)}
                              className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                            />
                            <span className="text-gray-700">{brand}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Section */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('price')}
                    className="w-full flex items-center justify-between py-3 border-b border-gray-200"
                  >
                    <h3 className="font-bold text-gray-900 text-base">Price</h3>
                    {expandedSections.price ? (
                      <HiChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <HiChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {expandedSections.price && (
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Min ₹"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                      />
                      <input
                        type="number"
                        placeholder="Max ₹"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="border-t border-gray-200 p-4 bg-white flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid - Full width */}
        <main className="w-full">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <Skeleton variant="rectangular" height="180px" className="rounded-xl" />
                  <Skeleton width="80%" height="1.2rem" />
                  <Skeleton width="40%" height="1rem" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton width="60px" height="1.5rem" />
                    <Skeleton width="32px" height="32px" variant="circular" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiSearch className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg ${page === pageNum
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ✅ Add CSS for slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Products;