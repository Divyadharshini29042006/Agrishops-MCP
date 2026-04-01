// backend/src/config/seedProducts.js
// Run: node src/config/seedProducts.js
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import ProductVariety from '../models/ProductVariety.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// ========== PRICING RULES ==========
const PRICING = {
    vegetable: { v10: 55, v25: 120, v50: 210 },
    fruit: { v10: 80, v25: 170, v50: 300 },
    flower: { v10: 45, v25: 95, v50: 165 },
};

function makeVariants(priceKey) {
    const p = PRICING[priceKey];
    return [
        { size: '10 gm', quantity: 10, unit: 'gm', basePrice: p.v10, finalPrice: p.v10, discountPercentage: 0, stock: 150, isDefault: true },
        { size: '25 gm', quantity: 25, unit: 'gm', basePrice: p.v25, finalPrice: p.v25, discountPercentage: 0, stock: 100, isDefault: false },
        { size: '50 gm', quantity: 50, unit: 'gm', basePrice: p.v50, finalPrice: p.v50, discountPercentage: 0, stock: 75, isDefault: false },
    ];
}

// ========== PRODUCT DEFINITIONS ==========
// Format: { typeName, varietyName, seasons, usageType, seedType, subRef, description, suitableFor, germinationRate, sowingDepth, plantSpacing, harvestTime }

const SUPPLIER1_PRODUCTS = [
    // VEGETABLE SEEDS (sub: vegSub)
    { typeName: 'Tomato Seeds', varietyName: 'Cherry Tomato', seasons: ['summer', 'monsoon'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Cherry Tomato seeds produce compact plants with abundant clusters of sweet, bite-sized fruits. Ideal for home gardens and commercial farming with excellent yield potential.', suitableFor: ['tomato'], germinationRate: 88, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '60-75 days' },
    { typeName: 'Spinach Seeds', varietyName: 'Baby Spinach', seasons: ['winter', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Baby Spinach seeds grow into tender, small-leafed plants perfect for fresh salads and cooking. These fast-maturing seeds are rich in iron and vitamins.', suitableFor: ['spinach'], germinationRate: 85, sowingDepth: '1 cm', plantSpacing: '15-20 cm', harvestTime: '30-40 days' },
    { typeName: 'Coriander Seeds', varietyName: 'Indian Coriander', seasons: ['winter', 'all_season'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Indian Coriander seeds produce aromatic plants widely used in Indian cuisine. These high-yield seeds thrive in cool weather and provide both leaves and seeds for culinary use.', suitableFor: ['coriander'], germinationRate: 82, sowingDepth: '1 cm', plantSpacing: '15-20 cm', harvestTime: '45-60 days' },
    { typeName: 'Broccoli Seeds', varietyName: 'Calabrese Broccoli', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Calabrese Broccoli seeds produce large, dense green heads with a rich nutritional profile. These cold-weather crops are ideal for winter cultivation and health-conscious markets.', suitableFor: ['broccoli'], germinationRate: 87, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '75-90 days' },
    { typeName: 'Lettuce Seeds', varietyName: 'Iceberg Lettuce', seasons: ['winter', 'spring'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Iceberg Lettuce seeds produce crisp, tightly packed heads with mild flavor. These fast-growing seeds are highly popular in salad production and restaurant supply chains.', suitableFor: ['lettuce'], germinationRate: 90, sowingDepth: '0.3 cm', plantSpacing: '30-35 cm', harvestTime: '65-80 days' },
    { typeName: 'Beetroot Seeds', varietyName: 'Red Beetroot', seasons: ['winter', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Red Beetroot seeds develop into deep-crimson roots with earthy, sweet flavor. Rich in antioxidants and dietary fiber, these are in high demand for health food markets.', suitableFor: ['beetroot'], germinationRate: 83, sowingDepth: '2 cm', plantSpacing: '10-15 cm', harvestTime: '55-70 days' },
    { typeName: 'Peas Seeds', varietyName: 'Garden Peas', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Garden Peas seeds produce tender, sweet pods especially suited for winter cultivation. These high-protein legumes improve soil nitrogen and offer excellent market value.', suitableFor: ['peas'], germinationRate: 86, sowingDepth: '3 cm', plantSpacing: '5-7 cm', harvestTime: '60-70 days' },
    { typeName: 'French Beans Seeds', varietyName: 'Green French Beans', seasons: ['monsoon', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Green French Beans seeds grow into bushy plants producing slender, tender pods. These quick-maturing beans are ideal for both fresh market and processing industries.', suitableFor: ['beans'], germinationRate: 84, sowingDepth: '3-4 cm', plantSpacing: '20-25 cm', harvestTime: '50-60 days' },
    { typeName: 'Onion Seeds', varietyName: 'Red Onion', seasons: ['all_season'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Red Onion seeds produce pungent, deep-red bulbs with excellent storage quality. A staple crop in Indian agriculture with strong market demand throughout the year.', suitableFor: ['onion'], germinationRate: 80, sowingDepth: '1 cm', plantSpacing: '10-15 cm', harvestTime: '90-120 days' },
    { typeName: 'Sweet Corn Seeds', varietyName: 'Yellow Sweet Corn', seasons: ['monsoon', 'summer'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Yellow Sweet Corn seeds produce tall plants with large, golden cobs loaded with sweet kernels. These high-energy crops are popular in both fresh and processed food markets.', suitableFor: ['corn'], germinationRate: 88, sowingDepth: '3-4 cm', plantSpacing: '25-30 cm', harvestTime: '75-90 days' },
    // FRUIT SEEDS (sub: fruitSub)
    { typeName: 'Watermelon Seeds', varietyName: 'Sugar Baby Watermelon', seasons: ['summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Sugar Baby Watermelon seeds produce compact, round fruits with deep red flesh and high sugar content. These early-maturing varieties are perfect for small farms and kitchen gardens.', suitableFor: ['watermelon'], germinationRate: 88, sowingDepth: '2 cm', plantSpacing: '60-90 cm', harvestTime: '70-80 days' },
    { typeName: 'Muskmelon Seeds', varietyName: 'Cantaloupe', seasons: ['summer', 'spring'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Cantaloupe seeds grow into vines producing fragrant, net-skinned melons with orange, sweet flesh. High water content and rich beta-carotene make these highly marketable.', suitableFor: ['muskmelon'], germinationRate: 85, sowingDepth: '2 cm', plantSpacing: '60-90 cm', harvestTime: '75-85 days' },
    { typeName: 'Papaya Seeds', varietyName: 'Red Lady Papaya', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Red Lady Papaya seeds produce dwarf plants that bear within 9-11 months with red-fleshed, sweet fruits. These are disease-resistant and high-yielding for tropical climates.', suitableFor: ['papaya'], germinationRate: 82, sowingDepth: '1.5 cm', plantSpacing: '180-250 cm', harvestTime: '270-330 days' },
    { typeName: 'Strawberry Seeds', varietyName: 'Garden Strawberry', seasons: ['winter', 'spring'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Garden Strawberry seeds produce heart-shaped fruits with sweet-tart flavor, rich in vitamin C. Ideal for polyhouse cultivation and high-value fresh fruit markets.', suitableFor: ['strawberry'], germinationRate: 80, sowingDepth: '0.2 cm', plantSpacing: '25-30 cm', harvestTime: '90-120 days' },
    { typeName: 'Grapes Seeds', varietyName: 'Green Grapes', seasons: ['spring', 'summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Green Grapes seeds develop into vigorous vines producing crisp, seedless-type clusters in warm climates. Popular for table use and juice production with high sugar content.', suitableFor: ['grapes'], germinationRate: 81, sowingDepth: '2 cm', plantSpacing: '180-240 cm', harvestTime: '120-150 days' },
    { typeName: 'Passion Fruit Seeds', varietyName: 'Purple Passion Fruit', seasons: ['monsoon', 'summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Purple Passion Fruit seeds grow into vigorous climbing vines producing aromatic, tangy fruits rich in antioxidants. High demand in juice and flavoring industries.', suitableFor: ['passion fruit'], germinationRate: 83, sowingDepth: '1.5 cm', plantSpacing: '300-400 cm', harvestTime: '180-240 days' },
    { typeName: 'Dragon Fruit Seeds', varietyName: 'White-Fleshed Dragon Fruit', seasons: ['summer', 'monsoon'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'White-Fleshed Dragon Fruit seeds produce cactus-type plants with spectacular night-blooming flowers. These exotic fruits are prized for their mild taste and stunning appearance.', suitableFor: ['dragon fruit'], germinationRate: 80, sowingDepth: '0.5 cm', plantSpacing: '300-400 cm', harvestTime: '365-540 days' },
    { typeName: 'Pomegranate Seeds', varietyName: 'Bhagwa Pomegranate', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Bhagwa Pomegranate seeds develop into drought-tolerant trees producing large, bright red fruits with sweet arils. This export-quality variety commands premium prices in global markets.', suitableFor: ['pomegranate'], germinationRate: 82, sowingDepth: '2 cm', plantSpacing: '400-500 cm', harvestTime: '540-730 days' },
    { typeName: 'Guava Seeds', varietyName: 'Pink Guava', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Pink Guava seeds grow into prolific trees with fragrant, pink-fleshed fruits rich in vitamin C and lycopene. Known for their strong disease resistance and high productivity.', suitableFor: ['guava'], germinationRate: 81, sowingDepth: '1.5 cm', plantSpacing: '500-600 cm', harvestTime: '365-540 days' },
    { typeName: 'Pumpkin Seeds', varietyName: 'Sugar Pumpkin', seasons: ['monsoon', 'autumn'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Sugar Pumpkin seeds produce compact, round fruits with sweet, fine-grained flesh ideal for pies and cooking. These versatile crops also provide nutritious edible seeds.', suitableFor: ['pumpkin'], germinationRate: 86, sowingDepth: '2-3 cm', plantSpacing: '90-120 cm', harvestTime: '85-100 days' },
    // FLOWER SEEDS (sub: flowerSub)
    { typeName: 'Sunflower Seeds', varietyName: 'Giant Sunflower', seasons: ['summer', 'spring'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Giant Sunflower seeds produce towering plants reaching 3+ meters with massive, golden-yellow flower heads. These photogenic plants attract pollinators and provide edible seeds.', suitableFor: ['garden'], germinationRate: 90, sowingDepth: '2.5 cm', plantSpacing: '60 cm', harvestTime: '80-100 days' },
    { typeName: 'Hibiscus Seeds', varietyName: 'Tropical Hibiscus', seasons: ['summer', 'monsoon'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Tropical Hibiscus seeds produce vibrant, large flowers in reds, pinks, and oranges. Popular for ornamental purposes, and the flowers are also used in teas and traditional medicines.', suitableFor: ['garden'], germinationRate: 82, sowingDepth: '1 cm', plantSpacing: '90-120 cm', harvestTime: '120-180 days' },
    { typeName: 'Jasmine Seeds', varietyName: 'Arabian Jasmine', seasons: ['spring', 'summer'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Arabian Jasmine seeds produce compact, fragrant plants with white, delicate flowers used in perfumery and garlands. Ideal for container growing and traditional Indian gardens.', suitableFor: ['garden'], germinationRate: 80, sowingDepth: '0.5 cm', plantSpacing: '60-90 cm', harvestTime: '90-120 days' },
    { typeName: 'Petunia Seeds', varietyName: 'Grandiflora Petunia', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Grandiflora Petunia seeds produce large, trumpet-shaped flowers in vivid colors for vibrant garden displays. These prolific bloomers are perfect for hanging baskets and border planting.', suitableFor: ['garden'], germinationRate: 85, sowingDepth: '0.2 cm', plantSpacing: '25-30 cm', harvestTime: '60-75 days' },
    { typeName: 'Dahlia Seeds', varietyName: 'Dinner Plate Dahlia', seasons: ['spring', 'autumn'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Dinner Plate Dahlia seeds produce enormous flowers up to 30cm in diameter in a rainbow of rich colors. These showstopper flowers are prized for cut flower production and garden exhibitions.', suitableFor: ['garden'], germinationRate: 82, sowingDepth: '0.5 cm', plantSpacing: '90 cm', harvestTime: '90-120 days' },
    { typeName: 'Zinnia Seeds', varietyName: 'Giant Zinnia', seasons: ['summer'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Giant Zinnia seeds produce tall plants with large, vibrant, fully double flower heads in a wide color range. These heat-tolerant annuals are superb for cutting gardens and mass plantings.', suitableFor: ['garden'], germinationRate: 88, sowingDepth: '0.5 cm', plantSpacing: '30-45 cm', harvestTime: '60-70 days' },
    { typeName: 'Gerbera Seeds', varietyName: 'Red Gerbera', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Red Gerbera seeds produce cheerful, daisy-like flowers in bold red tones, popular in florist bouquets worldwide. They thrive in well-drained soil with good sunlight.', suitableFor: ['garden'], germinationRate: 80, sowingDepth: '0.3 cm', plantSpacing: '30-40 cm', harvestTime: '90-120 days' },
    { typeName: 'Cosmos Seeds', varietyName: 'Pink Cosmos', seasons: ['summer', 'monsoon'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Pink Cosmos seeds grow into feathery-foliaged plants bearing delicate pink, daisy-like flowers. These easy-to-grow annuals attract butterflies and are ideal for naturalizing garden spaces.', suitableFor: ['garden'], germinationRate: 87, sowingDepth: '0.5 cm', plantSpacing: '30-45 cm', harvestTime: '50-60 days' },
    { typeName: 'Rose Seeds', varietyName: 'Hybrid Tea Rose', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Hybrid Tea Rose seeds produce classic, high-centered blooms with elegant fragrance in a variety of colors. Ideal for formal gardens and commercial cut flower production.', suitableFor: ['garden'], germinationRate: 80, sowingDepth: '0.5 cm', plantSpacing: '60-90 cm', harvestTime: '180-365 days' },
    { typeName: 'Marigold Seeds', varietyName: 'African Marigold', seasons: ['all_season'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'African Marigold seeds produce large, pompom-like golden and orange flowers with strong pest-repelling properties. Widely used in festivals, religious ceremonies, and companion planting.', suitableFor: ['garden'], germinationRate: 90, sowingDepth: '0.5 cm', plantSpacing: '30-40 cm', harvestTime: '45-55 days' },
];

const SUPPLIER2_PRODUCTS = [
    // VEGETABLE SEEDS
    { typeName: 'Spinach Seeds', varietyName: 'Flat-Leaf Spinach', seasons: ['winter', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Flat-Leaf Spinach seeds produce wide, smooth leaves ideal for processing and cooking. These high-yield varieties are favored by commercial growers for their uniform size.', suitableFor: ['spinach'], germinationRate: 84, sowingDepth: '1 cm', plantSpacing: '15-20 cm', harvestTime: '30-40 days' },
    { typeName: 'Coriander Seeds', varietyName: 'Slow-Bolt Coriander', seasons: ['winter', 'all_season'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Slow-Bolt Coriander seeds are bred for delayed flowering, providing a longer leaf harvest window. These are perfect for warm climates where standard varieties bolt too quickly.', suitableFor: ['coriander'], germinationRate: 81, sowingDepth: '1 cm', plantSpacing: '15 cm', harvestTime: '40-50 days' },
    { typeName: 'Broccoli Seeds', varietyName: 'Purple Sprouting Broccoli', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Purple Sprouting Broccoli seeds produce beautiful purple heads that taste sweeter than green varieties. Harvested as multiple small side shoots over a long winter season.', suitableFor: ['broccoli'], germinationRate: 86, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '90-120 days' },
    { typeName: 'Bitter Gourd Seeds', varietyName: 'Long Bitter Gourd', seasons: ['summer', 'monsoon'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Long Bitter Gourd seeds produce dark green, elongated fruits with characteristic bitter taste. Rich in medicinal compounds, these are staples in Asian cooking and wellness markets.', suitableFor: ['bitter gourd'], germinationRate: 82, sowingDepth: '2-3 cm', plantSpacing: '60-90 cm', harvestTime: '55-65 days' },
    { typeName: 'Bottle Gourd Seeds', varietyName: 'Long Bottle Gourd', seasons: ['summer', 'monsoon'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Long Bottle Gourd seeds grow vigorous vines producing pale green, cylindrical gourds used in cooking and as containers. Highly water-efficient and productive crop.', suitableFor: ['bottle gourd'], germinationRate: 85, sowingDepth: '2-3 cm', plantSpacing: '90-120 cm', harvestTime: '50-60 days' },
    { typeName: 'Ridge Gourd Seeds', varietyName: 'Ribbed Ridge Gourd', seasons: ['summer', 'monsoon'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Ribbed Ridge Gourd seeds produce tender, fibrous gourds with distinctive longitudinal ridges. Popular in South Indian cuisine and ayurvedic practices for their cooling properties.', suitableFor: ['ridge gourd'], germinationRate: 83, sowingDepth: '2-3 cm', plantSpacing: '60-90 cm', harvestTime: '50-60 days' },
    { typeName: 'Pumpkin Seeds', varietyName: 'Giant Pumpkin', seasons: ['monsoon', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Giant Pumpkin seeds can produce fruits weighing hundreds of kilograms under optimal conditions. Ideal for competitions, large-scale processing, and animal feed production.', suitableFor: ['pumpkin'], germinationRate: 87, sowingDepth: '2-3 cm', plantSpacing: '150-200 cm', harvestTime: '100-120 days' },
    { typeName: 'Cabbage Seeds', varietyName: 'Green Cabbage', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Green Cabbage seeds produce tightly packed heads with crisp, sweet leaves ideal for fresh markets and coleslaw. Cold-hardy varieties with excellent shelf life and transport tolerance.', suitableFor: ['cabbage'], germinationRate: 88, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '75-100 days' },
    { typeName: 'Carrot Seeds', varietyName: 'Orange Carrot', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Orange Carrot seeds develop into uniform, deep-orange roots packed with beta-carotene in loose, well-drained soil. Ideal for fresh market and juice processing applications.', suitableFor: ['carrot'], germinationRate: 80, sowingDepth: '0.5 cm', plantSpacing: '5-7 cm', harvestTime: '70-80 days' },
    { typeName: 'Brinjal Seeds', varietyName: 'Purple Brinjal', seasons: ['summer', 'monsoon'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Purple Brinjal seeds produce glossy, deep-purple elongated fruits with firm, mild-flavored flesh. One of the most widely consumed vegetables in Indian households and restaurants.', suitableFor: ['brinjal'], germinationRate: 84, sowingDepth: '0.5 cm', plantSpacing: '60-75 cm', harvestTime: '70-90 days' },
    // FRUIT SEEDS
    { typeName: 'Pumpkin Seeds', varietyName: 'Miniature Pumpkin', seasons: ['monsoon', 'autumn'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Miniature Pumpkin seeds produce small, decorative fruits in bright orange tones perfect for table decorations and specialty markets. These novelty vegetables command excellent retail prices.', suitableFor: ['pumpkin'], germinationRate: 85, sowingDepth: '2 cm', plantSpacing: '90-120 cm', harvestTime: '85-95 days' },
    { typeName: 'Guava Seeds', varietyName: 'White Guava', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'White Guava seeds develop into productive trees bearing large, cream-fleshed fruits with a mild, sweet flavor. Excellent for processing into juice, jam, and dried fruit products.', suitableFor: ['guava'], germinationRate: 80, sowingDepth: '1.5 cm', plantSpacing: '500-600 cm', harvestTime: '365-540 days' },
    { typeName: 'Pomegranate Seeds', varietyName: 'Arakta Pomegranate', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Arakta Pomegranate seeds produce large, deep-red fruits with soft-seeded, juicy arils. Known for their high anthocyanin content and preferred by juice extract manufacturers.', suitableFor: ['pomegranate'], germinationRate: 81, sowingDepth: '2 cm', plantSpacing: '400-500 cm', harvestTime: '540-730 days' },
    { typeName: 'Dragon Fruit Seeds', varietyName: 'Red-Fleshed Dragon Fruit', seasons: ['summer', 'monsoon'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Red-Fleshed Dragon Fruit seeds grow into climbing cactus producing vibrant magenta-fleshed fruits rich in antioxidants. Premium variety with superior taste and high market value.', suitableFor: ['dragon fruit'], germinationRate: 80, sowingDepth: '0.5 cm', plantSpacing: '300-400 cm', harvestTime: '365-540 days' },
    { typeName: 'Passion Fruit Seeds', varietyName: 'Yellow Passion Fruit', seasons: ['monsoon', 'summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Yellow Passion Fruit seeds produce vigorous vines with aromatic, tangy fruits that are larger than purple varieties. Preferred by the beverage industry for their high juice yield.', suitableFor: ['passion fruit'], germinationRate: 82, sowingDepth: '1.5 cm', plantSpacing: '300-400 cm', harvestTime: '180-240 days' },
    { typeName: 'Grapes Seeds', varietyName: 'Red Grapes', seasons: ['spring', 'summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Red Grapes seeds produce lush vines bearing deep crimson clusters with rich, complex flavor. Popular for table use, wine making, and raisin production in commercial viticulture.', suitableFor: ['grapes'], germinationRate: 81, sowingDepth: '2 cm', plantSpacing: '180-240 cm', harvestTime: '120-150 days' },
    { typeName: 'Strawberry Seeds', varietyName: 'Alpine Strawberry', seasons: ['winter', 'spring'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Alpine Strawberry seeds produce small, intensely flavored fruits with a sweet, aromatic quality superior to commercial varieties. Perfect for gourmet markets and artisan producers.', suitableFor: ['strawberry'], germinationRate: 79, sowingDepth: '0.2 cm', plantSpacing: '20-25 cm', harvestTime: '60-90 days' },
    { typeName: 'Papaya Seeds', varietyName: 'Hawaiian Papaya', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Hawaiian Papaya seeds produce small, pear-shaped fruits with buttery, sweet flesh and high papain enzyme content. Compact trees are ideal for intensive planting systems.', suitableFor: ['papaya'], germinationRate: 83, sowingDepth: '1.5 cm', plantSpacing: '180-250 cm', harvestTime: '270-330 days' },
    { typeName: 'Muskmelon Seeds', varietyName: 'Honeydew Melon', seasons: ['summer', 'spring'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Honeydew Melon seeds produce smooth-skinned, oval melons with pale green, honey-sweet flesh. These high-sugar varieties are prized in premium fresh produce markets.', suitableFor: ['muskmelon'], germinationRate: 84, sowingDepth: '2 cm', plantSpacing: '60-90 cm', harvestTime: '80-90 days' },
    { typeName: 'Watermelon Seeds', varietyName: 'Crimson Sweet Watermelon', seasons: ['summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Crimson Sweet Watermelon seeds produce oval, striped fruits with bright red, crispy flesh and high sugar content. A classic commercial variety with excellent transport tolerance.', suitableFor: ['watermelon'], germinationRate: 88, sowingDepth: '2 cm', plantSpacing: '60-90 cm', harvestTime: '80-90 days' },
    // FLOWER SEEDS
    { typeName: 'Sunflower Seeds', varietyName: 'Dwarf Sunflower', seasons: ['summer', 'spring'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Dwarf Sunflower seeds produce compact plants with cheerful, bright-yellow blooms perfect for pots and containers. Great for school gardens and small urban spaces.', suitableFor: ['garden'], germinationRate: 89, sowingDepth: '2 cm', plantSpacing: '30 cm', harvestTime: '65-75 days' },
    { typeName: 'Hibiscus Seeds', varietyName: 'Hardy Hibiscus', seasons: ['summer', 'monsoon'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Hardy Hibiscus seeds produce cold-tolerant plants with massive, plate-sized flowers in vibrant pinks and reds. These perennial-acting varieties return season after season.', suitableFor: ['garden'], germinationRate: 81, sowingDepth: '1 cm', plantSpacing: '90-120 cm', harvestTime: '120-180 days' },
    { typeName: 'Jasmine Seeds', varietyName: 'Night-Blooming Jasmine', seasons: ['spring', 'summer'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Night-Blooming Jasmine seeds produce star-shaped flowers that release their intoxicating fragrance after sunset. Popular in Indian home gardens for its intense, long-lasting scent.', suitableFor: ['garden'], germinationRate: 79, sowingDepth: '0.5 cm', plantSpacing: '60-90 cm', harvestTime: '90-120 days' },
    { typeName: 'Petunia Seeds', varietyName: 'Multiflora Petunia', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Multiflora Petunia seeds produce masses of smaller flowers in a wide color range on compact, weather-resistant plants. Exceptional for bedding displays and mass plantings.', suitableFor: ['garden'], germinationRate: 84, sowingDepth: '0.2 cm', plantSpacing: '20-25 cm', harvestTime: '55-65 days' },
    { typeName: 'Dahlia Seeds', varietyName: 'Pompon Dahlia', seasons: ['spring', 'autumn'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Pompon Dahlia seeds produce perfectly spherical, densely petaled flowers in vibrant jewel tones. These compact blooms are highly sought after in floral arrangements and bouquet making.', suitableFor: ['garden'], germinationRate: 81, sowingDepth: '0.5 cm', plantSpacing: '60 cm', harvestTime: '90-120 days' },
    { typeName: 'Zinnia Seeds', varietyName: 'Dwarf Zinnia', seasons: ['summer'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Dwarf Zinnia seeds produce compact, fully double flowers in vibrant warm colors on low-maintenance plants. Ideal for edging garden paths and filling small container arrangements.', suitableFor: ['garden'], germinationRate: 87, sowingDepth: '0.5 cm', plantSpacing: '20-25 cm', harvestTime: '50-60 days' },
    { typeName: 'Gerbera Seeds', varietyName: 'Pink Gerbera', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Pink Gerbera seeds produce bright, cheerful flowers with long stems ideal for cutting. One of the top commercially grown cut flowers with excellent vase life.', suitableFor: ['garden'], germinationRate: 80, sowingDepth: '0.3 cm', plantSpacing: '30-40 cm', harvestTime: '90-120 days' },
    { typeName: 'Cosmos Seeds', varietyName: 'White Cosmos', seasons: ['summer', 'monsoon'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'White Cosmos seeds produce delicate, pure white daisy-like blooms on airy, feathery foliage. These elegant flowers create a serene atmosphere in cottage gardens and wedding decor.', suitableFor: ['garden'], germinationRate: 86, sowingDepth: '0.5 cm', plantSpacing: '30-45 cm', harvestTime: '50-60 days' },
    { typeName: 'Rose Seeds', varietyName: 'Climbing Rose', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Climbing Rose seeds grow into vigorous canes producing clusters of blooms perfect for covering arches and trellises. Adds romantic vertical interest to any garden space.', suitableFor: ['garden'], germinationRate: 79, sowingDepth: '0.5 cm', plantSpacing: '120-180 cm', harvestTime: '180-365 days' },
    { typeName: 'Marigold Seeds', varietyName: 'French Marigold', seasons: ['all_season'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'French Marigold seeds produce compact, bushy plants with bicolor blooms in yellow and orange tones. Excellent as companion plants for repelling pests from vegetable gardens.', suitableFor: ['garden'], germinationRate: 91, sowingDepth: '0.5 cm', plantSpacing: '20-25 cm', harvestTime: '45-55 days' },
];

const SUPPLIER3_PRODUCTS = [
    // VEGETABLE SEEDS
    { typeName: 'Spinach Seeds', varietyName: 'Savoy Spinach', seasons: ['winter', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Savoy Spinach seeds produce crinkled, dark-green leaves with robust flavor ideal for cooking and wilted salads. The textured surface holds dressings and seasonings exceptionally well.', suitableFor: ['spinach'], germinationRate: 83, sowingDepth: '1 cm', plantSpacing: '15-20 cm', harvestTime: '35-45 days' },
    { typeName: 'Coriander Seeds', varietyName: 'Vietnamese Coriander', seasons: ['winter', 'all_season'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Vietnamese Coriander seeds produce pointed leaves with a stronger, more peppery flavor than common coriander. Heat-tolerant variety excellent for tropical and subtropical cultivation.', suitableFor: ['coriander'], germinationRate: 80, sowingDepth: '1 cm', plantSpacing: '15 cm', harvestTime: '40-55 days' },
    { typeName: 'Broccoli Seeds', varietyName: 'Romanesco Broccoli', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Romanesco Broccoli seeds produce cone-shaped, lime-green heads with mesmerizing fractal spiral patterns. This visually stunning vegetable commands premium prices in gourmet markets.', suitableFor: ['broccoli'], germinationRate: 85, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '75-100 days' },
    { typeName: 'Capsicum Seeds', varietyName: 'Green Capsicum', seasons: ['winter', 'spring'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Green Capsicum seeds produce blocky, crisp, sweet bell peppers in attractive green colors. These high-yield varieties are widely used in Indian cooking, salads, and stir-fries.', suitableFor: ['capsicum'], germinationRate: 84, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '70-90 days' },
    { typeName: 'Cauliflower Seeds', varietyName: 'White Cauliflower', seasons: ['winter'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'White Cauliflower seeds produce large, dense, snow-white curds with mild, nutty flavor. A staple winter vegetable with consistent market demand throughout India.', suitableFor: ['cauliflower'], germinationRate: 87, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '65-80 days' },
    { typeName: 'Okra Seeds', varietyName: 'Hybrid Okra', seasons: ['summer'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Hybrid Okra seeds produce high-yielding plants with tender, ridged pods ideal for summer cultivation. These heat-loving annuals produce abundantly in tropical and subtropical climates.', suitableFor: ['okra'], germinationRate: 86, sowingDepth: '2-3 cm', plantSpacing: '45-60 cm', harvestTime: '50-60 days' },
    { typeName: 'Radish Seeds', varietyName: 'White Radish', seasons: ['winter', 'autumn'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'White Radish seeds produce long, cylindrical, snow-white roots with mild, crisp texture. Widely used in Asian cuisine and pickling industry with fast turnaround for farmers.', suitableFor: ['radish'], germinationRate: 88, sowingDepth: '1-2 cm', plantSpacing: '10-15 cm', harvestTime: '25-35 days' },
    { typeName: 'Cucumber Seeds', varietyName: 'English Cucumber', seasons: ['summer', 'spring'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'English Cucumber seeds produce long, dark-green, smooth-skinned cucumbers with no bitterness and thin edible skin. Preferred by premium retailers and salad manufacturers.', suitableFor: ['cucumber'], germinationRate: 87, sowingDepth: '1.5 cm', plantSpacing: '45-60 cm', harvestTime: '50-60 days' },
    { typeName: 'Sweet Corn Seeds', varietyName: 'White Sweet Corn', seasons: ['monsoon', 'summer'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'White Sweet Corn seeds produce pure-white kernels with exceptional sweetness and tenderness. Considered a premium variety in gourmet markets and upscale restaurant supply chains.', suitableFor: ['corn'], germinationRate: 87, sowingDepth: '3-4 cm', plantSpacing: '25-30 cm', harvestTime: '75-90 days' },
    { typeName: 'Chilli Seeds', varietyName: 'Green Chilli', seasons: ['summer', 'monsoon'], usageType: 'farming', seedType: 'vegetable', subRef: 'vegSub', description: 'Green Chilli seeds produce pungent, fiery peppers essential in Indian cooking and condiment manufacturing. These high-yield varieties are adaptable to diverse agroclimatic zones.', suitableFor: ['chilli'], germinationRate: 83, sowingDepth: '0.5 cm', plantSpacing: '45-60 cm', harvestTime: '60-90 days' },
    // FRUIT SEEDS
    { typeName: 'Watermelon Seeds', varietyName: 'Yellow Watermelon', seasons: ['summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Yellow Watermelon seeds produce unique golden-fleshed fruits that are sweeter than red varieties with lower lycopene content. A novelty variety commanding premium prices in specialty markets.', suitableFor: ['watermelon'], germinationRate: 86, sowingDepth: '2 cm', plantSpacing: '60-90 cm', harvestTime: '70-85 days' },
    { typeName: 'Muskmelon Seeds', varietyName: 'Galia Melon', seasons: ['summer', 'spring'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Galia Melon seeds produce round fruits with netted skin and sweet green flesh with floral overtones. A specialty melon variety with growing demand in premium retail outlets.', suitableFor: ['muskmelon'], germinationRate: 83, sowingDepth: '2 cm', plantSpacing: '60-90 cm', harvestTime: '70-80 days' },
    { typeName: 'Strawberry Seeds', varietyName: 'Wild Strawberry', seasons: ['winter', 'spring'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Wild Strawberry seeds produce small, intensely aromatic fruits with concentrated sweetness that surpasses commercial varieties. Ideal for gourmet desserts, artisan jams, and premium markets.', suitableFor: ['strawberry'], germinationRate: 78, sowingDepth: '0.2 cm', plantSpacing: '20-25 cm', harvestTime: '90-120 days' },
    { typeName: 'Passion Fruit Seeds', varietyName: 'Yellow Passion Fruit', seasons: ['monsoon', 'summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Yellow Passion Fruit seeds produce vigorous vines bearing aromatic, acidic fruits with high juice yield. The tropical flavor profile makes it ideal for beverage and dessert manufacturing.', suitableFor: ['passion fruit'], germinationRate: 82, sowingDepth: '1.5 cm', plantSpacing: '300-400 cm', harvestTime: '180-240 days' },
    { typeName: 'Pomegranate Seeds', varietyName: 'Ruby Pomegranate', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Ruby Pomegranate seeds develop into medium-sized trees producing rich-ruby arils with a balanced sweet-tart flavor. This variety is prized for fresh consumption and premium juice extraction.', suitableFor: ['pomegranate'], germinationRate: 80, sowingDepth: '2 cm', plantSpacing: '400-500 cm', harvestTime: '540-730 days' },
    { typeName: 'Guava Seeds', varietyName: 'Apple Guava', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Apple Guava seeds produce medium-sized, round fruits with crisp white flesh and strong, sweet fragrance. These exceptionally high vitamin C fruits are popular for fresh eating and processing.', suitableFor: ['guava'], germinationRate: 81, sowingDepth: '1.5 cm', plantSpacing: '500-600 cm', harvestTime: '365-540 days' },
    { typeName: 'Pumpkin Seeds', varietyName: "Jack-o'-Lantern Pumpkin", seasons: ['monsoon', 'autumn'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: "Jack-o'-Lantern Pumpkin seeds produce classic, round-to-oval bright orange fruits with a smooth surface ideal for carving and cooking. Dual-purpose variety popular for seasonal festive markets.", suitableFor: ['pumpkin'], germinationRate: 87, sowingDepth: '2-3 cm', plantSpacing: '90-120 cm', harvestTime: '90-110 days' },
    { typeName: 'Dragon Fruit Seeds', varietyName: 'Yellow Dragon Fruit', seasons: ['summer', 'monsoon'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Yellow Dragon Fruit seeds grow into spineless-stemmed cacti bearing sunny-yellow skin fruits with white, sweet flesh. The rarest and most expensive commercial dragon fruit variety.', suitableFor: ['dragon fruit'], germinationRate: 79, sowingDepth: '0.5 cm', plantSpacing: '300-400 cm', harvestTime: '365-540 days' },
    { typeName: 'Grapes Seeds', varietyName: 'Black Grapes', seasons: ['spring', 'summer'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Black Grapes seeds produce deep-purple to black clusters rich in resveratrol and anthocyanins. Popular for table use, wine making, and dried raisin production.', suitableFor: ['grapes'], germinationRate: 80, sowingDepth: '2 cm', plantSpacing: '180-240 cm', harvestTime: '120-150 days' },
    { typeName: 'Papaya Seeds', varietyName: 'Mexican Papaya', seasons: ['all_season'], usageType: 'both', seedType: 'fruit', subRef: 'fruitSub', description: 'Mexican Papaya seeds produce large trees with big, oval fruits often weighing 3-5 kg. Perfect for large-scale food processing operations requiring high pulp volume.', suitableFor: ['papaya'], germinationRate: 82, sowingDepth: '1.5 cm', plantSpacing: '200-300 cm', harvestTime: '270-330 days' },
    // FLOWER SEEDS
    { typeName: 'Sunflower Seeds', varietyName: 'Multi-Head Sunflower', seasons: ['summer', 'spring'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Multi-Head Sunflower seeds produce branching plants bearing numerous smaller blooms over an extended season. Excellent for cutting gardens and continuous floral supply.', suitableFor: ['garden'], germinationRate: 89, sowingDepth: '2 cm', plantSpacing: '45-60 cm', harvestTime: '70-85 days' },
    { typeName: 'Hibiscus Seeds', varietyName: 'Rose of Sharon', seasons: ['summer', 'monsoon'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Rose of Sharon seeds produce upright, multi-stemmed shrubs with abundant hollyhock-like flowers in pink, white, and lavender. Easy-care plants ideal for garden borders and hedges.', suitableFor: ['garden'], germinationRate: 80, sowingDepth: '1 cm', plantSpacing: '90-120 cm', harvestTime: '120-365 days' },
    { typeName: 'Jasmine Seeds', varietyName: 'Star Jasmine', seasons: ['spring', 'summer'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Star Jasmine seeds produce vigorous climbing vines with star-shaped, highly fragrant white flowers. Perfect for covering walls, pergolas, and trellises with a romantic green curtain.', suitableFor: ['garden'], germinationRate: 79, sowingDepth: '0.5 cm', plantSpacing: '60-90 cm', harvestTime: '120-180 days' },
    { typeName: 'Petunia Seeds', varietyName: 'Wave Petunia', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Wave Petunia seeds produce spreading, ground-cover-type plants blanketed in flowers all season long. These iconic trailing petunias are perfect for hanging baskets and window boxes.', suitableFor: ['garden'], germinationRate: 83, sowingDepth: '0.2 cm', plantSpacing: '30-45 cm', harvestTime: '60-70 days' },
    { typeName: 'Dahlia Seeds', varietyName: 'Cactus Dahlia', seasons: ['spring', 'autumn'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Cactus Dahlia seeds produce distinctive flowers with long, rolled, spiky petals in brilliant colors. These dramatic blooms create stunning architectural interest in floral displays.', suitableFor: ['garden'], germinationRate: 81, sowingDepth: '0.5 cm', plantSpacing: '90 cm', harvestTime: '90-120 days' },
    { typeName: 'Zinnia Seeds', varietyName: 'Cactus Zinnia', seasons: ['summer'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Cactus Zinnia seeds produce unique flowers with twisted, rolled petals resembling cactus blooms in vivid, saturated colors. Excellent for specialty cut flower and exhibition markets.', suitableFor: ['garden'], germinationRate: 86, sowingDepth: '0.5 cm', plantSpacing: '30-40 cm', harvestTime: '55-65 days' },
    { typeName: 'Gerbera Seeds', varietyName: 'Yellow Gerbera', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Yellow Gerbera seeds produce cheerful, sunny flowers symbolizing happiness and new beginnings. Popular in floral industry for their long vase life and vibrant color.', suitableFor: ['garden'], germinationRate: 80, sowingDepth: '0.3 cm', plantSpacing: '30-40 cm', harvestTime: '90-120 days' },
    { typeName: 'Cosmos Seeds', varietyName: 'Orange Cosmos', seasons: ['summer', 'monsoon'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Orange Cosmos seeds produce warm, vibrant flowers that attract honeybees and beneficial insects. Easy-to-grow annuals that thrive in poor soil and hot weather conditions.', suitableFor: ['garden'], germinationRate: 87, sowingDepth: '0.5 cm', plantSpacing: '30-45 cm', harvestTime: '50-60 days' },
    { typeName: 'Rose Seeds', varietyName: 'Miniature Rose', seasons: ['spring', 'winter'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Miniature Rose seeds produce perfectly formed tiny rose bushes with true rose flowers and fragrance. Ideal for pot culture, tabletop arrangements, and small urban garden spaces.', suitableFor: ['garden'], germinationRate: 78, sowingDepth: '0.5 cm', plantSpacing: '30-45 cm', harvestTime: '120-180 days' },
    { typeName: 'Marigold Seeds', varietyName: 'Signet Marigold', seasons: ['all_season'], usageType: 'gardening', seedType: 'flower', subRef: 'flowerSub', description: 'Signet Marigold seeds produce lacy-leaved plants with masses of small, single flowers with a lemon-citrus fragrance. Edible flowers prized in gourmet cooking and herbal tea blends.', suitableFor: ['garden'], germinationRate: 89, sowingDepth: '0.5 cm', plantSpacing: '20-25 cm', harvestTime: '45-55 days' },
];

// ========== MAIN SEED FUNCTION ==========
async function seedProducts() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Step 1: Fetch required references
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('Admin user not found');

    const s1 = await User.findById('6974da9d0e5735db323a5196');
    const s2 = await User.findById('697cd6e0bf74fd109502c715');
    const s3 = await User.findById('697cd7dfbf74fd109502c71b');
    if (!s1) throw new Error('Supplier 1 (Divyadharshini) not found');
    if (!s2) throw new Error('Supplier 2 (Ashwin) not found');
    if (!s3) throw new Error('Supplier 3 (Kesavaraja) not found');

    const seedsMain = await Category.findOne({ name: 'Seeds', level: 'main' });
    const vegSub = await Category.findOne({ name: 'Vegetable Seeds', level: 'sub' });
    const fruitSub = await Category.findOne({ name: 'Fruit Seeds', level: 'sub' });
    const flowerSub = await Category.findOne({ name: 'Flower Seeds', level: 'sub' });

    if (!seedsMain) throw new Error('Category "Seeds" (main) not found');
    if (!vegSub) throw new Error('Category "Vegetable Seeds" (sub) not found');
    if (!fruitSub) throw new Error('Category "Fruit Seeds" (sub) not found');
    if (!flowerSub) throw new Error('Category "Flower Seeds" (sub) not found');

    const subMap = { vegSub, fruitSub, flowerSub };

    // Step 2: Clear existing seed products
    const deleted = await Product.deleteMany({ 'category.main': seedsMain._id });
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing seed products`);

    let inserted = 0;
    let skipped = 0;

    // Step 3: Insert products per supplier
    const suppliers = [
        { user: s1, products: SUPPLIER1_PRODUCTS, label: 'Divyadharshini' },
        { user: s2, products: SUPPLIER2_PRODUCTS, label: 'Ashwin' },
        { user: s3, products: SUPPLIER3_PRODUCTS, label: 'Kesavaraja' },
    ];

    for (const { user: supplier, products, label } of suppliers) {
        console.log(`\n📦 Seeding ${products.length} products for Supplier: ${label}`);

        for (const p of products) {
            try {
                // Lookup type
                const typeDoc = await Category.findOne({ name: p.typeName, level: 'type' });
                if (!typeDoc) {
                    console.warn(`  [SKIP] type not found: "${p.typeName}"`);
                    skipped++;
                    continue;
                }

                // Lookup variety
                const variety = await ProductVariety.findOne({
                    name: p.varietyName,
                    productType: typeDoc._id,
                    approvalStatus: 'approved',
                });
                if (!variety) {
                    console.warn(`  [SKIP] variety not found: "${p.varietyName}" under type "${p.typeName}"`);
                    skipped++;
                    continue;
                }

                const subDoc = subMap[p.subRef];
                const priceKey = p.seedType; // 'vegetable' | 'fruit' | 'flower'
                const productNameText = p.varietyName.replace(/\s+/g, '+');

                const productDoc = {
                    name: `${p.varietyName} Seeds`,
                    description: p.description,
                    category: {
                        main: seedsMain._id,
                        sub: subDoc._id,
                        type: typeDoc._id,
                        variety: variety._id,
                    },
                    seller: supplier._id,
                    pricing: {
                        basePrice: PRICING[priceKey].v10,
                        hasOffer: false,
                        offerType: 'none',
                        offerValue: 0,
                        finalPrice: PRICING[priceKey].v10,
                        discount: 0,
                    },
                    variants: makeVariants(priceKey),
                    unit: 'gm',
                    stock: 0,
                    lowStockThreshold: 10,
                    images: [{
                        url: `https://placehold.co/400x400/4ade80/ffffff?text=${productNameText}`,
                        publicId: 'placeholder',
                        filename: 'placeholder.jpg',
                    }],
                    hasExpiry: true,
                    expiryDate: new Date('2027-12-31'),
                    seasons: p.seasons,
                    suitableFor: p.suitableFor,
                    usageType: p.usageType,
                    seedDetails: {
                        seedType: p.seedType,
                        variety: p.varietyName,
                        germinationRate: p.germinationRate,
                        sowingDepth: p.sowingDepth,
                        plantSpacing: p.plantSpacing,
                        harvestTime: p.harvestTime,
                        hybrid: true,
                    },
                    safetyInstructions: {
                        dosage: 'As per planting guidelines',
                        applicationMethod: 'Direct sowing or seedling transplant',
                        precautions: ['Store in cool dry place', 'Keep away from moisture'],
                        toxicityLevel: 'not_applicable',
                        waitingPeriod: 'N/A',
                    },
                    brand: 'AgriShop Seeds',
                    organicCertified: false,
                    approvalStatus: 'approved',
                    approvedBy: admin._id,
                    approvedAt: new Date(),
                    isActive: true,
                    isFeatured: false,
                    bulkOrder: { enabled: true, minQuantity: 100, bulkDiscount: 10 },
                };

                await Product.create(productDoc);
                console.log(`  ✅ Inserted: "${productDoc.name}" (${p.typeName})`);
                inserted++;
            } catch (err) {
                console.error(`  ❌ Failed to insert "${p.varietyName} Seeds":`, err.message);
                skipped++;
            }
        }
    }

    console.log(`\n🎉 Seeding complete: Inserted ${inserted}/90 products successfully (${skipped} skipped/failed)`);
    await mongoose.connection.close();
    process.exit(0);
}

seedProducts().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
