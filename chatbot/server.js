const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Replace with your actual API keys
const TRANSLATE_API_KEY = 'your_google_translate_api_key';
const OPENAI_API_KEY = 'your_openai_api_key';

// Translation function using Google Translate API
async function translateText(text, targetLanguage) {
    if (targetLanguage === 'en') return text; // No translation needed for English
    
    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`,
            {
                q: text,
                target: targetLanguage
            }
        );
        return response.data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Return original text if translation fails
    }
}

// Agricultural knowledge base
const agriculturalKB = {
    "pest control": {
        response: "For pest control, consider neem oil spray or introducing beneficial insects. For specific pests, please describe the symptoms.",
        keywords: ["pest", "insect", "bug", "damage"]
    },
    "fertilizer": {
        response: "Organic fertilizers like compost or manure are recommended. Chemical fertilizers should be used based on soil test results.",
        keywords: ["fertilizer", "nutrient", "soil health"]
    },
    // Add more categories as needed
};

// Find the most relevant response
function findBestResponse(query) {
    const lowerQuery = query.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const [category, data] of Object.entries(agriculturalKB)) {
        let score = 0;
        for (const keyword of data.keywords) {
            if (lowerQuery.includes(keyword)) {
                score += 1;
            }
        }
        if (score > highestScore) {
            highestScore = score;
            bestMatch = data.response;
        }
    }

    return bestMatch || "I'm an AgriAI assistant. I can help with crop management, pest control, weather impacts, and more. Please ask your question in more detail.";
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message, language } = req.body;
    
    try {
        // Step 1: Translate input to English if needed
        const englishQuery = language === 'en' ? message : await translateText(message, 'en');
        
        // Step 2: Get response (from knowledge base or AI)
        let response;
        
        // First try knowledge base
        const kbResponse = findBestResponse(englishQuery);
        
        if (kbResponse.includes("Please ask")) {
            // If knowledge base doesn't have good answer, use AI
            const aiResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are an agricultural expert assistant. Provide concise, accurate advice to farmers about crops, weather impact, pest control, and farming techniques. Use simple language suitable for farmers."
                        },
                        {
                            role: "user",
                            content: englishQuery
                        }
                    ],
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            response = aiResponse.data.choices[0].message.content;
        } else {
            response = kbResponse;
        }
        
        // Step 3: Translate response back to user's language if needed
        const translatedResponse = language === 'en' ? response : await translateText(response, language);
        
        res.json({ response: translatedResponse });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: "Sorry, I encountered an error. Please try again." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});