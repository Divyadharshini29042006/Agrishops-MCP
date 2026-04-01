// backend/src/config/seedCategories.js
import dotenv from 'dotenv';
dotenv.config();

import Category from '../models/Category.js';
import mongoose from 'mongoose';

/**
 * Category hierarchy based on your screenshots:
 * 
 * SEEDS
 *   ├── Vegetable Seeds
 *   ├── Fruit Seeds
 *   ├── Flower Seeds
 *   └── Top Brands
 * 
 * CROP PROTECTION
 *   ├── Chemical Pesticides
 *   │   ├── Insecticides
 *   │   ├── Fungicides
 *   │   └── Herbicides
 *   └── Bio Pesticides
 *       ├── Bio Insecticide
 *       └── Bio Fungicide
 * 
 * CROP NUTRITION
 *   ├── Fertilizers
 *   ├── Bio Fertilizers
 *   ├── Biostimulants
 *   └── Plant Growth Promoter
 * 
 * FARMING TOOLS
 * PLANTS
 * POTS & PLANTERS
 * ANIMAL FEED & CARE
 */

const categoriesData = [
  // ==================== SEEDS ====================
  {
    name: 'Seeds',
    level: 'main',
    categoryType: 'seeds',
    description: 'Quality seeds for farming and gardening',
    displayOrder: 1,
    metadata: { requiresSeedFields: true },
    children: [
      {
        name: 'Vegetable Seeds',
        level: 'sub',
        description: 'Seeds for vegetable cultivation',
        displayOrder: 1,
        children: [
          { name: 'Tomato Seeds', level: 'type', displayOrder: 1 },
          { name: 'Chilli Seeds', level: 'type', displayOrder: 2 },
          { name: 'Bhindi (Okra) Seeds', level: 'type', displayOrder: 3 },
          { name: 'Brinjal Seeds', level: 'type', displayOrder: 4 },
          { name: 'Cauliflower Seeds', level: 'type', displayOrder: 5 },
          { name: 'Cabbage Seeds', level: 'type', displayOrder: 6 },
          { name: 'Carrot Seeds', level: 'type', displayOrder: 7 },
          { name: 'Broccoli Seeds', level: 'type', displayOrder: 8 },
          { name: 'Bitter Gourd Seeds', level: 'type', displayOrder: 9 },
          { name: 'Bottle Gourd Seeds', level: 'type', displayOrder: 10 },
        ]
      },
      {
        name: 'Fruit Seeds',
        level: 'sub',
        description: 'Seeds for fruit cultivation',
        displayOrder: 2,
        children: [
          { name: 'Watermelon Seeds', level: 'type', displayOrder: 1 },
          { name: 'Muskmelon Seeds', level: 'type', displayOrder: 2 },
          { name: 'Papaya Seeds', level: 'type', displayOrder: 3 },
          { name: 'Strawberry Seeds', level: 'type', displayOrder: 4 },
        ]
      },
      {
        name: 'Flower Seeds',
        level: 'sub',
        description: 'Seeds for flowering plants',
        displayOrder: 3,
        children: [
          { name: 'Marigold Seeds', level: 'type', displayOrder: 1 },
          { name: 'Zinnia Seeds', level: 'type', displayOrder: 2 },
          { name: 'Sunflower Seeds', level: 'type', displayOrder: 3 },
        ]
      }
    ]
  },

  // ==================== CROP PROTECTION ====================
  {
    name: 'Crop Protection',
    level: 'main',
    categoryType: 'crop_protection',
    description: 'Pesticides and crop protection products',
    displayOrder: 2,
    metadata: { requiresPesticideFields: true },
    children: [
      {
        name: 'Chemical Pesticides',
        level: 'sub',
        description: 'Chemical-based crop protection',
        displayOrder: 1,
        children: [
          {
            name: 'Insecticides',
            level: 'type',
            displayOrder: 1,
            metadata: { requiresPesticideFields: true }
          },
          {
            name: 'Fungicides',
            level: 'type',
            displayOrder: 2,
            metadata: { requiresPesticideFields: true }
          },
          {
            name: 'Herbicides',
            level: 'type',
            displayOrder: 3,
            metadata: { requiresPesticideFields: true }
          },
        ]
      },
      {
        name: 'Bio Pesticides',
        level: 'sub',
        description: 'Organic and biological pest control',
        displayOrder: 2,
        children: [
          {
            name: 'Bio Insecticide',
            level: 'type',
            displayOrder: 1,
            metadata: { requiresPesticideFields: true }
          },
          {
            name: 'Bio Fungicide',
            level: 'type',
            displayOrder: 2,
            metadata: { requiresPesticideFields: true }
          },
        ]
      }
    ]
  },

  // ==================== CROP NUTRITION removed ====================
];

/**
 * Recursive function to create categories with hierarchy
 */
async function createCategoryTree(categoryData, parentId = null) {
  const { children, ...categoryFields } = categoryData;

  const category = await Category.create({
    ...categoryFields,
    parent: parentId,
  });

  console.log(`✅ Created: ${categoryFields.name} (${categoryFields.level})`);

  if (children && children.length > 0) {
    for (const child of children) {
      await createCategoryTree(child, category._id);
    }
  }

  return category;
}

/**
 * Main seed function
 */
export const seedCategories = async () => {
  try {
    console.log('🌱 Starting category seeding...\n');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories\n');

    // Create category tree
    for (const mainCategory of categoriesData) {
      await createCategoryTree(mainCategory);
      console.log(''); // Empty line for readability
    }

    const totalCategories = await Category.countDocuments();
    console.log(`\n✅ Successfully seeded ${totalCategories} categories!`);

    return true;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seed_pesticides';

  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📦 Connected to MongoDB');
      await seedCategories();
      await mongoose.connection.close();
      console.log('👋 Database connection closed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    });
}

export default seedCategories;