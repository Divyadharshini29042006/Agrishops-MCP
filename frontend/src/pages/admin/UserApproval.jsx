// frontend/src/pages/admin/UserApproval.jsx
import { useState, useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiUser, HiMail, HiPhone, HiOfficeBuilding, HiEye, HiLocationMarker, HiIdentification } from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import { getPublicImageUrl } from '../../utils/imageUtils';

const UserApproval = () => {
  const { showSuccess, showError } = useToast();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users/pending');
      setPendingUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      showError('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/approve`);
      showSuccess('User approved successfully');
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error('Error approving user:', error);
      showError(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/reject`, { reason: rejectReason });
      showSuccess('User rejected successfully');
      setShowModal(false);
      setRejectReason('');
      setSelectedUser(null);
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error('Error rejecting user:', error);
      showError(error.response?.data?.message || 'Failed to reject user');
    }
  };

  const openRejectModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeRejectModal = () => {
    setShowModal(false);
    setRejectReason('');
    setSelectedUser(null);
  };

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">User Approval</h1>
        <p className="text-gray-600">Review and approve pending retailer/manufacturer registrations</p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">All Caught Up!</h2>
          <p className="text-gray-600">No pending user approvals at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <HiUser className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <HiMail className="h-4 w-4" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <HiPhone className="h-4 w-4" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'retailer'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.businessDetails ? (
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-900 font-medium">
                            <HiOfficeBuilding className="h-4 w-4" />
                            {user.businessDetails.businessName || 'N/A'}
                          </div>
                          {user.businessDetails.gstNumber && (
                            <div className="text-gray-500">GST: {user.businessDetails.gstNumber}</div>
                          )}
                          {user.businessDetails.contactPerson && (
                            <div className="text-gray-500">Contact: {user.businessDetails.contactPerson}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No business details</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailsModal(user)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="View Details"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(user._id)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <HiCheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(user)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <HiXCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">User Details</h3>
                <button
                  onClick={closeDetailsModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <HiXCircle className="h-8 w-8" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiUser className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Profile Image */}
                  {selectedUser.profileImage?.url && (
                    <div className="md:col-span-2 flex justify-center">
                      <img
                        src={getPublicImageUrl(selectedUser.profileImage.url)}
                        alt={selectedUser.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <HiMail className="h-4 w-4 text-gray-500" />
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <HiPhone className="h-4 w-4 text-gray-500" />
                      {selectedUser.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${selectedUser.role === 'retailer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                      }`}>
                      {selectedUser.role.toUpperCase()}
                    </span>
                  </div>

                  {/* Usage Type (for customers) */}
                  {selectedUser.usageType && (
                    <div>
                      <p className="text-sm text-gray-600">Usage Type</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {selectedUser.usageType}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Registration Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Account Status */}
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.isApproved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {selectedUser.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Last Login */}
                  {selectedUser.lastLogin && (
                    <div>
                      <p className="text-sm text-gray-600">Last Login</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedUser.lastLogin).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Last Active */}
                  {selectedUser.lastActive && (
                    <div>
                      <p className="text-sm text-gray-600">Last Active</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedUser.lastActive).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Preferences */}
                  {selectedUser.preferences && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Language Preference</p>
                        <p className="font-semibold text-gray-900 uppercase">
                          {selectedUser.preferences.language || 'en'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Theme Preference</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {selectedUser.preferences.theme || 'light'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Business Details */}
              {selectedUser.businessDetails && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiOfficeBuilding className="h-5 w-5 text-blue-600" />
                    Business Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Brand Logo */}
                    {selectedUser.businessDetails.brandLogo?.url && (
                      <div className="md:col-span-2 flex flex-col items-center gap-2">
                        <img
                          src={getPublicImageUrl(selectedUser.businessDetails.brandLogo.url)}
                          alt="Brand Logo"
                          className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg p-2 bg-white"
                        />
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${selectedUser.businessDetails.brandLogoStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedUser.businessDetails.brandLogoStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              selectedUser.businessDetails.brandLogoStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          Logo: {selectedUser.businessDetails.brandLogoStatus || 'none'}
                        </span>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.businessDetails.businessName || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Type</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {selectedUser.businessDetails.businessType?.replace('_', ' ') || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact Person</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.businessDetails.contactPerson || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Phone</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.businessDetails.businessPhone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Email</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.businessDetails.businessEmail || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Years in Business</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.businessDetails.yearsInBusiness || 'Not provided'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">GST Number</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <HiIdentification className="h-4 w-4 text-gray-500" />
                        {selectedUser.businessDetails.gstNumber || 'Not provided'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">PAN Number</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <HiIdentification className="h-4 w-4 text-gray-500" />
                        {selectedUser.businessDetails.panNumber || 'Not provided'}
                      </p>
                    </div>

                    {/* License Information */}
                    {selectedUser.businessDetails.licenseNumber && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">License Number</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          <HiIdentification className="h-4 w-4 text-gray-500" />
                          {selectedUser.businessDetails.licenseNumber}
                        </p>
                      </div>
                    )}

                    {selectedUser.businessDetails.licenseDocument && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">License Document</p>
                        <a
                          href={selectedUser.businessDetails.licenseDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold underline"
                        >
                          View License Document
                        </a>
                      </div>
                    )}

                    {selectedUser.businessDetails.businessAddress && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Business Address</p>
                        <p className="font-semibold text-gray-900">
                          {selectedUser.businessDetails.businessAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location Details */}
              {selectedUser.location && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiLocationMarker className="h-5 w-5 text-blue-600" />
                    Location Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedUser.location.address && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-900">{selectedUser.location.address}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">City</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.location.city || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.location.state || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pincode</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.location.pincode || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Country</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.location.country || 'India'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeDetailsModal();
                    handleApprove(selectedUser._id);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  <HiCheckCircle className="h-5 w-5" />
                  Approve User
                </button>
                <button
                  onClick={() => {
                    closeDetailsModal();
                    openRejectModal(selectedUser);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  <HiXCircle className="h-5 w-5" />
                  Reject User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Reject User: {selectedUser.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this user registration.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="4"
              />
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => handleReject(selectedUser._id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={closeRejectModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApproval;