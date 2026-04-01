// frontend/src/pages/public/Login.jsx - COMPLETE FIX
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Get redirect path from location state or default
  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📝 Submitting login form...');
      
      const result = await login(formData.email, formData.password);
      
      console.log('📦 Login result:', result);
      
      if (result.success) {
        const role = result.user?.role;
        const isApproved = result.user?.isApproved;
        
        console.log('✅ Login successful!');
        console.log('👤 Role:', role);
        console.log('✔️ Approved:', isApproved);
        
        // ✅ ROLE-BASED REDIRECT WITH APPROVAL CHECK
        let redirectPath;
        
        switch (role) {
          case 'admin':
            redirectPath = '/admin/dashboard';
            break;
            
          case 'supplier':
            if (!isApproved) {
              setError('Your account is pending admin approval. You will be notified once approved.');
              setLoading(false);
              // ✅ Don't logout - just show error and stop
              return;
            }
            redirectPath = '/supplier/dashboard';
            break;
            
          case 'retailer':
            if (!isApproved) {
              setError('Your account is pending admin approval. You will be notified once approved.');
              setLoading(false);
              // ✅ Don't logout - just show error and stop
              return;
            }
            redirectPath = '/retailer/dashboard';
            break;
            
          case 'customer':
          default:
            // ✅ Redirect to original destination or products
            redirectPath = from || '/products';
            break;
        }
        
        console.log('🚀 Redirecting to:', redirectPath);
        
        // ✅ Navigate with replace to prevent back button issues
        navigate(redirectPath, { replace: true });
        
      } else {
        // ✅ Show error from login response
        setError(result.error || 'Invalid email or password');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Redirecting to Google OAuth...');
    // ✅ Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {t('auth.login.title') || 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {t('auth.login.subtitle') || 'Sign in to continue shopping'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="transform transition-all duration-200 focus-within:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.email') || 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMail className="h-5 w-5 text-green-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="transform transition-all duration-200 focus-within:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.password') || 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLockClosed className="h-5 w-5 text-green-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 transition-all"
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-green-600 transition-colors">
                  {t('auth.login.rememberMe') || 'Remember me'}
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                {t('auth.login.forgotPassword') || 'Forgot password?'}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('auth.login.signingIn') || 'Signing in...'}
                </span>
              ) : (
                t('auth.login.signIn') || 'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                {t('auth.login.continueWith') || 'Or continue with'}
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-green-500 text-gray-700 font-semibold py-3 px-4 rounded-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md hover:shadow-lg group"
          >
            <FcGoogle className="text-2xl" />
            <span className="group-hover:text-green-600 transition-colors">
              {t('auth.login.google') || 'Sign in with Google'}
            </span>
          </button>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {t('auth.login.noAccount') || "Don't have an account?"}{' '}
              <Link
                to="/register"
                className="text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                {t('auth.login.createAccount') || 'Create Account'}
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {t('auth.login.termsPrefix') || 'By continuing, you agree to our'}{' '}
            <Link to="/terms" className="text-green-600 hover:underline">
              {t('auth.login.terms') || 'Terms of Service'}
            </Link>{' '}
            {t('auth.login.and') || 'and'}{' '}
            <Link to="/privacy" className="text-green-600 hover:underline">
              {t('auth.login.privacy') || 'Privacy Policy'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;