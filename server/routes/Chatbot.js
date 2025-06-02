const express = require("express");
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai"); // OpenAI v3 format

// Initialize OpenAI Client with v3 SDK
let openai;
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} else {
  console.error("OPENAI_API_KEY environment variable not set!");
}

// System prompt to guide the AI's persona and task
const systemPrompt = "You are a helpful assistant for the VibeCatcher Event application. Answer user questions concisely about navigating the app, finding events, leaving reviews, and understanding features. Keep responses relatively short and friendly.";

// Shared function to handle chat logic (for both GET and POST)
const handleChatRequest = async (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Check if OpenAI client is initialized
  if (!openai) {
    console.error("OpenAI client not initialized due to missing API key.");
    res.write(`data: ${JSON.stringify({ content: "Sorry, the chatbot is currently unavailable due to a configuration issue." })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    // 1. Get message history from request
    let messages;
    if (req.method === 'GET' && req.query.messages) {
      try {
        messages = JSON.parse(req.query.messages);
      } catch (e) {
        throw new Error("Invalid messages format in query string");
      }
    } else if (req.method === 'POST' && req.body.messages) {
      messages = req.body.messages;
    } else {
      throw new Error("No messages provided");
    }

    if (!Array.isArray(messages)) {
      throw new Error("Messages should be an array");
    }

    // 2. Format messages for OpenAI API
    const formattedMessages = messages
      .filter(msg => msg.content && (msg.role === 'user' || msg.role === 'assistant'))
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    // Add system message at the beginning
    formattedMessages.unshift({
      role: "system",
      content: systemPrompt
    });

    // Ensure the last message is from the user
    if (formattedMessages.length === 1 || formattedMessages[formattedMessages.length - 1].role !== 'user') {
      console.warn("Chat history is empty or doesn't end with a user message.");
      res.write(`data: ${JSON.stringify({ content: "Hmm, I need your message to respond." })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // 3. Call OpenAI API (v3 doesn't support streaming the same way)
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
      max_tokens: 1024,
    });

    // 4. Send the complete response since we can't stream with v3 easily
    const responseText = completion.data.choices[0].message.content;
    res.write(`data: ${JSON.stringify({ content: responseText })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Error in chat endpoint:", error);
    if (!res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
    }
    res.write(`data: ${JSON.stringify({ content: "Sorry, I encountered an error. Please try again." })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// Handle GET requests
router.get("/", handleChatRequest);

// Handle POST requests
router.post("/", handleChatRequest);

module.exports = router;