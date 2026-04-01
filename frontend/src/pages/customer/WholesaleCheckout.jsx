// frontend/src/pages/customer/WholesaleCheckout.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiCheckCircle, HiExclamationCircle, HiShieldCheck, HiTruck, HiClock, HiCurrencyRupee, HiLocationMarker } from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const WholesaleCheckout = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [quantity, setQuantity] = useState(0);
    const [validationErrors, setValidationErrors] = useState([]);
    const [validationWarnings, setValidationWarnings] = useState([]);
    
    // ✅ NEW: Address State
    const [address, setAddress] = useState({
        fullName: user?.name || '',
        phone: user?.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchAndValidateInquiry();
    }, [id]);

    const fetchAndValidateInquiry = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);
            setValidationWarnings([]);
            
            // First get the inquiry details
            const response = await api.get(`/wholesale/my-inquiries`);
            const foundInquiry = response.data.data.find(q => q._id === id);

            if (!foundInquiry) {
                showError('Inquiry not found');
                navigate('/wholesale-inquiries');
                return;
            }

            if (foundInquiry.status !== 'accepted' && foundInquiry.status !== 'completed') {
                showError('This inquiry is not in accepted status');
                navigate('/wholesale-inquiries');
                return;
            }

            setInquiry(foundInquiry);
            setQuantity(foundInquiry.quantity);

            // Now call the dedicated validation endpoint
            setValidating(true);
            const valResponse = await api.get(`/wholesale/${id}/validate`);
            if (!valResponse.data.valid) {
                setValidationErrors(valResponse.data.errors || ['Validation failed']);
            }
            if (valResponse.data.warnings?.length > 0) {
                setValidationWarnings(valResponse.data.warnings);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            if (error.response?.data?.errors) {
                setValidationErrors(error.response.data.errors);
            } else {
                showError('Failed to load checkout details');
            }
        } finally {
            setLoading(false);
            setValidating(false);
        }
    };

    const handleQuantityChange = (newQty) => {
        const min = inquiry?.minimumBulkQuantity || 100;
        if (newQty < min) {
            showError(`Minimum order quantity is ${min}`);
            return;
        }
        setQuantity(parseInt(newQty));
    };

    const validateForm = () => {
        const errors = {};
        if (!address.fullName.trim()) errors.fullName = 'Full name is required';
        if (!address.phone.trim() || !/^\d{10}$/.test(address.phone)) errors.phone = 'Valid 10-digit phone is required';
        if (!address.addressLine1.trim()) errors.addressLine1 = 'Street address is required';
        if (!address.city.trim()) errors.city = 'City is required';
        if (!address.state.trim()) errors.state = 'State is required';
        if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode)) errors.pincode = 'Valid 6-digit pincode is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleRazorpayPayment = async () => {
        if (!validateForm()) {
            showError('Please complete the delivery address');
            return;
        }

        try {
            setCompleting(true);

            // 1. Load Razorpay SDK
            const res = await loadRazorpayScript();
            if (!res) {
                showError('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // 2. Get Razorpay Key and create Order
            const keyRes = await api.get('/payment/key');
            const razorpayKey = keyRes.data.key;

            // Use the calculated total (quantity * pricePerUnit)
            const orderRes = await api.post('/payment/create-order', { amount: totalAmount });
            const razorpayOrder = orderRes.data.order;

            // 3. Configure Razorpay options
            const options = {
                key: razorpayKey,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'AgriShop Bulk',
                description: `Bulk Order for ${inquiry.product?.name}`,
                order_id: razorpayOrder.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post(`/wholesale/${id}/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            deliveryAddress: address
                        });

                        if (verifyRes.data.success) {
                            showSuccess('🎉 Payment successful! Bulk order placed.');
                            navigate('/orders');
                        }
                    } catch (err) {
                        showError(err.response?.data?.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: address.fullName,
                    contact: address.phone,
                    email: user?.email || '',
                },
                theme: {
                    color: '#2563eb', // Matching the wholesale blue theme
                },
                modal: {
                    ondismiss: () => {
                        setCompleting(false);
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error('Payment initialization error:', error);
            showError('Failed to initialize payment');
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Preparing your checkout...</p>
                </div>
            </div>
        );
    }

    const pricePerUnit = inquiry.supplierResponse.quotedPrice / inquiry.quantity;
    const totalAmount = pricePerUnit * quantity;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link to="/wholesale-inquiries" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-8 group transition-all">
                    <HiArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Inquiries
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Validation Error Alert */}
                        {validationErrors.length > 0 && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-4">
                                <HiExclamationCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-red-900 text-lg">Checkout Blocked</h4>
                                    <ul className="mt-2 space-y-1 text-red-800 list-disc list-inside">
                                        {validationErrors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                    <p className="mt-4 text-sm font-medium">Please contact the supplier or submit a new inquiry.</p>
                                </div>
                            </div>
                        )}

                        {/* Validation Warning Alert */}
                        {validationWarnings.length > 0 && validationErrors.length === 0 && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 flex items-start gap-4 shadow-sm border-dashed">
                                <HiExclamationCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-orange-900 text-lg uppercase tracking-tight">Requirement Notice</h4>
                                    <ul className="mt-2 space-y-1 text-orange-800 font-medium">
                                        {validationWarnings.map((err, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                                                {err}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-3 text-[10px] text-orange-700 italic font-bold">This inquiry was manually accepted by the supplier and remains valid for checkout.</p>
                                </div>
                            </div>
                        )}

                        {/* Product Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-800 px-6 py-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <HiShieldCheck className="w-5 h-5 text-green-400" />
                                    Wholesale Purchase Agreement
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-6 items-start">
                                    <img
                                        src={inquiry.product?.images?.[0]?.url || '/placeholder.png'}
                                        alt={inquiry.product?.name}
                                        className="w-32 h-32 object-cover rounded-xl border-4 border-gray-50 shadow-inner"
                                    />
                                    <div className="flex-1">
                                        <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase mb-2">
                                            Bulk Order Item
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                            {inquiry.product?.name}
                                        </h2>
                                        <div className="mt-3 space-y-1">
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <span className="font-bold">Supplier:</span>
                                                {inquiry.supplier?.businessDetails?.businessName || inquiry.supplier?.name}
                                            </p>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <span className="font-bold">Quoted Unit Price:</span>
                                                ₹{pricePerUnit.toFixed(2)} / {inquiry.product?.unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <label className="block text-sm font-black text-gray-900 mb-2 uppercase tracking-wide">
                                            Final Order Quantity
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => handleQuantityChange(quantity - 50)}
                                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 font-black text-xl border-r"
                                                >-</button>
                                                <input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                                    className="w-24 text-center font-bold outline-none no-spinner"
                                                />
                                                <button
                                                    onClick={() => handleQuantityChange(quantity + 50)}
                                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 font-black text-xl border-l"
                                                >+</button>
                                            </div>
                                            <span className="text-sm font-bold text-gray-500 uppercase">{inquiry.product?.unit}</span>
                                        </div>
                                        <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase">
                                            Note: Cannot go below {inquiry.minimumBulkQuantity || 100} units per agreement.
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">Subtotal</p>
                                        <p className="text-4xl font-black text-blue-600 leading-tight">
                                            ₹{Math.round(totalAmount).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-green-600 font-bold uppercase">
                                            GST & Delivery Included
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-blue-600 px-6 py-4">
                                <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
                                    <HiLocationMarker className="w-5 h-5" />
                                    Shipping Information
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">Receiver Full Name *</label>
                                        <input
                                            type="text"
                                            value={address.fullName}
                                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                                            className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-bold ${formErrors.fullName ? 'border-red-300' : 'border-gray-100'}`}
                                            placeholder="John Doe"
                                        />
                                        {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{formErrors.fullName}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">Contact Phone *</label>
                                        <input
                                            type="text"
                                            value={address.phone}
                                            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                            className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-bold ${formErrors.phone ? 'border-red-300' : 'border-gray-100'}`}
                                            placeholder="10-digit number"
                                            maxLength={10}
                                        />
                                        {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{formErrors.phone}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">Street Address / Village / Area *</label>
                                        <input
                                            type="text"
                                            value={address.addressLine1}
                                            onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                                            className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-bold ${formErrors.addressLine1 ? 'border-red-300' : 'border-gray-100'}`}
                                            placeholder="House No., Street Name, Area"
                                        />
                                        {formErrors.addressLine1 && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{formErrors.addressLine1}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">City / Town *</label>
                                        <input
                                            type="text"
                                            value={address.city}
                                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-bold ${formErrors.city ? 'border-red-300' : 'border-gray-100'}`}
                                            placeholder="City"
                                        />
                                        {formErrors.city && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{formErrors.city}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">State *</label>
                                        <input
                                            type="text"
                                            value={address.state}
                                            onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                            className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-bold ${formErrors.state ? 'border-red-300' : 'border-gray-100'}`}
                                            placeholder="State"
                                        />
                                        {formErrors.state && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{formErrors.state}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">Pincode *</label>
                                        <input
                                            type="text"
                                            value={address.pincode}
                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                            className={`w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-blue-500 outline-none transition-all font-bold ${formErrors.pincode ? 'border-red-300' : 'border-gray-100'}`}
                                            placeholder="6-digit Pincode"
                                            maxLength={6}
                                        />
                                        {formErrors.pincode && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{formErrors.pincode}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-black text-gray-500 uppercase mb-1">Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            value={address.landmark}
                                            onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                                            placeholder="Near Temple, School etc."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipment Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex gap-4">
                            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                                <HiTruck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-sm tracking-wide">Standard Bulk Delivery</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Your order will be handled with special logistics for agricultural products.
                                    The supplier has specified delivery within their usual business timeframe.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-900 p-6">
                            <h3 className="text-lg font-black text-gray-900 uppercase mb-4 tracking-tighter border-b pb-2">Order Summary</h3>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold uppercase text-[10px]">Product</span>
                                    <span className="font-bold text-gray-900">{inquiry.product?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold uppercase text-[10px]">Quote Volume</span>
                                    <span className="font-bold text-gray-900">{quantity} units</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold uppercase text-[10px]">Supplier Status</span>
                                    <span className="flex items-center gap-1 font-bold text-green-600">
                                        <HiCheckCircle className="w-4 h-4" />
                                        Verified
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <HiClock className="w-4 h-4 text-orange-500" />
                                    <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Acceptance Time</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Your agreed pricing and stock reservation are valid until your quote expires.
                                </p>
                            </div>

                            <button
                                onClick={handleRazorpayPayment}
                                disabled={validationErrors.length > 0 || completing}
                                className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${validationErrors.length > 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                                        : 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-500 hover:border-green-400 hover:-translate-y-1'
                                    }`}
                            >
                                {completing ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <HiCurrencyRupee className="w-6 h-6" />
                                        PAY & FINISH
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Security Badge */}
                        <div className="text-center p-4 border border-dashed border-gray-300 rounded-2xl">
                            <HiShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Secure Transaction</p>
                            <p className="text-[8px] text-gray-400 mt-1 uppercase">Protected by Agricultural Trade Protocol</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WholesaleCheckout;
