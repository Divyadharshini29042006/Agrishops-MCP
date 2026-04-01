// backend/src/utils/chatbotRules.js
import { getCurrentSeason, getCropsForSeason, formatCropName, SEASONS } from './seasonalData.js';

/**
 * Multilingual Chatbot Rules for Agricultural Advisory System
 * Uses pattern matching for intent detection and returns appropriate responses
 * Supports: English (en), Hindi (hi), Tamil (ta), Telugu (te), Kannada (kn), Malayalam (ml)
 * 
 * NO DUMMY DATA - All responses are based on real seasonal data
 */

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];

// Intent detection patterns for each language
export const INTENT_PATTERNS = {
  greeting: {
    en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'],
    hi: ['namaste', 'namaskar', 'hello', 'hi', 'suno', 'shuru karo'],
    ta: ['vanakkam', 'hello', 'hi', 'vaanga', 'aarambam', 'nalavuravu', 'eppadi irukkiraai'],
    te: ['namaskaram', 'hello', 'hi', 'ela unnaru', 'modalu'],
    kn: ['namaskara', 'hello', 'hi', 'hegiddira', 'shuru'],
    ml: ['namaskaram', 'hello', 'hi', 'sugam', 'aarambham'],
  },

  seasonal_query: {
    en: ['seasonal', 'season', 'current season', 'what to plant', 'which crops', 'suitable crops', 'plant now', 'grow now'],
    hi: ['mausam', 'mausami', 'ab kya lagaye', 'kaun si fasal', 'abhi kya ugaye', 'iss mausam'],
    ta: ['paruvakaalam', 'ippo enna nadurathu', 'enna payir', 'season', 'ippothu enna nadalam', 'payir seyya'],
    te: ['ruthuvulu', 'ippudu emi pandinchaali', 'season', 'pandatam'],
    kn: ['ruthuvina', 'ega yenu beleyabeku', 'season', 'belegalisuvudu'],
    ml: ['kaalavastha', 'ippol enthu nadaan', 'season', 'vila nadaan'],
  },

  pest_problem: {
    en: ['pest', 'insect', 'bug', 'worm', 'caterpillar', 'damage', 'eating leaves', 'destroying', 'attack'],
    hi: ['keet', 'keeda', 'keede', 'makodi', 'patti kharab', 'fasal nuksan', 'kharab ho raha'],
    ta: ['poochi', 'puzhuvai', 'keetam', 'ilai thingirathu', 'nasam', 'thaakuthal', 'noy', 'vazhukkul'],
    te: ['purugu', 'keetatlu', 'panduku nashanam', 'aaku tinesthundi', 'dhaakatam'],
    kn: ['hucchu', 'keede', 'purugu', 'bele nashamaagutaithe', 'tinnutaithe'],
    ml: ['poochi', 'puzhu', 'keeda', 'ila nashtathe', 'thinnunnu'],
  },

  fertilizer_query: {
    en: ['fertilizer', 'nutrient', 'nutrition', 'feed', 'growth', 'manure', 'npk', 'compost'],
    hi: ['khad', 'uphar', 'poshan', 'nutrients', 'podha khana', 'vikas'],
    ta: ['uram', 'poshanam', 'valarchi', 'manure', 'aahaaram', 'seniporul'],
    te: ['eruvulu', 'poshanam', 'panduku aahaaram', 'perugudala'],
    kn: ['khate', 'poshan', 'belegalisuvudu', 'aahaara'],
    ml: ['valam', 'poshanam', 'vila valarchcha', 'aahaaram'],
  },

  watering_query: {
    en: ['water', 'irrigation', 'watering', 'how much water', 'when to water', 'drought'],
    hi: ['pani', 'sinchai', 'kitna pani', 'kab pani dena', 'paani'],
    ta: ['neer', 'eeppam', 'ethanai neer', 'eppothu neer', 'thanni', 'payichal'],
    te: ['neellu', 'neeruni', 'eppudu neeru', 'entha neeru'],
    kn: ['neeru', 'neerukoduvudu', 'estu neeru', 'yaavaga'],
    ml: ['vellam', 'nirakanam', 'ethra vellam', 'eppol'],
  },

  safety_instructions: {
    en: ['safe', 'safety', 'precaution', 'dangerous', 'toxic', 'harmful', 'protect', 'wear'],
    hi: ['suraksha', 'khatre', 'savdhani', 'khatarnak', 'bachaav'],
    ta: ['paathukaappu', 'athuvaanam', 'kaappu', 'pathukaapu', 'echcharikkai'],
    te: ['samrakshana', 'prayanam', 'jagratha', 'rakshana'],
    kn: ['surakshate', 'prayana', 'jagratha', 'kaappu'],
    ml: ['suraksha', 'pradanam', 'sookshma', 'raksha'],
  },

  wholesale_inquiry: {
    en: ['bulk', 'wholesale', 'large quantity', 'manufacturer', 'supplier', 'bulk order', 'large order'],
    hi: ['thook', 'bhari matra', 'manufacturer', 'banavane wala', 'bada order'],
    ta: ['peria alavilai', 'mottavitpanai', 'thayaarippaalar', 'periya', 'bulk', 'moththamaaga'],
    te: ['pedda parimanam', 'thokkasale', 'teyaaridaar', 'pedda'],
    kn: ['motta', 'dodda alavilai', 'teyaarisuvavar', 'dodda'],
    ml: ['mottham', 'valiya etavil', 'nirmmaathaavu', 'valiya'],
  },

  product_usage: {
    en: ['how to use', 'apply', 'application', 'dosage', 'quantity', 'usage', 'instructions'],
    hi: ['kaise istemal', 'lagana', 'matra', 'kitna', 'upyog'],
    ta: ['eppadi use', 'potuvadhu', 'alavai', 'payanbadu', 'thovathal'],
    te: ['ela vadali', 'vadatam', 'parimanam', 'upayogam'],
    kn: ['hegalivadu', 'haakuvudu', 'alavai', 'upayoga'],
    ml: ['engane upayogikkam', 'upayogam', 'alavai', 'niyamam'],
  },

  ordering_help: {
    en: ['order', 'buy', 'purchase', 'cart', 'checkout', 'payment'],
    hi: ['order', 'kharidna', 'lena', 'cart', 'payment'],
    ta: ['order', 'vaangavum', 'vaguduthal', 'cart', 'vilai'],
    te: ['order', 'konukkovali', 'konuta', 'cart'],
    kn: ['order', 'kogoli', 'cart', 'payment'],
    ml: ['order', 'vaanguka', 'cart', 'payment'],
  },
};

// Response templates - Dynamic responses using real data
export const RESPONSES = {
  greeting: {
    en: "Hello! 👋 I'm your agricultural assistant. I can help you with:\n\n• Seasonal crop recommendations\n• Pest and disease solutions\n• Fertilizer advice\n• Product usage guidance\n• Wholesale inquiries\n\nHow can I assist you today?",

    hi: "नमस्ते! 👋 मैं आपका कृषि सहायक हूं। मैं इनमें मदद कर सकता हूं:\n\n• मौसमी फसल सिफारिशें\n• कीट और रोग समाधान\n• उर्वरक सलाह\n• उत्पाद उपयोग मार्गदर्शन\n• थोक पूछताछ\n\nआज मैं आपकी कैसे सहायता कर सकता हूं?",

    ta: "வணக்கம்! 👋 நான் உங்கள் விவசாய உதவியாளர். நான் இவற்றில் உதவ முடியும்:\n\n• பருவகால பயிர் பரிந்துரைகள்\n• பூச்சி மற்றும் நோய் தீர்வுகள்\n• உரம் ஆலோசனை\n• தயாரிப்பு பயன்பாட்டு வழிகாட்டி\n• மொத்த விற்பனை விசாரணைகள்\n\nஇன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",

    te: "నమస్కారం! 👋 నేను మీ వ్యవసాయ సహాయకుడను। నేను ఈ విషయాలలో సహాయం చేయగలను:\n\n• కాలానుగుణ పంట సిఫార్సులు\n• తెగులు మరియు వ్యాధి పరిష్కారాలు\n• ఎరువుల సలహా\n• ఉత్పత్తి వినియోగ మార్గదర్శకత్వం\n• మొత్తం విచారణలు\n\nనేడు నేను మీకు ఎలా సహాయం చేయగలను?",

    kn: "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ। ನಾನು ಈ ವಿಷಯಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n\n• ಋತುವಿನ ಬೆಳೆ ಶಿಫಾರಸುಗಳು\n• ಕೀಟ ಮತ್ತು ರೋಗ ಪರಿಹಾರಗಳು\n• ಗೊಬ್ಬರ ಸಲಹೆ\n• ಉತ್ಪನ್ನ ಬಳಕೆ ಮಾರ್ಗದರ್ಶನ\n• ಥೋಕು ವಿಚಾರಣೆಗಳು\n\nಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",

    ml: "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ കാർഷിക സഹായി। ഞാൻ ഇവയിൽ സഹായിക്കാൻ കഴിയും:\n\n• സീസണൽ വിള ശുപാർശകൾ\n• കീടങ്ങളും രോഗങ്ങളും പരിഹാരങ്ങൾ\n• വളം ഉപദേശം\n• ഉൽപ്പന്ന ഉപയോഗ മാർഗ്ഗനിർദ്ദേശം\n• മൊത്തവ്യാപാര അന്വേഷണങ്ങൾ\n\nഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?"
  },

  seasonal: {
    // Dynamic function - uses real seasonal data
    en: (season, crops) => `🌱 Current Season: ${SEASONS[season]?.name || season}\n\nRecommended crops for this season:\n${crops.slice(0, 10).map(c => `• ${formatCropName(c)}`).join('\n')}\n\nWould you like specific recommendations for any crop?`,

    hi: (season, crops) => `🌱 वर्तमान मौसम: ${SEASONS[season]?.name || season}\n\nइस मौसम के लिए अनुशंसित फसलें:\n${crops.slice(0, 10).map(c => `• ${formatCropName(c)}`).join('\n')}\n\nक्या आप किसी फसल के लिए विशिष्ट सिफारिशें चाहते हैं?`,

    ta: (season, crops) => `🌱 தற்போதைய பருவம்: ${SEASONS[season]?.name || season}\n\nஇந்த பருவத்திற்கு பரிந்துரைக்கப்பட்ட பயிர்கள்:\n${crops.slice(0, 10).map(c => `• ${formatCropName(c)}`).join('\n')}\n\nஏதேனும் பயிருக்கு குறிப்பிட்ட பரிந்துரைகள் வேண்டுமா?`,

    te: (season, crops) => `🌱 ప్రస్తుత కాలం: ${SEASONS[season]?.name || season}\n\nఈ కాలానికి సిఫార్సు చేసిన పంటలు:\n${crops.slice(0, 10).map(c => `• ${formatCropName(c)}`).join('\n')}\n\nఏదైనా పంటకు నిర్దిష్ట సిఫార్సులు కావాలా?`,

    kn: (season, crops) => `🌱 ಪ್ರಸ್ತುತ ಋತು: ${SEASONS[season]?.name || season}\n\nಈ ಋತುವಿಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆಗಳು:\n${crops.slice(0, 10).map(c => `• ${formatCropName(c)}`).join('\n')}\n\nಯಾವುದಾದರೂ ಬೆಳೆಗೆ ನಿರ್ದಿಷ್ಟ ಶಿಫಾರಸುಗಳು ಬೇಕೇ?`,

    ml: (season, crops) => `🌱 നിലവിലെ സീസൺ: ${SEASONS[season]?.name || season}\n\nഈ സീസണിലേക്ക് ശുപാർശ ചെയ്ത വിളകൾ:\n${crops.slice(0, 10).map(c => `• ${formatCropName(c)}`).join('\n')}\n\nഏതെങ്കിലും വിളയ്ക്ക് പ്രത്യേക ശുപാർശകൾ വേണോ?`
  },

  pest_solution: {
    en: "🐛 Pest Control Guide:\n\n1. Identify the pest (aphids, caterpillars, etc.)\n2. Browse our Crop Protection products\n3. Check toxicity level\n4. Follow safety instructions\n5. Use recommended dosage\n\nShall I show you crop protection products?",

    hi: "🐛 कीट नियंत्रण गाइड:\n\n1. कीट की पहचान करें\n2. हमारे फसल सुरक्षा उत्पाद देखें\n3. विषाक्तता स्तर जांचें\n4. सुरक्षा निर्देशों का पालन करें\n5. अनुशंसित खुराक उपयोग करें\n\nक्या मैं फसल सुरक्षा उत्पाद दिखाऊं?",

    ta: "🐛 பூச்சி கட்டுப்பாடு வழிகாட்டி:\n\n1. பூச்சியை அடையாளம் காணுங்கள்\n2. எங்கள் பயிர் பாதுகாப்பு தயாரிப்புகளை பார்க்கவும்\n3. நச்சுத்தன்மை அளவை சரிபார்க்கவும்\n4. பாதுகாப்பு வழிமுறைகளை பின்பற்றவும்\n5. பரிந்துரைக்கப்பட்ட அளவை பயன்படுத்தவும்\n\nபயிர் பாதுகாப்பு தயாரிப்புகளை காட்டட்டுமா?",

    te: "🐛 తెగులు నియంత్రణ గైడ్:\n\n1. తెగులును గుర్తించండి\n2. మా పంట రక్షణ ఉత్పత్తులను చూడండి\n3. విషతుల్యత స్థాయిని తనిఖీ చేయండి\n4. భద్రతా సూచనలను అనుసరించండి\n5. సిఫార్సు చేసిన మోతాదు ఉపయోగించండి\n\nపంట రక్షణ ఉత్పత్తులను చూపాలా?",

    kn: "🐛 ಕೀಟ ನಿಯಂತ್ರಣ ಮಾರ್ಗದರ್ಶಿ:\n\n1. ಕೀಟವನ್ನು ಗುರುತಿಸಿ\n2. ನಮ್ಮ ಬೆಳೆ ರಕ್ಷಣೆ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಿ\n3. ವಿಷತ್ವ ಮಟ್ಟವನ್ನು ಪರಿಶೀಲಿಸಿ\n4. ಸುರಕ್ಷತಾ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ\n5. ಶಿಫಾರಸು ಮಾಡಿದ ಪ್ರಮಾಣವನ್ನು ಬಳಸಿ\n\nಬೆಳೆ ರಕ್ಷಣೆ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಲೇ?",

    ml: "🐛 കീട നിയന്ത്രണ ഗൈഡ്:\n\n1. കീടത്തെ തിരിച്ചറിയുക\n2. ഞങ്ങളുടെ വിള സംരക്ഷണ ഉൽപ്പന്നങ്ങൾ കാണുക\n3. വിഷാംശ തലം പരിശോധിക്കുക\n4. സുരക്ഷാ നിർദ്ദേശങ്ങൾ പാലിക്കുക\n5. ശുപാർശ ചെയ്ത അളവ് ഉപയോഗിക്കുക\n\nവിള സംരക്ഷണ ഉൽപ്പന്നങ്ങൾ കാണിക്കണോ?"
  },

  fertilizer_advice: {
    en: "🌿 Fertilizer Guide:\n\n• Seedling → Nitrogen-rich (N)\n• Flowering → Phosphorus-rich (P)\n• Fruiting → Potassium-rich (K)\n\nCheck NPK ratio on labels. Browse Crop Nutrition products.\n\nNeed specific recommendations?",

    hi: "🌿 उर्वरक गाइड:\n\n• पौध → नाइट्रोजन युक्त (N)\n• फूल → फास्फोरस युक्त (P)\n• फल → पोटैशियम युक्त (K)\n\nलेबल पर NPK अनुपात जांचें। फसल पोषण उत्पाद देखें।\n\nविशिष्ट सिफारिशें चाहिए?",

    ta: "🌿 உர வழிகாட்டி:\n\n• நாற்று → நைட்ரஜன் (N)\n• பூக்கும் → பாஸ்பரஸ் (P)\n• கனி → பொட்டாசியம் (K)\n\nலேபிளில் NPK விகிதத்தை சரிபார்க்கவும். பயிர் ஊட்டச்சத்து தயாரிப்புகள் பார்க்கவும்.\n\nகுறிப்பிட்ட பரிந்துரைகள் வேண்டுமா?",

    te: "🌿 ఎరువుల గైడ్:\n\n• మొక్క → నత్రజని (N)\n• పుష్పించే → భాస్వరం (P)\n• పండ్ల → పొటాషియం (K)\n\nలేబుల్‌పై NPK నిష్పత్తి చూడండి। పంట పోషణ ఉత్పత్తులు చూడండి।\n\nనిర్దిష్ట సిఫార్సులు కావాలా?",

    kn: "🌿 ಗೊಬ್ಬರ ಮಾರ್ಗದರ್ಶಿ:\n\n• ಮೊಳಕೆ → ಸಾರಜನಕ (N)\n• ಹೂವು → ರಂಜಕ (P)\n• ಹಣ್ಣು → ಪೊಟ್ಯಾಸಿಯಮ್ (K)\n\nಲೇಬಲ್‌ನಲ್ಲಿ NPK ಅನುಪಾತ ನೋಡಿ। ಬೆಳೆ ಪೋಷಣೆ ಉತ್ಪನ್ನಗಳು ನೋಡಿ।\n\nನಿರ್ದಿಷ್ಟ ಶಿಫಾರಸುಗಳು ಬೇಕೇ?",

    ml: "🌿 വള ഗൈഡ്:\n\n• തൈ → നൈട്രജൻ (N)\n• പൂവിടുന്ന → ഫോസ്ഫറസ് (P)\n• കായ്ക്കുന്ന → പൊട്ടാസ്യം (K)\n\nലേബലിൽ NPK അനുപാതം കാണുക। വിള പോഷണ ഉൽപ്പന്നങ്ങൾ കാണുക।\n\nപ്രത്യേക ശുപാർശകൾ വേണോ?"
  },

  safety_guide: {
    en: "⚠️ Safety Guidelines:\n\n1. Wear protective gear\n2. Read labels carefully\n3. Follow dosage\n4. Don't spray in wind\n5. Wash hands after use\n6. Keep away from children\n7. Wait before harvest\n\nCheck product safety info.",

    hi: "⚠️ सुरक्षा दिशानिर्देश:\n\n1. सुरक्षात्मक गियर पहनें\n2. लेबल ध्यान से पढ़ें\n3. खुराक का पालन करें\n4. हवा में स्प्रे न करें\n5. उपयोग के बाद हाथ धोएं\n6. बच्चों से दूर रखें\n7. फसल से पहले प्रतीक्षा करें\n\nउत्पाद सुरक्षा जानकारी जांचें।",

    ta: "⚠️ பாதுகாப்பு வழிகாட்டுதல்கள்:\n\n1. பாதுகாப்பு கியர் அணியுங்கள்\n2. லேபிள் கவனமாக படிக்கவும்\n3. அளவைப் பின்பற்றவும்\n4. காற்றில் தெளிக்க வேண்டாம்\n5. கைகளைக் கழுவவும்\n6. குழந்தைகளிடமிருந்து விலக்கி\n7. அறுவடைக்கு முன் காத்திருக்கவும்\n\nதயாரிப்பு பாதுகாப்பு தகவல் சரிபார்க்கவும்.",

    te: "⚠️ భద్రతా మార్గదర్శకాలు:\n\n1. రక్షణ గేర్ ధరించండి\n2. లేబుల్ జాగ్రత్తగా చదవండి\n3. మోతాదును అనుసరించండి\n4. గాలిలో స్ప్రే చేయవద్దు\n5. చేతులు కడగాలి\n6. పిల్లల నుండి దూరంగా\n7. పంటకు ముందు వేచి ఉండండి\n\nఉత్పత్తి భద్రతా సమాచారం చూడండి।",

    kn: "⚠️ ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿಗಳು:\n\n1. ರಕ್ಷಣಾತ್ಮಕ ಗೇರ್ ಧರಿಸಿ\n2. ಲೇಬಲ್ ಎಚ್ಚರಿಕೆಯಿಂದ ಓದಿ\n3. ಪ್ರಮಾಣವನ್ನು ಅನುಸರಿಸಿ\n4. ಗಾಳಿಯಲ್ಲಿ ಸಿಂಪಡಿಸಬೇಡಿ\n5. ಕೈಗಳನ್ನು ತೊಳೆಯಿರಿ\n6. ಮಕ್ಕಳಿಂದ ದೂರವಿರಿಸಿ\n7. ಕೊಯ್ಲು ಮುಂದೆ ಕಾಯಿರಿ\n\nಉತ್ಪನ್ನ ಸುರಕ್ಷತಾ ಮಾಹಿತಿ ನೋಡಿ।",

    ml: "⚠️ സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ:\n\n1. സംരക്ഷണ ഗിയർ ധരിക്കുക\n2. ലേബൽ ശ്രദ്ധയോടെ വായിക്കുക\n3. അളവ് പാലിക്കുക\n4. കാറ്റിൽ തളിക്കരുത്\n5. കൈകൾ കഴുകുക\n6. കുട്ടികളിൽ നിന്നും അകറ്റി\n7. വിളവെടുപ്പിന് മുമ്പ് കാത്തിരിക്കുക\n\nഉൽപ്പന്ന സുരക്ഷാ വിവരങ്ങൾ കാണുക।"
  },

  wholesale_info: {
    en: "📦 Wholesale/Bulk Orders:\n\nFor large quantities:\n1. Visit product page\n2. Click 'Wholesale Inquiry'\n3. Enter quantity needed\n4. Submit to manufacturer\n5. Get custom quote\n\nBetter prices & direct contact!\n\nReady to inquire?",

    hi: "📦 थोक/बल्क ऑर्डर:\n\nबड़ी मात्रा के लिए:\n1. उत्पाद पृष्ठ पर जाएं\n2. 'थोक पूछताछ' क्लिक करें\n3. मात्रा दर्ज करें\n4. निर्माता को जमा करें\n5. कस्टम कोट प्राप्त करें\n\nबेहतर कीमतें और सीधा संपर्क!\n\nपूछताछ के लिए तैयार हैं?",

    ta: "📦 மொத்த/பெரிய ஆர்டர்கள்:\n\nபெரிய அளவுக்கு:\n1. தயாரிப்பு பக்கம் செல்லுங்கள்\n2. 'மொத்த விசாரணை' கிளிக் செய்யவும்\n3. அளவு உள்ளிடவும்\n4. தயாரிப்பாளருக்கு சமர்ப்பிக்கவும்\n5. விலை பெறுங்கள்\n\nசிறந்த விலைகள் மற்றும் நேரடி தொடர்பு!\n\nவிசாரிக்க தயாரா?",

    te: "📦 మొత్తం/పెద్ద ఆర్డర్లు:\n\nపెద్ద పరిమాణాలకు:\n1. ఉత్పత్తి పేజీకి వెళ్లండి\n2. 'మొత్తం విచారణ' క్లిక్ చేయండి\n3. పరిమాణం నమోదు చేయండి\n4. తయారీదారుకు సమర్పించండి\n5. కోట్ పొందండి\n\nమెరుగైన ధరలు మరియు ప్రత్యక్ష సంప్రదింపు!\n\nఅడిగేందుకు సిద్ధంగా ఉన్నారా?",

    kn: "📦 ಮೊತ್ತ/ದೊಡ್ಡ ಆರ್ಡರ್‌ಗಳು:\n\nದೊಡ್ಡ ಪ್ರಮಾಣಕ್ಕೆ:\n1. ಉತ್ಪನ್ನ ಪುಟಕ್ಕೆ ಹೋಗಿ\n2. 'ಮೊತ್ತ ವಿಚಾರಣೆ' ಕ್ಲಿಕ್ ಮಾಡಿ\n3. ಪ್ರಮಾಣ ನಮೂದಿಸಿ\n4. ತಯಾರಕರಿಗೆ ಸಲ್ಲಿಸಿ\n5. ಕೋಟ್ ಪಡೆಯಿರಿ\n\nಉತ್ತಮ ಬೆಲೆಗಳು ಮತ್ತು ನೇರ ಸಂಪರ್ಕ!\n\nವಿಚಾರಿಸಲು ಸಿದ್ಧರಿದ್ದೀರಾ?",

    ml: "📦 മൊത്തം/വലിയ ഓർഡറുകൾ:\n\nവലിയ അളവിന്:\n1. ഉൽപ്പന്ന പേജിലേക്ക് പോകുക\n2. 'മൊത്തവ്യാപാര അന്വേഷണം' ക്ലിക്ക് ചെയ്യുക\n3. അളവ് നൽകുക\n4. നിർമ്മാതാവിന് സമർപ്പിക്കുക\n5. വില നേടുക\n\nമെച്ചപ്പെട്ട വിലകളും നേരിട്ടുള്ള ബന്ധവും!\n\nഅന്വേഷിക്കാൻ തയ്യാറാണോ?"
  },

  ordering_help: {
    en: "🛒 How to Order:\n\n1. Browse products\n2. Add to cart\n3. Go to checkout\n4. Enter delivery address\n5. Choose payment method:\n   • Cash on Delivery\n   • Online Payment\n   • UPI\n6. Place order\n\nNeed help with anything specific?",

    hi: "🛒 ऑर्डर कैसे करें:\n\n1. उत्पाद ब्राउज़ करें\n2. कार्ट में जोड़ें\n3. चेकआउट पर जाएं\n4. डिलीवरी एड्रेस दर्ज करें\n5. भुगतान विधि चुनें:\n   • कैश ऑन डिलीवरी\n   • ऑनलाइन भुगतान\n   • UPI\n6. ऑर्डर करें\n\nकिसी विशेष चीज़ में मदद चाहिए?",

    ta: "🛒 ஆர்டர் செய்வது எப்படி:\n\n1. தயாரிப்புகளை உலாவவும்\n2. கார்ட்டில் சேர்க்கவும்\n3. செக்அவுட்டுக்கு செல்லவும்\n4. டெலிவரி முகவரி உள்ளிடவும்\n5. கட்டண முறையைத் தேர்வு செய்யவும்:\n   • கேஷ் ஆன் டெலிவரி\n   • ஆன்லைன் பேமெண்ட்\n   • UPI\n6. ஆர்டர் செய்யவும்\n\nஏதேனும் உதவி வேண்டுமா?",

    te: "🛒 ఆర్డర్ ఎలా చేయాలి:\n\n1. ఉత్పత్తులను బ్రౌజ్ చేయండి\n2. కార్ట్‌కు జోడించండి\n3. చెక్అవుట్‌కు వెళ్లండి\n4. డెలివరీ అడ్రస్ నమోదు చేయండి\n5. చెల్లింపు పద్ధతి ఎంచుకోండి:\n   • క్యాష్ ఆన్ డెలివరీ\n   • ఆన్‌లైన్ పేమెంట్\n   • UPI\n6. ఆర్డర్ చేయండి\n\nఏదైనా సహాయం కావాలా?",

    kn: "🛒 ಆರ್ಡರ್ ಹೇಗೆ ಮಾಡುವುದು:\n\n1. ಉತ್ಪನ್ನಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ\n2. ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ\n3. ಚೆಕ್ಔಟ್‌ಗೆ ಹೋಗಿ\n4. ಡೆಲಿವರಿ ವಿಳಾಸ ನಮೂದಿಸಿ\n5. ಪಾವತಿ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ:\n   • ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ\n   • ಆನ್‌ಲೈನ್ ಪಾವತಿ\n   • UPI\n6. ಆರ್ಡರ್ ಮಾಡಿ\n\nಏನಾದರೂ ಸಹಾಯ ಬೇಕೇ?",

    ml: "🛒 ഓർഡർ എങ്ങനെ ചെയ്യാം:\n\n1. ഉൽപ്പന്നങ്ങൾ ബ്രൗസ് ചെയ്യുക\n2. കാർട്ടിലേക്ക് ചേർക്കുക\n3. ചെക്ക്ഔട്ടിലേക്ക് പോകുക\n4. ഡെലിവറി വിലാസം നൽകുക\n5. പേയ്‌മെന്റ് രീതി തിരഞ്ഞെടുക്കുക:\n   • കാഷ് ഓൺ ഡെലിവറി\n   • ഓൺലൈൻ പേയ്‌മെന്റ്\n   • UPI\n6. ഓർഡർ ചെയ്യുക\n\nഎന്തെങ്കിലും സഹായം വേണോ?"
  },

  unknown: {
    en: "I'm not sure I understood that. I can help you with:\n\n• Seasonal crop recommendations\n• Pest and disease solutions\n• Fertilizer advice\n• Product safety guidelines\n• Wholesale inquiries\n• How to order\n\nPlease ask about any of these topics!",

    hi: "मुझे यकीन नहीं है कि मैंने समझा। मैं मदद कर सकता हूं:\n\n• मौसमी फसल सिफारिशें\n• कीट और रोग समाधान\n• उर्वरक सलाह\n• उत्पाद सुरक्षा दिशानिर्देश\n• थोक पूछताछ\n• ऑर्डर कैसे करें\n\nकृपया इनमें से किसी के बारे में पूछें!",

    ta: "நான் புரிந்துகொண்டேனா என்று தெரியவில்லை। நான் உதவ முடியும்:\n\n• பருவகால பயிர் பரிந்துரைகள்\n• பூச்சி மற்றும் நோய் தீர்வுகள்\n• உரம் ஆலோசனை\n• தயாரிப்பு பாதுகாப்பு வழிகாட்டுதல்கள்\n• மொத்த விற்பனை விசாரணைகள்\n• ஆர்டர் செய்வது எப்படி\n\nதயவுசெய்து இவற்றில் ஏதேனும் ஒன்றைப் பற்றி கேளுங்கள்!",

    te: "నేను అర్థం చేసుకున్నానా అనేది నాకు ఖచ్చితంగా తెలియదు। నేను సహాయం చేయగలను:\n\n• కాలానుగుణ పంట సిఫార్సులు\n• తెగులు మరియు వ్యాధి పరిష్కారాలు\n• ఎరువుల సలహా\n• ఉత్పత్తి భద్రతా మార్గదర్శకాలు\n• మొత్తం విచారణలు\n• ఆర్డర్ ఎలా చేయాలి\n\nదయచేసి ఈ అంశాలలో ఏదైనా అడగండి!",

    kn: "ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ ಎಂದು ಖಚಿತವಿಲ್ಲ। ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n\n• ಋತುವಿನ ಬೆಳೆ ಶಿಫಾರಸುಗಳು\n• ಕೀಟ ಮತ್ತು ರೋಗ ಪರಿಹಾರಗಳು\n• ಗೊಬ್ಬರ ಸಲಹೆ\n• ಉತ್ಪನ್ನ ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿಗಳು\n• ಥೋಕು ವಿಚಾರಣೆಗಳು\n• ಆರ್ಡರ್ ಹೇಗೆ ಮಾಡುವುದು\n\nದಯವಿಟ್ಟು ಈ ವಿಷಯಗಳ ಬಗ್ಗೆ ಕೇಳಿ!",

    ml: "ഞാൻ മനസ്സിലാക്കിയെന്ന് ഉറപ്പില്ല। എനിക്ക് സഹായിക്കാൻ കഴിയും:\n\n• സീസണൽ വിള ശുപാർശകൾ\n• കീടങ്ങളും രോഗങ്ങളും പരിഹാരങ്ങൾ\n• വളം ഉപദേശം\n• ഉൽപ്പന്ന സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ\n• മൊത്തവ്യാപാര അന്വേഷണങ്ങൾ\n• എങ്ങനെ ഓർഡർ ചെയ്യാം\n\nദയവായി ഈ വിഷയങ്ങളിൽ ഏതെങ്കിലും ഒന്നിനെക്കുറിച്ച് ചോദിക്കൂ!"
  }
};

/**
 * Detect intent from user query
 * @param {string} query - User's question
 * @param {string} lang - Language code (default: 'en')
 * @returns {string} - Detected intent
 */
export function detectIntent(query, lang = 'en') {
  const lowerQuery = query.toLowerCase();

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const langPatterns = patterns[lang] || patterns.en;

    for (const pattern of langPatterns) {
      if (lowerQuery.includes(pattern.toLowerCase())) {
        return intent;
      }
    }
  }

  return 'unknown';
}

/**
 * Get response for detected intent
 * @param {string} intent - Detected intent
 * @param {string} lang - Language code (default: 'en')
 * @param {Object} context - Additional context (season, crops, etc.)
 * @returns {string} - Response message
 */
export function getResponse(intent, lang = 'en', context = {}) {
  // Map intent to response key
  const responseKey = intent.replace('_query', '').replace('_instructions', '_guide').replace('_help', '');
  const response = RESPONSES[responseKey];

  if (!response) {
    return RESPONSES.unknown[lang] || RESPONSES.unknown.en;
  }

  // Handle dynamic seasonal queries
  if (intent === 'seasonal_query' && typeof response[lang] === 'function') {
    const season = context.season || getCurrentSeason();
    const crops = context.crops || getCropsForSeason(season);
    return response[lang](season, crops);
  }

  // Return static response
  return response[lang] || response.en;
}

/**
 * Process chatbot query - Main entry point
 * @param {string} query - User's question
 * @param {string} lang - Language code
 * @returns {Object} - Response object with message and metadata
 */
export function processChatbotQuery(query, lang = 'en') {
  const intent = detectIntent(query, lang);
  const message = getResponse(intent, lang);

  return {
    intent,
    message,
    language: lang,
    timestamp: new Date().toISOString(),
  };
}

export default {
  SUPPORTED_LANGUAGES,
  INTENT_PATTERNS,
  RESPONSES,
  detectIntent,
  getResponse,
  processChatbotQuery,
};