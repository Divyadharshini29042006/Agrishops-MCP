// backend/src/models/ProductVariety.js - NEW MODEL FOR VARIETIES
import mongoose from "mongoose";

const productVarietySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    slug: {
      type: String,
      lowercase: true,
    },
    
    // Which product type does this variety belong to?
    productType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    
    // Full category hierarchy for easy filtering
    categoryHierarchy: {
      main: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
      sub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
      type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      }
    },
    
    // Who suggested this variety?
    suggestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Description (optional)
    description: {
      type: String,
    },
    
    // Approval workflow
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    approvedAt: Date,
    
    rejectionReason: String,
    
    // Additional metadata
    commonNames: [String], // e.g., ["Cherry Tomato", "Cherry Tom"]
    
    scientificName: String, // e.g., "Solanum lycopersicum var. cerasiforme"
    
    characteristics: {
      color: String,
      size: String,
      shape: String,
      taste: String,
      other: String,
    },
    
    // Usage statistics
    productCount: {
      type: Number,
      default: 0,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
    displayOrder: {
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

// Auto-generate slug
productVarietySchema.pre('save', function() {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

// Indexes
productVarietySchema.index({ productType: 1, approvalStatus: 1, isActive: 1 });
productVarietySchema.index({ 'categoryHierarchy.type': 1, approvalStatus: 1 });
productVarietySchema.index({ slug: 1 });
productVarietySchema.index({ suggestedBy: 1, approvalStatus: 1 });

// Unique constraint: Same variety name cannot exist twice for same product type (approved varieties only)
productVarietySchema.index(
  { name: 1, productType: 1, approvalStatus: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { approvalStatus: 'approved' }
  }
);

// Virtual: Check if this is a new suggestion
productVarietySchema.virtual('isNewSuggestion').get(function() {
  return this.approvalStatus === 'pending';
});

// Static method: Get approved varieties for a product type
productVarietySchema.statics.getApprovedVarieties = async function(productTypeId) {
  return await this.find({
    productType: productTypeId,
    approvalStatus: 'approved',
    isActive: true,
  })
    .sort('displayOrder name')
    .lean();
};

// Static method: Check if variety already exists (approved)
productVarietySchema.statics.varietyExists = async function(name, productTypeId) {
  const existing = await this.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    productType: productTypeId,
    approvalStatus: 'approved',
    isActive: true,
  });
  
  return !!existing;
};

export default mongoose.model("ProductVariety", productVarietySchema);