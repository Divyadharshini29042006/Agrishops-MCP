// frontend/src/components/MerchantStockAlert.jsx
import { HiExclamation, HiExclamationCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const MerchantStockAlert = ({ products, type = 'low', role = 'retailer' }) => {
    if (!products || products.length === 0) return null;

    const isCritical = type === 'critical';
    const bgColor = isCritical ? 'bg-red-50' : 'bg-orange-50';
    const borderColor = isCritical ? 'border-red-500' : 'border-orange-500';
    const textColor = isCritical ? 'text-red-800' : 'text-orange-800';
    const iconColor = isCritical ? 'text-red-600' : 'text-orange-600';
    const label = isCritical ? 'CRITICAL STOCK ALERT' : 'Low Stock Warning';
    const link = role === 'retailer'
        ? `/retailer/inventory?status=${isCritical ? 'critical_stock' : 'low_stock'}`
        : '/supplier/products'; // Supplier products page usually handles filtering

    return (
        <div className={`${bgColor} border-l-4 ${borderColor} p-4 rounded-lg shadow-sm transition-all animate-pulse`}>
            <div className="flex items-start">
                {isCritical ? (
                    <HiExclamationCircle className={`w-6 h-6 ${iconColor} mt-0.5 flex-shrink-0`} />
                ) : (
                    <HiExclamation className={`w-6 h-6 ${iconColor} mt-0.5 flex-shrink-0`} />
                )}
                <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-bold ${textColor} uppercase tracking-tight`}>
                        {label}: {products.length} Product{products.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="mt-2 space-y-2">
                        {products.map((product) => (
                            <div
                                key={product.id || product._id}
                                className={`text-sm ${isCritical ? 'bg-red-100 text-red-900' : 'bg-orange-100 text-orange-900'} p-3 rounded-lg border ${isCritical ? 'border-red-200' : 'border-orange-200'}`}
                            >
                                <div className="font-bold mb-2">{product.name}</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {product.variantStockStatus?.map((v, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-bold ${v.isCritical ? 'bg-red-600 text-white' :
                                                    v.isLow ? 'bg-orange-500 text-white' :
                                                        'bg-white/50 text-gray-700'
                                                }`}
                                        >
                                            <span>{v.size}: {v.stock} {role === 'retailer' ? 'Pkt' : 'Bag'}</span>
                                            <span className="ml-1 uppercase">{v.isCritical ? '!!' : (v.isLow ? '!' : 'OK')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        to={link}
                        className={`text-xs font-bold ${textColor} underline mt-3 inline-block hover:opacity-80 transition-opacity`}
                    >
                        {isCritical ? 'RESTOCK URGENTLY →' : 'View & Restock Items →'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MerchantStockAlert;
