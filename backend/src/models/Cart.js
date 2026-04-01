// backend/src/models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  
  price: {
    type: Number,
    required: true,
  },
  
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    
    items: [cartItemSchema],
    
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Calculate total
cartSchema.virtual("total").get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Calculate total items count
cartSchema.virtual("itemCount").get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// lastUpdated is automatically set by default: Date.now

export default mongoose.model("Cart", cartSchema);