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

const S1_ID = "6974da9d0e5735db323a5196";
const S2_ID = "697cd6e0bf74fd109502c715";

const PRICING = {
    vegetable: { p1: 400, p2: 750, p3: 1700 },
    fruit: { p1: 600, p2: 1100, p3: 2500 },
    flower: { p1: 320, p2: 600, p3: 1400 }
};

const makeVariants = (type) => {
    const p = PRICING[type];
    return [
        { size: "1", quantity: 1, unit: "kg", basePrice: p.p1, finalPrice: p.p1, discountPercentage: 0, stock: 50, isDefault: true },
        { size: "2", quantity: 2, unit: "kg", basePrice: p.p2, finalPrice: p.p2, discountPercentage: 0, stock: 30, isDefault: false },
        { size: "5", quantity: 5, unit: "kg", basePrice: p.p3, finalPrice: p.p3, discountPercentage: 0, stock: 20, isDefault: false }
    ];
};

const SUPPLIER1_DATA = [
    { type: "Tomato Seeds", variety: "Cherry Tomato", seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["tomato"], germinationRate: 88, sowingDepth: "1cm", plantSpacing: "45cm", harvestTime: "70-80 days" },
    { type: "Chilli Seeds", variety: "Green Chilli", seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["chilli"], germinationRate: 85, sowingDepth: "0.5cm", plantSpacing: "30cm", harvestTime: "60-75 days" },
    { type: "Capsicum Seeds", variety: "Red Capsicum", seasons: ["winter", "spring"], usageType: "farming", seedType: "vegetable", suitableFor: ["capsicum"], germinationRate: 82, sowingDepth: "0.5cm", plantSpacing: "45cm", harvestTime: "75-90 days" },
    { type: "Brinjal Seeds", variety: "Purple Brinjal", seasons: ["summer", "monsoon"], usageType: "farming", seedType: "vegetable", suitableFor: ["brinjal"], germinationRate: 86, sowingDepth: "1cm", plantSpacing: "60cm", harvestTime: "65-80 days" },
    { type: "Okra Seeds", variety: "Hybrid Okra", seasons: ["summer"], usageType: "farming", seedType: "vegetable", suitableFor: ["okra"], germinationRate: 87, sowingDepth: "2cm", plantSpacing: "30cm", harvestTime: "50-60 days" },
    { type: "Cauliflower Seeds", variety: "White Cauliflower", seasons: ["winter"], usageType: "farming", seedType: "vegetable", suitableFor: ["cauliflower"], germinationRate: 84, sowingDepth: "0.5cm", plantSpacing: "60cm", harvestTime: "80-100 days" },
    { type: "Cucumber Seeds", variety: "English Cucumber", seasons: ["summer", "spring"], usageType: "farming", seedType: "vegetable", suitableFor: ["cucumber"], germinationRate: 89, sowingDepth: "1cm", plantSpacing: "45cm", harvestTime: "50-60 days" },
    { type: "Spinach Seeds", variety: "Baby Spinach", seasons: ["winter", "autumn"], usageType: "farming", seedType: "vegetable", suitableFor: ["spinach"], germinationRate: 83, sowingDepth: "1cm", plantSpacing: "15cm", harvestTime: "40-50 days" },
    { type: "Onion Seeds", variety: "Red Onion", seasons: ["all_season"], usageType: "farming", seedType: "vegetable", suitableFor: ["onion"], germinationRate: 80, sowingDepth: "1cm", plantSpacing: "10cm", harvestTime: "120-150 days" },
    { type: "Coriander Seeds", variety: "Indian Coriander", seasons: ["winter", "all_season"], usageType: "farming", seedType: "vegetable", suitableFor: ["coriander"], germinationRate: 81, sowingDepth: "1cm", plantSpacing: "15cm", harvestTime: "40-45 days" },
    { type: "Watermelon Seeds", variety: "Sugar Baby Watermelon", seasons: ["summer"], usageType: "both", seedType: "fruit", suitableFor: ["watermelon"], germinationRate: 90, sowingDepth: "2cm", plantSpacing: "90cm", harvestTime: "70-85 days" },
    { type: "Muskmelon Seeds", variety: "Cantaloupe", seasons: ["summer", "spring"], usageType: "both", seedType: "fruit", suitableFor: ["muskmelon"], germinationRate: 88, sowingDepth: "2cm", plantSpacing: "75cm", harvestTime: "75-90 days" },
    { type: "Papaya Seeds", variety: "Red Lady Papaya", seasons: ["all_season"], usageType: "both", seedType: "fruit", suitableFor: ["papaya"], germinationRate: 85, sowingDepth: "1cm", plantSpacing: "180cm", harvestTime: "9-10 months" },
    { type: "Strawberry Seeds", variety: "Garden Strawberry", seasons: ["winter", "spring"], usageType: "both", seedType: "fruit", suitableFor: ["strawberry"], germinationRate: 75, sowingDepth: "0.3cm", plantSpacing: "30cm", harvestTime: "4-6 months" },
    { type: "Grapes Seeds", variety: "Green Grapes", seasons: ["spring", "summer"], usageType: "both", seedType: "fruit", suitableFor: ["grapes"], germinationRate: 72, sowingDepth: "1cm", plantSpacing: "180cm", harvestTime: "2-3 years" },
    { type: "Dragon Fruit Seeds", variety: "White-Fleshed Dragon Fruit", seasons: ["summer", "monsoon"], usageType: "both", seedType: "fruit", suitableFor: ["dragon fruit"], germinationRate: 80, sowingDepth: "0.5cm", plantSpacing: "300cm", harvestTime: "18-24 months" },
    { type: "Pomegranate Seeds", variety: "Bhagwa Pomegranate", seasons: ["all_season"], usageType: "both", seedType: "fruit", suitableFor: ["pomegranate"], germinationRate: 78, sowingDepth: "1cm", plantSpacing: "500cm", harvestTime: "2-3 years" },
    { type: "Guava Seeds", variety: "Pink Guava", seasons: ["all_season"], usageType: "both", seedType: "fruit", suitableFor: ["guava"], germinationRate: 82, sowingDepth: "1cm", plantSpacing: "600cm", harvestTime: "2-4 years" },
    { type: "Pumpkin Seeds", variety: "Sugar Pumpkin", seasons: ["monsoon", "autumn"], usageType: "both", seedType: "fruit", suitableFor: ["pumpkin"], germinationRate: 91, sowingDepth: "2cm", plantSpacing: "90cm", harvestTime: "75-100 days" },
    { type: "Passion Fruit Seeds", variety: "Purple Passion Fruit", seasons: ["monsoon", "summer"], usageType: "both", seedType: "fruit", suitableFor: ["passion fruit"], germinationRate: 77, sowingDepth: "1cm", plantSpacing: "300cm", harvestTime: "12-18 months" },
    { type: "Marigold Seeds", variety: "African Marigold", seasons: ["all_season"], usageType: "gardening", seedType: "flower", suitableFor: ["garden", "decoration"], germinationRate: 90, sowingDepth: "0.5cm", plantSpacing: "30cm", harvestTime: "45-60 days" },
    { type: "Rose Seeds", variety: "Hybrid Tea Rose", seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower", suitableFor: ["garden"], germinationRate: 70, sowingDepth: "0.5cm", plantSpacing: "60cm", harvestTime: "3-4 months" },
    { type: "Sunflower Seeds", variety: "Giant Sunflower", seasons: ["summer", "spring"], usageType: "gardening", seedType: "flower", suitableFor: ["garden", "landscaping"], germinationRate: 92, sowingDepth: "2cm", plantSpacing: "60cm", harvestTime: "70-90 days" },
    { type: "Hibiscus Seeds", variety: "Tropical Hibiscus", seasons: ["summer", "monsoon"], usageType: "gardening", seedType: "flower", suitableFor: ["garden"], germinationRate: 80, sowingDepth: "1cm", plantSpacing: "90cm", harvestTime: "3-4 months" },
    { type: "Jasmine Seeds", variety: "Arabian Jasmine", seasons: ["spring", "summer"], usageType: "gardening", seedType: "flower", suitableFor: ["garden"], germinationRate: 75, sowingDepth: "0.5cm", plantSpacing: "60cm", harvestTime: "2-3 months" },
    { type: "Zinnia Seeds", variety: "Giant Zinnia", seasons: ["summer"], usageType: "gardening", seedType: "flower", suitableFor: ["garden", "decoration"], germinationRate: 88, sowingDepth: "0.5cm", plantSpacing: "30cm", harvestTime: "45-65 days" },
    { type: "Dahlia Seeds", variety: "Dinner Plate Dahlia", seasons: ["spring", "autumn"], usageType: "gardening", seedType: "flower", suitableFor: ["garden"], germinationRate: 78, sowingDepth: "0.5cm", plantSpacing: "60cm", harvestTime: "2-3 months" },
    { type: "Cosmos Seeds", variety: "Pink Cosmos", seasons: ["summer", "monsoon"], usageType: "gardening", seedType: "flower", suitableFor: ["garden", "landscaping"], germinationRate: 89, sowingDepth: "0.5cm", plantSpacing: "30cm", harvestTime: "50-60 days" },
    { type: "Petunia Seeds", variety: "Grandiflora Petunia", seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower", suitableFor: ["garden", "decoration"], germinationRate: 82, sowingDepth: "0.2cm", plantSpacing: "30cm", harvestTime: "60-75 days" },
    { type: "Gerbera Seeds", variety: "Red Gerbera", seasons: ["spring", "winter"], usageType: "gardening", seedType: "flower", suitableFor: ["garden", "decoration"], germinationRate: 76, sowingDepth: "0.3cm", plantSpacing: "30cm", harvestTime: "3-4 months" }
];

const SUPPLIER2_DATA = [
    { type: "Tomato Seeds", variety: "Roma Tomato", germinationRate: 85 },
    { type: "Chilli Seeds", variety: "Red Chilli", germinationRate: 82 },
    { type: "Capsicum Seeds", variety: "Yellow Capsicum", germinationRate: 88 },
    { type: "Brinjal Seeds", variety: "Long Brinjal", germinationRate: 80 },
    { type: "Okra Seeds", variety: "Green Okra", germinationRate: 91 },
    { type: "Cauliflower Seeds", variety: "Purple Cauliflower", germinationRate: 78 },
    { type: "Cucumber Seeds", variety: "Pickling Cucumber", germinationRate: 84 },
    { type: "Spinach Seeds", variety: "Flat-Leaf Spinach", germinationRate: 87 },
    { type: "Onion Seeds", variety: "White Onion", germinationRate: 83 },
    { type: "Coriander Seeds", variety: "Slow-Bolt Coriander", germinationRate: 89 },
    { type: "Watermelon Seeds", variety: "Crimson Sweet Watermelon", germinationRate: 86 },
    { type: "Muskmelon Seeds", variety: "Honeydew Melon", germinationRate: 84 },
    { type: "Papaya Seeds", variety: "Hawaiian Papaya", germinationRate: 81 },
    { type: "Strawberry Seeds", variety: "Alpine Strawberry", germinationRate: 80 },
    { type: "Grapes Seeds", variety: "Red Grapes", germinationRate: 79 },
    { type: "Dragon Fruit Seeds", variety: "Red-Fleshed Dragon Fruit", germinationRate: 83 },
    { type: "Pomegranate Seeds", variety: "Arakta Pomegranate", germinationRate: 87 },
    { type: "Guava Seeds", variety: "White Guava", germinationRate: 85 },
    { type: "Pumpkin Seeds", variety: "Giant Pumpkin", germinationRate: 90 },
    { type: "Passion Fruit Seeds", variety: "Yellow Passion Fruit", germinationRate: 82 },
    { type: "Marigold Seeds", variety: "French Marigold", germinationRate: 88 },
    { type: "Rose Seeds", variety: "Climbing Rose", germinationRate: 72 },
    { type: "Sunflower Seeds", variety: "Dwarf Sunflower", germinationRate: 89 },
    { type: "Hibiscus Seeds", variety: "Hardy Hibiscus", germinationRate: 84 },
    { type: "Jasmine Seeds", variety: "Night-Blooming Jasmine", germinationRate: 78 },
    { type: "Zinnia Seeds", variety: "Dwarf Zinnia", germinationRate: 86 },
    { type: "Dahlia Seeds", variety: "Pompon Dahlia", germinationRate: 81 },
    { type: "Cosmos Seeds", variety: "White Cosmos", germinationRate: 85 },
    { type: "Petunia Seeds", variety: "Multiflora Petunia", germinationRate: 88 },
    { type: "Gerbera Seeds", variety: "Pink Gerbera", germinationRate: 80 }
];

async function seedSupplierProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const admin = await User.findOne({ role: 'admin' });
        const s1 = await User.findById(S1_ID);
        const s2 = await User.findById(S2_ID);

        if (!s1 || !s2 || !admin) throw new Error("Supplier or admin not found!");

        const seedsMain = await Category.findOne({ name: "Seeds", level: "main" });
        const vegSub = await Category.findOne({ name: "Vegetable Seeds", level: "sub" });
        const fruitSub = await Category.findOne({ name: "Fruit Seeds", level: "sub" });
        const flowerSub = await Category.findOne({ name: "Flower Seeds", level: "sub" });

        if (!seedsMain || !vegSub || !fruitSub || !flowerSub)
            throw new Error("Categories not found! Run seedCategoriesWithVarieties.js first.");

        const subMap = { vegetable: vegSub, fruit: fruitSub, flower: flowerSub };

        await Product.deleteMany({
            seller: { $in: [s1._id, s2._id] },
            'category.main': seedsMain._id
        });
        console.log('Deleted existing supplier seed products');

        let insertedCount = 0;

        const suppliersArr = [
            { id: s1._id, data: SUPPLIER1_DATA },
            { id: s2._id, data: SUPPLIER2_DATA }
        ];

        for (const supplier of suppliersArr) {
            for (const item of supplier.data) {
                try {
                    const typeDoc = await Category.findOne({ name: item.type, level: "type" });
                    if (!typeDoc) {
                        console.warn(`[SKIP] Type not found: ${item.type}`);
                        continue;
                    }

                    const variety = await ProductVariety.findOne({
                        name: item.variety,
                        productType: typeDoc._id,
                        approvalStatus: "approved"
                    });
                    if (!variety) {
                        console.warn(`[SKIP] Variety not found: ${item.variety} for ${item.type}`);
                        continue;
                    }

                    // Merge Supplier 1 metadata into Supplier 2 items if missing
                    const meta = item.usageType ? item : SUPPLIER1_DATA.find(x => x.type === item.type);

                    const productDoc = {
                        name: `${item.variety} Seeds`,
                        description: `${item.variety} seeds are high-quality hybrid seeds with excellent yield potential. Ideal for ${meta.usageType} and professional cultivation.`,
                        category: {
                            main: seedsMain._id,
                            sub: subMap[meta.seedType]._id,
                            type: typeDoc._id,
                            variety: variety._id
                        },
                        seller: supplier.id,
                        pricing: {
                            basePrice: PRICING[meta.seedType].p1,
                            hasOffer: false,
                            offerType: "none",
                            offerValue: 0,
                            finalPrice: PRICING[meta.seedType].p1,
                            discount: 0
                        },
                        variants: makeVariants(meta.seedType),
                        unit: "kg",
                        stock: 0,
                        lowStockThreshold: 1,
                        images: [{
                            url: `https://source.unsplash.com/400x400/?${item.variety.replace(/\s+/g, '')},seeds`,
                            publicId: "placeholder",
                            filename: "placeholder.jpg"
                        }],
                        hasExpiry: true,
                        expiryDate: new Date("2027-12-31"),
                        seasons: meta.seasons,
                        suitableFor: meta.suitableFor,
                        usageType: meta.usageType,
                        seedDetails: {
                            seedType: meta.seedType,
                            variety: item.variety,
                            germinationRate: item.germinationRate,
                            sowingDepth: meta.sowingDepth,
                            plantSpacing: meta.plantSpacing,
                            harvestTime: meta.harvestTime,
                            hybrid: true
                        },
                        safetyInstructions: {
                            dosage: "Sow 2-3 seeds per meter",
                            applicationMethod: "Direct sowing or transplant",
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
                            bulkDiscount: 10
                        },
                        bulkMinQuantity: 3
                    };

                    await Product.create(productDoc);
                    insertedCount++;
                } catch (err) {
                    console.error(`Error inserting ${item.variety}:`, err.message);
                }
            }
        }

        console.log(`Inserted ${insertedCount}/60 supplier products`);
    } catch (err) {
        console.error("Fatal Error:", err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seedSupplierProducts();
