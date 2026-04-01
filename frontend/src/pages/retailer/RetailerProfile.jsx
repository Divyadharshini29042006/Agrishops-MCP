// frontend/src/pages/retailer/RetailerProfile.jsx - WITH ALL BUSINESS FIELDS
import { useState, useEffect } from 'react';
import {
  HiUser, HiMail, HiPhone, HiLocationMarker, HiOfficeBuilding,
  HiIdentification, HiPencil, HiCheckCircle, HiUpload, HiTrash, HiX, HiBriefcase
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const RetailerProfile = () => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    businessDetails: {
      businessName: '',
      businessType: 'sole_proprietorship',
      gstNumber: '',
      panNumber: '',
      contactPerson: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      yearsInBusiness: '',
      brandLogo: null,
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    usageType: 'both',
  });

  const [brandLogo, setBrandLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        businessDetails: {
          businessName: user.businessDetails?.businessName || '',
          businessType: user.businessDetails?.businessType || 'sole_proprietorship',
          gstNumber: user.businessDetails?.gstNumber || '',
          panNumber: user.businessDetails?.panNumber || '',
          contactPerson: user.businessDetails?.contactPerson || user.name || '',
          businessAddress: user.businessDetails?.businessAddress || '',
          businessPhone: user.businessDetails?.businessPhone || '',
          businessEmail: user.businessDetails?.businessEmail || '',
          yearsInBusiness: user.businessDetails?.yearsInBusiness || '',
          brandLogo: user.businessDetails?.brandLogo || null,
        },
        address: {
          street: user.address || user.location?.address || '',
          city: user.city || user.location?.city || '',
          state: user.state || user.location?.state || '',
          pincode: user.pincode || user.location?.pincode || '',
          country: user.country || user.location?.country || 'India',
        },
        usageType: user.usageType || 'both',
      });
      setLogoPreview(user.businessDetails?.brandLogo?.url || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setProfileData(prev => {
        const newState = { ...prev };
        let current = newState;

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          // Create a new object for this level to maintain immutability
          current[key] = { ...current[key] };
          current = current[key];
        }

        current[keys[keys.length - 1]] = value;
        return newState;
      });
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value,
      }));
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
      showInfo('Logo ready to upload. Click "Upload Logo" to save.');
    }
  };

  const handleLogoUpload = async () => {
    if (!brandLogo) {
      showError('Please select a logo first');
      return;
    }

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', brandLogo);

      const response = await api.post('/api/brands/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await updateProfile({ businessDetails: response.data.businessDetails });
      showSuccess('Brand logo uploaded successfully!');
      setBrandLogo(null);

    } catch (error) {
      console.error('Logo upload error:', error);
      showError(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete your brand logo?')) return;

    try {
      setIsUploadingLogo(true);
      await api.delete('/api/brands/my-logo');

      await updateProfile({
        businessDetails: {
          ...user.businessDetails,
          brandLogo: null
        }
      });
      setLogoPreview('');
      setBrandLogo(null);
      showSuccess('Brand logo deleted successfully');

    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const submitData = {
        ...profileData,
        location: {
          address: profileData.address.street,
          city: profileData.address.city,
          state: profileData.address.state,
          pincode: profileData.address.pincode,
          country: profileData.address.country,
        }
      };

      // Remove the local address object before sending
      delete submitData.address;

      const response = await api.put('/api/users/profile', submitData);

      await updateProfile(response.data.data);
      showSuccess('Profile updated successfully!');
      setEditing(false);

    } catch (error) {
      console.error('Profile update error:', error);
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      businessDetails: {
        businessName: user.businessDetails?.businessName || '',
        businessType: user.businessDetails?.businessType || 'sole_proprietorship',
        gstNumber: user.businessDetails?.gstNumber || '',
        panNumber: user.businessDetails?.panNumber || '',
        contactPerson: user.businessDetails?.contactPerson || user.name || '',
        businessAddress: user.businessDetails?.businessAddress || '',
        businessPhone: user.businessDetails?.businessPhone || '',
        businessEmail: user.businessDetails?.businessEmail || '',
        yearsInBusiness: user.businessDetails?.yearsInBusiness || '',
        brandLogo: user.businessDetails?.brandLogo || null,
      },
      address: {
        street: user.address || user.location?.address || '',
        city: user.city || user.location?.city || '',
        state: user.state || user.location?.state || '',
        pincode: user.pincode || user.location?.pincode || '',
        country: user.country || user.location?.country || 'India',
      },
      usageType: user.usageType || 'both',
    });
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your business information</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              <HiPencil className="w-5 h-5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <HiX className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <HiCheckCircle className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Brand Logo Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <HiOfficeBuilding className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Brand Logo</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Current Logo</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="Brand Logo"
                      className="w-32 h-32 object-contain mx-auto rounded-lg border-2 border-blue-600 p-2"
                    />
                    {user?.businessDetails?.brandLogo && !brandLogo && (
                      <button
                        onClick={handleDeleteLogo}
                        disabled={isUploadingLogo}
                        className="flex items-center gap-2 mx-auto text-red-600 hover:text-red-700 disabled:opacity-50 text-sm font-medium"
                      >
                        <HiTrash className="w-4 h-4" />
                        Delete Logo
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <HiOfficeBuilding className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No logo uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Upload New Logo</p>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <HiUpload className="w-12 h-12 text-blue-600 mb-3" />
                    <span className="text-sm font-medium text-blue-600 mb-1">
                      Click to upload logo
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                  </label>
                </div>

                {brandLogo && (
                  <button
                    onClick={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isUploadingLogo ? (
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
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <HiUser className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Type *
                </label>
                <select
                  name="usageType"
                  value={profileData.usageType}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 appearance-none"
                >
                  <option value="farming">Farming</option>
                  <option value="gardening">Gardening</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>

          {/* ✅ COMPLETE BUSINESS INFORMATION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <HiOfficeBuilding className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessDetails.businessName"
                  value={profileData.businessDetails.businessName}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  name="businessDetails.businessType"
                  value={profileData.businessDetails.businessType}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
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
                  name="businessDetails.contactPerson"
                  value={profileData.businessDetails.contactPerson}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years in Business
                </label>
                <input
                  type="number"
                  name="businessDetails.yearsInBusiness"
                  value={profileData.businessDetails.yearsInBusiness}
                  onChange={handleInputChange}
                  disabled={!editing}
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone *
                </label>
                <div className="relative">
                  <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="businessDetails.businessPhone"
                    value={profileData.businessDetails.businessPhone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email *
                </label>
                <div className="relative">
                  <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="businessDetails.businessEmail"
                    value={profileData.businessDetails.businessEmail}
                    onChange={handleInputChange}
                    disabled={!editing}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <div className="relative">
                  <HiIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="businessDetails.gstNumber"
                    value={profileData.businessDetails.gstNumber}
                    onChange={handleInputChange}
                    disabled={!editing}
                    maxLength="15"
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number
                </label>
                <div className="relative">
                  <HiIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="businessDetails.panNumber"
                    value={profileData.businessDetails.panNumber}
                    onChange={handleInputChange}
                    disabled={!editing}
                    maxLength="10"
                    placeholder="ABCDE1234F"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address *
                </label>
                <textarea
                  name="businessDetails.businessAddress"
                  value={profileData.businessDetails.businessAddress}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <HiLocationMarker className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Store Address</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={profileData.address.street}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={profileData.address.city}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={profileData.address.state}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="address.pincode"
                  value={profileData.address.pincode}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  pattern="[0-9]{6}"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={profileData.address.country}
                  onChange={handleInputChange}
                  disabled={!editing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Account Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Account Type:</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                Retailer
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Approval Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user?.isApproved
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
                }`}>
                {user?.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailerProfile;