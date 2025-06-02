// services/SentimentService.js
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const OpenAI = require('openai');

// Initialize OpenAI client if key is available
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Basic sentiment analysis without external API
function analyzeSentiment(text) {
  const result = sentiment.analyze(text);
  
  return {
    score: result.score,
    comparative: result.comparative,
    sentiment: result.score > 0 ? "positive" : 
               result.score < 0 ? "negative" : "neutral",
    words: result.words,
    positive: result.positive,
    negative: result.negative
  };
}

// Export the simplified function
module.exports = { analyzeSentiment };