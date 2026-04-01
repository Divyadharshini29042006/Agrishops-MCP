// backend/seedChatbotData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Disease from './src/models/Disease.js';
import PesticideUsage from './src/models/PesticideUsage.js';

dotenv.config();

const diseases = [
    {
        cropName: 'Wheat',
        symptomsKeywords: ['yellow', 'spots', 'rust', 'leaves', 'brown'],
        diseaseName: 'Yellow Rust',
        pesticide: 'Propiconazole',
        dosagePerLitre: '1ml',
        acreCoverage: 1,
        solution: 'Spray Propiconazole 25% EC at 200ml per acre mixed with 200 litres of water.'
    },
    {
        cropName: 'Rice',
        symptomsKeywords: ['blast', 'spots', 'neck', 'drying'],
        diseaseName: 'Rice Blast',
        pesticide: 'Tricyclazole',
        dosagePerLitre: '0.6g',
        acreCoverage: 1,
        solution: 'Apply Tricyclazole 75% WP at 120g per acre.'
    },
    {
        cropName: 'Cotton',
        symptomsKeywords: ['bollworm', 'holes', 'dropping', 'buds'],
        diseaseName: 'Bollworm Attack',
        pesticide: 'Indoxacarb',
        dosagePerLitre: '1ml',
        acreCoverage: 1,
        solution: 'Spray Indoxacarb 14.5% SC at 200ml per acre.'
    }
];

const pesticideUsages = [
    {
        pesticideName: 'Chlorpyrifos',
        dosagePerAcre: 0.5, // Liters
        safetyInstructions: 'Avoid contact with eyes and skin. Keep away from livestock.'
    },
    {
        pesticideName: 'Propiconazole',
        dosagePerAcre: 0.2, // Liters
        safetyInstructions: 'Highly toxic to fish. Do not spray near water bodies.'
    },
    {
        pesticideName: 'Indoxacarb',
        dosagePerAcre: 0.2, // Liters
        safetyInstructions: 'Wash hands thoroughly after application. Use protective clothing.'
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Clear existing data
        await Disease.deleteMany();
        await PesticideUsage.deleteMany();

        // Insert new data
        await Disease.insertMany(diseases);
        await PesticideUsage.insertMany(pesticideUsages);

        console.log('Chatbot data seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
