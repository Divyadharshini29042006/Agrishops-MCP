// backend/src/config/seedRetailerProducts.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import ProductVariety from '../models/ProductVariety.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

async function seedRetailerProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔗 Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        const r1 = await User.findById("69766ba7032b0600c02a6359");
        const r2 = await User.findById("697cd417bf74fd109502c570");

        if (!r1 || !r2 || !admin) throw new Error("Retailer or admin not found!");

        const seedsMain = await Category.findOne({ name: "Seeds", level: "main" });
        const vegSub = await Category.findOne({ name: "Vegetable Seeds", level: "sub" });
        const fruitSub = await Category.findOne({ name: "Fruit Seeds", level: "sub" });
        const flowerSub = await Category.findOne({ name: "Flower Seeds", level: "sub" });

        if (!seedsMain || !vegSub || !fruitSub || !flowerSub)
            throw new Error("Categories not found!");

        await Product.deleteMany({
            seller: { $in: [r1._id, r2._id] },
            'category.main': seedsMain._id
        });
        console.log('🗑️ Deleted existing retailer seed products');

        const pricingMap = {
            "Vegetable Seeds": { p50: 65, p250: 260, p500: 480, base: 65 },
            "Fruit Seeds": { p50: 90, p250: 360, p500: 650, base: 90 },
            "Flower Seeds": { p50: 52, p250: 210, p500: 380, base: 52 }
        };

        const retailersData = [
            {
                user: r1,
                products: [
                    // VEGETABLE SEEDS (10)
                    { type: "Tomato Seeds", variety: "Beefsteak Tomato", sub: vegSub, seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["tomato"] },
                    { type: "Chilli Seeds", variety: "Bird's Eye Chilli", sub: vegSub, seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["chilli"] },
                    { type: "Capsicum Seeds", variety: "Green Capsicum", sub: vegSub, seasons: ["winter", "spring"], usageType: "farming", seedType: "vegetable", suitableFor: ["capsicum"] },
                    { type: "Brinjal Seeds", variety: "Round Brinjal", sub: vegSub, seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["brinjal"] },
                    { type: "Okra Seeds", variety: "Red Okra", sub: vegSub, seasons: ["summer"], usageType: "farming", seedType: "vegetable", suitableFor: ["okra"] },
                    { type: "Cauliflower Seeds", variety: "Orange Cauliflower", sub: vegSub, seasons: ["winter"], usageType: "farming", seedType: "vegetable", suitableFor: ["cauliflower"] },
                    { type: "Cucumber Seeds", variety: "Armenian Cucumber", sub: vegSub, seasons: ["summer", "spring"], usageType: "farming", seedType: "vegetable", suitableFor: ["cucumber"] },
                    { type: "Spinach Seeds", variety: "Savoy Spinach", sub: vegSub, seasons: ["winter", "autumn"], usageType: "farming", seedType: "vegetable", suitableFor: ["spinach"] },
                    { type: "Onion Seeds", variety: "Spring Onion", sub: vegSub, seasons: ["all_season"], usageType: "farming", seedType: "vegetable", suitableFor: ["onion"] },
                    { type: "Coriander Seeds", variety: "Vietnamese Coriander", sub: vegSub, seasons: ["winter", "all_season"], usageType: "farming", seedType: "vegetable", suitableFor: ["coriander"] },
                    // FRUIT SEEDS (10)
                    { type: "Watermelon Seeds", variety: "Yellow Watermelon", sub: fruitSub, seasons: ["summer"], usageType: "both", seedType: "fruit" },
                    { type: "Muskmelon Seeds", variety: "Galia Melon", sub: fruitSub, seasons: ["summer", "spring"], usageType: "both", seedType: "fruit" },
                    { type: "Papaya Seeds", variety: "Mexican Papaya", sub: fruitSub, seasons: ["all_season"], usageType: "both", seedType: "fruit" },
                    { type: "Strawberry Seeds", variety: "Wild Strawberry", sub: fruitSub, seasons: ["winter", "spring"], usageType: "both", seedType: "fruit" },
                    { type: "Grapes Seeds", variety: "Black Grapes", sub: fruitSub, seasons: ["spring", "summer"], usageType: "both", seedType: "fruit" },
                    { type: "Dragon Fruit Seeds", variety: "Yellow Dragon Fruit", sub: fruitSub, seasons: ["summer", "monsoon"], usageType: "both", seedType: "fruit" },
                    { type: "Pomegranate Seeds", variety: "Ruby Pomegranate", sub: fruitSub, seasons: ["all_season"], usageType: "both", seedType: "fruit" },
                    { type: "Guava Seeds", variety: "Apple Guava", sub: fruitSub, seasons: ["all_season"], usageType: "both", seedType: "fruit" },
                    { type: "Pumpkin Seeds", variety: "Miniature Pumpkin", sub: fruitSub, seasons: ["monsoon", "autumn"], usageType: "both", seedType: "fruit" },
                    { type: "Passion Fruit Seeds", variety: "Purple Passion Fruit", sub: fruitSub, seasons: ["monsoon", "summer"], usageType: "both", seedType: "fruit" },
                    // FLOWER SEEDS (10)
                    { type: "Marigold Seeds", variety: "Signet Marigold", sub: flowerSub, seasons: ["all_season"], usageType: "gardening", seedType: "flower" },
                    { type: "Rose Seeds", variety: "Miniature Rose", sub: flowerSub, seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower" },
                    { type: "Sunflower Seeds", variety: "Multi-Head Sunflower", sub: flowerSub, seasons: ["summer", "spring"], usageType: "gardening", seedType: "flower" },
                    { type: "Hibiscus Seeds", variety: "Rose of Sharon", sub: flowerSub, seasons: ["summer", "monsoon"], usageType: "gardening", seedType: "flower" },
                    { type: "Jasmine Seeds", variety: "Star Jasmine", sub: flowerSub, seasons: ["spring", "summer"], usageType: "gardening", seedType: "flower" },
                    { type: "Zinnia Seeds", variety: "Cactus Zinnia", sub: flowerSub, seasons: ["summer"], usageType: "gardening", seedType: "flower" },
                    { type: "Dahlia Seeds", variety: "Cactus Dahlia", sub: flowerSub, seasons: ["spring", "autumn"], usageType: "gardening", seedType: "flower" },
                    { type: "Cosmos Seeds", variety: "Orange Cosmos", sub: flowerSub, seasons: ["summer", "monsoon"], usageType: "gardening", seedType: "flower" },
                    { type: "Petunia Seeds", variety: "Wave Petunia", sub: flowerSub, seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower" },
                    { type: "Gerbera Seeds", variety: "Yellow Gerbera", sub: flowerSub, seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower" }
                ]
            },
            {
                user: r2,
                products: [
                    // VEGETABLE SEEDS (10)
                    { type: "Tomato Seeds", variety: "Hybrid Tomato", sub: vegSub, seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["tomato"] },
                    { type: "Chilli Seeds", variety: "Kashmiri Chilli", sub: vegSub, seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["chilli"] },
                    { type: "Capsicum Seeds", variety: "Orange Capsicum", sub: vegSub, seasons: ["winter", "spring"], usageType: "farming", seedType: "vegetable", suitableFor: ["capsicum"] },
                    { type: "Brinjal Seeds", variety: "White Brinjal", sub: vegSub, seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["brinjal"] },
                    { type: "Okra Seeds", variety: "Dwarf Okra", sub: vegSub, seasons: ["summer"], usageType: "farming", seedType: "vegetable", suitableFor: ["okra"] },
                    { type: "Cauliflower Seeds", variety: "Romanesco Cauliflower", sub: vegSub, seasons: ["winter"], usageType: "farming", seedType: "vegetable", suitableFor: ["cauliflower"] },
                    { type: "Cucumber Seeds", variety: "Lemon Cucumber", sub: vegSub, seasons: ["summer", "spring"], usageType: "farming", seedType: "vegetable", suitableFor: ["cucumber"] },
                    { type: "Spinach Seeds", variety: "Red Spinach", sub: vegSub, seasons: ["winter", "autumn"], usageType: "farming", seedType: "vegetable", suitableFor: ["spinach"] },
                    { type: "Onion Seeds", variety: "Yellow Onion", sub: vegSub, seasons: ["all_season"], usageType: "farming", seedType: "vegetable", suitableFor: ["onion"] },
                    { type: "Coriander Seeds", variety: "Slow-Bolt Coriander", sub: vegSub, seasons: ["winter", "all_season"], usageType: "farming", seedType: "vegetable", suitableFor: ["coriander"] },
                    // FRUIT SEEDS (10)
                    { type: "Watermelon Seeds", variety: "Seedless Watermelon", sub: fruitSub, seasons: ["summer"], usageType: "both", seedType: "fruit" },
                    { type: "Muskmelon Seeds", variety: "Kharbooza", sub: fruitSub, seasons: ["summer", "spring"], usageType: "both", seedType: "fruit" },
                    { type: "Papaya Seeds", variety: "Solo Papaya", sub: fruitSub, seasons: ["all_season"], usageType: "both", seedType: "fruit" },
                    { type: "Strawberry Seeds", variety: "Alpine Strawberry", sub: fruitSub, seasons: ["winter", "spring"], usageType: "both", seedType: "fruit" },
                    { type: "Grapes Seeds", variety: "Thompson Seedless", sub: fruitSub, seasons: ["spring", "summer"], usageType: "both", seedType: "fruit" },
                    { type: "Dragon Fruit Seeds", variety: "White-Fleshed Dragon Fruit", sub: fruitSub, seasons: ["summer", "monsoon"], usageType: "both", seedType: "fruit" },
                    { type: "Pomegranate Seeds", variety: "Bhagwa Pomegranate", sub: fruitSub, seasons: ["all_season"], usageType: "both", seedType: "fruit" },
                    { type: "Guava Seeds", variety: "Thai Guava", sub: fruitSub, seasons: ["all_season"], usageType: "both", seedType: "fruit" },
                    { type: "Pumpkin Seeds", variety: "Jack-o'-Lantern Pumpkin", sub: fruitSub, seasons: ["monsoon", "autumn"], usageType: "both", seedType: "fruit" },
                    { type: "Passion Fruit Seeds", variety: "Yellow Passion Fruit", sub: fruitSub, seasons: ["monsoon", "summer"], usageType: "both", seedType: "fruit" },
                    // FLOWER SEEDS (10)
                    { type: "Marigold Seeds", variety: "African Marigold", sub: flowerSub, seasons: ["all_season"], usageType: "gardening", seedType: "flower" },
                    { type: "Rose Seeds", variety: "Floribunda Rose", sub: flowerSub, seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower" },
                    { type: "Sunflower Seeds", variety: "Red Sunflower", sub: flowerSub, seasons: ["summer", "spring"], usageType: "gardening", seedType: "flower" },
                    { type: "Hibiscus Seeds", variety: "Tropical Hibiscus", sub: flowerSub, seasons: ["summer", "monsoon"], usageType: "gardening", seedType: "flower" },
                    { type: "Jasmine Seeds", variety: "Arabian Jasmine", sub: flowerSub, seasons: ["spring", "summer"], usageType: "gardening", seedType: "flower" },
                    { type: "Zinnia Seeds", variety: "Giant Zinnia", sub: flowerSub, seasons: ["summer"], usageType: "gardening", seedType: "flower" },
                    { type: "Dahlia Seeds", variety: "Dinner Plate Dahlia", sub: flowerSub, seasons: ["spring", "autumn"], usageType: "gardening", seedType: "flower" },
                    { type: "Cosmos Seeds", variety: "Pink Cosmos", sub: flowerSub, seasons: ["summer", "monsoon"], usageType: "gardening", seedType: "flower" },
                    { type: "Petunia Seeds", variety: "Grandiflora Petunia", sub: flowerSub, seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower" },
                    { type: "Gerbera Seeds", variety: "Orange Gerbera", sub: flowerSub, seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower" }
                ]
            }
        ];

        let insertedCount = 0;

        for (const entry of retailersData) {
            const seller = entry.user;
            for (const p of entry.products) {
                try {
                    const typeDoc = await Category.findOne({ name: p.type, level: "type" });
                    if (!typeDoc) {
                        console.warn(`⚠️ [SKIP] Category Type not found: ${p.type}`);
                        continue;
                    }

                    const varietyDoc = await ProductVariety.findOne({
                        name: p.variety,
                        productType: typeDoc._id,
                        approvalStatus: "approved"
                    });

                    if (!varietyDoc) {
                        console.warn(`⚠️ [SKIP] Variety not found: ${p.variety} for type ${p.type}`);
                        continue;
                    }

                    const prices = pricingMap[p.sub.name];
                    const productName = `${p.variety} Seeds`;

                    const productData = {
                        name: productName,
                        description: `Premium quality ${p.variety} seeds. High germination rate and suitable for ${p.usageType}. These seeds are carefully selected for best yields in Indian climates.`,
                        category: {
                            main: seedsMain._id,
                            sub: p.sub._id,
                            type: typeDoc._id,
                            variety: varietyDoc._id
                        },
                        seller: seller._id,
                        pricing: {
                            basePrice: prices.base,
                            hasOffer: false,
                            offerType: "none",
                            offerValue: 0,
                            finalPrice: prices.base,
                            discount: 0
                        },
                        variants: [
                            { size: "50", quantity: 50, unit: "gm", basePrice: prices.p50, finalPrice: prices.p50, discountPercentage: 0, stock: 200, isDefault: true },
                            { size: "250", quantity: 250, unit: "gm", basePrice: prices.p250, finalPrice: prices.p250, discountPercentage: 0, stock: 100, isDefault: false },
                            { size: "500", quantity: 500, unit: "gm", basePrice: prices.p500, finalPrice: prices.p500, discountPercentage: 0, stock: 80, isDefault: false }
                        ],
                        unit: "gm",
                        stock: 0, // Will be calculated by pre-save hook
                        lowStockThreshold: 400,
                        images: [{
                            url: `https://source.unsplash.com/400x400/?${p.variety.replace(/ /g, ',')},seeds`,
                            publicId: "placeholder",
                            filename: "placeholder.jpg"
                        }],
                        hasExpiry: true,
                        expiryDate: new Date("2027-12-31"),
                        seasons: p.seasons,
                        suitableFor: p.suitableFor || [p.type.split(' ')[0].toLowerCase()],
                        usageType: p.usageType,
                        seedDetails: {
                            seedType: p.seedType,
                            variety: p.variety,
                            germinationRate: Math.floor(Math.random() * (92 - 80 + 1)) + 80,
                            sowingDepth: "1-2 cm",
                            plantSpacing: "30x30 cm",
                            harvestTime: "60-90 days",
                            hybrid: false
                        },
                        safetyInstructions: {
                            dosage: "Sow seeds at recommended spacing",
                            applicationMethod: "Direct sowing or seedling transplant",
                            precautions: ["Store in cool dry place", "Keep away from moisture"],
                            toxicityLevel: "not_applicable",
                            waitingPeriod: "N/A"
                        },
                        brand: "AgriShop Seeds",
                        organicCertified: false,
                        approvalStatus: "approved",
                        approvedBy: admin._id,
                        approvedAt: new Date(),
                        isActive: true,
                        isFeatured: false,
                        bulkOrder: {
                            enabled: true,
                            minQuantity: 3,
                            bulkDiscount: 5
                        },
                        bulkMinQuantity: 3
                    };

                    await Product.create(productData);
                    insertedCount++;
                } catch (err) {
                    console.error(`❌ Failed to insert product ${p.variety}:`, err.message);
                }
            }
        }

        console.log(`✨ Inserted ${insertedCount}/60 retailer products`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err.message);
        process.exit(1);
    }
}

seedRetailerProducts();
