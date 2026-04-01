// backend/src/controllers/advisoryController.js
import Product from '../models/Product.js';
import { 
  getCurrentSeason, 
  getCropsForSeason,
  getRecommendedSeasonsForCrop,
  SEASONS 
} from '../utils/seasonalData.js';

/**
 * @desc    Get seasonal recommendations
 * @route   GET /api/advisory/seasonal
 * @access  Public
 */
export const getSeasonalRecommendations = async (req, res) => {
  try {
    const { season, usageType } = req.query;
    
    const currentSeason = season || getCurrentSeason();
    const crops = getCropsForSeason(currentSeason);

    // Build query
    const query = {
      seasons: currentSeason,
      approvalStatus: 'approved',
      isActive: true
    };

    if (usageType && usageType !== 'both') {
      query.usageType = { $in: [usageType, 'both'] };
    }

    // Get products for current season
    const products = await Product.find(query)
      .populate('category', 'name type')
      .populate('seller', 'name businessDetails.businessName')
      .limit(50)
      .sort('-rating.average');

    res.status(200).json({
      success: true,
      season: currentSeason,
      seasonName: SEASONS[currentSeason]?.name,
      seasonMonths: SEASONS[currentSeason]?.months,
      recommendedCrops: crops,
      data: products
    });
  } catch (error) {
    console.error('Get seasonal recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seasonal recommendations',
      error: error.message
    });
  }
};

/**
 * @desc    Get recommendations by crop
 * @route   POST /api/advisory/by-crop
 * @access  Public
 */
export const getRecommendationsByCrop = async (req, res) => {
  try {
    const { cropName, usageType } = req.body;

    if (!cropName) {
      return res.status(400).json({
        success: false,
        message: 'Crop name is required'
      });
    }

    // Get suitable seasons for this crop
    const suitableSeasons = getRecommendedSeasonsForCrop(cropName);
    const currentSeason = getCurrentSeason();
    const isInSeason = suitableSeasons.includes(currentSeason) || 
                       suitableSeasons.includes('all_season');

    // Build query
    const query = {
      suitableFor: { $regex: new RegExp(cropName, 'i') },
      approvalStatus: 'approved',
      isActive: true
    };

    if (usageType && usageType !== 'both') {
      query.usageType = { $in: [usageType, 'both'] };
    }

    // Get products suitable for this crop
    const products = await Product.find(query)
      .populate('category', 'name type')
      .populate('seller', 'name businessDetails.businessName')
      .sort('-rating.average');

    // Group by category
    const groupedProducts = {
      seeds: products.filter(p => p.category?.type === 'seeds'),
      cropProtection: products.filter(p => p.category?.type === 'crop_protection'),
      cropNutrition: products.filter(p => p.category?.type === 'crop_nutrition'),
      others: products.filter(p => 
        !['seeds', 'crop_protection', 'crop_nutrition'].includes(p.category?.type)
      )
    };

    res.status(200).json({
      success: true,
      crop: cropName,
      isInSeason,
      currentSeason,
      suitableSeasons,
      data: groupedProducts,
      tips: getCropTips(cropName, currentSeason, isInSeason)
    });
  } catch (error) {
    console.error('Get crop recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crop recommendations',
      error: error.message
    });
  }
};

/**
 * @desc    Get safety guidelines for product
 * @route   GET /api/advisory/safety/:productId
 * @access  Public
 */
export const getSafetyGuidelines = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('category', 'name type');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product has safety information
    if (!product.dosage && !product.applicationMethod && 
        !product.precautions?.length && !product.toxicityLevel) {
      return res.status(200).json({
        success: true,
        message: 'No safety guidelines available for this product',
        data: null
      });
    }

    const safetyInfo = {
      productName: product.name,
      category: product.category?.name,
      dosage: product.dosage,
      applicationMethod: product.applicationMethod,
      precautions: product.precautions,
      toxicityLevel: product.toxicityLevel,
      waitingPeriod: product.waitingPeriod,
      generalGuidelines: getGeneralSafetyGuidelines(product.category?.type)
    };

    res.status(200).json({
      success: true,
      data: safetyInfo
    });
  } catch (error) {
    console.error('Get safety guidelines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching safety guidelines',
      error: error.message
    });
  }
};

/**
 * @desc    Get crop tips based on season
 * @route   GET /api/advisory/tips
 * @access  Public
 */
export const getCropTips = (cropName, season, isInSeason) => {
  const tips = [];

  if (isInSeason) {
    tips.push(`${cropName} is in season! This is the best time to plant.`);
  } else {
    tips.push(`${cropName} is not in season currently. Check recommended seasons.`);
  }

  // General tips
  tips.push('Prepare soil with proper nutrients before planting');
  tips.push('Ensure adequate water supply based on crop requirements');
  tips.push('Monitor for pests and diseases regularly');
  tips.push('Follow recommended spacing for better growth');

  return tips;
};

/**
 * Helper function to get general safety guidelines
 */
const getGeneralSafetyGuidelines = (categoryType) => {
  const guidelines = {
    crop_protection: [
      'Always wear protective gear (gloves, mask, full sleeves)',
      'Read product label carefully before use',
      'Follow recommended dosage - never exceed',
      'Do not spray during windy conditions',
      'Wash hands thoroughly after use',
      'Keep away from children and pets',
      'Wait for recommended period before harvest',
      'Store in original container in a cool, dry place'
    ],
    crop_nutrition: [
      'Apply fertilizers at recommended rates',
      'Water plants after fertilizer application',
      'Store in a cool, dry place away from moisture',
      'Keep away from children and pets',
      'Do not mix different fertilizers without guidance',
      'Wear gloves while handling'
    ],
    seeds: [
      'Check expiry date before planting',
      'Store in cool, dry place',
      'Follow recommended planting depth',
      'Ensure proper spacing between seeds',
      'Water adequately after planting'
    ]
  };

  return guidelines[categoryType] || [
    'Follow product instructions carefully',
    'Store properly as per guidelines',
    'Keep away from children'
  ];
};

export default {
  getSeasonalRecommendations,
  getRecommendationsByCrop,
  getSafetyGuidelines
};