// backend/src/models/WholesaleInquiry.js - ENHANCED: Acceptance expiry, stock reservation, minimum quantity
import mongoose from "mongoose";

const wholesaleInquirySchema = new mongoose.Schema(
  {
    inquiryNumber: {
      type: String,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "quoted", "accepted", "rejected", "completed", "expired"],
      default: "pending",
    },

    // ✅ NEW: Acceptance expiry tracking
    acceptanceExpiresAt: {
      type: Date,
      default: null,
    },

    // ✅ NEW: Stock reservation tracking
    stockReserved: {
      type: Boolean,
      default: false,
    },

    reservedQuantity: {
      type: Number,
      default: 0,
    },

    // ✅ NEW: Structured selection details
    selectedVariants: [{
      variantId: mongoose.Schema.Types.ObjectId,
      size: String,
      quantity: Number,
      price: Number,
      subtotal: Number
    }],

    totalWeightKg: {
      type: Number,
      required: true,
      min: 0,
    },

    basePricePerKg: {
      type: Number,
    },

    // ✅ UPDATED: Minimum weight threshold from category
    minimumWeightThreshold: {
      type: Number,
      default: 1, // Default 1kg
    },

    // ✅ NEW: Rejection reason
    rejectionReason: {
      type: String,
      default: null,
    },

    supplierResponse: {
      quotedPrice: Number,
      message: String,
      respondedAt: Date,
      minimumBulkQuantity: Number, // ✅ NEW: Supplier can set custom minimum
    },

    customerResponse: {
      accepted: Boolean,
      message: String,
      respondedAt: Date,
    },

    // ✅ NEW: Delivery details for finalized orders
    deliveryAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✅ Virtual field to check if acceptance has expired
wholesaleInquirySchema.virtual('isExpired').get(function () {
  if (!this.acceptanceExpiresAt) return false;
  return new Date() > this.acceptanceExpiresAt;
});

// Generate inquiry number
wholesaleInquirySchema.pre("save", async function () {
  if (this.isNew && !this.inquiryNumber) {
    const count = await this.constructor.countDocuments();
    this.inquiryNumber = `WHL${Date.now()}${String(count + 1).padStart(4, "0")}`;
  }

  // ✅ NEW: Set acceptance expiry when supplier sends quote (48 hours)
  if (this.isModified('status') && this.status === 'quoted' && !this.acceptanceExpiresAt) {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 48); // 48 hours from now
    this.acceptanceExpiresAt = expiryDate;
  }
});

export default mongoose.model("WholesaleInquiry", wholesaleInquirySchema);