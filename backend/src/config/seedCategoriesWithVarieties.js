// backend/src/config/seedCategoriesWithVarieties.js
import dotenv from 'dotenv';
dotenv.config();

import Category from '../models/Category.js';
import ProductVariety from '../models/ProductVariety.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Script starting...');

// Load datasets [cite: 535, 537]
const seedsPath = path.join(__dirname, 'datasets/seeds-dataset.json');
const plantsPath = path.join(__dirname, 'datasets/plants-dataset.json');
const pesticidesPath = path.join(__dirname, 'datasets/pesticides-dataset.json');
const fertilizersPath = path.join(__dirname, 'datasets/fertilizers-dataset.json');

const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
const plantsData = JSON.parse(fs.readFileSync(plantsPath, 'utf8'));
const pesticidesData = JSON.parse(fs.readFileSync(pesticidesPath, 'utf8'));
const fertilizersData = JSON.parse(fs.readFileSync(fertilizersPath, 'utf8'));

// Category structure mapping [cite: 5-11, 535]
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
        displayOrder: 1,
        children: seedsData.vegetableSeeds
      },
      {
        name: 'Fruit Seeds',
        level: 'sub',
        displayOrder: 2,
        children: seedsData.fruitSeeds
      },
      {
        name: 'Flower Seeds',
        level: 'sub',
        displayOrder: 3,
        children: seedsData.flowerSeeds
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
        displayOrder: 1,
        children: [
          { name: 'Insecticides', level: 'type', displayOrder: 1, varieties: pesticidesData.chemicalInsecticides || [] },
          { name: 'Fungicides', level: 'type', displayOrder: 2, varieties: pesticidesData.chemicalFungicides || [] },
          { name: 'Herbicides', level: 'type', displayOrder: 3, varieties: pesticidesData.chemicalHerbicides || [] }
        ]
      },
      {
        name: 'Bio Pesticides',
        level: 'sub',
        displayOrder: 2,
        children: [
          { name: 'Bio Insecticide', level: 'type', displayOrder: 1, varieties: pesticidesData.bioInsecticides || [] },
          { name: 'Bio Fungicide', level: 'type', displayOrder: 2, varieties: pesticidesData.bioFungicides || [] }
        ]
      }
    ]
  },
  // Crop Nutrition, Plants, Pots & Planters removed
];

// Helper to create varieties [cite: 537]
async function createVarieties(varieties, productTypeId, categoryHierarchy, adminId) {
  if (!varieties || varieties.length === 0) return 0;
  let count = 0;
  for (const v of varieties) {
    try {
      const vName = typeof v === 'string' ? v : v.name;
      const vDesc = typeof v === 'object' ? v.description : '';

      if (!vName || vName === "[object Object]") continue;

      await ProductVariety.create({
        name: vName,
        description: vDesc,
        productType: productTypeId,
        categoryHierarchy,
        suggestedBy: adminId, // Satisfies model requirement
        approvalStatus: 'approved',
        isActive: true,
        displayOrder: count
      });
      count++;
    } catch (err) {
      console.error(` ⚠️ Failed variety: ${err.message}`);
    }
  }
  return count;
}

// Recursive tree creation
async function createCategoryTree(categoryData, adminId, parentId = null, parentHierarchy = {}) {
  const { children, varieties, ...fields } = categoryData;
  const category = await Category.create({ ...fields, parent: parentId });
  console.log(`✅ Created: ${fields.name} (${fields.level})`);

  const hierarchy = { ...parentHierarchy };
  if (fields.level === 'main') hierarchy.main = category._id;
  else if (fields.level === 'sub') hierarchy.sub = category._id;
  else if (fields.level === 'type') hierarchy.type = category._id;

  if (varieties) {
    await createVarieties(varieties, category._id, hierarchy, adminId);
  }

  if (children) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.varieties) {
        const typeCat = await Category.create({
          name: child.name,
          level: 'type',
          parent: category._id,
          displayOrder: i + 1
        });
        await createVarieties(child.varieties, typeCat._id, { ...hierarchy, type: typeCat._id }, adminId);
      } else {
        await createCategoryTree(child, adminId, category._id, hierarchy);
      }
    }
  }
}

// Main execution
async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error("No Admin found! Run createDefaultAdmin.js first.");

    await Category.deleteMany({});
    await ProductVariety.deleteMany({});
    console.log('🗑️ Database cleared');

    for (const main of categoriesStructure) {
      await createCategoryTree(main, admin._id);
    }

    console.log('\n✨ Seeding Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();