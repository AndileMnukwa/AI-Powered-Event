const express = require("express");
const router = express.Router();
const OpenAI = require("openai"); // Use OpenAI SDK instead of Anthropic

// Initialize OpenAI Client
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.error("OPENAI_API_KEY environment variable not set!");
  // Handle the error appropriately
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
    'Access-Control-Allow-Origin': '*' // Keep CORS header
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

    // 3. Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
      stream: true,
      max_tokens: 1024,
    });

    // 4. Process the OpenAI stream and send chunks via SSE
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const textChunk = chunk.choices[0].delta.content;
        // Send chunk to client in the expected JSON format
        res.write(`data: ${JSON.stringify({ content: textChunk })}\n\n`);
      }
    }

    // 5. Signal end of stream
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Error in chat endpoint:", error);
    // Ensure headers are set before writing error (if not already sent)
    if (!res.headersSent) {
        res.writeHead(500, { /* ... SSE headers ... */ });
    }
    // Send an error message via SSE
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