const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

// Middleware
const app = express();
app.use(express.json());

// --- CORS Configuration ---
// Define allowed origins: Your Vercel frontend URL and localhost for development
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000", // Get frontend URL from env var
  'https://ai-powered-event.vercel.app', // Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow specified origins
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  credentials: true // Allow sending cookies and authorization headers
}));
// --- End CORS Configuration ---

app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message === 'The CORS policy for this site does not allow access from the specified Origin.') {
     console.error('CORS Error:', err.message);
     return res.status(403).json({ error: 'Not allowed by CORS' });
  }
  // Handle other server errors
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// Import the database models
const db = require("./models");

// Import routers
const chatRouter = require("./routes/Chatbot");
const insightRouter = require("./routes/AIInsightsRoutes");
const eventRouter = require("./routes/Events");
const userRoutes = require("./routes/userRoutes");
const reviewRouter = require("./routes/Reviews");
const usersRouter = require("./routes/Users");
const responseRouter = require("./routes/Response");
const recommendationsRouter = require('./routes/Recommendations');
const notificationRouter = require("./routes/Notifications");
const adminAnalyticsRouter = require("./routes/AdminAnalytics");
const registrationRouter = require("./routes/Registrations");
const paymentsRouter = require('./routes/Payments');

// Create HTTP server and initialize socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    // Use the same allowed origins logic for Socket.IO
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to routes
app.io = io;

// Setup socket.io with authentication
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on('authenticate', (token) => {
    // <-- Make sure token is the actual token string, not an object
    const actualToken = typeof token === 'object' && token !== null ? token.token : token;
    console.log("Authenticating socket with token:", actualToken ? 'Token received' : 'No token');
    if (!actualToken) {
       console.error('Authentication attempt without token.');
       return; // Don't proceed without a token
    }
    try {
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user-${decoded.id}`);
      console.log(`User ${decoded.id} joined room user-${decoded.id}`); // Added log

      if (decoded.isAdmin) {
        socket.join('admin-channel');
        console.log(`Admin user ${decoded.id} joined admin-channel`);
      }
    } catch (error) {
      console.error('Socket authentication error:', error.message); // Log specific error message
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Sentiment Analysis Route (Keep as is)
app.post("/sentiment", (req, res) => {
  const { review } = req.body;
  if (!review) {
    return res.status(400).json({ error: "Review text is required." });
  }
  const sentimentResult = analyzeSentiment(review);
  res.json({ sentiment: sentimentResult });
});

// Simple sentiment analysis function (Keep as is)
function analyzeSentiment(review) {
  if (review.includes("good") || review.includes("amazing")) {
    return "positive";
  }
  return "negative";
}

// Use routers (Keep as is)
app.use("/events", eventRouter);
app.use("/reviews", reviewRouter);
app.use("/auth", usersRouter);
app.use("/api/chat", chatRouter);
app.use("/respond", responseRouter);
app.use("/api/user", userRoutes);
app.use("/notifications", notificationRouter);
app.use('/uploads', express.static('uploads'));
app.use("/analytics", adminAnalyticsRouter);
app.use("/registrations", registrationRouter);
app.use("/AIInsightsRoutes", insightRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use("/payments", paymentsRouter);
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Ensure the directory for SQLite database exists
const dbDir = path.resolve(__dirname, './');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database Sync and Server Start (Keep as is)
const PORT = process.env.PORT || 3001;

// Move database connection test above server start
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Connection to the database has been established successfully.');
    
    // Start the server immediately after DB connection is verified
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    return db.sequelize.query('SELECT NOW()');
  })
  .then(([results]) => {
    if (results && results[0]) {
      console.log('📅 Current time from DB:', results[0].now);
    }
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
    // Still try to start the server even if DB connection fails
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without DB connection)`);
    });
  });