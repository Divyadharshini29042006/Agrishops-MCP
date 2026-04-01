// frontend/src/components/Navbar.jsx - FIXED: Clean mega menu like KisanShop
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiShoppingCart, HiUser, HiMenu, HiX, HiSearch, HiLogout,
  HiUserCircle, HiShoppingBag, HiGlobeAlt, HiChevronDown,
  HiCube, HiClipboardList, HiOfficeBuilding, HiViewGrid, HiDocumentText,
  HiChatAlt2, HiStar
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import TranslatedText from './TranslatedText';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);

  // ✅ Dynamic category state
  const [categoryTree, setCategoryTree] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount, unreadOrderCount } = useNotifications();

  // Check user roles
  const isSupplier = user?.role === 'supplier';
  const isRetailer = user?.role === 'retailer';
  const isCustomer = user?.role === 'customer';

  // ✅ FETCH CATEGORIES ON MOUNT
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/tree');
      if (response.data.success) {
        setCategoryTree(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ENHANCED NAVIGATION - Flattened for better UX
  const navItems = useMemo(() => {
    if (!categoryTree) return [{ name: 'Home', path: '/', isHome: true }];

    const items = [{ name: 'Home', path: '/', isHome: true }];

    // Flatten Seeds and Crop Protection subcategories to top level
    categoryTree.forEach(mainCat => {
      if (mainCat.children) {
        mainCat.children.forEach(subCat => {
          items.push({
            name: subCat.name,
            slug: subCat.slug,
            path: `/products?category=${subCat.slug}`,
            hasDropdown: subCat.children && subCat.children.length > 0,
            children: subCat.children,
            mainCategory: mainCat.name
          });
        });
      }
    });

    return items;
  }, [categoryTree]);

  // ✅ UPDATED MEGA MENU DATA FOR FLATTENED ITEMS
  const megaMenuData = useMemo(() => {
    if (!categoryTree) return {};

    const data = {};
    categoryTree.forEach(mainCat => {
      mainCat.children?.forEach(subCat => {
        // For each subcategory, if it has types, show them in columns
        if (subCat.children && subCat.children.length > 0) {
          // Chunk types into 2 columns if more than 6
          const types = subCat.children;
          const chunkSize = 8;
          const columns = [];

          for (let i = 0; i < types.length; i += chunkSize) {
            columns.push({
              heading: i === 0 ? "Categories" : "",
              items: types.slice(i, i + chunkSize).map(type => ({
                name: type.name,
                path: `/products?category=${type.slug}`
              }))
            });
          }

          data[subCat.slug] = {
            title: subCat.name,
            columns: columns
          };
        }
      });
    });

    return data;
  }, [categoryTree]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setShowLanguageMenu(false);
  };

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMegaMenu(null);
    if (activeMegaMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMegaMenu]);

  // Admin Navigation
  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HiUserCircle },
    { name: 'User Approval', path: '/admin/user-approval', icon: HiUser },
    { name: 'Product Moderation', path: '/admin/product-moderation', icon: HiShoppingBag },
    { name: 'Manage Users', path: '/admin/users', icon: HiUserCircle },
    { name: 'Stock Monitor', path: '/admin/stock-monitor', icon: HiShoppingCart },
    { name: 'Order Reviews', path: '/admin/reviews', icon: HiClipboardList },
  ];

  // Supplier Navigation
  const supplierNavItems = [
    { name: 'Dashboard', path: '/supplier/dashboard', icon: HiUserCircle },
    { name: 'My Products', path: '/supplier/products', icon: HiCube },
    { name: 'Orders', path: '/supplier/orders', icon: HiClipboardList },
    { name: 'Inquiries', path: '/supplier/wholesale-inquiries', icon: HiChatAlt2 },
    { name: 'My Reviews', path: '/supplier/reviews', icon: HiStar },
    { name: 'Profile', path: '/supplier/profile', icon: HiOfficeBuilding },
  ];

  // Retailer Navigation
  const retailerNavItems = [
    { name: 'Dashboard', path: '/retailer/dashboard', icon: HiViewGrid },
    { name: 'My Products', path: '/retailer/products', icon: HiCube },
    { name: 'Inventory', path: '/retailer/inventory', icon: HiShoppingCart },
    { name: 'Browse Suppliers', path: '/retailer/suppliers', icon: HiShoppingBag },
    { name: 'Orders', path: '/retailer/orders', icon: HiClipboardList },
    { name: 'My Reviews', path: '/retailer/reviews', icon: HiStar },
    { name: 'Profile', path: '/retailer/profile', icon: HiOfficeBuilding },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      {/* Main Navbar */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <Link
              to={
                isAdmin ? "/admin/dashboard" :
                  isSupplier ? "/supplier/dashboard" :
                    isRetailer ? "/retailer/dashboard" :
                      "/"
              }
              className="flex items-center group"
            >
              <div className={`${isAdmin ? 'bg-red-600' :
                isSupplier ? 'bg-blue-600' :
                  isRetailer ? 'bg-purple-600' :
                    'bg-green-600'
                } p-2 rounded-lg transition-all`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-800">AgriShop</span>
              {isAdmin && <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Admin</span>}
              {isSupplier && <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Supplier</span>}
              {isRetailer && <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Retailer</span>}
            </Link>

            {/* Desktop Search Bar (Hide for Admin, Supplier, Retailer) */}
            {!isAdmin && !isSupplier && !isRetailer && (
              <div className="hidden md:flex flex-1 max-w-xl mx-8">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('common.searchFor')}
                      className="w-full px-4 py-2 pl-10 pr-20 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none transition-all text-sm"
                    />
                    <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-5 py-1.5 rounded-md transition-colors text-sm font-medium"
                    >
                      {t('common.search') || 'Search'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-1.5 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <HiGlobeAlt className="text-xl text-gray-700" />
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {currentLang.flag} {currentLang.name}
                  </span>
                  <HiChevronDown className={`text-gray-500 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Select Language</p>
                    </div>
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${currentLanguage === lang.code ? 'bg-green-50' : ''
                          }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className={`text-sm ${currentLanguage === lang.code ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>
                          {lang.name}
                        </span>
                        {currentLanguage === lang.code && <span className="ml-auto text-green-600">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Become Seller Button */}
              {(!isAuthenticated || isCustomer) && (
                <Link
                  to="/register"
                  className="hidden lg:flex items-center gap-1 text-gray-700 hover:text-green-600 font-medium text-sm transition-colors"
                >
                  <HiShoppingBag className="w-4 h-4" />
                  <span>{t('nav.becomeSeller')}</span>
                </Link>
              )}

              {/* Login/User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <HiUser className="text-xl text-gray-700" />
                    <span className="hidden md:inline text-sm font-medium text-gray-800">
                      {user?.name || 'Account'}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      {/* Admin Menu */}
                      {isAdmin && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-xs text-red-600">Administrator</p>
                          </div>
                          {adminNavItems.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                              <Link
                                key={index}
                                to={item.path}
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <IconComponent className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">{item.name}</span>
                              </Link>
                            );
                          })}
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                          >
                            <HiLogout className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">{t('nav.logout')}</span>
                          </button>
                        </>
                      )}

                      {/* Supplier Menu */}
                      {isSupplier && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-xs text-blue-600">Supplier Account</p>
                          </div>
                          {supplierNavItems.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                              <Link
                                key={index}
                                to={item.path}
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <IconComponent className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">{item.name}</span>
                              </Link>
                            );
                          })}
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                          >
                            <HiLogout className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">{t('nav.logout')}</span>
                          </button>
                        </>
                      )}

                      {/* Retailer Menu */}
                      {isRetailer && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-xs text-purple-600">Retailer Account</p>
                          </div>
                          {retailerNavItems.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                              <Link
                                key={index}
                                to={item.path}
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <IconComponent className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">{item.name}</span>
                              </Link>
                            );
                          })}
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                          >
                            <HiLogout className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">{t('nav.logout')}</span>
                          </button>
                        </>
                      )}

                      {/* Customer Menu */}
                      {isCustomer && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                          </div>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <HiUserCircle className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{t('nav.profile')}</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <HiShoppingCart className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">My Orders</span>
                          </Link>
                          <Link
                            to="/wholesale-inquiries"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <HiDocumentText className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">Wholesale Inquiries</span>
                          </Link>
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left"
                          >
                            <HiLogout className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600">{t('nav.logout')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-gray-700 hover:text-green-600 font-medium text-sm transition-colors"
                >
                  <HiUser className="text-xl" />
                  <span className="hidden md:inline">{t('nav.login')}</span>
                </Link>
              )}

              {/* Cart Icon - Show for Customers AND Retailers */}
              {!isAdmin && !isSupplier && (
                <Link
                  to={isRetailer ? "/retailer/cart" : "/cart"}
                  className="relative flex items-center gap-1 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <HiShoppingCart className="text-2xl" />
                  <span className="hidden md:inline font-medium text-sm">{t('nav.cart')}</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-700 hover:text-green-600 transition-colors"
              >
                {isMenuOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (Only for public/customers) */}
        {!isAdmin && !isSupplier && !isRetailer && (
          <div className="md:hidden px-4 pb-3">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.searchFor')}
                  className="w-full px-4 py-2.5 pl-10 pr-20 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 focus:outline-none transition-all text-sm"
                />
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md transition-colors text-xs font-medium"
                >
                  {t('common.search') || 'Search'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ✅ CLEAN MEGA MENU CATEGORIES BAR (Only for customers/public) */}
      {!isAdmin && !isSupplier && !isRetailer && (
        <div className="bg-white border-b border-gray-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex items-center justify-center gap-10 py-3.5">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                navItems.map((item, index) => {
                  const isActive = item.isHome
                    ? location.pathname === '/'
                    : (location.pathname === item.path || (item.slug && location.search.includes(item.slug)));

                  return (
                    <div
                      key={index}
                      className="relative group pr-2"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        if (item.hasDropdown) {
                          setActiveMegaMenu(item.slug);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center gap-1.5 font-semibold text-[13.5px] transition-all duration-300 whitespace-nowrap py-1 relative
                        ${isActive ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}
                      `}
                      >
                        <TranslatedText text={item.name} />
                        {item.hasDropdown && (
                          <HiChevronDown className={`text-gray-400 text-xs transition-transform duration-300 ${activeMegaMenu === item.slug ? 'rotate-180' : ''}`} />
                        )}
                        {/* Premium Animated Underline */}
                        <span className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 rounded-full 
                        ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
                      `}></span>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ✅ CLEAN MEGA MENU DROPDOWN - 3 COLUMNS MAX, LIMITED ITEMS */}
          {activeMegaMenu && megaMenuData[activeMegaMenu] && (
            <div
              className="absolute left-0 right-0 bg-white shadow-xl border-t border-gray-100 z-40 animate-in fade-in slide-in-from-top-2 duration-300"
              onMouseLeave={() => setActiveMegaMenu(null)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex gap-16">
                  {/* Left info box for premium feel */}
                  <div className="w-64 flex-shrink-0 bg-green-50 rounded-2xl p-6 hidden lg:block">
                    <h4 className="text-xl font-bold text-green-800 mb-2">
                      <TranslatedText text={megaMenuData[activeMegaMenu].title} />
                    </h4>
                    <p className="text-sm text-green-700 opacity-80 leading-relaxed">
                      Find the best selection of quality varieties specifically curated for your needs.
                    </p>
                    <div className="mt-6">
                      <Link
                        to={`/products?category=${activeMegaMenu}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 bg-white px-4 py-2 rounded-lg shadow-sm transition-all"
                      >
                        Browse All
                      </Link>
                    </div>
                  </div>

                  {/* Columns */}
                  <div
                    className="flex-grow grid gap-10"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(megaMenuData[activeMegaMenu].columns.length, 3)}, minmax(0, 1fr))`
                    }}
                  >
                    {megaMenuData[activeMegaMenu].columns.map((column, colIndex) => (
                      <div key={colIndex}>
                        {column.heading && (
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                            <TranslatedText text={column.heading} />
                          </h3>
                        )}
                        <ul className="space-y-3">
                          {column.items.map((item, itemIndex) => (
                            <li key={itemIndex}>
                              <Link
                                to={item.path}
                                onClick={() => setActiveMegaMenu(null)}
                                className="text-sm text-gray-600 hover:text-green-600 flex items-center gap-2 transition-all duration-200 hover:translate-x-1"
                              >
                                <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-green-500"></span>
                                <TranslatedText text={item.name} />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Navigation Bar */}
      {isAdmin && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex items-center gap-6 py-3">
              {adminNavItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-2 font-medium text-sm transition-colors border-b-2 py-1 ${isActive
                      ? 'text-red-600 border-red-600'
                      : 'text-gray-700 border-transparent hover:text-red-600'
                      }`}
                  >
                    <span>{item.name}</span>
                    {item.name === 'Orders' && unreadOrderCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Navigation Bar */}
      {isSupplier && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex items-center gap-6 py-3">
              {supplierNavItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-2 font-medium text-sm transition-colors border-b-2 py-1 ${isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-700 border-transparent hover:text-blue-600'
                      }`}
                  >
                    <span>{item.name}</span>
                    {item.name === 'Orders' && unreadOrderCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                      </span>
                    )}
                    {item.name === 'Wholesale Inquiries' && unreadOrderCount > 0 && (
                      <span className="ml-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Retailer Navigation Bar */}
      {isRetailer && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex items-center gap-6 py-3">
              {retailerNavItems.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-2 font-medium text-sm transition-colors border-b-2 py-1 ${isActive
                      ? 'text-purple-600 border-purple-600'
                      : 'text-gray-700 border-transparent hover:text-purple-600'
                      }`}
                  >
                    <span>{item.name}</span>
                    {item.name === 'Orders' && unreadOrderCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Language Selector */}
            <div className="pb-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Language</p>
              <div className="grid grid-cols-2 gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${currentLanguage === lang.code
                      ? 'bg-green-50 border-2 border-green-600'
                      : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className={`text-sm ${currentLanguage === lang.code ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>
                      {lang.name}
                    </span>
                    {currentLanguage === lang.code && <span className="ml-auto text-green-600">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Navigation List - Categories for public/customers */}
            {!isAdmin && !isSupplier && !isRetailer && (
              <div className="pb-3 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Categories</p>
                <div className="flex flex-col gap-1">
                  {loading ? (
                    <div className="py-2 text-sm text-gray-400">Loading categories...</div>
                  ) : (
                    navItems.map((item, index) => (
                      <div key={index}>
                        <Link
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between py-2 text-gray-700 font-medium hover:text-green-600"
                        >
                          <TranslatedText text={item.name} />
                          {item.hasDropdown && <HiChevronDown className="text-gray-400" />}
                        </Link>
                        {item.hasDropdown && (
                          <div className="pl-4 pb-2 grid grid-cols-1 gap-1">
                            {item.children?.slice(0, 6).map((child, cIdx) => (
                              <Link
                                key={cIdx}
                                to={`/products?category=${child.slug}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm text-gray-500 py-1"
                              >
                                {child.name}
                              </Link>
                            ))}
                            <Link
                              to={item.path}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-xs text-green-600 font-bold py-1"
                            >
                              Browse All
                            </Link>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Content based on User Role */}
            {isAdmin ? (
              <>
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-red-600">Administrator</p>
                </div>
                {adminNavItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={index}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 px-3 rounded transition-colors"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-center py-2.5 rounded-lg font-semibold transition-colors mt-4"
                >
                  Logout
                </button>
              </>
            ) : isSupplier ? (
              <>
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-blue-600">Supplier Account</p>
                </div>
                {supplierNavItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={index}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 rounded transition-colors"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.name === 'Orders' && unreadOrderCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                        </span>
                      )}
                      {item.name === 'Wholesale Inquiries' && unreadOrderCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadOrderCount > 9 ? '9+' : unreadOrderCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-lg font-semibold transition-colors mt-4"
                >
                  Logout
                </button>
              </>
            ) : isRetailer ? (
              <>
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-purple-600">Retailer Account</p>
                </div>
                {retailerNavItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={index}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 rounded transition-colors"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2.5 rounded-lg font-semibold transition-colors mt-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Mobile Search */}
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('common.searchFor')}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                    />
                    <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </form>

                {/* Mobile Categories */}
                <div className="space-y-1 pt-2">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-2 px-3 rounded transition-colors text-sm font-medium
                        ${location.pathname === item.path || (item.slug && location.search.includes(item.slug))
                          ? 'bg-green-50 text-green-600'
                          : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                        }`}
                    >
                      <TranslatedText text={item.name} />
                    </Link>
                  ))}
                </div>

                {isAuthenticated && isCustomer && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 rounded transition-colors text-sm"
                    >
                      {t('nav.profile')}
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 rounded transition-colors text-sm"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wholesale-inquiries"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 rounded transition-colors text-sm"
                    >
                      Wholesale Inquiries
                    </Link>
                  </>
                )}

                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2.5 rounded-lg font-semibold transition-colors mt-4"
                  >
                    {t('nav.login')}
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
