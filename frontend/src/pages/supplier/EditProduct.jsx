// frontend/src/pages/supplier/EditProduct.jsx - COMPLETE UPDATE
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  HiUpload, HiX, HiArrowLeft, HiCheckCircle, HiTag,
  HiShieldExclamation, HiBeaker
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const productsPath = user?.role === 'retailer' ? '/retailer/products' : '/supplier/products';

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

      // ✅ NEW: Populate Variants
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
        // Fallback for legacy products without variants
        setVariants([{
          id: 'legacy',
          size: '', // User will need to fill this
          unit: product.unit || 'gm',
          basePrice: product.pricing?.basePrice || '',
          offerPrice: product.pricing?.hasOffer ? product.pricing.finalPrice : '',
          discountPercentage: product.pricing?.discount || 0,
          stock: product.stock || 0,
          isDefault: true
        }]);
      }

      // Fetch sub and type categories if they exist
      if (mainCatId) {
        fetchSubCategories(mainCatId);
      }
      if (subCatId) {
        fetchTypeCategories(subCatId);
      }

    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Failed to load product');
      navigate('/supplier/products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH SUB CATEGORIES when main category changes
  useEffect(() => {
    if (formData.mainCategory) {
      fetchSubCategories(formData.mainCategory);
    } else {
      setSubCategories([]);
      setTypeCategories([]);
    }
  }, [formData.mainCategory]);

  const fetchSubCategories = async (parentId) => {
    try {
      const response = await api.get(`/api/categories?parent=${parentId}`);
      setSubCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  // ✅ FETCH TYPE CATEGORIES when sub category changes
  useEffect(() => {
    if (formData.subCategory) {
      fetchTypeCategories(formData.subCategory);
    } else {
      setTypeCategories([]);
    }
  }, [formData.subCategory]);

  const fetchTypeCategories = async (parentId) => {
    try {
      const response = await api.get(`/api/categories?parent=${parentId}`);
      setTypeCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching type categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSeasonChange = (season) => {
    setFormData(prev => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter(s => s !== season)
        : [...prev.seasons, season]
    }));
  };

  // ✅ NEW: VARIANT MANAGEMENT FUNCTIONS
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
    if (variants.length === 1) {
      showError('At least one variant is required');
      return;
    }
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id, field, value) => {
    setVariants(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: value };

        // Auto-calculate discount if both prices are set
        if (field === 'basePrice' || field === 'offerPrice') {
          const base = parseFloat(field === 'basePrice' ? value : v.basePrice);
          const offer = parseFloat(field === 'offerPrice' ? value : v.offerPrice);

          if (base > 0 && offer > 0 && offer < base) {
            updated.discountPercentage = Math.round(((base - offer) / base) * 100);
          } else {
            updated.discountPercentage = 0;
          }
        }

        return updated;
      }
      return v;
    }));
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);

    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 5) {
      showError('Maximum 5 images allowed in total');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} is too large. Max 5MB per image`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        showError(`${file.name} is not an image`);
        return false;
      }
      return true;
    });

    setNewImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.mainCategory || !formData.basePrice || !formData.stock) {
      showError('Please fill in all required fields');
      return;
    }

    if (existingImages.length + newImages.length === 0) {
      showError('Product must have at least one image');
      return;
    }

    // Offer validation
    if (formData.hasOffer) {
      if (!formData.offerType || formData.offerType === 'none') {
        showError('Please select offer type');
        return;
      }
      if (!formData.offerValue || formData.offerValue <= 0) {
        showError('Please enter valid offer value');
        return;
      }
      if (formData.offerType === 'percentage' && formData.offerValue > 100) {
        showError('Percentage discount cannot exceed 100%');
        return;
      }
    }

    try {
      setSaving(true);

      const productData = new FormData();

      // Basic fields
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('brand', formData.brand);
      productData.append('manufacturer', formData.manufacturer);

      // Category hierarchy
      productData.append('category', JSON.stringify({
        main: formData.mainCategory,
        sub: formData.subCategory || null,
        type: formData.typeCategory || null,
      }));

      // ✅ NEW: VALIDATE & ADD VARIANTS
      const validVariants = variants.filter(v =>
        v.size && v.unit && v.basePrice && v.stock !== ''
      );

      if (validVariants.length === 0) {
        showError('Please add at least one complete size variant');
        return;
      }

      const variantsData = validVariants.map(v => ({
        // Pass _id if it's an existing MongoDB ID, otherwise let backend create one
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

      // ✅ Calculate global pricing from default variant
      const defaultVariant = validVariants.find(v => v.isDefault) || validVariants[0];
      productData.append('pricing', JSON.stringify({
        basePrice: parseFloat(defaultVariant.basePrice),
        hasOffer: formData.hasOffer,
        offerType: formData.hasOffer ? (parseFloat(defaultVariant.offerPrice) < parseFloat(defaultVariant.basePrice) ? 'percentage' : 'none') : 'none',
        offerValue: defaultVariant.discountPercentage || 0,
        offerStartDate: formData.offerStartDate || null,
        offerEndDate: formData.offerEndDate || null,
        finalPrice: parseFloat(defaultVariant.offerPrice || defaultVariant.basePrice),
      }));

      productData.append('unit', defaultVariant.unit);
      productData.append('stock', validVariants.reduce((sum, v) => sum + parseInt(v.stock), 0));
      productData.append('lowStockThreshold', parseInt(formData.lowStockThreshold));

      productData.append('hasExpiry', formData.hasExpiry);
      if (formData.hasExpiry && formData.expiryDate) {
        productData.append('expiryDate', formData.expiryDate);
      }

      productData.append('seasons', JSON.stringify(formData.seasons));
      productData.append('usageType', formData.usageType);
      productData.append('organicCertified', formData.organicCertified);
      productData.append('composition', formData.composition);

      if (formData.suitableFor) {
        const crops = formData.suitableFor.split(',').map(c => c.trim()).filter(c => c);
        productData.append('suitableFor', JSON.stringify(crops));
      }

      if (formData.targetPests) {
        const pests = formData.targetPests.split(',').map(p => p.trim()).filter(p => p);
        productData.append('targetPests', JSON.stringify(pests));
      }

      // Conditional: Pesticide fields
      if (formData.pesticideType !== 'none') {
        productData.append('pesticideDetails', JSON.stringify({
          pesticideType: formData.pesticideType,
          category: formData.pesticideCategory,
          activeIngredient: formData.activeIngredient,
          concentration: formData.concentration,
          safetyClass: formData.safetyClass,
          dosagePerAcre: {
            min: parseFloat(formData.dosageMin) || 0,
            max: parseFloat(formData.dosageMax) || 0,
            recommended: parseFloat(formData.dosageRecommended) || 0,
            unit: formData.dosageUnit,
          },
          applicationMethod: formData.applicationMethod,
          waitingPeriod: parseInt(formData.waitingPeriod) || 0,
          protectiveEquipment: formData.protectiveEquipment.split(',').map(e => e.trim()).filter(e => e),
          precautions: formData.precautions.split(',').map(p => p.trim()).filter(p => p),
        }));
      }

      // Conditional: Fertilizer fields
      if (formData.fertilizerType !== 'none') {
        productData.append('fertilizerDetails', JSON.stringify({
          fertilizerType: formData.fertilizerType,
          npkRatio: {
            nitrogen: parseFloat(formData.nitrogenPercent) || 0,
            phosphorus: parseFloat(formData.phosphorusPercent) || 0,
            potassium: parseFloat(formData.potassiumPercent) || 0,
          },
          micronutrients: formData.micronutrients.split(',').map(m => m.trim()).filter(m => m),
          applicationMethod: formData.fertilizerApplication,
        }));
      }

      // Conditional: Seed fields
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

      // Existing images
      productData.append('existingImages', JSON.stringify(existingImages));

      // New images
      newImages.forEach(image => {
        productData.append('images', image);
      });

      await api.put(`/api/products/${id}`, productData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showSuccess('Product updated successfully!');
      navigate(productsPath);

    } catch (error) {
      console.error('Error updating product:', error);
      showError(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  // ✅ DETERMINE WHICH CONDITIONAL FIELDS TO SHOW
  const selectedMainCat = mainCategories.find(c => c._id === formData.mainCategory);
  const showPesticideFields = selectedMainCat?.categoryType === 'crop_protection';
  const showFertilizerFields = selectedMainCat?.categoryType === 'crop_nutrition';
  const showSeedFields = selectedMainCat?.categoryType === 'seeds';

  const seasons = [
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'monsoon', label: 'Monsoon' },
    { value: 'autumn', label: 'Autumn' },
    { value: 'winter', label: 'Winter' },
    { value: 'all_season', label: 'All Season' }
  ];

  const units = ['kg', 'gm', 'liter', 'ml', 'piece', 'packet', 'bottle', 'bag', 'quintal', 'ton'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={productsPath}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update your product information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information - SAME AS AddProduct */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ HIERARCHICAL CATEGORY SELECTION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Selection</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="mainCategory"
                  value={formData.mainCategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">Select main category</option>
                  {mainCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {subCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select sub category (optional)</option>
                    {subCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {typeCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    name="typeCategory"
                    value={formData.typeCategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select product type (optional)</option>
                    {typeCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ✅ UPDATED: SIZE VARIANTS & PRICING */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <HiTag className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Size Variants & Pricing</h2>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all"
              >
                + Add Size Option
              </button>
            </div>

            <div className="space-y-6">
              {variants.map((v, index) => (
                <div key={v.id} className={`p-6 rounded-xl border-2 transition-all ${v.isDefault ? 'border-green-300 bg-green-50 shadow-md' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-sm font-bold text-gray-600">
                        {index + 1}
                      </span>
                      <h3 className="font-bold text-gray-900">Pricing Option</h3>
                      {v.isDefault && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold">DEFAULT UNIT</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <HiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Size/Quantity</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={v.size}
                          onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. 500"
                        />
                        <select
                          value={v.unit}
                          onChange={(e) => updateVariant(v.id, 'unit', e.target.value)}
                          className="px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="gm">gm</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="liter">liter</option>
                          <option value="piece">piece</option>
                          <option value="packet">packet</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Price (₹)</label>
                      <input
                        type="number"
                        value={v.basePrice}
                        onChange={(e) => updateVariant(v.id, 'basePrice', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-green-700"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Offer Price (₹)</label>
                      <input
                        type="number"
                        value={v.offerPrice}
                        onChange={(e) => updateVariant(v.id, 'offerPrice', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-orange-600"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stock Level</label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => updateVariant(v.id, 'stock', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                        placeholder="Available quantity"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setVariants(prev => prev.map(varnt => ({
                          ...varnt,
                          isDefault: varnt.id === v.id
                        })));
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${v.isDefault ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {v.isDefault ? <HiCheckCircle className="w-5 h-5" /> : null}
                      {v.isDefault ? 'Selected as Default' : 'Set as Default'}
                    </button>

                    {v.basePrice > 0 && v.offerPrice > 0 && (
                      <div className="text-right">
                        <span className="text-sm text-gray-500 mr-2 line-through">₹{v.basePrice}</span>
                        <span className="text-xl font-black text-green-700">₹{v.offerPrice}</span>
                        <span className="ml-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded font-bold">
                          {Math.round(((v.basePrice - v.offerPrice) / v.basePrice) * 100)}% OFF
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Offer Date Range (Global for all Variants) */}
              <div className="mt-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="hasOffer"
                    name="hasOffer"
                    checked={formData.hasOffer}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="hasOffer" className="text-sm font-bold text-blue-900 cursor-pointer">
                    Enable Scheduled Offer Activation
                  </label>
                </div>

                {formData.hasOffer && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Offer Start Date</label>
                      <input
                        type="date"
                        name="offerStartDate"
                        value={formData.offerStartDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Offer End Date</label>
                      <input
                        type="date"
                        name="offerEndDate"
                        value={formData.offerEndDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-blue-700 italic">
                  * Global Offer: When enabled, the "Offer Price" for each size will automatically activate between these dates.
                </p>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>

            <div className="space-y-6">
              {existingImages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Current Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Add New Images</p>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50 text-center">
                  <input
                    type="file"
                    id="new-image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageChange}
                    className="hidden"
                  />
                  <label htmlFor="new-image-upload" className="cursor-pointer">
                    <HiUpload className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      Click to upload more images
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {existingImages.length + newImages.length}/5 images
                    </p>
                  </label>
                </div>

                {newImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ CONDITIONAL: PESTICIDE FIELDS */}
          {showPesticideFields && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <HiShieldExclamation className="w-6 h-6 text-yellow-700" />
                <h2 className="text-xl font-semibold text-yellow-900">Pesticide Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pesticide Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="pesticideType"
                      value={formData.pesticideType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      required={showPesticideFields}
                    >
                      <option value="none">Select type</option>
                      <option value="chemical">Chemical Pesticide</option>
                      <option value="bio">Bio Pesticide</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Safety Class
                    </label>
                    <select
                      name="safetyClass"
                      value={formData.safetyClass}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                    >
                      <option value="not_applicable">Not Applicable</option>
                      <option value="class_1">Class I - Highly Toxic</option>
                      <option value="class_2">Class II - Moderately Toxic</option>
                      <option value="class_3">Class III - Slightly Toxic</option>
                      <option value="class_4">Class IV - Practically Non-toxic</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Active Ingredient
                    </label>
                    <input
                      type="text"
                      name="activeIngredient"
                      value={formData.activeIngredient}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      placeholder="e.g., Chlorpyrifos, Imidacloprid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Concentration
                    </label>
                    <input
                      type="text"
                      name="concentration"
                      value={formData.concentration}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      placeholder="e.g., 25% EC, 50% WP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage Per Acre (Range)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      name="dosageMin"
                      value={formData.dosageMin}
                      onChange={handleInputChange}
                      placeholder="Min"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      min="0"
                    />
                    <input
                      type="number"
                      name="dosageRecommended"
                      value={formData.dosageRecommended}
                      onChange={handleInputChange}
                      placeholder="Recommended"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      min="0"
                    />
                    <input
                      type="number"
                      name="dosageMax"
                      value={formData.dosageMax}
                      onChange={handleInputChange}
                      placeholder="Max"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      min="0"
                    />
                    <select
                      name="dosageUnit"
                      value={formData.dosageUnit}
                      onChange={handleInputChange}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                    >
                      <option value="ml">ml</option>
                      <option value="gm">gm</option>
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Pests (comma separated)
                    </label>
                    <input
                      type="text"
                      name="targetPests"
                      value={formData.targetPests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      placeholder="e.g., Bollworm, Aphid, Whitefly"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waiting Period (days before harvest)
                    </label>
                    <input
                      type="number"
                      name="waitingPeriod"
                      value={formData.waitingPeriod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                      placeholder="e.g., 7, 15, 21"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Method
                  </label>
                  <select
                    name="applicationMethod"
                    value={formData.applicationMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  >
                    <option value="">Select method</option>
                    <option value="foliar_spray">Foliar Spray</option>
                    <option value="soil_drench">Soil Drench</option>
                    <option value="seed_treatment">Seed Treatment</option>
                    <option value="fumigation">Fumigation</option>
                    <option value="baiting">Baiting</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protective Equipment (comma separated)
                  </label>
                  <input
                    type="text"
                    name="protectiveEquipment"
                    value={formData.protectiveEquipment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                    placeholder="e.g., Gloves, Mask, Goggles, Protective Clothing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precautions (comma separated)
                  </label>
                  <textarea
                    name="precautions"
                    value={formData.precautions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all resize-none"
                    placeholder="e.g., Keep away from children, Do not eat or drink while spraying, Wash hands after use"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ✅ CONDITIONAL: FERTILIZER FIELDS */}
          {showFertilizerFields && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <HiBeaker className="w-6 h-6 text-green-700" />
                <h2 className="text-xl font-semibold text-green-900">Fertilizer Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fertilizer Type
                  </label>
                  <select
                    name="fertilizerType"
                    value={formData.fertilizerType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  >
                    <option value="none">Select type</option>
                    <option value="organic">Organic</option>
                    <option value="chemical">Chemical</option>
                    <option value="bio">Bio Fertilizer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    NPK Ratio (Nitrogen-Phosphorus-Potassium)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Nitrogen (N) %</label>
                      <input
                        type="number"
                        name="nitrogenPercent"
                        value={formData.nitrogenPercent}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Phosphorus (P) %</label>
                      <input
                        type="number"
                        name="phosphorusPercent"
                        value={formData.phosphorusPercent}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Potassium (K) %</label>
                      <input
                        type="number"
                        name="potassiumPercent"
                        value={formData.potassiumPercent}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Micronutrients (comma separated)
                  </label>
                  <input
                    type="text"
                    name="micronutrients"
                    value={formData.micronutrients}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="e.g., Zinc, Iron, Magnesium, Boron"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Method
                  </label>
                  <textarea
                    name="fertilizerApplication"
                    value={formData.fertilizerApplication}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                    placeholder="Describe how to apply this fertilizer..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ✅ CONDITIONAL: SEED FIELDS */}
          {showSeedFields && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold text-purple-900">Seed Information</h2>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seed Type
                    </label>
                    <select
                      name="seedType"
                      value={formData.seedType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="none">Select type</option>
                      <option value="vegetable">Vegetable Seed</option>
                      <option value="fruit">Fruit Seed</option>
                      <option value="flower">Flower Seed</option>
                      <option value="grain">Grain Seed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety
                    </label>
                    <input
                      type="text"
                      name="variety"
                      value={formData.variety}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="e.g., Pusa Ruby, Arka Vikas"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Germination Rate (%)
                    </label>
                    <input
                      type="number"
                      name="germinationRate"
                      value={formData.germinationRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="e.g., 85"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harvest Time
                    </label>
                    <input
                      type="text"
                      name="harvestTime"
                      value={formData.harvestTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="e.g., 60-70 days, 3-4 months"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sowing Depth
                    </label>
                    <input
                      type="text"
                      name="sowingDepth"
                      value={formData.sowingDepth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="e.g., 1-2 cm, 0.5 inch"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plant Spacing
                    </label>
                    <input
                      type="text"
                      name="plantSpacing"
                      value={formData.plantSpacing}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="e.g., 30cm x 30cm, 1ft x 1ft"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHybrid"
                    name="isHybrid"
                    checked={formData.isHybrid}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isHybrid" className="text-sm font-medium text-gray-700 cursor-pointer">
                    This is a hybrid seed variety
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details & Expiry - Same as AddProduct */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Type
                </label>
                <div className="flex gap-4">
                  {['farming', 'gardening', 'both'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="usageType"
                        value={type}
                        checked={formData.usageType === type}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Suitable Seasons
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {seasons.map(season => (
                    <label key={season.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.seasons.includes(season.value)}
                        onChange={() => handleSeasonChange(season.value)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{season.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suitable For (Crops - comma separated)
                </label>
                <input
                  type="text"
                  name="suitableFor"
                  value={formData.suitableFor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g., tomato, rice, wheat, cotton"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Composition
                </label>
                <textarea
                  name="composition"
                  value={formData.composition}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Chemical composition or ingredients"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="organic"
                  name="organicCertified"
                  checked={formData.organicCertified}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="organic" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Organic Certified
                </label>
              </div>
            </div>
          </div>

          {/* Expiry */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Expiry Information</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasExpiry"
                  name="hasExpiry"
                  checked={formData.hasExpiry}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasExpiry" className="text-sm font-medium text-gray-700 cursor-pointer">
                  This product has an expiry date
                </label>
              </div>

              {formData.hasExpiry && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Link
              to="/supplier/products"
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;