// backend/src/controllers/wholesaleController.js - ENHANCED
import WholesaleInquiry from '../models/WholesaleInquiry.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order.js';
import sendEmail from '../services/emailService.js';
import {
  wholesaleInquiryReceivedTemplate,
  wholesaleQuoteReceivedTemplate,
  wholesaleQuoteAcceptedTemplate,
  wholesaleQuoteRejectedTemplate,
  wholesaleInquiryRejectedTemplate,
} from '../utils/emailTemplates.js';



// Create wholesale inquiry - ENHANCED for Weight Threshold
export const createWholesaleInquiry = async (req, res) => {
  try {
    const { productId, quantity, message, selectedVariants, totalWeightKg, basePricePerKg } = req.body;
    console.log('📝 Creating inquiry:', { productId, totalWeightKg, customerId: req.user._id });

    const product = await Product.findById(productId).populate('seller category.main');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Determine weight threshold based on category
    const categoryType = product.category.main?.categoryType || 'other';
    const thresholdKg = categoryType === 'seeds' ? 1 : 5;

    // Validate weight threshold
    if (!totalWeightKg || totalWeightKg < thresholdKg) {
      console.log('❌ Weight too low:', totalWeightKg);
      return res.status(400).json({
        success: false,
        message: `Total weight must be at least ${thresholdKg}kg for bulk inquiries.`
      });
    }

    if (product.seller.role !== 'supplier') {
      console.log('❌ Seller is not supplier:', product.seller.role);
      return res.status(400).json({ success: false, message: 'Product seller is not a supplier' });
    }

    // Check for existing pending inquiry for same product
    console.log('🔍 Checking for existing inquiry...');
    const existingInquiry = await WholesaleInquiry.findOne({
      customer: req.user._id,
      product: productId,
      status: { $in: ['pending', 'quoted'] }
    });

    console.log('🔍 Existing inquiry result:', existingInquiry ? 'FOUND' : 'NOT FOUND');

    if (existingInquiry) {
      console.log('❌ Duplicate inquiry detected:', existingInquiry._id);
      return res.status(400).json({
        success: false,
        message: 'You already have a pending inquiry for this product'
      });
    }


    // Create inquiry
    const inquiry = new WholesaleInquiry({
      customer: req.user._id,
      supplier: product.seller._id,
      product: productId,
      quantity, // Still store total quantity for reference
      message,
      selectedVariants, // Array of { variantId, size, quantity, price, subtotal }
      totalWeightKg,
      basePricePerKg,
      minimumWeightThreshold: thresholdKg,
    });

    await inquiry.save();

    // Create notification
    await Notification.create({
      user: product.seller._id,
      type: 'wholesale_inquiry_received',
      title: 'New Bulk Order Inquiry',
      message: `${req.user.name} wants to order ${quantity} ${product.unit} of ${product.name}`,
      relatedInquiry: inquiry._id,
      priority: 'high',
    });

    // Send email to supplier
    try {
      const emailTemplate = wholesaleInquiryReceivedTemplate(
        product.seller.name,
        req.user.name,
        product.name,
        quantity,
        product.unit,
        message,
        inquiry.inquiryNumber
      );
      await sendEmail(product.seller.email, emailTemplate.subject, emailTemplate.html);
    } catch (emailError) {
      console.error('Failed to send inquiry email:', emailError);
    }

    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get customer inquiries
export const getMyInquiries = async (req, res) => {
  try {
    const inquiries = await WholesaleInquiry.find({ customer: req.user._id })
      .populate('product', 'name images unit')
      .populate('supplier', 'name businessDetails')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get supplier inquiries
export const getSupplierInquiries = async (req, res) => {
  try {
    const inquiries = await WholesaleInquiry.find({ supplier: req.user._id })
      .populate('product', 'name images unit')
      .populate('customer', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supplier responds with quote - ENHANCED
export const respondToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { quotedPrice, message, minimumBulkQuantity } = req.body;

    const inquiry = await WholesaleInquiry.findOne({ _id: id, supplier: req.user._id })
      .populate('product')
      .populate('customer');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (inquiry.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Inquiry already responded to' });
    }

    // Validate minimum bulk quantity - default to 0 if we use weight validation
    const minQty = minimumBulkQuantity !== undefined ? parseInt(minimumBulkQuantity) : (inquiry.quantity || 1);
    
    // Skip unit-count validation if we are using weight-based validation
    if (!inquiry.totalWeightKg && inquiry.quantity < minQty) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity is below minimum bulk quantity of ${minQty}`
      });
    }

    // Check stock availability
    if (inquiry.product.stock < inquiry.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock to fulfill this order'
      });
    }

    // Update inquiry
    inquiry.status = 'quoted';
    inquiry.supplierResponse = {
      quotedPrice,
      message,
      respondedAt: new Date(),
      minimumBulkQuantity: minQty,
    };
    inquiry.minimumBulkQuantity = minQty;
    inquiry.stockReserved = true;
    inquiry.reservedQuantity = inquiry.quantity;

    await inquiry.save(); // Pre-save hook will set acceptanceExpiresAt

    // Reserve stock in product
    inquiry.product.stock -= inquiry.quantity;
    await inquiry.product.save();

    // Create notification
    await Notification.create({
      user: inquiry.customer._id,
      type: 'wholesale_inquiry_response',
      title: 'Quote Received',
      message: `Supplier quoted ₹${quotedPrice} for your bulk order`,
      relatedInquiry: inquiry._id,
      priority: 'high',
    });

    // Send email to customer
    try {
      const emailTemplate = wholesaleQuoteReceivedTemplate(
        inquiry.customer.name,
        req.user.name,
        inquiry.product.name,
        inquiry.quantity,
        inquiry.product.unit,
        quotedPrice,
        message,
        inquiry.inquiryNumber,
        inquiry.acceptanceExpiresAt,
        inquiry.selectedVariants
      );
      await sendEmail(inquiry.customer.email, emailTemplate.subject, emailTemplate.html);
    } catch (emailError) {
      console.error('Failed to send quote email:', emailError);
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supplier rejects inquiry - NEW
export const rejectInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const inquiry = await WholesaleInquiry.findOne({ _id: id, supplier: req.user._id })
      .populate('product')
      .populate('customer');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (inquiry.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Inquiry already responded to' });
    }

    inquiry.status = 'rejected';
    inquiry.rejectionReason = rejectionReason || 'Supplier declined the inquiry';
    await inquiry.save();

    // Create notification
    await Notification.create({
      user: inquiry.customer._id,
      type: 'wholesale_inquiry_rejected',
      title: 'Bulk Order Inquiry Declined',
      message: `Supplier declined your bulk order inquiry`,
      relatedInquiry: inquiry._id,
      priority: 'high',
    });

    // Send email to customer
    try {
      const emailTemplate = wholesaleInquiryRejectedTemplate(
        inquiry.customer.name,
        req.user.name,
        inquiry.product.name,
        inquiry.quantity,
        inquiry.product.unit,
        inquiry.rejectionReason,
        inquiry.inquiryNumber
      );
      await sendEmail(inquiry.customer.email, emailTemplate.subject, emailTemplate.html);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer accepts/rejects quote - ENHANCED
export const respondToQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { accepted, message } = req.body;

    const inquiry = await WholesaleInquiry.findOne({ _id: id, customer: req.user._id })
      .populate('product')
      .populate('supplier');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (inquiry.status !== 'quoted') {
      return res.status(400).json({ success: false, message: 'No quote available to respond to' });
    }

    // Check if acceptance has expired
    if (inquiry.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Quote has expired. Please submit a new inquiry.'
      });
    }

    inquiry.status = accepted ? 'accepted' : 'rejected';
    inquiry.customerResponse = {
      accepted,
      message: message || (accepted ? 'I accept this quote' : 'I decline this quote'),
      respondedAt: new Date(),
    };

    // If rejected, release reserved stock
    if (!accepted && inquiry.stockReserved) {
      inquiry.product.stock += inquiry.reservedQuantity;
      await inquiry.product.save();
      inquiry.stockReserved = false;
      inquiry.reservedQuantity = 0;
    }

    await inquiry.save();

    // Send appropriate email
    try {
      if (accepted) {
        const emailTemplate = wholesaleQuoteAcceptedTemplate(
          inquiry.supplier.name,
          req.user.name,
          req.user.email,
          req.user.phone,
          inquiry.product.name,
          inquiry.quantity,
          inquiry.product.unit,
          inquiry.supplierResponse.quotedPrice,
          inquiry.inquiryNumber
        );
        await sendEmail(inquiry.supplier.email, emailTemplate.subject, emailTemplate.html);
      } else {
        const emailTemplate = wholesaleQuoteRejectedTemplate(
          inquiry.supplier.name,
          req.user.name,
          inquiry.product.name,
          inquiry.quantity,
          inquiry.product.unit,
          inquiry.inquiryNumber
        );
        await sendEmail(inquiry.supplier.email, emailTemplate.subject, emailTemplate.html);
      }
    } catch (emailError) {
      console.error('Failed to send response email:', emailError);
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate acceptance before payment - NEW
export const validateAcceptance = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await WholesaleInquiry.findOne({ _id: id, customer: req.user._id })
      .populate('product')
      .populate('supplier');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const validationErrors = [];
    const validationWarnings = [];

    // Check status
    if (inquiry.status !== 'accepted' && inquiry.status !== 'completed') {
      validationErrors.push('Inquiry is not in accepted status');
    }

    // Check expiry
    if (inquiry.isExpired) {
      validationErrors.push('Acceptance has expired');
    }

    // Check product availability
    if (!inquiry.product || !inquiry.product.isActive) {
      validationErrors.push('Product is no longer available');
    }

    // Check supplier availability
    if (!inquiry.supplier || !inquiry.supplier.isActive || !inquiry.supplier.isApproved) {
      validationErrors.push('Supplier is no longer available');
    }

    // Auto-calculate weight if missing (for legacy records)
    if ((!inquiry.totalWeightKg || inquiry.totalWeightKg === 0) && inquiry.selectedVariants && inquiry.selectedVariants.length > 0) {
      // Since weightInGrams is not in selectedVariants, we take it from totalWeightKg if available
      // If still missing, we trust the inquiry's requested weight from the message or a default
      inquiry.totalWeightKg = inquiry.selectedVariants.reduce((sum, v) => sum + (v.subtotal / (v.price || 1) * 1), 0); // fallback
    }

    // Check quantity rules (Weight based)
    if (inquiry.totalWeightKg < inquiry.minimumWeightThreshold) {
      const msg = `Total weight (${inquiry.totalWeightKg}kg) is below minimum bulk requirement (${inquiry.minimumWeightThreshold}kg)`;
      
      // If already accepted, make it a warning. If pending/quoted, it's a blocker.
      if (inquiry.status === 'accepted') {
        validationWarnings.push(msg);
      } else {
        validationErrors.push(msg);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validationErrors,
        warnings: validationWarnings
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      warnings: validationWarnings,
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal Helper: Deduct stock for bulk orders - NEW
const deductStockForBulkOrder = async (inquiryId, customerId) => {
  const inquiry = await WholesaleInquiry.findOne({ _id: inquiryId, customer: customerId })
    .populate('product');

  if (!inquiry) throw new Error('Inquiry not found');

  const product = await Product.findById(inquiry.product._id);
  if (!product) throw new Error('Product not found');

  // Deduct stock from specific variants
  for (const variantSelection of inquiry.selectedVariants) {
    const dbVariant = product.variants.id(variantSelection.variantId);
    if (dbVariant) {
      if (dbVariant.stock < variantSelection.quantity) {
        throw new Error(`Insufficient stock for variant ${dbVariant.size}. Available: ${dbVariant.stock}`);
      }
      dbVariant.stock -= variantSelection.quantity;
    }
  }

  // Update main product stock sum
  product.stock = product.variants.reduce((total, v) => total + (v.stock || 0), 0);
  product.soldQuantity = (product.soldQuantity || 0) + inquiry.quantity;
  
  await product.save();
  return { product, inquiry };
};

// Verify payment and complete bulk order - NEW
export const verifyWholesalePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      deliveryAddress 
    } = req.body;

    // 1. Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // 2. Fetch inquiry
    const inquiry = await WholesaleInquiry.findOne({ _id: id, customer: req.user._id })
      .populate('product')
      .populate('supplier');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (inquiry.status !== 'accepted') {
       return res.status(400).json({ success: false, message: 'Inquiry must be in accepted status' });
    }

    // 3. Deduct stock using helper
    try {
      await deductStockForBulkOrder(id, req.user._id);
    } catch (stockError) {
      return res.status(400).json({ success: false, message: stockError.message });
    }

    // 4. Create actual Order record for tracking
    const newOrder = await Order.create({
      customer: req.user._id,
      seller: inquiry.supplier._id,
      items: [{
        product: inquiry.product._id,
        productName: inquiry.product.name,
        quantity: inquiry.quantity,
        price: inquiry.supplierResponse.quotedPrice / inquiry.quantity,
        subtotal: inquiry.supplierResponse.quotedPrice,
        seller: inquiry.supplier._id
      }],
      deliveryAddress,
      orderType: 'wholesale',
      paymentMethod: 'online',
      paymentStatus: 'completed',
      paymentDetails: {
        transactionId: razorpay_payment_id,
        paymentGateway: 'razorpay',
        paidAt: new Date()
      },
      subtotal: inquiry.supplierResponse.quotedPrice,
      tax: 0, // GST & Delivery already included in the quoted price
      totalAmount: inquiry.supplierResponse.quotedPrice,
      status: 'confirmed'
    });

    // 5. Finalize Inquiry
    inquiry.status = 'completed';
    inquiry.deliveryAddress = deliveryAddress;
    await inquiry.save();

    // 6. Notify Supplier
    await Notification.create({
      user: inquiry.supplier._id,
      type: 'order_placed',
      title: 'Bulk Order Payment Received',
      message: `Payment received for inquiry ${inquiry.inquiryNumber}. Please proceed with fulfillment.`,
      relatedOrder: newOrder._id,
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and order finalized',
      data: newOrder
    });

  } catch (error) {
    console.error('Wholesale payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy completion (kept for internal testing) - NEW
export const completeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deduct stock first
    await deductStockForBulkOrder(id, req.user._id);

    const inquiry = await WholesaleInquiry.findOne({ _id: id, customer: req.user._id });
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    
    inquiry.status = 'completed';
    await inquiry.save();
    
    res.status(200).json({ success: true, message: 'Order completed and stock deducted (Simulation)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Compare suppliers for bulk orders
 * @route   GET /api/wholesale/compare/:productId
 * @access  Public
 */
export const compareSuppliers = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, variantId } = req.query;

    if (!quantity || !variantId) {
      return res.status(400).json({ success: false, message: 'Quantity and variantId are required' });
    }

    // 1. Get the reference product and variant
    const product = await Product.findById(productId).populate('category.main');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    // 2. Calculate total weight in grams
    let variantWeight = variant.quantity; // e.g., 100
    if (variant.unit === 'kg' || variant.unit === 'liter') variantWeight *= 1000;
    
    const totalWeightGrams = variantWeight * parseInt(quantity);
    const categoryType = product.category.main?.categoryType || 'other';
    
    // 3. Determine bulk status based on thresholds
    let threshold = 5000; // Default 5kg
    if (categoryType === 'seeds') threshold = 1000; // 1kg
    
    const isBulk = totalWeightGrams >= threshold;

    // 4. Find all suppliers for the same product variety/name
    const firstWord = product.name.split(' ')[0];
    const searchByName = new RegExp(`^${product.name}$`, 'i');
    const searchByFirstWord = new RegExp(`^${firstWord}`, 'i');
    
    // Build query dynamically to avoid "NONE" ObjectId casting error
    const filterOr = [
      { name: { $regex: searchByName } },
      { name: { $regex: searchByFirstWord } }
    ];

    // ✅ SAFE CHECK: Only add variety if it's a valid ObjectId
    const varietyId = product.category?.variety;
    if (varietyId && mongoose.Types.ObjectId.isValid(varietyId.toString())) {
      filterOr.push({ 'category.variety': varietyId });
    }

    const supplierProducts = await Product.find({
      sellerType: 'supplier',
      approvalStatus: 'approved',
      isActive: true,
      _id: { $ne: productId }, // Exclude the current product if needed? No, wait, if current product is supplier, we should include it.
      $or: filterOr
    }).populate('seller', 'name businessDetails businessName');


    // 5. Normalize and compare
    const suppliers = supplierProducts.map(sp => {
      // Find variants and calculate pricePerKg
      const variantsWithPricePerKg = sp.variants.map(v => {
        let vWeight = v.quantity;
        if (['kg', 'liter', 'packet', 'bag'].includes(v.unit.toLowerCase()) && vWeight < 100) {
            // If unit is kg/liter/bag and quantity is small, it's already in KG equivalent
            // Actually, usually 1 unit = 1kg if it's a bag
            vWeight *= 1000; 
        }
        
        // Final normalization logic
        const weightInGrams = (v.unit === 'gm' || v.unit === 'ml') ? v.quantity : v.quantity * 1000;
        const pricePerKg = (v.finalPrice / weightInGrams) * 1000;
        
        return { 
          ...v.toObject(), 
          pricePerKg,
          weightInGrams 
        };
      });

      // Sort variants by pricePerKg ascending
      const sortedByPrice = [...variantsWithPricePerKg].sort((a, b) => a.pricePerKg - b.pricePerKg);
      const bestVariant = sortedByPrice[0];
      
      // Calculate Recommended Combination for this supplier
      // Sort variants by size descending for greedy selection
      const sortedBySize = [...variantsWithPricePerKg].sort((a, b) => b.weightInGrams - a.weightInGrams);

      let remainingWeight = totalWeightGrams;
      const combination = [];
      let totalCost = 0;

      for (const v of sortedBySize) {
        if (v.weightInGrams > 0) {
          const count = Math.floor(remainingWeight / v.weightInGrams);
          if (count > 0) {
            combination.push({
              size: v.size,
              quantity: count,
              price: v.finalPrice,
              subtotal: count * v.finalPrice
            });
            remainingWeight -= count * v.weightInGrams;
            totalCost += count * v.finalPrice;
          }
        }
      }

      // If weight remains, add one more of the smallest/cheapest to cover it
      if (remainingWeight > 0) {
        const smallestVariant = sortedBySize[sortedBySize.length - 1];
        combination.push({
          size: smallestVariant.size,
          quantity: 1,
          price: smallestVariant.finalPrice,
          subtotal: smallestVariant.finalPrice
        });
        totalCost += smallestVariant.finalPrice;
      }

      // Effective price per KG for THIS specific order
      const weightUsedKg = (totalWeightGrams - (remainingWeight > 0 ? (remainingWeight - variantsWithPricePerKg[variantsWithPricePerKg.length-1].weightInGrams) : 0)) / 1000;
      // Let's keep it simple: price per Kg of the best variant found, 
      // but ensure we show the real total cost which is the primary comparison metric.
      
      return {
        name: sp.seller.businessDetails?.businessName || sp.seller.name,
        sellerId: sp.seller._id,
        productId: sp._id,
        pricePerPacket: bestVariant.finalPrice,
        pricePerKg: bestVariant.pricePerKg, // Base rate of the largest/best bag
        stock: sp.stock,
        variants: variantsWithPricePerKg, // ✅ NEW: Include all variants for manual selection
        recommendedCombination: combination,
        totalCost: totalCost
      };
    }).sort((a, b) => a.pricePerKg - b.pricePerKg);

    // 6. Highlight Best Price & Calculate Savings
    const bestSupplier = suppliers.length > 0 ? suppliers[0] : null;
    let savings = 0;
    if (bestSupplier && suppliers.length > 1) {
      // Savings compared to average or second best? 
      // User said "Compare cheapest vs others"
      const otherAvg = suppliers.slice(1).reduce((acc, s) => acc + s.totalCost, 0) / (suppliers.length - 1);
      savings = otherAvg - bestSupplier.totalCost;
    }

    res.status(200).json({
      success: true,
      data: {
        totalWeightKg: totalWeightGrams / 1000,
        isBulk,
        thresholdKg: threshold / 1000,
        suppliers,
        bestSupplier: bestSupplier?.name,
        savings: savings > 0 ? Math.round(savings) : 0
      }
    });

  } catch (error) {
    console.error('Compare suppliers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createWholesaleInquiry,
  getMyInquiries,
  getSupplierInquiries,
  respondToInquiry,
  rejectInquiry,
  respondToQuote,
  validateAcceptance,
  completeOrder,
  compareSuppliers,
};
