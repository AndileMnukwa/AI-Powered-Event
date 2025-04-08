const express = require("express");
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk'); // Use Anthropic SDK

// Initialize Anthropic Client (ensure ANTHROPIC_API_KEY is in your .env or Railway variables)
let anthropic;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
} else {
  console.error("ANTHROPIC_API_KEY environment variable not set!");
  // Handle the error appropriately - maybe disable the chatbot endpoint
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

  // Check if Anthropic client is initialized
  if (!anthropic) {
      console.error("Anthropic client not initialized due to missing API key.");
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

    // 2. Format messages for Claude Messages API
    const formattedMessages = messages
      .filter(msg => msg.content && (msg.role === 'user' || msg.role === 'assistant')) // Ensure valid roles and content
      .map(msg => ({
        role: msg.role, // Already 'user' or 'assistant'
        content: msg.content
      }));

    // Ensure the last message is from the user
    if (formattedMessages.length === 0 || formattedMessages[formattedMessages.length - 1].role !== 'user') {
        console.warn("Chat history is empty or doesn't end with a user message.");
        // Optionally send a default response or error via SSE
         res.write(`data: ${JSON.stringify({ content: "Hmm, I need your message to respond." })}\n\n`);
         res.write('data: [DONE]\n\n');
         res.end();
         return;
    }

    // 3. Call Anthropic Messages API with streaming
    const stream = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Haiku is faster and cheaper, good for chat. Or use Sonnet.
      max_tokens: 1024,
      system: systemPrompt,
      messages: formattedMessages,
      stream: true,
    });

    // 4. Process the Anthropic stream and send chunks via SSE
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        const textChunk = event.delta.text;
        if (textChunk) {
          // Send chunk to client in the expected JSON format
          // Make sure to stringify the object containing the content property
          res.write(`data: ${JSON.stringify({ content: textChunk })}\n\n`);
        }
      }
      // Optional: Handle other event types like message_start, message_stop if needed
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