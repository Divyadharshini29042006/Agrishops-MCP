// backend/src/controllers/cartController.js - FIXED
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name brand pricing.finalPrice pricing.basePrice images stock seller category isActive approvalStatus',
        populate: {
          path: 'seller',
          select: 'name role businessDetails.businessName'
        }
      });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          total: 0,
          itemCount: 0
        }
      });
    }

    // Filter out inactive or unapproved products
    cart.items = cart.items.filter(item =>
      item.product &&
      item.product.isActive &&
      item.product.approvalStatus === 'approved'
    );

    await cart.save();

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    next(error); // ✅ Pass error to Express error handler
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is active and approved
    if (!product.isActive || product.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This product is not available'
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} units available`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.pricing.finalPrice;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.pricing.finalPrice
      });
    }

    await cart.save();

    // Populate cart before sending response
    await cart.populate({
      path: 'items.product',
      select: 'name brand pricing.finalPrice pricing.basePrice images stock seller category isActive approvalStatus',
      populate: {
        path: 'seller',
        select: 'name role businessDetails.businessName'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    next(error); // ✅ Pass error to Express error handler
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/update (non-retailers)
 * @route   PUT /api/retailer/cart/:id (retailers)
 * @access  Private
 */
export const updateCartItem = async (req, res, next) => {
  try {
    let productId, quantity;

    // Handle different parameter sources for retailers vs non-retailers
    if (req.params.id) {
      // Retailer route: PUT /api/retailer/cart/:id
      // Find the cart item by its _id to get the productId
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const cartItem = cart.items.id(req.params.id);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      productId = cartItem.product.toString();
      quantity = req.body.quantity;
    } else {
      // Non-retailer route: PUT /api/cart/update
      productId = req.body.productId;
      quantity = req.body.quantity;
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available`
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.pricing.finalPrice;

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name brand pricing.finalPrice pricing.basePrice images stock seller category isActive approvalStatus',
      populate: {
        path: 'seller',
        select: 'name role businessDetails.businessName'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    next(error); // ✅ Pass error to Express error handler
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:productId (non-retailers)
 * @route   DELETE /api/retailer/cart/:id (retailers)
 * @access  Private
 */
export const removeFromCart = async (req, res, next) => {
  try {
    let productId;

    // Handle different parameter sources for retailers vs non-retailers
    if (req.params.id) {
      // Retailer route: DELETE /api/retailer/cart/:id
      // Find the cart item by its _id to get the productId
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const cartItem = cart.items.id(req.params.id);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      productId = cartItem.product.toString();
    } else {
      // Non-retailer route: DELETE /api/cart/remove/:productId
      productId = req.params.productId;
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name brand pricing.finalPrice pricing.basePrice images stock seller category isActive approvalStatus',
      populate: {
        path: 'seller',
        select: 'name role businessDetails.businessName'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    next(error); // ✅ Pass error to Express error handler
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    next(error); // ✅ Pass error to Express error handler
  }
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};