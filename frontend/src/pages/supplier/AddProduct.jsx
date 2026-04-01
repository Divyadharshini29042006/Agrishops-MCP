// frontend/src/pages/supplier/AddProduct.jsx - WITH VARIANTS SYSTEM
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HiUpload, HiX, HiArrowLeft, HiCheckCircle, HiTag,
  HiShieldExclamation, HiBeaker, HiInformationCircle, HiPencil,
  HiExclamationCircle, HiPlus, HiTrash, HiCube, HiPlusCircle
} from 'react-icons/hi';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const AddProduct = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // ✅ CATEGORY STATE
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [typeCategories, setTypeCategories] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [usedVarieties, setUsedVarieties] = useState([]);
  const [existingProducts, setExistingProducts] = useState({ productMap: new Map() });
  const [mainCategoryName, setMainCategoryName] = useState('');

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // ✅ NEW: VARIANTS STATE (Multiple sizes with different prices)
  const [variants, setVariants] = useState([
    {
      id: Date.now(),
      size: '10',
      unit: 'gm',
      basePrice: '',
      offerPrice: '',
      stock: '',
      isDefault: true
    }
  ]);

  // ✅ New variety suggestion state
  const [showNewVarietyInput, setShowNewVarietyInput] = useState(false);
  const [newVarietyName, setNewVarietyName] = useState('');
  const [newVarietyDescription, setNewVarietyDescription] = useState('');

  // ✅ FORM DATA (Removed pricing fields - now in variants)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mainCategory: '',
    subCategory: '',
    typeCategory: '',
    variety: '',

    // ✅ REMOVED: basePrice, hasOffer, offerType, offerValue (now per-variant)
    unit: 'gm', // Default unit for display
    lowStockThreshold: '10',

    hasExpiry: false,
    expiryDate: '',

    seasons: [],
    suitableFor: '',
    usageType: 'farming',
    organicCertified: false,
    composition: '',

    // Conditional fields
    activeIngredient: '',
    technicalContent: '',
    concentration: '',
    formulationType: '',
    modeOfAction: '',
    toxicityLevel: 'low',
    dosage: '',
    applicationMethod: '',
    applicationMethods: [],
    waitingPeriod: '',
    targetPests: '',
    controls: '',
    npkRatio: '',
    micronutrients: '',
    applicationInstructions: '',
    germinationRate: '',
    sowingDepth: '',
    plantSpacing: '',
    harvestTime: '',
    isHybrid: false,

    // Professional sections
    applicationTips: '',
    faq: [{ question: '', answer: '' }],
    targetCrops: '',
    disclaimer: "The information provided here is for reference only. Always read and follow the label instructions before using the product."
  });

  useEffect(() => {
    fetchMainCategories();
    fetchExistingProducts();
  }, []);

  const fetchExistingProducts = async () => {
    try {
      const response = await api.get('/api/products/my/products');
      const products = response.data.data || [];
      const productMap = new Map();
      products.forEach(product => {
        if (product.category?.variety?._id) {
          productMap.set(product.category.variety._id, product);
        }
      });
      setExistingProducts({ productMap });
    } catch (error) {
      console.error('Error fetching existing products:', error);
    }
  };

  const fetchMainCategories = async () => {
    try {
      const response = await api.get('/api/categories?level=main');
      setMainCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching main categories:', error);
      showError('Failed to load categories');
    }
  };

  useEffect(() => {
    if (formData.mainCategory) {
      const selectedCat = mainCategories.find(c => c._id === formData.mainCategory);
      setMainCategoryName(selectedCat?.name || '');
      fetchSubCategories(formData.mainCategory);
    } else {
      setMainCategoryName('');
      setSubCategories([]);
      setTypeCategories([]);
    }
  }, [formData.mainCategory, mainCategories]);

  const fetchSubCategories = async (parentId) => {
    try {
      const response = await api.get(`/api/categories?parent=${parentId}`);
      setSubCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

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

  useEffect(() => {
    if (formData.typeCategory) {
      fetchVarieties(formData.typeCategory);
    } else {
      setVarieties([]);
      setUsedVarieties([]);
    }
  }, [formData.typeCategory]);

  const fetchVarieties = async (productTypeId) => {
    try {
      const response = await api.get(`/api/varieties?productType=${productTypeId}&status=approved`);
      // ✅ Support new API: varieties (available) + usedVarieties (already listed)
      const data = response.data;
      setVarieties(data.varieties || data.data || []);
      setUsedVarieties(data.usedVarieties || []);
    } catch (error) {
      console.error('Error fetching varieties:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFAQChange = (index, field, value) => {
    const newFaq = [...formData.faq];
    newFaq[index][field] = value;
    setFormData(prev => ({ ...prev, faq: newFaq }));
  };

  const addFAQRow = () => {
    setFormData(prev => ({
      ...prev,
      faq: [...prev.faq, { question: '', answer: '' }]
    }));
  };

  const removeFAQRow = (index) => {
    if (formData.faq.length === 1) return;
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }));
  };

  const handleVarietyChange = (e) => {
    const selectedVarietyId = e.target.value;

    if (selectedVarietyId === 'new') {
      setShowNewVarietyInput(true);
      setFormData(prev => ({ ...prev, variety: '' }));
      return;
    }

    if (selectedVarietyId && existingProducts.productMap.has(selectedVarietyId)) {
      const existingProduct = existingProducts.productMap.get(selectedVarietyId);
      showError(`You already have "${existingProduct.name}". Please edit it to update details.`);
      return;
    }

    setShowNewVarietyInput(false);
    setFormData(prev => ({ ...prev, variety: selectedVarietyId }));
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
      unit: 'gm',
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

  const setDefaultVariant = (id) => {
    setVariants(prev => prev.map(v => ({
      ...v,
      isDefault: v.id === id
    })));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 5) {
      showError('Maximum 5 images allowed');
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

    setImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDATION
    if (!formData.name || !formData.description || !formData.mainCategory) {
      showError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (images.length === 0) {
      showError('Please upload at least one product image');
      setLoading(false);
      return;
    }

    if (formData.typeCategory && !formData.variety && !showNewVarietyInput) {
      showError('Please select a variety or add a new one');
      setLoading(false);
      return;
    }

    if (showNewVarietyInput && !newVarietyName.trim()) {
      showError('Please enter the new variety name');
      setLoading(false);
      return;
    }

    // ✅ VALIDATE VARIANTS
    const validVariants = variants.filter(v => v.size && v.basePrice && v.stock);
    if (validVariants.length === 0) {
      showError('Please add at least one complete variant (size, price, and stock)');
      setLoading(false);
      return;
    }

    // Check if at least one variant is default
    if (!validVariants.some(v => v.isDefault)) {
      showError('Please mark at least one variant as default');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const productData = new FormData();

      // Basic fields
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('brand', user?.businessDetails?.businessName || user?.name || '');
      productData.append('manufacturer', user?.businessDetails?.businessName || user?.name || '');

      // Category hierarchy
      const categoryData = {
        main: formData.mainCategory,
        sub: formData.subCategory || null,
        type: formData.typeCategory || null,
      };

      if (formData.variety) {
        categoryData.variety = formData.variety;
      }

      if (showNewVarietyInput) {
        categoryData.variety = null;
      }

      productData.append('category', JSON.stringify(categoryData));

      if (showNewVarietyInput && newVarietyName.trim()) {
        productData.append('newVarietySuggestion', JSON.stringify({
          name: newVarietyName.trim(),
          description: newVarietyDescription.trim(),
        }));
      }

      // ✅ NEW: ADD VARIANTS (instead of single pricing)
      const variantsData = validVariants.map(v => ({
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

      // ✅ Calculate default pricing from default variant
      const defaultVariant = validVariants.find(v => v.isDefault) || validVariants[0];
      productData.append('pricing', JSON.stringify({
        basePrice: parseFloat(defaultVariant.basePrice),
        hasOffer: parseFloat(defaultVariant.offerPrice) < parseFloat(defaultVariant.basePrice),
        offerType: parseFloat(defaultVariant.offerPrice) < parseFloat(defaultVariant.basePrice) ? 'percentage' : 'none',
        offerValue: defaultVariant.discountPercentage || 0,
        finalPrice: parseFloat(defaultVariant.offerPrice || defaultVariant.basePrice),
      }));

      const totalStock = validVariants.reduce((sum, v) => sum + parseInt(v.stock), 0);
      productData.append('stock', totalStock);

      productData.append('unit', defaultVariant.unit);
      productData.append('lowStockThreshold', parseInt(formData.lowStockThreshold));

      // Expiry
      productData.append('hasExpiry', formData.hasExpiry);
      if (formData.hasExpiry && formData.expiryDate) {
        productData.append('expiryDate', formData.expiryDate);
      }

      // Professional Sections
      if (formData.applicationTips) {
        const tips = formData.applicationTips.split('\n').filter(t => t.trim());
        productData.append('applicationTips', JSON.stringify(tips));
      }
      productData.append('faq', JSON.stringify(formData.faq.filter(f => f.question && f.answer)));
      productData.append('disclaimer', formData.disclaimer);

      // Usage
      productData.append('seasons', JSON.stringify(formData.seasons));
      productData.append('usageType', formData.usageType);
      productData.append('organicCertified', formData.organicCertified);
      productData.append('composition', formData.composition);

      if (formData.suitableFor || formData.targetCrops) {
        const crops = (formData.suitableFor || formData.targetCrops).split(',').map(c => c.trim()).filter(c => c);
        productData.append('suitableFor', JSON.stringify(crops));
        productData.append('targetCrops', JSON.stringify(crops));
      }

      if (formData.targetPests || formData.controls) {
        const pests = (formData.targetPests || formData.controls).split(',').map(p => p.trim()).filter(p => p);
        productData.append('targetPests', JSON.stringify(pests));
      }

      // ✅ CONDITIONAL FIELDS BASED ON CATEGORY
      const categoryName = mainCategoryName.toLowerCase();

      if (categoryName.includes('protection') || categoryName.includes('pesticide')) {
        const pDetails = {
          technicalContent: formData.technicalContent,
          formulationType: formData.formulationType,
          modeOfAction: formData.modeOfAction,
          controls: formData.controls ? formData.controls.split(',').map(c => c.trim()) : [],
          dosage: formData.dosage,
          waitingPeriod: formData.waitingPeriod ? parseInt(formData.waitingPeriod) : null
        };
        productData.append('pesticideDetails', JSON.stringify(pDetails));
      }

      if (categoryName.includes('seed')) {
        const sDetails = {
          germinationRate: formData.germinationRate ? parseInt(formData.germinationRate) : null,
          sowingDepth: formData.sowingDepth,
          plantSpacing: formData.plantSpacing,
          harvestTime: formData.harvestTime,
          hybrid: formData.isHybrid
        };
        productData.append('seedDetails', JSON.stringify(sDetails));
      }

      if (formData.targetPests || formData.controls) {
        const pests = (formData.targetPests || formData.controls).split(',').map(p => p.trim()).filter(p => p);
        productData.append('targetPests', JSON.stringify(pests));
      }

      // ✅ ADD IMAGES
      if (images.length > 0) {
        images.forEach((image) => {
          productData.append('images', image);
        });
      }

      await api.post('/api/products', productData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (showNewVarietyInput) {
        showSuccess('Product created! Pending admin approval for both product and new variety.');
      } else {
        showSuccess('Product created successfully with multiple size variants!');
      }
      navigate('/supplier/products');

    } catch (error) {
      console.error('Error creating product:', error);
      showError(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // const selectedMainCategory = mainCategories.find(c => c._id === formData.mainCategory);
  // Removed unused variable 'categoryName' to fix the compile error
  // Removed unused variable 'showPesticideFields' to fix the compile error
  // Removed unused variable 'showFertilizerFields' to fix the compile error
  // Removed unused variable 'showSeedFields' to fix the compile error

  const seasons = [
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'monsoon', label: 'Monsoon' },
    { value: 'autumn', label: 'Autumn' },
    { value: 'winter', label: 'Winter' },
    { value: 'all_season', label: 'All Season' }
  ];

  // Removed unused variable 'commonSizes' to fix the compile error

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/supplier/products"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create product with multiple size variants and pricing options</p>
        </div>

        {/* Supplier Info Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <HiInformationCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Listing as: {user?.businessDetails?.businessName || user?.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Your business information will be automatically added to this product
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                  placeholder="e.g., Organic Tomato Seeds - Premium Variety"
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
                  placeholder="Provide detailed description of your product, its benefits, and usage..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Category Selection - SAME AS BEFORE */}
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
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.typeCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Variety <span className="text-red-500">*</span>
                  </label>

                  {/* ✅ Info: Some varieties hidden because already sold */}
                  {usedVarieties.length > 0 && varieties.length > 0 && (
                    <div className="mb-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <HiInformationCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800">
                        <strong>ℹ️ You already sell:</strong>{' '}
                        {usedVarieties.map(v => v.name).join(', ')}.
                        {' '}These are hidden to prevent duplicate listings.
                      </p>
                    </div>
                  )}

                  {/* ✅ Warning: All varieties already used */}
                  {usedVarieties.length > 0 && varieties.length === 0 && (
                    <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                      <HiExclamationCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        <strong>⚠️ You have already listed products for all available varieties of this type.</strong>{' '}
                        Consider adding a new variety via the button below.
                      </p>
                    </div>
                  )}
                  <select
                    name="variety"
                    value={formData.variety}
                    onChange={handleVarietyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required={!showNewVarietyInput}
                  >
                    <option value="">Select variety</option>
                    {varieties.map(variety => {
                      const isAlreadyAdded = existingProducts.productMap?.has(variety._id) || false;
                      return (
                        <option
                          key={variety._id}
                          value={variety._id}
                          disabled={isAlreadyAdded}
                          className={isAlreadyAdded ? 'text-gray-400' : ''}
                        >
                          {variety.name} {isAlreadyAdded ? '(Already added - Edit to update)' : ''}
                        </option>
                      );
                    })}
                    <option value="new" className="font-semibold text-blue-600">
                      + Add New Variety (Requires Admin Approval)
                    </option>
                  </select>

                  {formData.variety && existingProducts.productMap?.has(formData.variety) && (
                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <HiExclamationCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900 mb-2">
                            You've already added this variety
                          </p>
                          <Link
                            to={`/supplier/products/edit/${existingProducts.productMap?.get(formData.variety)?._id}`}
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg"
                          >
                            <HiPencil className="w-4 h-4" />
                            Edit Existing Product
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showNewVarietyInput && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <HiInformationCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-900">
                      <strong>Adding a new variety:</strong> Your product will be pending admin approval. Once approved, this variety will be available for all suppliers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Variety Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newVarietyName}
                      onChange={(e) => setNewVarietyName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      placeholder="e.g., Cherry Tomato, Beefsteak Tomato"
                      required={showNewVarietyInput}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety Description (Optional)
                    </label>
                    <textarea
                      value={newVarietyDescription}
                      onChange={(e) => setNewVarietyDescription(e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                      placeholder="Brief description of this variety..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNewVarietyInput(false);
                      setNewVarietyName('');
                      setNewVarietyDescription('');
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancel - Select from existing varieties
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HiCube className="text-blue-600" />
                Product Variants & Pricing
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                <HiPlusCircle className="w-5 h-5" />
                Add Size
              </button>
            </div>

            {/* ✅ DYNAMIC STOCK UNIT INFO BOX */}
            <div className={`mb-6 border rounded-xl p-4 flex items-start gap-3 ${
              mainCategoryName.toLowerCase().includes('seed') ? 'bg-green-50 border-green-200' :
              mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'bg-orange-50 border-orange-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <HiInformationCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                mainCategoryName.toLowerCase().includes('seed') ? 'text-green-600' :
                mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'text-orange-600' :
                'text-blue-600'
              }`} />
              <div>
                <h4 className={`font-bold text-sm ${
                  mainCategoryName.toLowerCase().includes('seed') ? 'text-green-900' :
                  mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'text-orange-900' :
                  'text-blue-900'
                }`}>
                  Important: Stock is in {
                    mainCategoryName.toLowerCase().includes('seed') ? 'BAGS' :
                    mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'BOTTLES / UNITS' :
                    'UNITS'
                  }
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${
                  mainCategoryName.toLowerCase().includes('seed') ? 'text-green-800' :
                  mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'text-orange-800' :
                  'text-blue-800'
                }`}>
                  As a supplier, your stock represents bulk quantity.
                  {mainCategoryName.toLowerCase().includes('seed') ? 
                    ' Example: If you have 50 bags of seeds, enter 50 in the stock field below.' :
                    ' Example: If you have 100 bottles of pesticide, enter 100 in the stock field below.'
                  }
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <HiInformationCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">💡 Add different sizes with different prices:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Example: 10gm (₹50), 25gm (₹100), 50gm (₹180)</li>
                    <li>Mark one variant as "Default" - it will show first to customers</li>
                    <li>Offer price is optional - customers see discount % automatically</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={variant.id} className={`border-2 rounded-xl p-4 ${variant.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-lg text-sm">
                        Variant {index + 1}
                      </span>
                      {variant.isDefault && (
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          ✓ DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!variant.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDefaultVariant(variant.id)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium underline"
                        >
                          Set as Default
                        </button>
                      )}
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Size */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Size <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={variant.size}
                        onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="10"
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={variant.unit}
                        onChange={(e) => updateVariant(variant.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      >
                        {mainCategoryName.toLowerCase().includes('seed') ? (
                          <>
                            <option value="gm">gm</option>
                            <option value="kg">kg</option>
                          </>
                        ) : mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? (
                          <>
                            <option value="ml">ml</option>
                            <option value="liter">liter</option>
                            <option value="gm">gm</option>
                            <option value="kg">kg</option>
                          </>
                        ) : (
                          <>
                            <option value="gm">gm</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="liter">liter</option>
                            <option value="piece">piece</option>
                            <option value="packet">packet</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Base Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Base Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          value={variant.basePrice}
                          onChange={(e) => updateVariant(variant.id, 'basePrice', e.target.value)}
                          className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          placeholder="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* Offer Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Offer Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          value={variant.offerPrice}
                          onChange={(e) => updateVariant(variant.id, 'offerPrice', e.target.value)}
                          className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          placeholder="Optional"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Stock ({
                          mainCategoryName.toLowerCase().includes('seed') ? 'Bags' :
                          mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'Bottles' :
                          'Units'
                        })
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. 50"
                        min="0"
                        required
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Number of {
                          mainCategoryName.toLowerCase().includes('seed') ? 'bags' :
                          mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide') ? 'bottles' :
                          'units'
                        } available</p>
                    </div>
                  </div>

                  {/* Preview */}
                  {variant.basePrice && variant.size && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Preview:</p>
                          <p className="font-bold text-gray-900">
                            {variant.size} {variant.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          {variant.offerPrice && parseFloat(variant.offerPrice) < parseFloat(variant.basePrice) ? (
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-green-600">
                                  ₹{parseFloat(variant.offerPrice).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{parseFloat(variant.basePrice).toFixed(2)}
                                </span>
                              </div>
                              <span className="inline-block bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded mt-1">
                                {variant.discountPercentage}% OFF
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-gray-900">
                              ₹{parseFloat(variant.basePrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Stock Summary */}
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Stock Across All Variants:</p>
                  <p className="text-xs text-green-600 mt-1">Combined stock from all size variants</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-700">
                    {variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)}
                  </p>
                  <p className="text-xs text-green-600">units total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Product Images <span className="text-red-500">*</span>
            </h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50 text-center">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <HiUpload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-blue-600 mb-1">
                    Click to upload images
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB each (Max 5 images)</p>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
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
              )}
            </div>
          </div>

          {/* Additional Details - SAME AS BEFORE (shortened for space) */}
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

              {/* ✅ CATEGORY SPECIFIC FIELDS SECTION */}
              {(mainCategoryName.toLowerCase().includes('protection') || mainCategoryName.toLowerCase().includes('pesticide')) && (
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                    <HiBeaker className="w-5 h-5" />
                    Pesticide / Crop Protection Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technical Content</label>
                      <input
                        type="text"
                        name="technicalContent"
                        value={formData.technicalContent}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. Imidacloprid 17.8% SL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Formulation Type</label>
                      <input
                        type="text"
                        name="formulationType"
                        value={formData.formulationType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. SL, EC, WP, SC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mode of Action</label>
                      <input
                        type="text"
                        name="modeOfAction"
                        value={formData.modeOfAction}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. Systemic, Contact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Pests / Controls</label>
                      <input
                        type="text"
                        name="controls"
                        value={formData.controls}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. Aphids, Jassids, Whitefly (comma separated)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recommended Dosage</label>
                      <input
                        type="text"
                        name="dosage"
                        value={formData.dosage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. 0.5ml per liter of water"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Waiting Period (Days)</label>
                      <input
                        type="number"
                        name="waitingPeriod"
                        value={formData.waitingPeriod}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. 7"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mainCategoryName.toLowerCase().includes('seed') && (
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                    <HiInformationCircle className="w-5 h-5" />
                    Seed Specific Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Germination Rate (%)</label>
                      <input
                        type="number"
                        name="germinationRate"
                        value={formData.germinationRate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. 85"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sowing Depth</label>
                      <input
                        type="text"
                        name="sowingDepth"
                        value={formData.sowingDepth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. 1-2 cm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plant Spacing</label>
                      <input
                        type="text"
                        name="plantSpacing"
                        value={formData.plantSpacing}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. 30x60 cm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Harvest Time</label>
                      <input
                        type="text"
                        name="harvestTime"
                        value={formData.harvestTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. 60-70 days"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isHybrid"
                        name="isHybrid"
                        checked={formData.isHybrid}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label htmlFor="isHybrid" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Hybrid Variety
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ PROFESSIONAL SECTIONS - FAQ & TIPS */}
              <div className="pt-8 border-t border-gray-200 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Application Tips</h3>
                  <textarea
                    name="applicationTips"
                    value={formData.applicationTips}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Enter pro-tips for better results (one per line)...&#10;1. Best results when applied early morning.&#10;2. Use high-quality sprayer for uniform coverage."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
                    <button
                      type="button"
                      onClick={addFAQRow}
                      className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <HiPlus className="w-4 h-4" /> Add FAQ
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.faq.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3 relative">
                        {formData.faq.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFAQRow(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                          >
                            <HiX className="w-5 h-5" />
                          </button>
                        )}
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                          placeholder="Question (e.g. Can it be mixed with other pesticides?)"
                        />
                        <textarea
                          value={item.answer}
                          onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
                          placeholder="Answer here..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Product Disclaimer</label>
                  <textarea
                    name="disclaimer"
                    value={formData.disclaimer}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-600 text-sm italic"
                  />
                </div>
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
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Product...
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-5 h-5" />
                  Create Product with Variants
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;