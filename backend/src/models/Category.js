// backend/src/models/Category.js - FIXED (slug not unique)
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    slug: {
      type: String,
      lowercase: true,
      // ✅ REMOVED unique: true to allow duplicates like "aloe-vera"
    },
    
    // ✅ HIERARCHICAL STRUCTURE
    level: {
      type: String,
      enum: ['main', 'sub', 'type'],
      required: true,
    },
    
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    
    // Main category type (for top-level categories)
    categoryType: {
      type: String,
      enum: [
        'seeds',
        'crop_protection', 
        'crop_nutrition', 
        'farming_tools',
        'plants', 
        'pots_planters',
        'animal_feed',
        'other'
      ],
    },
    
    description: {
      type: String,
    },
    
    // Applicable seasons
    seasons: [{
      type: String,
      enum: ["spring", "summer", "monsoon", "autumn", "winter", "all_season"],
    }],
    
    // Usage type
    usageType: [{
      type: String,
      enum: ["farming", "gardening", "both"],
    }],
    
    // Visual
    icon: String,
    image: {
      url: String,
      publicId: String,
    },
    
    // Metadata
    metadata: {
      requiresPesticideFields: {
        type: Boolean,
        default: false,
      },
      requiresFertilizerFields: {
        type: Boolean,
        default: false,
      },
      requiresSeedFields: {
        type: Boolean,
        default: false,
      },
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    displayOrder: {
      type: Number,
      default: 0,
    },
    
    productCount: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ AUTO-GENERATE SLUG
categorySchema.pre('save', function() {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

// ✅ INDEXES (removed slug unique index)
categorySchema.index({ level: 1, parent: 1 });
categorySchema.index({ categoryType: 1, isActive: 1 });
categorySchema.index({ parent: 1, displayOrder: 1 });
// ✅ Composite index for unique name within same parent
categorySchema.index({ name: 1, parent: 1 }, { unique: true });

// ✅ VIRTUAL: Get children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// ✅ STATIC METHOD: Get category tree (optimized with aggregation)
categorySchema.statics.getCategoryTree = async function() {
  try {
    // Use MongoDB aggregation pipeline to build the tree in a single query
    const pipeline = [
      {
        $match: { isActive: true }
      },
      {
        $sort: { displayOrder: 1 }
      },
      {
        $graphLookup: {
          from: 'categories',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'descendants',
          maxDepth: 2, // Limit depth to prevent infinite loops
          restrictSearchWithMatch: { isActive: true }
        }
      },
      {
        $addFields: {
          children: {
            $filter: {
              input: '$descendants',
              cond: { $eq: ['$$this.level', 'sub'] }
            }
          },
          types: {
            $filter: {
              input: '$descendants',
              cond: { $eq: ['$$this.level', 'type'] }
            }
          }
        }
      },
      {
        $match: { level: 'main' }
      },
      {
        $project: {
          descendants: 0 // Remove the descendants array from output
        }
      }
    ];

    const mainCategories = await this.aggregate(pipeline);

    // Build the hierarchical structure
    for (let main of mainCategories) {
      for (let sub of main.children || []) {
        sub.children = main.types?.filter(type => type.parent?.toString() === sub._id.toString()) || [];
      }
      main.children = main.children || [];
      delete main.types; // Remove the temporary types field
    }

    return mainCategories;
  } catch (error) {
    console.error('Error in getCategoryTree aggregation:', error);
    // Fallback to the original method if aggregation fails
    return this.getCategoryTreeFallback();
  }
};

// ✅ FALLBACK METHOD: Original implementation as backup
categorySchema.statics.getCategoryTreeFallback = async function() {
  const mainCategories = await this.find({ level: 'main', isActive: true })
    .sort('displayOrder')
    .lean();

  for (let main of mainCategories) {
    const subCategories = await this.find({ parent: main._id, isActive: true })
      .sort('displayOrder')
      .lean();

    for (let sub of subCategories) {
      const types = await this.find({ parent: sub._id, isActive: true })
        .sort('displayOrder')
        .lean();
      sub.children = types;
    }

    main.children = subCategories;
  }

  return mainCategories;
};

// ✅ STATIC METHOD: Get subcategories by parent
categorySchema.statics.getSubcategories = async function(parentId) {
  return await this.find({ parent: parentId, isActive: true })
    .sort('displayOrder')
    .lean();
};

export default mongoose.model("Category", categorySchema);