// backend/src/models/Product.js - WITH VARIANTS SUPPORT (Multiple sizes)
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sellerType: {
      type: String,
      enum: ['supplier', 'retailer'],
      required: true,
      default: 'retailer', // Fallback
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      main: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      sub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
      type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
      variety: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariety",
      }
    },

    newVarietySuggestion: {
      name: String,
      description: String,
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      varietyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariety",
      }
    },
    bulkOrder: {
      enabled: {
        type: Boolean,
        default: true,  // Enable bulk orders by default
      },
      minQuantity: {
        type: Number,
        default: 100,  // Minimum quantity to trigger bulk order (100 units)
      },
      bulkDiscount: {
        type: Number,
        default: 10,  // 10% discount for bulk orders
        min: 0,
        max: 100,
      },
    },
    bulkMinQuantity: {
      type: Number,
      default: 100, // Default to 100 units for wholesale
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ PRICING (Base pricing for default variant)
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },

      hasOffer: {
        type: Boolean,
        default: false,
      },

      offerType: {
        type: String,
        enum: ['percentage', 'fixed', 'none'],
        default: 'none',
      },

      offerValue: {
        type: Number,
        min: 0,
        default: 0,
      },

      offerStartDate: {
        type: Date,
      },

      offerEndDate: {
        type: Date,
      },

      finalPrice: {
        type: Number,
        required: true,
      },

      discount: {
        type: Number,
        default: 0,
      }
    },

    // ✅ NEW: VARIANTS ARRAY (For different sizes with different prices)
    variants: [{
      size: {
        type: String,
        required: true,
        // Examples: "10 gm", "25 gm", "50 gm", "100 gm", "250 ml", "500 ml", "1 kg"
      },
      quantity: {
        type: Number,
        required: true,
        // Examples: 10, 25, 50, 100, 250, 500, 1
      },
      unit: {
        type: String,
        required: true,
        enum: ["gm", "kg", "ml", "liter", "piece", "packet"],
        // Examples: "gm", "ml", "kg", "liter"
      },
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      offerPrice: {
        type: Number,
        min: 0,
      },
      finalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      sku: String,
      isDefault: {
        type: Boolean,
        default: false,
      }
    }],

    // ✅ DEFAULT UNIT (Fallback if no variants)
    unit: {
      type: String,
      required: true,
      enum: ["kg", "gm", "gram", "liter", "ml", "piece", "packet", "bottle", "bag", "quintal", "ton"],
      default: "piece",
    },

    // ✅ TOTAL STOCK (Sum of all variant stocks)
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 10,
    },

    images: [{
      url: {
        type: String,
        required: true,
      },
      publicId: String,
      filename: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      }
    }],

    hasExpiry: {
      type: Boolean,
      default: false,
    },

    expiryDate: {
      type: Date,
    },

    seasons: [{
      type: String,
      enum: ["spring", "summer", "monsoon", "autumn", "winter", "all_season"],
    }],

    suitableFor: [{
      type: String,
    }],

    targetPests: [{
      type: String,
    }],

    usageType: {
      type: String,
      enum: ["farming", "gardening", "both"],
      required: true,
    },

    pesticideDetails: {
      pesticideType: {
        type: String,
        enum: ['chemical', 'bio', 'none'],
        default: 'none',
      },
      category: {
        type: String,
        enum: ['insecticide', 'fungicide', 'herbicide', 'bio_insecticide', 'bio_fungicide', 'none'],
        default: 'none',
      },
      activeIngredient: String, // Technical Content
      technicalContent: String, // Explicitly named for UI
      concentration: String,
      formulationType: String, // Liquid / Powder / SL / EC etc.
      modeOfAction: String, // Systemic / Contact / Stomach
      controls: [String], // Pests controlled
      safetyClass: {
        type: String,
        enum: ['class_1', 'class_2', 'class_3', 'class_4', 'not_applicable'],
        default: 'not_applicable',
      },
      dosagePerAcre: {
        min: Number,
        max: Number,
        recommended: Number,
        unit: String,
      },
      applicationMethod: {
          type: String,
          // enum: ['foliar_spray', 'soil_drench', 'seed_treatment', 'fumigation', 'baiting', 'other'],
      },
      applicationMethods: [String], // Multiple methods support
      waitingPeriod: Number,
      protectiveEquipment: [String],
      precautions: [String],
    },

    fertilizerDetails: {
      fertilizerType: {
        type: String,
        enum: ['organic', 'chemical', 'bio', 'none'],
        default: 'none',
      },
      npkRatio: {
        nitrogen: Number,
        phosphorus: Number,
        potassium: Number,
      },
      micronutrients: [String],
      applicationMethod: String,
      dosageRecommendation: String,
    },

    seedDetails: {
      seedType: {
        type: String,
        enum: ['vegetable', 'fruit', 'flower', 'grain', 'none'],
        default: 'none',
      },
      variety: String,
      germinationRate: Number,
      sowingDepth: String,
      plantSpacing: String,
      harvestTime: String,
      hybrid: Boolean,
    },

    safetyInstructions: {
      dosage: String,
      applicationMethod: String,
      precautions: [String],
      toxicityLevel: {
        type: String,
        enum: ["low", "medium", "high", "not_applicable"],
        default: "not_applicable",
      },
      waitingPeriod: String,
    },

    // ✅ New Professional Sections
    applicationTips: [String],
    faq: [{
      question: String,
      answer: String,
    }],
    disclaimer: {
        type: String,
        default: "The information provided here is for reference only. Always read and follow the label instructions before using the product."
    },

    targetCrops: [String], // Linked to suitableFor but explicitly named for UI

    brand: String,
    manufacturer: String,
    composition: String,

    organicCertified: {
      type: Boolean,
      default: false,
    },

    certifications: [String],

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvalNotes: {
      productApproval: String,
      varietyApproval: String,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    rejectionReason: String,

    views: {
      type: Number,
      default: 0,
    },

    soldQuantity: {
      type: Number,
      default: 0,
    },

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Pre-save hook: Calculate final price and update variant prices
productSchema.pre('save', async function () {
  const pricing = this.pricing;
  const now = new Date();

  // 1. Determine if global offer is active
  const offerEndDatePlusOne = pricing.offerEndDate ? new Date(pricing.offerEndDate) : null;
  if (offerEndDatePlusOne) offerEndDatePlusOne.setHours(23, 59, 59, 999);

  const offerActive = pricing.hasOffer && pricing.offerType !== 'none' &&
    (!pricing.offerStartDate || now >= pricing.offerStartDate) &&
    (!pricing.offerEndDate || now <= offerEndDatePlusOne);

  // 2. Calculate main pricing
  if (offerActive) {
    if (pricing.offerType === 'percentage') {
      const discountAmount = (pricing.basePrice * pricing.offerValue) / 100;
      pricing.finalPrice = pricing.basePrice - discountAmount;
      pricing.discount = pricing.offerValue;
    } else if (pricing.offerType === 'fixed') {
      pricing.finalPrice = Math.max(0, pricing.basePrice - pricing.offerValue);
      pricing.discount = pricing.offerValue;
    }
  } else {
    this.pricing.finalPrice = this.pricing.basePrice;
    this.pricing.discount = 0;
  }

  // 3. ✅ Calculate variant prices
  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.variants.forEach(variant => {
      // If variant has an offerPrice and global offer is active, use it
      if (offerActive && variant.offerPrice > 0) {
        variant.finalPrice = variant.offerPrice;
      } else {
        // Otherwise revert to basePrice
        variant.finalPrice = variant.basePrice;
      }

      if (variant.basePrice > 0) {
        const variantDiscount = ((variant.basePrice - variant.finalPrice) / variant.basePrice) * 100;
        variant.discountPercentage = Math.round(variantDiscount);
      }
    });

    // 4. ✅ Sync main pricing with default variant if it exists
    const defaultVariant = this.variants.find(v => v.isDefault) || this.variants[0];
    if (defaultVariant) {
      this.pricing.basePrice = defaultVariant.basePrice;
      this.pricing.finalPrice = defaultVariant.finalPrice;
      this.pricing.discount = defaultVariant.discountPercentage;
      this.unit = defaultVariant.unit;
    }

    // 5. ✅ Calculate total stock from variants
    this.stock = this.variants.reduce((total, variant) => total + variant.stock, 0);
  }
});

// Indexes
productSchema.index({ seller: 1, approvalStatus: 1 });
productSchema.index({ 'category.main': 1, approvalStatus: 1, isActive: 1 });
productSchema.index({ 'category.sub': 1, approvalStatus: 1, isActive: 1 });
productSchema.index({ 'category.type': 1, approvalStatus: 1, isActive: 1 });
productSchema.index({ 'category.type': 1, 'category.variety': 1, approvalStatus: 1 });
productSchema.index({ 'newVarietySuggestion.status': 1 });
productSchema.index({ name: "text", description: "text" });

// Virtuals
productSchema.virtual("isExpired").get(function () {
  if (!this.hasExpiry || !this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

productSchema.virtual('variantStockStatus').get(function () {
  const sellerType = this.sellerType; // 'supplier' or 'retailer'

  if (!this.variants || this.variants.length === 0) return [];

  return this.variants.map(variant => {
    // Thresholds based on seller type
    let lowThreshold, criticalThreshold;

    if (sellerType === 'supplier') {
      lowThreshold = 25;      // below 25 bags = low
      criticalThreshold = 10; // below 10 bags = critical
    } else {
      lowThreshold = 50;      // below 50 packets = low
      criticalThreshold = 20; // below 20 packets = critical
    }

    return {
      size: variant.size,
      stock: variant.stock,
      unit: variant.unit,
      isLow: variant.stock < lowThreshold,
      isCritical: variant.stock < criticalThreshold,
      status: variant.stock < criticalThreshold ? 'critical' : (variant.stock < lowThreshold ? 'low' : 'normal'),
      lowThreshold,
      criticalThreshold
    };
  });
});

productSchema.virtual('isLowStock').get(function () {
  const status = this.variantStockStatus;
  return status.length > 0 ? status.some(v => v.isLow) : false;
});

productSchema.virtual('isCriticalStock').get(function () {
  const status = this.variantStockStatus;
  return status.length > 0 ? status.some(v => v.isCritical) : false;
});

productSchema.virtual('stockSummary').get(function () {
  const status = this.variantStockStatus;
  if (status.length === 0) return "No variants defined";

  const criticalCount = status.filter(v => v.isCritical).length;
  const lowCount = status.filter(v => v.isLow).length;

  if (criticalCount > 0) return `${criticalCount} variant(s) critically low!`;
  if (lowCount > 0) return `${lowCount} variant(s) running low`;
  return "All variants in stock";
});

productSchema.virtual("isOfferActive").get(function () {
  if (!this.pricing.hasOffer) return false;
  const now = new Date();
  const startValid = !this.pricing.offerStartDate || now >= this.pricing.offerStartDate;

  const endDate = this.pricing.offerEndDate ? new Date(this.pricing.offerEndDate) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  const endValid = !this.pricing.offerEndDate || now <= endDate;
  return startValid && endValid;
});

productSchema.virtual("hasPendingVariety").get(function () {
  return this.newVarietySuggestion?.status === 'pending';
});

// Methods
productSchema.methods.updateStock = async function (quantity) {
  this.stock += quantity;
  if (this.stock < 0) this.stock = 0;
  await this.save();
};

productSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

// ✅ NEW: Get default variant
productSchema.methods.getDefaultVariant = function () {
  if (!this.variants || this.variants.length === 0) return null;

  // Return the variant marked as default
  const defaultVariant = this.variants.find(v => v.isDefault);
  if (defaultVariant) return defaultVariant;

  // Otherwise return first variant
  return this.variants[0];
};

export default mongoose.model("Product", productSchema);