// frontend/src/App.jsx - COMPLETE WITH ALL ROUTES
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ToastContainer from './components/common/Toast';
import NotificationPopUp from './components/NotificationPopUp';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot/Chatbot';
import { useAuth } from './hooks/useAuth';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import VerifyOTP from './pages/public/VerifyOTP';
import ResetPassword from './pages/public/ResetPassword';

// ⭐ Customer Pages (NEW)
import Products from './pages/customer/Products';
import ProductDetails from './pages/customer/ProductDetails';
import Cart from './pages/customer/Cart';
import WholesaleInquiries from './pages/customer/WholesaleInquiries';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerOrders from './pages/customer/CustomerOrders';
import WholesaleCheckout from './pages/customer/WholesaleCheckout';
import Checkout from './pages/customer/Checkout';
import CustomerOrderDetails from './pages/customer/OrderDetails';


// Farmer Pages
import FarmerDashboard from './pages/farmer/farmerDashboard';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserApproval from './pages/admin/UserApproval';
import ProductModeration from './pages/admin/ProductModeration';
import UserManagement from './pages/admin/UserManagement';
import StockMonitor from './pages/admin/StockMonitor';
import AdminProfile from './pages/admin/AdminProfile';
import VarietyModeration from './pages/admin/VarietyModeration';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';


// Supplier Pages
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierProducts from './pages/supplier/SupplierProducts';
import AddProduct from './pages/supplier/AddProduct';
import EditProduct from './pages/supplier/EditProduct';
import SupplierOrders from './pages/supplier/SupplierOrders';
import SupplierOrderDetails from './pages/supplier/SupplierOrderDetail';
import SupplierProfile from './pages/supplier/SupplierProfile';
import SupplierWholesaleInquiries from './pages/supplier/SupplierWholesaleInquiries';

// Retailer Pages
import RetailerDashboard from './pages/retailer/RetailerDashboard';
import RetailerProfile from './pages/retailer/RetailerProfile';
import RetailerProducts from './pages/retailer/RetailerProducts';
import RetailerInventory from './pages/retailer/RetailerInventory';
import BrowseSupplierProducts from './pages/retailer/BrowseSupplierProducts';
import RetailerOrders from './pages/retailer/RetailerOrders';
import OrderDetails from './pages/retailer/OrderDetails';
import RetailerCart from './pages/retailer/RetailerCart';
import RetailerAddProduct from './pages/retailer/RetailerAddProduct';
import RetailerEditProduct from './pages/retailer/RetailerEditProduct';

// Common Pages
import SellerReviews from './pages/common/SellerReviews';

// ✅ Home/Dashboard Redirection
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null; // Let AppContent handle loading if needed, or return null

  if (isAuthenticated && user) {
    const dashboardPath = {
      'admin': '/admin/dashboard',
      'supplier': '/supplier/dashboard',
      'retailer': '/retailer/dashboard',
      'farmer': '/farmer/dashboard',
    }[user.role];

    if (dashboardPath) {
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <Home />;
}

function AppContent() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <ToastContainer />
      <NotificationPopUp />

      <main className="flex-grow">
        <Routes>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ========== ⭐ CUSTOMER ROUTES (Public - NEW) ========== */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wholesale-inquiries" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <WholesaleInquiries />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerOrders />
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerOrderDetails />
            </ProtectedRoute>
          } />
          <Route path="/wholesale/checkout/:id" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <WholesaleCheckout />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Checkout />
            </ProtectedRoute>
          } />

          {/* ========== FARMER ROUTES ========== */}
          <Route path="/farmer/dashboard" element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />

          {/* ========== ADMIN ROUTES (Protected - Admin Only) ========== */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user-approval"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/product-moderation"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProductModeration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stock-monitor"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StockMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/variety-moderation"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VarietyModeration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReviews />
              </ProtectedRoute>
            }
          />

          {/* Redirect /admin to /admin/dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* ========== SUPPLIER ROUTES (Protected - Supplier Only) ========== */}
          <Route
            path="/supplier/dashboard"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/products"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/products/add"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/products/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/orders"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierOrderDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/profile"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/wholesale-inquiries"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierWholesaleInquiries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/reviews"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SellerReviews />
              </ProtectedRoute>
            }
          />

          {/* Redirect /supplier to /supplier/dashboard */}
          <Route path="/supplier" element={<Navigate to="/supplier/dashboard" replace />} />

          {/* ========== RETAILER ROUTES (Protected - Retailer Only) ========== */}
          <Route
            path="/retailer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/profile"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/products"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/products/add"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerAddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/products/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerEditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/inventory"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/suppliers"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <BrowseSupplierProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/orders"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/cart"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerCart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailer/reviews"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <SellerReviews />
              </ProtectedRoute>
            }
          />

          {/* Redirect /retailer to /retailer/dashboard */}
          <Route path="/retailer" element={<Navigate to="/retailer/dashboard" replace />} />

          {/* ========== 404 PAGE ========== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      {(user?.role === 'farmer' || user?.role === 'customer') && <Chatbot />}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <NotificationProvider>
              <Router>
                <AppContent />
              </Router>
            </NotificationProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;