const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

// Use middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Enable CORS for all routes

// Import the database models (assuming you have a 'models' folder with Sequelize)
const db = require("./models");

// Import the chatbot router
// const chatbotRouter = require('./routes/Chatbot');
// app.use("/chatbot", chatbotRouter); // Use chatbotRouter for routes starting with /chatbot

// Import your event router
const eventRouter = require('./routes/Events');
app.use("/events", eventRouter); // Use eventRouter for routes starting with /events

// Import your reviews router
const reviewRouter = require('./routes/Reviews');
app.use("/reviews", reviewRouter); // Use reviewRouter for routes starting with /reviews

// Import your users router
const usersRouter = require('./routes/Users');
app.use("/auth", usersRouter); // Use usersRouter for routes starting with /auth

// Sync database and start the server
db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
});
