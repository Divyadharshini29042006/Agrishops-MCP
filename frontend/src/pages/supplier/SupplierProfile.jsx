// frontend/src/pages/supplier/SupplierProfile.jsx - WITH ALL BUSINESS FIELDS
import { useState, useEffect } from 'react';
import {
  HiUser, HiMail, HiPhone, HiLocationMarker, HiOfficeBuilding,
  HiIdentification, HiPencil, HiCheckCircle, HiLockClosed,
  HiEye, HiEyeOff, HiUpload, HiTrash, HiShoppingBag
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';

const SupplierProfile = () => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [brandLogo, setBrandLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(getPublicImageUrl(user?.businessDetails?.brandLogo?.url) || '');
  const [isUploading, setIsUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessName: '',
    businessType: 'sole_proprietorship',
    gstNumber: '',
    panNumber: '',
    contactPerson: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    yearsInBusiness: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || user.location?.address || '',
        city: user.city || user.location?.city || '',
        state: user.state || user.location?.state || '',
        pincode: user.pincode || user.location?.pincode || '',
        businessName: user.businessDetails?.businessName || '',
        businessType: user.businessDetails?.businessType || 'sole_proprietorship',
        gstNumber: user.businessDetails?.gstNumber || '',
        panNumber: user.businessDetails?.panNumber || '',
        contactPerson: user.businessDetails?.contactPerson || '',
        businessAddress: user.businessDetails?.businessAddress || '',
        businessPhone: user.businessDetails?.businessPhone || '',
        businessEmail: user.businessDetails?.businessEmail || '',
        yearsInBusiness: user.businessDetails?.yearsInBusiness || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        location: {
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          pincode: profileData.pincode,
        },
        businessDetails: {
          businessName: profileData.businessName,
          businessType: profileData.businessType,
          gstNumber: profileData.gstNumber,
          panNumber: profileData.panNumber,
          contactPerson: profileData.contactPerson,
          businessAddress: profileData.businessAddress,
          businessPhone: profileData.businessPhone,
          businessEmail: profileData.businessEmail,
          yearsInBusiness: profileData.yearsInBusiness ? Number(profileData.yearsInBusiness) : undefined,
        }
      };

      await api.put('/api/users/profile', updateData);
      await updateProfile(updateData);

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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Logo must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Please upload an image file');
        return;
      }

      setBrandLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      showSuccess('Logo selected. Click "Upload Logo" to save.');
    }
  };

  const handleLogoUpload = async () => {
    if (!brandLogo) {
      showError('Please select a logo first');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', brandLogo);

      const response = await api.post('/api/brands/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update user profile with new brandLogo
      await updateProfile({
        businessDetails: {
          ...user.businessDetails,
          brandLogo: response.data.data.brandLogo,
          brandLogoStatus: 'approved',
          showOnHomepage: true
        }
      });
      showSuccess('Brand logo uploaded successfully!');
      setBrandLogo(null);

    } catch (error) {
      console.error('Logo upload error:', error);
      showError(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete your brand logo?')) return;

    try {
      setIsUploading(true);
      await api.delete('/api/brands/my-logo');

      await updateProfile({ businessDetails: { ...user.businessDetails, brandLogo: null } });
      setLogoPreview('');
      setBrandLogo(null);
      showSuccess('Brand logo deleted successfully');

    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete logo');
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Account Details', icon: HiUser },
    { id: 'business', label: 'Business Info', icon: HiOfficeBuilding },
    { id: 'security', label: 'Security', icon: HiLockClosed }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and business information</p>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.businessDetails?.brandLogo?.url ? (
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white/30 shadow-xl overflow-hidden">
                  <img
                    src={getPublicImageUrl(user.businessDetails.brandLogo.url)}
                    alt="Brand Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 border-4 border-white/30">
                  <HiUser className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{user?.name}</h2>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <HiMail className="w-4 h-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiPhone className="w-4 h-4" />
                  <span className="text-sm">{user?.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOfficeBuilding className="w-4 h-4" />
                  <span className="text-sm">{user?.businessDetails?.businessName || 'No business name'}</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-white/30">
                <p className="text-xs text-blue-100 mb-1">Account Type</p>
                <p className="text-xl font-bold capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <HiPencil className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <HiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <div className="relative">
                    <HiLocationMarker className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="pincode"
                      value={profileData.pincode}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  rows="3"
                  placeholder="Enter your full address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          address: user.address || user.location?.address || '',
                          city: user.city || user.location?.city || '',
                          state: user.state || user.location?.state || '',
                          pincode: user.pincode || user.location?.pincode || '',
                          businessName: user.businessDetails?.businessName || '',
                          businessType: user.businessDetails?.businessType || 'sole_proprietorship',
                          gstNumber: user.businessDetails?.gstNumber || '',
                          panNumber: user.businessDetails?.panNumber || '',
                          contactPerson: user.businessDetails?.contactPerson || '',
                          businessAddress: user.businessDetails?.businessAddress || '',
                          businessPhone: user.businessDetails?.businessPhone || '',
                          businessEmail: user.businessDetails?.businessEmail || '',
                          yearsInBusiness: user.businessDetails?.yearsInBusiness || ''
                        });
                      }
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <HiCheckCircle className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ✅ BUSINESS TAB WITH ALL FIELDS */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Business Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <HiPencil className="w-4 h-4" />
                  Edit Business Info
                </button>
              )}
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <HiOfficeBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="businessName"
                      value={profileData.businessName}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={profileData.businessType}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                  >
                    <option value="sole_proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="private_limited">Private Limited</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={profileData.contactPerson}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    name="yearsInBusiness"
                    value={profileData.yearsInBusiness}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone *
                  </label>
                  <div className="relative">
                    <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="businessPhone"
                      value={profileData.businessPhone}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email *
                  </label>
                  <div className="relative">
                    <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="businessEmail"
                      value={profileData.businessEmail}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number (Optional)
                  </label>
                  <div className="relative">
                    <HiIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="gstNumber"
                      value={profileData.gstNumber}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength="15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number (Optional)
                  </label>
                  <div className="relative">
                    <HiIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="panNumber"
                      value={profileData.panNumber}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all"
                      placeholder="ABCDE1234F"
                      maxLength="10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address *
                  </label>
                  <textarea
                    name="businessAddress"
                    value={profileData.businessAddress}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 outline-none transition-all resize-none"
                    required
                  />
                </div>
              </div>

              {/* Brand Logo Section */}
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <HiShoppingBag className="w-5 h-5 text-blue-600" />
                  Brand Logo
                </h4>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Logo Preview */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Current Logo</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50/50">
                      {logoPreview ? (
                        <div className="space-y-4">
                          <img
                            src={logoPreview}
                            alt="Brand Logo"
                            className="w-32 h-32 object-contain mx-auto rounded-lg border-2 border-blue-600 p-2 bg-white shadow-sm"
                          />
                          {user?.businessDetails?.brandLogo && (
                            <button
                              type="button"
                              onClick={handleDeleteLogo}
                              disabled={isUploading}
                              className="flex items-center gap-2 mx-auto text-red-600 hover:text-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                              <HiTrash className="w-4 h-4" />
                              Delete Logo
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="py-8">
                          <HiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No logo uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Upload New Logo</p>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <HiUpload className="w-10 h-10 text-blue-600 mb-2" />
                          <span className="text-sm font-semibold text-blue-600 mb-1">
                            Click to upload logo
                          </span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                        </label>
                      </div>

                      {brandLogo && (
                        <button
                          type="button"
                          onClick={handleLogoUpload}
                          disabled={isUploading}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <HiCheckCircle className="w-5 h-5" />
                              Upload Logo
                            </>
                          )}
                        </button>
                      )}

                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs text-blue-700 font-bold mb-2 uppercase tracking-wider">Tips:</p>
                        <ul className="text-xs text-blue-600 space-y-1.5 list-disc pl-4">
                          <li>Use a square image (1:1 ratio)</li>
                          <li>Recommended size: 500x500px</li>
                          <li>Transparent background works best</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Business Status</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Account Type: <strong className="capitalize">{user?.role}</strong></p>
                  <p>• Registration Date: <strong>{new Date(user?.createdAt).toLocaleDateString()}</strong></p>
                  <p>• Account Status: <strong className="text-green-700">Active</strong></p>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <HiCheckCircle className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.current ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.new ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirm ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">Security Tips</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Use a strong password with letters, numbers, and symbols</li>
                  <li>• Don't reuse passwords from other sites</li>
                  <li>• Change your password regularly</li>
                  <li>• Never share your password with anyone</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <HiCheckCircle className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierProfile;