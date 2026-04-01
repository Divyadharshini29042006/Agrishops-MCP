// frontend/src/pages/supplier/SupplierWholesaleInquiries.jsx
import { useState, useEffect } from 'react';
import {
    HiChatAlt2, HiX, HiCheckCircle, HiClock, HiXCircle,
    HiShoppingCart, HiUser, HiCurrencyRupee, HiMail, HiShieldCheck,
    HiSparkles, HiTrendingUp, HiInformationCircle, HiPlus, HiMinus
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import api from '../../services/api';

const SupplierWholesaleInquiries = () => {
    const { showSuccess, showError } = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [filteredInquiries, setFilteredInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [quoteForm, setQuoteForm] = useState({ quotedPrice: '', message: '', minimumBulkQuantity: 100 });
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const [lastQuotedInquiry, setLastQuotedInquiry] = useState(null);

    useEffect(() => {
        fetchInquiries();
    }, []);

    useEffect(() => {
        filterInquiries();
    }, [activeFilter, inquiries]);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/wholesale/supplier-inquiries');
            setInquiries(response.data.data || []);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            showError('Failed to load inquiries');
        } finally {
            setLoading(false);
        }
    };

    const filterInquiries = () => {
        if (activeFilter === 'all') {
            setFilteredInquiries(inquiries);
        } else {
            setFilteredInquiries(inquiries.filter(inq => inq.status === activeFilter));
        }
    };

    const handleRespondClick = (inquiry) => {
        setSelectedInquiry(inquiry);
        
        // Auto-calculate price based on selected variants if they exist
        let calculatedPrice = '';
        if (inquiry.selectedVariants && inquiry.selectedVariants.length > 0) {
            calculatedPrice = inquiry.selectedVariants.reduce((sum, v) => sum + (v.price * v.quantity), 0).toString();
        }

        setQuoteForm({
            quotedPrice: calculatedPrice,
            message: '',
            minimumBulkQuantity: inquiry.quantity || 1
        });
        setShowQuoteModal(true);
    };

    const handleRejectClick = (inquiry) => {
        setSelectedInquiry(inquiry);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleSubmitQuote = async () => {
        if (!quoteForm.quotedPrice || !quoteForm.message.trim()) {
            showError('Please fill in all fields');
            return;
        }

        try {
            setSubmitting(true);
            await api.patch(`/api/wholesale/${selectedInquiry._id}/quote`, {
                quotedPrice: parseFloat(quoteForm.quotedPrice),
                message: quoteForm.message,
                minimumBulkQuantity: parseInt(quoteForm.minimumBulkQuantity),
            });

            showSuccess('Quote sent successfully!');
            setLastQuotedInquiry({
                inquiryNumber: selectedInquiry.inquiryNumber,
                customerName: selectedInquiry.customer?.name,
                productName: selectedInquiry.product?.name,
                quotedPrice: parseFloat(quoteForm.quotedPrice)
            });
            setShowSuccessBanner(true);
            setShowQuoteModal(false);
            fetchInquiries(); // Refresh list

            // Auto-hide banner after 10 seconds
            setTimeout(() => {
                setShowSuccessBanner(false);
            }, 10000);
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to send quote');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitRejection = async () => {
        if (!rejectionReason.trim()) {
            showError('Please provide a reason for rejection');
            return;
        }

        try {
            setSubmitting(true);
            await api.patch(`/api/wholesale/${selectedInquiry._id}/reject`, {
                rejectionReason,
            });

            showSuccess('Inquiry rejected');
            setShowRejectModal(false);
            fetchInquiries();
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to reject inquiry');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: HiClock, label: 'Pending' },
            quoted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: HiCurrencyRupee, label: 'Quoted' },
            accepted: { bg: 'bg-green-100', text: 'text-green-700', icon: HiCheckCircle, label: 'Accepted' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: HiXCircle, label: 'Rejected' },
            completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: HiCheckCircle, label: 'Completed' },
        };

        const badge = badges[status] || badges.pending;
        const IconComponent = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <IconComponent className="w-4 h-4" />
                {badge.label}
            </span>
        );
    };

    const filters = [
        { key: 'all', label: 'All', count: inquiries.length },
        { key: 'pending', label: 'Pending', count: inquiries.filter(i => i.status === 'pending').length },
        { key: 'quoted', label: 'Quoted', count: inquiries.filter(i => i.status === 'quoted').length },
        { key: 'accepted', label: 'Accepted', count: inquiries.filter(i => i.status === 'accepted').length },
        { key: 'rejected', label: 'Rejected', count: inquiries.filter(i => i.status === 'rejected').length },
        { key: 'expired', label: 'Expired', count: inquiries.filter(i => i.status === 'expired').length },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading inquiries...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <HiShoppingCart className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Wholesale Inquiries</h1>
                            <p className="text-gray-600 mt-1">Manage bulk order requests from customers</p>
                        </div>
                    </div>
                </div>

                {/* Success Banner */}
                {showSuccessBanner && lastQuotedInquiry && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6 shadow-lg animate-fade-in">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="bg-green-500 p-3 rounded-full">
                                    <HiCheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-900 mb-2">
                                        ✅ Quote Sent Successfully!
                                    </h3>
                                    <div className="space-y-1 text-sm text-green-800">
                                        <p><strong>Inquiry:</strong> #{lastQuotedInquiry.inquiryNumber}</p>
                                        <p><strong>Customer:</strong> {lastQuotedInquiry.customerName}</p>
                                        <p><strong>Product:</strong> {lastQuotedInquiry.productName}</p>
                                        <p><strong>Your Quote:</strong> ₹{lastQuotedInquiry.quotedPrice?.toLocaleString()}</p>
                                    </div>
                                    <p className="mt-3 text-green-700">
                                        The customer has been notified via email and can now accept or negotiate your quote.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSuccessBanner(false)}
                                className="text-green-600 hover:text-green-800 transition-colors"
                            >
                                <HiX className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeFilter === filter.key
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {filter.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeFilter === filter.key ? 'bg-white/20' : 'bg-gray-200'
                                    }`}>
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inquiries List */}
                {filteredInquiries.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <HiChatAlt2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inquiries Found</h3>
                        <p className="text-gray-600">
                            {activeFilter === 'all'
                                ? "You haven't received any wholesale inquiries yet."
                                : `No ${activeFilter} inquiries at the moment.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredInquiries.map((inquiry) => (
                            <div
                                key={inquiry._id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={inquiry.product?.images?.[0]?.url || '/placeholder.png'}
                                            alt={inquiry.product?.name}
                                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 space-y-4">
                                        {/* Header Row */}
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {inquiry.product?.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Inquiry #{inquiry.inquiryNumber}
                                                </p>
                                            </div>
                                            {getStatusBadge(inquiry.status)}
                                        </div>

                                        {/* Customer Info */}
                                        <div className="flex flex-wrap gap-6">
                                            <div className="flex items-center gap-2">
                                                <HiUser className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Customer</p>
                                                    <p className="font-semibold text-gray-900">{inquiry.customer?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HiTrendingUp className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Total Weight</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {inquiry.totalWeightKg ? `${inquiry.totalWeightKg} kg` : `${inquiry.quantity} ${inquiry.product?.unit}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <HiClock className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Requested</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {new Date(inquiry.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Requested Breakdown */}
                                        {inquiry.selectedVariants && inquiry.selectedVariants.length > 0 && (
                                            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <HiSparkles className="w-3 h-3" /> Requested Breakdown
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {inquiry.selectedVariants.map((v, idx) => (
                                                        <span key={idx} className="bg-white px-2 py-1 rounded border border-blue-200 text-xs font-medium text-blue-800">
                                                            {v.size} x {v.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Customer Message */}
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1 font-medium">Customer Message:</p>
                                            <p className="text-gray-700">{inquiry.message}</p>
                                        </div>

                                        {/* Quote Response (if exists) */}
                                        {inquiry.supplierResponse && (
                                            <div className={`rounded-lg p-4 border ${inquiry.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
                                                    <div>
                                                        <p className={`text-xs font-semibold mb-1 uppercase tracking-wider ${inquiry.status === 'completed' ? 'text-green-700' : 'text-blue-700'}`}>
                                                            {inquiry.status === 'completed' ? 'Finalized Payment:' : 'Your Quote:'}
                                                        </p>
                                                        <p className={`text-2xl font-black ${inquiry.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                                                            ₹{inquiry.supplierResponse.quotedPrice?.toLocaleString()}
                                                        </p>
                                                        <p className={`text-[10px] font-bold uppercase ${inquiry.status === 'completed' ? 'text-green-500' : 'text-blue-500'}`}>
                                                            Min Qty: {inquiry.supplierResponse.minimumBulkQuantity || 100} units
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {inquiry.status === 'quoted' && inquiry.acceptanceExpiresAt && (
                                                            <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm text-right">
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-1">Acceptance Expiring In:</p>
                                                                <p className="text-sm font-black text-red-600">
                                                                    {Math.max(0, Math.floor((new Date(inquiry.acceptanceExpiresAt) - new Date()) / (1000 * 60 * 60)))}h{' '}
                                                                    {Math.max(0, Math.floor(((new Date(inquiry.acceptanceExpiresAt) - new Date()) / (1000 * 60)) % 60))}m
                                                                </p>
                                                            </div>
                                                        )}
                                                        {inquiry.stockReserved && (
                                                            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 shadow-sm text-[10px] font-black uppercase">
                                                                <HiShieldCheck className="w-4 h-4" />
                                                                Stock Reserved
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`mt-3 pt-3 border-t ${inquiry.status === 'completed' ? 'border-green-100' : 'border-blue-100'}`}>
                                                    <p className={`text-xs font-bold uppercase mb-1 ${inquiry.status === 'completed' ? 'text-green-400' : 'text-blue-400'}`}>Your Message:</p>
                                                    <p className={`text-sm italic font-medium ${inquiry.status === 'completed' ? 'text-green-900' : 'text-blue-900'}`}>"{inquiry.supplierResponse.message}"</p>
                                                </div>

                                                {/* ✅ NEW: Delivery Address for Completed Orders */}
                                                {inquiry.status === 'completed' && inquiry.deliveryAddress && (
                                                    <div className="mt-4 pt-4 border-t border-green-100 bg-white/50 -mx-4 px-4 py-3">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="bg-green-600 p-1.5 rounded-lg">
                                                                <HiLocationMarker className="w-4 h-4 text-white" />
                                                            </div>
                                                            <h5 className="text-xs font-black text-green-900 uppercase tracking-widest">Ship to Address</h5>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <p className="text-green-600 font-bold uppercase text-[9px] mb-0.5">Receiver</p>
                                                                <p className="font-black text-gray-900 text-sm">{inquiry.deliveryAddress.fullName}</p>
                                                                <p className="font-bold text-gray-600">{inquiry.deliveryAddress.phone}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-green-600 font-bold uppercase text-[9px] mb-0.5">Destination</p>
                                                                <p className="font-bold text-gray-800 leading-relaxed">
                                                                    {inquiry.deliveryAddress.addressLine1},<br />
                                                                    {inquiry.deliveryAddress.landmark && `${inquiry.deliveryAddress.landmark}, `}
                                                                    {inquiry.deliveryAddress.city}, {inquiry.deliveryAddress.state} - {inquiry.deliveryAddress.pincode}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            {inquiry.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleRespondClick(inquiry)}
                                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all"
                                                    >
                                                        <HiCurrencyRupee className="w-5 h-5" />
                                                        Respond with Quote
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectClick(inquiry)}
                                                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-6 py-2.5 rounded-lg transition-all border border-red-200"
                                                    >
                                                        <HiXCircle className="w-5 h-5" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {inquiry.customer?.email && (
                                                <a
                                                    href={`mailto:${inquiry.customer.email}`}
                                                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition-all"
                                                >
                                                    <HiMail className="w-5 h-5" />
                                                    Contact Customer
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quote Modal */}
            {showQuoteModal && selectedInquiry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">Send Quote</h3>
                            <button
                                onClick={() => setShowQuoteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <HiX className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Inquiry Summary */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <HiInformationCircle className="w-5 h-5 text-blue-500" />
                                    <h4 className="font-bold text-gray-900">Inquiry Details</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Product</p>
                                        <p className="font-bold text-gray-900">{selectedInquiry.product?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Customer</p>
                                        <p className="font-bold text-gray-900">{selectedInquiry.customer?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Requested Qty</p>
                                        <p className="font-bold text-gray-900">{selectedInquiry.quantity} {selectedInquiry.product?.unit}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-0.5">Total Weight</p>
                                        <p className="font-bold text-blue-600">{selectedInquiry.totalWeightKg || 0} kg</p>
                                    </div>
                                </div>

                                {/* Calculation Breakdown */}
                                {selectedInquiry.selectedVariants && selectedInquiry.selectedVariants.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Price Calculation Breakdown</p>
                                        <div className="space-y-2">
                                            {selectedInquiry.selectedVariants.map((v, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">{v.size} Bag ({v.quantity} units x ₹{v.price.toLocaleString()})</span>
                                                    <span className="font-mono font-bold text-gray-900">₹{(v.price * v.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="pt-2 border-t border-dashed flex justify-between items-center bg-blue-50/50 -mx-2 px-2 py-1 rounded">
                                                <span className="text-blue-700 font-bold text-xs uppercase">Total Calculated Quote</span>
                                                <span className="text-lg font-black text-blue-700">
                                                    ₹{selectedInquiry.selectedVariants.reduce((sum, v) => sum + (v.price * v.quantity), 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quote Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quoted Price (Total Amount) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                        <input
                                            type="number"
                                            value={quoteForm.quotedPrice}
                                            onChange={(e) => setQuoteForm({ ...quoteForm, quotedPrice: e.target.value })}
                                            placeholder="Enter total price"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        Minimum Active Quantity <HiInformationCircle className="w-4 h-4 text-gray-400 pointer-events-none" title="Minimum items customer must order for this quote to remain valid" />
                                    </label>
                                    <input
                                        type="number"
                                        value={quoteForm.minimumBulkQuantity}
                                        onChange={(e) => setQuoteForm({ ...quoteForm, minimumBulkQuantity: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Message to Customer *
                                </label>
                                <textarea
                                    value={quoteForm.message}
                                    onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                                    placeholder="Include details like delivery timeline, payment terms, etc."
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    ⏱️ <strong>Acceptance Period:</strong> The customer will have 48 hours to accept this quote once sent.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t p-6 flex gap-3">
                            <button
                                onClick={() => setShowQuoteModal(false)}
                                disabled={submitting}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitQuote}
                                disabled={submitting || !quoteForm.quotedPrice || !quoteForm.message.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <HiCheckCircle className="w-5 h-5" />
                                        Send Quote
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Reject Modal */}
            {showRejectModal && selectedInquiry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Reject Inquiry</h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                                <HiX className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">Please provide a reason for rejecting this bulk inquiry from {selectedInquiry.customer?.name}.</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Example: Out of stock, cannot fulfill request, price mismatch, etc."
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                            />
                        </div>
                        <div className="p-6 border-t flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 bg-gray-100 font-bold py-2.5 rounded-lg">Cancel</button>
                            <button
                                onClick={handleSubmitRejection}
                                disabled={submitting || !rejectionReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : 'Reject Inquiry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierWholesaleInquiries;
