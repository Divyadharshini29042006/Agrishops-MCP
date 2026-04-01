// backend/src/utils/offerScheduler.js
import cron from 'node-cron';
import Product from '../models/Product.js';

/**
 * Initializes a cron job to check and update product offers daily.
 * This ensures that offers activate/deactivate based on their start and end dates.
 */
export const initOfferScheduler = () => {
    // Run once immediately on startup
    updateOfferPrices().catch(err => console.error('Error during initial offer update:', err));

    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('🕒 Running daily offer update job...');
        try {
            await updateOfferPrices();
            console.log('✅ Daily offer update job completed successfully.');
        } catch (error) {
            console.error('❌ Error during daily offer update job:', error);
        }
    });

    console.log('🚀 Offer Scheduler Initialized (Job scheduled for 00:00 daily)');
};

/**
 * Updates prices for all products that have potential offers.
 * Simply saving the product triggers the pre-save hook in the model
 * which recalculates the finalPrice based on the current date.
 */
export const updateOfferPrices = async () => {
    // Find all products that have an offer configured
    const products = await Product.find({
        'pricing.hasOffer': true,
        'pricing.offerType': { $ne: 'none' }
    });

    console.log(`📦 Found ${products.length} products with scheduled offers to check...`);

    let updatedCount = 0;
    for (const product of products) {
        try {
            // The pre-save hook in Product.js handles the calculation logic based on current date
            await product.save();
            updatedCount++;
        } catch (err) {
            console.error(`Failed to update offer price for product ${product._id}:`, err.message);
        }
    }

    return updatedCount;
};
