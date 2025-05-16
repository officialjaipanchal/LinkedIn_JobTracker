const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    datePosted: {
      type: Date,
      default: Date.now,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "applied", "rejected", "interview", "not_applied"],
      default: "new",
    },
    jobType: {
      type: String,
      default: "full-time",
    },
    salary: {
      type: String,
    },
    benefits: [String],
    isRemote: {
      type: Boolean,
      default: false,
    },
    experienceLevel: {
      type: String,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    saved: {
      type: Boolean,
      default: false,
    },
    savedAt: {
      type: Date,
    },
    keywords: [String],
    matchScore: {
      type: Number,
      default: 0,
    },
    matchedKeywords: [String],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Drop existing indexes
jobSchema.index({ jobId: 1 }, { unique: false });
jobSchema.index({ title: 1, company: 1, location: 1 }, { unique: false });

// Add compound index for better querying
jobSchema.index({ source: 1, jobId: 1 });
jobSchema.index({ datePosted: -1 }); // Add index for date sorting

module.exports = mongoose.model("Job", jobSchema);
