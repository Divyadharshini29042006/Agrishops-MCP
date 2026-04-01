// frontend/src/services/reviewService.js
import api from './api';

const API_URL = '/reviews';

/**
 * Create a new review for an order
 */
export const createReview = async (reviewData) => {
  try {
    const response = await api.post(API_URL, reviewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all reviews for a specific target (retailer/supplier)
 */
export const getReviewsForTarget = async (targetId, params = {}) => {
  try {
    const response = await api.get(`${API_URL}/target/${targetId}`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all reviews for admin dashboard
 */
export const getAllReviewsAdmin = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/admin/all`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  createReview,
  getReviewsForTarget,
  getAllReviewsAdmin
};
