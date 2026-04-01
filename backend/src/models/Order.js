// backend/src/models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  
  productName: String, // Store name in case product is deleted
  
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  
  price: {
    type: Number,
    required: true,
  },
  
  subtotal: {
    type: Number,
    required: true,
  },
  
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: false,
      unique: true,
    },
    
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    items: [orderItemSchema],
    
    // Delivery information
    deliveryAddress: {
      fullName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      landmark: String,
    },
    
    // Order type
    orderType: {
      type: String,
      enum: ["retail", "wholesale"],
      default: "retail",
    },
    
    // Order status
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    
    statusHistory: [{
      status: String,
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      note: String,
    }],
    
    // Payment information
    paymentMethod: {
      type: String,
      enum: ["cod", "online", "upi"],
      required: true,
      default: "cod",
    },
    
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    
    paymentDetails: {
      transactionId: String,
      paymentGateway: String,
      paidAt: Date,
    },
    
    // Pricing
    subtotal: {
      type: Number,
      required: true,
    },
    
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    
    tax: {
      type: Number,
      default: 0,
    },
    
    discount: {
      type: Number,
      default: 0,
    },
    
    totalAmount: {
      type: Number,
      required: true,
    },
    
    // Tracking
    trackingNumber: String,
    
    shippedAt: Date,
    
    deliveredAt: Date,
    
    estimatedDelivery: Date,
    
    // Cancellation
    cancelledAt: Date,
    
    cancellationReason: String,
    
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Additional notes
    customerNote: String,
    
    sellerNote: String,
    
    // Invoice
    invoiceNumber: String,
    
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    
    isRated: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true,
  }
);

// Generate order number
orderSchema.pre("validate", async function(next) {
  console.log('📝 Generating order number...');
  try {
    if (!this.orderNumber) {
      const count = await mongoose.model("Order").countDocuments();
      this.orderNumber = `ORD${Date.now()}${String(count + 1).padStart(4, "0")}`;
    }

    // Add to status history when status changes
    if (this.isModified("status")) {
      this.statusHistory.push({
        status: this.status,
        updatedAt: new Date(),
        updatedBy: this.seller, // Will be updated by controller
      });
    }

    // Call next() only if it's a function (for individual saves)
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    // Call next() with error if it's a function
    if (typeof next === 'function') {
      next(error);
    } else {
      throw error;
    }
  }
});

// Index for faster queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });

export default mongoose.model("Order", orderSchema);