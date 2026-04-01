// frontend/src/components/ProtectedRoute.jsx - COMPLETE FIX
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ✅ Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Not authenticated - redirect to login
  if (!user) {
    console.log('🔒 Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log(`⚠️ Unauthorized role: ${user.role}, allowed: ${allowedRoles.join(', ')}`);

    // ✅ Redirect to appropriate dashboard based on user role
    const redirectPath = {
      'admin': '/admin/dashboard',
      'supplier': '/supplier/dashboard',
      'retailer': '/retailer/dashboard',
      'customer': '/products'
    }[user.role] || '/';

    return <Navigate to={redirectPath} replace />;
  }

  // ✅ Check if seller is approved (for supplier/retailer only)
  if ((user.role === 'supplier' || user.role === 'retailer') && !user.isApproved) {
    console.log('⚠️ User not approved yet');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-block p-3 bg-yellow-100 rounded-full">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Account Pending Approval
          </h2>
          <p className="text-gray-600 mb-6">
            Your {user.role} account is currently under review by our admin team.
            You will be notified via email once your account is approved.
          </p>
          <p className="text-sm text-gray-500">
            This usually takes 1-2 business days.
          </p>
          <div className="mt-8">
            <button
              onClick={() => window.location.href = '/login'}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ User is authenticated and authorized
  return children;
};

export default ProtectedRoute;