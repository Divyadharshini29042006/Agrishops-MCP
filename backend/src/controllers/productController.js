// backend/src/controllers/productController.js - FIXED: Slug-based category filtering
import Product from '../models/Product.js';
import ProductVariety from '../models/ProductVariety.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getCurrentSeason } from '../utils/seasonalData.js';
import { getAdminUserId } from '../utils/helpers.js';

/**
 * @desc    Get all products with filters (FIXED: Slug-based filtering)
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      mainCategory,
      subCategory,
      typeCategory,
      type,          // ✅ NEW: Support for direct type ID filtering
      variety,       // ✅ NEW: Support for direct variety ID filtering
      season,
      minPrice,
      maxPrice,
      search,
      usageType,
      approvalStatus,
      isActive,      // ✅ NEW: Allow filtering by isActive
      hasOffer,
      brands,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    // Build query
    const query = {};

    // ✅ Allow filtering by isActive (default to true if not specified)
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true;
    }

    // Only show approved products to non-admin users
    if (!req.user || req.user.role !== 'admin') {
      query.approvalStatus = 'approved';
    } else if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    // ✅ ROLE-BASED FILTERING: Show only retailer products to customers by default
    // Exception: When filtering by type/variety (for bulk order supplier matching)
    if (!type && !variety) {
      // For customers and public users, show ONLY retailer products
      if (!req.user || req.user.role === 'customer') {
        const retailers = await User.find({ role: 'retailer', isActive: true }).select('_id');
        if (retailers.length > 0) {
          query.seller = { $in: retailers.map(r => r._id) };
        } else {
          // If no retailers exist, return empty result
          query.seller = null;
        }
      }
    }

    // ✅ NEW: Direct type/variety filtering (for bulk order supplier matching)
    if (type) {
      console.log('🔍 Filtering by type:', type);
      query['category.type'] = type;
    } else if (variety) {
      console.log('🔍 Filtering by variety:', variety);
      query['category.variety'] = variety;
    }
    // ✅ FIX: Handle single "category" parameter (from navbar/filters)
    else if (category) {
      // Find category by slug
      const categoryDoc = await Category.findOne({
        slug: category,
        isActive: true
      });

      if (categoryDoc) {
        // Get all related category IDs (main category + all its children)
        const categoryIds = [categoryDoc._id];

        // If it's a main category, get all descendants (subs and types)
        if (categoryDoc.level === 'main') {
          const subCategories = await Category.find({
            parent: categoryDoc._id,
            isActive: true
          }).select('_id');
          const subIds = subCategories.map(c => c._id);
          categoryIds.push(...subIds);

          if (subIds.length > 0) {
            const types = await Category.find({
              parent: { $in: subIds },
              isActive: true
            }).select('_id');
            categoryIds.push(...types.map(c => c._id));
          }
        }
        // If it's a sub category, get all descendant types
        else if (categoryDoc.level === 'sub') {
          const types = await Category.find({
            parent: categoryDoc._id,
            isActive: true
          }).select('_id');
          categoryIds.push(...types.map(c => c._id));
        }

        // ✅ CRITICAL FIX: Filter products that belong to ANY of these categories
        query.$or = [
          { 'category.main': { $in: categoryIds } },
          { 'category.sub': { $in: categoryIds } },
          { 'category.type': { $in: categoryIds } }
        ];
      } else {
        // Return empty result if category doesn't exist
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        });
      }
    }
    // ✅ Legacy support: Old category filtering (mainCategory, subCategory, typeCategory)
    else {
      if (mainCategory) {
        const mainCat = await Category.findOne({
          slug: mainCategory,
          level: 'main',
          isActive: true
        });

        if (mainCat) {
          query['category.main'] = mainCat._id;
        } else if (mainCategory.match(/^[a-f\d]{24}$/i)) {
          query['category.main'] = mainCategory;
        } else {
          const catByType = await Category.findOne({
            categoryType: mainCategory,
            level: 'main',
            isActive: true
          });
          if (catByType) {
            query['category.main'] = catByType._id;
          }
        }
      }

      if (subCategory) {
        const subCat = await Category.findOne({
          slug: subCategory,
          level: 'sub',
          isActive: true
        });

        if (subCat) {
          query['category.sub'] = subCat._id;
        } else if (subCategory.match(/^[a-f\d]{24}$/i)) {
          query['category.sub'] = subCategory;
        }
      }

      if (typeCategory) {
        const typeCat = await Category.findOne({
          slug: typeCategory,
          level: 'type',
          isActive: true
        });

        if (typeCat) {
          query['category.type'] = typeCat._id;
        } else if (typeCategory.match(/^[a-f\d]{24}$/i)) {
          query['category.type'] = typeCategory;
        }
      }
    }

    // Season filter
    if (season) {
      query.seasons = season;
    }

    // ✅ Price range filter (use finalPrice for offers)
    if (minPrice || maxPrice) {
      query['pricing.finalPrice'] = {};
      if (minPrice) query['pricing.finalPrice'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.finalPrice'].$lte = Number(maxPrice);
    }

    // Usage type filter
    if (usageType) {
      query.usageType = { $in: [usageType, 'both'] };
    }

    // ✅ Filter by products with offers
    if (hasOffer === 'true') {
      query['pricing.hasOffer'] = true;
      query['pricing.offerEndDate'] = { $gte: new Date() };
    }

    // ✅ Brand filter (by business name)
    if (brands) {
      const brandNames = brands.split(',');
      const sellers = await User.find({
        'businessDetails.businessName': { $in: brandNames }
      }).select('_id');

      if (sellers.length > 0) {
        query.seller = { $in: sellers.map(s => s._id) };
      }
    }

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);

    console.log('📊 Final query:', JSON.stringify(query, null, 2));

    const products = await Product.find(query)
      .populate('category.main', 'name categoryType slug')
      .populate('category.sub', 'name slug')
      .populate('category.type', 'name slug')
      .populate('category.variety', 'name description')
      .populate('seller', 'name email businessDetails.businessName businessDetails.brandLogo role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    console.log(`✅ Found ${products.length} products`);
    if (type || variety) {
      console.log('Products:', products.map(p => ({
        name: p.name,
        seller: p.seller?.businessDetails?.businessName || p.seller?.name,
        role: p.seller?.role,
        type: p.category?.type?.name
      })));
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

/**
 * @desc    Get consolidated homepage data (Brands + Category Tree + Featured Products)
 * @route   GET /api/products/homepage-data
 * @access  Public
 */
export const getHomepageData = async (req, res) => {
  try {
    // 1. Fetch Brands (Logic from getHomepageBrands)
    const brandsPromise = User.find({
      role: { $in: ['supplier', 'retailer'] },
      'businessDetails.brandLogo.url': { $exists: true, $ne: null },
      'businessDetails.brandLogoStatus': 'approved',
      'businessDetails.showOnHomepage': true,
      isActive: true,
      isApproved: true
    })
      .select('name role businessDetails.businessName businessDetails.brandLogo businessDetails.displayOrder')
      .sort('businessDetails.displayOrder -createdAt')
      .limit(50);

    // 2. Fetch Category Tree
    const categoryTreePromise = Category.getCategoryTree();

    // 3. Fetch Featured Products for specific categories
    const featuredCategorySlugs = [
      'vegetable-seeds',
      'crop-protection',
      'flower-seeds',
      'fruit-seeds',
      'bio-pesticides',
      'chemical-pesticides'
    ];

    // Helper to fetch products for a category slug
    const fetchCategoryProducts = async (slug) => {
      const categoryDoc = await Category.findOne({ slug, isActive: true });
      if (!categoryDoc) return { category: slug, products: [] };

      const categoryIds = [categoryDoc._id];
      if (categoryDoc.level === 'main') {
        const subCategories = await Category.find({ parent: categoryDoc._id, isActive: true }).select('_id');
        const subIds = subCategories.map(c => c._id);
        categoryIds.push(...subIds);
        if (subIds.length > 0) {
          const types = await Category.find({ parent: { $in: subIds }, isActive: true }).select('_id');
          categoryIds.push(...types.map(c => c._id));
        }
      }

      const products = await Product.find({
        isActive: true,
        approvalStatus: 'approved',
        $or: [
          { 'category.main': { $in: categoryIds } },
          { 'category.sub': { $in: categoryIds } },
          { 'category.type': { $in: categoryIds } }
        ]
      })
        .populate('category.main', 'name slug')
        .select('name pricing images brand rating variants stock seller category')
        .sort('-createdAt')
        .limit(10);

      return { category: slug, products };
    };

    // Execute all in parallel
    const [brands, categoryTree, ...categoryProductsResults] = await Promise.all([
      brandsPromise,
      categoryTreePromise,
      ...featuredCategorySlugs.map(slug => fetchCategoryProducts(slug))
    ]);

    // Map products to their slugs
    const featuredProducts = {};
    categoryProductsResults.forEach(result => {
      featuredProducts[result.category] = result.products;
    });

    res.status(200).json({
      success: true,
      data: {
        brands,
        categoryTree,
        featuredProducts
      }
    });
  } catch (error) {
    console.error('Get homepage data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homepage data',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category.main', 'name categoryType description slug')
      .populate('category.sub', 'name description slug')
      .populate('category.type', 'name slug')
      .populate('category.variety', 'name description characteristics')
      .populate('seller', 'name email phone businessDetails location');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment view count using $inc (Atomic)
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message,
    });
  }
};

/**
 * @desc    Get aggregated product details (Product + Sellers + Similar)
 * @route   GET /api/products/:id/details
 * @access  Public
 */
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch main product
    const product = await Product.findById(id)
      .populate('category.main', 'name categoryType description slug')
      .populate('category.sub', 'name description slug')
      .populate('category.type', 'name slug')
      .populate('category.variety', 'name description characteristics')
      .populate('seller', 'name email phone businessDetails.businessName businessDetails.brandLogo location role');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment view count using $inc (Atomic)
    Product.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

    // ✅ CATEGORY-BASED MATCHING: Use category.type for broader supplier matching
    // This ensures suppliers with ANY variant of the same product type are shown,
    // e.g., "Plum Tomato – Oval Red" matches "Plum Tomato – High Yield" because both
    // share the same category.type (Plum Tomato), even if varieties differ.
    const otherSellersQuery = product.category?.type
      ? {
        'category.type': product.category.type,
        _id: { $ne: id },
        approvalStatus: 'approved',
        isActive: true
      }
      : product.category?.sub
        ? {
          'category.sub': product.category.sub,
          _id: { $ne: id },
          approvalStatus: 'approved',
          isActive: true
        }
        : product.category?.main
          ? {
            'category.main': product.category.main,
            _id: { $ne: id },
            approvalStatus: 'approved',
            isActive: true
          }
          : null;

    const [otherSellers, similarProducts] = await Promise.all([
      // 2. Fetch other sellers using category-based matching (type → sub → main fallback)
      otherSellersQuery
        ? Product.find(otherSellersQuery)
          .populate('seller', 'name businessDetails.businessName businessDetails.brandLogo role')
          .select('name pricing variants stock seller category images')
          .limit(10)
        : Promise.resolve([]),

      // 3. Fetch similar products (same type category)
      product.category?.type
        ? Product.find({
          'category.type': product.category.type,
          _id: { $ne: id },
          approvalStatus: 'approved',
          isActive: true
        })
          .select('name pricing images brand rating variants stock')
          .limit(8)
        : Promise.resolve([])
    ]);

    res.status(200).json({
      success: true,
      data: {
        product,
        otherSellers,
        similarProducts
      }
    });
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      error: error.message,
    });
  }
};

/**
 * @desc    Compare prices across retailers for the same product
 * @route   GET /api/products/:id/compare
 * @access  Public
 */
export const compareProducts = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get current product to identify its category and variety
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 2. Find other retailers selling the EXACT same product
    // Logic: Same mainCategory, subCategory, typeCategory AND variety
    const query = {
      _id: { $ne: id },
      'category.main': currentProduct.category.main,
      'category.sub': currentProduct.category.sub,
      'category.type': currentProduct.category.type,
      'category.variety': currentProduct.category.variety,
      approvalStatus: 'approved',
      isActive: true,
      sellerType: 'retailer' // Only compare against retailers as per requirement
    };

    // If variety is missing, handle fallback
    if (!currentProduct.category.variety) {
        delete query['category.variety'];
    }

    const otherSellers = await Product.find(query)
      .populate('seller', 'name businessDetails.businessName businessDetails.brandLogo location role')
      .select('name pricing variants stock seller images category')
      .sort({ 'pricing.finalPrice': 1 }); // Sort by price ascending

    res.status(200).json({
      success: true,
      count: otherSellers.length,
      data: otherSellers
    });
  } catch (error) {
    console.error('Compare products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comparison data',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new product (WITH VARIETY SUPPORT)
 * @route   POST /api/products
 * @access  Private (Retailer/Supplier only)
 */
export const createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT START ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files:', req.files ? req.files.length : 0);

    // Parse JSON fields from FormData
    const productData = { ...req.body };

    console.log('Raw productData:', productData);

    // Parse JSON strings with error handling
    try {
      if (typeof productData.category === 'string') {
        productData.category = JSON.parse(productData.category);
        console.log('Parsed category:', productData.category);
      }
      if (typeof productData.pricing === 'string') {
        productData.pricing = JSON.parse(productData.pricing);
        console.log('Parsed pricing:', productData.pricing);
      }
      if (typeof productData.seasons === 'string') {
        productData.seasons = JSON.parse(productData.seasons);
        console.log('Parsed seasons:', productData.seasons);
      }
      if (typeof productData.suitableFor === 'string') {
        productData.suitableFor = JSON.parse(productData.suitableFor);
        console.log('Parsed suitableFor:', productData.suitableFor);
      }
      if (typeof productData.targetPests === 'string') {
        productData.targetPests = JSON.parse(productData.targetPests);
        console.log('Parsed targetPests:', productData.targetPests);
      }
      if (typeof productData.pesticideDetails === 'string') {
        productData.pesticideDetails = JSON.parse(productData.pesticideDetails);
        console.log('Parsed pesticideDetails:', productData.pesticideDetails);
      }
      if (typeof productData.fertilizerDetails === 'string') {
        productData.fertilizerDetails = JSON.parse(productData.fertilizerDetails);
        console.log('Parsed fertilizerDetails:', productData.fertilizerDetails);
      }
      if (typeof productData.seedDetails === 'string') {
        productData.seedDetails = JSON.parse(productData.seedDetails);
        console.log('Parsed seedDetails:', productData.seedDetails);
      }
      if (typeof productData.newVarietySuggestion === 'string') {
        productData.newVarietySuggestion = JSON.parse(productData.newVarietySuggestion);
        console.log('Parsed newVarietySuggestion:', productData.newVarietySuggestion);
      }
      if (typeof productData.variants === 'string') {
        productData.variants = JSON.parse(productData.variants);
        console.log('Parsed variants:', productData.variants);
      }
      if (typeof productData.applicationTips === 'string') {
        productData.applicationTips = JSON.parse(productData.applicationTips);
        console.log('Parsed applicationTips:', productData.applicationTips);
      }
      if (typeof productData.faq === 'string') {
        productData.faq = JSON.parse(productData.faq);
        console.log('Parsed faq:', productData.faq);
      }
      if (typeof productData.targetCrops === 'string') {
        productData.targetCrops = JSON.parse(productData.targetCrops);
        console.log('Parsed targetCrops:', productData.targetCrops);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please check your input.',
      });
    }

    // ✅ VARIETY HANDLING LOGIC
    let varietyApprovalNeeded = false;

    // Case 1: Supplier selected existing variety
    if (productData.category?.variety) {
      // ✅ CHECK FOR DUPLICATE
      const existingProduct = await Product.findOne({
        seller: req.user._id,
        'category.variety': productData.category.variety,
        isActive: true,
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: `You already have a product for this variety: "${existingProduct.name}". Please edit it to update details.`,
          existingProductId: existingProduct._id,
        });
      }

      const selectedVariety = await ProductVariety.findById(productData.category.variety);
      if (selectedVariety && selectedVariety.approvalStatus === 'approved') {
        productData.approvalStatus = 'approved';
      } else {
        productData.approvalStatus = 'pending';
      }
    }

    // Case 2: Supplier is creating a NEW variety
    else if (productData.newVarietySuggestion && productData.newVarietySuggestion.name) {
      varietyApprovalNeeded = true;

      const existingVariety = await ProductVariety.findOne({
        name: { $regex: new RegExp(`^${productData.newVarietySuggestion.name}$`, 'i') },
        productType: productData.category.type,
        approvalStatus: 'approved',
      });

      if (existingVariety) {
        return res.status(400).json({
          success: false,
          message: `This variety "${productData.newVarietySuggestion.name}" already exists. Please select it from the dropdown.`,
        });
      }

      const pendingSuggestion = await ProductVariety.findOne({
        name: { $regex: new RegExp(`^${productData.newVarietySuggestion.name}$`, 'i') },
        productType: productData.category.type,
        suggestedBy: req.user._id,
        approvalStatus: 'pending',
      });

      if (pendingSuggestion) {
        return res.status(400).json({
          success: false,
          message: `You already have a pending variety suggestion: "${productData.newVarietySuggestion.name}". Please wait for admin approval.`,
        });
      }

      const newVariety = await ProductVariety.create({
        name: productData.newVarietySuggestion.name,
        description: productData.newVarietySuggestion.description || '',
        productType: productData.category.type,
        categoryHierarchy: {
          main: productData.category.main,
          sub: productData.category.sub || null,
          type: productData.category.type,
        },
        suggestedBy: req.user._id,
        approvalStatus: 'pending',
      });

      productData.category.variety = newVariety._id;

      productData.newVarietySuggestion = {
        name: newVariety.name,
        description: newVariety.description,
        status: 'pending',
        varietyId: newVariety._id,
      };

      productData.approvalStatus = 'pending';
    }

    // Case 3: No variety selected
    else {
      const existingProduct = await Product.findOne({
        seller: req.user._id,
        name: { $regex: new RegExp(`^${productData.name}$`, 'i') },
        isActive: true
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: `You already have a product named "${productData.name}". Please use a different name or update the existing product.`,
          existingProductId: existingProduct._id
        });
      }

      productData.approvalStatus = 'pending';
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        uploadedAt: new Date()
      }));
    }

    productData.seller = req.user._id;
    productData.sellerType = req.user.role; // supplier or retailer

    if (!productData.category || !productData.category.main) {
      return res.status(400).json({
        success: false,
        message: 'Main category is required',
      });
    }

    const mainCategory = await Category.findById(productData.category.main);
    if (!mainCategory) {
      return res.status(400).json({
        success: false,
        message: 'Invalid main category',
      });
    }

    const product = await Product.create(productData);

    if (req.user.stats) {
      req.user.stats.productsListed = (req.user.stats.productsListed || 0) + 1;
      await req.user.save();
    }

    const adminId = await getAdminUserId();

    if (varietyApprovalNeeded) {
      await Notification.create({
        user: adminId,
        type: 'product_and_variety_approval_needed',
        title: 'New Product + Variety Pending',
        message: `${req.user.name} submitted "${product.name}" with new variety "${productData.newVarietySuggestion.name}"`,
        relatedProduct: product._id,
        priority: 'high',
      });
    } else {
      await Notification.create({
        user: adminId,
        type: 'product_approval_needed',
        title: 'New Product Pending Approval',
        message: `${req.user.name} submitted a new product: ${product.name}`,
        relatedProduct: product._id,
        priority: 'medium',
      });
    }

    const responseMessage = varietyApprovalNeeded
      ? 'Product created! Pending admin approval for both product and new variety.'
      : 'Product created successfully. Waiting for admin approval.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: product,
      varietyApprovalNeeded,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
    });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Owner only)
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    const updateData = { ...req.body };

    // Parse JSON strings with error handling
    try {
      if (typeof updateData.category === 'string') {
        updateData.category = JSON.parse(updateData.category);
      }
      if (typeof updateData.pricing === 'string') {
        updateData.pricing = JSON.parse(updateData.pricing);
      }
      if (typeof updateData.seasons === 'string') {
        updateData.seasons = JSON.parse(updateData.seasons);
      }
      if (typeof updateData.suitableFor === 'string') {
        updateData.suitableFor = JSON.parse(updateData.suitableFor);
      }
      if (typeof updateData.targetPests === 'string') {
        updateData.targetPests = JSON.parse(updateData.targetPests);
      }
      if (typeof updateData.pesticideDetails === 'string') {
        updateData.pesticideDetails = JSON.parse(updateData.pesticideDetails);
      }
      if (typeof updateData.fertilizerDetails === 'string') {
        updateData.fertilizerDetails = JSON.parse(updateData.fertilizerDetails);
      }
      if (typeof updateData.seedDetails === 'string') {
        updateData.seedDetails = JSON.parse(updateData.seedDetails);
      }
      if (typeof updateData.variants === 'string') {
        updateData.variants = JSON.parse(updateData.variants);
      }
      if (typeof updateData.applicationTips === 'string') {
        updateData.applicationTips = JSON.parse(updateData.applicationTips);
      }
      if (typeof updateData.faq === 'string') {
        updateData.faq = JSON.parse(updateData.faq);
      }
      if (typeof updateData.targetCrops === 'string') {
        updateData.targetCrops = JSON.parse(updateData.targetCrops);
      }
      if (typeof updateData.existingImages === 'string') {
        updateData.existingImages = JSON.parse(updateData.existingImages);
      }
    } catch (parseError) {
      console.error('JSON parsing error in updateProduct:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format for complex fields',
      });
    }

    let finalImages = updateData.existingImages || [];
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        uploadedAt: new Date()
      }));
      finalImages = [...finalImages, ...newImages];
    }
    updateData.images = finalImages;

    delete updateData.seller;
    delete updateData.approvalStatus;
    delete updateData.approvedBy;
    delete updateData.approvedAt;
    delete updateData.existingImages;

    Object.assign(product, updateData);

    // ✅ FIX: If a direct `stock` value was sent but no `variants` update,
    // the pre-save hook would overwrite stock by summing variant.stock values.
    // We redistribute the new total stock across variants so the hook sees the right total.
    if (updateData.stock !== undefined && !updateData.variants && product.variants && product.variants.length > 0) {
      const newTotalStock = parseInt(updateData.stock) || 0;
      const currentTotal = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

      if (currentTotal > 0) {
        // Distribute proportionally, rounding each variant down, then add remainder to first
        let distributed = 0;
        product.variants.forEach((variant, idx) => {
          const share = idx === product.variants.length - 1
            ? newTotalStock - distributed
            : Math.floor((variant.stock / currentTotal) * newTotalStock);
          variant.stock = share;
          distributed += share;
        });
      } else {
        // All variants had 0 stock — split evenly
        const perVariant = Math.floor(newTotalStock / product.variants.length);
        const remainder = newTotalStock - perVariant * product.variants.length;
        product.variants.forEach((variant, idx) => {
          variant.stock = perVariant + (idx === 0 ? remainder : 0);
        });
      }
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Owner only)
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product',
      });
    }

    product.isActive = false;
    await product.save();

    if (req.user.stats) {
      req.user.stats.productsListed -= 1;
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};

/**
 * @desc    Get seller's products
 * @route   GET /api/products/my-products
 * @access  Private (Retailer/Supplier)
 */
export const getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 500 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({ seller: req.user._id, isActive: true })
      .populate('category.main', 'name categoryType slug')
      .populate('category.sub', 'name slug')
      .populate('category.type', 'name slug')
      .populate('category.variety', 'name description')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({ seller: req.user._id, isActive: true });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your products',
      error: error.message,
    });
  }
};

/**
 * @desc    Get seasonal products
 * @route   GET /api/products/seasonal
 * @access  Public
 */
export const getSeasonalProducts = async (req, res) => {
  try {
    const currentSeason = getCurrentSeason();

    const products = await Product.find({
      seasons: currentSeason,
      approvalStatus: 'approved',
      isActive: true,
    })
      .populate('category.main', 'name categoryType slug')
      .populate('category.variety', 'name')
      .populate('seller', 'name businessDetails.businessName')
      .limit(20)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      season: currentSeason,
      data: products,
    });
  } catch (error) {
    console.error('Get seasonal products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seasonal products',
      error: error.message,
    });
  }
};

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ],
      approvalStatus: 'approved',
      isActive: true,
    })
      .populate('category.main', 'name categoryType slug')
      .populate('category.variety', 'name')
      .populate('seller', 'name')
      .limit(20);

    res.status(200).json({
      success: true,
      query: q,
      data: products,
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message,
    });
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getSeasonalProducts,
  searchProducts,
};