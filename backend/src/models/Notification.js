// backend/src/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "order_placed",
        "order_confirmed",
        "order_processing",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "product_approved",
        "product_rejected",
        "product_approval_needed",
        "product_and_variety_approval_needed",
        "variety_approval_needed",
        "variety_approved",
        "variety_rejected",
        "low_stock",
        "product_expired",
        "product_expiring_soon",
        "user_approved",
        "user_rejected",
        "account_approved",
        "account_activated",
        "account_deactivated",
        "user_approval_needed",
        "wholesale_inquiry_received",
        "wholesale_inquiry_response",
        "payment_received",
        "brand_logo_approved",
        "system_alert",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Related entities
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    relatedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    relatedInquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WholesaleInquiry",
    },

    // Notification state
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Action link
    actionUrl: String, // URL to navigate to

    actionText: String, // e.g., "View Order", "View Product"

    // Delivery
    deliveryMethod: {
      type: String,
      enum: ["in_app", "email", "sms", "all"],
      default: "in_app",
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    smsSent: {
      type: Boolean,
      default: false,
    },

    // Expiry
    expiresAt: Date,

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

// Mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  return this.create(data);
};

// Static method to mark multiple as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

export default mongoose.model("Notification", notificationSchema);