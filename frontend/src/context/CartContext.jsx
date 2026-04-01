// frontend/src/context/CartContext.jsx - FIXED: Correct response parsing
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import useToast from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

// Create context (not exported)
const CartContext = createContext(undefined);

// Export only the Provider component
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Determine API endpoint based on user role
  const getCartEndpoint = () => {
    if (user?.role === 'retailer') {
      return '/retailer/cart';
    }
    return '/cart';
  };

  // Load cart from backend on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated, user]);

  // ✅ FIX: Proper response parsing helper
  const parseCartResponse = (response) => {
    console.log('📦 Raw cart response:', response.data);

    // Try different response structures
    let cartData;

    // Structure 1: { success: true, data: { items: [...] } }
    if (response.data.data && Array.isArray(response.data.data.items)) {
      cartData = response.data.data.items;
      console.log('✅ Parsed from response.data.data.items');
    }
    // Structure 2: { cart: { items: [...] } }
    else if (response.data.cart && Array.isArray(response.data.cart.items)) {
      cartData = response.data.cart.items;
      console.log('✅ Parsed from response.data.cart.items');
    }
    // Structure 3: { success: true, data: [...] } (direct array)
    else if (response.data.data && Array.isArray(response.data.data)) {
      cartData = response.data.data;
      console.log('✅ Parsed from response.data.data');
    }
    // Structure 4: { items: [...] } (direct items)
    else if (response.data.items && Array.isArray(response.data.items)) {
      cartData = response.data.items;
      console.log('✅ Parsed from response.data.items');
    }
    // Fallback: empty array
    else {
      console.warn('⚠️ Could not find items in response, returning empty array');
      console.warn('Response structure:', JSON.stringify(response.data, null, 2));
      cartData = [];
    }

    console.log('✅ Final cart data:', cartData.length, 'items');
    return cartData;
  };

  // Load cart from backend
  const loadCart = async () => {
    try {
      setLoading(true);
      const endpoint = getCartEndpoint();
      console.log('🔄 Loading cart from:', endpoint);
      
      const response = await api.get(endpoint);
      
      // ✅ FIX: Use proper parsing function
      const cartData = parseCartResponse(response);
      setCart(cartData);
      
      console.log('✅ Cart loaded:', cartData.length, 'items');
    } catch (error) {
      console.error('❌ Failed to load cart:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      console.log('➕ Adding to cart:', productId, 'qty:', quantity);
      
      const endpoint = getCartEndpoint();
      const response = await api.post(endpoint, { 
        productId, 
        quantity 
      });
      
      // ✅ FIX: Use proper parsing function
      const cartData = parseCartResponse(response);
      setCart(cartData);
      
      console.log('✅ Item added! Cart now has:', cartData.length, 'items');
      
      showSuccess('Item added to cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Add to cart error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add to cart';
      showError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  // Update cart item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return { success: false, error: 'Quantity must be at least 1' };

    try {
      console.log('🔄 Updating quantity:', itemId, 'to', quantity);
      
      const endpoint = getCartEndpoint();
      let response;

      if (user?.role === 'retailer') {
        // Retailer: PUT /api/retailer/cart/:itemId with { quantity }
        response = await api.put(`${endpoint}/${itemId}`, { quantity });
      } else {
        // Non-retailer: PUT /api/cart/update with { productId, quantity }
        // Find the productId from the cart item
        const cartItem = cart.find(item => item._id === itemId);
        if (!cartItem) {
          return { success: false, error: 'Item not found in cart' };
        }
        response = await api.put(`${endpoint}/update`, {
          productId: cartItem.product._id || cartItem.product,
          quantity
        });
      }

      // ✅ FIX: Use proper parsing function
      const cartData = parseCartResponse(response);
      setCart(cartData);

      console.log('✅ Quantity updated! Cart has:', cartData.length, 'items');

      showSuccess('Quantity updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Update quantity error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update quantity';
      showError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    try {
      console.log('🗑️ Removing from cart:', itemId);
      
      const endpoint = getCartEndpoint();

      if (user?.role === 'retailer') {
        // Retailer: DELETE /api/retailer/cart/:itemId
        await api.delete(`${endpoint}/${itemId}`);
      } else {
        // Non-retailer: DELETE /api/cart/remove/:productId
        // Find the productId from the cart item
        const cartItem = cart.find(item => item._id === itemId);
        if (!cartItem) {
          return { success: false, error: 'Item not found in cart' };
        }
        await api.delete(`${endpoint}/remove/${cartItem.product._id || cartItem.product}`);
      }

      // ✅ Update cart state locally (immediate UI feedback)
      setCart(prevCart => prevCart.filter(item => item._id !== itemId));

      console.log('✅ Item removed!');

      showSuccess('Item removed from cart');
      return { success: true };
    } catch (error) {
      console.error('❌ Remove from cart error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to remove item';
      showError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      console.log('🗑️ Clearing entire cart');
      
      const endpoint = getCartEndpoint();
      await api.delete(`${endpoint}/clear`);
      
      setCart([]);
      
      console.log('✅ Cart cleared');
      
      showSuccess('Cart cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Clear cart error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to clear cart';
      showError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  };

  // ✅ FIX: Calculate cart totals with proper null checks
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.product?.pricing?.finalPrice || item.product?.price || item.price || 0;
    const qty = item.quantity || 0;
    return sum + (price * qty);
  }, 0);

  // GST calculation (5%)
  const cartTax = cartSubtotal * 0.05;

  // Total with tax
  const cartTotal = cartSubtotal + cartTax;

  // Total item count
  const cartCount = cart.reduce((sum, item) => {
    return sum + (item.quantity || 0);
  }, 0);

  console.log('🛒 Cart state:', {
    itemCount: cart.length,
    totalQuantity: cartCount,
    subtotal: cartSubtotal,
    tax: cartTax,
    total: cartTotal
  });

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      loadCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartSubtotal,
      cartTax,
      cartTotal,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Export the context itself for useContext
export { CartContext };