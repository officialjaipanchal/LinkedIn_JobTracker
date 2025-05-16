const linkedinJobFetcher = require("./linkedinJobFetcher");
const Job = require("../models/Job");
const logger = require("./logger");

/**
 * Sleep function to add delay between operations
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enhanced job fetcher with detail scraping capability
 * @param {number} hours - Number of hours to look back for jobs
 * @param {Array<string>} keywords - Optional keywords to filter jobs
 * @param {string} location - Optional location to filter jobs
 * @returns {Promise<Object>} Results of job fetching
 */
async function fetchJobs(
  hours = 24,
  keywords = [
    "javascript",
    "react",
    "node.js",
    "software",
    "developer",
    "test",
    "qa",
    "automation",
    "quality assurance",
  ],
  location = "United States"
) {
  try {
    logger.info("🚀 Starting job fetch process...", {
      hours,
      keywords,
      location,
    });

    // Track sources and results
    const sources = ["linkedin", "aws", "google"];
    const results = {
      jobs: [],
      stats: {
        total: 0,
        bySource: {},
        byJobType: {},
        remote: 0,
        newJobs: {},
        saved: {},
      },
      newJobs: {},
      saved: {},
    };

    // Initialize counters for each source
    for (const source of sources) {
      results.newJobs[source] = 0;
      results.saved[source] = 0;
    }

    // Step 1: Fetch from LinkedIn (use robust class-based fetcher)
    try {
      logger.info("🌐 Fetching jobs from LinkedIn...");
      const linkedinJobs =
        (await linkedinJobFetcher.fetchJobs(keywords, location, hours)) || [];
      logger.info(`✅ Fetched ${linkedinJobs.length} jobs from LinkedIn`);

      results.newJobs.linkedin = linkedinJobs.length;
      results.saved.linkedin = linkedinJobs.length; // LinkedIn handles saving internally
    } catch (error) {
      logger.error("❌ Error fetching from LinkedIn:", error);
      logger.error(error.stack);
    }

    // Step 4: Query recent jobs from DB
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const jobs = await Job.find({ datePosted: { $gte: cutoffDate } })
      .sort({ datePosted: -1 })
      .lean();

    logger.info(`📦 Found ${jobs.length} jobs in DB from last ${hours} hours`);

    // Step 5: Generate stats
    results.jobs = jobs;
    results.stats.total = jobs.length;

    for (const job of jobs) {
      // Count by source
      const source = job.source || "unknown";
      results.stats.bySource[source] =
        (results.stats.bySource[source] || 0) + 1;

      // Count by job type
      const jobType = job.jobType || "unknown";
      results.stats.byJobType[jobType] =
        (results.stats.byJobType[jobType] || 0) + 1;

      // Count remote jobs
      if (job.isRemote) {
        results.stats.remote++;
      }
    }

    // logger.info("📊 Job fetch stats:", results.stats);
    logger.info("📊 Job Fetch Summary");
    logger.info("────────────────────────────");
    logger.info(`🕒 Time Range       : Last ${hours} hours`);
    logger.info(`🔍 Keywords         : ${keywords.join(", ")}`);
    logger.info(`🌎 Location         : ${location}`);
    logger.info(`📦 Total Jobs Found : ${results.stats.total}`);
    logger.info(`🌐 Sources:`);

    for (const [source, count] of Object.entries(results.stats.bySource)) {
      logger.info(`   - ${source.padEnd(12)}: ${count}`);
    }

    logger.info(`🧩 Job Types:`);

    for (const [type, count] of Object.entries(results.stats.byJobType)) {
      logger.info(`   - ${type.padEnd(20)}: ${count}`);
    }

    logger.info(`🌍 Remote Jobs      : ${results.stats.remote}`);
    logger.info("📥 Saved Jobs:");
    for (const [source, count] of Object.entries(results.saved)) {
      logger.info(`   - ${source.padEnd(12)}: ${count}`);
    }
    logger.info("────────────────────────────");
    return results;
  } catch (err) {
    logger.error("❌ Job fetcher error:", err);
    logger.error(err.stack);
    throw new Error(`Job fetch failed: ${err.message}`);
  }
}

module.exports = fetchJobs;
