// Import dependencies
const express = require("express");
const cors = require("cors");
const app = express();

// Use middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Enable CORS for all routes

// Import the database models (assuming you have a 'models' folder with Sequelize)
const db = require("./models");

// Import your event router
const eventRouter = require('./routes/Events');
app.use("/events", eventRouter); // Use eventRouter for routes starting with /events

// Sync database and start the server
db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
  
});
