// backend/src/utils/test_offer_logic.js
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('\n--- Testing Offer Logic ---');

        // Test Case 1: Offer ending today
        const productData = {
            name: 'Test Offer Product',
            description: 'Testing scheduled offers',
            pricing: {
                basePrice: 100,
                hasOffer: true,
                offerType: 'percentage',
                offerValue: 10,
                offerEndDate: today,
                finalPrice: 100
            },
            seller: new mongoose.Types.ObjectId(), // Mock seller
            category: { main: new mongoose.Types.ObjectId() }, // Mock category
            usageType: 'farming',
            unit: 'piece'
        };

        const product = new Product(productData);
        await product.save(); // Should trigger pre-save hook

        console.log(`Test Case 1 (Ends Today): 
            Base Price: ${product.pricing.basePrice}
            Offer End Date: ${product.pricing.offerEndDate}
            Final Price (should be 90): ${product.pricing.finalPrice}
            Is Discount Applied: ${product.pricing.discount === 10 ? 'YES' : 'NO'}`);

        // Test Case 2: Offer ended yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        product.pricing.offerEndDate = yesterday;
        await product.save();

        console.log(`\nTest Case 2 (Ended Yesterday): 
            Base Price: ${product.pricing.basePrice}
            Offer End Date: ${product.pricing.offerEndDate}
            Final Price (should be 100): ${product.pricing.finalPrice}
            Is Discount Applied: ${product.pricing.discount === 10 ? 'YES' : 'NO'}`);

        // Test Case 3: Default variant NO offer, Second variant HAS offer
        console.log('\n--- Test Case 3: Default variant NO offer, Second variant HAS offer ---');
        const multiVariantProduct = new Product({
            name: 'Multi Variant Offer Test',
            description: 'Testing multi-variant offers',
            seller: new mongoose.Types.ObjectId(),
            category: { main: new mongoose.Types.ObjectId() },
            usageType: 'farming',
            unit: 'piece',
            pricing: {
                basePrice: 100,
                hasOffer: true,
                offerType: 'percentage', // Explicitly set like frontend does now
                offerValue: 0,
                finalPrice: 100
            },
            variants: [
                {
                    size: '1 kg',
                    quantity: 1,
                    unit: 'kg',
                    basePrice: 100,
                    offerPrice: 0,
                    finalPrice: 100,
                    isDefault: true,
                    stock: 10
                },
                {
                    size: '2 kg',
                    quantity: 2,
                    unit: 'kg',
                    basePrice: 200,
                    offerPrice: 150,
                    finalPrice: 200, // Hook will update this
                    isDefault: false,
                    stock: 10
                }
            ]
        });

        await multiVariantProduct.save();

        const v1 = multiVariantProduct.variants[0];
        const v2 = multiVariantProduct.variants[1];

        console.log(`Variant 1 (Default, No Offer) Final Price: ${v1.finalPrice} (Expected 100)`);
        console.log(`Variant 2 (Has Offer) Final Price: ${v2.finalPrice} (Expected 150)`);
        console.log(`Product hasOffer: ${multiVariantProduct.pricing.hasOffer}`);
        console.log(`Product offerType: ${multiVariantProduct.pricing.offerType}`);

        if (v2.finalPrice === 150) {
            console.log('✅ SUCCESS: Non-default variant offer preserved!');
        } else {
            console.log('❌ FAILURE: Non-default variant offer lost!');
        }

        // Clean up
        await Product.findByIdAndDelete(multiVariantProduct._id);
        console.log('\nMulti-variant test product cleaned up.');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

runTest();
