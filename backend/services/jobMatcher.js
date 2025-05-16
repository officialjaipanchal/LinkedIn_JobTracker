const Job = require("../models/Job");
const Resume = require("../models/Resume.js");
const logger = require("./logger");

// Skill categories and their weights
const SKILL_WEIGHTS = {
  CRITICAL: 3.0, // Must-have skills
  IMPORTANT: 2.0, // Highly valuable skills
  PREFERRED: 1.5, // Nice-to-have skills
  BASIC: 1.0, // Common/foundational skills
};

// Skill categorization
const skillCategories = {
  // Programming Languages - weighted by popularity and demand
  languages: {
    critical: ["javascript", "python", "java"],
    important: ["typescript", "c#", "go", "rust"],
    preferred: ["kotlin", "swift", "ruby", "php"],
    basic: ["perl", "r", "matlab", "lua"],
  },

  // Frontend Technologies
  frontend: {
    critical: ["react", "html", "css"],
    important: ["angular", "vue", "next.js", "webpack"],
    preferred: ["gatsby", "svelte", "sass", "less"],
    basic: ["jquery", "bootstrap", "material-ui"],
  },

  // Backend Technologies
  backend: {
    critical: ["node.js", "express", "rest api"],
    important: ["django", "spring", "graphql"],
    preferred: ["fastapi", "laravel", "rails"],
    basic: ["websocket", "grpc", "soap"],
  },

  // Database Technologies
  database: {
    critical: ["sql", "mongodb", "postgresql"],
    important: ["mysql", "redis", "elasticsearch"],
    preferred: ["cassandra", "dynamodb", "oracle"],
    basic: ["sqlite", "mariadb", "neo4j"],
  },

  // Cloud & DevOps
  cloud: {
    critical: ["aws", "docker", "kubernetes"],
    important: ["azure", "gcp", "terraform"],
    preferred: ["jenkins", "gitlab ci", "ansible"],
    basic: ["vagrant", "puppet", "chef"],
  },

  // Testing & Quality
  testing: {
    critical: ["jest", "cypress", "selenium"],
    important: ["mocha", "pytest", "junit"],
    preferred: ["karma", "jasmine", "testng"],
    basic: ["chai", "sinon", "enzyme"],
  },
};

// Build a map of skills to their weights
const skillWeightMap = new Map();

Object.values(skillCategories).forEach((category) => {
  Object.entries(category).forEach(([importance, skills]) => {
    const weight = SKILL_WEIGHTS[importance.toUpperCase()];
    skills.forEach((skill) => skillWeightMap.set(skill, weight));
  });
});

// Helper function to normalize text
const normalizeText = (text) => {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
};

/**
 * Extract and categorize skills from text with weights
 * @param {string} text - Text to extract skills from
 * @returns {Object} - Object containing found skills and their weights
 */
const extractWeightedSkills = (text) => {
  const normalizedText = normalizeText(text);
  const foundSkills = new Map();

  skillWeightMap.forEach((weight, skill) => {
    if (normalizedText.includes(skill)) {
      foundSkills.set(skill, weight);
    }
  });

  return {
    skills: Array.from(foundSkills.keys()),
    weights: Object.fromEntries(foundSkills),
  };
};

/**
 * Calculate weighted skill match score
 * @param {Array} jobSkills - Skills required by the job
 * @param {Array} resumeSkills - Skills from the resume
 * @returns {Object} - Match score and details
 */
const calculateWeightedMatch = (jobSkills, resumeSkills) => {
  if (!jobSkills.length) return { score: 0, matches: [], missing: [] };

  let totalWeight = 0;
  let weightedMatches = 0;
  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach((skill) => {
    const weight = skillWeightMap.get(skill) || SKILL_WEIGHTS.BASIC;
    totalWeight += weight;

    if (resumeSkills.includes(skill)) {
      weightedMatches += weight;
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const score =
    totalWeight > 0 ? Math.round((weightedMatches / totalWeight) * 100) : 0;

  return {
    score,
    matches: matchedSkills,
    missing: missingSkills,
    weightedMatches,
    totalWeight,
  };
};

/**
 * Enhanced job matching with weighted skills
 * @param {string} resumeId - Resume ID to match against
 * @returns {Promise<Object>} - Matching results
 */
async function matchJobsWithResume(resumeId) {
  try {
    logger.info("Starting enhanced job matching process", { resumeId });

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    const { skills: resumeSkills } = extractWeightedSkills(resume.data);
    logger.info("Extracted weighted skills from resume", {
      skillCount: resumeSkills.length,
      skills: resumeSkills,
    });

    const jobs = await Job.find({ status: "active" }).lean();
    logger.info(`Found ${jobs.length} active jobs to match`);

    const matches = jobs.map((job) => {
      const { skills: jobSkills } = extractWeightedSkills(job.description);
      const matchResults = calculateWeightedMatch(jobSkills, resumeSkills);

      // Calculate additional match factors
      const titleMatch = calculateTitleMatch(job.title, resume.data);
      const locationScore = calculateLocationScore(job.location, resume.data);

      // Combined score: 50% skills, 30% title, 20% location
      const finalScore = Math.round(
        matchResults.score * 0.5 + titleMatch * 0.3 + locationScore * 0.2
      );

      return {
        jobId: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        matchScore: finalScore,
        skillScore: matchResults.score,
        titleMatch,
        locationScore,
        matchingSkills: matchResults.matches,
        missingSkills: matchResults.missing,
        url: job.url,
        salary: job.salary,
        benefits: job.benefits,
        isRemote: job.isRemote,
        datePosted: job.datePosted,
      };
    });

    // Sort matches by final score
    const sortedMatches = matches.sort((a, b) => b.matchScore - a.matchScore);

    logger.info("Enhanced job matching completed", {
      totalJobs: jobs.length,
      matchesFound: sortedMatches.length,
      topMatch: sortedMatches[0]?.matchScore || 0,
    });

    return {
      resumeId,
      totalJobs: jobs.length,
      matches: sortedMatches,
      stats: {
        averageScore: Math.round(
          matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length
        ),
        skillMatches: matches.filter((m) => m.skillScore >= 70).length,
        highMatches: matches.filter((m) => m.matchScore >= 80).length,
      },
    };
  } catch (error) {
    logger.error("Error in enhanced job matching:", error);
    throw error;
  }
}

/**
 * Calculate title match score
 * @param {string} jobTitle - Job title
 * @param {string} resumeText - Resume content
 * @returns {number} - Match score (0-100)
 */
function calculateTitleMatch(jobTitle, resumeText) {
  const normalizedTitle = normalizeText(jobTitle);
  const normalizedResume = normalizeText(resumeText);

  // Extract key terms from job title
  const titleTerms = normalizedTitle.split(/\s+/);

  // Count matching terms
  const matchingTerms = titleTerms.filter(
    (term) => term.length > 2 && normalizedResume.includes(term)
  );

  return Math.round((matchingTerms.length / titleTerms.length) * 100);
}

/**
 * Calculate location match score
 * @param {string} jobLocation - Job location
 * @param {string} resumeText - Resume content
 * @returns {number} - Match score (0-100)
 */
function calculateLocationScore(jobLocation, resumeText) {
  if (!jobLocation) return 0;

  const normalizedLocation = normalizeText(jobLocation);
  const normalizedResume = normalizeText(resumeText);

  // Handle remote jobs
  if (normalizedLocation.includes("remote")) {
    return normalizedResume.includes("remote") ? 100 : 80;
  }

  // Extract location components
  const locationParts = normalizedLocation.split(/[,\s]+/);

  // Check for location matches in resume
  const matchingParts = locationParts.filter(
    (part) => part.length > 2 && normalizedResume.includes(part)
  );

  return Math.round((matchingParts.length / locationParts.length) * 100);
}

module.exports = {
  matchJobsWithResume,
  extractWeightedSkills,
  calculateWeightedMatch,
  SKILL_WEIGHTS,
  skillCategories,
};
