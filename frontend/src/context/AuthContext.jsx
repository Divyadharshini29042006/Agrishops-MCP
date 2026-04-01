// frontend/src/context/AuthContext.jsx - COMPLETE FIX
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import useToast from '../hooks/useToast';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const { showSuccess, showError, showInfo } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Start with loading true
  const [initialCheckDone, setInitialCheckDone] = useState(false); // ✅ Track if initial check is done

  // ✅ ONLY load user once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log('🔄 Loading user from token...');
          const response = await api.get('/auth/me');
          
          const userData = response.data.data || response.data;
          setUser(userData);
          console.log('✅ User loaded:', userData.name, userData.role);
        } catch (error) {
          console.error('❌ Failed to load user:', error);
          // Clear invalid token
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      
      setLoading(false);
      setInitialCheckDone(true);
    };

    initializeAuth();

    // ✅ Handle Google Login Redirect (Token in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const userFromUrl = urlParams.get('user');

    if (tokenFromUrl && userFromUrl) {
      try {
        console.log('🌐 Google login detected from URL...');
        const userData = JSON.parse(userFromUrl);
        
        localStorage.setItem('token', tokenFromUrl);
        setUser(userData);
        
        showSuccess(`Welcome, ${userData.name}! Successfully signed in with Google.`);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('❌ Failed to parse user from Google login:', error);
        showError('Google authentication failed. Please try again.');
      }
    }
  }, []); // ✅ Empty dependency array - only run once on mount

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login...', email);
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('📦 Login response:', response.data);
      
      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        console.error('❌ Missing token or user in response');
        showError('Invalid response from server');
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }

      // ✅ Store token
      localStorage.setItem('token', token);
      
      // ✅ Set user state
      setUser(userData);
      
      console.log('✅ Login successful! User:', userData.name, 'Role:', userData.role);
      
      // ✅ Show success toast
      showSuccess(`Welcome back, ${userData.name}!`);
      
      return { 
        success: true, 
        user: userData 
      };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'Login failed';
      
      showError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      const message = response.data.message || 'Registration successful';
      showSuccess(message);
      
      return { 
        success: true, 
        message 
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      
      showError(errorMsg);
      
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };

  const logout = () => {
    const userName = user?.name || 'User';
    
    console.log('👋 Logging out:', userName);
    
    // Clear storage
    localStorage.removeItem('token');
    
    // Clear state
    setUser(null);
    
    // Show toast
    showInfo(`Goodbye, ${userName}! You've been logged out.`);
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/users/profile', data);
      const updatedUser = response.data.data || response.data;
      
      setUser(updatedUser);
      
      showSuccess('Profile updated successfully!');
      
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed';
      
      showError(errorMsg);
      
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      showSuccess(response.data.message || 'OTP sent to your email');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request OTP';
      showError(message);
      return { success: false, error: message };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      showSuccess(response.data.message || 'OTP verified successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired OTP';
      showError(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      showSuccess(response.data.message || 'Password reset successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      showError(message);
      return { success: false, error: message };
    }
  };

  // ✅ Don't render children until initial check is done
  if (!initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      forgotPassword,
      verifyOTP,
      resetPassword,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isRetailer: user?.role === 'retailer',
      isSupplier: user?.role === 'supplier',
      isCustomer: user?.role === 'customer',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };