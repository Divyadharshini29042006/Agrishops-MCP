// frontend/src/pages/retailer/RetailerEditProduct.jsx - COMPLETE UPDATE
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    HiUpload, HiX, HiArrowLeft, HiCheckCircle, HiTag,
    HiShieldExclamation, HiBeaker, HiCheck
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const RetailerEditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();
    const productsPath = '/retailer/products';

    // ✅ CATEGORY STATE
    const [mainCategories, setMainCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [typeCategories, setTypeCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [variants, setVariants] = useState([]); // ✅ NEW: Variants state

    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        description: '',
        brand: '',
        manufacturer: '',

        // Category Hierarchy
        mainCategory: '',
        subCategory: '',
        typeCategory: '',

        // Pricing & Offers
        basePrice: '',
        hasOffer: false,
        offerType: 'none',
        offerValue: '',
        offerStartDate: '',
        offerEndDate: '',

        unit: 'kg',
        stock: '',
        lowStockThreshold: '10',

        // Expiry
        hasExpiry: false,
        expiryDate: '',

        // Usage
        seasons: [],
        suitableFor: '',
        usageType: 'farming',
        organicCertified: false,
        composition: '',

        // Pesticide Fields
        pesticideType: 'none',
        pesticideCategory: 'none',
        activeIngredient: '',
        concentration: '',
        safetyClass: 'not_applicable',
        dosageMin: '',
        dosageMax: '',
        dosageRecommended: '',
        dosageUnit: 'ml',
        applicationMethod: '',
        waitingPeriod: '',
        targetPests: '',
        protectiveEquipment: '',
        precautions: '',

        // Fertilizer Fields
        fertilizerType: 'none',
        nitrogenPercent: '',
        phosphorusPercent: '',
        potassiumPercent: '',
        micronutrients: '',
        fertilizerApplication: '',

        // Seed Fields
        seedType: 'none',
        variety: '',
        germinationRate: '',
        sowingDepth: '',
        plantSpacing: '',
        harvestTime: '',
        isHybrid: false,
    });

    useEffect(() => {
        fetchMainCategories();
        fetchProduct();
    }, [id]);

    // ✅ FETCH MAIN CATEGORIES
    const fetchMainCategories = async () => {
        try {
            const response = await api.get('/api/categories?level=main');
            setMainCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching main categories:', error);
        }
    };

    // ✅ FETCH PRODUCT
    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/products/${id}`);
            const product = response.data.data || response.data;

            // Extract category IDs
            const mainCatId = product.category?.main?._id || product.category?.main || '';
            const subCatId = product.category?.sub?._id || product.category?.sub || '';
            const typeCatId = product.category?.type?._id || product.category?.type || '';

            setFormData({
                name: product.name || '',
                description: product.description || '',
                brand: product.brand || '',
                manufacturer: product.manufacturer || '',

                mainCategory: mainCatId,
                subCategory: subCatId,
                typeCategory: typeCatId,

                // Pricing
                basePrice: product.pricing?.basePrice || product.price || '',
                hasOffer: product.pricing?.hasOffer || false,
                offerType: product.pricing?.offerType || 'none',
                offerValue: product.pricing?.offerValue || '',
                offerStartDate: product.pricing?.offerStartDate ? product.pricing.offerStartDate.split('T')[0] : '',
                offerEndDate: product.pricing?.offerEndDate ? product.pricing.offerEndDate.split('T')[0] : '',

                unit: product.unit || 'kg',
                stock: product.stock || '',
                lowStockThreshold: product.lowStockThreshold || '10',

                hasExpiry: product.hasExpiry || false,
                expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',

                seasons: product.seasons || [],
                suitableFor: Array.isArray(product.suitableFor) ? product.suitableFor.join(', ') : '',
                usageType: product.usageType || 'farming',
                organicCertified: product.organicCertified || false,
                composition: product.composition || '',

                // Pesticide
                pesticideType: product.pesticideDetails?.pesticideType || 'none',
                pesticideCategory: product.pesticideDetails?.category || 'none',
                activeIngredient: product.pesticideDetails?.activeIngredient || '',
                concentration: product.pesticideDetails?.concentration || '',
                safetyClass: product.pesticideDetails?.safetyClass || 'not_applicable',
                dosageMin: product.pesticideDetails?.dosagePerAcre?.min || '',
                dosageMax: product.pesticideDetails?.dosagePerAcre?.max || '',
                dosageRecommended: product.pesticideDetails?.dosagePerAcre?.recommended || '',
                dosageUnit: product.pesticideDetails?.dosagePerAcre?.unit || 'ml',
                applicationMethod: product.pesticideDetails?.applicationMethod || '',
                waitingPeriod: product.pesticideDetails?.waitingPeriod || '',
                targetPests: Array.isArray(product.targetPests) ? product.targetPests.join(', ') : '',
                protectiveEquipment: Array.isArray(product.pesticideDetails?.protectiveEquipment)
                    ? product.pesticideDetails.protectiveEquipment.join(', ') : '',
                precautions: Array.isArray(product.pesticideDetails?.precautions)
                    ? product.pesticideDetails.precautions.join(', ') : '',

                // Fertilizer
                fertilizerType: product.fertilizerDetails?.fertilizerType || 'none',
                nitrogenPercent: product.fertilizerDetails?.npkRatio?.nitrogen || '',
                phosphorusPercent: product.fertilizerDetails?.npkRatio?.phosphorus || '',
                potassiumPercent: product.fertilizerDetails?.npkRatio?.potassium || '',
                micronutrients: Array.isArray(product.fertilizerDetails?.micronutrients)
                    ? product.fertilizerDetails.micronutrients.join(', ') : '',
                fertilizerApplication: product.fertilizerDetails?.applicationMethod || '',

                // Seed
                seedType: product.seedDetails?.seedType || 'none',
                variety: product.seedDetails?.variety || '',
                germinationRate: product.seedDetails?.germinationRate || '',
                sowingDepth: product.seedDetails?.sowingDepth || '',
                plantSpacing: product.seedDetails?.plantSpacing || '',
                harvestTime: product.seedDetails?.harvestTime || '',
                isHybrid: product.seedDetails?.hybrid || false,
            });

            setExistingImages(product.images || []);

            // ✅ Populate Variants
            if (product.variants && product.variants.length > 0) {
                setVariants(product.variants.map(v => ({
                    id: v._id || Date.now() + Math.random(),
                    size: v.quantity || '',
                    unit: v.unit || 'gm',
                    basePrice: v.basePrice || '',
                    offerPrice: v.offerPrice || (v.finalPrice < v.basePrice ? v.finalPrice : ''),
                    discountPercentage: v.discountPercentage || 0,
                    stock: v.stock || 0,
                    isDefault: v.isDefault || false
                })));
            } else {
                setVariants([{
                    id: 'legacy',
                    size: '',
                    unit: product.unit || 'gm',
                    basePrice: product.pricing?.basePrice || '',
                    offerPrice: product.pricing?.hasOffer ? product.pricing.finalPrice : '',
                    discountPercentage: product.pricing?.discount || 0,
                    stock: product.stock || 0,
                    isDefault: true
                }]);
            }

            // Fetch categories
            if (mainCatId) fetchSubCategories(mainCatId);
            if (subCatId) fetchTypeCategories(subCatId);

        } catch (error) {
            console.error('Error fetching product:', error);
            showError('Failed to load product');
            navigate(productsPath);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.mainCategory) fetchSubCategories(formData.mainCategory);
        else { setSubCategories([]); setTypeCategories([]); }
    }, [formData.mainCategory]);

    const fetchSubCategories = async (parentId) => {
        try {
            const response = await api.get(`/api/categories?parent=${parentId}`);
            setSubCategories(response.data.data || []);
        } catch (error) { console.error('Error fetching subcategories:', error); }
    };

    useEffect(() => {
        if (formData.subCategory) fetchTypeCategories(formData.subCategory);
        else setTypeCategories([]);
    }, [formData.subCategory]);

    const fetchTypeCategories = async (parentId) => {
        try {
            const response = await api.get(`/api/categories?parent=${parentId}`);
            setTypeCategories(response.data.data || []);
        } catch (error) { console.error('Error fetching type categories:', error); }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSeasonChange = (season) => {
        setFormData(prev => ({
            ...prev,
            seasons: prev.seasons.includes(season) ? prev.seasons.filter(s => s !== season) : [...prev.seasons, season]
        }));
    };

    const addVariant = () => {
        setVariants(prev => [...prev, {
            id: Date.now(),
            size: '',
            unit: formData.unit || 'gm',
            basePrice: '',
            offerPrice: '',
            stock: '',
            isDefault: false
        }]);
    };

    const removeVariant = (id) => {
        if (variants.length === 1) { showError('At least one variant is required'); return; }
        setVariants(prev => prev.filter(v => v.id !== id));
    };

    const updateVariant = (id, field, value) => {
        setVariants(prev => prev.map(v => {
            if (v.id === id) {
                const updated = { ...v, [field]: value };
                if (field === 'basePrice' || field === 'offerPrice') {
                    const base = parseFloat(field === 'basePrice' ? value : v.basePrice);
                    const offer = parseFloat(field === 'offerPrice' ? value : v.offerPrice);
                    if (base > 0 && offer > 0 && offer < base) updated.discountPercentage = Math.round(((base - offer) / base) * 100);
                    else updated.discountPercentage = 0;
                }
                return updated;
            }
            return v;
        }));
    };
    // ✅ AUTO-ENABLE OFFERS
    useEffect(() => {
        const hasAnyOfferPrice = variants.some(v => v.offerPrice && parseFloat(v.offerPrice) > 0);
        if (hasAnyOfferPrice && !formData.hasOffer) {
            setFormData(prev => ({ ...prev, hasOffer: true }));
        }
    }, [variants]);

    const handleNewImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (existingImages.length + newImages.length + files.length > 5) { showError('Max 5 images allowed'); return; }
        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) { showError(`Too large: ${file.name}`); return false; }
            if (!file.type.startsWith('image/')) { showError(`Not an image: ${file.name}`); return false; }
            return true;
        });
        setNewImages(prev => [...prev, ...validFiles]);
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setNewImagePreviews(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => setExistingImages(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.description || !formData.mainCategory) { showError('Please fill required fields'); return; }
        if (existingImages.length + newImages.length === 0) { showError('At least one image required'); return; }

        try {
            setSaving(true);
            const productData = new FormData();
            productData.append('name', formData.name);
            productData.append('description', formData.description);
            productData.append('brand', formData.brand);
            productData.append('manufacturer', formData.manufacturer);
            productData.append('category', JSON.stringify({ main: formData.mainCategory, sub: formData.subCategory || null, type: formData.typeCategory || null }));

            const validVariants = variants.filter(v => v.size && v.unit && v.basePrice && v.stock !== '');
            if (validVariants.length === 0) { showError('Please add at least one complete size variant'); setSaving(false); return; }

            const variantsData = validVariants.map(v => ({
                _id: (typeof v.id === 'string' && v.id.length > 20) ? v.id : undefined,
                size: `${v.size} ${v.unit}`,
                quantity: parseFloat(v.size),
                unit: v.unit,
                basePrice: parseFloat(v.basePrice),
                offerPrice: v.offerPrice ? parseFloat(v.offerPrice) : null,
                finalPrice: parseFloat(v.offerPrice || v.basePrice),
                discountPercentage: v.discountPercentage || 0,
                stock: parseInt(v.stock),
                isDefault: v.isDefault || false
            }));

            productData.append('variants', JSON.stringify(variantsData));
            const defaultVariant = validVariants.find(v => v.isDefault) || validVariants[0];
            const hasAnyVariantOffer = validVariants.some(v => v.offerPrice && parseFloat(v.offerPrice) < parseFloat(v.basePrice));

            productData.append('pricing', JSON.stringify({
                basePrice: parseFloat(defaultVariant.basePrice),
                hasOffer: formData.hasOffer,
                offerType: formData.hasOffer ? (hasAnyVariantOffer ? 'percentage' : 'none') : 'none',
                offerValue: defaultVariant.discountPercentage || 0,
                offerStartDate: formData.offerStartDate || null,
                offerEndDate: formData.offerEndDate || null,
                finalPrice: parseFloat(defaultVariant.offerPrice || defaultVariant.basePrice),
            }));

            productData.append('unit', defaultVariant.unit);
            productData.append('stock', validVariants.reduce((sum, v) => sum + parseInt(v.stock), 0));
            productData.append('lowStockThreshold', parseInt(formData.lowStockThreshold));
            productData.append('hasExpiry', formData.hasExpiry);
            if (formData.hasExpiry && formData.expiryDate) productData.append('expiryDate', formData.expiryDate);
            productData.append('seasons', JSON.stringify(formData.seasons));
            productData.append('usageType', formData.usageType);
            productData.append('organicCertified', formData.organicCertified);
            productData.append('composition', formData.composition);

            if (formData.suitableFor) productData.append('suitableFor', JSON.stringify(formData.suitableFor.split(',').map(c => c.trim()).filter(c => c)));
            if (formData.targetPests) productData.append('targetPests', JSON.stringify(formData.targetPests.split(',').map(p => p.trim()).filter(p => p)));

            if (formData.pesticideType !== 'none') {
                productData.append('pesticideDetails', JSON.stringify({
                    pesticideType: formData.pesticideType,
                    category: formData.pesticideCategory,
                    activeIngredient: formData.activeIngredient,
                    concentration: formData.concentration,
                    safetyClass: formData.safetyClass,
                    dosagePerAcre: { min: parseFloat(formData.dosageMin) || 0, max: parseFloat(formData.dosageMax) || 0, recommended: parseFloat(formData.dosageRecommended) || 0, unit: formData.dosageUnit },
                    applicationMethod: formData.applicationMethod,
                    waitingPeriod: parseInt(formData.waitingPeriod) || 0,
                    protectiveEquipment: formData.protectiveEquipment.split(',').map(e => e.trim()).filter(e => e),
                    precautions: formData.precautions.split(',').map(p => p.trim()).filter(p => p),
                }));
            }

            if (formData.fertilizerType !== 'none') {
                productData.append('fertilizerDetails', JSON.stringify({
                    fertilizerType: formData.fertilizerType,
                    npkRatio: { nitrogen: parseFloat(formData.nitrogenPercent) || 0, phosphorus: parseFloat(formData.phosphorusPercent) || 0, potassium: parseFloat(formData.potassiumPercent) || 0 },
                    micronutrients: formData.micronutrients.split(',').map(m => m.trim()).filter(m => m),
                    applicationMethod: formData.fertilizerApplication,
                }));
            }

            if (formData.seedType !== 'none') {
                productData.append('seedDetails', JSON.stringify({
                    seedType: formData.seedType,
                    variety: formData.variety,
                    germinationRate: parseFloat(formData.germinationRate) || 0,
                    sowingDepth: formData.sowingDepth,
                    plantSpacing: formData.plantSpacing,
                    harvestTime: formData.harvestTime,
                    hybrid: formData.isHybrid,
                }));
            }

            productData.append('existingImages', JSON.stringify(existingImages));
            newImages.forEach(image => productData.append('images', image));

            await api.put(`/api/products/${id}`, productData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showSuccess('Product updated successfully!');
            navigate(productsPath);
        } catch (error) {
            console.error('Error updating product:', error);
            showError(error.response?.data?.message || 'Failed to update product');
        } finally { setSaving(false); }
    };

    const selectedMainCat = mainCategories.find(c => c._id === formData.mainCategory);
    const showPesticideFields = selectedMainCat?.categoryType === 'crop_protection';
    const showFertilizerFields = selectedMainCat?.categoryType === 'crop_nutrition';
    const showSeedFields = selectedMainCat?.categoryType === 'seeds';

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link to={productsPath} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"><HiArrowLeft className="w-5 h-5" />Back to Products</Link>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Product (Retailer)</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description *</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" required /></div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-2">Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label><input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Selection</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Main Category *</label><select name="mainCategory" value={formData.mainCategory} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required><option value="">Select main category</option>{mainCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
                            {subCategories.length > 0 && <div><label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label><select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select sub category</option>{subCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>}
                            {typeCategories.length > 0 && <div><label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label><select name="typeCategory" value={formData.typeCategory} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select product type</option>{typeCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2"><HiTag className="w-6 h-6 text-blue-600" /><h2 className="text-xl font-semibold text-gray-900">Size Variants & Pricing</h2></div>
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-200">
                                    Total Stock: {variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)}
                                </div>
                                <button type="button" onClick={addVariant} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 font-semibold transition-all">+ Add Size Option</button>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {variants.map((v, index) => (
                                <div key={v.id} className={`p-6 rounded-xl border-2 ${v.isDefault ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                                    <div className="flex justify-between mb-4">
                                        <span className="font-bold">Option {index + 1} {v.isDefault && "(Default)"}</span>
                                        <button type="button" onClick={() => removeVariant(v.id)} className="text-red-500"><HiX className="w-5 h-5" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className="block text-xs font-bold mb-1">Size</label><div className="flex gap-1"><input type="number" value={v.size} onChange={(e) => updateVariant(v.id, 'size', e.target.value)} className="w-full p-2 border rounded" /><select value={v.unit} onChange={(e) => updateVariant(v.id, 'unit', e.target.value)} className="p-2 border rounded"><option value="gm">gm</option><option value="kg">kg</option><option value="ml">ml</option><option value="liter">liter</option></select></div></div>
                                        <div><label className="block text-xs font-bold mb-1">Base Price</label><input type="number" value={v.basePrice} onChange={(e) => updateVariant(v.id, 'basePrice', e.target.value)} className="w-full p-2 border rounded font-bold text-green-700" /></div>
                                        <div><label className="block text-xs font-bold mb-1">Offer Price</label><input type="number" value={v.offerPrice} onChange={(e) => updateVariant(v.id, 'offerPrice', e.target.value)} className="w-full p-2 border rounded font-bold text-orange-600" /></div>
                                        <div><label className="block text-xs font-bold mb-1">Stock</label><input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, 'stock', e.target.value)} className="w-full p-2 border rounded" /></div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <button type="button" onClick={() => setVariants(prev => prev.map(varnt => ({ ...varnt, isDefault: varnt.id === v.id })))} className={`px-4 py-2 rounded font-semibold ${v.isDefault ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>Set Default</button>
                                        {v.basePrice > 0 && v.offerPrice > 0 && <span className="font-bold text-green-700">₹{v.offerPrice} <span className="text-xs text-gray-500 line-through">₹{v.basePrice}</span></span>}
                                    </div>
                                </div>
                            ))}
                            <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                <span className="text-gray-700 font-bold">Consolidated Total Stock:</span>
                                <span className="text-2xl font-black text-gray-900">{variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)} <span className="text-sm font-normal text-gray-500">units</span></span>
                            </div>
                            <div className="mt-8 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <input type="checkbox" id="hasOffer" checked={formData.hasOffer} onChange={handleInputChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <label htmlFor="hasOffer" className="font-bold text-blue-900 cursor-pointer">Enable Offers & Scheduling</label>
                                </div>
                                <p className="text-xs text-blue-700 mb-4 ml-7">Must be checked to activate "Offer Prices" entered above. Add dates to schedule a future offer.</p>
                                {formData.hasOffer && (
                                    <div className="grid grid-cols-2 gap-4 ml-7">
                                        <div><label className="block text-xs font-semibold text-blue-800 mb-1">Start Date (Optional)</label><input type="date" name="offerStartDate" value={formData.offerStartDate} onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" /></div>
                                        <div><label className="block text-xs font-semibold text-blue-800 mb-1">End Date (Optional)</label><input type="date" name="offerEndDate" value={formData.offerEndDate} onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
                        <div className="grid grid-cols-5 gap-4 mb-4">{existingImages.map((img, i) => <div key={i} className="relative"><img src={img.url} className="w-full h-24 object-cover rounded" /><button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><HiX className="w-3 h-3" /></button></div>)}</div>
                        <div className="border-2 border-dashed p-6 text-center bg-gray-50 rounded-lg"><input type="file" multiple accept="image/*" onChange={handleNewImageChange} id="new-imgs" className="hidden" /><label htmlFor="new-imgs" className="cursor-pointer text-blue-600 font-bold block">Click to upload more images</label></div>
                        <div className="grid grid-cols-5 gap-4 mt-4">{newImagePreviews.map((pre, i) => <div key={i} className="relative"><img src={pre} className="w-full h-24 object-cover rounded border-2 border-green-400" /><button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><HiX className="w-3 h-3" /></button></div>)}</div>
                    </div>

                    <div className="flex gap-4">
                        <Link to={productsPath} className="flex-1 py-3 border rounded-lg text-center font-bold">Cancel</Link>
                        <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2">{saving ? "Saving..." : <><HiCheckCircle className="w-5 h-5" />Save Changes</>}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RetailerEditProduct;
