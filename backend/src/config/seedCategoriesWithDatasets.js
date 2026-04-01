// backend/src/config/seedCategoriesWithDatasets.js - FIXED VERSION
// ✅ LOAD ENVIRONMENT VARIABLES FIRST!
import dotenv from 'dotenv';
dotenv.config();

import Category from '../models/Category.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Script starting...');
console.log('📁 Script location:', __dirname);

// Load datasets
console.log('\n📦 Loading dataset files...');

const seedsPath = path.join(__dirname, 'datasets/seeds-dataset.json');
const pesticidesPath = path.join(__dirname, 'datasets/pesticides-dataset.json');

console.log('Checking files:');
console.log('  Seeds:', fs.existsSync(seedsPath) ? '✅' : '❌');
console.log('  Pesticides:', fs.existsSync(pesticidesPath) ? '✅' : '❌');

const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
const pesticidesData = JSON.parse(fs.readFileSync(pesticidesPath, 'utf8'));

console.log('✅ All datasets loaded successfully!\n');

// Category structure
const categoriesStructure = [
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
        varieties: seedsData.vegetableSeeds
      },
      {
        name: 'Fruit Seeds',
        level: 'sub',
        description: 'Seeds for fruit cultivation',
        displayOrder: 2,
        varieties: seedsData.fruitSeeds
      },
      {
        name: 'Flower Seeds',
        level: 'sub',
        description: 'Seeds for flowering plants',
        displayOrder: 3,
        varieties: seedsData.flowerSeeds
      }
    ]
  },
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
            varieties: pesticidesData.chemicalInsecticides
          },
          {
            name: 'Fungicides',
            level: 'type',
            displayOrder: 2,
            varieties: pesticidesData.chemicalFungicides
          },
          {
            name: 'Herbicides',
            level: 'type',
            displayOrder: 3,
            varieties: pesticidesData.chemicalHerbicides
          }
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
            varieties: pesticidesData.bioInsecticides
          },
          {
            name: 'Bio Fungicide',
            level: 'type',
            displayOrder: 2,
            varieties: pesticidesData.bioFungicides
          }
        ]
      }
    ]
  },
];

// Recursive function
async function createCategoryTree(categoryData, parentId = null) {
  const { children, varieties, ...categoryFields } = categoryData;

  const category = await Category.create({
    ...categoryFields,
    parent: parentId,
  });

  console.log(`✅ Created: ${categoryFields.name} (${categoryFields.level})`);

  if (varieties && varieties.length > 0) {
    console.log(`   📦 Loading ${varieties.length} varieties...`);
    for (const varietyName of varieties) {
      await Category.create({
        name: varietyName,
        level: 'type',
        parent: category._id,
        isActive: true,
      });
    }
    console.log(`   ✅ Loaded ${varieties.length} varieties`);
  }

  if (children && children.length > 0) {
    for (const child of children) {
      await createCategoryTree(child, category._id);
    }
  }

  return category;
}

// Main function
async function seedCategories() {
  console.log('🌱 Starting category seeding...\n');

  await Category.deleteMany({});
  console.log('🗑️  Cleared existing categories\n');

  for (const mainCategory of categoriesStructure) {
    await createCategoryTree(mainCategory);
    console.log('');
  }

  const total = await Category.countDocuments();
  console.log(`\n✅ Successfully seeded ${total} categories!`);
  console.log(`📊 Total: ~280+ categories with varieties`);
}

// ✅ CONNECT TO MONGODB (reads from .env now!)
console.log('🔗 Connecting to MongoDB...');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// ✅ Display URI with hidden password for security
const displayUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log('📍 URI:', displayUri, '\n');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected!\n');

    await seedCategories();

    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.log('\n💡 Solutions:');
    console.log('  1. Check if MongoDB Atlas credentials are correct');
    console.log('  2. Check if your IP is whitelisted in Atlas Network Access');
    console.log('  3. Verify .env file has correct MONGODB_URI');
    process.exit(1);
  });