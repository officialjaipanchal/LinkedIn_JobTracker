module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5050,
  NODE_ENV: process.env.NODE_ENV || "development",

  // MongoDB configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/job-tracker",

  // API configuration
  API_PREFIX: "/api",

  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
};
