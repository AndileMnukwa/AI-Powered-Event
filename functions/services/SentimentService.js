// In functions/services/SentimentService.js
const OpenAI = require('openai');
const functions = require('firebase-functions');

exports.analyzeSentiment = async (text) => {
  try {
    // Initialize OpenAI with API key from Firebase environment
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Call OpenAI API to analyze sentiment
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a sentiment analysis tool. Analyze the following text and respond with only one word: positive, negative, or neutral."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0,
      max_tokens: 10
    });
    
    // Extract sentiment from response
    const sentiment = response.choices[0].message.content.trim().toLowerCase();
    
    // Return standardized result
    if (sentiment.includes("positive")) return "positive";
    if (sentiment.includes("negative")) return "negative";
    return "neutral";
    
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "neutral"; // Default fallback
  }
};

// Additional utility function for simple scoring
exports.getBasicSentimentScore = (text) => {
  // Simple word-based sentiment scoring as backup
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'enjoy'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'dislike'];
  
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score++;
    if (negativeWords.includes(word)) score--;
  });
  
  return score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
};