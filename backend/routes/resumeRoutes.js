const express = require("express");
const router = express.Router();
const multer = require("multer");
const Resume = require("../models/Resume");
const { parseResume } = require("../services/resumeParser");
const logger = require("../services/logger");

// Configure multer for file upload
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Get all saved resumes
router.get("/saved-resumes", async (req, res) => {
  try {
    logger.info("Fetching saved resumes");
    const resumes = await Resume.find().sort({ createdAt: -1 });
    logger.info(`Found ${resumes.length} resumes`);

    const transformedResumes = resumes.map((resume) => ({
      id: resume._id.toString(),
      name: resume.name,
      createdAt: resume.createdAt,
    }));

    // Set Content-Range header for React Admin
    res.set({
      "Content-Range": `resumes 0-${resumes.length}/${resumes.length}`,
      "Access-Control-Expose-Headers": "Content-Range",
    });

    logger.info(`Sending ${transformedResumes.length} resumes to client`);
    res.json(transformedResumes);
  } catch (error) {
    logger.error("Error fetching resumes:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || "Error fetching resumes",
    });
  }
});

// Get a single resume by ID
router.get("/resume/:id", async (req, res) => {
  try {
    logger.info(`Fetching resume with ID: ${req.params.id}`);
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      logger.warn(`Resume not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }
    logger.info("Resume found successfully");
    res.json({
      success: true,
      data: resume.data,
    });
  } catch (error) {
    logger.error("Error fetching resume:", {
      error: error.message,
      stack: error.stack,
      resumeId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: error.message || "Error fetching resume",
    });
  }
});

// Upload and parse resume
router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    logger.info("Processing resume upload");
    if (!req.file) {
      logger.warn("No file uploaded");
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    logger.info("Parsing resume");
    const parsedData = await parseResume(req.file.buffer);
    logger.info("Resume parsed successfully");
    res.json({
      success: true,
      parsedData,
    });
  } catch (error) {
    logger.error("Error uploading resume:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || "Error uploading resume",
    });
  }
});

// Save resume analysis
router.post("/save-resume", async (req, res) => {
  try {
    logger.info("Saving resume analysis");
    const { name, data } = req.body;
    if (!name || !data) {
      logger.warn("Missing required fields", { name: !!name, data: !!data });
      return res.status(400).json({
        success: false,
        error: "Name and data are required",
      });
    }

    const resume = new Resume({
      name,
      data,
    });
    await resume.save();
    logger.info("Resume saved successfully", { id: resume._id });

    res.json({
      success: true,
      message: "Resume saved successfully",
      id: resume._id,
    });
  } catch (error) {
    logger.error("Error saving resume:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || "Error saving resume",
    });
  }
});

// Delete resume
router.delete("/resume/:id", async (req, res) => {
  try {
    logger.info(`Deleting resume with ID: ${req.params.id}`);
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      logger.warn(`Resume not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }
    logger.info("Resume deleted successfully");
    res.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting resume:", {
      error: error.message,
      stack: error.stack,
      resumeId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: error.message || "Error deleting resume",
    });
  }
});

// Update resume name
router.patch("/resume/:id", async (req, res) => {
  try {
    logger.info(`Updating resume name for ID: ${req.params.id}`);
    const { name } = req.body;
    if (!name) {
      logger.warn("Name is required for update");
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    if (!resume) {
      logger.warn(`Resume not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }

    logger.info("Resume name updated successfully");
    res.json({
      success: true,
      message: "Resume name updated successfully",
    });
  } catch (error) {
    logger.error("Error updating resume name:", {
      error: error.message,
      stack: error.stack,
      resumeId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: error.message || "Error updating resume name",
    });
  }
});

module.exports = router;
