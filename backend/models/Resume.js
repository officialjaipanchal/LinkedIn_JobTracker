const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
