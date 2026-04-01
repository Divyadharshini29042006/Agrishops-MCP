// backend/src/controllers/chatbotController.js
import { processChatbotQuery, SUPPORTED_LANGUAGES } from '../utils/chatbotRules.js';
import { getCurrentSeason, getCropsForSeason } from '../utils/seasonalData.js';
import Product from '../models/Product.js';
import Disease from '../models/Disease.js';
import PesticideUsage from '../models/PesticideUsage.js';
import Order from '../models/Order.js';

/**
 * @desc    Handle chatbot query (Rule-based NLP)
 * @route   POST /api/chatbot/message
 * @access  Public (Order tracking requires auth)
 */
export const handleMessage = async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const lowerMessage = message.toLowerCase().trim();
    let response = {
      message: "I'm not sure I understood that. Could you please rephrase? You can ask about crop diseases, pesticide recommendations, dosage calculations, or your orders.",
      intent: 'unknown',
      data: null
    };

    // 1. Order Tracking (Requires userId from JWT)
    if (lowerMessage.includes('order') || lowerMessage.includes('status') || lowerMessage.includes('track')) {
      if (!userId) {
        response.message = "Please log in to track your orders.";
        response.intent = 'order_tracking';
      } else {
        const orders = await Order.find({ customer: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('orderNumber status totalAmount createdAt');

        if (orders.length > 0) {
          const orderDetails = orders.map(o => `Order #${o.orderNumber}: ${o.status.toUpperCase()} (${new Date(o.createdAt).toLocaleDateString()})`).join('\n');
          response.message = `Here are your recent orders:\n${orderDetails}`;
          response.intent = 'order_tracking';
          response.data = orders;
        } else {
          response.message = "I couldn't find any recent orders for you.";
          response.intent = 'order_tracking';
        }
      }
    }
    // 2. Dosage Calculation
    else if (lowerMessage.includes('acre') || lowerMessage.includes('dosage') || lowerMessage.includes('how much')) {
      const acreRegex = /(\d+(?:\.\d+)?)\s*acre/i;
      const match = lowerMessage.match(acreRegex);

      if (match) {
        const acreage = parseFloat(match[1]);
        // Find a pesticide in the message to calculate specifically, else give generic info
        const pesticides = await PesticideUsage.find();
        let matchedPesticide = pesticides.find(p => lowerMessage.includes(p.pesticideName.toLowerCase()));

        if (matchedPesticide) {
          const totalDosage = (matchedPesticide.dosagePerAcre * acreage).toFixed(2);
          response.message = `For ${acreage} acres, you will need approximately ${totalDosage} units of ${matchedPesticide.pesticideName}.\n\nSafety Instruction: ${matchedPesticide.safetyInstructions}`;
          response.intent = 'dosage_calculation';
        } else {
          response.message = `I see you're asking about ${acreage} acres. To calculate the dosage, please let me know which pesticide you're using (e.g., "Dosage for 5 acres of Chlorpyrifos").`;
          response.intent = 'dosage_calculation';
        }
      } else {
        response.message = "Please specify the number of acres for dosage calculation (e.g., '5 acres').";
        response.intent = 'dosage_calculation';
      }
    }
    // 3. Disease Identification / Pesticide Recommendation
    else {
      // Split message into keywords
      const keywords = lowerMessage.split(/\s+/).filter(k => k.length > 3);

      // Try to find disease by symptoms
      const diseases = await Disease.find({
        symptomsKeywords: { $in: keywords }
      });

      if (diseases.length > 0) {
        const disease = diseases[0]; // Take the first match for simplicity
        response.message = `Detected Disease: ${disease.diseaseName}\n\nRecommended Pesticide: ${disease.pesticide}\nDosage: ${disease.dosagePerLitre} per litre\nSolution: ${disease.solution}`;
        response.intent = 'disease_identification';
        response.data = disease;
      } else {
        // Fallback to legacy rule-based processing
        const fallbackResponse = processChatbotQuery(message, language);
        response.message = fallbackResponse.message;
        response.intent = fallbackResponse.intent;
      }
    }

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message,
    });
  }
};

/**
 * @desc    Get product recommendations based on query
 * @route   POST /api/chatbot/recommendations
 * @access  Public
 */
export const getRecommendations = async (req, res) => {
  try {
    const { intent, category, season, language = 'en' } = req.body;

    const query = {
      approvalStatus: 'approved',
      isActive: true,
    };

    // Add filters based on intent
    if (category) {
      const categoryDoc = await Category.findOne({ type: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (season) {
      query.seasons = season;
    }

    // Get products
    const products = await Product.find(query)
      .populate('category', 'name type')
      .populate('seller', 'name businessDetails.businessName')
      .limit(10)
      .sort('-rating.average');

    res.status(200).json({
      success: true,
      data: products,
      filters: { category, season },
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recommendations',
      error: error.message,
    });
  }
};

/**
 * @desc    Get chatbot conversation history (if user is logged in)
 * @route   GET /api/chatbot/history
 * @access  Private
 */
export const getChatHistory = async (req, res) => {
  try {
    // This would require a ChatHistory model if you want to persist conversations
    // For now, return empty array as chat is session-based
    res.status(200).json({
      success: true,
      message: 'Chat history is session-based and not persisted',
      data: [],
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message,
    });
  }
};

/**
 * @desc    Get supported languages
 * @route   GET /api/chatbot/languages
 * @access  Public
 */
export const getSupportedLanguages = async (req, res) => {
  try {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    ];

    res.status(200).json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching languages',
      error: error.message,
    });
  }
};

export default {
  handleMessage,
  getRecommendations,
  getChatHistory,
  getSupportedLanguages,
};