const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const jobRoutes = require("./routes/jobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const emailService = require("./services/emailService");
const jobFetcher = require("./services/jobFetcher");
const linkedinJobFetcher = require("./services/linkedinJobFetcher");
const logger = require("./services/logger");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Range",
      "Content-Range",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "Content-Range",
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    maxAge: 86400, // 24 hours
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection with improved options
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    logger.info("✅ MongoDB connected successfully");
  } catch (err) {
    logger.error("❌ MongoDB connection error:", err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected - attempting to reconnect...");
  connectDB();
});

app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", resumeRoutes);

// Add a test route to verify the server is working
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Schedule job fetching every 6 hours
cron.schedule("0 */6 * * *", async () => {
  logger.info("Running scheduled job fetch...");
  try {
    await linkedinJobFetcher.fetchJobs();
    logger.info("✅ Jobs fetched successfully");
  } catch (error) {
    logger.error("❌ Error fetching jobs:", error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Not Found",
      status: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// Start the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
