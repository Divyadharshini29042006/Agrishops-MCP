// backend/src/models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Who receives the review (Retailer or Supplier)
    targetType: {
      type: String,
      enum: ["retailer", "supplier"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews for the same order
reviewSchema.index({ userId: 1, orderId: 1 }, { unique: true });

// Index for fetching reviews by target
reviewSchema.index({ targetId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
