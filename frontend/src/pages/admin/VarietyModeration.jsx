// frontend/src/pages/admin/VarietyModeration.jsx - NEW FILE
import { useState, useEffect } from 'react';
import { HiCheckCircle, HiXCircle, HiTag, HiUser, HiClock } from 'react-icons/hi';
import api from '../../services/api';

const VarietyModeration = () => {
  const [loading, setLoading] = useState(true);
  const [pendingVarieties, setPendingVarieties] = useState([]);
  const [selectedVariety, setSelectedVariety] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingVarieties();
  }, []);

  const fetchPendingVarieties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/varieties/admin/pending');
      setPendingVarieties(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending varieties:', error);
      alert('Failed to load pending varieties');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (varietyId) => {
    if (!confirm('Are you sure you want to approve this variety? It will be available for all suppliers.')) return;

    try {
      setProcessing(true);
      await api.put(`/varieties/${varietyId}/approve`);
      alert('Variety approved successfully!');
      fetchPendingVarieties();
      setShowModal(false);
      setSelectedVariety(null);
    } catch (error) {
      console.error('Error approving variety:', error);
      alert(error.response?.data?.message || 'Failed to approve variety');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (varietyId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason || !reason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/varieties/${varietyId}/reject`, { reason });
      alert('Variety rejected');
      fetchPendingVarieties();
      setShowModal(false);
      setSelectedVariety(null);
    } catch (error) {
      console.error('Error rejecting variety:', error);
      alert(error.response?.data?.message || 'Failed to reject variety');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (variety) => {
    setSelectedVariety(variety);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Variety Moderation
          </h1>
          <p className="text-gray-600">
            Review and approve new product variety suggestions from suppliers
          </p>
        </div>

        {/* Pending Count */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <HiTag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Varieties</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingVarieties.length}
              </p>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {showModal && selectedVariety && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Variety Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <HiXCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <HiTag className="w-5 h-5 text-purple-600" />
                      {selectedVariety.name}
                    </h3>
                    {selectedVariety.description && (
                      <p className="text-gray-600">{selectedVariety.description}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Category Information</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Main Category:</strong> {selectedVariety.categoryHierarchy?.main?.name || 'N/A'}
                      </p>
                      {selectedVariety.categoryHierarchy?.sub?.name && (
                        <p>
                          <strong>Sub Category:</strong> {selectedVariety.categoryHierarchy.sub.name}
                        </p>
                      )}
                      <p>
                        <strong>Product Type:</strong> {selectedVariety.productType?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Supplier Information</h4>
                    <div className="flex items-center gap-3">
                      <HiUser className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedVariety.suggestedBy?.businessDetails?.businessName || selectedVariety.suggestedBy?.name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedVariety.suggestedBy?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500">
                      <strong>Submitted:</strong> {new Date(selectedVariety.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(selectedVariety._id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <HiCheckCircle className="w-5 h-5" />
                    Approve Variety
                  </button>
                  <button
                    onClick={() => handleReject(selectedVariety._id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <HiXCircle className="w-5 h-5" />
                    Reject Variety
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Varieties List */}
        {pendingVarieties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Varieties Reviewed!
            </h3>
            <p className="text-gray-600">
              No pending variety suggestions to moderate
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Variety Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Suggested By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingVarieties.map((variety) => (
                    <tr key={variety._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <HiTag className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{variety.name}</p>
                            {variety.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">{variety.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {variety.productType?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {variety.categoryHierarchy?.main?.name || 'N/A'}
                          {variety.categoryHierarchy?.sub?.name && (
                            <span className="text-gray-500"> → {variety.categoryHierarchy.sub.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <HiUser className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {variety.suggestedBy?.businessDetails?.businessName || variety.suggestedBy?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">{variety.suggestedBy?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <HiClock className="w-4 h-4" />
                          {new Date(variety.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(variety)}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleApprove(variety._id)}
                            disabled={processing}
                            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <HiCheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(variety._id)}
                            disabled={processing}
                            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <HiXCircle className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default VarietyModeration;