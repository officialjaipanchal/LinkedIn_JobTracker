const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const Job = require("../models/Job");
const linkedinJobFetcher = require("../services/linkedinJobFetcher");
const { getMatchedJobs } = require("../services/jobMatcher");
const { sendJobAlert } = require("../services/emailService");
const multer = require("multer");
const { parseResume } = require("../services/resumeParser");
const Resume = require("../models/Resume");
const jobMatcher = require("../services/jobMatcher");

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Route to fetch new jobs
router.post("/fetch", async (req, res) => {
  try {
    const {
      keywords = ["software developer", "Data Engineer", "Data Analyst"],
      location = "United States",
      hours = 24,
    } = req.body;

    console.log("[INFO] Starting job fetch with parameters:", {
      keywords,
      location,
      hours,
    });

    // Fetch jobs from LinkedIn
    const jobs = await linkedinJobFetcher.fetchJobs(keywords, location, hours);
    console.log(`[INFO] Fetched ${jobs.length} jobs from LinkedIn`);

    // Get stats for the last 24 hours
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const recentJobs = await Job.find({ datePosted: { $gte: cutoffDate } })
      .sort({ datePosted: -1 })
      .lean();

    const stats = {
      total: recentJobs.length,
      bySource: {},
      byJobType: {},
      remote: 0,
    };

    for (const job of recentJobs) {
      stats.bySource[job.source] = (stats.bySource[job.source] || 0) + 1;
      stats.byJobType[job.jobType] = (stats.byJobType[job.jobType] || 0) + 1;
      if (job.isRemote) stats.remote++;
    }

    res.json({
      success: true,
      message: `Processed ${jobs.length} jobs`,
      totalFetched: jobs.length,
      stats: stats,
    });
  } catch (error) {
    console.error("[ERROR] Error in job fetch route:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error fetching and saving jobs",
    });
  }
});

// Get jobs with date filtering and pagination
router.get("/date-filtered/:timeframe", async (req, res) => {
  try {
    const { timeframe } = req.params;
    const { _start = 0, _limit = 10 } = req.query; // Changed to 10 per page

    let dateFilter = {};
    const now = new Date();

    switch (timeframe.toLowerCase()) {
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = {
          datePosted: {
            $gte: today,
            $lt: tomorrow,
          },
        };
        break;
      case "yesterday":
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        dateFilter = {
          datePosted: {
            $gte: yesterday,
            $lt: yesterdayEnd,
          },
        };
        break;
      case "week":
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        dateFilter = {
          datePosted: { $gte: weekAgo },
        };
        break;
      case "month":
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        dateFilter = {
          datePosted: { $gte: monthAgo },
        };
        break;
      case "older":
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        dateFilter = {
          datePosted: { $lt: thirtyDaysAgo },
        };
        break;
      case "all":
      default:
        dateFilter = {};
    }

    console.log(
      `[DEBUG] Date filter for ${timeframe}:`,
      JSON.stringify(dateFilter, null, 2)
    );

    // Get total count for pagination
    const total = await Job.countDocuments(dateFilter);
    console.log(`[DEBUG] Total jobs found for ${timeframe}: ${total}`);

    // Get paginated results
    const jobs = await Job.find(dateFilter)
      .sort({ datePosted: -1 })
      .skip(Number(_start))
      .limit(Number(_limit))
      .lean();

    console.log(`[DEBUG] Retrieved ${jobs.length} jobs after pagination`);

    // Log a sample of the jobs found
    if (jobs.length > 0) {
      console.log(
        "[DEBUG] Sample job dates:",
        jobs.slice(0, 3).map((job) => ({
          title: job.title,
          datePosted: job.datePosted,
          id: job._id,
        }))
      );
    }

    // Transform for React Admin
    const transformedJobs = jobs.map((job) => ({
      ...job,
      id: job._id.toString(),
      _id: undefined,
    }));

    // Set Content-Range header for React Admin
    res.set(
      "Content-Range",
      `jobs ${_start}-${Number(_start) + jobs.length}/${total}`
    );
    res.set("Access-Control-Expose-Headers", "Content-Range");

    res.json(transformedJobs);
  } catch (error) {
    console.error("[ERROR] Error fetching filtered jobs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error fetching filtered jobs",
    });
  }
});

// Get all jobs with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { range, sort, filter } = req.query;

    // Parse React Admin parameters
    const [start, end] = JSON.parse(range || "[0,999]");
    const [sortField, sortOrder] = JSON.parse(sort || '["datePosted","DESC"]');
    const filters = JSON.parse(filter || "{}");

    // Build query
    const query = {};

    // Search query
    if (filters.q) {
      const searchTerm = filters.q;
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { company: { $regex: searchTerm, $options: "i" } },
        { location: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Time filter
    if (filters.timeFilter) {
      const hours = parseInt(filters.timeFilter);
      if (!isNaN(hours)) {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hours);
        query.datePosted = { $gte: cutoffDate };
      }
    }

    // Other filters
    if (filters.jobType) query.jobType = filters.jobType.toLowerCase();
    if (filters.source) query.source = filters.source.toLowerCase();
    if (filters.company)
      query.company = { $regex: filters.company, $options: "i" };
    if (filters.location)
      query.location = { $regex: filters.location, $options: "i" };
    if (filters.isRemote !== undefined)
      query.isRemote = filters.isRemote === "true";

    // Get total count
    const total = await Job.countDocuments(query);

    // Get paginated results
    const jobs = await Job.find(query)
      .sort({ [sortField]: sortOrder === "ASC" ? 1 : -1 })
      .skip(start)
      .limit(end - start + 1)
      .lean();

    // Transform for React Admin
    const transformedJobs = jobs.map((job) => ({
      ...job,
      id: job._id.toString(),
      _id: undefined,
    }));

    // Set headers for React Admin
    res.set("Content-Range", `jobs ${start}-${end}/${total}`);
    res.set("Access-Control-Expose-Headers", "Content-Range");

    res.json(transformedJobs);
  } catch (error) {
    console.error("[ERROR] Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error fetching jobs",
    });
  }
});

// Get a single job by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID format",
      });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Transform for React Admin
    const transformedJob = {
      ...job.toObject(),
      id: job._id.toString(),
      _id: undefined,
    };

    res.json(transformedJob);
  } catch (error) {
    console.error("[ERROR] Error fetching job:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error fetching job",
    });
  }
});

// Update job status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update job (PUT)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID format",
      });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: new Date() },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Transform for React Admin
    const transformedJob = {
      ...job.toObject(),
      id: job._id.toString(),
      _id: undefined,
    };

    res.json(transformedJob);
  } catch (error) {
    console.error("[ERROR] Error updating job:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error updating job",
    });
  }
});

// Delete job
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
