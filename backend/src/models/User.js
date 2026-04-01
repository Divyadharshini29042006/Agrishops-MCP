// backend/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password is required only if googleId is not present
      },
      select: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["admin", "customer", "retailer", "supplier"],
      required: true,
    },

    phone: {
      type: String,
      sparse: true,
    },

    profileImage: {
      url: String,
      publicId: String,
    },

    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    usageType: {
      type: String,
      enum: ["farming", "gardening", "both"],
    },

    businessDetails: {
      businessName: String,
      gstNumber: String,
      panNumber: String,
      contactPerson: String,
      businessAddress: String,
      businessPhone: String,
      businessEmail: String,
      businessType: {
        type: String,
        enum: ["sole_proprietorship", "partnership", "private_limited", "other"],
      },
      yearsInBusiness: Number,
      licenseNumber: String,
      licenseDocument: String,

      // ✅ NEW: Brand Logo Fields
      brandLogo: {
        url: String,           // Image URL (local or Cloudinary)
        publicId: String,      // For Cloudinary deletion (optional)
        uploadedAt: Date,
        filename: String       // Original filename
      },
      brandLogoStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
      },
      brandLogoRejectionReason: String,

      // Homepage display settings
      showOnHomepage: {
        type: Boolean,
        default: false
      },
      displayOrder: {
        type: Number,
        default: 0  // Higher number = higher priority
      }
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,
    rejectionReason: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    resetOTP: String,
    resetOTPExpiry: Date,

    preferences: {
      language: {
        type: String,
        enum: ["en", "hi", "ta", "te", "kn", "ml"],
        default: "en",
      },
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: true },
      },
    },

    stats: {
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      productsListed: { type: Number, default: 0 },
      productsSold: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
    },

    lastLogin: Date,
    lastActive: Date,
    deactivatedAt: Date,
    deactivationReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * PASSWORD HASHING AND AUTO-APPROVE
 */
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isNew) {
    if (this.role === "admin" || this.role === "customer") {
      this.isApproved = true;
      this.isActive = true;
    } else if (this.role === "retailer" || this.role === "supplier") {
      this.isApproved = false;
      this.isActive = true;
    }
  }
});

/**
 * MATCH PASSWORD METHOD
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * GET PUBLIC PROFILE
 */
userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    profileImage: this.profileImage,
    location: this.location,
    usageType: this.usageType,
    businessDetails: this.businessDetails,
    isApproved: this.isApproved,
    isActive: this.isActive,
    preferences: this.preferences,
    stats: this.stats,
    createdAt: this.createdAt,
  };
};

/**
 * INDEXES
 */
userSchema.index({ role: 1, isApproved: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'businessDetails.showOnHomepage': 1, 'businessDetails.displayOrder': -1 });

/**
 * VIRTUAL FIELDS
 */
userSchema.virtual('fullName').get(function () {
  return this.name;
});

userSchema.virtual('isSeller').get(function () {
  return this.role === 'retailer' || this.role === 'supplier';
});

export default mongoose.model("User", userSchema);