// backend/src/models/PesticideUsage.js
import mongoose from 'mongoose';

const pesticideUsageSchema = new mongoose.Schema({
    pesticideName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    dosagePerAcre: {
        type: Number, // Amount in liters or kg
        required: true,
    },
    safetyInstructions: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

// No manual index needed since 'unique: true' handles it.

export default mongoose.model('PesticideUsage', pesticideUsageSchema);
