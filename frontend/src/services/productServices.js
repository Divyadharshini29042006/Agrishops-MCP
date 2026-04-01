// frontend/src/services/productService.js - FIXED
import api from './api';

// ✅ NO '/api' prefix - api instance already has baseURL='/api'
const API_URL = '/products';

/**
 * Get all products with filters
 */
export const getProducts = async (filters = {}) => {
  try {
    const response = await api.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`${API_URL}/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create new product
 */
export const createProduct = async (productData) => {
  try {
    const response = await api.post(API_URL, productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update product
 */
export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`${API_URL}/${productId}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`${API_URL}/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get supplier's own products
 * ✅ FIXED: Changed from /products/my/products to /my/products
 */
export const getMyProducts = async () => {
  try {
    const response = await api.get('/my/products');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get seasonal products
 */
export const getSeasonalProducts = async () => {
  try {
    const response = await api.get(`${API_URL}/seasonal`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Search products
 */
export const searchProducts = async (query) => {
  try {
    const response = await api.get(`${API_URL}/search`, { params: { q: query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getSeasonalProducts,
  searchProducts
};