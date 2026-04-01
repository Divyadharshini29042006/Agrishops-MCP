// backend/src/utils/seasonalData.js

// Season definitions by months
export const SEASONS = {
  spring: {
    name: "Spring",
    months: [3, 4, 5], // March, April, May
    description: "Warm and pleasant weather, ideal for flowering plants",
  },
  summer: {
    name: "Summer",
    months: [6, 7, 8], // June, July, August
    description: "Hot and dry weather, requires drought-resistant crops",
  },
  monsoon: {
    name: "Monsoon",
    months: [7, 8, 9], // July, August, September (overlaps with summer)
    description: "Heavy rainfall, suitable for water-loving crops",
  },
  autumn: {
    name: "Autumn",
    months: [10, 11], // October, November
    description: "Cool and dry weather, harvest season",
  },
  winter: {
    name: "Winter",
    months: [12, 1, 2], // December, January, February
    description: "Cold weather, suitable for cool-season crops",
  },
};

// Crop and plant data by season
export const SEASONAL_CROPS = {
  spring: {
    vegetables: [
      "tomato",
      "cucumber",
      "pumpkin",
      "bottle_gourd",
      "bitter_gourd",
      "ridge_gourd",
      "okra",
      "brinjal",
      "chilli",
      "capsicum",
    ],
    fruits: [
      "watermelon",
      "muskmelon",
      "papaya",
      "mango",
    ],
    flowers: [
      "marigold",
      "sunflower",
      "zinnia",
      "dahlia",
      "rose",
    ],
    herbs: [
      "basil",
      "coriander",
      "mint",
      "curry_leaves",
    ],
  },
  
  summer: {
    vegetables: [
      "cucumber",
      "bitter_gourd",
      "bottle_gourd",
      "pumpkin",
      "okra",
      "chilli",
      "tomato",
    ],
    fruits: [
      "watermelon",
      "muskmelon",
      "papaya",
    ],
    flowers: [
      "zinnia",
      "portulaca",
      "vinca",
      "ixora",
    ],
    herbs: [
      "basil",
      "mint",
    ],
  },
  
  monsoon: {
    vegetables: [
      "okra",
      "brinjal",
      "ridge_gourd",
      "snake_gourd",
      "cluster_beans",
      "french_beans",
      "green_leafy_vegetables",
    ],
    cereals: [
      "rice",
      "paddy",
      "maize",
      "millets",
      "sorghum",
    ],
    pulses: [
      "green_gram",
      "black_gram",
      "pigeon_pea",
    ],
    flowers: [
      "marigold",
      "celosia",
      "balsam",
    ],
  },
  
  autumn: {
    vegetables: [
      "cauliflower",
      "cabbage",
      "radish",
      "carrot",
      "beetroot",
      "turnip",
      "peas",
      "spinach",
      "fenugreek",
    ],
    cereals: [
      "wheat",
      "barley",
      "oats",
    ],
    pulses: [
      "chickpea",
      "lentil",
      "field_pea",
    ],
    flowers: [
      "chrysanthemum",
      "dahlia",
      "calendula",
    ],
  },
  
  winter: {
    vegetables: [
      "cauliflower",
      "cabbage",
      "broccoli",
      "radish",
      "carrot",
      "beetroot",
      "turnip",
      "peas",
      "spinach",
      "lettuce",
      "celery",
      "knol_khol",
    ],
    cereals: [
      "wheat",
      "barley",
    ],
    fruits: [
      "strawberry",
    ],
    flowers: [
      "pansy",
      "petunia",
      "snapdragon",
      "sweet_pea",
      "hollyhock",
    ],
  },
};

// All-season crops (can be grown year-round)
export const ALL_SEASON_CROPS = [
  "spinach",
  "fenugreek",
  "coriander",
  "curry_leaves",
  "chilli",
  "tomato",
  "brinjal",
];

/**
 * Get current season based on current date
 * @returns {string} Current season name
 */
export const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // JavaScript months are 0-indexed
  
  for (const [season, data] of Object.entries(SEASONS)) {
    if (data.months.includes(month)) {
      return season;
    }
  }
  
  return "spring"; // Default fallback
};

/**
 * Get season by month number
 * @param {number} month - Month number (1-12)
 * @returns {string} Season name
 */
export const getSeasonByMonth = (month) => {
  for (const [season, data] of Object.entries(SEASONS)) {
    if (data.months.includes(month)) {
      return season;
    }
  }
  return "spring";
};

/**
 * Check if a crop is suitable for a given season
 * @param {string} cropName - Name of the crop
 * @param {string} season - Season name
 * @returns {boolean} True if suitable
 */
export const isCropSuitableForSeason = (cropName, season) => {
  const normalizedCrop = cropName.toLowerCase().replace(/ /g, "_");
  
  // Check if it's an all-season crop
  if (ALL_SEASON_CROPS.includes(normalizedCrop)) {
    return true;
  }
  
  // Check in seasonal crops
  const seasonalCrops = SEASONAL_CROPS[season];
  if (!seasonalCrops) return false;
  
  for (const category of Object.values(seasonalCrops)) {
    if (category.includes(normalizedCrop)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get all crops for a specific season
 * @param {string} season - Season name
 * @returns {Array} Array of crop names
 */
export const getCropsForSeason = (season) => {
  const seasonalCrops = SEASONAL_CROPS[season];
  if (!seasonalCrops) return [];
  
  const allCrops = [];
  for (const crops of Object.values(seasonalCrops)) {
    allCrops.push(...crops);
  }
  
  // Add all-season crops
  allCrops.push(...ALL_SEASON_CROPS);
  
  // Remove duplicates
  return [...new Set(allCrops)];
};

/**
 * Get recommended seasons for a crop
 * @param {string} cropName - Name of the crop
 * @returns {Array} Array of season names
 */
export const getRecommendedSeasonsForCrop = (cropName) => {
  const normalizedCrop = cropName.toLowerCase().replace(/ /g, "_");
  const recommendedSeasons = [];
  
  // Check if it's an all-season crop
  if (ALL_SEASON_CROPS.includes(normalizedCrop)) {
    return ["all_season"];
  }
  
  // Check each season
  for (const [season, crops] of Object.entries(SEASONAL_CROPS)) {
    for (const category of Object.values(crops)) {
      if (category.includes(normalizedCrop)) {
        recommendedSeasons.push(season);
        break;
      }
    }
  }
  
  return recommendedSeasons;
};

/**
 * Get crop category (vegetable, fruit, cereal, etc.)
 * @param {string} cropName - Name of the crop
 * @returns {string|null} Category name or null
 */
export const getCropCategory = (cropName) => {
  const normalizedCrop = cropName.toLowerCase().replace(/ /g, "_");
  
  for (const seasonCrops of Object.values(SEASONAL_CROPS)) {
    for (const [category, crops] of Object.entries(seasonCrops)) {
      if (crops.includes(normalizedCrop)) {
        return category;
      }
    }
  }
  
  return null;
};

/**
 * Get friendly display name for crop
 * @param {string} cropName - Name of the crop
 * @returns {string} Formatted crop name
 */
export const formatCropName = (cropName) => {
  return cropName
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Month names for display
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default {
  SEASONS,
  SEASONAL_CROPS,
  ALL_SEASON_CROPS,
  getCurrentSeason,
  getSeasonByMonth,
  isCropSuitableForSeason,
  getCropsForSeason,
  getRecommendedSeasonsForCrop,
  getCropCategory,
  formatCropName,
  MONTH_NAMES,
};