// backend/src/models/Disease.js
import mongoose from 'mongoose';

const diseaseSchema = new mongoose.Schema({
    cropName: {
        type: String,
        required: true,
        trim: true,
    },
    symptomsKeywords: {
        type: [String],
        required: true,
        default: [],
    },
    diseaseName: {
        type: String,
        required: true,
        trim: true,
    },
    pesticide: {
        type: String,
        required: true,
    },
    dosagePerLitre: {
        type: String,
        required: true,
    },
    acreCoverage: {
        type: Number,
        required: true,
    },
    solution: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

// Create index for keyword searching
diseaseSchema.index({ symptomsKeywords: 1 });
diseaseSchema.index({ cropName: 1 });

export default mongoose.model('Disease', diseaseSchema);
