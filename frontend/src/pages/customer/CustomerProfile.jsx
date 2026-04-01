// frontend/src/pages/customer/CustomerProfile.jsx - MODERN CLEAN DESIGN
import { useState, useEffect } from 'react';
import {
  HiUser, HiMail, HiPhone, HiLocationMarker, HiPencil,
  HiCheckCircle, HiX, HiCamera, HiLockClosed, HiEye, HiEyeOff
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const CustomerProfile = () => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.location?.address || '',
          city: user.location?.city || '',
          state: user.location?.state || '',
          pincode: user.location?.pincode || '',
          country: user.location?.country || 'India',
        }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setProfileData(prev => {
        const updated = { ...prev };
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const response = await api.put('/api/users/profile', {
        name: profileData.name,
        phone: profileData.phone,
        location: {
          address: profileData.address.street,
          city: profileData.address.city,
          state: profileData.address.state,
          pincode: profileData.address.pincode,
          country: profileData.address.country,
        }
      });

      await updateProfile(response.data.data);
      showSuccess('Profile updated successfully!');
      setIsEditing(false);

    } catch (error) {
      console.error('Profile update error:', error);
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSaving(true);

      await api.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      showSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Password update error:', error);
      showError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.location?.address || '',
          city: user.location?.city || '',
          state: user.location?.state || '',
          pincode: user.location?.pincode || '',
          country: user.location?.country || 'India',
        }
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your profile and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Profile Summary */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button className="absolute bottom-0 right-0 bg-white border-2 border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors">
                      <HiCamera className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'profile'
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <HiUser className="w-5 h-5" />
                  <span>Profile Information</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'security'
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <HiLockClosed className="w-5 h-5" />
                  <span>Password & Security</span>
                </button>
              </nav>
            </div>

            {/* Account Status */}
            <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Account Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {new Date(user?.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium text-gray-900">{user?.stats?.totalOrders || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Account Type</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    Customer
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      <HiPencil className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                      >
                        <HiX className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                      >
                        <HiCheckCircle className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* Personal Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Details</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              name="name"
                              value={profileData.name}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              required
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email Address
                          </label>
                          <div className="relative">
                            <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="email"
                              value={profileData.email}
                              disabled
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="tel"
                              name="phone"
                              value={profileData.phone}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              required
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-900">Delivery Address</h3>
                      </div>

                      {!isEditing ? (
                        // Premium Read-only View
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                          <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                              <HiLocationMarker className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-grow">
                              <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Street Address</label>
                                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                    {profileData.address.street || <span className="text-gray-400 italic">No address provided</span>}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">City</label>
                                    <p className="text-sm text-gray-700 font-medium">{profileData.address.city || '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">State</label>
                                    <p className="text-sm text-gray-700 font-medium">{profileData.address.state || '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pincode</label>
                                    <p className="text-sm text-gray-700 font-medium font-mono">{profileData.address.pincode || '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Country</label>
                                    <p className="text-sm text-gray-700 font-medium">{profileData.address.country}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Clean Edit View
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 px-1">Street Address</label>
                            <div className="relative group">
                              <HiLocationMarker className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors w-5 h-5" />
                              <textarea
                                name="address.street"
                                value={profileData.address.street}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Enter your full street address"
                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none text-sm bg-white shadow-sm"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-gray-700 px-1">City</label>
                              <input
                                type="text"
                                name="address.city"
                                value={profileData.address.city}
                                onChange={handleInputChange}
                                placeholder="City"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm bg-white shadow-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-gray-700 px-1">State</label>
                              <input
                                type="text"
                                name="address.state"
                                value={profileData.address.state}
                                onChange={handleInputChange}
                                placeholder="State"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm bg-white shadow-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-gray-700 px-1">Pincode</label>
                              <input
                                type="text"
                                name="address.pincode"
                                value={profileData.address.pincode}
                                onChange={handleInputChange}
                                maxLength="6"
                                pattern="[0-9]{6}"
                                placeholder="6 digits"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm bg-white shadow-sm font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Password & Security</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your password and account security</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="p-6">
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.current ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                          minLength="6"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.new ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.confirm ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Password Requirements</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• At least 6 characters long</li>
                        <li>• Use a strong, unique password</li>
                        <li>• Don't reuse passwords from other sites</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <HiCheckCircle className="w-4 h-4" />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;