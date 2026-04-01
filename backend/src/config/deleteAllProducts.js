import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function deleteAllProducts() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const result = await Product.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} products`);

        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

deleteAllProducts()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Unhandled Error:', err);
        process.exit(1);
    });
